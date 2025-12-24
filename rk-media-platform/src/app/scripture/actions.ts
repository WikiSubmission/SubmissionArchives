'use server';

import fs from 'fs/promises';
import path from 'path';

// --- QURAN TYPES ---
interface QuranVerseRaw {
    chapter_number: number;
    verse_number: number;
    verse_text_english: string;
    verse_text_arabic: string;
    verse_footnote_english: string | null;
    chapter_title_english: string;
}

// --- BIBLE TYPES ---
interface BibleBook {
    abbrev: string;
    chapters: string[][]; // Array of chapters, each chapter is Array of verse strings
    name?: string; // Sometimes provided
}

// --- MACULA GREEK TYPES ---
export interface GreekToken {
    text: string;
    lemma: string;
    morph: string;
    gloss: string;
    after: string;
}

export interface ScriptureVerse {
    num: number;
    he: string; // Used for raw text or initial display
    en: string;
    footnote?: string;
    footnotes?: string[]; // New field for WEB footnotes
    tokens?: GreekToken[]; // New field for interactive Greek
}

export interface ScriptureChapterData {
    ref: string;
    verses: ScriptureVerse[];
    next?: boolean;
    prev?: boolean;
    totalChapters?: number;
}

// --- HELPERS ---
const NT_BOOKS_MAP: Record<string, string> = {
    'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT', 'Romans': 'ROM',
    '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH',
    'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH', '2 Thessalonians': '2TH',
    '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
    'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
    '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
    'Thomas': 'THO'
};

const QURAN_PATH = path.join(process.cwd(), '../QURAN TRANSLATIONS/1992 Quran.json');
const GREEK_NT_PATH = path.join(process.cwd(), 'public/data/greek_nt/el_greek.json'); // Legacy
const WEB_NT_PATH = path.join(process.cwd(), 'public/data/web_nt.json');

// --- CACHE ---
let quranCache: QuranVerseRaw[] | null = null;
let webNtCache: any[] | null = null; // Cache for WEB data -- forcing reload (Cache busted 3)

async function getQuranData(): Promise<QuranVerseRaw[]> {
    if (quranCache) return quranCache;
    try {
        const filePath = path.resolve(process.cwd(), '../QURAN TRANSLATIONS/1992 Quran.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        quranCache = JSON.parse(fileContent);
        return quranCache!;
    } catch (error) {
        console.error("Error reading Quran JSON:", error);
        return [];
    }
}

async function getWebNtData(): Promise<any[]> {
    if (webNtCache) return webNtCache;
    try {
        const content = await fs.readFile(WEB_NT_PATH, 'utf-8');
        webNtCache = JSON.parse(content);
        return webNtCache!;
    } catch (e) {
        console.error("Error reading WEB NT JSON:", e);
        return [];
    }
}

async function getMaculaChapter(bookCode: string, chapter: number): Promise<any | null> {
    try {
        const filePath = path.join(process.cwd(), 'public/data/greek_nt', `${bookCode}_${chapter}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        // console.warn(`Macula file not found: ${bookCode}_${chapter}.json`);
        return null;
    }
}

async function getQuranMorphChapter(chapter: number): Promise<any | null> {
    try {
        const filePath = path.join(process.cwd(), 'public/data/quran_morph', `Sura_${chapter}.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        return null; // File might not exist yet
    }
}

// --- API ---

export async function fetchQuranChapter(chapter: number): Promise<ScriptureChapterData | null> {
    const data = await getQuranData();
    const chapterVerses = data.filter(v => v.chapter_number === chapter);
    const morphData = await getQuranMorphChapter(chapter);

    if (chapterVerses.length === 0) return null;

    return {
        ref: `Sura ${chapter}: ${chapterVerses[0].chapter_title_english}`,
        verses: chapterVerses.map(v => {
            const verseNum = v.verse_number;
            let tokens: GreekToken[] | undefined = undefined;

            // Try to find tokens for this verse
            if (morphData && morphData.verses) {
                const morphVerse = morphData.verses.find((mv: any) => mv.verse === verseNum);
                if (morphVerse) {
                    tokens = morphVerse.tokens;
                }
            }

            return {
                num: verseNum,
                he: v.verse_text_arabic, // Keep original as fallback or comparison
                en: v.verse_text_english,
                footnote: v.verse_footnote_english || undefined,
                tokens: tokens
            };
        }),
        prev: chapter > 1,
        next: chapter < 114,
        totalChapters: 114
    };
}

export async function fetchNTChapter(bookName: string, chapter: number): Promise<ScriptureChapterData | null> {
    // 1. Resolve Book Code
    const normalizedName = bookName.replace(/_/g, ' ');
    const bookCode = NT_BOOKS_MAP[normalizedName];

    if (!bookCode) {
        console.error(`Book not found in map: ${normalizedName}`);
        return null;
    }

    // 2. Fetch Macula Greek Data (Tokenized)
    const maculaData = await getMaculaChapter(bookCode, chapter);

    // 3. Fetch English Translation (WEB from web_nt.json)
    const webBooks = await getWebNtData();
    // WEB JSON structure: [{ abbrev: 'MAT', name: 'Matthew', chapters: [ [ {num:1, text:..., footnotes:[]}, ... ] ] }]

    // Find book by ID (USFX ID matches our NT_BOOKS_MAP values mostly? Let's check)
    // NT_BOOKS_MAP values are 'MAT', 'MRK', etc. My script uses the same keys.
    const webBook = webBooks.find((b: any) => b.abbrev === bookCode);

    // webBook.chapters is Array of Arrays of verses
    const webVerses = webBook?.chapters[chapter - 1] || [];
    // webVerses is Array of {num, text, footnotes}

    // 4. Transform to ScriptureChapterData
    const verses: ScriptureVerse[] = [];

    // If we have Macula data, iterate its verses and merge English
    if (maculaData && maculaData.verses) {
        for (const v of maculaData.verses) {
            const vNum = v.verse;
            // Join tokens for raw text display (fallback)
            const rawGreek = v.tokens.map((t: any) => t.text + t.after).join('');

            // Find matching English verse
            const engVerseObj = webVerses.find((wv: any) => wv.num === vNum);

            verses.push({
                num: vNum,
                he: rawGreek,
                en: engVerseObj?.text || '',
                footnotes: engVerseObj?.footnotes || [],
                tokens: v.tokens
            });
        }
    } else {
        // Fallback: Use English only if Greek missing (e.g. if file not found)
        if (webVerses.length > 0) {
            for (const wv of webVerses) {
                verses.push({
                    num: wv.num,
                    he: '',
                    en: wv.text,
                    footnotes: wv.footnotes || [],
                });
            }
        } else {
            return null;
        }
    }

    // Determine next/prev logic
    const totalChapters = webBook?.chapters.length || 28;

    return {
        ref: `${normalizedName} ${chapter}`,
        verses,
        prev: chapter > 1,
        next: chapter < totalChapters,
        totalChapters
    };
}

