'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BOOKS_OT, BOOKS_APOCRYPHA } from '@/lib/scriptureUtils';

// Temporary hardcoded list for NT until we get the full list
const BOOKS_NT = [
    "Mark", "Matthew", "Luke", "John", "Thomas"
];

const SURAS = Array.from({ length: 114 }, (_, i) => `Sura ${i + 1}`);

export default function BookSelectionPage() {
    const params = useParams();
    const source = params.source as string;

    let books: string[] = [];
    let title = '';

    switch (source) {
        case 'old-testament':
            books = BOOKS_OT;
            title = 'Old Testament Books';
            break;
        case 'new-testament':
            books = BOOKS_NT;
            title = 'New Testament Books';
            break;
        case 'apocrypha':
            books = BOOKS_APOCRYPHA;
            title = 'Apocrypha';
            break;
        case 'quran':
            books = SURAS;
            title = 'Quran Suras';
            break;
        default:
            return <div>Invalid Source</div>;
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="max-w-7xl mx-auto mb-8">
                <Link href="/scripture" className="text-muted-foreground hover:text-foreground transition-colors mb-4 inline-block text-sm">
                    ← Back to Sources
                </Link>
                <h1 className="text-3xl font-bold">{title}</h1>
            </header>

            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {books.map((book, i) => {
                    // For Quran, we use number as chapter, likely
                    // For Bible, we go to Chapter 1


                    return (
                        <Link
                            key={book}
                            // Redirect directly to compare? The logic in [book]/[chapter] will handle it, or we can link directly.
                            // But linking to the old path lets the redirect logic file doing the normalization work if needed.
                            // However, we want to ensure the params are correct.
                            href={source === 'quran' ? `/scripture/compare?refs=quran.Sura_${i + 1}.1` : `/scripture/compare?refs=${source}.${book.replace(/ /g, '_')}.1`}
                            className="p-4 bg-muted border border-border rounded-lg hover:border-primary hover:bg-muted/80 transition-all font-medium text-foreground"
                        >
                            {book}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
