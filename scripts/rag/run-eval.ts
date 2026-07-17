import './lib/env';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { retrieveChunks } from '../../src/lib/rag/retrieval';
import { embedQueries } from '../../src/lib/rag/mistral';
import { getRagPool } from '../../src/lib/rag/db';
import type { RetrievedChunk, RetrievalOptions } from '../../src/lib/rag/types';

const EVAL_DIR = path.resolve(process.cwd(), 'data', 'rag_eval');
const ENRICHMENT_DIR = path.resolve(process.cwd(), 'data', 'rag_enrichment');
const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'rag-eval');
const EMBED_BATCH_SIZE = Number(process.env.RAG_EMBED_BATCH_SIZE) || 32;
const RECALL_CUTOFFS = [5, 10, 24] as const;

interface EvalCase {
  id: string;
  documentId: string;
  question: string;
  expectedSectionIds: string[];
  matchType: string;
}

interface SectionLocator {
  documentId: string;
  segmentStart: number | null;
  segmentEnd: number | null;
  startSeconds: number | null;
  endSeconds: number | null;
}

interface CaseResult {
  caseId: string;
  documentId: string;
  matchType: string;
  expectedSections: number;
  firstHitRank: number | null;
  recallAt: Record<number, number>;
  anyHitAt: Record<number, boolean>;
}

interface CliArgs {
  sample: number | null;
  filter: string | null;
  concurrency: number;
  topN: number;
  write: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    sample: null,
    filter: null,
    concurrency: 4,
    topN: Math.max(
      Number(process.env.RAG_RERANK_CANDIDATES) || 24,
      Number(process.env.RAG_TOP_N_CONTEXT) || 10,
    ),
    write: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--sample') args.sample = Number(argv[++i]) || null;
    else if (arg === '--filter') args.filter = argv[++i] ?? null;
    else if (arg === '--concurrency') args.concurrency = Number(argv[++i]) || 4;
    else if (arg === '--top-n') args.topN = Number(argv[++i]) || args.topN;
    else if (arg === '--no-write') args.write = false;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function listJsonFiles(root: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) out.push(...listJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
      out.push(full);
    }
  }
  return out;
}

function loadEvalCases(filter: string | null): EvalCase[] {
  const cases: EvalCase[] = [];
  for (const file of listJsonFiles(EVAL_DIR)) {
    const doc = JSON.parse(readFileSync(file, 'utf8')) as {
      document_id?: string;
      canonical_document_id?: string;
      cases?: Array<{
        id?: string;
        question?: string;
        expected_section_ids?: string[];
        match_type?: string;
      }>;
    };
    const documentId = doc.canonical_document_id ?? doc.document_id;
    if (!documentId || !Array.isArray(doc.cases)) continue;
    if (filter && !documentId.includes(filter)) continue;

    for (const item of doc.cases) {
      if (!item.id || !item.question || !item.expected_section_ids?.length) continue;
      cases.push({
        id: item.id,
        documentId,
        question: item.question,
        expectedSectionIds: item.expected_section_ids,
        matchType: item.match_type ?? 'unknown',
      });
    }
  }
  return cases;
}

function loadSectionLocators(): Map<string, SectionLocator> {
  const locators = new Map<string, SectionLocator>();
  for (const file of listJsonFiles(ENRICHMENT_DIR)) {
    const doc = JSON.parse(readFileSync(file, 'utf8')) as {
      document_id?: string;
      canonical_document_id?: string;
      sections?: Array<{
        id?: string;
        source_segment_start?: number;
        source_segment_end?: number;
        start?: number;
        end?: number;
      }>;
    };
    const documentId = doc.canonical_document_id ?? doc.document_id;
    if (!documentId || !Array.isArray(doc.sections)) continue;

    for (const section of doc.sections) {
      if (!section.id) continue;
      locators.set(section.id, {
        documentId,
        segmentStart: section.source_segment_start ?? null,
        segmentEnd: section.source_segment_end ?? null,
        startSeconds: section.start ?? null,
        endSeconds: section.end ?? null,
      });
    }
  }
  return locators;
}

