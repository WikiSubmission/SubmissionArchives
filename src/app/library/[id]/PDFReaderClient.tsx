'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { Document, Page, Thumbnail, pdfjs } from 'react-pdf';
import type { TextContent } from 'pdfjs-dist/types/src/display/api';
import type { PageCallback } from 'react-pdf/dist/shared/types.js';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import { getProgress, saveProgress, shouldOfferResume } from '@/lib/readingProgress';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import '../pdf-theme.css';

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

type OutlineItem = {
    title: string;
    dest?: unknown;
    pageNumber?: number;
    items?: OutlineItem[];
};

type LayoutMode = 'single' | 'spread' | 'continuous';
type ReadingTheme = 'default' | 'sepia' | 'dark';

const ZOOM_KEY = 'reader-zoom';
const LAYOUT_KEY = 'reader-layout';
const THEME_KEY = 'reader-theme';
const ZOOM_MIN = 0.4;
const ZOOM_MAX = 3.0;
const ZOOM_STEP = 0.15;

const chromeButtonClassLg =
    'inline-flex h-9 items-center justify-center rounded-[4px] border border-ed-rule bg-ed-surface px-3 text-[11px] font-semibold tracking-[0.02em] text-ed-fg-muted transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:bg-ed-surface-raised disabled:pointer-events-none disabled:opacity-30';

const toolbarButtonClass =
    'inline-flex min-h-9 items-center justify-center rounded-[4px] px-2.5 text-[11px] font-semibold tracking-[0.02em] text-ed-fg-muted transition-colors hover:bg-ed-surface-strong hover:text-ed-fg active:bg-ed-surface-raised disabled:pointer-events-none disabled:opacity-30';

const dockPillClass =
    'inline-flex min-w-[4.25rem] items-center justify-center rounded-[4px] border border-ed-rule bg-ed-surface px-2.5 py-1 text-[11px] font-semibold tabular-nums text-ed-fg';

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

    for (const [, itemRanges] of ranges) {
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
    }

    return ranges;
}

