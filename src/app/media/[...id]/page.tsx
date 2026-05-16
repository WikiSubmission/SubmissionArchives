import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import { formatMedia } from '@/lib/formatUtils';
import { getMediaAssetUrl } from '@/lib/mediaAssets';
import Player from './Player';

type LocalMediaItem = {
  id: string;
  title: string;
  type: string;
  folder: string;
  date?: string;
  created_at?: string;
  videoFile?: string;
  audioFile?: string;
  vttFile?: string;
  thumbnailOverride?: string;
  duration_seconds?: number;
  primaryNumber?: number;
  alternateNumbers?: string[];
  alternateNumberLabel?: string;
};

type PlayerSegment = {
  id: number;
  start_time: number;
  end_time: number;
  speaker: string;
  content: string;
  segment_index?: number;
};

type TranscriptJson = PlayerSegment[] | { segments?: PlayerSegment[] };

type MasterIndexItem = LocalMediaItem & {
  segments?: Array<{
    start?: number;
    end?: number;
    text?: string;
  }>;
};

function getLocalIndex(filename: string): LocalMediaItem[] {
  const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function getVideoCatalog(masterIndex: MasterIndexItem[]) {
  const videos = getLocalIndex('VIDEO_PROGRAMS_LIST.json');
  if (videos.length > 0) return videos;

  return masterIndex.filter((item) =>
    item.type === 'video-program' || item.type === 'sermon' || item.type === 'video'
  ) as LocalMediaItem[];
}

function getAudioCatalog(masterIndex: MasterIndexItem[]) {
  const audios = getLocalIndex('AUDIOS_LIST.json');
  if (audios.length > 0) return audios;

  const masterAudios = masterIndex.filter((item) =>
    item.type === 'quran-study' || item.type === 'messenger-audio' || item.type === 'audio'
  ) as LocalMediaItem[];
  if (masterAudios.length > 0) return masterAudios;

  return getLocalIndex('ALL_AUDIOS.json');
}

function parseVttTimestamp(timestamp: string): number {
  if (!timestamp) return 0;
  const parts = timestamp.split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds += parseInt(parts[0], 10) * 3600;
    seconds += parseInt(parts[1], 10) * 60;
    seconds += parseFloat(parts[2]);
  } else if (parts.length === 2) {
    seconds += parseInt(parts[0], 10) * 60;
    seconds += parseFloat(parts[1]);
  }
  return seconds;
}

function parseVTT(vttContent: string): PlayerSegment[] {
  const segments: PlayerSegment[] = [];
  const normalized = vttContent.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  let index = 0;
  const speakerPattern = /(?:^|\s)((?:Dr\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):/g;

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    if (lines[0].startsWith('WEBVTT')) continue;
    if (lines[0].startsWith('NOTE')) continue;
    if (lines[0].startsWith('Kind:')) continue;
    if (lines[0].startsWith('Language:')) continue;

    const timeLineIdx = lines.findIndex(l => l.includes('-->'));
    if (timeLineIdx === -1) continue;

    const timeLine = lines[timeLineIdx];
    const [startStr, endStrPart] = timeLine.split('-->').map(s => s.trim());
    const endStr = endStrPart ? endStrPart.split(' ')[0] : startStr;

    const start = parseVttTimestamp(startStr);
    const end = parseVttTimestamp(endStr);
    let content = lines.slice(timeLineIdx + 1).join(' ');
    content = content.replace(/<<[^>]*>/g, '').trim();
    content = content.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    if (!content) continue;

    const matches = Array.from(content.matchAll(speakerPattern));
    if (matches.length === 0) {
      segments.push({ id: index++, start_time: start, end_time: end, speaker: 'Dr. Rashad Khalifa', content, segment_index: index });
      continue;
    }

    const totalDuration = end - start;
    const subSegments: Array<{ speaker: string; content: string }> = [];
    const firstMatchStart = matches[0].index!;
    if (firstMatchStart > 0) {
      const preText = content.substring(0, firstMatchStart).trim();
      if (preText) subSegments.push({ speaker: 'Dr. Rashad Khalifa', content: preText });
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const speakerName = match[1].trim();
      const contentStart = match.index! + match[0].length;
      const contentEnd = (i < matches.length - 1) ? matches[i + 1].index! : content.length;
      const speechText = content.substring(contentStart, contentEnd).trim();
      if (speechText) subSegments.push({ speaker: speakerName, content: speechText });
    }

    const segmentTotalLen = subSegments.reduce((acc, s) => acc + s.content.length, 0) || 1;
    let currentTimeCursor = start;
    for (const sub of subSegments) {
      const ratio = sub.content.length / segmentTotalLen;
      const subDuration = totalDuration * ratio;
      segments.push({
        id: index++,
        start_time: currentTimeCursor,
        end_time: currentTimeCursor + subDuration,
        speaker: sub.speaker,
        content: sub.content,
        segment_index: index
      });
      currentTimeCursor += subDuration;
    }
  }
  return segments;
}

