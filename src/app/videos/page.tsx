import fs from 'fs';
import path from 'path';
import VideosPageClient from './VideosPageClient';
import type { Media } from '@/types/media';

type VideoRecord = Omit<Media, 'sortValue' | 'displayDate'> & {
    thumbnailOverride?: string;
    folder?: string;
    vttFile?: string;
    videoFile?: string;
};

function readGeneratedIndex<T>(filename: string): T[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T[];
}

function getVideoCatalog() {
    const catalog = readGeneratedIndex<VideoRecord>('VIDEO_PROGRAMS_LIST.json');
    if (catalog.length > 0) return catalog;

    return readGeneratedIndex<VideoRecord>('MASTER_INDEX.json')
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
