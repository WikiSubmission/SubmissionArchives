export interface Segment {
  id: number;
  start_time: number;
  end_time: number;
  speaker: string;
  content: string;
  segment_index?: number;
}

export interface TranscriptParagraph {
  id: string;
  speaker: string;
  start_time: number;
  end_time: number;
  text: string;
  segments: Segment[];
}

export interface ChapterMarker {
  id: number;
  startTime: number;
  endTime?: number;
  title: string;
  description?: string;
  speaker?: string;
}

/**
 * Condenses individual 1-5 second caption cues into readable paragraphs.
 * Groups contiguous cues by the same speaker while respecting natural pauses
 * and sentence boundaries.
 */
export function buildTranscriptParagraphs(
  segments: Segment[],
  options: {
    maxDurationSeconds?: number;
    maxGapSeconds?: number;
    maxCharacters?: number;
  } = {}
): TranscriptParagraph[] {
  if (!segments || segments.length === 0) return [];

  const {
    maxDurationSeconds = 45,
    maxGapSeconds = 3.5,
    maxCharacters = 450,
  } = options;

  const paragraphs: TranscriptParagraph[] = [];
  let currentGroup: Segment[] = [];
  let currentSpeaker = '';
  let groupStartTime = 0;
  let groupEndTime = 0;
  let groupCharCount = 0;

  function flushGroup() {
    if (currentGroup.length === 0) return;

    // Join content cleanly
    const text = currentGroup
      .map((s) => s.content.trim())
      .filter(Boolean)
      .join(' ');

    paragraphs.push({
      id: `p-${paragraphs.length}-${currentGroup[0].id}`,
      speaker: currentSpeaker,
      start_time: groupStartTime,
      end_time: groupEndTime,
      text,
      segments: [...currentGroup],
    });

    currentGroup = [];
    groupCharCount = 0;
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (!seg.content?.trim()) continue;

    const speaker = seg.speaker?.trim() || 'Speaker';
    const durationSoFar = seg.end_time - groupStartTime;
    const gap = currentGroup.length > 0 ? seg.start_time - groupEndTime : 0;
    const isSameSpeaker = speaker.toLowerCase() === currentSpeaker.toLowerCase();

    // Check if this segment should start a new paragraph
    const shouldBreak =
      currentGroup.length > 0 &&
      (!isSameSpeaker ||
        gap > maxGapSeconds ||
        durationSoFar > maxDurationSeconds ||
        groupCharCount > maxCharacters);

    if (shouldBreak) {
      flushGroup();
    }

    if (currentGroup.length === 0) {
      currentSpeaker = speaker;
      groupStartTime = seg.start_time;
      groupEndTime = seg.end_time;
      groupCharCount = 0;
    }

    currentGroup.push(seg);
    groupEndTime = Math.max(groupEndTime, seg.end_time);
    groupCharCount += seg.content.length + 1;
  }

  flushGroup();
  return paragraphs;
}

/**
 * Finds the currently active chapter index based on the player's current playback time.
 */
export function getActiveChapterIndex(
  chapters: ChapterMarker[],
  currentTime: number
): number {
  if (!chapters || chapters.length === 0) return -1;

  for (let i = chapters.length - 1; i >= 0; i--) {
    const chapter = chapters[i];
    if (!chapter) continue;
    if (currentTime >= chapter.startTime) {
      if (typeof chapter.endTime === 'number' && currentTime > chapter.endTime) {
        continue;
      }
      return i;
    }
  }

  return 0;
}
