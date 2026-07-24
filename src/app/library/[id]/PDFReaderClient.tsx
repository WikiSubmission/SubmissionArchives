'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ExternalLink, FileText, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';
import type { TextContent } from 'pdfjs-dist/types/src/display/api';
import type { PageCallback } from 'react-pdf/dist/shared/types.js';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import { IconBadge, chromeButtonClassLg, dockPillClass, toolbarButtonClass } from '@/components/home/WidgetAccents';
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

    // Built once and rendered twice below: inline in the header on desktop,
    // and as a floating dock bar on mobile, so the two never drift apart.
    const toolbar = (
        <>
            <div className="flex items-center gap-0.5">
                <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.1))}
                    className={toolbarButtonClass}
                    title="Zoom out"
                    aria-label="Zoom out"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <span className="w-11 text-center text-xs text-ed-fg-muted tabular-nums">{Math.round(zoom * 100)}%</span>
                <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(2, z + 0.1))}
                    className={toolbarButtonClass}
                    title="Zoom in"
                    aria-label="Zoom in"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            <div className="mx-1 h-6 w-px shrink-0 bg-ed-rule" aria-hidden="true" />

            <div className="flex items-center gap-0.5">
                <button
                    type="button"
                    onClick={() => goToPage(pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    className={toolbarButtonClass}
                    title="Previous page"
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
                <span aria-live="polite" className={dockPillClass}>
                    {pageNumber} / {numPages ?? '…'}
                </span>
                <button
                    type="button"
                    onClick={() => goToPage(pageNumber + 1)}
                    disabled={!numPages || pageNumber >= numPages}
                    className={toolbarButtonClass}
                    title="Next page"
                    aria-label="Next page"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {(prevId || nextId) && (
                <>
                    <div className="mx-1 h-6 w-px shrink-0 bg-ed-rule" aria-hidden="true" />
                    <div className="flex items-center gap-0.5">
                        {prevId ? (
                            <Link
                                href={`/library/${prevId}`}
                                className={toolbarButtonClass}
                                title="Previous document"
                                aria-label="Previous document"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Link>
                        ) : (
                            <div className="min-h-11 min-w-11" />
                        )}
                        {nextId ? (
                            <Link
                                href={`/library/${nextId}`}
                                className={toolbarButtonClass}
                                title="Next document"
                                aria-label="Next document"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <div className="min-h-11 min-w-11" />
                        )}
                    </div>
                </>
            )}

            <div className="mx-1 h-6 w-px shrink-0 bg-ed-rule" aria-hidden="true" />

            <Link
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={toolbarButtonClass}
                title="View original PDF"
                aria-label="View original PDF"
            >
                <ExternalLink className="h-4 w-4" />
            </Link>
        </>
    );

    return (
        <div className="relative flex h-full flex-col overflow-hidden bg-ed-bg text-ed-fg">
            <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b border-ed-rule bg-ed-surface/90 backdrop-blur-xl px-3 sm:px-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Link
                        href={backHref}
                        className={chromeButtonClassLg}
                        title="Back to Search"
                        aria-label="Back to search"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="ml-1 hidden text-sm font-medium sm:inline">Back</span>
                    </Link>

                    <div className="hidden h-4 w-px bg-ed-rule sm:block" />

                    <h1 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold">
                        <IconBadge size="sm">
                            <FileText className="h-3.5 w-3.5" />
                        </IconBadge>
                        <span className="truncate">{title}</span>
                    </h1>
                </div>

                {/* Toolbar: inline on desktop; mirrored as a floating dock below on mobile */}
                <div className="hidden shrink-0 items-center gap-0.5 rounded-2xl border border-ed-rule bg-ed-surface/70 p-1 shadow-sm sm:flex">
                    {toolbar}
                </div>
            </header>

            <div ref={containerRef} className="min-h-0 flex-1 overflow-auto overscroll-contain bg-ed-viewer-bg px-2 py-4 pb-28 sm:px-0 sm:py-6 sm:pb-6">
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

            {/* Floating dock toolbar — mobile only. Mirrors the desktop header toolbar. */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden">
                <div className="scrollbar-none pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-0.5 overflow-x-auto rounded-2xl border border-ed-rule bg-ed-surface/90 p-1 shadow-2xl shadow-ed-accent/10 backdrop-blur-xl">
                    {toolbar}
                </div>
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