function chunkMatchesSection(
  chunk: RetrievedChunk,
  sectionId: string,
  locator: SectionLocator | undefined,
): boolean {
  if (chunk.matchedSectionId === sectionId) return true;
  if (!locator || chunk.documentId !== locator.documentId) return false;

  if (
    chunk.sourceSegmentStart !== null &&
    chunk.sourceSegmentEnd !== null &&
    locator.segmentStart !== null &&
    locator.segmentEnd !== null
  ) {
    return chunk.sourceSegmentStart <= locator.segmentEnd && chunk.sourceSegmentEnd >= locator.segmentStart;
  }

  if (
    chunk.startTime !== null &&
    chunk.endTime !== null &&
    locator.startSeconds !== null &&
    locator.endSeconds !== null
  ) {
    return chunk.startTime <= locator.endSeconds && chunk.endTime >= locator.startSeconds;
  }

  return false;
}

function scoreCase(
  evalCase: EvalCase,
  chunks: RetrievedChunk[],
  locators: Map<string, SectionLocator>,
): CaseResult {
  const recallAt: Record<number, number> = {};
  const anyHitAt: Record<number, boolean> = {};
  let firstHitRank: number | null = null;

  for (const cutoff of RECALL_CUTOFFS) {
    const window = chunks.slice(0, cutoff);
    let hits = 0;
    for (const sectionId of evalCase.expectedSectionIds) {
      const locator = locators.get(sectionId);
      if (window.some((chunk) => chunkMatchesSection(chunk, sectionId, locator))) hits += 1;
    }
    recallAt[cutoff] = hits / evalCase.expectedSectionIds.length;
    anyHitAt[cutoff] = hits > 0;
  }

  for (let rank = 0; rank < chunks.length; rank += 1) {
    const chunk = chunks[rank];
    const hit = evalCase.expectedSectionIds.some((sectionId) =>
      chunkMatchesSection(chunk, sectionId, locators.get(sectionId)),
    );
    if (hit) {
      firstHitRank = rank + 1;
      break;
    }
  }

  return {
    caseId: evalCase.id,
    documentId: evalCase.documentId,
    matchType: evalCase.matchType,
    expectedSections: evalCase.expectedSectionIds.length,
    firstHitRank,
    recallAt,
    anyHitAt,
  };
}

async function embedAllQuestions(cases: EvalCase[]): Promise<Map<string, number[]>> {
  const embeddings = new Map<string, number[]>();
  for (let offset = 0; offset < cases.length; offset += EMBED_BATCH_SIZE) {
    const batch = cases.slice(offset, offset + EMBED_BATCH_SIZE);
    const vectors = await embedQueries(batch.map((item) => item.question));
    batch.forEach((item, index) => embeddings.set(item.id, vectors[index]));
    process.stdout.write(
      `\rEmbedding questions: ${Math.min(offset + EMBED_BATCH_SIZE, cases.length)}/${cases.length}`,
    );
  }
  process.stdout.write('\n');
  return embeddings;
}

interface Aggregate {
  cases: number;
  meanRecallAt: Record<number, number>;
  anyHitRateAt: Record<number, number>;
  mrr: number;
}

function aggregate(results: CaseResult[]): Aggregate {
  const meanRecallAt: Record<number, number> = {};
  const anyHitRateAt: Record<number, number> = {};

  for (const cutoff of RECALL_CUTOFFS) {
    meanRecallAt[cutoff] =
      results.reduce((sum, item) => sum + item.recallAt[cutoff], 0) / Math.max(results.length, 1);
    anyHitRateAt[cutoff] =
      results.filter((item) => item.anyHitAt[cutoff]).length / Math.max(results.length, 1);
  }

  const mrr =
    results.reduce((sum, item) => sum + (item.firstHitRank ? 1 / item.firstHitRank : 0), 0) /
    Math.max(results.length, 1);

  return { cases: results.length, meanRecallAt, anyHitRateAt, mrr };
}

