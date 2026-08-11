import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Metadata } from 'next';
import VideosPageClient from './VideosPageClient';
import type { Media } from '@/types/media';

export const revalidate = 86400;

export const metadata: Metadata = {
    title: 'Video Archives',
    description: 'Video programs, instructional works, Friday sermons, and conference recordings by Dr. Rashad Khalifa.',
};

type VideoRecord = Omit<Media, 'sortValue' | 'displayDate'> & {
    thumbnailOverride?: string;
    folder?: string;
    vttFile?: string;
    videoFile?: string;
    youtubeId?: string;
    youtubeUrl?: string;
    youtubeStartTime?: number;
    youtubeEndTime?: number;
};

const SOURCE_CATALOG_DIR = path.join(process.cwd(), 'data', 'catalog');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'data', 'generated_indices');

const readJsonIndex = cache((filePath: string): unknown[] => {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown[];
});

function getVideoCatalog() {
    const catalog = readJsonIndex(path.join(SOURCE_CATALOG_DIR, 'videos.json')) as VideoRecord[];
    if (catalog.length > 0) return catalog;

    return (readJsonIndex(path.join(GENERATED_DIR, 'MASTER_INDEX.json')) as VideoRecord[])
        .filter((item) => item.type === 'video-program' || item.type === 'sermon' || item.type === 'video');
}

export default function VideosPage() {
    // Slim card DTO: only the fields the card UI and categorization logic use,
    // keeping the serialized RSC payload small.
    const videos: Media[] = getVideoCatalog().map((video, index) => ({
        id: video.id,
        type: video.type,
        title: video.title,
        displayTitle: video.displayTitle,
        author: video.author,
        duration_seconds: video.duration_seconds,
        thumbnailOverride: video.thumbnailOverride,
        // Needed by the card's play button to resolve a playback source.
        youtubeId: video.youtubeId,
        sortValue: index + 1,
        displayDate: '',
    }));

    return <VideosPageClient initialVideos={videos} />;
}
