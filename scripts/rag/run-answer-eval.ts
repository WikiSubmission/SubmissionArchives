import './lib/env';
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { streamChatCompletion, extractDeltaText } from '../../src/lib/rag/mistral';

/**
 * End-to-end answer-quality eval. Drives the real /api/ask endpoint for a
 * sample of gold cases, then judges each generated answer against the gold
 * expected_answer_note and the sources the pipeline actually showed. This
 * measures answer correctness, completeness, and faithfulness, which the
 * retrieval eval (run-eval.ts) does not.
 */

const EVAL_DIR = path.resolve(process.cwd(), 'data', 'rag_eval');
const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'rag-answer-eval');
const DEFAULT_SAMPLE = 24;
const JUDGE_MODEL = process.env.RAG_JUDGE_MODEL || 'mistral-large-2512';
const RATE_LIMIT_WAIT_MS = 20_000;
const MAX_ATTEMPTS = 3;

interface EvalCase {
  id: string;
  documentId: string;
  question: string;
  expectedAnswerNote: string;
  matchType: string;
}

interface AskSource {
  sourceId: string;
  documentId: string;
  title: string;
  snippet: string;
  matchType: string;
  enrichmentGuided: boolean;
}

interface AskResult {
  answer: string;
  sources: AskSource[];
  citedSourceIds: string[];
  notice: string | null;
}

interface JudgeScore {
  answered: boolean;
  completeness: number;
  correctness: number;
  faithfulness: number;
  citedExpectedDoc: boolean;
  issues: string[];
}

interface CliArgs {
  sample: number;
  filter: string | null;
  concurrency: number;
  baseUrl: string;
  write: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    sample: DEFAULT_SAMPLE,
    filter: null,
    concurrency: 2,
    baseUrl: process.env.RAG_EVAL_BASE_URL || 'http://localhost:3000',
    write: true,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--sample') args.sample = Number(argv[++i]) || DEFAULT_SAMPLE;
    else if (arg === '--filter') args.filter = argv[++i] ?? null;
    else if (arg === '--concurrency') args.concurrency = Number(argv[++i]) || 2;
    else if (arg === '--base-url') args.baseUrl = argv[++i] ?? args.baseUrl;
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
        expected_answer_note?: string;
        match_type?: string;
      }>;
    };
    const documentId = doc.canonical_document_id ?? doc.document_id;
    if (!documentId || !Array.isArray(doc.cases)) continue;
    if (filter && !documentId.includes(filter)) continue;
    for (const item of doc.cases) {
      if (!item.id || !item.question || !item.expected_answer_note) continue;
      cases.push({
        id: item.id,
        documentId,
        question: item.question,
        expectedAnswerNote: item.expected_answer_note,
        matchType: item.match_type ?? 'unknown',
      });
    }
  }
  return cases;
}

