import 'server-only';
import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import type { RetrievalIntent, RetrievedChunk } from './types';
import type { RetrievalStrength } from './retrieval';

const TRACE_ENABLED = (process.env.RAG_TRACE_ENABLED ?? 'false').toLowerCase() === 'true';
const TRACE_DIR = path.resolve(process.cwd(), 'reports', 'rag-traces');
const TRACE_FILE = 'traces.jsonl';
const MAX_TRACED_CANDIDATES = 24;

interface TracedCandidate {
  chunkId: number;
  documentId: string;
  chunkKind: string;
  fusedScore: number;
  rerankScore: number | null;
  matchType: string;
  channelHits: string[];
  matchedSectionId: string | null;
  enrichmentGuided: boolean;
}

export interface RetrievalTrace {
  timestamp: string;
  question: string;
  intent: RetrievalIntent;
  requestedEditionYears: number[];
  querySeeds: Array<{ text: string; kind: string }>;
  degraded: string[];
  retrievalStrength: RetrievalStrength;
  candidates: TracedCandidate[];
  finalChunkIds: number[];
  durationMs: number;
}

function toTracedCandidate(chunk: RetrievedChunk): TracedCandidate {
  return {
    chunkId: chunk.id,
    documentId: chunk.documentId,
    chunkKind: chunk.chunkKind,
    fusedScore: chunk.fusedScore,
    rerankScore: chunk.rerankScore,
    matchType: chunk.matchType,
    channelHits: chunk.retrievalSignals.channelHits,
    matchedSectionId: chunk.matchedSectionId,
    enrichmentGuided: chunk.enrichmentGuided,
  };
}

export function buildRetrievalTrace(input: {
  question: string;
  intent: RetrievalIntent;
  requestedEditionYears: number[];
  querySeeds: Array<{ text: string; kind: string }>;
  degraded: string[];
  retrievalStrength: RetrievalStrength;
  candidates: RetrievedChunk[];
  finalChunks: RetrievedChunk[];
  startedAtMs: number;
}): RetrievalTrace {
  return {
    timestamp: new Date().toISOString(),
    question: input.question,
    intent: input.intent,
    requestedEditionYears: input.requestedEditionYears,
    querySeeds: input.querySeeds,
    degraded: input.degraded,
    retrievalStrength: input.retrievalStrength,
    candidates: input.candidates.slice(0, MAX_TRACED_CANDIDATES).map(toTracedCandidate),
    finalChunkIds: input.finalChunks.map((chunk) => chunk.id),
    durationMs: Date.now() - input.startedAtMs,
  };
}

export function recordRetrievalTrace(trace: RetrievalTrace): void {
  if (!TRACE_ENABLED) return;

  try {
    mkdirSync(TRACE_DIR, { recursive: true });
    appendFileSync(
      path.join(TRACE_DIR, TRACE_FILE),
      `${JSON.stringify(trace)}\n`,
      'utf8',
    );
  } catch (error: unknown) {
    console.error('[rag] failed to write retrieval trace', error);
  }
}
