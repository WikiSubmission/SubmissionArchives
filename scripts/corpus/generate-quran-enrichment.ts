import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ArchiveRecord } from '../../src/types/archive';

/**
 * Generates draft enrichment metadata for the three Quran editions from the
 * machine comparison corpus. Each sura with qualifying verse changes gets one
 * enrichment file attached to its canonical 1992 document (quran/N), with
 * verse-range sections that carry segment and page locators. The metadata is
 * navigation-only: it helps translation-evolution queries find the canonical
 * verses, and is never quoted as evidence.
 */

const MASTER_INDEX_PATH = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);
const COMPARISON_PATH = path.resolve(
  process.cwd(),
  'data',
  'corpus',
  'quran_three_edition_comparison.jsonl',
);
const DOSSIER_PATH = path.resolve(process.cwd(), 'data', 'corpus', 'sura9_128_129_dossier.json');
const OUTPUT_DIR = path.resolve(process.cwd(), 'data', 'rag_enrichment', 'quran-editions');
const SNIPPET_MAX_CHARS = 110;

interface ComparisonRecord {
  verse_id: string;
  chapter_number: number;
  verse_number: number;
  presence: Record<string, boolean>;
  edition_1981?: { candidate_text?: string; printed_page?: number };
  edition_1989?: { candidate_text?: string; printed_page?: number };
  edition_1992?: { final_english?: string };
  change_class?: Record<string, string>;
}

interface VerseGroup {
  chapter: number;
  startVerse: number;
  endVerse: number;
  records: ComparisonRecord[];
  presenceAnomaly: boolean;
}

interface SectionDraft {
  id: string;
  title: string;
  summary: string;
  section_kind: string;
  concepts: Array<{ id: string; relation: string; explicit: boolean }>;
  user_terms: string[];
  related_questions: string[];
  quran_references: string[];
  retrieval_note: string;
  source_segment_start: number | null;
  source_segment_end: number | null;
  page_start: number | null;
  page_end: number | null;
  review_status: string;
}

function loadComparisonRecords(): ComparisonRecord[] {
  return readFileSync(COMPARISON_PATH, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ComparisonRecord);
}

function cleanSnippet(value: string | undefined): string {
  if (!value) return '';
  const cleaned = value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !/^[-_\s,.]+$/.test(line) && !/^Sura \d+:/.test(line))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > SNIPPET_MAX_CHARS
    ? `${cleaned.slice(0, SNIPPET_MAX_CHARS).trimEnd()}...`
    : cleaned;
}

function isQualifying(record: ComparisonRecord): boolean {
  const changeClass = record.change_class?.['1989_to_1992'];
  const presence = record.presence ?? {};
  const presenceAnomaly =
    presence['1992'] === false || presence['1989'] === false || presence['1981'] === false;
  return changeClass === 'substantial-revision' || presenceAnomaly;
}

function hasPresenceAnomaly(record: ComparisonRecord): boolean {
  const presence = record.presence ?? {};
  return presence['1992'] === false || presence['1989'] === false || presence['1981'] === false;
}

function groupVerses(records: ComparisonRecord[]): VerseGroup[] {
  const byChapter = new Map<number, ComparisonRecord[]>();
  for (const record of records) {
    const list = byChapter.get(record.chapter_number) ?? [];
    list.push(record);
    byChapter.set(record.chapter_number, list);
  }

  const groups: VerseGroup[] = [];
  for (const [chapter, chapterRecords] of byChapter) {
    const sorted = [...chapterRecords].sort((a, b) => a.verse_number - b.verse_number);
    let current: VerseGroup | null = null;

    for (const record of sorted) {
      const anomaly = hasPresenceAnomaly(record);
      if (
        current &&
        record.verse_number - current.endVerse <= 1 &&
        current.presenceAnomaly === anomaly
      ) {
        current = {
          ...current,
          endVerse: record.verse_number,
          records: [...current.records, record],
        };
        groups[groups.length - 1] = current;
      } else {
        current = {
          chapter,
          startVerse: record.verse_number,
          endVerse: record.verse_number,
          records: [record],
          presenceAnomaly: anomaly,
        };
        groups.push(current);
      }
    }
  }

  return groups;
}

interface SegmentLocator {
  segmentStart: number | null;
  segmentEnd: number | null;
  pageStart: number | null;
  pageEnd: number | null;
}