function sampleCases(cases: EvalCase[], sample: number): EvalCase[] {
  if (sample >= cases.length) return cases;
  const step = cases.length / sample;
  return Array.from({ length: sample }, (_, index) => cases[Math.floor(index * step)]);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseSseEvents(body: string): Array<Record<string, unknown>> {
  const events: Array<Record<string, unknown>> = [];
  for (const block of body.split('\n\n')) {
    const line = block.split('\n').find((l) => l.startsWith('data:'));
    if (!line) continue;
    try {
      events.push(JSON.parse(line.slice(5).trim()) as Record<string, unknown>);
    } catch {
      // Ignore keep-alive and malformed frames.
    }
  }
  return events;
}

async function askOnce(baseUrl: string, question: string): Promise<AskResult> {
  const response = await fetch(`${baseUrl}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (response.status === 429) {
    throw new Error('rate-limited');
  }
  if (!response.ok || !response.body) {
    throw new Error(`ask failed: ${response.status}`);
  }

  const events = parseSseEvents(await response.text());
  let answer = '';
  let sources: AskSource[] = [];
  let citedSourceIds: string[] = [];
  let notice: string | null = null;

  for (const event of events) {
    if (event.type === 'sources' && Array.isArray(event.sources)) {
      sources = (event.sources as Array<Record<string, unknown>>).map((s) => ({
        sourceId: String(s.sourceId ?? ''),
        documentId: String(s.documentId ?? ''),
        title: String(s.title ?? ''),
        snippet: String(s.snippet ?? ''),
        matchType: String(s.matchType ?? ''),
        enrichmentGuided: Boolean(s.enrichmentGuided),
      }));
    } else if (event.type === 'answer_delta') {
      answer += String(event.text ?? '');
    } else if (event.type === 'answer_done' && Array.isArray(event.citedSourceIds)) {
      citedSourceIds = (event.citedSourceIds as unknown[]).map(String);
    } else if (event.type === 'notice') {
      notice = String(event.kind ?? 'notice');
    }
  }

  return { answer: answer.trim(), sources, citedSourceIds, notice };
}

async function ask(baseUrl: string, question: string): Promise<AskResult> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await askOnce(baseUrl, question);
    } catch (error: unknown) {
      lastError = error;
      if (error instanceof Error && error.message === 'rate-limited') {
        await delay(RATE_LIMIT_WAIT_MS);
      } else {
        await delay(2_000 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

const JUDGE_SYSTEM_PROMPT = `You are grading an archive question-answering assistant.
You are given a QUESTION, a GOLD ANSWER NOTE (the reference facts a correct answer should convey), the ASSISTANT ANSWER, and the SOURCES the assistant was shown (id, title, snippet).
Return ONLY a JSON object:
{
 "answered": boolean,            // false if the assistant declined or returned no substantive answer
 "completeness": 0-4,            // how fully the answer covers the gold note's facts
 "correctness": 0-4,             // 4 = fully agrees with the gold note; 0 = contradicts it
 "faithfulness": 0-4,            // 4 = every claim is supported by the shown source snippets; 0 = fabricated
 "citedExpectedDoc": boolean,    // did the answer cite at least one source from the document the gold note comes from
 "issues": string[]              // short phrases naming any unsupported claim, contradiction, or omission
}
Judge faithfulness only against the provided snippets; snippets are excerpts, so do not penalize an answer for detail that is plausibly in the same source beyond the snippet, only for claims that contradict or are unrelated to the sources. Output JSON only, no prose.`;

function extractJson(text: string): Record<string, unknown> {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('judge returned no JSON');
  return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
}

function clampScore(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(4, n));
}

async function judge(evalCase: EvalCase, result: AskResult): Promise<JudgeScore> {
  if (result.notice && !result.answer) {
    return {
      answered: false,
      completeness: 0,
      correctness: 0,
      faithfulness: 0,
      citedExpectedDoc: false,
      issues: [`notice:${result.notice}`],
    };
  }

  const sourceBlock = result.sources
    .map((s) => `${s.sourceId} [${s.documentId}] ${s.title}\n${s.snippet}`)
    .join('\n\n');
  const userPrompt = `QUESTION\n${evalCase.question}\n\nGOLD ANSWER NOTE\n${evalCase.expectedAnswerNote}\n\nEXPECTED SOURCE DOCUMENT\n${evalCase.documentId}\n\nASSISTANT ANSWER\n${result.answer}\n\nSOURCES\n${sourceBlock}`;

  const events = await streamChatCompletion(JUDGE_SYSTEM_PROMPT, userPrompt, JUDGE_MODEL);
  let text = '';
  for await (const event of events) {
    text += extractDeltaText(event.data?.choices?.[0]?.delta?.content);
  }

  const parsed = extractJson(text);
  return {
    answered: Boolean(parsed.answered),
    completeness: clampScore(parsed.completeness),
    correctness: clampScore(parsed.correctness),
    faithfulness: clampScore(parsed.faithfulness),
    citedExpectedDoc: Boolean(parsed.citedExpectedDoc),
    issues: Array.isArray(parsed.issues) ? parsed.issues.map(String).slice(0, 6) : [],
  };
}

interface CaseOutcome {
  caseId: string;
  documentId: string;
  matchType: string;
  notice: string | null;
  citationCount: number;
  score: JudgeScore;
}

function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const cases = sampleCases(loadEvalCases(args.filter), args.sample);
  if (cases.length === 0) throw new Error('No eval cases matched the filters.');

  console.log(`Answer eval: ${cases.length} cases via ${args.baseUrl} (judge: ${JUDGE_MODEL})`);

  const outcomes: CaseOutcome[] = [];
  let cursor = 0;
  let completed = 0;

  async function worker(): Promise<void> {
    while (cursor < cases.length) {
      const evalCase = cases[cursor++];
      try {
        const result = await ask(args.baseUrl, evalCase.question);
        const score = await judge(evalCase, result);
        outcomes.push({
          caseId: evalCase.id,
          documentId: evalCase.documentId,
          matchType: evalCase.matchType,
          notice: result.notice,
          citationCount: result.citedSourceIds.length,
          score,
        });
      } catch (error: unknown) {
        outcomes.push({
          caseId: evalCase.id,
          documentId: evalCase.documentId,
          matchType: evalCase.matchType,
          notice: 'error',
          citationCount: 0,
          score: {
            answered: false,
            completeness: 0,
            correctness: 0,
            faithfulness: 0,
            citedExpectedDoc: false,
            issues: [error instanceof Error ? error.message : 'error'],
          },
        });
      }
      completed += 1;
      process.stdout.write(`\rGraded: ${completed}/${cases.length}`);
    }
  }

  const startedAt = Date.now();
  await Promise.all(Array.from({ length: args.concurrency }, () => worker()));
  process.stdout.write('\n');

  const answered = outcomes.filter((o) => o.score.answered);
  const summary = {
    cases: outcomes.length,
    answeredRate: answered.length / outcomes.length,
    meanCompleteness: mean(answered.map((o) => o.score.completeness)),
    meanCorrectness: mean(answered.map((o) => o.score.correctness)),
    meanFaithfulness: mean(answered.map((o) => o.score.faithfulness)),
    citedExpectedDocRate: mean(answered.map((o) => (o.score.citedExpectedDoc ? 1 : 0))),
    faithfulnessFailures: answered.filter((o) => o.score.faithfulness < 3).length,
  };

  console.log('\nAnswer quality summary');
  console.log(`  Answered: ${(summary.answeredRate * 100).toFixed(1)}% (${answered.length}/${outcomes.length})`);
  console.log(`  Completeness (0-4): ${summary.meanCompleteness.toFixed(2)}`);
  console.log(`  Correctness (0-4):  ${summary.meanCorrectness.toFixed(2)}`);
  console.log(`  Faithfulness (0-4): ${summary.meanFaithfulness.toFixed(2)}`);
  console.log(`  Cited expected doc: ${(summary.citedExpectedDocRate * 100).toFixed(1)}%`);
  console.log(`  Faithfulness < 3:   ${summary.faithfulnessFailures} case(s)`);

  const worst = [...answered]
    .sort((a, b) => a.score.correctness + a.score.faithfulness - (b.score.correctness + b.score.faithfulness))
    .slice(0, 5);
  if (worst.length > 0) {
    console.log('\nLowest-scoring answered cases:');
    for (const o of worst) {
      console.log(`  ${o.caseId} corr=${o.score.correctness} faith=${o.score.faithfulness} ${o.score.issues.join('; ')}`);
    }
  }

  if (args.write) {
    mkdirSync(REPORT_DIR, { recursive: true });
    const report = {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      judgeModel: JUDGE_MODEL,
      args,
      summary,
      outcomes,
    };
    const stamp = report.generatedAt.replace(/[:.]/g, '-');
    writeFileSync(path.join(REPORT_DIR, `${stamp}-answer-eval.json`), JSON.stringify(report, null, 2));
    writeFileSync(path.join(REPORT_DIR, 'latest-answer-eval.json'), JSON.stringify(report, null, 2));
    console.log(`\nReport written to ${path.relative(process.cwd(), path.join(REPORT_DIR, 'latest-answer-eval.json'))}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
