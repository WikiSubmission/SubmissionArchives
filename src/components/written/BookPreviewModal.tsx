'use client';

import { useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Layers, User, X } from 'lucide-react';
import type { BookPreview, BookSummaryItem } from '@/lib/bookPreviews';

type Props = {
    book: BookSummaryItem | null;
    preview: BookPreview | null;
    allBooks: BookSummaryItem[];
    onClose: () => void;
    onSelectBook: (book: BookSummaryItem) => void;
};

export default function BookPreviewModal({
    book,
    preview,
    allBooks,
    onClose,
    onSelectBook,
}: Props) {
    const currentIndex = book ? allBooks.findIndex((b) => b.id === book.id) : -1;
    const prevBook = currentIndex > 0 ? allBooks[currentIndex - 1] : null;
    const nextBook =
        currentIndex >= 0 && currentIndex < allBooks.length - 1 ? allBooks[currentIndex + 1] : null;

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            else if (e.key === 'ArrowLeft' && prevBook) onSelectBook(prevBook);
            else if (e.key === 'ArrowRight' && nextBook) onSelectBook(nextBook);
        },
        [onClose, onSelectBook, prevBook, nextBook],
    );

    useEffect(() => {
        if (!book) return;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
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
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
        >
            <button
                type="button"
                aria-label="Close preview"
                onClick={onClose}
                className="absolute inset-0 h-full w-full cursor-default bg-black/70 backdrop-blur-sm"
            />

            <div className="relative flex max-h-[92vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-[10px] border border-ed-rule bg-ed-bg shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close preview"
                    className="absolute right-3 top-3 z-10 rounded-full border border-ed-rule bg-ed-bg/90 p-1.5 text-ed-fg-secondary transition-colors hover:bg-ed-surface-strong hover:text-ed-fg"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[280px_1fr]">
                    {/* Left: cover and metadata */}
                    <div className="border-b border-ed-rule bg-ed-surface p-4 sm:p-6 md:border-b-0 md:border-r">
                        <div className="relative mx-auto aspect-[2/3] w-full max-w-[200px] overflow-hidden rounded-[6px] border border-ed-rule bg-ed-bg">
                            {book.thumbnailOverride ? (
                                <Image
                                    src={book.thumbnailOverride}
                                    alt={`Cover of ${book.title}`}
                                    fill
                                    className="object-cover"
                                    sizes="200px"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-ed-fg-muted">
                                    <BookOpen className="h-8 w-8 opacity-40" />
                                </div>
                            )}
                        </div>

                        <dl className="mt-5 space-y-3.5">
                            {book.author && (
                                <div>
                                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ed-fg-muted">
                                        <User className="h-3 w-3 text-ed-accent" />
                                        Author
                                    </dt>
                                    <dd className="mt-0.5 text-[13px] text-ed-fg">{book.author}</dd>
                                </div>
                            )}
                            {pageCount ? (
                                <div>
                                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ed-fg-muted">
                                        <Layers className="h-3 w-3 text-ed-accent" />
                                        Preservation Format
                                    </dt>
                                    <dd className="mt-0.5 text-[13px] text-ed-fg">
                                        {pageCount} Pages · Scanned Facsimile &amp; Text
                                    </dd>
                                </div>
                            ) : null}
                            {book.transcriptionMethod && (
                                <div>
                                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ed-fg-muted">
                                        <FileText className="h-3 w-3 text-ed-accent" />
                                        Transcription
                                    </dt>
                                    <dd className="mt-0.5 text-[12px] leading-[1.5] text-ed-fg-secondary">
                                        {book.transcriptionMethod}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Right: title, description, contents */}
                    <div className="flex flex-col justify-between space-y-6 p-4 sm:p-6">
                        <div className="space-y-6">
                            <div className="space-y-2 border-b border-ed-rule pb-4">
                                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                                    Books &amp; Publications
                                </div>
                                <h2
                                    id="book-modal-title"
                                    className="text-2xl font-semibold leading-[1.15] tracking-[-0.02em] text-ed-fg sm:text-3xl"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    {book.displayTitle || book.title}
                                </h2>
                                {preview?.description && (
                                    <p
                                        className="text-[14px] leading-[1.6] text-ed-fg-secondary"
                                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                    >
                                        {preview.description}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
                                        Table of Contents ({toc.length}{' '}
                                        {toc.length === 1 ? 'Section' : 'Sections'})
                                    </span>
                                    <span className="text-[11px] text-ed-fg-faint">
                                        Click an entry to open that page
                                    </span>
                                </div>

                                {toc.length === 0 && (
                                    <p className="rounded-lg border border-dashed border-ed-rule px-3.5 py-3 text-[13px] text-ed-fg-secondary">
                                        No section headings could be verified against this scan. Open the
                                        volume to browse it page by page.
                                    </p>
                                )}

                                <ol className="space-y-1.5">
                                    {toc.map((entry, idx) => (
                                        <li key={`${entry.page}-${idx}`}>
                                            {/* Each entry deep-links to the page its heading was
                                                located on, via the reader's ?page= parameter. */}
                                            <Link
                                                href={`/library/${book.id}?page=${entry.page}`}
                                                className="group flex items-baseline gap-3 rounded-md border border-transparent px-2.5 py-2 transition-colors hover:border-ed-rule hover:bg-ed-surface"
                                            >
                                                <span className="w-6 shrink-0 text-right text-[11px] font-mono text-ed-fg-faint">
                                                    {idx + 1}
                                                </span>
                                                <span
                                                    className="flex-1 text-[14px] font-medium leading-snug text-ed-fg group-hover:text-ed-accent"
                                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                                >
                                                    {entry.title}
                                                </span>
                                                <span className="shrink-0 rounded-[4px] border border-ed-accent/20 bg-ed-accent-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold text-ed-accent">
                                                    p. {entry.page}
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule bg-ed-surface px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2 text-xs font-medium text-ed-fg-muted">
                        <span>Use</span>
                        <kbd className="rounded border border-ed-rule bg-ed-bg px-1.5 py-0.5 font-mono text-[10px] text-ed-fg">←</kbd>
                        <kbd className="rounded border border-ed-rule bg-ed-bg px-1.5 py-0.5 font-mono text-[10px] text-ed-fg">→</kbd>
                        <span>to browse volumes</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex items-center rounded border border-ed-rule bg-ed-bg px-3.5 py-2 text-xs font-semibold text-ed-fg-secondary transition-colors hover:bg-ed-surface-strong hover:text-ed-fg"
                        >
                            Close
                        </button>
                        <Link
                            href={`/library/${book.id}`}
                            className="inline-flex items-center gap-2 rounded border border-ed-fg bg-ed-fg px-4 py-2 text-xs font-semibold text-ed-bg transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Read in PDF</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
