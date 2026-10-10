'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, BookOpen, Layers, Search, X } from 'lucide-react';
import type { BookPreview, BookSummaryItem } from '@/lib/bookPreviews';
import BookPreviewModal from './BookPreviewModal';

type Props = {
    books: BookSummaryItem[];
    previews: Record<string, BookPreview>;
};

export default function BooksGrid({ books, previews }: Props) {
    const [selected, setSelected] = useState<BookSummaryItem | null>(null);
    const [query, setQuery] = useState('');

    const visibleBooks = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        if (!normalizedQuery) return books;
        return books.filter((book) =>
            [book.title, book.displayTitle, book.author, book.year?.toString()]
                .filter(Boolean)
                .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery)),
        );
    }, [books, query]);

    return (
        <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-ed-fg-secondary">
                    Browse the preserved editions and open any table of contents to jump directly to a section.
                </p>
                <div className="flex shrink-0 items-center gap-3">
                    <label className="relative block w-full sm:w-[260px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" aria-hidden="true" />
                        <span className="sr-only">Search books and authors</span>
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search titles or authors"
                            className="h-10 w-full rounded-[4px] border border-ed-rule bg-ed-surface py-2 pl-9 pr-9 text-[12px] text-ed-fg placeholder:text-ed-fg-muted focus:border-ed-accent focus:outline-none focus:ring-2 focus:ring-ed-accent/30"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[4px] text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                aria-label="Clear book search"
                            >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                        )}
                    </label>
                    <span className="whitespace-nowrap text-[11px] font-medium tabular-nums text-ed-fg-muted" aria-live="polite">
                        {visibleBooks.length} of {books.length}
                    </span>
                </div>
            </div>

            {visibleBooks.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleBooks.map((book) => {
                        const preview = previews[book.id];
                        const sectionCount = preview?.toc?.length ?? 0;
                        return (
                            <article
                                key={book.id}
                                className="group flex min-h-[208px] overflow-hidden border border-ed-rule bg-ed-surface transition-colors duration-200 hover:border-ed-rule-strong hover:bg-ed-surface-strong"
                            >
                                <Link
                                    href={`/library/${book.id}`}
                                    className="relative block w-[112px] shrink-0 self-stretch overflow-hidden border-r border-ed-rule bg-ed-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ed-accent sm:w-[128px]"
                                    aria-label={`Read ${book.title}`}
                                >
                                    {book.thumbnailOverride ? (
                                        <Image
                                            src={book.thumbnailOverride}
                                            alt={`Cover of ${book.title}`}
                                            fill
                                            className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.025]"
                                            sizes="(max-width: 640px) 112px, 128px"
                                        />
                                    ) : (
                                        <div className="flex h-full flex-col items-center justify-center p-3 text-center text-ed-fg-muted">
                                            <BookOpen className="mb-2 h-6 w-6 opacity-50" aria-hidden="true" />
                                            <span className="text-xs font-semibold text-ed-fg" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                                {book.title}
                                            </span>
                                        </div>
                                    )}
                                </Link>

                                <div className="flex min-w-0 flex-1 flex-col p-3.5 sm:p-4">
                                    <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                                        {book.author ?? 'Dr. Rashad Khalifa'}
                                    </p>
                                    <h3
                                        className="line-clamp-3 text-[16px] font-semibold leading-[1.25] text-ed-fg transition-colors group-hover:text-ed-accent"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        <Link href={`/library/${book.id}`} className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">
                                            {book.displayTitle || book.title}
                                        </Link>
                                    </h3>
                                    <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-ed-fg-muted">
                                        {book.year && <span>{book.year}</span>}
                                        {book.year && preview?.pageCount && <span aria-hidden="true">·</span>}
                                        {preview?.pageCount && <span>{preview.pageCount} pages</span>}
                                        {sectionCount > 0 && (
                                            <span className="inline-flex items-center gap-1">
                                                <Layers className="h-3 w-3 text-ed-accent" aria-hidden="true" />
                                                {sectionCount} sections
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-auto flex items-center gap-3 border-t border-ed-rule pt-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelected(book)}
                                            className="text-[11px] font-semibold text-ed-fg-secondary transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                        >
                                            Contents
                                        </button>
                                        <Link
                                            href={`/library/${book.id}`}
                                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-ed-fg transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                        >
                                            Read book
                                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className="border-y border-ed-rule py-12 text-center">
                    <p className="font-serif text-lg text-ed-fg">No titles found</p>
                    <p className="mt-1 text-sm text-ed-fg-secondary">Try another title, author, or year.</p>
                    <button type="button" onClick={() => setQuery('')} className="mt-4 text-xs font-semibold text-ed-accent hover:text-ed-accent-strong">
                        Clear search
                    </button>
                </div>
            )}

            {selected && (
                <BookPreviewModal
                    book={selected}
                    preview={previews[selected.id] ?? null}
                    allBooks={visibleBooks}
                    onClose={() => setSelected(null)}
                    onSelectBook={setSelected}
                />
            )}
        </>
    );
}
