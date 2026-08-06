/**
 * build-bible-index.mjs
 *
 * Parses the World English Bible VPL text file and produces two JSON index
 * files — one for the Old Testament books and one for the New Testament books.
 *
 * Usage:
 *   node scripts/generate/build-bible-index.mjs
 *
 * Input:  data/sources/bible/engwebu_vpl.txt
 * Output: public/data/generated_indices/BIBLE_OT_BOOKS.json
 *         public/data/generated_indices/BIBLE_NT_BOOKS.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const VPL_PATH = path.join(ROOT, 'data', 'sources', 'bible', 'engwebu_vpl.txt');
const OUT_DIR = path.join(ROOT, 'public', 'data', 'generated_indices');

/* ------------------------------------------------------------------ */
/* Book metadata: code → { name, testament, order }                   */
/* ------------------------------------------------------------------ */

const BOOK_META = {
    // ---- Old Testament (39 canonical books + Deuterocanon) ----
    GEN: { name: 'Genesis', testament: 'OT', category: 'Torah (The Five Books of Moses)', order: 1 },
    EXO: { name: 'Exodus', testament: 'OT', category: 'Torah (The Five Books of Moses)', order: 2 },
    LEV: { name: 'Leviticus', testament: 'OT', category: 'Torah (The Five Books of Moses)', order: 3 },
    NUM: { name: 'Numbers', testament: 'OT', category: 'Torah (The Five Books of Moses)', order: 4 },
    DEU: { name: 'Deuteronomy', testament: 'OT', category: 'Torah (The Five Books of Moses)', order: 5 },

    JOS: { name: 'Joshua', testament: 'OT', category: 'Historical Books', order: 6 },
    JDG: { name: 'Judges', testament: 'OT', category: 'Historical Books', order: 7 },
    RUT: { name: 'Ruth', testament: 'OT', category: 'Historical Books', order: 8 },
    '1SA': { name: '1 Samuel', testament: 'OT', category: 'Historical Books', order: 9 },
    '2SA': { name: '2 Samuel', testament: 'OT', category: 'Historical Books', order: 10 },
    '1KI': { name: '1 Kings', testament: 'OT', category: 'Historical Books', order: 11 },
    '2KI': { name: '2 Kings', testament: 'OT', category: 'Historical Books', order: 12 },
    '1CH': { name: '1 Chronicles', testament: 'OT', category: 'Historical Books', order: 13 },
    '2CH': { name: '2 Chronicles', testament: 'OT', category: 'Historical Books', order: 14 },
    EZR: { name: 'Ezra', testament: 'OT', category: 'Historical Books', order: 15 },
    NEH: { name: 'Nehemiah', testament: 'OT', category: 'Historical Books', order: 16 },
    EST: { name: 'Esther', testament: 'OT', category: 'Historical Books', order: 17 },

    JOB: { name: 'Job', testament: 'OT', category: 'Writings & Wisdom', order: 18 },
    PSA: { name: 'Psalms', testament: 'OT', category: 'Writings & Wisdom', order: 19 },
    PRO: { name: 'Proverbs', testament: 'OT', category: 'Writings & Wisdom', order: 20 },
    ECC: { name: 'Ecclesiastes', testament: 'OT', category: 'Writings & Wisdom', order: 21 },
    SOL: { name: 'Song of Solomon', testament: 'OT', category: 'Writings & Wisdom', order: 22 },

    ISA: { name: 'Isaiah', testament: 'OT', category: 'Prophets', order: 23 },
    JER: { name: 'Jeremiah', testament: 'OT', category: 'Prophets', order: 24 },
    LAM: { name: 'Lamentations', testament: 'OT', category: 'Prophets', order: 25 },
    EZE: { name: 'Ezekiel', testament: 'OT', category: 'Prophets', order: 26 },
    DAN: { name: 'Daniel', testament: 'OT', category: 'Prophets', order: 27 },

    HOS: { name: 'Hosea', testament: 'OT', category: 'Prophets', order: 28 },
    JOE: { name: 'Joel', testament: 'OT', category: 'Prophets', order: 29 },
    AMO: { name: 'Amos', testament: 'OT', category: 'Prophets', order: 30 },
    OBA: { name: 'Obadiah', testament: 'OT', category: 'Prophets', order: 31 },
    JON: { name: 'Jonah', testament: 'OT', category: 'Prophets', order: 32 },
    MIC: { name: 'Micah', testament: 'OT', category: 'Prophets', order: 33 },
    NAH: { name: 'Nahum', testament: 'OT', category: 'Prophets', order: 34 },
    HAB: { name: 'Habakkuk', testament: 'OT', category: 'Prophets', order: 35 },
    ZEP: { name: 'Zephaniah', testament: 'OT', category: 'Prophets', order: 36 },
    HAG: { name: 'Haggai', testament: 'OT', category: 'Prophets', order: 37 },
    ZEC: { name: 'Zechariah', testament: 'OT', category: 'Prophets', order: 38 },
    MAL: { name: 'Malachi', testament: 'OT', category: 'Prophets', order: 39 },

    // ---- Deuterocanonical / Apocryphal books ----
    TOB: { name: 'Tobit', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 40 },
    JDT: { name: 'Judith', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 41 },
    ESG: { name: 'Esther (Greek)', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 42 },
    WIS: { name: 'Wisdom of Solomon', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 43 },
    SIR: { name: 'Sirach', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 44 },
    BAR: { name: 'Baruch', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 45 },
    '1MA': { name: '1 Maccabees', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 46 },
    '2MA': { name: '2 Maccabees', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 47 },
    '1ES': { name: '1 Esdras', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 48 },
    PRM: { name: 'Prayer of Manasseh', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 49 },
    PSX: { name: 'Psalm 151', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 50 },
    '3MA': { name: '3 Maccabees', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 51 },
    '4ES': { name: '2 Esdras', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 52 },
    '4MA': { name: '4 Maccabees', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 53 },
    DNG: { name: 'Daniel (Greek)', testament: 'OT', category: 'Deuterocanonical / Apocrypha', order: 54 },

    // ---- New Testament (27 books) ----
    MAT: { name: 'Matthew', testament: 'NT', category: 'Gospels + Acts', order: 55 },
    MAR: { name: 'Mark', testament: 'NT', category: 'Gospels + Acts', order: 56 },
    LUK: { name: 'Luke', testament: 'NT', category: 'Gospels + Acts', order: 57 },
    JOH: { name: 'John', testament: 'NT', category: 'Gospels + Acts', order: 58 },
    ACT: { name: 'Acts', testament: 'NT', category: 'Gospels + Acts', order: 59 },

    ROM: { name: 'Romans', testament: 'NT', category: 'Letters of Paul', order: 60 },
    '1CO': { name: '1 Corinthians', testament: 'NT', category: 'Letters of Paul', order: 61 },
    '2CO': { name: '2 Corinthians', testament: 'NT', category: 'Letters of Paul', order: 62 },
    GAL: { name: 'Galatians', testament: 'NT', category: 'Letters of Paul', order: 63 },
    EPH: { name: 'Ephesians', testament: 'NT', category: 'Letters of Paul', order: 64 },
    PHI: { name: 'Philippians', testament: 'NT', category: 'Letters of Paul', order: 65 },
    COL: { name: 'Colossians', testament: 'NT', category: 'Letters of Paul', order: 66 },
    '1TH': { name: '1 Thessalonians', testament: 'NT', category: 'Letters of Paul', order: 67 },
    '2TH': { name: '2 Thessalonians', testament: 'NT', category: 'Letters of Paul', order: 68 },
    '1TI': { name: '1 Timothy', testament: 'NT', category: 'Letters of Paul', order: 69 },
    '2TI': { name: '2 Timothy', testament: 'NT', category: 'Letters of Paul', order: 70 },
    TIT: { name: 'Titus', testament: 'NT', category: 'Letters of Paul', order: 71 },
    PHM: { name: 'Philemon', testament: 'NT', category: 'Letters of Paul', order: 72 },
    HEB: { name: 'Hebrews', testament: 'NT', category: 'Letters of Paul', order: 73 },

    JAM: { name: 'James', testament: 'NT', category: 'Letters of Others', order: 74 },
    '1PE': { name: '1 Peter', testament: 'NT', category: 'Letters of Others', order: 75 },
    '2PE': { name: '2 Peter', testament: 'NT', category: 'Letters of Others', order: 76 },
    '1JO': { name: '1 John', testament: 'NT', category: 'Letters of Others', order: 77 },
    '2JO': { name: '2 John', testament: 'NT', category: 'Letters of Others', order: 78 },
    '3JO': { name: '3 John', testament: 'NT', category: 'Letters of Others', order: 79 },
    JUD: { name: 'Jude', testament: 'NT', category: 'Letters of Others', order: 80 },

    REV: { name: 'Revelation', testament: 'NT', category: 'Prophecy', order: 81 },
};

