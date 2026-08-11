'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ChevronsUpDown,
    ExternalLink,
    FileText,
    Minus,
    Plus,
    RotateCw,
    Search,
    X,
} from 'lucide-react';
import Link from 'next/link';
import { Document, Page, Thumbnail, pdfjs } from 'react-pdf';
import type { TextContent } from 'pdfjs-dist/types/src/display/api';
import type { PageCallback } from 'react-pdf/dist/shared/types.js';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import { getProgress, saveProgress, shouldOfferResume } from '@/lib/readingProgress';
import { IconBadge, chromeButtonClassLg, dockPillClass, toolbarButtonClass } from '@/components/home/WidgetAccents';
import CiteButton from '@/components/ui/CiteButton';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

type Props = {
    pdfUrl: string;
    title: string;
    documentId: string;
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

const ZOOM_KEY = 'reader-zoom';
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.1;

export default function PDFReaderClient({
    pdfUrl,
    title,
    documentId,
    initialPage,
    initialQuery,
    prevId,
    nextId,
    backHref = '/search?filters=other',
}: Props) {
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(Math.max(1, initialPage || 1));
    const [containerSize, setContainerSize] = useState({ width: 720, height: 800 });
    const [pageAspectRatio, setPageAspectRatio] = useState<number | null>(null);
    const [zoom, setZoom] = useState(() => {
        if (typeof window === 'undefined') return 1;
        const saved = parseFloat(localStorage.getItem(ZOOM_KEY) || '1');
        return Number.isFinite(saved) ? Math.min(Math.max(saved, ZOOM_MIN), ZOOM_MAX) : 1;
    });
    const [rotation, setRotation] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Arriving from a search result (?q=/?highlight=) opens the search panel, so the
    // term and the match counter are visible instead of unexplained highlights.
    const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [matchCount, setMatchCount] = useState(0);
    const [currentMatch, setCurrentMatch] = useState(0);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage || 1)));
    // Offered rather than applied: silently jumping someone past the page they linked to
    // would be worse than asking.
    const [resumePage, setResumePage] = useState<number | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const pageInputRef = useRef<HTMLInputElement>(null);
    const hasScrolledToMatch = useRef(false);
    const marksRef = useRef<HTMLElement[]>([]);
    const highlightRangesRef = useRef<Map<number, Array<[number, number]>>>(new Map());

    const query = searchQuery.trim().toLowerCase();
    const highlightTerms = getHighlightTerms(query);

    useEffect(() => {
        localStorage.setItem(ZOOM_KEY, String(zoom));
    }, [zoom]);

    // Record the position once the page count is known, so a stored entry always carries
    // enough context to judge how far through the document it is.
    useEffect(() => {
        if (!numPages) return;
        saveProgress(documentId, { page: pageNumber, totalPages: numPages });
    }, [documentId, pageNumber, numPages]);

    // Only offer to resume when the reader was opened at the top, i.e. the visitor did
    // not ask for a specific page.
    useEffect(() => {
        if (!documentId || (initialPage || 1) !== 1) return;

        const stored = getProgress(documentId);
        if (!shouldOfferResume(stored) || stored!.page === 1) return;

        // Deferred out of the effect body: reading localStorage is the external-system
        // part, applying it to state belongs on a later task.
        const timer = setTimeout(() => setResumePage(stored!.page), 0);
        return () => clearTimeout(timer);
    }, [documentId, initialPage, setResumePage]);

    // Local cmaps/fonts — copied from pdfjs-dist into /public/pdf/ via
    // `npm run generate:pdf-assets` — keep non-Latin text rendering off unpkg,
    // avoiding a runtime CDN dependency for reader traffic.
    const pdfOptions = useMemo(() => ({
        cMapUrl: '/pdf/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdf/standard_fonts/',
    }), []);

    // Fit the page to the available viewport rather than a flat width cap — a two-page
    // newsletter spread scanned as one wide landscape page otherwise renders tiny at a
    // portrait-sized width, while a normal portrait page is capped by available height.
    const pageWidth = (() => {
        const availableWidth = Math.max(280, containerSize.width - 32);
        const availableHeight = Math.max(280, containerSize.height - 48);
        if (!pageAspectRatio) return Math.min(availableWidth, 900);
        // Rotation swaps which dimension constrains the page.
        const isLandscape = rotation % 180 !== 0;
        const ratio = isLandscape ? 1 / pageAspectRatio : pageAspectRatio;
        return Math.min(availableWidth, availableHeight * ratio, 1600);
    })();

    // Reset the target page whenever the document or requested page changes.
    // Done during render (React's documented escape hatch for resetting state on
    // prop change) rather than an effect, avoiding an extra render pass.
    const [resetKey, setResetKey] = useState({ pdfUrl, initialPage });
    if (resetKey.pdfUrl !== pdfUrl || resetKey.initialPage !== initialPage) {
        setResetKey({ pdfUrl, initialPage });
        const resetPage = Math.max(1, initialPage || 1);
        setPageNumber(resetPage);
        setPageInput(String(resetPage));
        setRotation(0);
        setSearchQuery(initialQuery);
        setMatchCount(0);
        setCurrentMatch(0);
    }

    // Clamp once the real page count is known, also during render rather than an effect.
    if (numPages && pageNumber > numPages) {
        setPageNumber(numPages);
        setPageInput(String(numPages));
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

    const goToPage = useCallback((next: number) => {
        if (!numPages) return;
        const clamped = Math.min(Math.max(1, next), numPages);
        hasScrolledToMatch.current = true;
        setPageNumber(clamped);
        setPageInput(String(clamped));
    }, [numPages]);

    const jumpToMatch = useCallback((direction: 'next' | 'prev') => {
        const marks = marksRef.current;
        if (!marks.length) return;
        const idx = direction === 'next'
            ? (currentMatch + 1) % marks.length
            : (currentMatch - 1 + marks.length) % marks.length;
        setCurrentMatch(idx);
        marks[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentMatch]);

    // Keyboard navigation: arrows/Home/End to page, `/` to search, +/- to zoom, R to rotate.
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') (e.target as HTMLElement).blur();
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    goToPage(pageNumber - 1);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    goToPage(pageNumber + 1);
                    break;
                case 'Home':
                    e.preventDefault();
                    goToPage(1);
                    break;
                case 'End':
                    e.preventDefault();
                    goToPage(numPages ?? 1);
                    break;
                case '/':
                    e.preventDefault();
                    setSearchOpen(true);
                    setTimeout(() => searchInputRef.current?.focus(), 50);
                    break;
                case '+':
                case '=':
                    e.preventDefault();
                    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
                    break;
                case '-':
                    e.preventDefault();
                    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
                    break;
                case 'r':
                case 'R':
                    e.preventDefault();
                    setRotation((r) => (r + 90) % 360);
                    break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [pageNumber, numPages, goToPage]);

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

    const updateMatchState = useCallback(() => {
        requestAnimationFrame(() => {
            const marks = Array.from(containerRef.current?.querySelectorAll('mark.pdf-search-highlight') ?? []);
            marksRef.current = marks as HTMLElement[];
            setMatchCount(marks.length);
            if (marks.length > 0 && !hasScrolledToMatch.current) {
                hasScrolledToMatch.current = true;
                setCurrentMatch(0);
                marks[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }, []);

    const handlePageRenderSuccess = () => {
        updateMatchState();
    };

    const handlePageInputSubmit = () => {
        const parsed = parseInt(pageInput, 10);
        if (Number.isFinite(parsed) && parsed >= 1 && numPages && parsed <= numPages) {
            goToPage(parsed);
        } else {
            setPageInput(String(pageNumber));
        }
        setIsEditingPage(false);
    };

    const fitToWidth = () => {
        if (!containerRef.current) return;
        const availableWidth = containerRef.current.clientWidth - 48;
        const baseWidth = pageAspectRatio && pageAspectRatio > 1 ? 800 : 600;
        setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, availableWidth / baseWidth)));
    };

    // Loading skeleton that approximates the page's real dimensions, avoiding layout shift.
    const loadingSkeleton = (
        <div
            className="soft-shell animate-pulse rounded-2xl bg-ed-muted/40"
            style={{
                width: pageWidth,
                height: pageAspectRatio ? pageWidth / pageAspectRatio : 600,
            }}
        />
    );

    // Built once and rendered twice below: inline in the header on desktop,
    // and as a floating dock bar on mobile, so the two never drift apart.
    const toolbar = (
        <>
            <button
                type="button"
                onClick={() => {
                    setSearchOpen((s) => !s);
                    if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className={toolbarButtonClass}
                title="Search in document (/)"
                aria-label="Search in document"
                aria-pressed={searchOpen}
            >
                <Search className="h-4 w-4" />
            </button>

            <div className="mx-1 h-6 w-px shrink-0 bg-ed-rule" aria-hidden="true" />

            <div className="flex items-center gap-0.5">
                <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                    className={toolbarButtonClass}
                    title="Zoom out"
                    aria-label="Zoom out"
                >
                    <Minus className="h-4 w-4" />
                </button>
                <span
                    className="w-11 text-center text-xs text-ed-fg-muted tabular-nums"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                    className={toolbarButtonClass}
                    title="Zoom in"
                    aria-label="Zoom in"
                >
                    <Plus className="h-4 w-4" />
                </button>
                <button
                    type="button"
                    onClick={fitToWidth}
                    className={toolbarButtonClass}
                    title="Fit to width"
                    aria-label="Fit to width"
                >
                    <ChevronsUpDown className="h-4 w-4" />
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

                {isEditingPage ? (
                    <input
                        ref={pageInputRef}
                        type="text"
                        inputMode="numeric"
                        value={pageInput}
                        onChange={(e) => setPageInput(e.target.value)}
                        onBlur={handlePageInputSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePageInputSubmit();
                            if (e.key === 'Escape') {
                                setPageInput(String(pageNumber));
                                setIsEditingPage(false);
                            }
                        }}
                        className="w-16 text-center text-xs tabular-nums bg-transparent border-b border-ed-accent text-ed-fg focus:outline-none"
                        autoFocus
                        aria-label="Go to page"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => {
                            setIsEditingPage(true);
                            setPageInput(String(pageNumber));
                            setTimeout(() => pageInputRef.current?.select(), 50);
                        }}
                        className={dockPillClass}
                        title="Click to enter page number"
                        aria-label={`Page ${pageNumber} of ${numPages ?? 'unknown'}. Click to edit.`}
                    >
                        <span aria-live="polite">{pageNumber}</span>
                        <span className="text-ed-fg-muted">/</span>
                        <span>{numPages ?? '…'}</span>
                    </button>
                )}

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

            {matchCount > 0 && (
                <>
                    <div className="mx-1 h-6 w-px shrink-0 bg-ed-rule" aria-hidden="true" />
                    <div className="flex items-center gap-0.5">
                        <button
                            type="button"
                            onClick={() => jumpToMatch('prev')}
                            className={toolbarButtonClass}
                            title="Previous match"
                            aria-label="Previous match"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="min-w-[3ch] text-center text-xs text-ed-fg-muted tabular-nums">
                            {currentMatch + 1}/{matchCount}
                        </span>
                        <button
                            type="button"
                            onClick={() => jumpToMatch('next')}
                            className={toolbarButtonClass}
                            title="Next match"
                            aria-label="Next match"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </>
            )}

            {(prevId || nextId) && (
                <>
                    <div className="mx-1 h-6 w-px shrink-0 bg-ed-rule" aria-hidden="true" />
                    <div className="flex items-center gap-0.5">
                        {prevId ? (
                            <Link
                                href={`/library/${prevId}`}
                                prefetch
                                className={toolbarButtonClass}
                                title="Previous document"
                                aria-label="Previous document"
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Link>
                        ) : (
                            <span className="min-h-11 min-w-11" aria-hidden="true" />
                        )}
                        {nextId ? (
                            <Link
                                href={`/library/${nextId}`}
                                prefetch
                                className={toolbarButtonClass}
                                title="Next document"
                                aria-label="Next document"
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <span className="min-h-11 min-w-11" aria-hidden="true" />
                        )}
                    </div>
                </>
            )}

            <div className="mx-1 h-6 w-px shrink-0 bg-ed-rule" aria-hidden="true" />

            <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className={toolbarButtonClass}
                title="Rotate (R)"
                aria-label="Rotate page"
            >
                <RotateCw className="h-4 w-4" />
            </button>

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

            <CiteButton source={{ title, locator: `p. ${pageNumber}` }} />
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
                <div
                    className="hidden shrink-0 items-center gap-0.5 rounded-2xl border border-ed-rule bg-ed-surface/70 p-1 shadow-sm sm:flex"
                    role="toolbar"
                    aria-label="Document controls"
                >
                    {toolbar}
                </div>

                <button
                    type="button"
                    onClick={() => setSidebarOpen((s) => !s)}
                    className={`${toolbarButtonClass} sm:hidden`}
                    aria-label="Toggle thumbnail sidebar"
                    aria-pressed={sidebarOpen}
                >
                    <FileText className="h-4 w-4" />
                </button>
            </header>

            {resumePage !== null ? (
                <div className="flex items-center justify-between gap-3 border-b border-ed-rule bg-ed-accent/10 px-3 py-2 text-xs sm:px-4">
                    <span className="text-ed-fg">You were last reading page {resumePage}.</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                goToPage(resumePage);
                                setResumePage(null);
                            }}
                            className="rounded-full border border-ed-accent/40 bg-ed-accent/15 px-3 py-1 font-semibold text-ed-accent"
                        >
                            Resume
                        </button>
                        <button
                            type="button"
                            onClick={() => setResumePage(null)}
                            className="p-1 text-ed-fg-muted hover:text-ed-fg"
                            aria-label="Dismiss resume prompt"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            ) : null}

            {searchOpen && (
                <div className="border-b border-ed-rule bg-ed-surface/50 px-3 py-2 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-md items-center gap-2">
                        <Search className="h-4 w-4 text-ed-fg-muted" aria-hidden="true" />
                        <input
                            ref={searchInputRef}
                            type="search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                hasScrolledToMatch.current = false;
                                setCurrentMatch(0);
                            }}
                            placeholder="Search in document…"
                            className="flex-1 bg-transparent text-sm text-ed-fg placeholder:text-ed-fg-muted focus:outline-none"
                            aria-label="Search text in document"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setMatchCount(0);
                                    setCurrentMatch(0);
                                }}
                                className="p-1 text-ed-fg-muted hover:text-ed-fg"
                                aria-label="Clear search"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <span className="text-xs text-ed-fg-muted hidden sm:inline">
                            Press / to focus
                        </span>
                    </div>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                {sidebarOpen && (
                    <aside className="w-44 shrink-0 overflow-y-auto border-r border-ed-rule bg-ed-surface/50 p-2 backdrop-blur-xl sm:w-52 sm:p-3">
                        <Document file={pdfUrl} options={pdfOptions}>
                            {numPages &&
                                Array.from({ length: numPages }, (_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => goToPage(i + 1)}
                                        className={`mb-2 w-full rounded-lg border p-1 transition-colors ${
                                            pageNumber === i + 1
                                                ? 'border-ed-accent bg-ed-accent/10'
                                                : 'border-transparent hover:border-ed-rule hover:bg-ed-surface'
                                        }`}
                                        aria-label={`Go to page ${i + 1}`}
                                        aria-current={pageNumber === i + 1 ? 'true' : undefined}
                                    >
                                        <Thumbnail
                                            pageNumber={i + 1}
                                            width={160}
                                            className="rounded-md"
                                        />
                                        <span className="mt-1 block text-center text-[10px] text-ed-fg-muted tabular-nums">
                                            {i + 1}
                                        </span>
                                    </button>
                                ))}
                        </Document>
                    </aside>
                )}

                <div ref={containerRef} className="min-h-0 flex-1 overflow-auto overscroll-contain bg-ed-viewer-bg px-2 py-4 pb-28 sm:px-0 sm:py-6 sm:pb-6">
                    <div className="flex justify-center">
                        <Document
                            file={pdfUrl}
                            options={pdfOptions}
                            onLoadSuccess={({ numPages: loadedPages }) => setNumPages(loadedPages)}
                            loading={loadingSkeleton}
                            error={
                                <div className="py-20 text-center text-sm text-ed-fg-muted">
                                    Couldn&apos;t load this document.
                                </div>
                            }
                        >
                            <Page
                                pageNumber={pageNumber}
                                width={pageWidth * zoom}
                                rotate={rotation}
                                customTextRenderer={highlightRenderer}
                                onLoadSuccess={handlePageLoadSuccess}
                                onGetTextSuccess={handleGetTextSuccess}
                                onRenderSuccess={handlePageRenderSuccess}
                                className="soft-shell overflow-hidden"
                            />
                        </Document>
                    </div>
                </div>
            </div>

            {/* Floating dock toolbar — mobile only. Mirrors the desktop header toolbar. */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden">
                <div
                    className="scrollbar-none pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-0.5 overflow-x-auto rounded-2xl border border-ed-rule bg-ed-surface/90 p-1 shadow-2xl shadow-ed-accent/10 backdrop-blur-xl"
                    role="toolbar"
                    aria-label="Document controls"
                >
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
