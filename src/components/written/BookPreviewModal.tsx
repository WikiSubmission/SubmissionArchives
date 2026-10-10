'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, FileText, Layers, User, X } from 'lucide-react';
import type { BookPreview, BookSummaryItem } from '@/lib/bookPreviews';

type Props = {
    book: BookSummaryItem | null;
    preview: BookPreview | null;
    allBooks: BookSummaryItem[];
    onClose: () => void;
    onSelectBook: (book: BookSummaryItem) => void;
};

export default function BookPreviewModal({ book, preview, allBooks, onClose, onSelectBook }: Props) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const currentIndex = book ? allBooks.findIndex((item) => item.id === book.id) : -1;
    const prevBook = currentIndex > 0 ? allBooks[currentIndex - 1] : null;
    const nextBook = currentIndex >= 0 && currentIndex < allBooks.length - 1 ? allBooks[currentIndex + 1] : null;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
        else if (event.key === 'ArrowLeft' && prevBook) onSelectBook(prevBook);
        else if (event.key === 'ArrowRight' && nextBook) onSelectBook(nextBook);
    }, [onClose, onSelectBook, prevBook, nextBook]);

    useEffect(() => {
        if (!book) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        dialogRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
            previousFocus?.focus();
        };
    }, [book, handleKeyDown]);

    if (!book) return null;

    const toc = preview?.toc ?? [];
    const pageCount = preview?.pageCount;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-modal-title"
            ref={dialogRef}
            onKeyDown={(event) => {
                if (event.key !== 'Tab') return;
                const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? []);
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
        >
            <button type="button" aria-label="Close book preview" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/75" />

            <div className="relative flex max-h-[94dvh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-bg shadow-2xl sm:max-h-[90dvh]">
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-ed-rule px-4 py-4 sm:px-6 sm:py-5">
                    <div className="min-w-0">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ed-accent">Book preview</p>
                        <h2 id="book-modal-title" className="max-w-[60ch] text-xl font-semibold leading-tight text-ed-fg sm:text-2xl" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                            {book.displayTitle || book.title}
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close preview"
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-ed-rule text-ed-fg-secondary transition-colors hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                    >
                        <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                </header>

                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[264px_minmax(0,1fr)] md:overflow-hidden">
                    <aside className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-ed-rule bg-ed-surface p-4 sm:grid-cols-[108px_minmax(0,1fr)] md:flex md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:p-6">
                        <div className="relative aspect-[2/3] w-full overflow-hidden border border-ed-rule bg-[#F5F0EB] md:mx-auto md:max-w-[190px]">
                            {book.thumbnailOverride ? (
                                <Image src={book.thumbnailOverride} alt={`Cover of ${book.title}`} fill className="object-contain p-1" sizes="(max-width: 768px) 108px, 190px" />
                            ) : (
                                <div className="flex h-full flex-col items-center justify-center p-3 text-center text-ed-fg-muted">
                                    <BookOpen className="mb-2 h-7 w-7 opacity-50" aria-hidden="true" />
                                    <span className="text-xs font-semibold text-ed-fg">{book.title}</span>
                                </div>
                            )}
                        </div>

                        <dl className="flex min-w-0 flex-col justify-center gap-3 text-[12px] md:mt-5 md:justify-start">
                            {book.author && <div>
                                <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted"><User className="h-3 w-3 text-ed-accent" aria-hidden="true" />Author</dt>
                                <dd className="mt-1 text-ed-fg">{book.author}</dd>
                            </div>}
                            {(book.year || pageCount || toc.length > 0) && <div>
                                <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted"><Layers className="h-3 w-3 text-ed-accent" aria-hidden="true" />Edition details</dt>
                                <dd className="mt-1 leading-relaxed text-ed-fg-secondary">
                                    {[book.year, pageCount ? `${pageCount} pages` : null, toc.length ? `${toc.length} sections` : null].filter(Boolean).join(' · ')}
                                </dd>
                            </div>}
                            {book.transcriptionMethod && <div className="col-span-2 border-t border-ed-rule pt-3 sm:col-span-1 md:mt-1">
                                <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted"><FileText className="h-3 w-3 text-ed-accent" aria-hidden="true" />Text record</dt>
                                <dd className="mt-1 leading-relaxed text-ed-fg-secondary">{book.transcriptionMethod}</dd>
                            </div>}
                        </dl>
                    </aside>

                    <section className="flex min-h-[360px] min-w-0 flex-col overflow-hidden p-4 sm:p-6">
                        {preview?.description && (
                            <p className="mb-5 max-w-[72ch] border-b border-ed-rule pb-5 text-[14px] leading-[1.65] text-ed-fg-secondary" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>
                                {preview.description}
                            </p>
                        )}

                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ed-fg">Contents</h3>
                            <span className="text-[11px] tabular-nums text-ed-fg-muted">
                                {toc.length ? `${toc.length} verified headings` : 'No verified headings'}
                            </span>
                        </div>

                        {toc.length > 0 ? (
                            <ol className="min-h-0 flex-1 divide-y divide-ed-rule overflow-y-auto border-y border-ed-rule">
                                {toc.map((entry, index) => (
                                    <li key={`${entry.page}-${index}`}>
                                        <Link
                                            href={`/library/${book.id}?page=${entry.page}`}
                                            className="group grid min-h-11 grid-cols-[2rem_minmax(0,1fr)_3.5rem] items-center gap-3 px-2 py-2.5 transition-colors hover:bg-ed-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ed-accent sm:px-3"
                                        >
                                            <span className="text-right font-mono text-[10px] tabular-nums text-ed-fg-muted">{String(index + 1).padStart(2, '0')}</span>
                                            <span className="min-w-0 text-[13px] leading-snug text-ed-fg transition-colors group-hover:text-ed-accent" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                                {entry.title}
                                            </span>
                                            <span className="text-right font-mono text-[10px] tabular-nums text-ed-fg-muted">p. {entry.page}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="border-y border-ed-rule py-6 text-[13px] leading-relaxed text-ed-fg-secondary">
                                No section headings could be verified against this scan. Open the book to browse the original page by page.
                            </p>
                        )}
                    </section>
                </div>

                <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-ed-rule bg-ed-surface px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => prevBook && onSelectBook(prevBook)}
                            disabled={!prevBook}
                            className="inline-flex h-10 items-center gap-1 rounded-[4px] px-2 text-[11px] font-medium text-ed-fg-secondary transition-colors hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent disabled:opacity-40"
                            aria-label={prevBook ? `Previous book: ${prevBook.title}` : 'No previous book'}
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Previous</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => nextBook && onSelectBook(nextBook)}
                            disabled={!nextBook}
                            className="inline-flex h-10 items-center gap-1 rounded-[4px] px-2 text-[11px] font-medium text-ed-fg-secondary transition-colors hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent disabled:opacity-40"
                            aria-label={nextBook ? `Next book: ${nextBook.title}` : 'No next book'}
                        >
                            <span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <span className="hidden text-[10px] text-ed-fg-muted md:inline">← → to browse books</span>
                    </div>
                    <Link
                        href={`/library/${book.id}`}
                        className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-ed-fg px-4 text-[12px] font-semibold text-ed-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-surface"
                    >
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        Read full book
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                </footer>
            </div>
        </div>
    );
}
