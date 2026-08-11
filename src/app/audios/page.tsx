import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Metadata } from 'next';
import AudiosPageClient from './AudiosPageClient';
import type { Media } from '@/types/media';

export const revalidate = 86400;

export const metadata: Metadata = {
    title: 'Audio Archives',
    description: 'Quran studies, Friday sermons, and messenger audios by Dr. Rashad Khalifa with searchable synchronized transcripts.',
};

type AudioRecord = Media & {
    audioFile?: string;
    vttFile?: string;
    segmentCount?: number;
};

const SOURCE_CATALOG_DIR = path.join(process.cwd(), 'data', 'catalog');
const GENERATED_DIR = path.join(process.cwd(), 'public', 'data', 'generated_indices');

const readJsonIndex = cache((filePath: string): unknown[] => {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown[];
});

function getAudioCatalog() {
    const catalog = readJsonIndex(path.join(SOURCE_CATALOG_DIR, 'audios.json')) as AudioRecord[];
    if (catalog.length > 0) return catalog;

    return (readJsonIndex(path.join(GENERATED_DIR, 'MASTER_INDEX.json')) as AudioRecord[])
        .filter((item) => item.type === 'quran-study' || item.type === 'messenger-audio');
}

export default function AudiosPage() {
    // Slim card DTO: only the fields the card UI and categorization logic use,
    // keeping the serialized RSC payload small.
    const audios: Media[] = getAudioCatalog().map((audio, index) => ({
        id: audio.id,
        type: audio.type,
        title: audio.title,
        displayTitle: audio.displayTitle,
        author: audio.author,
        duration_seconds: audio.duration_seconds,
        thumbnailOverride: audio.thumbnailOverride,
        // Needed by the card's play button to resolve a playback source.
        youtubeId: audio.youtubeId,
        sortValue: index + 1,
        displayDate: '',
    }));

    return <AudiosPageClient initialAudios={audios} />;
}
