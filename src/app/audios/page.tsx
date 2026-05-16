import fs from 'fs';
import path from 'path';
import AudiosPageClient from './AudiosPageClient';
import type { Media } from '@/types/media';

type AudioRecord = Media & {
    audioFile?: string;
    vttFile?: string;
    segmentCount?: number;
};

function readGeneratedIndex<T>(filename: string): T[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T[];
}

function getAudioCatalog() {
    const catalog = readGeneratedIndex<AudioRecord>('AUDIOS_LIST.json');
    if (catalog.length > 0) return catalog;

    const master = readGeneratedIndex<AudioRecord>('MASTER_INDEX.json')
        .filter((item) => item.type === 'quran-study' || item.type === 'messenger-audio');
    if (master.length > 0) return master;

    return readGeneratedIndex<AudioRecord>('ALL_AUDIOS.json');
}

export default function AudiosPage() {
    const audios = getAudioCatalog().map((audio, index) => ({
        ...audio,
        sortValue: index + 1,
        displayDate: '',
    }));

    return <AudiosPageClient initialAudios={audios} />;
}
