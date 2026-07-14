import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Metadata } from 'next';
import AudiosPageClient from './AudiosPageClient';
import type { Media } from '@/types/media';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Audio Archives',
    description: 'Quran studies, Friday sermons, and messenger audios by Dr. Rashad Khalifa with searchable synchronized transcripts.',
};

type AudioRecord = Media & {
    audioFile?: string;
    vttFile?: string;
    segmentCount?: number;
};

const readGeneratedIndex = cache((filename: string): unknown[] => {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown[];
});

function getAudioCatalog() {
    const catalog = readGeneratedIndex('AUDIOS_LIST.json') as AudioRecord[];
    if (catalog.length > 0) return catalog;

    return (readGeneratedIndex('MASTER_INDEX.json') as AudioRecord[])
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
        sortValue: index + 1,
        displayDate: '',
    }));

    return <AudiosPageClient initialAudios={audios} />;
}