function locateVerseSegments(
  record: ArchiveRecord,
  startVerse: number,
  endVerse: number,
): SegmentLocator {
  const segments = record.segments ?? [];
  const indices: number[] = [];
  const pages: number[] = [];

  segments.forEach((segment, index) => {
    if (segment.label !== 'verse-1992') return;
    const segStart = Number(segment.start);
    const segEnd = Number(segment.end);
    if (!Number.isFinite(segStart) || !Number.isFinite(segEnd)) return;
    if (segStart <= endVerse && segEnd >= startVerse) {
      indices.push(index);
      if (Number.isInteger(segment.page)) pages.push(segment.page as number);
    }
  });

  if (indices.length === 0) {
    // Verses absent from the 1992 edition (removed passages): anchor to the
    // nearest preceding verse so the section still resolves to canonical text.
    let bestIndex: number | null = null;
    let bestVerse = -1;
    segments.forEach((segment, index) => {
      if (segment.label !== 'verse-1992') return;
      const segEnd = Number(segment.end);
      if (Number.isFinite(segEnd) && segEnd <= startVerse && segEnd > bestVerse) {
        bestVerse = segEnd;
        bestIndex = index;
      }
    });
    if (bestIndex !== null) {
      const page = segments[bestIndex].page;
      return {
        segmentStart: bestIndex,
        segmentEnd: bestIndex,
        pageStart: Number.isInteger(page) ? (page as number) : null,
        pageEnd: Number.isInteger(page) ? (page as number) : null,
      };
    }
    return { segmentStart: null, segmentEnd: null, pageStart: null, pageEnd: null };
  }

  return {
    segmentStart: Math.min(...indices),
    segmentEnd: Math.max(...indices),
    pageStart: pages.length > 0 ? Math.min(...pages) : null,
    pageEnd: pages.length > 0 ? Math.max(...pages) : null,
  };
}

function presenceDescription(record: ComparisonRecord): string {
  const presence = record.presence ?? {};
  const parts = ['1981', '1989', '1992'].map(
    (year) => `${year}: ${presence[year] === false ? 'absent' : 'present'}`,
  );
  return parts.join(', ');
}

function buildSection(group: VerseGroup, record: ArchiveRecord): SectionDraft {
  const verseRef =
    group.startVerse === group.endVerse
      ? `${group.chapter}:${group.startVerse}`
      : `${group.chapter}:${group.startVerse}-${group.endVerse}`;
  const locator = locateVerseSegments(record, group.startVerse, group.endVerse);
  const sample = group.records[0];
  const before = cleanSnippet(sample.edition_1989?.candidate_text);
  const after = cleanSnippet(sample.edition_1992?.final_english);

  const summaryParts: string[] = [];
  if (group.presenceAnomaly) {
    summaryParts.push(
      `Verse presence differs across editions for ${verseRef} (${presenceDescription(sample)}).`,
    );
  } else {
    summaryParts.push(
      `The English wording of ${verseRef} was substantially revised between the 1989 and 1992 editions.`,
    );
  }
  if (before && after && !group.presenceAnomaly) {
    summaryParts.push(`1989 reading begins "${before}". 1992 final reading begins "${after}".`);
  }
  summaryParts.push(
    'Machine comparison candidate; 1981 and 1989 readings are page-transcription extractions that need review.',
  );

  const verseTerms = group.records.slice(0, 12).map((item) => item.verse_id);
  const userTerms = [
    verseRef,
    `Quran ${verseRef}`,
    `sura ${group.chapter} verse ${group.startVerse}`,
    ...verseTerms,
    'translation change',
    'earlier translation',
    'edition difference',
  ];

  const relatedQuestions = group.presenceAnomaly
    ? [
        `Is ${verseRef} present in every edition of Rashad Khalifa's Quran translation?`,
        `Why is ${verseRef} missing from the 1992 edition?`,
        `What happened to ${verseRef} across the 1981, 1989, and 1992 editions?`,
      ]
    : [
        `How did the translation of ${verseRef} change between 1989 and 1992?`,
        `What is the final 1992 wording of ${verseRef}?`,
        `Did Rashad Khalifa revise ${verseRef} in the final edition?`,
      ];

  return {
    id: group.startVerse === group.endVerse
      ? `s${group.startVerse}`
      : `s${group.startVerse}-${group.endVerse}`,
    title: group.presenceAnomaly
      ? `${verseRef} edition presence differences (1981/1989/1992)`
      : `${verseRef} wording revised between the 1989 and 1992 editions`,
    summary: summaryParts.join(' '),
    section_kind: 'translation-evolution',
    concepts: [
      { id: 'translation-evolution', relation: 'described', explicit: true },
      { id: 'quran-editions', relation: 'described', explicit: true },
    ],
    user_terms: userTerms,
    related_questions: relatedQuestions,
    quran_references: group.records.map((item) => item.verse_id),
    retrieval_note:
      'Edition comparison metadata. Route final-wording answers to the 1992 verse text and preserve edition differences for evolution questions.',
    source_segment_start: locator.segmentStart,
    source_segment_end: locator.segmentEnd,
    page_start: locator.pageStart,
    page_end: locator.pageEnd,
    review_status: 'draft',
  };
}