/* ------------------------------------------------------------------ */
/* Parse VPL file                                                     */
/* ------------------------------------------------------------------ */

const raw = fs.readFileSync(VPL_PATH, 'utf8');
const lines = raw.split('\n').filter((l) => l.trim());
/** @type {Map<string, { chapters: Map<number, Array<{ verseNumber: number; text: string }>>; verseCount: number }>} */
const books = new Map();

for (const line of lines) {
    // Format: "BOOK CHAPTER:VERSE text..."
    const match = line.match(/^(\w+)\s+(\d+):(\d+)\s+(.*)$/);
    if (!match) continue;

    const [, bookCode, chapterStr, verseStr, text] = match;
    const chapterNum = Number(chapterStr);
    const verseNum = Number(verseStr);

    if (!books.has(bookCode)) {
        books.set(bookCode, { chapters: new Map(), verseCount: 0 });
    }
    const entry = books.get(bookCode);
    if (!entry.chapters.has(chapterNum)) {
        entry.chapters.set(chapterNum, []);
    }
    entry.chapters.get(chapterNum).push({ verseNumber: verseNum, text: text.trim() });
    entry.verseCount++;
}

/* ------------------------------------------------------------------ */
/* Build output arrays & individual book JSON files                   */
/* ------------------------------------------------------------------ */

