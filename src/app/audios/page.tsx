import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import AudiosPageClient from './AudiosPageClient';
import type { Media } from '@/types/media';

export const revalidate = 3600;

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

    const master = (readGeneratedIndex('MASTER_INDEX.json') as AudioRecord[])
        .filter((item) => item.type === 'quran-study' || item.type === 'messenger-audio');
    if (master.length > 0) return master;

    return readGeneratedIndex('ALL_AUDIOS.json') as AudioRecord[];
}

export default function AudiosPage() {
    const audios = getAudioCatalog().map((audio, index) => ({
        ...audio,
        sortValue: index + 1,
        displayDate: '',
    }));

    return <AudiosPageClient initialAudios={audios} />;
}
