/**
 * build-apocrypha-index.mjs
 *
 * Reads raw Sefaria JSON datasets from data/sources/apocrypha/ (15 titles)
 * and generates:
 * 1. public/data/generated_indices/BIBLE_APOCRYPHA_BOOKS.json (Catalog index)
 * 2. public/data/generated_indices/bible/{slug}.json (Standard BibleBookDetail for Reader)
 * 3. public/data/scriptures/apocrypha/{slug}.json (Parallel Hebrew dataset)
 *
 * Usage:
 *   node scripts/generate/build-apocrypha-index.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const SRC_DIR = path.join(ROOT, 'data', 'sources', 'apocrypha');
const OUT_INDICES_DIR = path.join(ROOT, 'public', 'data', 'generated_indices');
const OUT_BIBLE_DIR = path.join(OUT_INDICES_DIR, 'bible');
const OUT_HEBREW_DIR = path.join(ROOT, 'public', 'data', 'scriptures', 'apocrypha');

// Ensure output directories exist
fs.mkdirSync(OUT_INDICES_DIR, { recursive: true });
fs.mkdirSync(OUT_BIBLE_DIR, { recursive: true });
fs.mkdirSync(OUT_HEBREW_DIR, { recursive: true });

const APOCRYPHA_METADATA = [
    // 1. Historical & Narrative (6 books)
    {
        folder: 'the-book-of-maccabees-i',
        slug: '1-maccabees',
        aliases: ['the-book-of-maccabees-i', '1ma', '1-maccabees'],
        name: '1 Maccabees',
        hebrewTitle: 'ספר מקבים א׳',
        category: 'Historical & Narrative',
        order: 1,
    },
    {
        folder: 'the-book-of-maccabees-ii',
        slug: '2-maccabees',
        aliases: ['the-book-of-maccabees-ii', '2ma', '2-maccabees'],
        name: '2 Maccabees',
        hebrewTitle: 'ספר מקבים ב׳',
        category: 'Historical & Narrative',
        order: 2,
    },
    {
        folder: 'the-book-of-maccabees-i-kahana-translation',
        slug: '1-maccabees-kahana',
        aliases: ['the-book-of-maccabees-i-kahana-translation'],
        name: '1 Maccabees (Kahana)',
        hebrewTitle: 'מקבים א׳ (תרגום כהנא)',
        category: 'Historical & Narrative',
        order: 3,
    },
    {
        folder: 'book-of-tobit',
        slug: 'tobit',
        aliases: ['book-of-tobit', 'tob'],
        name: 'Tobit',
        hebrewTitle: 'טוביה',
        category: 'Historical & Narrative',
        order: 4,
    },
    {
        folder: 'book-of-judith',
        slug: 'judith',
        aliases: ['book-of-judith', 'jdt'],
        name: 'Judith',
        hebrewTitle: 'יהודית',
        category: 'Historical & Narrative',
        order: 5,
    },
    {
        folder: 'megillat-antiochus',
        slug: 'megillat-antiochus',
        aliases: ['megillat-antiochus', 'antiochus'],
        name: 'Megillat Antiochus',
        hebrewTitle: 'מגילת אנטיוכוס',
        category: 'Historical & Narrative',
        order: 6,
    },

    // 2. Wisdom & Poetry (5 books)
    {
        folder: 'the-wisdom-of-solomon',
        slug: 'wisdom-of-solomon',
        aliases: ['the-wisdom-of-solomon', 'wis'],
        name: 'Wisdom of Solomon',
        hebrewTitle: 'חכמת שלמה',
        category: 'Wisdom & Poetry',
        order: 7,
    },
    {
        folder: 'ben-sira',
        slug: 'sirach',
        aliases: ['ben-sira', 'sir', 'ecclesiasticus'],
        name: 'Sirach (Ben Sira)',
        hebrewTitle: 'בן סירא',
        category: 'Wisdom & Poetry',
        order: 8,
    },
    {
        folder: 'psalm-151',
        slug: 'psalm-151',
        aliases: ['psalm-151', 'ps151', 'psx'],
        name: 'Psalm 151',
        hebrewTitle: 'תהילים קנ״א',
        category: 'Wisdom & Poetry',
        order: 9,
    },
    {
        folder: 'psalm-154',
        slug: 'psalm-154',
        aliases: ['psalm-154', 'ps154'],
        name: 'Psalm 154',
        hebrewTitle: 'תהילים קנ״ד',
        category: 'Wisdom & Poetry',
        order: 10,
    },
    {
        folder: 'prayer-of-manasseh',
        slug: 'prayer-of-manasseh',
        aliases: ['prayer-of-manasseh', 'prm'],
        name: 'Prayer of Manasseh',
        hebrewTitle: 'תפילת מנשה',
        category: 'Wisdom & Poetry',
        order: 11,
    },

    // 3. Pseudepigrapha & Additions (4 books)
    {
        folder: 'book-of-jubilees',
        slug: 'jubilees',
        aliases: ['book-of-jubilees', 'jub'],
        name: 'Book of Jubilees',
        hebrewTitle: 'ספר היובלים',
        category: 'Pseudepigrapha & Additions',
        order: 12,
    },
    {
        folder: 'the-testaments-of-the-twelve-patriarchs',
        slug: 'testaments-twelve-patriarchs',
        aliases: ['the-testaments-of-the-twelve-patriarchs', 'testaments'],
        name: 'Testaments of the 12 Patriarchs',
        hebrewTitle: 'צוואות השבטים',
        category: 'Pseudepigrapha & Additions',
        order: 13,
    },
    {
        folder: 'the-book-of-susanna',
        slug: 'susanna',
        aliases: ['the-book-of-susanna', 'sus'],
        name: 'Book of Susanna',
        hebrewTitle: 'ספר שושנה',
        category: 'Pseudepigrapha & Additions',
        order: 14,
    },
    {
        folder: 'letter-of-aristeas',
        slug: 'letter-of-aristeas',
        aliases: ['letter-of-aristeas', 'aristeas'],
        name: 'Letter of Aristeas',
        hebrewTitle: 'איגרת אריסטיאס',
        category: 'Pseudepigrapha & Additions',
        order: 15,
    },
];

function extractChapterList(rawText) {
    if (!rawText) return [];
    if (Array.isArray(rawText)) {
        if (typeof rawText[0] === 'string') {
            return [{ subheading: undefined, verses: rawText }];
        }
        return rawText.map((ch) => ({
            subheading: undefined,
            verses: Array.isArray(ch) ? ch : [String(ch)],
        }));
    }
    if (typeof rawText === 'object') {
        const list = [];
        for (const [sectionKey, sectionContent] of Object.entries(rawText)) {
            if (Array.isArray(sectionContent)) {
                sectionContent.forEach((ch, chIdx) => {
                    const partLabel = sectionContent.length > 1 ? ` (Part ${chIdx + 1})` : '';
                    list.push({
                        subheading: `${sectionKey}${partLabel}`,
                        verses: Array.isArray(ch) ? ch : [String(ch)],
                    });
                });
            }
        }
        return list;
    }
    return [];
}

function cleanVerse(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

const catalogSummaries = [];

for (const meta of APOCRYPHA_METADATA) {
    const enPath = path.join(SRC_DIR, meta.folder, 'english.json');
    const hePath = path.join(SRC_DIR, meta.folder, 'hebrew.json');

    if (!fs.existsSync(enPath)) {
        console.warn(`Missing english file for ${meta.folder}: ${enPath}`);
        continue;
    }

    const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const heData = fs.existsSync(hePath) ? JSON.parse(fs.readFileSync(hePath, 'utf8')) : null;

    const enChaptersRaw = extractChapterList(enData.text);
    const heChaptersRaw = heData ? extractChapterList(heData.text) : [];

    const totalChapters = Math.max(enChaptersRaw.length, heChaptersRaw.length);

    let totalVerses = 0;
    const chapters = [];
    const hebrewChapters = [];

    for (let c = 0; c < totalChapters; c++) {
        const enObj = enChaptersRaw[c] || { verses: [] };
        const heObj = heChaptersRaw[c] || { verses: [] };

        const enVersesRaw = enObj.verses || [];
        const heVersesRaw = heObj.verses || [];
        const maxVerses = Math.max(enVersesRaw.length, heVersesRaw.length);

        const verses = [];
        const hebrewVerseList = [];

        for (let v = 0; v < maxVerses; v++) {
            const enText = cleanVerse(enVersesRaw[v] || '');
            const heText = cleanVerse(heVersesRaw[v] || '');

            if (enText || heText) {
                verses.push({
                    verseNumber: v + 1,
                    text: enText || heText,
                });

                hebrewVerseList.push({
                    verseNumber: v + 1,
                    hebrew: heText,
                    english: enText,
                });
            }
        }

        totalVerses += verses.length;

        chapters.push({
            chapterNumber: c + 1,
            verseCount: verses.length,
            subheading: enObj.subheading,
            verses,
        });

        hebrewChapters.push({
            chapterNumber: c + 1,
            verseCount: hebrewVerseList.length,
            verses: hebrewVerseList,
        });
    }

    // 1. BibleBookDetail structure
    const bookDetail = {
        bookCode: meta.slug,
        bookName: meta.name,
        testament: 'Apocrypha',
        category: meta.category,
        order: meta.order,
        chapterCount: chapters.length,
        verseCount: totalVerses,
        chapters,
    };

    // Write primary book detail JSON
    fs.writeFileSync(
        path.join(OUT_BIBLE_DIR, `${meta.slug}.json`),
        JSON.stringify(bookDetail, null, 2)
    );

    // Also write aliases for direct resolution (e.g. `tob`, `book-of-tobit`)
    for (const alias of meta.aliases) {
        if (alias !== meta.slug) {
            fs.writeFileSync(
                path.join(OUT_BIBLE_DIR, `${alias}.json`),
                JSON.stringify(bookDetail, null, 2)
            );
        }
    }

    // 2. Parallel Hebrew structure
    const hebrewDetail = {
        id: meta.slug,
        name: meta.name,
        hebrewTitle: enData.heTitle || meta.hebrewTitle,
        category: meta.category,
        chapterCount: hebrewChapters.length,
        chapters: hebrewChapters,
    };

    fs.writeFileSync(
        path.join(OUT_HEBREW_DIR, `${meta.slug}.json`),
        JSON.stringify(hebrewDetail, null, 2)
    );

    for (const alias of meta.aliases) {
        if (alias !== meta.slug) {
            fs.writeFileSync(
                path.join(OUT_HEBREW_DIR, `${alias}.json`),
                JSON.stringify(hebrewDetail, null, 2)
            );
        }
    }

    // 3. Catalog Summary Entry
    catalogSummaries.push({
        bookCode: meta.slug,
        bookName: meta.name,
        hebrewTitle: enData.heTitle || meta.hebrewTitle,
        category: meta.category,
        order: meta.order,
        chapterCount: chapters.length,
        verseCount: totalVerses,
    });
}

// Write master Apocrypha catalog index
fs.writeFileSync(
    path.join(OUT_INDICES_DIR, 'BIBLE_APOCRYPHA_BOOKS.json'),
    JSON.stringify(catalogSummaries, null, 2)
);

console.log(`Successfully built OT Apocrypha indices: ${catalogSummaries.length} books.`);
