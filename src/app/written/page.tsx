import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

import booksData from '../../../public/data/generated_indices/BOOKS_LIST.json';
import { getNewsletterIssues } from '@/lib/newsletterCatalog';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import SubmittersPerspectiveGrid from '@/components/written/SubmittersPerspectiveGrid';
import BooksGrid from '@/components/written/BooksGrid';
import EditorialsSection from '@/components/editorials/EditorialsSection';
import { getEditorials } from '@/lib/editorials';
import { getBookPreviews, type BookSummaryItem } from '@/lib/bookPreviews';

export const revalidate = 86400;

export const metadata: Metadata = {
    title: 'Written Archives — Submission Archives',
    description:
        'Preserved books, study publications, newsletters, appendices, and historical scans from Masjid Tucson (1974–1990).',
};

const preferredBookOrder = [
    'quran-visual-presentation',
    'miracle-of-quran-alphabets',
    'quran-hadith-islam',
    'islam-volume-1-number-1-april-1974',
    'islam-volume-1-number-2-july-1974',
    'islam-volume-1-number-3-4-january-1975',
    'perpetual-miracle',
    'computer-speaks',
] as const;

const preferredBookRank = new Map<string, number>(preferredBookOrder.map((id, index) => [id, index]));

export default function WrittenArchivePage() {
    const books = booksData
        .filter((book) => book.category === 'Books')
        .sort((left, right) => {
            const leftRank = preferredBookRank.get(left.id) ?? Number.MAX_SAFE_INTEGER;
            const rightRank = preferredBookRank.get(right.id) ?? Number.MAX_SAFE_INTEGER;
            return leftRank - rightRank || left.title.localeCompare(right.title);
        });

    const newsletterIssues = getNewsletterIssues();
    const bookPreviews = getBookPreviews();
    const editorials = getEditorials();
    // Only the fields the modal renders cross to the client; the full records carry
    // transcript segments that would bloat the payload for no benefit.
    const bookSummaries: BookSummaryItem[] = books.map((book) => ({
        id: book.id,
        title: book.title,
        displayTitle: book.displayTitle,
        author: book.author,
        thumbnailOverride: book.thumbnailOverride ? getPublicAssetUrl(book.thumbnailOverride) : undefined,
        transcriptionMethod: book.transcriptionMethod,
    }));

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            {/* Ambient page glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                    {/* Hero Header */}
                    <header className="mb-10 flex flex-wrap items-end justify-between gap-8 border-b border-ed-rule pb-8">
                        <div className="max-w-[640px]">
                            <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                                Written Archive Index
                            </div>
                            <h1
                                className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                The Written Archives
                            </h1>
                            <p
                                className="text-[16.5px] leading-[1.6] text-ed-fg-secondary"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                A reading room for the historical books, translations, research studies, and preserved
                                newsletters. Transcribed and indexed for systematic study and verse verification.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-ed-rule bg-ed-surface px-6 py-4 shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-ed-fg">
                                        {books.length}
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                                        Books & Monographs
                                    </span>
                                </div>
                                <div className="flex flex-col border-l border-ed-rule pl-6">
                                    <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-ed-fg">
                                        {newsletterIssues.length}
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                                        Newsletters
                                    </span>
                                </div>
                                <div className="flex flex-col border-l border-ed-rule pl-6">
                                    <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-ed-fg">
                                        1974–90
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                                        Preserved Era
                                    </span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Section 1: Books & Publications */}
                    <section aria-label="Books & Publications" aria-labelledby="featured-books" className="mb-16">
                        <div className="mb-7 flex items-center gap-4 border-b border-ed-rule pb-3">
                            <h2
                                id="featured-books"
                                className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-ed-fg"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                Books & Publications
                            </h2>
                            <div className="h-px flex-1 bg-ed-rule" />
                            <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-ed-fg-muted">
                                {books.length} volumes
                            </span>
                        </div>

                        <BooksGrid books={bookSummaries} previews={bookPreviews} />
                    </section>

                    {/* Section 2: Submitters Perspectives Newsletters */}
                    <section aria-label="Submitters Perspectives" className="mb-16">
                        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-ed-rule pb-3">
                            <div className="flex items-center gap-4 flex-1">
                                <h2
                                    id="submitters-perspectives"
                                    className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-ed-fg"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    Submitters Perspectives
                                </h2>
                                <div className="h-px flex-1 bg-ed-rule" />
                                <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-ed-fg-muted">
                                    {newsletterIssues.length} issues (1985–1990)
                                </span>
                            </div>

                            <Link
                                href="/search?filters=perspective"
                                aria-label="Search the newsletters"
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ed-accent transition-colors hover:opacity-90"
                            >
                                Search the newsletters
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                        </div>

                        <SubmittersPerspectiveGrid issues={newsletterIssues} />
                    </section>

                    {/* Section 3: Archive Editorials */}
                    <EditorialsSection editorials={editorials} />

                    {/* Page Footer */}
                    <footer className="mt-16 border-t border-ed-rule py-9 text-center text-[12px] font-medium tracking-[0.04em] text-ed-fg-muted">
                        Dedicated to preserving and sharing the message of God alone.
                    </footer>
                </div>
            </main>
        </div>
    );
}