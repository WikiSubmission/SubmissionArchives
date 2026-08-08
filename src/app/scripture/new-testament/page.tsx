import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import BiblePageClient from '@/app/quran/BiblePageClient';
import type { BibleBookSummary } from '@/app/quran/BiblePageClient';

export const revalidate = 0;

function getNTBooks(): BibleBookSummary[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'BIBLE_NT_BOOKS.json');
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as BibleBookSummary[];
}

export const metadata: Metadata = {
    title: 'New Testament',
    description: 'Browse the books of the New Testament — the Gospels, Acts, Epistles, and Revelation.',
};

export default function NewTestamentPage() {
    const books = getNTBooks();
    return <BiblePageClient books={books} testament="new" />;
}
