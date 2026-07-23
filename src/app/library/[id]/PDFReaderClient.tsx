'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';
import type { TextContent } from 'pdfjs-dist/types/src/display/api';
import type { PageCallback } from 'react-pdf/dist/shared/types.js';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

type Props = {
    pdfUrl: string;
    title: string;
    initialPage: number;
    initialQuery: string;
    prevId?: string | null;
    nextId?: string | null;
    backHref?: string;
};

type TextItem = {
    str: string;
    itemIndex: number;
};

// Scanned/OCR'd PDFs often lay out text one glyph (or a few) per text item, so a
// search term almost never appears inside a single item's own string. Instead we
// concatenate every item's text on the page (ignoring whitespace and punctuation,
// since OCR spacing/apostrophes are unreliable), find each individual search term
// in that combined stream, and map matches back to which items they span so each
// one can be highlighted individually. Terms are matched independently (not as one
// literal phrase) to mirror how the search results page highlights matches — a
// multi-word query like "quran mathematical miracle" should highlight each word
// wherever it appears, not only if that exact phrase occurs in that exact order.
function computeHighlightRanges(items: TextItem[], terms: string[]): Map<number, Array<[number, number]>> {
    const ranges = new Map<number, Array<[number, number]>>();
    if (terms.length === 0) return ranges;

    const charMap: Array<{ itemIndex: number; localIndex: number }> = [];
    let combined = '';
    items.forEach((item) => {
        for (let i = 0; i < item.str.length; i++) {
            const char = item.str[i];
            if (/[\s'’]/.test(char)) continue;
            if (!/[a-z0-9]/i.test(char)) continue;
            combined += char.toLowerCase();
            charMap.push({ itemIndex: item.itemIndex, localIndex: i });
        }
    });

    const addRange = (matchStart: number, matchEnd: number) => {
        for (let i = matchStart; i <= matchEnd; i++) {
            const { itemIndex, localIndex } = charMap[i];
            const existing = ranges.get(itemIndex) ?? [];
            const last = existing[existing.length - 1];
            if (last && last[1] === localIndex - 1) {
                last[1] = localIndex;
            } else {
                existing.push([localIndex, localIndex]);
            }
            ranges.set(itemIndex, existing);
        }
    };

    for (const term of terms) {
        const needle = term.replace(/[\s'’]/g, '').toLowerCase();
        if (!needle) continue;

        let searchFrom = 0;
        while (searchFrom <= combined.length) {
            const matchStart = combined.indexOf(needle, searchFrom);
            if (matchStart === -1) break;
            const matchEnd = matchStart + needle.length - 1;
            addRange(matchStart, matchEnd);
            searchFrom = matchEnd + 1;
        }
    }

    // Ranges were appended term-by-term, not in left-to-right document order, but
    // the renderer walks each item's ranges assuming ascending, non-overlapping order.
    for (const [itemIndex, itemRanges] of ranges) {
        itemRanges.sort((a, b) => a[0] - b[0]);
        const merged: Array<[number, number]> = [];
        for (const [start, end] of itemRanges) {
            const last = merged[merged.length - 1];
            if (last && start <= last[1] + 1) {
                last[1] = Math.max(last[1], end);
            } else {
                merged.push([start, end]);
            }
        }
        ranges.set(itemIndex, merged);
    }

    return ranges;
}

export default function PDFReaderClient({ pdfUrl, title, initialPage, initialQuery, prevId, nextId, backHref = '/search?filters=other' }: Props) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(Math.max(1, initialPage || 1));
    const [containerSize, setContainerSize] = useState({ width: 720, height: 800 });
    const [pageAspectRatio, setPageAspectRatio] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const hasScrolledToMatch = useRef(false);
    const query = initialQuery.trim().toLowerCase();
    const highlightTerms = getHighlightTerms(query);
    const highlightRangesRef = useRef<Map<number, Array<[number, number]>>>(new Map());

    // Fit the page to the available viewport rather than a flat width cap — a two-page
    // newsletter spread scanned as one wide landscape page otherwise renders tiny at a
    // portrait-sized width, while a normal portrait page is capped by available height.
    const pageWidth = (() => {
        const availableWidth = Math.max(280, containerSize.width - 32);
        const availableHeight = Math.max(280, containerSize.height - 48);
        if (!pageAspectRatio) return Math.min(availableWidth, 900);
        return Math.min(availableWidth, availableHeight * pageAspectRatio, 1600);
    })();

    // Reset the target page whenever the document or requested page changes.
    // Done during render (React's documented escape hatch for resetting state on
    // prop change) rather than an effect, avoiding an extra render pass.
    const [resetKey, setResetKey] = useState({ pdfUrl, initialPage });
    if (resetKey.pdfUrl !== pdfUrl || resetKey.initialPage !== initialPage) {
        setResetKey({ pdfUrl, initialPage });
        setPageNumber(Math.max(1, initialPage || 1));
    }

    // Clamp once the real page count is known, also during render rather than an effect.
    if (numPages && pageNumber > numPages) {
        setPageNumber(numPages);
    }

    // Refs are effect-only territory (mutating one during render is unsafe), so the
    // scroll-to-match guard is reset here instead of alongside the render-time state above.
    useEffect(() => {
        hasScrolledToMatch.current = false;
    }, [pdfUrl, initialPage]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect;
            if (rect) setContainerSize({ width: rect.width, height: rect.height });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const handlePageLoadSuccess = (page: PageCallback) => {
        if (page.originalWidth && page.originalHeight) {
            setPageAspectRatio(page.originalWidth / page.originalHeight);
        }
    };

    const handleGetTextSuccess = (textContent: TextContent) => {
        const items = textContent.items
            .map((item, itemIndex) => ({ str: 'str' in item ? item.str : '', itemIndex }))
            .filter((item) => item.str);
        highlightRangesRef.current = computeHighlightRanges(items, highlightTerms);
    };

    const highlightRenderer = (textItem: TextItem) => {
        const ranges = highlightRangesRef.current.get(textItem.itemIndex);
        if (!ranges || ranges.length === 0) return textItem.str;

        let result = '';
        let cursor = 0;
        for (const [start, end] of ranges) {
            result += escapeHtml(textItem.str.slice(cursor, start));
            result += `<mark class="pdf-search-highlight">${escapeHtml(textItem.str.slice(start, end + 1))}</mark>`;
            cursor = end + 1;
        }
        result += escapeHtml(textItem.str.slice(cursor));
        return result;
    };

    const handlePageRenderSuccess = () => {
        if (!query || hasScrolledToMatch.current) return;
        hasScrolledToMatch.current = true;
        requestAnimationFrame(() => {
            const mark = containerRef.current?.querySelector('mark.pdf-search-highlight');
            mark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const goToPage = (next: number) => {
        if (!numPages) return;
        hasScrolledToMatch.current = true;
        setPageNumber(Math.min(Math.max(1, next), numPages));
    };

    return (
        <div className="relative flex h-full flex-col overflow-hidden bg-ed-bg text-ed-fg">
            <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-ed-rule bg-ed-surface px-4 sm:pr-[500px]">
                <div className="flex min-w-0 items-center gap-4">
                    <Link
                        href={backHref}
                        className="-mx-1 flex min-h-11 items-center px-1 text-ed-fg-muted transition-colors hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Back to Search"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="ml-1 text-sm font-medium">Back</span>
                    </Link>

                    <div className="h-4 w-px bg-ed-rule" />

                    <h1 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold">
                        <FileText className="h-4 w-4 shrink-0 text-ed-accent" />
                        <span className="truncate">{title}</span>
                    </h1>
                </div>
            </header>

            <div ref={containerRef} className="min-h-0 flex-1 overflow-auto bg-ed-viewer-bg py-6">
                <div className="flex justify-center">
                    <Document
                        file={pdfUrl}
                        onLoadSuccess={({ numPages: loadedPages }) => setNumPages(loadedPages)}
                        loading={<div className="py-20 text-center text-sm text-ed-fg-muted">Loading document…</div>}
                        error={<div className="py-20 text-center text-sm text-ed-fg-muted">Couldn&apos;t load this document.</div>}
                    >
                        <Page
                            pageNumber={pageNumber}
                            width={pageWidth * zoom}
                            customTextRenderer={highlightRenderer}
                            onLoadSuccess={handlePageLoadSuccess}
                            onGetTextSuccess={handleGetTextSuccess}
                            onRenderSuccess={handlePageRenderSuccess}
                            className="soft-shell overflow-hidden"
                        />
                    </Document>
                </div>
            </div>

            <div className="z-20 flex h-[calc(3.5rem+env(safe-area-inset-bottom))] shrink-0 items-center gap-2 overflow-x-auto border-t border-ed-rule bg-ed-surface px-2 pb-[env(safe-area-inset-bottom)] scrollbar-none sm:absolute sm:right-0 sm:top-0 sm:h-14 sm:border-t-0 sm:bg-transparent sm:px-4 sm:pb-0">
                <div className="flex items-center gap-1 border-r border-ed-rule pr-3">
                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Zoom out"
                        aria-label="Zoom out"
                    >
                        <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-xs text-ed-fg-muted tabular-nums">{Math.round(zoom * 100)}%</span>
                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Zoom in"
                        aria-label="Zoom in"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex items-center gap-1 border-r border-ed-rule pr-3">
                    <button
                        type="button"
                        onClick={() => goToPage(pageNumber - 1)}
                        disabled={pageNumber <= 1}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent disabled:opacity-30"
                        title="Previous page"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span aria-live="polite" className="text-xs text-ed-fg-muted tabular-nums">
                        {pageNumber} / {numPages ?? '…'}
                    </span>
                    <button
                        type="button"
                        onClick={() => goToPage(pageNumber + 1)}
                        disabled={!numPages || pageNumber >= numPages}
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent disabled:opacity-30"
                        title="Next page"
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {(prevId || nextId) && (
                    <div className="mr-1 flex items-center gap-1 border-r border-ed-rule pr-3">
                        {prevId ? (
                            <Link
                                href={`/library/${prevId}`}
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                title="Previous document"
                                aria-label="Previous document"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Link>
                        ) : (
                            <div className="w-11" />
                        )}

                        {nextId ? (
                            <Link
                                href={`/library/${nextId}`}
                                className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                title="Next document"
                                aria-label="Next document"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Link>
                        ) : (
                            <div className="w-11" />
                        )}
                    </div>
                )}

                <Link href={pdfUrl} target="_blank" rel="noopener noreferrer" className="-mx-1 flex min-h-11 items-center px-3 text-xs text-ed-fg-muted hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">
                    View Original PDF
                </Link>
            </div>
        </div>
    );
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return char;
        }
    });
}
