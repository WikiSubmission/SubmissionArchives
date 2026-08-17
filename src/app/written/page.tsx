import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpRight, BookOpen, Newspaper } from 'lucide-react';

import booksData from '../../../public/data/generated_indices/BOOKS_LIST.json';
import { getNewsletterIssues } from '@/lib/newsletterCatalog';
import { getPublicAssetUrl } from '@/lib/mediaAssets';

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
        <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans antialiased selection:bg-[#C8794A]/25 selection:text-[#F5F0EB]">
            {/* Ambient page glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-[#4A4542]">
                        <a href="/" className="text-[#6B6560] transition-colors hover:text-[#C8794A]">
                            Submission Archives
                        </a>
                        <span className="text-[#353433]">/</span>
                        <span className="text-[#6B6560]">Written Archives</span>
                    </nav>

                    {/* Hero Header */}
                    <header className="mb-10 flex flex-wrap items-end justify-between gap-8 border-b border-[#2A2928] pb-8">
                        <div className="max-w-[640px]">
                            <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-[#C8794A]/15 bg-[#C8794A]/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">
                                <BookOpen className="h-3 w-3" />
                                Written Archive Index
                            </div>
                            <h1
                                className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                The Written Archives
                            </h1>
                            <p
                                className="text-[16.5px] leading-[1.6] text-[#9E9690]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                A reading room for the historical books, translations, research studies, and preserved
                                newsletters. Transcribed and indexed for systematic study and verse verification.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-[#2A2928] bg-[#161514] px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                                        {books.length}
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                                        Books & Monographs
                                    </span>
                                </div>
                                <div className="flex flex-col border-l border-[#2A2928] pl-6">
                                    <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                                        {newsletterIssues.length}
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                                        Newsletters
                                    </span>
                                </div>
                                <div className="flex flex-col border-l border-[#2A2928] pl-6">
                                    <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                                        1974–90
                                    </span>
                                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                                        Preserved Era
                                    </span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Section 1: Books & Publications */}
                    <section aria-labelledby="featured-books" className="mb-16">
                        <div className="mb-7 flex items-center gap-4 border-b border-[#2A2928] pb-3">
                            <h2
                                id="featured-books"
                                className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                Books & Publications
                            </h2>
                            <div className="h-px flex-1 bg-[#2A2928]" />
                            <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-[#6B6560]">
                                {books.length} volumes
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {books.map((book) => (
                                <Link
                                    key={book.id}
                                    href={`/library/${book.id}`}
                                    className="group relative flex flex-col overflow-hidden rounded-[8px] border border-[#2A2928] bg-[#161514] p-3 transition-all duration-[280ms] ease-out hover:-translate-y-1 hover:border-[#353433] hover:bg-[#1C1B1A] hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                                >
                                    {/* Cover Aspect Ratio 2:3 */}
                                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[4px] border border-[#2A2928] bg-[#0F0E0D]">
                                        {book.thumbnailOverride ? (
                                            <Image
                                                src={getPublicAssetUrl(book.thumbnailOverride)}
                                                alt={`Cover of ${book.title}`}
                                                fill
                                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-[#6B6560]">
                                                <BookOpen className="mb-2 h-6 w-6 opacity-40" />
                                                <span
                                                    className="text-xs font-semibold text-[#9E9690]"
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
                                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#C8794A]">
                                                {book.author ?? 'Dr. Rashad Khalifa'}
                                            </span>
                                            <h3
                                                className="line-clamp-2 text-[14.5px] font-semibold leading-[1.3] text-[#F5F0EB] transition-colors group-hover:text-[#C8794A]"
                                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                            >
                                                {book.title}
                                            </h3>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-[#2A2928] pt-2 text-[11px] font-medium text-[#6B6560] group-hover:text-[#9E9690]">
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
                        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2928] pb-3">
                            <div className="flex items-center gap-4 flex-1">
                                <h2
                                    id="submitters-perspectives"
                                    className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    Submitters Perspective
                                </h2>
                                <div className="h-px flex-1 bg-[#2A2928]" />
                                <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-[#6B6560]">
                                    {newsletterIssues.length} issues (1985–1990)
                                </span>
                            </div>

                            <Link
                                href="/search?filters=perspective"
                                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#C8794A] transition-colors hover:text-[#D9916A]"
                            >
                                Search All Issues
                                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {newsletterIssues.map((issue) => (
                                <Link
                                    key={issue.id}
                                    href={`/library/${issue.id}`}
                                    className="group relative flex flex-col overflow-hidden rounded-[8px] border border-[#2A2928] bg-[#161514] p-3 transition-all duration-[280ms] ease-out hover:-translate-y-1 hover:border-[#353433] hover:bg-[#1C1B1A] hover:shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
                                >
                                    {/* Cover Aspect Ratio 17:22 */}
                                    <div className="relative aspect-[17/22] w-full overflow-hidden rounded-[4px] border border-[#2A2928] bg-[#0F0E0D]">
                                        {issue.thumbnailOverride ? (
                                            <Image
                                                src={issue.thumbnailOverride}
                                                alt={`Cover of ${issue.title}`}
                                                fill
                                                className="object-cover object-right transition-transform duration-500 ease-out group-hover:scale-105"
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[#0F0E0D] px-4 text-center text-[#6B6560]">
                                                <Newspaper className="h-7 w-7 opacity-40" aria-hidden="true" />
                                                <span className="sr-only">No cover available</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Newsletter Details */}
                                    <div className="mt-3 flex flex-1 flex-col justify-between">
                                        <div>
                                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6560]">
                                                {issue.date}
                                            </span>
                                            <h3
                                                className="line-clamp-2 text-[14px] font-semibold leading-[1.3] text-[#F5F0EB] transition-colors group-hover:text-[#C8794A]"
                                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                            >
                                                {issue.title}
                                            </h3>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-[#2A2928] pt-2 text-[11px] font-medium text-[#6B6560] group-hover:text-[#9E9690]">
                                            <span>Read Issue</span>
                                            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>

                    {/* Page Footer */}
                    <footer className="mt-16 border-t border-[#2A2928] py-9 text-center text-[12px] font-medium tracking-[0.04em] text-[#4A4542]">
                        Dedicated to preserving and sharing the message of God alone.
                    </footer>
                </div>
            </main>
        </div>
    );
}