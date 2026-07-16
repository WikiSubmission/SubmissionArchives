import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { formatMedia } from '@/lib/formatUtils';
import { getMediaAssetUrl, getMediaPlaybackWindow, getPublicAssetUrl } from '@/lib/mediaAssets';
import { SITE_NAME } from '@/config/site';
export const dynamicParams = true;

import PlayerWrapper from './PlayerWrapper';

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
  youtubeId?: string;
  youtubeUrl?: string;
  youtubeStartTime?: number;
  youtubeEndTime?: number;
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

type MasterIndexItem = LocalMediaItem & {
  segments?: Array<{
    start?: number;
    end?: number;
    text?: string;
    speaker?: string;
  }>;
  segments_ar?: Array<{
    start?: number;
    end?: number;
    text?: string;
    speaker?: string;
  }>;
};

const SOURCE_CATALOG_DIR = path.join(process.cwd(), 'data', 'catalog');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'data', 'generated_indices');

const getLocalIndex = cache((filePath: string): LocalMediaItem[] => {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
});

function getVideoCatalog(masterIndex: MasterIndexItem[]) {
  const videos = getLocalIndex(path.join(SOURCE_CATALOG_DIR, 'videos.json'));
  if (videos.length > 0) return videos;

  return masterIndex.filter((item) =>
    item.type === 'video-program' || item.type === 'sermon' || item.type === 'video'
  ) as LocalMediaItem[];
}

function getAudioCatalog(masterIndex: MasterIndexItem[]) {
  const audios = getLocalIndex(path.join(SOURCE_CATALOG_DIR, 'audios.json'));
  if (audios.length > 0) return audios;

  return masterIndex.filter((item) =>
    item.type === 'quran-study' || item.type === 'messenger-audio' || item.type === 'audio'
  ) as LocalMediaItem[];
}

export async function generateStaticParams() {
  const masterIndex = getLocalIndex(path.join(GENERATED_DIR, 'MASTER_INDEX.json')) as MasterIndexItem[];
  const allMedia = [...getVideoCatalog(masterIndex), ...getAudioCatalog(masterIndex)];
  const seen = new Set<string>();

  return allMedia
    .filter((item) => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .map((item) => ({
      id: item.id.split('/').filter(Boolean),
    }));
}

function findCatalogItem(key: string) {
  const masterIndex = getLocalIndex(path.join(GENERATED_DIR, 'MASTER_INDEX.json')) as MasterIndexItem[];
  const allVideos = getVideoCatalog(masterIndex);
  const allAudios = getAudioCatalog(masterIndex);
  return allVideos.find((v) => v.id === key) || allAudios.find((a) => a.id === key);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string[] }>;
}): Promise<Metadata> {
  const { id } = await params;
  const key = id.map(decodeURIComponent).join('/');
  const item = findCatalogItem(key);
  if (!item) return { title: 'Not Found' };

  const { displayTitle, displayDate, author } = formatMedia(item);
  const description = displayDate ? `${displayTitle}: ${displayDate}, by ${author}.` : `${displayTitle}, by ${author}.`;
  const image = item.thumbnailOverride ? [getPublicAssetUrl(item.thumbnailOverride)] : ['/og-card.png'];

  return {
    title: displayTitle,
    description,
    openGraph: {
      title: displayTitle,
      description,
      type: 'video.other',
      siteName: SITE_NAME,
      url: `/media/${id.join('/')}`,
      images: image,
    },
    twitter: {
      card: 'summary_large_image',
      title: displayTitle,
      description,
      images: image,
    },
  };
}

export default async function WatchPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const requestedTime = resolvedSearchParams?.t ? Number(resolvedSearchParams.t) : undefined;
  const initialSeekTime = Number.isFinite(requestedTime) && requestedTime! >= 0 ? requestedTime : undefined;

  const key = id.map(decodeURIComponent).join('/');
  const masterIndex = getLocalIndex(path.join(GENERATED_DIR, 'MASTER_INDEX.json')) as MasterIndexItem[];
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
  const masterItem = masterIndex.find((record) => record.id === key);
  const mediaUrl = getMediaAssetUrl(item);
  const playbackWindow = getMediaPlaybackWindow(item);

  // MA 70+ transcripts come from unverified auto-generated captions with no
  // reliable speaker attribution, so they should not default to a named speaker.
  // The 1987 Debate also has multiple speakers without attribution.
  const isUnverifiedSpeakerSource = (item.type === 'messenger-audio' && (item.primaryNumber ?? 0) >= 70) || item.id === 'video-program/debate-dr-rashad-khalifa-ph-d-vs-sunni-scholars-1987';
  const defaultSpeaker = isUnverifiedSpeakerSource ? '' : 'Dr. Rashad Khalifa';
  const transcriptDisclaimer = (item.type === 'messenger-audio' && (item.primaryNumber ?? 0) >= 70) ? 'MA 70-100 are NOT hand-transcribed.' : undefined;

  const segments: PlayerSegment[] = (masterItem?.segments || []).map((segment, index) => ({
    id: index,
    start_time: segment.start ?? 0,
    end_time: segment.end ?? segment.start ?? 0,
    speaker: segment.speaker || defaultSpeaker,
    content: segment.text ?? '',
    segment_index: index + 1,
  })).filter((segment) => segment.content);

  const segments_ar: PlayerSegment[] = (masterItem?.segments_ar || []).map((segment, index) => ({
    id: index,
    start_time: segment.start ?? 0,
    end_time: segment.end ?? segment.start ?? 0,
    speaker: segment.speaker || defaultSpeaker,
    content: segment.text ?? '',
    segment_index: index + 1,
  })).filter((segment) => segment.content);

  const collection = isVideo ? allVideos : allAudios;
  const idx = collection.findIndex(m => m.id === key);
  const prevItem = idx > 0 ? collection[idx - 1] : null;


  const nextItem = idx < collection.length - 1 ? collection[idx + 1] : null;

  const prev = prevItem ? { id: prevItem.id, title: formatMedia(prevItem).displayTitle } : undefined;
  const next = nextItem ? { id: nextItem.id, title: formatMedia(nextItem).displayTitle } : undefined;

  return (
    <div className="min-h-screen bg-ed-bg text-ed-fg">
      <PlayerWrapper
        media={{ ...item, displayTitle, displayDate, author, type: item.type }}
        segments={segments}
        segments_ar={segments_ar}
        mediaUrl={mediaUrl}
        prev={prev}
        next={next}
        clipStartTime={playbackWindow.startTime}
        clipEndTime={playbackWindow.endTime}
        initialSeekTime={initialSeekTime}
        transcriptDisclaimer={transcriptDisclaimer}
      />
    </div>
  );
}