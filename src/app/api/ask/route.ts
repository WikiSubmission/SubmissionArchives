import 'server-only';

import {
    checkRateLimit,
    getClientIp,
    rateLimitResponse,
} from '@/lib/security';
import {
    embedQueries,
    emptyQueryExpansion,
    expandArchiveQuery,
    extractDeltaText,
    rerankArchiveChunks,
    streamChatCompletion,
} from '@/lib/rag/mistral';
import {
    assessRetrieval,
    finalizeChunks,
    retrieveChunks,
} from '@/lib/rag/retrieval';
import { buildSourceCards } from '@/lib/rag/sourceCards';
import {
    ASK_SYSTEM_PROMPT,
    buildCorrectionPrompt,
    buildUserPrompt,
} from '@/lib/rag/prompt';
import {
    extractCitedIds,
    validateCitations,
} from '@/lib/rag/citations';
import {
    buildRetrievalTrace,
    recordRetrievalTrace,
} from '@/lib/rag/trace';
import type {
    AskProgressStage,
    AskStreamEvent,
} from '@/lib/rag/streamTypes';
import type {
    QueryExpansion,
    RetrievalIntent,
    RetrievalQuery,
    RetrievalQueryKind,
} from '@/lib/rag/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_QUESTION_LENGTH = 300;
const MAX_REQUEST_BYTES = 2_048;
const RATE_LIMIT_PER_MINUTE = readPositiveNumber(
    process.env.RAG_RATE_LIMIT_PER_MINUTE,
    10,
);
const TOP_K_RETRIEVAL = readPositiveInteger(
    process.env.RAG_TOP_K_RETRIEVAL,
    40,
);
const RERANK_CANDIDATES = readPositiveInteger(
    process.env.RAG_RERANK_CANDIDATES,
    24,
);
const TOP_N_CONTEXT = readPositiveInteger(
    process.env.RAG_TOP_N_CONTEXT,
    10,
);
const MAX_QUERY_VARIANTS = readPositiveInteger(
    process.env.RAG_MAX_QUERY_VARIANTS,
    8,
);
const QUERY_EXPANSION_ENABLED = readBoolean(
    process.env.RAG_QUERY_EXPANSION_ENABLED,
    true,
);
const RERANK_ENABLED = readBoolean(
    process.env.RAG_RERANK_ENABLED,
    true,
);
const ENRICHMENT_ENABLED = readBoolean(
    process.env.RAG_ENRICHMENT_ENABLED,
    true,
);
const ENRICHMENT_TOP_K = readPositiveInteger(
    process.env.RAG_ENRICHMENT_TOP_K,
    30,
);
const ENRICHMENT_MAX_SECTIONS = readPositiveInteger(
    process.env.RAG_ENRICHMENT_MAX_SECTIONS,
    24,
);
const HEARTBEAT_INTERVAL_MS = 15_000;
const REVEAL_CHUNK_SIZE = 140;
const REVEAL_DELAY_MS = 14;

const textEncoder = new TextEncoder();

function readPositiveNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readPositiveInteger(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    return fallback;
}

function jsonError(message: string, status: number): Response {
    return Response.json(
        { error: message },
        {
            status,
            headers: {
                'Cache-Control': 'no-store',
            },
        },
    );
}

function sseEncode(event: AskStreamEvent): Uint8Array {
    return textEncoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function heartbeatEncode(): Uint8Array {
    return textEncoder.encode(': keep-alive\n\n');
}

function throwIfAborted(signal: AbortSignal): void {
    if (signal.aborted) {
        throw new DOMException('The request was aborted.', 'AbortError');
    }
}

function isAbortError(error: unknown): boolean {
    return (
        error instanceof DOMException && error.name === 'AbortError'
    );
}

async function readQuestion(request: Request): Promise<
    | { ok: true; question: string }
    | { ok: false; response: Response }
> {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
        return {
            ok: false,
            response: jsonError('Request body is too large.', 413),
        };
    }

    let rawBody: string;
    try {
        rawBody = await request.text();
    } catch {
        return {
            ok: false,
            response: jsonError('Could not read the request body.', 400),
        };
    }

    if (Buffer.byteLength(rawBody, 'utf8') > MAX_REQUEST_BYTES) {
        return {
            ok: false,
            response: jsonError('Request body is too large.', 413),
        };
    }

    let body: { question?: unknown };
    try {
        body = JSON.parse(rawBody) as { question?: unknown };
    } catch {
        return {
            ok: false,
            response: jsonError('Invalid request body.', 400),
        };
    }

    const question =
        typeof body.question === 'string'
            ? body.question.replace(/\0/g, '').replace(/\s+/g, ' ').trim()
            : '';

    if (!question || question.length > MAX_QUESTION_LENGTH) {
        return {
            ok: false,
            response: jsonError('Question must be 1–300 characters.', 400),
        };
    }

    return {
        ok: true,
        question,
    };
}

