import fs from 'fs';
import path from 'path';
import type { Media } from '@/types/media';
import { getMediaAssetUrl } from '@/lib/mediaAssets';
import { getCollection, type Recording } from '@/lib/recordings';
import { formatRecordDate } from '@/lib/search/results';

type CatalogRecord = Media & {
    fullDate?: string;
    youtubeStartTime?: number;
};

const CATALOG_DIR = path.join(process.cwd(), 'data', 'catalog');
const MASTER_INDEX = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');

function readJson(filePath: string): CatalogRecord[] {
    return fs.existsSync(filePath) ? (JSON.parse(fs.readFileSync(filePath, 'utf8')) as CatalogRecord[]) : [];
}

// The source catalogs, falling back to the generated index where a catalog is missing.
function readCatalog(file: string, types: string[]): CatalogRecord[] {
    const catalog = readJson(path.join(CATALOG_DIR, file));
    return catalog.length > 0 ? catalog : readJson(MASTER_INDEX).filter((record) => types.includes(record.type));
}

// The collection heading already names the series, so its prefix is dropped from each title.
const SERIES_PREFIX = /^(?:Friday Sermon|Quran Study \d+|Messenger Audio \d+)\s*[:—–-]\s*/i;

function getNumber(record: CatalogRecord): string | undefined {
    const qsNumber = record.type === 'quran-study' ? record.id.match(/^quran-study\/(\d+)/)?.[1] : undefined;
    if (qsNumber) return `QS ${qsNumber.padStart(2, '0')}`;
    return typeof record.primaryNumber === 'number' ? `MA ${record.primaryNumber}` : undefined;
}

function toRecording(record: CatalogRecord): Recording {
    const title = record.displayTitle || record.title;
    const isAudio = record.type === 'quran-study' || record.type === 'messenger-audio';
    return {
        id: record.id,
        type: record.type,
        title,
        shortTitle: title.replace(SERIES_PREFIX, '') || title,
        collection: getCollection({ type: record.type, title }).key,
        number: getNumber(record),
        date: formatRecordDate(record.fullDate || record.date) || undefined,
        primaryNumber: record.primaryNumber,
        thumbnailOverride: record.thumbnailOverride,
        // Audio plays in the site-wide player without leaving the page.
        playUrl: isAudio && record.youtubeId ? getMediaAssetUrl(record) : undefined,
    };
}

export function getRecordings(): Recording[] {
    return [
        ...readCatalog('videos.json', ['video-program', 'sermon', 'video']),
        ...readCatalog('audios.json', ['quran-study', 'messenger-audio']),
    ].map(toRecording);
}
