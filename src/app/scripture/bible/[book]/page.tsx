import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BibleBookClient from '@/app/quran/bible/[book]/BibleBookClient';
import type { BibleBookDetail, HebrewBookData } from '@/app/quran/bible/[book]/BibleBookClient';

export const revalidate = 0;

const BOOK_CODE_TO_OT_SLUG: Record<string, string> = {
    gen: 'genesis', exo: 'exodus', lev: 'leviticus', num: 'numbers', deu: 'deuteronomy',
    jos: 'joshua', jdg: 'judges', '1sa': '1-samuel', '2sa': '2-samuel', '1ki': '1-kings', '2ki': '2-kings',
    isa: 'isaiah', jer: 'jeremiah', ezk: 'ezekiel', hos: 'hosea', joe: 'joel', amo: 'amos',
    oba: 'obadiah', jon: 'jonah', mic: 'micah', nam: 'nahum', hab: 'habakkuk', zep: 'zephaniah',
    hag: 'haggai', zec: 'zechariah', mal: 'malachi', psa: 'psalms', pro: 'proverbs', job: 'job',
    sng: 'song-of-songs', rut: 'ruth', lam: 'lamentations', ecc: 'ecclesiastes', est: 'esther',
    dan: 'daniel', ezr: 'ezra', neh: 'nehemiah', '1ch': '1-chronicles', '2ch': '2-chronicles',
};

function getBookData(bookSlug: string): BibleBookDetail | null {
    const code = bookSlug.toLowerCase();
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'bible', `${code}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as BibleBookDetail;
}

function getHebrewData(bookSlug: string): HebrewBookData | null {
    const code = bookSlug.toLowerCase();

    // Check Apocrypha parallel Hebrew dataset
    const apocryphaPath = path.join(process.cwd(), 'public', 'data', 'scriptures', 'apocrypha', `${code}.json`);
    if (fs.existsSync(apocryphaPath)) {
        try {
            return JSON.parse(fs.readFileSync(apocryphaPath, 'utf8')) as HebrewBookData;
        } catch {
            // continue to OT lookup
        }
    }

    const filename = BOOK_CODE_TO_OT_SLUG[code];
    if (!filename) return null;
    const filePath = path.join(process.cwd(), 'public', 'data', 'scriptures', 'ot', `${filename}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as HebrewBookData;
    } catch {
        return null;
    }
}

type PageProps = {
    params: Promise<{ book: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { book: bookSlug } = await params;
    const book = getBookData(bookSlug);
    if (!book) {
        return { title: 'Book Not Found' };
    }
    return {
        title: `${book.bookName} | ${book.testament}`,
        description: `Read ${book.bookName} (${book.testament}, ${book.category}) in Submission Archives — ${book.chapterCount} chapters, ${book.verseCount} verses.`,
    };
}

export default async function BibleBookPage({ params }: PageProps) {
    const { book: bookSlug } = await params;
    const book = getBookData(bookSlug);
    if (!book) {
        notFound();
    }

    const hebrewData = getHebrewData(bookSlug);

    return <BibleBookClient book={book} hebrewData={hebrewData} />;
}
