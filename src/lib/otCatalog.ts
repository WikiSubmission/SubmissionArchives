import fs from 'fs';
import path from 'path';

export type OTVerse = {
    verseNumber: number;
    hebrew: string;
    english: string;
};

export type OTChapter = {
    chapterNumber: number;
    verseCount: number;
    verses: OTVerse[];
};

export type OTBook = {
    id: string;
    name: string;
    hebrewTitle: string;
    category: 'Torah' | 'Prophets' | 'Writings';
    chapterCount: number;
    chapters: OTChapter[];
};

export type OTBookSummary = {
    id: string;
    name: string;
    hebrewTitle: string;
    category: 'Torah' | 'Prophets' | 'Writings';
    chapterCount: number;
};

const OT_DIR = path.join(process.cwd(), 'public', 'data', 'scriptures', 'ot');

let otCatalogCache: OTBookSummary[] | null = null;

export function getOTCatalog(): OTBookSummary[] {
    if (otCatalogCache) return otCatalogCache;
    const catalogPath = path.join(OT_DIR, 'catalog.json');
    if (!fs.existsSync(catalogPath)) return [];
    try {
        otCatalogCache = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as OTBookSummary[];
        return otCatalogCache;
    } catch {
        return [];
    }
}

export function getOTBook(id: string): OTBook | null {
    const bookPath = path.join(OT_DIR, `${id.toLowerCase()}.json`);
    if (!fs.existsSync(bookPath)) return null;
    try {
        return JSON.parse(fs.readFileSync(bookPath, 'utf8')) as OTBook;
    } catch {
        return null;
    }
}