const otBooks = [];
const ntBooks = [];
const BIBLE_BOOKS_DIR = path.join(OUT_DIR, 'bible');
fs.mkdirSync(BIBLE_BOOKS_DIR, { recursive: true });

for (const [code, data] of books) {
    const meta = BOOK_META[code];
    if (!meta) {
        console.warn(`⚠  Unknown book code: ${code} — skipping`);
        continue;
    }

    const chapterList = Array.from(data.chapters.entries())
        .sort(([a], [b]) => a - b)
        .map(([chapterNumber, verses]) => ({
            chapterNumber,
            verseCount: verses.length,
            verses,
        }));

    const bookDetail = {
        bookCode: code,
        bookName: meta.name,
        testament: meta.testament === 'OT' ? 'Old Testament' : 'New Testament',
        category: meta.category,
        order: meta.order,
        chapterCount: chapterList.length,
        verseCount: data.verseCount,
        chapters: chapterList,
    };

    // Write individual book JSON
    const bookFilePath = path.join(BIBLE_BOOKS_DIR, `${code.toLowerCase()}.json`);
    fs.writeFileSync(bookFilePath, JSON.stringify(bookDetail, null, 2) + '\n');

    const summaryRecord = {
        bookCode: code,
        bookName: meta.name,
        category: meta.category,
        order: meta.order,
        chapterCount: chapterList.length,
        verseCount: data.verseCount,
    };

    if (meta.testament === 'OT') otBooks.push(summaryRecord);
    else ntBooks.push(summaryRecord);
}

otBooks.sort((a, b) => a.order - b.order);
ntBooks.sort((a, b) => a.order - b.order);

/* ------------------------------------------------------------------ */
/* Write main indices                                                 */
/* ------------------------------------------------------------------ */

fs.mkdirSync(OUT_DIR, { recursive: true });

const otPath = path.join(OUT_DIR, 'BIBLE_OT_BOOKS.json');
const ntPath = path.join(OUT_DIR, 'BIBLE_NT_BOOKS.json');

fs.writeFileSync(otPath, JSON.stringify(otBooks, null, 2) + '\n');
fs.writeFileSync(ntPath, JSON.stringify(ntBooks, null, 2) + '\n');

console.log(`✓ Old Testament: ${otBooks.length} books → ${otPath}`);
console.log(`✓ New Testament: ${ntBooks.length} books → ${ntPath}`);
console.log(`✓ Generated ${books.size} individual book files in ${BIBLE_BOOKS_DIR}`);
console.log(`  Total verses parsed: ${[...books.values()].reduce((s, b) => s + b.verseCount, 0).toLocaleString()}`);
