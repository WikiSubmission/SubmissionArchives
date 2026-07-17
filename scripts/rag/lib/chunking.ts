import type { ArchiveRecord, ArchiveSegment } from '../../../src/types/archive';

export type RagChunkKind = 'precision' | 'context';

export interface RagChunkDraft {
  chunkIndex: number;
  chunkKind: RagChunkKind;
  text: string;
  startTime: number | null;
  endTime: number | null;
  page: number | null;
  speaker: string | null;
  label: string | null;
  sourceSegmentStart: number | null;
  sourceSegmentEnd: number | null;
  editionYear: number | null;
  evidenceKind: string;
  verseId: string | null;
}

interface IndexedSegment extends ArchiveSegment {
  sourceSegmentStart: number;
  sourceSegmentEnd: number;
}

const TIMED_TYPES = new Set([
  'video-program',
  'sermon',
  'video',
  'quran-study',
  'messenger-audio',
  'audio',
]);

const PRECISION_MAX_CHARS = 760;
const PRECISION_MAX_GAP_SECONDS = 24;
const CONTEXT_TARGET_CHARS = 1_450;
const CONTEXT_MAX_CHARS = 1_900;
const CONTEXT_OVERLAP_SEGMENTS = 1;

function normalizeSegments(segments: ArchiveSegment[]): IndexedSegment[] {
  return segments
    .map((segment, index) => ({
      ...segment,
      text: segment.text.replace(/\s+/g, ' ').trim(),
      sourceSegmentStart: index,
      sourceSegmentEnd: index,
    }))
    .filter((segment) => segment.text.length > 0);
}

