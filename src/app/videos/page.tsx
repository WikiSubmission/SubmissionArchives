import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import VideosPageClient from './VideosPageClient';
import type { Media } from '@/types/media';

export const revalidate = 3600;

type VideoRecord = Omit<Media, 'sortValue' | 'displayDate'> & {
    thumbnailOverride?: string;
    folder?: string;
    vttFile?: string;
    videoFile?: string;
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
    const videos = getVideoCatalog().map((video, index) => ({
        ...video,
        sortValue: index + 1,
        displayDate: '',
    }));

    return <VideosPageClient initialVideos={videos} />;
}
