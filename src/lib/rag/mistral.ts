import 'server-only';
import { Mistral } from '@mistralai/mistralai';
import type {
  QueryExpansion,
  RetrievedChunk,
  RetrievalIntent,
  RetrievalMatchType,
} from './types';

let client: Mistral | null = null;

const QUERY_EXPANSION_SYSTEM_PROMPT = `You generate search queries for a private religious archive.
Return JSON only. Do not answer the user's question and do not claim that any proposed wording exists in the archive.
Create several ways the same idea could be expressed in ordinary speech, older theological vocabulary, or an imperfect transcript.
Classify the research intent so retrieval can prefer the correct edition or source class.
Use this exact JSON shape:
{
  "exactTerms": ["..."],
  "paraphrases": ["..."],
  "conceptDescriptions": ["..."],
  "archivePhrases": ["..."],
  "hypotheticalPassage": "...",
  "intent": "general",
  "requestedEditionYears": [1981, 1989, 1992]
}
intent must be one of general, final_wording, translation_evolution, historical_development, ritual_procedure.
Only include edition years explicitly requested or clearly required by the question.
Keep each list short. The hypothetical passage must be a neutral description of what a relevant passage might say, never a fabricated quotation.`;

const RERANK_SYSTEM_PROMPT = `You rerank canonical passages retrieved from SubmissionArchives.
Judge whether each canonical passage answers the user's question. A passage may have been discovered through a topic index, but the topic-index title is navigation metadata and is not evidence.
Distinguish direct speech by Rashad Khalifa from another speaker's question, quotation, rejection, fictional dialogue, or unrelated discussion.
Respect edition intent. For final Quran wording, prefer the 1992 final edition. For translation evolution, preserve useful evidence from each requested edition.
Return JSON only in this shape:
{
  "results": [
    {"id": 123, "score": 0, "matchType": "uncertain", "reason": "brief explanation"}
  ]
}
Scores:
4 = canonical passage directly answers the question
3 = canonical passage clearly describes the requested concept without necessarily naming it
2 = useful related background
1 = weakly related
0 = unrelated
matchType must be one of direct, conceptual, related, uncertain.
Do not invent facts, quotations, titles, dates, editions, page numbers, or timestamps.`;

function getClient(): Mistral {
  if (!client) {
    const apiKey = process.env.MISTRAL_API_KEY;
    if (!apiKey) throw new Error('MISTRAL_API_KEY is not configured');
    client = new Mistral({ apiKey });
  }
  return client;
}

export function emptyQueryExpansion(): QueryExpansion {
  return {
    exactTerms: [],
    paraphrases: [],
    conceptDescriptions: [],
    archivePhrases: [],
    hypotheticalPassage: '',
    intent: 'general',
    requestedEditionYears: [],
  };
}

export async function embedQueries(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const model = process.env.MISTRAL_EMBED_MODEL || 'mistral-embed-2312';
  const response = await getClient().embeddings.create({ model, inputs: texts });
  const embeddings = response.data?.map((item: { embedding?: number[] }) => item.embedding ?? []) ?? [];

  if (embeddings.length !== texts.length || embeddings.some((embedding: number[]) => !embedding?.length)) {
    throw new Error('Mistral returned an incomplete embedding batch');
  }

  return embeddings;
}

const DEFAULT_CHAT_MODEL = 'mistral-small-2603';

function resolveModel(taskModel: string | undefined): string {
  return taskModel || process.env.MISTRAL_CHAT_MODEL || DEFAULT_CHAT_MODEL;
}

function expansionModel(): string {
  return resolveModel(process.env.MISTRAL_EXPANSION_MODEL);
}

function rerankModel(): string {
  return resolveModel(process.env.MISTRAL_RERANK_MODEL);
}

function answerModel(): string {
  return resolveModel(process.env.MISTRAL_ANSWER_MODEL);
}

export async function streamChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = answerModel(),
) {
  return getClient().chat.stream({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });
}

export function extractDeltaText(
  content: string | Array<{ type?: string; text?: string }> | null | undefined,
): string {
  if (!content) return '';
  if (typeof content === 'string') return content;
  return content.map((chunk) => chunk.text || '').join('');
}

async function collectChatCompletion(
  systemPrompt: string,
  userPrompt: string,
  model?: string,
): Promise<string> {
  const events = await streamChatCompletion(systemPrompt, userPrompt, model);
  let text = '';

  for await (const event of events) {
    text += extractDeltaText(event.data?.choices?.[0]?.delta?.content);
  }

  return text.trim();
}

