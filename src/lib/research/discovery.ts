import audios from '../../../data/catalog/audios.json';
import videos from '../../../data/catalog/videos.json';
import books from '../../../public/data/generated_indices/BOOKS_LIST.json';
import { getNewsletterIssues } from '../newsletterCatalog';
import { getMediaHref } from '../utils';
export interface DiscoveryRecord { id: string; title: string; kind: string; url: string; year?: number; dateKind: string; topics: string[]; }
const SUBJECTS: Record<string, string[]> = {
    'video-program/what-is-life-all-about': ['Life and purpose'],
    'video-program/who-is-god': ['God'],
    'video-program/witness-a-miracle': ['Mathematical structure'],
    'miracle-of-quran-alphabets': ['Mathematical structure'],
    'perpetual-miracle': ['Mathematical structure'],
    'quran-hadith-islam': ['Quran studies'],
};
export function getDiscoveryRecords(): DiscoveryRecord[] {
    const media = [...audios, ...videos].map(raw => {
        const record = raw as typeof raw & { year?: number; fullDate?: string; dateSource?: string };
        return { id: record.id, title: record.displayTitle || record.title, kind: record.type, url: getMediaHref(record.id),
            year: record.year, dateKind: record.dateSource === 'youtube_upload_date' ? 'Uploaded' : 'Catalog date (kind unspecified)',
            topics: SUBJECTS[record.id] ?? (record.type === 'quran-study' ? ['Quran studies'] : []) };
    });
    const publications = books.map(raw => {
        const record = raw as typeof raw & { editionYear?: number };
        return { id: record.id, title: record.displayTitle || record.title, kind: 'book', url: `/library/${record.id}`, year: record.editionYear,
            dateKind: 'Published edition', topics: SUBJECTS[record.id] ?? [] };
    });
    const newsletters = getNewsletterIssues().map(record => ({ id: record.id, title: record.title, kind: 'newsletter', url: `/library/${record.id}`, year: record.year, dateKind: 'Published', topics: [] }));
    return [...media, ...publications, ...newsletters].sort((a,b) => (a.year ?? Infinity) - (b.year ?? Infinity) || a.title.localeCompare(b.title));
}
