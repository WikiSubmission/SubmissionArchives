import type { ArchiveRecord, ArchiveSegment } from '../../../src/types/archive';

export interface RagChunkDraft {
  chunkIndex: number;
  text: string;
  startTime: number | null;
  endTime: number | null;
  page: number | null;
  speaker: string | null;
  label: string | null;
}

const DIALOGUE_TYPES = new Set(['quran-study', 'messenger-audio']);
const TIMED_TYPES = new Set(['video-program', 'sermon', 'video', 'quran-study', 'messenger-audio', 'audio']);

function mergeAdjacentSegments(
  segments: ArchiveSegment[],
  opts: { maxChars: number; maxGapSeconds: number },
): ArchiveSegment[] {
  const merged: ArchiveSegment[] = [];

  for (const segment of segments) {
    const last = merged[merged.length - 1];
    const sameSpeaker = last && (last.speaker ?? null) === (segment.speaker ?? null);
    const gap = last ? segment.start - last.end : Infinity;
    const combinedLength = last ? last.text.length + 1 + segment.text.length : segment.text.length;

    if (last && sameSpeaker && gap <= opts.maxGapSeconds && combinedLength <= opts.maxChars) {
      merged[merged.length - 1] = {
        ...last,
        end: segment.end,
        text: `${last.text} ${segment.text}`.trim(),
      };
    } else {
      merged.push({ ...segment });
    }
  }

  return merged;
}

export function buildChunks(record: ArchiveRecord): RagChunkDraft[] {
  const segments = DIALOGUE_TYPES.has(record.type)
    ? mergeAdjacentSegments(record.segments, { maxChars: 600, maxGapSeconds: 20 })
    : record.segments;
  const isTimed = TIMED_TYPES.has(record.type);
  const isQuran = record.type === 'quran';

  return segments
    .map((segment, index) => ({
      chunkIndex: index,
      text: segment.text.trim(),
      startTime: isTimed ? segment.start : null,
      endTime: isTimed ? segment.end : null,
      page: isQuran ? segment.start : (segment.page ?? null),
      speaker: segment.speaker ?? null,
      label: segment.label ?? null,
    }))
    .filter((chunk) => chunk.text.length > 0);
}