function chunkValidatedAnswer(text: string, targetSize: number): string[] {
    const tokens =
        text.match(
            /\[\s*S\d+(?:\s*,\s*S\d+)*\s*\]|\s+|[^\s[]+|\[/g,
        ) ?? [text];

    const chunks: string[] = [];
    let current = '';

    for (const token of tokens) {
        current += token;

        const canBreak =
            current.length >= targetSize &&
            (/\s$/.test(token) || /^\[\s*S\d+/.test(token));

        if (canBreak) {
            chunks.push(current);
            current = '';
        }
    }

    if (current) chunks.push(current);
    return chunks;
}

function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException('The request was aborted.', 'AbortError'));
            return;
        }

        const timer = setTimeout(() => {
            signal.removeEventListener('abort', handleAbort);
            resolve();
        }, milliseconds);

        function handleAbort() {
            clearTimeout(timer);
            reject(new DOMException('The request was aborted.', 'AbortError'));
        }

        signal.addEventListener('abort', handleAbort, { once: true });
    });
}

interface QuerySeed {
    text: string;
    kind: RetrievalQueryKind;
    weight: number;
}

function addQuerySeed(
    seeds: QuerySeed[],
    seen: Set<string>,
    text: string,
    kind: RetrievalQueryKind,
    weight: number,
): void {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const key = cleaned.toLocaleLowerCase();
    if (!cleaned || seen.has(key) || seeds.length >= MAX_QUERY_VARIANTS) return;

    seen.add(key);
    seeds.push({ text: cleaned, kind, weight });
}

function requestedEditionYears(question: string, expansion: QueryExpansion): number[] {
    const years = new Set<number>(expansion.requestedEditionYears);
    for (const match of question.matchAll(/\b(19\d{2}|20\d{2})\b/g)) {
        years.add(Number(match[1]));
    }
    return [...years].filter((year) => Number.isInteger(year));
}

function inferRetrievalIntent(question: string, expansion: QueryExpansion): RetrievalIntent {
    const normalized = question.toLocaleLowerCase();
    const years = requestedEditionYears(question, expansion);

    if (
        expansion.intent === 'translation_evolution'
        || /compare|difference|changed|change over time|evolution|earlier translation|previous translation/.test(normalized)
        || years.length >= 2
    ) {
        return 'translation_evolution';
    }

    if (
        expansion.intent === 'final_wording'
        || /final wording|final translation|1992 wording|what does the final|authorized english version/.test(normalized)
    ) {
        return 'final_wording';
    }

    if (
        expansion.intent === 'ritual_procedure'
        || /how (?:do|did|should).*(?:pray|salat|ablution|wudu|fast|hajj)|contact prayer procedure|prayer units/.test(normalized)
    ) {
        return 'ritual_procedure';
    }

    if (
        expansion.intent === 'historical_development'
        || /earliest|origin|developed|development|when did|history of|first taught/.test(normalized)
    ) {
        return 'historical_development';
    }

    return expansion.intent || 'general';
}

function buildQuerySeeds(question: string, expansion: QueryExpansion): QuerySeed[] {
    const seeds: QuerySeed[] = [];
    const seen = new Set<string>();

    addQuerySeed(seeds, seen, question, 'original', 1.25);

    for (const term of expansion.exactTerms) {
        addQuerySeed(seeds, seen, term, 'expanded', 1.2);
    }
    for (const paraphrase of expansion.paraphrases) {
        addQuerySeed(seeds, seen, paraphrase, 'expanded', 1.05);
    }
    for (const concept of expansion.conceptDescriptions) {
        addQuerySeed(seeds, seen, concept, 'expanded', 1.1);
    }
    for (const phrase of expansion.archivePhrases) {
        addQuerySeed(seeds, seen, phrase, 'expanded', 1);
    }
    if (expansion.hypotheticalPassage) {
        addQuerySeed(
            seeds,
            seen,
            expansion.hypotheticalPassage,
            'hyde',
            1.1,
        );
    }

    return seeds;
}

