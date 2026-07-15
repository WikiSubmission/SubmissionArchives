import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpRight, BookOpenText, FileText, LibraryBig, Newspaper } from 'lucide-react';

import booksData from '../../../public/data/generated_indices/BOOKS_LIST.json';
import { getNewsletterIssues } from '@/lib/newsletterCatalog';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Written Archive',
    description: 'Newsletters, appendices, historical scans, and longer written works from the Submission Archives.',
};

const collections = [
    {
        title: 'Books and major works',
        copy: 'Search the complete transcribed books and longer works in the Rashad Khalifa corpus.',
        href: '/search?filters=other',
        icon: BookOpenText,
    },
    {
        title: 'Submitters Perspectives',
        copy: 'Newsletter writing, commentary, and contextual material preserved for close study.',
        href: '/search?filters=perspective',
        icon: Newspaper,
    },
    {
        title: 'Qur\'an appendices',
        copy: 'Reference material and structured explanatory works from the translated editions.',
        href: '/search?filters=appendix',
        icon: FileText,
    },
    {
        title: 'All written records',
        copy: 'Search across every available book, newsletter, appendix, and related document.',
        href: '/search?filters=other,perspective,appendix',
        icon: LibraryBig,
    },
];

const preferredBookOrder = [
    'quran1981',
    'hard-cover-1989',
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
        <div className="min-h-screen bg-ed-bg font-body text-ed-fg">
            <main id="main-content" className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <header className="grid gap-10 border-y border-ed-rule py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                    <div className="space-y-6">
                        <p className="archive-kicker border-l-2 border-ed-accent pl-3">Written archive</p>
                        <h1 className="max-w-[12ch] font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] text-ed-fg">
                            A reading room for the written record.
                        </h1>
                    </div>
                    <div className="space-y-5 lg:pb-1">
                        <p className="max-w-[58ch] text-base leading-8 text-ed-fg-muted sm:text-lg">
                            Books, newsletters, appendices, and related documents are transcribed and connected to the same research search used by the audio, video, and Qur&apos;an collections.
                        </p>
                        <Link href="/search" className="archive-button archive-button-primary">
                            Search all written material
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>
                </header>

                <section aria-labelledby="written-collections" className="mt-16">
                    <div className="mb-8 flex flex-col gap-3 border-b border-ed-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="archive-kicker text-ed-fg-muted">Browse by collection</p>
                            <h2 id="written-collections" className="mt-3 font-display text-3xl text-ed-fg sm:text-4xl">Four entrances to the text archive</h2>
                        </div>
                        <p className="text-sm text-ed-fg-muted">Select a collection to open a pre-filtered search.</p>
                    </div>

                    <div className="border-t border-ed-rule">
                        {collections.map((collection, index) => {
                            const Icon = collection.icon;
                            return (
                                <Link
                                    key={collection.title}
                                    href={collection.href}
                                    className="group grid gap-4 border-b border-ed-rule py-7 transition-colors hover:bg-ed-surface sm:grid-cols-[4rem_1fr_auto] sm:items-center sm:px-4"
                                >
                                    <span className="flex items-center gap-3 font-mono text-sm tabular-nums text-ed-accent">
                                        {String(index + 1).padStart(2, '0')}
                                        <Icon className="h-5 w-5" aria-hidden="true" />
                                    </span>
                                    <span>
                                        <span className="block font-display text-2xl text-ed-fg transition-colors group-hover:text-ed-accent">{collection.title}</span>
                                        <span className="mt-2 block max-w-[64ch] text-sm leading-7 text-ed-fg-muted sm:text-base">{collection.copy}</span>
                                    </span>
                                    <ArrowUpRight className="h-5 w-5 text-ed-fg-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ed-accent" aria-hidden="true" />
                                </Link>
                            );
                        })}
                    </div>
                </section>

                <section aria-labelledby="featured-books" className="mt-16">
                    <div className="mb-8 flex flex-col gap-3 border-b border-ed-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="archive-kicker text-ed-fg-muted">Featured Works</p>
                            <h2 id="featured-books" className="mt-3 font-display text-3xl text-ed-fg sm:text-4xl">Books & Publications</h2>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {books.map((book) => (
                            <Link key={book.id} href={`/library/${book.id}`} className="group flex flex-col gap-3">
                                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-ed-rule bg-ed-surface transition-colors group-hover:border-ed-accent">
                                    {book.thumbnailOverride ? (
                                        <Image
                                            src={book.thumbnailOverride}
                                            alt={`Cover of ${book.title}`}
                                            fill
                                            unoptimized={true}
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-ed-surface text-ed-fg-muted">
                                            <span className="font-serif text-sm">No Cover</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-serif text-sm font-medium text-ed-fg group-hover:text-ed-accent line-clamp-2">
                                        {book.title}
                                    </h3>
                                    {book.author && (
                                        <p className="mt-1 text-xs text-ed-fg-muted">{book.author}</p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="submitters-perspectives" className="mt-20">
                    <div className="mb-8 flex flex-col gap-4 border-b border-ed-rule pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="archive-kicker text-ed-fg-muted">Newsletter archive</p>
                            <h2 id="submitters-perspectives" className="mt-3 font-display text-3xl text-ed-fg sm:text-4xl">Submitters Perspectives</h2>
                        </div>
                        <div className="flex flex-col items-start gap-3 sm:items-end">
                            <p className="text-sm text-ed-fg-muted">{newsletterIssues.length} preserved issues, 1985–1990</p>
                            <Link href="/search?filters=perspective" className="inline-flex items-center gap-2 text-sm font-medium text-ed-accent hover:underline">
                                Search the newsletters
                                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {newsletterIssues.map((issue) => (
                            <Link key={issue.id} href={`/library/${issue.id}`} className="group flex flex-col gap-3">
                                <div className="relative aspect-[17/22] w-full overflow-hidden rounded-md border border-ed-rule bg-ed-surface transition-colors group-hover:border-ed-accent">
                                    {issue.thumbnailOverride ? (
                                        <Image
                                            src={issue.thumbnailOverride}
                                            alt={`Cover of ${issue.title}`}
                                            fill
                                            unoptimized={true}
                                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-ed-surface px-4 text-center text-ed-fg-muted">
                                            <Newspaper className="h-7 w-7" aria-hidden="true" />
                                            <span className="sr-only">No cover available</span>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="line-clamp-2 font-serif text-sm font-medium text-ed-fg group-hover:text-ed-accent">
                                        {issue.title}
                                    </h3>
                                    <p className="mt-1 text-xs text-ed-fg-muted">{issue.date}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
