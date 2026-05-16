import HomePageClient from './HomePageClient';
import path from 'path';
import fs from 'fs';

export const revalidate = 0;

type LocalMediaItem = {
    id: string;
    type?: string;
    duration_seconds?: number;
    [key: string]: unknown;
};

function getLocalIndex(filename: string): LocalMediaItem[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export default async function Home() {
    // 1. Combine local media records
    const masterData = getLocalIndex('MASTER_INDEX.json');
    const videoList = getLocalIndex('VIDEO_PROGRAMS_LIST.json');
    const audioList = getLocalIndex('AUDIOS_LIST.json');
    const videosData = videoList.length > 0
        ? videoList
        : masterData.filter((item) => item.type === 'video-program' || item.type === 'sermon' || item.type === 'video');
    const audiosData = audioList.length > 0
        ? audioList
        : masterData.filter((item) => item.type === 'quran-study' || item.type === 'messenger-audio' || item.type === 'audio');

    const allMedia = [
        ...videosData,
        ...audiosData
    ];

    // 2. Load durations if available
    const durationsPath = path.join(process.cwd(), 'src', 'data', 'mediaDurations.json');
    let durationMap: Record<string, number> = {};

    if (fs.existsSync(durationsPath)) {
        try {
            durationMap = JSON.parse(fs.readFileSync(durationsPath, 'utf-8'));
        } catch {
            console.error("Failed to load media durations map");
        }
    }

    // 3. Inject durations and format for client
    const enrichedMedia = allMedia.map(item => ({
        ...item,
        duration_seconds: item.duration_seconds || durationMap[item.id] || 0
    }));

    // Pass data to Client Component
    return <HomePageClient initialMedia={enrichedMedia} />;
}