async function generateValidatedAnswer(
    userPrompt: string,
    supplied: ReadonlySet<string>,
    signal: AbortSignal,
    sendStatus: (stage: AskProgressStage, message: string) => void,
): Promise<{ text: string; citedSourceIds: string[] } | null> {
    let prompt = userPrompt;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        throwIfAborted(signal);

        sendStatus(
            'synthesizing',
            attempt === 0
                ? 'Preparing a response from the strongest evidence…'
                : 'Repairing citation references before presentation…',
        );

        const events = await streamChatCompletion(
            ASK_SYSTEM_PROMPT,
            prompt,
        );

        let text = '';
        for await (const event of events) {
            throwIfAborted(signal);
            text += extractDeltaText(
                event.data?.choices?.[0]?.delta?.content,
            );
        }

        text = text.trim();
        sendStatus('validating', 'Checking every cited source…');

        const citedSourceIds = extractCitedIds(text);
        const { valid, invalidIds } = validateCitations(
            citedSourceIds,
            supplied,
        );

        if (text && citedSourceIds.length > 0 && valid) {
            return {
                text,
                citedSourceIds,
            };
        }

        if (attempt === 0) {
            prompt = buildCorrectionPrompt(
                userPrompt,
                text,
                invalidIds,
                [...supplied],
            );
        }
    }

    return null;
}