export default async function WatchPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const initialTime = typeof t === 'string' ? parseInt(t, 10) || 0 : 0;

  const key = id.map(decodeURIComponent).join('/');
  const masterIndex = getLocalIndex('MASTER_INDEX.json') as MasterIndexItem[];
  const allVideos = getVideoCatalog(masterIndex);
  const allAudios = getAudioCatalog(masterIndex);

  let item = allVideos.find(v => v.id === key);
  let isVideo = true;
  if (!item) {
    item = allAudios.find(a => a.id === key);
    isVideo = false;
  }
  if (!item) notFound();

  const { displayTitle, displayDate, author } = formatMedia(item);
  const publicDir = path.join(process.cwd(), 'public');
  const masterItem = masterIndex.find((record) => record.id === key);
  const mediaUrl = getMediaAssetUrl(item);
  let transcriptPath = '';

  if (isVideo) {
    transcriptPath = path.join(publicDir, 'content', 'video', item.folder, item.vttFile || '');
  } else {
    const subFolder = item.type === 'quran-study' ? 'quran-studies' : 'messenger-audios';
    transcriptPath = path.join(publicDir, 'content', 'audio', subFolder, item.folder, item.vttFile || '');
  }

  let segments: PlayerSegment[] = (masterItem?.segments || []).map((segment, index) => ({
    id: index,
    start_time: segment.start ?? 0,
    end_time: segment.end ?? segment.start ?? 0,
    speaker: 'Dr. Rashad Khalifa',
    content: segment.text ?? '',
    segment_index: index + 1,
  })).filter((segment) => segment.content);

  try {
    if (segments.length === 0 && fs.existsSync(transcriptPath)) {
      const content = fs.readFileSync(transcriptPath, 'utf-8');
      if (transcriptPath.endsWith('.vtt')) segments = parseVTT(content);
      else if (transcriptPath.endsWith('.json')) {
        const json = JSON.parse(content) as TranscriptJson;
        segments = Array.isArray(json) ? json : (json.segments || []);
      }
    }
  } catch (err) {
    console.error('Failed to load transcript:', err);
  }

  const collection = isVideo ? allVideos : allAudios;
  const idx = collection.findIndex(m => m.id === key);
  const prevItem = idx > 0 ? collection[idx - 1] : null;
  const nextItem = idx < collection.length - 1 ? collection[idx + 1] : null;

  const prev = prevItem ? { id: prevItem.id, title: formatMedia(prevItem).displayTitle } : undefined;
  const next = nextItem ? { id: nextItem.id, title: formatMedia(nextItem).displayTitle } : undefined;

  return (
    <Player
      media={{ ...item, displayTitle, displayDate, author, type: item.type }}
      segments={segments}
      mediaUrl={mediaUrl}
      prev={prev}
      next={next}
      initialTime={initialTime}
    />
  );
}