interface Dossier {
  title?: string;
  archival_description?: string;
  edition_sequence?: Array<{ year?: number; status?: string }>;
}

function buildDossierSection(record: ArchiveRecord): SectionDraft {
  let dossier: Dossier = {};
  try {
    dossier = JSON.parse(readFileSync(DOSSIER_PATH, 'utf8')) as Dossier;
  } catch {
    // The dossier is optional context; the section is still generated.
  }

  const sequence = (dossier.edition_sequence ?? [])
    .map((entry) => `${entry.year}: ${String(entry.status ?? '').replace(/_/g, ' ')}`)
    .join('; ');
  const locator = locateVerseSegments(record, 128, 129);

  return {
    id: 's128-129-dossier',
    title: 'Sura 9:128-129 across the 1981, 1989, and 1992 editions',
    summary: `${dossier.archival_description ?? 'Tracks the treatment of Sura 9:128-129 across the three editions.'} Edition sequence: ${sequence}.`,
    section_kind: 'translation-evolution',
    concepts: [
      { id: 'translation-evolution', relation: 'described', explicit: true },
      { id: 'quran-editions', relation: 'described', explicit: true },
      { id: 'false-insertions', relation: 'described', explicit: true },
    ],
    user_terms: [
      '9:128',
      '9:129',
      'Quran 9:128-129',
      'sura 9 last two verses',
      'two verses of sura 9',
      'false verses',
      'false insertions',
      'removed verses',
      'ends at 9:127',
    ],
    related_questions: [
      'Why does Sura 9 end at verse 127 in the 1992 edition?',
      'What did Rashad Khalifa conclude about Quran 9:128 and 9:129?',
      'When were the last two verses of Sura 9 removed from the translation?',
    ],
    quran_references: ['9:127', '9:128', '9:129'],
    retrieval_note:
      'High-interest edition question. The 1992 main text ends at 9:127; the 1981 edition prints the passages and the 1989 edition classifies them as false insertions.',
    source_segment_start: locator.segmentStart,
    source_segment_end: locator.segmentEnd,
    page_start: locator.pageStart,
    page_end: locator.pageEnd,
    review_status: 'draft',
  };
}

function main(): void {
  const records: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const recordById = new Map(records.map((record) => [record.id, record]));
  const comparisons = loadComparisonRecords();
  const qualifying = comparisons.filter(isQualifying);
  const groups = groupVerses(qualifying);

  const groupsByChapter = new Map<number, VerseGroup[]>();
  for (const group of groups) {
    const list = groupsByChapter.get(group.chapter) ?? [];
    list.push(group);
    groupsByChapter.set(group.chapter, list);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });
  let fileCount = 0;
  let sectionCount = 0;

  for (const [chapter, chapterGroups] of [...groupsByChapter.entries()].sort((a, b) => a[0] - b[0])) {
    const canonicalId = `quran/${chapter}`;
    const record = recordById.get(canonicalId);
    if (!record?.segments?.length) {
      console.warn(`Skipping sura ${chapter}: no canonical record ${canonicalId}.`);
      continue;
    }

    const sections = chapterGroups.map((group) => buildSection(group, record));
    if (chapter === 9) sections.push(buildDossierSection(record));

    const enrichment = {
      schema_version: '1.0-quran-editions',
      document_id: `quran-editions/sura-${chapter}`,
      canonical_document_id: canonicalId,
      canonical_catalog_ids: [canonicalId],
      title: `${record.title} translation evolution (1981/1989/1992)`,
      source_class: 'quran-edition-comparison',
      review_status: 'draft',
      generation_note:
        'Generated from data/corpus/quran_three_edition_comparison.jsonl. Change classes are machine candidates; page-transcription extraction noise is possible. Review before approval.',
      sections,
    };

    writeFileSync(
      path.join(OUTPUT_DIR, `sura-${chapter}.json`),
      `${JSON.stringify(enrichment, null, 2)}\n`,
      'utf8',
    );
    fileCount += 1;
    sectionCount += sections.length;
  }

  const approxTokens = sectionCount * 130;
  console.log(`Quran edition enrichment generated:`);
  console.log(`  Suras covered: ${fileCount}`);
  console.log(`  Sections: ${sectionCount}`);
  console.log(`  Qualifying verses: ${qualifying.length} (grouped into ${groups.length} ranges)`);
  console.log(`  Approx additional embedding tokens: ${approxTokens.toLocaleString()}`);
}

main();
