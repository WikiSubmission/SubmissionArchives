'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, BookOpen, Info } from 'lucide-react';
import type { BookPreview, BookSummaryItem } from '@/lib/bookPreviews';
import BookPreviewModal from './BookPreviewModal';

type Props = {
    books: BookSummaryItem[];
    previews: Record<string, BookPreview>;
};

export default function BooksGrid({ books, previews }: Props) {
    const [selected, setSelected] = useState<BookSummaryItem | null>(null);

    return (
        <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {books.map((book) => {
                    const preview = previews[book.id];
                    const sections = preview?.toc?.length ?? 0;
                    return (
                        <button
                            key={book.id}
                            type="button"
                            onClick={() => setSelected(book)}
                            className="group relative flex flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface p-3 text-left transition-all duration-[280ms] ease-out hover:-translate-y-1 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        >
                            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-[4px] border border-ed-rule bg-ed-bg">
                                {book.thumbnailOverride ? (
                                    <Image
                                        src={book.thumbnailOverride}
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

                                {sections > 0 && (
                                    <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full border border-ed-rule bg-ed-bg/90 px-1.5 py-0.5 text-[10px] font-semibold text-ed-fg-secondary backdrop-blur-sm">
                                        <Info className="h-2.5 w-2.5 text-ed-accent" aria-hidden="true" />
                                        {sections} {sections === 1 ? 'section' : 'sections'}
                                    </span>
                                )}
                            </div>

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
                                    <span>Preview Contents</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selected && (
                <BookPreviewModal
                    book={selected}
                    preview={previews[selected.id] ?? null}
                    allBooks={books}
                    onClose={() => setSelected(null)}
                    onSelectBook={setSelected}
                />
            )}
        </>
    );
}
