import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpRight, BookOpen } from 'lucide-react';

import booksData from '../../../public/data/generated_indices/BOOKS_LIST.json';
import { getNewsletterIssues } from '@/lib/newsletterCatalog';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import SubmittersPerspectiveGrid from '@/components/written/SubmittersPerspectiveGrid';

export const revalidate = 86400;

export const metadata: Metadata = {
    title: 'Written Archives — Submission Archives',
    description:
        'Preserved books, study publications, newsletters, appendices, and historical scans from Masjid Tucson (1974–1990).',
};

const preferredBookOrder = [
    'quran1981',
    'hard-cover-1989',
    'quran-revised-edition',
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
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-ed-fg-muted">
                        <a href="/" className="text-ed-fg-muted transition-colors hover:text-ed-accent">
                            Submission Archives
                        </a>
                        <span className="text-ed-fg-faint">/</span>
                        <span className="text-ed-fg-secondary">Written Archives</span>
                    </nav>

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
                    <section aria-labelledby="featured-books" className="mb-16">
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

                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {books.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/library/${book.id}`}
                                    className="group relative flex flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface p-3 transition-all duration-[280ms] ease-out hover:-translate-y-1 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:shadow-md"
                                >
                                    {/* Cover Aspect Ratio 2:3 */}
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[4px] border border-ed-rule bg-ed-bg">
                                        {book.thumbnailOverride ? (
                                            <Image
                                                src={getPublicAssetUrl(book.thumbnailOverride)}
                                                alt={`Cover of ${book.title}`}
                                                fill
                                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-ed-fg-muted">
                                                <BookOpen className="mb-2 h-6 w-6 opacity-40" />
                                                <span
                                                    className="text-xs font-semibold text-ed-fg"
                                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                                >
                                                    {book.title}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Book Details */}
                                    <div className="mt-3 flex flex-1 flex-col justify-between">
                                        <div>
                                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-ed-accent">
                                                {book.author ?? 'Dr. Rashad Khalifa'}
                                            </span>
                                            <h3
                                                className="line-clamp-2 text-[14.5px] font-semibold leading-[1.3] text-ed-fg transition-colors group-hover:text-ed-accent"
                                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                            >
                                                {book.title}
                                            </h3>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-ed-rule pt-2 text-[11px] font-medium text-ed-fg-muted group-hover:text-ed-fg">
                                            <span>Open Work</span>
                                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Section 2: Submitters Perspectives Newsletters */}
                    <section aria-labelledby="submitters-perspectives" className="mb-16">
                        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-ed-rule pb-3">
                            <div className="flex items-center gap-4 flex-1">
                                <h2
                                    id="submitters-perspectives"
                                    className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-ed-fg"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    Submitters Perspective
                                </h2>
                                <div className="h-px flex-1 bg-ed-rule" />
                                <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-ed-fg-muted">
                                    {newsletterIssues.length} issues (1985–1990)
                                </span>
                            </div>

                            <Link
                                href="/search?filters=perspective"
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ed-accent transition-colors hover:opacity-90"
                            >
                                Search All Issues
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                        </div>

                        <SubmittersPerspectiveGrid issues={newsletterIssues} />
                    </section>

                    {/* Page Footer */}
                    <footer className="mt-16 border-t border-ed-rule py-9 text-center text-[12px] font-medium tracking-[0.04em] text-ed-fg-muted">
                        Dedicated to preserving and sharing the message of God alone.
                    </footer>
                </div>
            </main>
        </div>
    );
}