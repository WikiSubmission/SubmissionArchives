import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ArrowUpRight, BookOpenText, FileText, LibraryBig, Newspaper } from 'lucide-react';

import booksData from '../../../public/data/generated_indices/BOOKS_LIST.json';

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
        title: 'Submitter perspectives',
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

export default function WrittenArchivePage() {
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
                        {booksData.filter(book => book.category === 'Books').map((book) => (
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
            </main>
        </div>
    );
}
