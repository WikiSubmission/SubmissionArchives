import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Metadata } from 'next';
import VideosPageClient from './VideosPageClient';
import type { Media } from '@/types/media';

export const revalidate = 3600;

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

const readGeneratedIndex = cache((filename: string): unknown[] => {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown[];
});

function getVideoCatalog() {
    const catalog = readGeneratedIndex('VIDEO_PROGRAMS_LIST.json') as VideoRecord[];
    if (catalog.length > 0) return catalog;

    return (readGeneratedIndex('MASTER_INDEX.json') as VideoRecord[])
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
        sortValue: index + 1,
        displayDate: '',
    }));

    return <VideosPageClient initialVideos={videos} />;
}