function extractJsonObject(text: string): unknown {
  const withoutFence = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const firstBrace = withoutFence.indexOf('{');
  const lastBrace = withoutFence.lastIndexOf('}');

  if (firstBrace < 0 || lastBrace <= firstBrace) {
    throw new Error('Model response did not contain a JSON object');
  }

  return JSON.parse(withoutFence.slice(firstBrace, lastBrace + 1)) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function cleanStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of value) {
    const cleaned = cleanString(item, maxLength);
    const key = cleaned.toLocaleLowerCase();
    if (!cleaned || seen.has(key)) continue;

    seen.add(key);
    output.push(cleaned);
    if (output.length >= maxItems) break;
  }

  return output;
}

function normalizeIntent(value: unknown): RetrievalIntent {
  return value === 'final_wording'
    || value === 'translation_evolution'
    || value === 'historical_development'
    || value === 'ritual_procedure'
    || value === 'general'
    ? value
    : 'general';
}

function cleanEditionYears(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .map(Number)
      .filter((year) => Number.isInteger(year) && year >= 1900 && year <= 2100),
  )].slice(0, 5);
}

export async function expandArchiveQuery(question: string): Promise<QueryExpansion> {
  const response = await collectChatCompletion(
    QUERY_EXPANSION_SYSTEM_PROMPT,
    `Question: ${question}`,
    expansionModel(),
  );
  const parsed = extractJsonObject(response);

  if (!isRecord(parsed)) return emptyQueryExpansion();

  return {
    exactTerms: cleanStringArray(parsed.exactTerms, 3, 90),
    paraphrases: cleanStringArray(parsed.paraphrases, 4, 180),
    conceptDescriptions: cleanStringArray(parsed.conceptDescriptions, 3, 220),
    archivePhrases: cleanStringArray(parsed.archivePhrases, 3, 160),
    hypotheticalPassage: cleanString(parsed.hypotheticalPassage, 500),
    intent: normalizeIntent(parsed.intent),
    requestedEditionYears: cleanEditionYears(parsed.requestedEditionYears),
  };
}

function normalizeMatchType(value: unknown): RetrievalMatchType {
  return value === 'direct' || value === 'conceptual' || value === 'related' || value === 'uncertain'
    ? value
    : 'uncertain';
}

interface RerankResult {
  id: number;
  score: number;
  matchType: RetrievalMatchType;
  reason: string;
}

function parseRerankResults(value: unknown): RerankResult[] {
  if (!isRecord(value) || !Array.isArray(value.results)) return [];

  const results: RerankResult[] = [];
  for (const item of value.results) {
    if (!isRecord(item)) continue;

    const id = Number(item.id);
    const rawScore = Number(item.score);
    if (!Number.isFinite(id) || !Number.isFinite(rawScore)) continue;

    results.push({
      id,
      score: Math.max(0, Math.min(4, rawScore)),
      matchType: normalizeMatchType(item.matchType),
      reason: cleanString(item.reason, 240),
    });
  }

  return results;
}

export async function rerankArchiveChunks(
  question: string,
  chunks: RetrievedChunk[],
  intent: RetrievalIntent = 'general',
): Promise<RetrievedChunk[]> {
  if (chunks.length < 2) return chunks;

  const rerankLimit = Number(process.env.RAG_RERANK_CANDIDATES) || 18;
  const candidates = chunks.slice(0, rerankLimit).map((chunk) => ({
    id: chunk.id,
    title: chunk.documentDisplayTitle || chunk.documentTitle,
    type: chunk.documentType,
    date: chunk.documentPublicationDate,
    editionYear: chunk.editionYear ?? chunk.documentEditionYear,
    sourcePriority: chunk.documentSourcePriority,
    evidenceKind: chunk.evidenceKind,
    speaker: chunk.speaker,
    label: chunk.label,
    topicIndexMatch: chunk.matchedSectionTitle,
    canonicalEvidenceText: chunk.contextText.slice(0, 1_200),
  }));

  const response = await collectChatCompletion(
    RERANK_SYSTEM_PROMPT,
    `INTENT\n${intent}\n\nQUESTION\n${question}\n\nCANDIDATES\n${JSON.stringify(candidates)}`,
    rerankModel(),
  );
  const parsed = extractJsonObject(response);
  const results = parseRerankResults(parsed);
  const byId = new Map(results.map((result) => [result.id, result]));

  return chunks
    .map((chunk) => {
      const result = byId.get(chunk.id);
      if (!result) return chunk;

      return {
        ...chunk,
        rerankScore: result.score,
        matchType: result.matchType,
        relevanceReason: result.reason || null,
      };
    })
    .sort((a, b) => {
      const rerankDifference = (b.rerankScore ?? -1) - (a.rerankScore ?? -1);
      return rerankDifference || b.fusedScore - a.fusedScore;
    });
}