export default function PDFReaderClient({
    pdfUrl,
    title,
    documentId,
    initialPage,
    initialQuery,
    prevId,
    nextId,
    backHref = '/written#books',
}: Props) {
    const router = useRouter();
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(Math.max(1, initialPage || 1));
    const [containerSize, setContainerSize] = useState({ width: 720, height: 800 });
    const [pageAspectRatio, setPageAspectRatio] = useState<number | null>(null);

    const handleBack = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
            } else {
                router.push(backHref);
            }
        },
        [router, backHref]
    );

    // Persisted preferences
    const [zoom, setZoom] = useState(() => {
        if (typeof window === 'undefined') return 1;
        const saved = parseFloat(localStorage.getItem(ZOOM_KEY) || '1');
        return Number.isFinite(saved) ? Math.min(Math.max(saved, ZOOM_MIN), ZOOM_MAX) : 1;
    });

    const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
        if (typeof window === 'undefined') return 'single';
        const saved = localStorage.getItem(LAYOUT_KEY) as LayoutMode;
        return saved === 'spread' || saved === 'continuous' ? saved : 'single';
    });

    const [readingTheme, setReadingTheme] = useState<ReadingTheme>(() => {
        if (typeof window === 'undefined') return 'default';
        const saved = localStorage.getItem(THEME_KEY) as ReadingTheme;
        return saved === 'sepia' || saved === 'dark' ? saved : 'default';
    });

    const [rotation, setRotation] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'thumbnails' | 'outline'>('thumbnails');
    const [outline, setOutline] = useState<OutlineItem[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Popover states
    const [showZoomPopover, setShowZoomPopover] = useState(false);
    const [showLayoutPopover, setShowLayoutPopover] = useState(false);
    const [showThemePopover, setShowThemePopover] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);
    const [showCiteModal, setShowCiteModal] = useState(false);
    const [citationStyle, setCitationStyle] = useState<'permalink' | 'apa' | 'mla' | 'chicago'>('permalink');

    // Search state
    const [searchOpen, setSearchOpen] = useState(Boolean(initialQuery));
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [matchCount, setMatchCount] = useState(0);
    const [currentMatch, setCurrentMatch] = useState(0);
    const [isEditingPage, setIsEditingPage] = useState(false);
    const [pageInput, setPageInput] = useState(String(Math.max(1, initialPage || 1)));
    const [resumePage, setResumePage] = useState<number | null>(null);

    // Refs
    const readerRootRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const pageInputRef = useRef<HTMLInputElement>(null);
    const hasScrolledToMatch = useRef(false);
    const marksRef = useRef<HTMLElement[]>([]);
    const highlightRangesRef = useRef<Map<number, Array<[number, number]>>>(new Map());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfDocRef = useRef<any>(null);

    const query = searchQuery.trim().toLowerCase();
    const highlightTerms = useMemo(() => getHighlightTerms(query), [query]);

    // Save preferences
    useEffect(() => {
        localStorage.setItem(ZOOM_KEY, String(zoom));
    }, [zoom]);

    useEffect(() => {
        localStorage.setItem(LAYOUT_KEY, layoutMode);
    }, [layoutMode]);

    useEffect(() => {
        localStorage.setItem(THEME_KEY, readingTheme);
    }, [readingTheme]);

    // Track reading progress
    useEffect(() => {
        if (!numPages) return;
        saveProgress(documentId, { page: pageNumber, totalPages: numPages });
    }, [documentId, pageNumber, numPages]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showCiteModal) {
                    setShowCiteModal(false);
                    return;
                }
                if (showHelpModal) {
                    setShowHelpModal(false);
                    return;
                }
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showCiteModal, showHelpModal]);

    // Offer resume if opened at page 1
    useEffect(() => {
        if (!documentId || (initialPage || 1) !== 1) return;
        const stored = getProgress(documentId);
        if (!shouldOfferResume(stored) || stored!.page === 1) return;
        const timer = setTimeout(() => setResumePage(stored!.page), 0);
        return () => clearTimeout(timer);
    }, [documentId, initialPage]);

    const pdfOptions = useMemo(() => ({
        cMapUrl: '/pdf/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdf/standard_fonts/',
    }), []);

    // Dimension calculations
    const pageWidth = useMemo(() => {
        const availableWidth = Math.max(280, containerSize.width - (sidebarOpen ? 240 : 48));
        const availableHeight = Math.max(280, containerSize.height - 64);
        if (!pageAspectRatio) return Math.min(availableWidth, 800);
        const isLandscape = rotation % 180 !== 0;
        const ratio = isLandscape ? 1 / pageAspectRatio : pageAspectRatio;

        if (layoutMode === 'spread') {
            const spreadWidth = Math.min((availableWidth - 32) / 2, availableHeight * ratio);
            return Math.max(240, spreadWidth);
        }

        return Math.min(availableWidth, availableHeight * ratio, 1400);
    }, [containerSize, sidebarOpen, pageAspectRatio, rotation, layoutMode]);

    // Reset on document change
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

    if (numPages && pageNumber > numPages) {
        setPageNumber(numPages);
        setPageInput(String(numPages));
    }

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

    // Fullscreen listener
    useEffect(() => {
        const handler = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Close popovers on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.popover-container')) {
                setShowZoomPopover(false);
                setShowLayoutPopover(false);
                setShowThemePopover(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const goToPage = useCallback((next: number) => {
        if (!numPages) return;
        const clamped = Math.min(Math.max(1, next), numPages);
        hasScrolledToMatch.current = true;
        setPageNumber(clamped);
        setPageInput(String(clamped));

        if (layoutMode === 'continuous') {
            const pageEl = document.getElementById(`pdf-page-${clamped}`);
            pageEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [numPages, layoutMode]);

    const jumpToMatch = useCallback((direction: 'next' | 'prev') => {
        const marks = marksRef.current;
        if (!marks.length) return;
        const idx = direction === 'next'
            ? (currentMatch + 1) % marks.length
            : (currentMatch - 1 + marks.length) % marks.length;
        setCurrentMatch(idx);
        marks[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentMatch]);

    const toggleFullscreen = useCallback(() => {
        if (!readerRootRef.current) return;
        if (!document.fullscreenElement) {
            readerRootRef.current.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    const fitToWidth = useCallback(() => {
        if (!containerRef.current) return;
        const availableWidth = containerRef.current.clientWidth - (sidebarOpen ? 240 : 64);
        const baseWidth = pageAspectRatio && pageAspectRatio > 1 ? 850 : 620;
        setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, availableWidth / baseWidth)));
        setShowZoomPopover(false);
    }, [sidebarOpen, pageAspectRatio]);

    const fitToPage = useCallback(() => {
        if (!containerRef.current) return;
        const availableHeight = containerRef.current.clientHeight - 80;
        const baseHeight = 850;
        setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, availableHeight / baseHeight)));
        setShowZoomPopover(false);
    }, []);

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') (e.target as HTMLElement).blur();
                return;
            }

            switch (e.key) {
                case 'ArrowLeft':
                case 'k':
                    e.preventDefault();
                    goToPage(layoutMode === 'spread' ? pageNumber - 2 : pageNumber - 1);
                    break;
                case 'ArrowRight':
                case 'j':
                    e.preventDefault();
                    goToPage(layoutMode === 'spread' ? pageNumber + 2 : pageNumber + 1);
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
                case 'f':
                case 'F':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case '?':
                    e.preventDefault();
                    setShowHelpModal((s) => !s);
                    break;
                case 'Escape':
                    setShowZoomPopover(false);
                    setShowLayoutPopover(false);
                    setShowThemePopover(false);
                    setShowHelpModal(false);
                    if (searchQuery) setSearchQuery('');
                    break;
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [pageNumber, numPages, goToPage, layoutMode, searchQuery, toggleFullscreen]);

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

    // Load PDF outline
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDocumentLoadSuccess = async (pdfDoc: any) => {
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);

        try {
            const rawOutline = await pdfDoc.getOutline();
            if (rawOutline && rawOutline.length > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const processItems = async (items: any[]): Promise<OutlineItem[]> => {
                    const resolved: OutlineItem[] = [];
                    for (const item of items) {
                        let pageNum: number | undefined;
                        try {
                            if (typeof item.dest === 'string') {
                                const dest = await pdfDoc.getDestination(item.dest);
                                if (dest) {
                                    const pageIdx = await pdfDoc.getPageIndex(dest[0]);
                                    pageNum = pageIdx + 1;
                                }
                            } else if (Array.isArray(item.dest)) {
                                const pageIdx = await pdfDoc.getPageIndex(item.dest[0]);
                                pageNum = pageIdx + 1;
                            }
                        } catch {
                            // Destination resolution fallback
                        }

                        const children = item.items && item.items.length > 0 ? await processItems(item.items) : undefined;
                        resolved.push({
                            title: item.title,
                            dest: item.dest,
                            pageNumber: pageNum,
                            items: children,
                        });
                    }
                    return resolved;
                };

                const resolvedOutline = await processItems(rawOutline);
                setOutline(resolvedOutline);
            }
        } catch {
            // Outline not present or unsupported
        }
    };

    // Loading skeleton
    const loadingSkeleton = (
        <div
            className="soft-shell animate-pulse rounded-2xl bg-[#1C1B1A]/40 border border-[#2A2928]"
            style={{
                width: pageWidth * zoom,
                height: pageAspectRatio ? (pageWidth * zoom) / pageAspectRatio : 600,
            }}
        />
    );

    // Spread calculations (odd/even pair)
    const spreadPages = useMemo(() => {
        if (layoutMode !== 'spread') return [pageNumber];
        if (pageNumber === 1) return [1]; // Cover is alone
        const left = pageNumber % 2 === 0 ? pageNumber : pageNumber - 1;
        const right = left + 1 <= (numPages ?? 1) ? left + 1 : null;
        return right ? [left, right] : [left];
    }, [layoutMode, pageNumber, numPages]);

    /* ==================== TOOLBAR COMPONENT ==================== */
    const toolbar = (
        <div className="flex items-center gap-1">
            {/* Search Toggle */}
            <button
                type="button"
                onClick={() => {
                    setSearchOpen((s) => !s);
                    if (!searchOpen) setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className={`${toolbarButtonClass} ${searchOpen ? 'text-[#C8794A] bg-[#C8794A]/10' : ''}`}
                title="Search in document (Forward slash)"
                aria-label="Search in document"
                aria-pressed={searchOpen}
            >
                <span>Search</span>
            </button>

            <div className="mx-1 h-5 w-px shrink-0 bg-[#2A2928]" aria-hidden="true" />

            {/* Layout Mode Selector Popover */}
            <div className="relative popover-container">
                <button
                    type="button"
                    onClick={() => {
                        setShowLayoutPopover((s) => !s);
                        setShowZoomPopover(false);
                        setShowThemePopover(false);
                    }}
                    className={`${toolbarButtonClass} ${showLayoutPopover ? 'text-[#C8794A]' : ''}`}
                    title="Layout View Mode"
                    aria-label="Page layout mode"
                >
                    {layoutMode === 'single' && <span>Single</span>}
                    {layoutMode === 'spread' && <span>Spread</span>}
                    {layoutMode === 'continuous' && <span>Continuous</span>}
                </button>

                {showLayoutPopover && (
                    <div className="reader-popover">
                        <div className="px-2 py-1 text-[10px] font-sans uppercase tracking-[0.12em] text-[#9E9690]">
                            Page Layout
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setLayoutMode('single');
                                setShowLayoutPopover(false);
                            }}
                            className="reader-popover-item"
                            data-active={layoutMode === 'single'}
                        >
                            <span className="flex items-center gap-2">
                                Single Page
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLayoutMode('spread');
                                setShowLayoutPopover(false);
                            }}
                            className="reader-popover-item"
                            data-active={layoutMode === 'spread'}
                        >
                            <span className="flex items-center gap-2">
                                Two-Page Spread
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLayoutMode('continuous');
                                setShowLayoutPopover(false);
                            }}
                            className="reader-popover-item"
                            data-active={layoutMode === 'continuous'}
                        >
                            <span className="flex items-center gap-2">
                                Continuous Scroll
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* Reading Theme Selector Popover */}
            <div className="relative popover-container">
                <button
                    type="button"
                    onClick={() => {
                        setShowThemePopover((s) => !s);
                        setShowZoomPopover(false);
                        setShowLayoutPopover(false);
                    }}
                    className={`${toolbarButtonClass} ${showThemePopover ? 'text-[#C8794A]' : ''}`}
                    title="Reading appearance"
                    aria-label="Reading theme"
                >
                    <span>Reading</span>
                </button>

                {showThemePopover && (
                    <div className="reader-popover">
                        <div className="px-2 py-1 text-[10px] font-sans uppercase tracking-[0.12em] text-[#9E9690]">
                            Reading Filter
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setReadingTheme('default');
                                setShowThemePopover(false);
                            }}
                            className="reader-popover-item"
                            data-active={readingTheme === 'default'}
                        >
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-[4px] bg-white border border-gray-400" /> Studio White
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setReadingTheme('sepia');
                                setShowThemePopover(false);
                            }}
                            className="reader-popover-item"
                            data-active={readingTheme === 'sepia'}
                        >
                            <span>Warm Sepia</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setReadingTheme('dark');
                                setShowThemePopover(false);
                            }}
                            className="reader-popover-item"
                            data-active={readingTheme === 'dark'}
                        >
                            <span className="flex items-center gap-2">
                                Dark
                            </span>
                        </button>
                    </div>
                )}
            </div>

            <div className="mx-1 h-5 w-px shrink-0 bg-[#2A2928]" aria-hidden="true" />

            {/* Zoom Controls & Presets */}
            <div className="relative flex items-center gap-0.5 popover-container">
                <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))}
                    className={toolbarButtonClass}
                    title="Decrease zoom"
                    aria-label="Zoom out"
                >
                    <span>Smaller</span>
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setShowZoomPopover((s) => !s);
                        setShowLayoutPopover(false);
                        setShowThemePopover(false);
                    }}
                    className="min-w-[54px] px-1.5 py-1 text-center text-xs font-medium text-[#9E9690] hover:text-[#F5F0EB] hover:bg-[#1C1B1A] rounded-[4px] transition-colors tabular-nums"
                    title="Zoom options"
                    aria-label="Zoom options"
                >
                    {Math.round(zoom * 100)}%
                </button>

                <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))}
                    className={toolbarButtonClass}
                    title="Increase zoom"
                    aria-label="Zoom in"
                >
                    <span>Larger</span>
                </button>

                {showZoomPopover && (
                    <div className="reader-popover">
                        <div className="px-2 py-1 text-[10px] font-sans uppercase tracking-[0.12em] text-[#9E9690]">
                            Zoom Presets
                        </div>
                        <button type="button" onClick={fitToWidth} className="reader-popover-item">
                            <span>Fit to Width</span>
                        </button>
                        <button type="button" onClick={fitToPage} className="reader-popover-item">
                            <span>Fit to Page</span>
                        </button>
                        <div className="my-1 h-px bg-[#2A2928]" />
                        {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((preset) => (
                            <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                    setZoom(preset);
                                    setShowZoomPopover(false);
                                }}
                                className="reader-popover-item"
                                data-active={Math.abs(zoom - preset) < 0.05}
                            >
                                <span>{Math.round(preset * 100)}%</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="mx-1 h-5 w-px shrink-0 bg-[#2A2928]" aria-hidden="true" />

            {/* Page Navigation */}
            <div className="flex items-center gap-0.5">
                <button
                    type="button"
                    onClick={() => goToPage(layoutMode === 'spread' ? pageNumber - 2 : pageNumber - 1)}
                    disabled={pageNumber <= 1}
                    className={toolbarButtonClass}
                    title="Previous page"
                    aria-label="Previous page"
                >
                    <span>Previous</span>
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
                        className="w-16 text-center text-xs tabular-nums bg-transparent border-b border-[#C8794A] text-[#F5F0EB] focus:outline-none"
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
                        title="Click to jump to page"
                        aria-label={`Page ${pageNumber} of ${numPages ?? 'unknown'}. Click to edit.`}
                    >
                        <span aria-live="polite">{pageNumber}</span>
                        <span className="text-[#A8A099]">of</span>
                        <span>{numPages ?? 'Loading'}</span>
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => goToPage(layoutMode === 'spread' ? pageNumber + 2 : pageNumber + 1)}
                    disabled={!numPages || pageNumber >= numPages}
                    className={toolbarButtonClass}
                    title="Next page"
                    aria-label="Next page"
                >
                    <span>Next</span>
                </button>
            </div>

            {/* Document Navigation (Prev/Next Book) */}
            {(prevId || nextId) && (
                <>
                    <div className="mx-1 h-5 w-px shrink-0 bg-[#2A2928]" aria-hidden="true" />
                    <div className="flex items-center gap-0.5">
                        {prevId ? (
                            <Link
                                href={`/library/${prevId}`}
                                prefetch
                                className={toolbarButtonClass}
                                title="Previous document"
                                aria-label="Previous document"
                            >
                                <span>Previous</span>
                            </Link>
                        ) : null}
                        {nextId ? (
                            <Link
                                href={`/library/${nextId}`}
                                prefetch
                                className={toolbarButtonClass}
                                title="Next document"
                                aria-label="Next document"
                            >
                                <span>Next</span>
                            </Link>
                        ) : null}
                    </div>
                </>
            )}

            <div className="mx-1 h-5 w-px shrink-0 bg-[#2A2928]" aria-hidden="true" />

            {/* Rotation */}
            <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className={toolbarButtonClass}
                title="Rotate 90° (R)"
                aria-label="Rotate page"
            >
                <span>Rotate</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
                type="button"
                onClick={toggleFullscreen}
                className={toolbarButtonClass}
                title="Toggle Fullscreen (F)"
                aria-label="Toggle fullscreen"
            >
                {isFullscreen ? <span>Exit full screen</span> : <span>Full screen</span>}
            </button>

            <div className="mx-1 h-5 w-px shrink-0 bg-[#2A2928]" aria-hidden="true" />

            {/* Direct PDF Link */}
            <Link
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={toolbarButtonClass}
                title="Open original PDF in new tab"
                aria-label="Open original PDF"
            >
                <span>Open PDF</span>
            </Link>

            {/* Download */}
            <a
                href={pdfUrl}
                download
                className={toolbarButtonClass}
                title="Download PDF"
                aria-label="Download PDF"
            >
                <span>Download</span>
            </a>

            {/* Help / Shortcuts */}
            <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className={toolbarButtonClass}
                title="Keyboard Shortcuts (?)"
                aria-label="Keyboard shortcuts"
            >
                <span>Shortcuts</span>
            </button>

            {/* Cite Button */}
            <button
                type="button"
                onClick={() => setShowCiteModal(true)}
                className={toolbarButtonClass}
                title="Cite this page"
                aria-label="Cite"
            >
                <span>Cite</span>
            </button>
        </div>
    );

    return (
        <div
            ref={readerRootRef}
            className={`relative flex h-full flex-col overflow-hidden bg-ed-bg text-ed-fg pdf-theme-${readingTheme}`}
        >
            {/* Header */}
            <header className="relative z-10 flex h-[60px] shrink-0 items-center justify-between gap-3 border-b border-ed-rule bg-ed-bg/90 backdrop-blur-xl px-4 sm:px-7">
                <div className="flex shrink-0 items-center gap-3">
                    <Link
                        href={backHref}
                        onClick={handleBack}
                        className={chromeButtonClassLg}
                        title="Back"
                        aria-label="Back"
                    >
                        Back
                    </Link>

                    <div className="hidden h-4 w-px bg-ed-rule sm:block" />

                    {/* Sidebar Toggle Button */}
                    <button
                        type="button"
                        onClick={() => setSidebarOpen((s) => !s)}
                        className={`${toolbarButtonClass} ${sidebarOpen ? 'text-ed-accent bg-ed-accent-soft' : ''}`}
                        title="Toggle Navigation Sidebar"
                        aria-label="Toggle sidebar"
                    >
                        <span>Pages</span>
                    </button>

                    <h1
                        className="flex items-center gap-2 text-sm font-semibold text-[#F5F0EB]"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                    >
                        <span aria-hidden="true" className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">PDF</span>
                        <span className="truncate max-w-[180px] sm:max-w-[260px] md:max-w-[340px] lg:max-w-md">{title}</span>
                    </h1>
                </div>

                {/* Desktop Toolbar */}
                <div
                    className="hidden min-w-0 items-center gap-0.5 rounded-[8px] border border-[#2A2928] bg-[#161514]/80 p-1 shadow-sm overflow-x-auto sm:flex"
                    role="toolbar"
                    aria-label="Document controls"
                >
                    {toolbar}
                </div>

                {/* Mobile Sidebar Toggle */}
                <div className="flex items-center gap-1 sm:hidden">
                    <button
                        type="button"
                        onClick={() => setSearchOpen((s) => !s)}
                        className={toolbarButtonClass}
                        aria-label="Search"
                    >
                        <span>Search</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setSidebarOpen((s) => !s)}
                        className={toolbarButtonClass}
                        aria-label="Sidebar"
                    >
                        <span>Pages</span>
                    </button>
                </div>
            </header>

            {/* Resume reading prompt */}
            {resumePage !== null ? (
                <div className="flex items-center justify-between gap-3 border-b border-[#2A2928] bg-[#C8794A]/[0.05] px-4 py-2.5 text-[12px] sm:px-7">
                    <span className="text-[#F5F0EB]">You were last reading page {resumePage}.</span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                goToPage(resumePage);
                                setResumePage(null);
                            }}
                            className="rounded-[4px] border border-[#C8794A]/40 bg-[#C8794A]/15 px-3 py-1 font-semibold text-[#C8794A]"
                        >
                            Resume
                        </button>
                        <button
                            type="button"
                            onClick={() => setResumePage(null)}
                            className="p-1 text-[#9E9690] hover:text-[#F5F0EB]"
                            aria-label="Dismiss resume prompt"
                        >
                            <span>Close</span>
                        </button>
                    </div>
                </div>
            ) : null}

            {/* In-Document Search Panel */}
            {searchOpen && (
                <div className="border-b border-[#2A2928] bg-[#161514]/60 px-3 py-2 backdrop-blur-xl">
                    <div className="mx-auto flex max-w-xl items-center gap-2">

                        <input
                            ref={searchInputRef}
                            type="search"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                hasScrolledToMatch.current = false;
                                setCurrentMatch(0);
                            }}
                            placeholder="Search keywords in document"
                            className="flex-1 bg-transparent text-sm text-[#F5F0EB] placeholder:text-[#9E9690] focus:outline-none"
                            aria-label="Search text in document"
                        />

                        {matchCount > 0 && (
                            <div className="flex items-center gap-2 text-[11px] text-[#9E9690] bg-[#1C1B1A] px-2 py-1 rounded-[4px]">
                                <span>{currentMatch + 1}/{matchCount}</span>
                                <button
                                    type="button"
                                    onClick={() => jumpToMatch('prev')}
                                    className="p-0.5 hover:text-[#F5F0EB]"
                                    title="Previous match"
                                >
                                    <span>Previous</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => jumpToMatch('next')}
                                    className="p-0.5 hover:text-[#F5F0EB]"
                                    title="Next match"
                                >
                                    <span>Next</span>
                                </button>
                            </div>
                        )}

                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery('');
                                    setMatchCount(0);
                                    setCurrentMatch(0);
                                }}
                                className="p-1 text-[#9E9690] hover:text-[#F5F0EB]"
                                aria-label="Clear search"
                            >
                                <span>Close</span>
                            </button>
                        )}
                        <span className="text-xs text-[#9E9690] hidden sm:inline font-sans">
                            / to focus
                        </span>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Drawer */}
                {sidebarOpen && (
                    <aside className="w-56 sm:w-64 shrink-0 flex flex-col border-r border-[#2A2928] bg-[#161514]/70 backdrop-blur-xl z-20">
                        {/* Sidebar Tab Header */}
                        <div className="flex items-center border-b border-[#2A2928] p-1.5 gap-1 bg-[#1C1B1A]/40">
                            <button
                                type="button"
                                onClick={() => setSidebarTab('thumbnails')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-[4px] text-xs font-medium transition-colors ${sidebarTab === 'thumbnails'
                                    ? 'bg-[#161514] text-[#C8794A] font-semibold shadow-sm'
                                    : 'text-[#9E9690] hover:text-[#F5F0EB]'
                                    }`}
                            >
                                Pages ({numPages ?? 'Loading'})
                            </button>
                            {outline.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSidebarTab('outline')}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-[4px] text-xs font-medium transition-colors ${sidebarTab === 'outline'
                                        ? 'bg-[#161514] text-[#C8794A] font-semibold shadow-sm'
                                        : 'text-[#9E9690] hover:text-[#F5F0EB]'
                                        }`}
                                >
                                    Outline
                                </button>
                            )}
                        </div>

                        {/* Sidebar Tab Content */}
                        <div className="flex-1 overflow-y-auto p-2 sm:p-3 scrollbar-thin">
                            {sidebarTab === 'thumbnails' ? (
                                <Document file={pdfUrl} options={pdfOptions}>
                                    {numPages &&
                                        Array.from({ length: numPages }, (_, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => goToPage(i + 1)}
                                                className={`mb-2.5 w-full rounded-[8px] border p-1.5 transition-all text-left group ${pageNumber === i + 1 || (layoutMode === 'spread' && spreadPages.includes(i + 1))
                                                    ? 'border-[#C8794A] bg-[#C8794A]/15 shadow-md shadow-[#C8794A]/10'
                                                    : 'border-transparent hover:border-[#2A2928] hover:bg-[#161514]'
                                                    }`}
                                                aria-label={`Go to page ${i + 1}`}
                                                aria-current={pageNumber === i + 1 ? 'true' : undefined}
                                            >
                                                <div className="overflow-hidden rounded-[4px] bg-[#1C1B1A] border border-[#2A2928] flex justify-center">
                                                    <Thumbnail
                                                        pageNumber={i + 1}
                                                        width={180}
                                                        className="rounded-md"
                                                    />
                                                </div>
                                                <span className="mt-1.5 block text-center text-[11px] text-[#A8A099] group-hover:text-[#F5F0EB] tabular-nums">
                                                    Page {i + 1}
                                                </span>
                                            </button>
                                        ))}
                                </Document>
                            ) : (
                                <div className="space-y-1">
                                    {outline.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                                if (item.pageNumber) goToPage(item.pageNumber);
                                            }}
                                            className="pdf-toc-item"
                                            title={item.title}
                                            data-active={item.pageNumber === pageNumber}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="truncate">{item.title}</span>
                                                {item.pageNumber && (
                                                    <span className="text-[10px] text-[#A8A099] shrink-0">
                                                        p.{item.pageNumber}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* PDF Viewer Canvas Container */}
                <div
                    ref={containerRef}
                    className="min-h-0 flex-1 overflow-auto overscroll-contain bg-ed-bg px-3 py-5 pb-24 sm:px-7 sm:py-7 sm:pb-8"
                >
                    <Document
                        file={pdfUrl}
                        options={pdfOptions}
                        onLoadSuccess={handleDocumentLoadSuccess}
                        loading={loadingSkeleton}
                        error={
                            <div className="py-24 text-center text-sm text-ed-fg-muted">
                                Couldn&apos;t load this document.
                            </div>
                        }
                    >
                        {layoutMode === 'single' && (
                            <div className="flex justify-center">
                                <Page
                                    key={`single-${pageNumber}`}
                                    pageNumber={pageNumber}
                                    width={pageWidth * zoom}
                                    rotate={rotation}
                                    customTextRenderer={highlightRenderer}
                                    onLoadSuccess={handlePageLoadSuccess}
                                    onGetTextSuccess={handleGetTextSuccess}
                                    onRenderSuccess={handlePageRenderSuccess}
                                    className="soft-shell overflow-hidden rounded-[6px]"
                                />
                            </div>
                        )}

                        {layoutMode === 'spread' && (
                            <div className="pdf-spread-container">
                                {spreadPages.map((pg, idx) => (
                                    <div key={`spread-${pg}`} className="flex items-start">
                                        <Page
                                            pageNumber={pg}
                                            width={pageWidth * zoom}
                                            rotate={rotation}
                                            customTextRenderer={highlightRenderer}
                                            onLoadSuccess={handlePageLoadSuccess}
                                            onGetTextSuccess={handleGetTextSuccess}
                                            onRenderSuccess={handlePageRenderSuccess}
                                            className={`overflow-hidden ${spreadPages.length > 1 && idx === 0
                                                ? 'pdf-spread-left rounded-l-lg'
                                                : spreadPages.length > 1 && idx === 1
                                                    ? 'pdf-spread-right rounded-r-lg'
                                                    : 'soft-shell rounded-[6px]'
                                                }`}
                                        />
                                        {idx === 0 && spreadPages.length > 1 && (
                                            <div
                                                className="pdf-spread-gutter"
                                                style={{
                                                    height: pageAspectRatio ? (pageWidth * zoom) / pageAspectRatio : '100%',
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {layoutMode === 'continuous' && (
                            <div className="space-y-6 flex flex-col items-center">
                                {numPages &&
                                    Array.from({ length: numPages }, (_, i) => (
                                        <div
                                            key={`continuous-${i + 1}`}
                                            id={`pdf-page-${i + 1}`}
                                            className="flex flex-col items-center"
                                        >
                                            <Page
                                                pageNumber={i + 1}
                                                width={pageWidth * zoom}
                                                rotate={rotation}
                                                customTextRenderer={highlightRenderer}
                                                onLoadSuccess={i === 0 ? handlePageLoadSuccess : undefined}
                                                onGetTextSuccess={handleGetTextSuccess}
                                                onRenderSuccess={handlePageRenderSuccess}
                                                className="soft-shell overflow-hidden rounded-[6px]"
                                            />
                                            <span className="mt-2 text-[11px] text-ed-fg-muted">
                                                Page {i + 1} of {numPages}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </Document>
                </div>
            </div>

            {/* Mobile Floating Bottom Dock */}
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden">
                <div
                    className="scrollbar-none pointer-events-auto flex max-w-[calc(100vw-1.5rem)] items-center gap-0.5 overflow-x-auto rounded-[8px] border border-ed-rule bg-ed-surface/90 p-1.5 shadow-lg backdrop-blur-xl"
                    role="toolbar"
                    aria-label="Document controls"
                >
                    {toolbar}
                </div>
            </div>

            {/* Help / Shortcuts Modal */}
            {showHelpModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Keyboard shortcuts"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowHelpModal(false);
                    }}
                >
                    <div className="w-full max-w-md rounded-[8px] border border-ed-rule bg-ed-surface p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-ed-rule pb-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-ed-fg">Keyboard Shortcuts</h2>
                            <button
                                type="button"
                                onClick={() => setShowHelpModal(false)}
                                className="text-ed-fg-secondary hover:text-ed-fg"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between p-2 rounded-[8px] bg-ed-surface-strong">
                                <span className="text-ed-fg-secondary">Next / Prev Page</span>
                                <kbd className="text-ed-accent font-semibold">Right / Left Arrow</kbd>
                            </div>
                            <div className="flex justify-between p-2 rounded-[8px] bg-ed-surface-strong">
                                <span className="text-ed-fg-secondary">First / Last Page</span>
                                <kbd className="text-ed-accent font-semibold">Home / End</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Citation Modal */}
            {showCiteModal && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Copy a citation"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowCiteModal(false);
                    }}
                >
                    <div className="w-full max-w-lg rounded-[8px] border border-ed-rule bg-ed-surface p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-ed-rule pb-3">
                            <h2 className="text-sm font-semibold uppercase tracking-wider text-ed-fg">Copy a citation</h2>
                            <button
                                type="button"
                                onClick={() => setShowCiteModal(false)}
                                className="text-ed-fg-secondary hover:text-ed-fg"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Style Selector Tabs */}
                        <div className="flex items-center gap-1 rounded-[4px] border border-ed-rule bg-ed-bg p-1">
                            {(['permalink', 'apa', 'mla', 'chicago'] as const).map((style) => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => setCitationStyle(style)}
                                    className={`rounded px-3 py-1 text-xs font-semibold uppercase transition-colors ${
                                        citationStyle === style
                                            ? 'bg-ed-accent text-white dark:text-[#0F0E0D]'
                                            : 'text-ed-fg-secondary hover:text-ed-fg'
                                    }`}
                                >
                                    {style === 'permalink' ? 'Permalink' : style.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        {/* Citation Text */}
                        <div className="rounded-[4px] border border-ed-rule bg-ed-bg p-4 text-xs font-mono text-ed-fg break-all select-all">
                            {citationStyle === 'permalink' && `${typeof window !== 'undefined' ? window.location.origin : ''}/library/${documentId}?page=${pageNumber}`}
                            {citationStyle === 'apa' && `Khalifa, R. (1982). ${title}. Submission Archives, p. ${pageNumber}.`}
                            {citationStyle === 'mla' && `Khalifa, Rashad. ${title}. Submission Archives, 1982, p. ${pageNumber}.`}
                            {citationStyle === 'chicago' && `Khalifa, Rashad. "${title}." Submission Archives (1982): p. ${pageNumber}.`}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    const text =
                                        citationStyle === 'permalink'
                                            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/library/${documentId}?page=${pageNumber}`
                                            : citationStyle === 'apa'
                                            ? `Khalifa, R. (1982). ${title}. Submission Archives, p. ${pageNumber}.`
                                            : citationStyle === 'mla'
                                            ? `Khalifa, Rashad. ${title}. Submission Archives, 1982, p. ${pageNumber}.`
                                            : `Khalifa, Rashad. "${title}." Submission Archives (1982): p. ${pageNumber}.`;
                                    navigator.clipboard?.writeText(text);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-[4px] bg-ed-accent px-4 py-2 text-xs font-semibold text-white dark:text-[#0F0E0D] hover:opacity-90"
                            >
                                Copy
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
