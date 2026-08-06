import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ArchiveRecord, ArchiveSegment } from '../../src/types/archive';

/**
 * Mechanical grounding check for enrichment metadata. For every section it
 * extracts the canonical text at the section's locator and flags distinctive
 * summary terms and quoted phrases that never appear in that span. Flags are
 * review candidates, not verdicts: a flagged term may be a legitimate
 * paraphrase, but sections that import doctrine from elsewhere in a recording
 * show up here.
 */

const MASTER_INDEX_PATH = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);
const ENRICHMENT_ROOT = path.resolve(process.cwd(), 'data', 'rag', 'enrichment');
const REPORT_DIR = path.resolve(process.cwd(), 'reports', 'enrichment-review');
const MIN_TERM_LENGTH = 4;
const FLAG_MISSING_TERMS = 3;
const FLAG_RATIO = 0.55;

const STOPWORDS = new Set(
  (
    'this that with from what when where which whose while about into over under between '
    + 'their there these those they them then than have has had been being will would '
    + 'should could does done also only even ever never more most much many some such '
    + 'each other another against through during before after because rather without '
    + 'within says said saying speaker section sections program sermon recording opens '
    + 'begins discusses describes explains presents covers mentions addresses continues '
    + 'concludes moves turns edition editions verse verses sura suras quran reading '
    + 'readings wording revised final machine comparison candidate presence differs '
    + 'quoted labeled segments canonical transcription extractions review english '
    + 'substantially between differences across absent present '
    // Narration and analysis vocabulary: summaries legitimately use these
    // words to characterize what a passage does, so their absence from the
    // transcript span is not a grounding failure.
    + 'illustrates cites identifies rejects criticizes condemns affirms argues '
    + 'asserts warns urges contrasts compares recounts emphasizes interprets '
    + 'notes states quotes references defines outlines answers responds relates '
    + 'discusses summarizes introduces frames closes returns repeats details '
    + 'attributes distinguishes clarifies applies invokes appeals highlights '
    + 'connects links stresses reiterates announces declares narrates lists '
    + 'reviews examines considers reflects observes calls tells asks shows '
    // Speaker identity comes from verified catalog metadata, not the span.
    + 'rashad khalifa'
  ).split(/\s+/),
);

interface SectionFlag {
  file: string;
  sectionId: string;
  documentId: string;
  locator: string;
  groundingRatio: number;
  missingTerms: string[];
  unmatchedQuotes: string[];
}

interface CheckStats {
  filesChecked: number;
  sectionsChecked: number;
  sectionsWithoutSpan: number;
  flagged: SectionFlag[];
}

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distinctiveTerms(summary: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const token of normalizeText(summary).split(' ')) {
    if (token.length < MIN_TERM_LENGTH || STOPWORDS.has(token) || /^\d+$/.test(token)) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    terms.push(token);
  }
  return terms;
}

function termPresent(spanText: string, term: string): boolean {
  if (spanText.includes(term)) return true;
  // Cheap stemming so plurals and inflections do not raise false flags.
  const stems = [
    term.replace(/ies$/, 'y'),
    term.replace(/(es|s)$/, ''),
    term.replace(/(ed|ing|ly)$/, ''),
  ];
  if (stems.some((stem) => stem.length >= MIN_TERM_LENGTH && spanText.includes(stem))) {
    return true;
  }
  // Derivational forms (quranic/quran, mathematical/mathematics): accept a
  // shared prefix when the term is long enough for the prefix to stay
  // distinctive.
  if (term.length >= 6) {
    const prefix = term.slice(0, Math.max(5, term.length - 3));
    return spanText.includes(prefix);
  }
  return false;
}

function extractQuotes(summary: string): string[] {
  const quotes: string[] = [];
  for (const match of summary.matchAll(/"([^"]{12,200})"/g)) {
    quotes.push(match[1]);
  }
  return quotes;
}