export async function POST(request: Request): Promise<Response> {
    const rateLimit = checkRateLimit(
        `rag:${getClientIp(request.headers)}`,
        RATE_LIMIT_PER_MINUTE,
    );

    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    const parsedQuestion = await readQuestion(request);
    if (!parsedQuestion.ok) return parsedQuestion.response;

    const { question } = parsedQuestion;
    const requestSignal = request.signal;

    let cancelled = false;

    const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
            let closed = false;

            const safeEnqueue = (payload: Uint8Array): boolean => {
                if (
                    cancelled ||
                    requestSignal.aborted ||
                    closed
                ) {
                    return false;
                }

                try {
                    controller.enqueue(payload);
                    return true;
                } catch {
                    cancelled = true;
                    return false;
                }
            };

            const send = (event: AskStreamEvent) => {
                safeEnqueue(sseEncode(event));
            };

            const sendStatus = (
                stage: AskProgressStage,
                message: string,
            ) => {
                send({
                    type: 'status',
                    stage,
                    message,
                });
            };

            const close = () => {
                if (closed) return;
                closed = true;

                try {
                    controller.close();
                } catch {
                    // The consumer may already have disconnected.
                }
            };

            const heartbeat = setInterval(() => {
                safeEnqueue(heartbeatEncode());
            }, HEARTBEAT_INTERVAL_MS);

            try {
                throwIfAborted(requestSignal);

                const startedAtMs = Date.now();
                const degraded: string[] = [];

                sendStatus(
                    'embedding',
                    QUERY_EXPANSION_ENABLED
                        ? 'Mapping the wording and underlying concept…'
                        : 'Mapping your question to the archive…',
                );

                let expansion = emptyQueryExpansion();
                if (QUERY_EXPANSION_ENABLED) {
                    try {
                        expansion = await expandArchiveQuery(question);
                    } catch (error: unknown) {
                        // The original query remains fully usable if expansion fails.
                        degraded.push('query_expansion');
                        console.error('[rag] query expansion failed', error);
                    }
                }

                const intent = inferRetrievalIntent(question, expansion);
                const editionYears = requestedEditionYears(question, expansion);
                const seeds = buildQuerySeeds(question, expansion);
                const embeddings = await embedQueries(
                    seeds.map((seed) => seed.text),
                );
                const retrievalQueries: RetrievalQuery[] = seeds.map(
                    (seed, index) => ({
                        ...seed,
                        embedding: embeddings[index],
                    }),
                );

                throwIfAborted(requestSignal);
                sendStatus(
                    'retrieving',
                    retrievalQueries.length > 1
                        ? 'Searching canonical passages, topic indexes, paraphrases, and conceptual matches…'
                        : 'Searching indexed passages and transcripts…',
                );

                const candidates = await retrieveChunks(
                    retrievalQueries,
                    {
                        topK: TOP_K_RETRIEVAL,
                        topN: Math.max(RERANK_CANDIDATES, TOP_N_CONTEXT),
                        intent,
                        requestedEditionYears: editionYears,
                        enrichmentEnabled: ENRICHMENT_ENABLED,
                        enrichmentTopK: ENRICHMENT_TOP_K,
                        enrichmentMaxSections: ENRICHMENT_MAX_SECTIONS,
                    },
                );

                throwIfAborted(requestSignal);
                sendStatus(
                    'ranking',
                    'Comparing the strongest passages in their surrounding context…',
                );

                let rankedCandidates = candidates;
                if (RERANK_ENABLED && candidates.length > 1) {
                    try {
                        rankedCandidates = await rerankArchiveChunks(
                            question,
                            candidates,
                            intent,
                        );
                    } catch (error: unknown) {
                        // Deterministic hybrid ranking remains available.
                        degraded.push('rerank');
                        console.error('[rag] rerank failed', error);
                    }
                }

                const chunks = finalizeChunks(
                    rankedCandidates,
                    TOP_N_CONTEXT,
                    { intent },
                );
                const sources = buildSourceCards(chunks);
                send({
                    type: 'sources',
                    sources,
                    ...(degraded.length > 0 ? { degraded } : {}),
                });

                const retrievalStrength = assessRetrieval(chunks);
                recordRetrievalTrace(buildRetrievalTrace({
                    question,
                    intent,
                    requestedEditionYears: editionYears,
                    querySeeds: seeds.map((seed) => ({
                        text: seed.text,
                        kind: seed.kind,
                    })),
                    degraded,
                    retrievalStrength,
                    candidates: rankedCandidates,
                    finalChunks: chunks,
                    startedAtMs,
                }));
                if (retrievalStrength === 'none' || retrievalStrength === 'weak') {
                    send({
                        type: 'notice',
                        kind:
                            retrievalStrength === 'none'
                                ? 'out_of_scope'
                                : 'weak_retrieval',
                        message:
                            retrievalStrength === 'none'
                                ? 'I did not retrieve a relevant passage from the preserved Submission Archives corpus for this question.'
                                : 'I found possible related material, but the evidence was not strong enough to identify a reliable answer. This does not establish that the subject is absent from the archive.',
                    });
                    send({ type: 'done' });
                    return;
                }

                const supplied = new Set(
                    sources.map((source) => source.sourceId),
                );
                const userPrompt = buildUserPrompt(
                    question,
                    chunks,
                    sources,
                    retrievalStrength,
                    intent,
                );

                let validatedAnswer:
                    | {
                        text: string;
                        citedSourceIds: string[];
                    }
                    | null;

                try {
                    validatedAnswer = await generateValidatedAnswer(
                        userPrompt,
                        supplied,
                        requestSignal,
                        sendStatus,
                    );
                } catch (error: unknown) {
                    if (isAbortError(error)) throw error;

                    send({
                        type: 'notice',
                        kind: 'model_unavailable',
                        message:
                            'Answer generation is temporarily unavailable. The most relevant sources are shown below.',
                    });
                    send({ type: 'done' });
                    return;
                }

                if (!validatedAnswer) {
                    send({
                        type: 'notice',
                        kind: 'no_answer',
                        message:
                            'Sources are shown below; a synthesized answer could not be verified this time.',
                    });
                    send({ type: 'done' });
                    return;
                }

                sendStatus(
                    'revealing',
                    'Presenting the verified answer…',
                );

                for (const answerChunk of chunkValidatedAnswer(
                    validatedAnswer.text,
                    REVEAL_CHUNK_SIZE,
                )) {
                    throwIfAborted(requestSignal);
                    send({
                        type: 'answer_delta',
                        text: answerChunk,
                    });
                    await delay(REVEAL_DELAY_MS, requestSignal);
                }

                send({
                    type: 'answer_done',
                    citedSourceIds:
                        validatedAnswer.citedSourceIds,
                });
                send({ type: 'done' });
            } catch (error: unknown) {
                console.error('[Ask API Error]', error);
                if (!isAbortError(error) && !requestSignal.aborted) {
                    send({
                        type: 'notice',
                        kind: 'model_unavailable',
                        message:
                            'The archive search is temporarily unavailable. Please try again shortly.',
                    });
                    send({ type: 'done' });
                }
            } finally {
                clearInterval(heartbeat);
                close();
            }
        },

        cancel() {
            cancelled = true;
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, no-transform',
            Connection: 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