function mergeAdjacentSpokenSegments(segments: IndexedSegment[]): IndexedSegment[] {
  const merged: IndexedSegment[] = [];

  for (const segment of segments) {
    const last = merged[merged.length - 1];
    const sameSpeaker = last && (last.speaker ?? null) === (segment.speaker ?? null);
    const gap = last ? segment.start - last.end : Number.POSITIVE_INFINITY;
    const combinedLength = last ? last.text.length + 1 + segment.text.length : segment.text.length;

    if (
      last
      && sameSpeaker
      && gap >= 0
      && gap <= PRECISION_MAX_GAP_SECONDS
      && combinedLength <= PRECISION_MAX_CHARS
    ) {
      merged[merged.length - 1] = {
        ...last,
        end: segment.end,
        text: `${last.text} ${segment.text}`,
        label: last.label ?? segment.label,
        sourceSegmentEnd: segment.sourceSegmentEnd,
      };
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}

function commonValue(values: Array<string | undefined>): string | null {
  const normalized = values.filter((value): value is string => Boolean(value?.trim()));
  if (normalized.length === 0) return null;
  return normalized.every((value) => value === normalized[0]) ? normalized[0] : null;
}

function buildContextWindows(segments: IndexedSegment[]): IndexedSegment[] {
  const windows: IndexedSegment[] = [];
  let startIndex = 0;

  while (startIndex < segments.length) {
    let endIndex = startIndex;
    let length = 0;

    while (endIndex < segments.length) {
      const next = segments[endIndex];
      const nextLength = length + (length > 0 ? 1 : 0) + next.text.length;
      if (endIndex > startIndex && nextLength > CONTEXT_MAX_CHARS) break;

      length = nextLength;
      endIndex += 1;
      if (length >= CONTEXT_TARGET_CHARS) break;
    }

    if (endIndex === startIndex) endIndex += 1;

    const selected = segments.slice(startIndex, endIndex);
    const first = selected[0];
    const last = selected[selected.length - 1];

    windows.push({
      start: first.start,
      end: last.end,
      text: selected
        .map((segment) => (segment.speaker ? `${segment.speaker}: ${segment.text}` : segment.text))
        .join('\n'),
      speaker: commonValue(selected.map((segment) => segment.speaker)) ?? undefined,
      label: commonValue(selected.map((segment) => segment.label)) ?? selected[0].label,
      page: commonPage(selected),
      sourceSegmentStart: first.sourceSegmentStart,
      sourceSegmentEnd: last.sourceSegmentEnd,
    });

    if (endIndex >= segments.length) break;
    startIndex = Math.max(startIndex + 1, endIndex - CONTEXT_OVERLAP_SEGMENTS);
  }

  return windows;
}

function commonPage(segments: IndexedSegment[]): number | undefined {
  const pages = segments
    .map((segment) => segment.page)
    .filter((value): value is number => Number.isInteger(value));
  if (pages.length === 0) return undefined;
  return pages.every((page) => page === pages[0]) ? pages[0] : undefined;
}

function inferEditionYear(record: ArchiveRecord, segment: ArchiveSegment): number | null {
  const labelYear = segment.label?.match(/(?:^|[-_])(19\d{2}|20\d{2})(?:$|[-_])/i)?.[1];
  if (labelYear) return Number(labelYear);
  if (Number.isInteger(record.editionYear)) return record.editionYear ?? null;
  if (record.type === 'quran') return 1992;
  return null;
}

function inferEvidenceKind(record: ArchiveRecord, segment: ArchiveSegment): string {
  const label = segment.label?.toLocaleLowerCase() ?? '';
  if (label.startsWith('verse')) return 'quran-verse';
  if (label.startsWith('footnote')) return 'quran-footnote';
  if (label.startsWith('subtitle')) return 'quran-subtitle';
  if (label.startsWith('heading')) return 'quran-heading';
  if (label.startsWith('appendix')) return 'appendix';
  if (label.startsWith('page')) return 'written-page';
  if (TIMED_TYPES.has(record.type)) return 'spoken-transcript';
  if (record.type === 'quran') return 'quran-passage';
  return 'archive-passage';
}

function inferVerseId(record: ArchiveRecord, segment: ArchiveSegment): string | null {
  if (record.type !== 'quran') return null;
  const chapter = record.id.match(/^quran\/(\d+)$/)?.[1];
  if (!chapter || !Number.isFinite(segment.start)) return null;
  return `${chapter}:${Math.max(0, Math.trunc(segment.start))}`;
}

function toDraft(
  record: ArchiveRecord,
  segment: IndexedSegment,
  chunkIndex: number,
  chunkKind: RagChunkKind,
): RagChunkDraft {
  const isTimed = TIMED_TYPES.has(record.type);
  const isQuran = record.type === 'quran';

  return {
    chunkIndex,
    chunkKind,
    text: segment.text,
    startTime: isTimed ? segment.start : null,
    endTime: isTimed ? segment.end : null,
    page: isQuran ? Math.trunc(segment.start) : (segment.page ?? null),
    speaker: segment.speaker ?? null,
    label: segment.label ?? null,
    sourceSegmentStart: segment.sourceSegmentStart,
    sourceSegmentEnd: segment.sourceSegmentEnd,
    editionYear: inferEditionYear(record, segment),
    evidenceKind: inferEvidenceKind(record, segment),
    verseId: inferVerseId(record, segment),
  };
}

export function buildChunks(record: ArchiveRecord): RagChunkDraft[] {
  const normalized = normalizeSegments(record.segments);
  const isTimed = TIMED_TYPES.has(record.type);
  const precisionSegments = isTimed ? mergeAdjacentSpokenSegments(normalized) : normalized;

  const precisionChunks = precisionSegments.map((segment, index) =>
    toDraft(record, segment, index, 'precision'),
  );

  if (!isTimed || precisionSegments.length < 2) return precisionChunks;

  const contextWindows = buildContextWindows(precisionSegments);
  const contextChunks = contextWindows.map((segment, index) =>
    toDraft(record, segment, precisionChunks.length + index, 'context'),
  );

  return [...precisionChunks, ...contextChunks];
}