function sectionSpan(record: ArchiveRecord, section: Record<string, unknown>): ArchiveSegment[] {
  const segments = record.segments ?? [];
  const segStart = Number(section.source_segment_start);
  const segEnd = Number(section.source_segment_end);
  if (Number.isInteger(segStart) && Number.isInteger(segEnd)) {
    return segments.slice(segStart, segEnd + 1);
  }

  const startTime = Number(section.start);
  const endTime = Number(section.end);
  if (Number.isFinite(startTime) && Number.isFinite(endTime)) {
    return segments.filter((segment) => {
      const s = Number(segment.start);
      const e = Number(segment.end);
      return Number.isFinite(s) && Number.isFinite(e) && s <= endTime && e >= startTime;
    });
  }

  const pageStart = Number(section.page_start ?? section.page);
  const pageEnd = Number(section.page_end ?? section.page);
  if (Number.isInteger(pageStart) && Number.isInteger(pageEnd)) {
    return segments.filter(
      (segment) =>
        Number.isInteger(segment.page)
        && (segment.page as number) >= pageStart
        && (segment.page as number) <= pageEnd,
    );
  }

  return [];
}

function listJsonFiles(root: string): string[] {
  const output: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...listJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
      output.push(full);
    }
  }
  return output;
}

function main(): void {
  const records: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const recordById = new Map(records.map((record) => [record.id, record]));
  const stats: CheckStats = {
    filesChecked: 0,
    sectionsChecked: 0,
    sectionsWithoutSpan: 0,
    flagged: [],
  };

  for (const filePath of listJsonFiles(ENRICHMENT_ROOT)) {
    const relative = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
    const doc = JSON.parse(readFileSync(filePath, 'utf8')) as {
      document_id?: string;
      canonical_document_id?: string;
      sections?: Array<Record<string, unknown>>;
    };
    const documentId = doc.canonical_document_id ?? doc.document_id;
    const record = documentId ? recordById.get(documentId) : undefined;
    if (!record || !Array.isArray(doc.sections)) continue;
    stats.filesChecked += 1;

    for (const section of doc.sections) {
      const sectionId = String(section.id ?? '');
      const summary = String(section.summary ?? '');
      if (!sectionId || !summary) continue;
      stats.sectionsChecked += 1;

      const span = sectionSpan(record, section);
      if (span.length === 0) {
        stats.sectionsWithoutSpan += 1;
        stats.flagged.push({
          file: relative,
          sectionId,
          documentId: record.id,
          locator: 'no canonical span resolved',
          groundingRatio: 0,
          missingTerms: [],
          unmatchedQuotes: [],
        });
        continue;
      }

      const spanText = normalizeText(span.map((segment) => segment.text ?? '').join(' '));
      const terms = distinctiveTerms(summary);
      const missing = terms.filter((term) => !termPresent(spanText, term));
      const ratio = terms.length > 0 ? (terms.length - missing.length) / terms.length : 1;
      const unmatchedQuotes = extractQuotes(summary).filter(
        (quote) => !spanText.includes(normalizeText(quote)),
      );

      if (missing.length >= FLAG_MISSING_TERMS || ratio < FLAG_RATIO || unmatchedQuotes.length > 0) {
        stats.flagged.push({
          file: relative,
          sectionId,
          documentId: record.id,
          locator: `segments ${String(section.source_segment_start)}-${String(section.source_segment_end)}`,
          groundingRatio: Number(ratio.toFixed(3)),
          missingTerms: missing,
          unmatchedQuotes,
        });
      }
    }
  }

  mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, 'grounding-flags.json');
  writeFileSync(
    reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        thresholds: { FLAG_MISSING_TERMS, FLAG_RATIO },
        filesChecked: stats.filesChecked,
        sectionsChecked: stats.sectionsChecked,
        sectionsWithoutSpan: stats.sectionsWithoutSpan,
        flaggedCount: stats.flagged.length,
        flagged: stats.flagged,
      },
      null,
      2,
    ),
  );

  const byDir = new Map<string, number>();
  for (const flag of stats.flagged) {
    const dir = flag.file.split('/')[1] ?? 'unknown';
    byDir.set(dir, (byDir.get(dir) ?? 0) + 1);
  }

  console.log('Enrichment grounding check');
  console.log(`  Files checked: ${stats.filesChecked}`);
  console.log(`  Sections checked: ${stats.sectionsChecked}`);
  console.log(`  Sections without a resolvable span: ${stats.sectionsWithoutSpan}`);
  console.log(`  Flagged sections: ${stats.flagged.length}`);
  for (const [dir, count] of [...byDir.entries()].sort()) {
    console.log(`    ${dir}: ${count}`);
  }
  console.log(`  Report: ${path.relative(process.cwd(), reportPath)}`);
}

main();