function formatAggregate(label: string, agg: Aggregate): string {
  const recall = RECALL_CUTOFFS.map(
    (cutoff) => `recall@${cutoff} ${(agg.meanRecallAt[cutoff] * 100).toFixed(1)}%`,
  ).join('  ');
  const anyHit = RECALL_CUTOFFS.map(
    (cutoff) => `hit@${cutoff} ${(agg.anyHitRateAt[cutoff] * 100).toFixed(1)}%`,
  ).join('  ');
  return `${label.padEnd(14)} n=${String(agg.cases).padEnd(5)} ${recall}  ${anyHit}  MRR ${agg.mrr.toFixed(3)}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const locators = loadSectionLocators();
  let cases = loadEvalCases(args.filter);

  if (args.sample && args.sample < cases.length) {
    const step = cases.length / args.sample;
    cases = Array.from({ length: args.sample }, (_, index) => cases[Math.floor(index * step)]);
  }

  if (cases.length === 0) {
    throw new Error('No eval cases matched the given filters.');
  }

  console.log(`Eval cases: ${cases.length} (sections indexed: ${locators.size})`);
  const embeddings = await embedAllQuestions(cases);

  const options: RetrievalOptions = {
    topK: Number(process.env.RAG_TOP_K_RETRIEVAL) || 40,
    topN: args.topN,
    intent: 'general',
    requestedEditionYears: [],
    enrichmentEnabled: (process.env.RAG_ENRICHMENT_ENABLED ?? 'true') !== 'false',
    enrichmentTopK: Number(process.env.RAG_ENRICHMENT_TOP_K) || 30,
    enrichmentMaxSections: Number(process.env.RAG_ENRICHMENT_MAX_SECTIONS) || 24,
  };

  const results: CaseResult[] = [];
  let completed = 0;
  let cursor = 0;

  async function worker(): Promise<void> {
    while (cursor < cases.length) {
      const index = cursor;
      cursor += 1;
      const evalCase = cases[index];
      const embedding = embeddings.get(evalCase.id);
      if (!embedding) continue;

      const chunks = await retrieveChunks(
        [{ text: evalCase.question, embedding, kind: 'original', weight: 1 }],
        options,
      );
      results.push(scoreCase(evalCase, chunks, locators));
      completed += 1;
      if (completed % 25 === 0 || completed === cases.length) {
        process.stdout.write(`\rRetrieval: ${completed}/${cases.length}`);
      }
    }
  }

  const startedAt = Date.now();
  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
  process.stdout.write('\n');

  const byMatchType = new Map<string, CaseResult[]>();
  for (const result of results) {
    const bucket = byMatchType.get(result.matchType) ?? [];
    bucket.push(result);
    byMatchType.set(result.matchType, bucket);
  }

  console.log('\nRetrieval eval summary');
  console.log(formatAggregate('overall', aggregate(results)));
  for (const [matchType, bucket] of [...byMatchType.entries()].sort()) {
    console.log(formatAggregate(matchType, aggregate(bucket)));
  }

  const missedCases = results
    .filter((item) => !item.anyHitAt[RECALL_CUTOFFS[RECALL_CUTOFFS.length - 1]])
    .map((item) => item.caseId);
  console.log(`\nCases with zero hits in top ${args.topN}: ${missedCases.length}`);

  if (args.write) {
    mkdirSync(REPORT_DIR, { recursive: true });
    const report = {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      options,
      args,
      overall: aggregate(results),
      byMatchType: Object.fromEntries(
        [...byMatchType.entries()].map(([key, bucket]) => [key, aggregate(bucket)]),
      ),
      missedCases,
      results,
    };
    const stamp = report.generatedAt.replace(/[:.]/g, '-');
    const reportPath = path.join(REPORT_DIR, `${stamp}-eval.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    writeFileSync(path.join(REPORT_DIR, 'latest-eval.json'), JSON.stringify(report, null, 2));
    console.log(`Report written to ${path.relative(process.cwd(), reportPath)}`);
  }

  await getRagPool().end();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
