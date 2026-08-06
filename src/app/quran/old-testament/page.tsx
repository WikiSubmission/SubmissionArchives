import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import BiblePageClient from '../BiblePageClient';
import type { BibleBookSummary } from '../BiblePageClient';

export const revalidate = 0;

function getOTBooks(): BibleBookSummary[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'BIBLE_OT_BOOKS.json');
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as BibleBookSummary[];
}

export const metadata: Metadata = {
    title: 'Old Testament',
    description: 'Browse the books of the Old Testament — Genesis through Malachi and deuterocanonical writings.',
};

export default function OldTestamentPage() {
    const books = getOTBooks();
    return <BiblePageClient books={books} testament="old" />;
}
