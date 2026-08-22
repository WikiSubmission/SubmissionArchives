import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import BiblePageClient from '@/app/quran/BiblePageClient';
import type { BibleBookSummary } from '@/app/quran/BiblePageClient';

export const revalidate = 0;

function getApocryphaBooks(): BibleBookSummary[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'BIBLE_APOCRYPHA_BOOKS.json');
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as BibleBookSummary[];
}

export const metadata: Metadata = {
    title: 'OT Apocrypha',
    description: 'Browse the 15 deuterocanonical and historical books of the Old Testament Apocrypha.',
};

export default function OTApocryphaPage() {
    const books = getApocryphaBooks();
    return <BiblePageClient books={books} testament="apocrypha" />;
}
