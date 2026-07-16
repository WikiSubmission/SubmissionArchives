import 'server-only';

import {
    checkRateLimit,
    getClientIp,
    rateLimitResponse,
} from '@/lib/security';
import {
    embedQuery,
    extractDeltaText,
    streamChatCompletion,
} from '@/lib/rag/mistral';
import { retrieveChunks } from '@/lib/rag/retrieval';
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
import type {
    AskProgressStage,
    AskStreamEvent,
} from '@/lib/rag/streamTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_QUESTION_LENGTH = 300;
const MAX_REQUEST_BYTES = 2_048;
const RATE_LIMIT_PER_MINUTE = readPositiveNumber(
    process.env.RAG_RATE_LIMIT_PER_MINUTE,
    10,
);
const MIN_RETRIEVAL_SCORE = readPositiveNumber(
    process.env.RAG_MIN_RETRIEVAL_SCORE,
    0.015,
);
const TOP_K_RETRIEVAL = readPositiveInteger(
    process.env.RAG_TOP_K_RETRIEVAL,
    40,
);
const TOP_N_CONTEXT = readPositiveInteger(
    process.env.RAG_TOP_N_CONTEXT,
    8,
);
const MIN_CHUNKS_REQUIRED = readPositiveInteger(
    process.env.RAG_MIN_CHUNKS_REQUIRED,
    3,
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

                sendStatus(
                    'embedding',
                    'Mapping your question to the archive…',
                );
                const embedding = await embedQuery(question);

                throwIfAborted(requestSignal);
                sendStatus(
                    'retrieving',
                    'Searching indexed passages and transcripts…',
                );

                const chunks = await retrieveChunks(
                    question,
                    embedding,
                    {
                        topK: TOP_K_RETRIEVAL,
                        topN: TOP_N_CONTEXT,
                    },
                );

                throwIfAborted(requestSignal);
                sendStatus(
                    'ranking',
                    'Comparing the strongest pieces of evidence…',
                );

                const sources = buildSourceCards(chunks);
                send({
                    type: 'sources',
                    sources,
                });

                const topScore = chunks[0]?.fusedScore ?? 0;
                if (
                    chunks.length < MIN_CHUNKS_REQUIRED ||
                    topScore < MIN_RETRIEVAL_SCORE
                ) {
                    send({
                        type: 'notice',
                        kind:
                            chunks.length === 0
                                ? 'out_of_scope'
                                : 'weak_retrieval',
                        message:
                            chunks.length === 0
                                ? 'Ask the Archive answers from the preserved Submission Archives corpus. I could not find relevant material for this question.'
                                : 'I could not find sufficiently strong archive evidence for this question. Try a specific phrase, source type, or related term.',
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
