'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import CiteButton from '@/components/ui/CiteButton';
import PDFReaderClient from './PDFReaderWrapper';

const toolbarButtonClass =
    'inline-flex min-h-9 items-center justify-center rounded-[4px] px-2.5 text-[11px] font-semibold tracking-[0.02em] text-[#9E9690] transition-colors hover:bg-[#1C1B1A] hover:text-[#F5F0EB] active:bg-[#1E1D1C] disabled:pointer-events-none disabled:opacity-30';

const chromeButtonClassLg =
    'inline-flex h-9 items-center justify-center rounded-[4px] border border-[#2A2928] bg-[#161514] px-3 text-[11px] font-semibold tracking-[0.02em] text-[#9E9690] transition-colors hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#F5F0EB] active:bg-[#1E1D1C] disabled:pointer-events-none disabled:opacity-30';

const headingFontStyle = { fontFamily: 'var(--font-source-serif), Georgia, serif' };

type BlockType = {
    type: string;
    title?: string;
    subtitle?: string;
    publisher?: string;
    date?: string;
    arabic_header?: string;
    paragraphs?: string[];
    text?: string;
    items?: string[];
};

type PageType = {
    page_number: number;
    printed_page_label?: string;
    page_title?: string;
    blocks?: BlockType[];
    plain_text?: string;
    transcription?: string;
    transcription_text?: string;
};

type PageTitleEntry = string | { page_number: number; title: string };

export type IssueType = {
    issue_id: string;
    date_label: string;
    pages?: PageType[];
    transcription?: {
        pages?: PageType[];
    };
    page_titles?: PageTitleEntry[];
};

type Props = {
    issue: IssueType;
    query?: string;
    pdfUrl?: string;
    documentId?: string;
    title?: string;
    prevId?: string | null;
    nextId?: string | null;
    backHref?: string;
};

function getFallbackPageText(page: PageType): string {
    return page.transcription || page.transcription_text || page.plain_text || '';
}

function getPageTitle(issue: IssueType, page: PageType, index: number): string | undefined {
    if (page.page_title) return page.page_title;
    const entry = issue.page_titles?.[index];
    if (!entry) return undefined;
    return typeof entry === 'string' ? entry : entry.title;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function NewsletterViewer({
    issue,
    query,
    pdfUrl,
    documentId = issue.issue_id,
    title = 'Submitters Perspective',
    prevId,
    nextId,
    backHref = '/search?filters=perspective',
}: Props) {
    const trimmedQuery = (query ?? '').trim().toLowerCase();
    const highlightTerms = useMemo(() => getHighlightTerms(trimmedQuery), [trimmedQuery]);
    const [matchCount, setMatchCount] = useState(0);
    const [currentMatch, setCurrentMatch] = useState(0);
    const hasScrolledToMatch = useRef(false);

    // Reading options state
    const [viewKind, setViewKind] = useState<'text' | 'facsimile'>('text');
    const [fontSizeIndex, setFontSizeIndex] = useState(1); // 0: sm, 1: base, 2: lg, 3: xl
    const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('sans');
    const [readingWidth, setReadingWidth] = useState<'standard' | 'wide'>('standard');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [showTypePopover, setShowTypePopover] = useState(false);
    const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

    const fontSizes = ['text-base leading-relaxed', 'text-lg leading-relaxed', 'text-xl leading-loose', 'text-2xl leading-loose'];
    const fontLabels = ['Default (16px)', 'Comfortable (18px)', 'Large (20px)', 'Extra Large (24px)'];

    const computeMatchCount = useCallback((root: HTMLElement) => {
        const marks = root.querySelectorAll('mark.newsletter-highlight');
        setMatchCount(marks.length);
        return marks;
    }, []);

    const highlightText = useCallback((text: string) => {
        if (!highlightTerms.length) return text;

        const pattern = highlightTerms.map(escapeRegExp).join('|');
        if (!pattern) return text;

        const regex = new RegExp(`(${pattern})`, 'gi');
        const parts = text.split(regex);

        return (
            <>
                {parts.map((part, i) =>
                    part && highlightTerms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
                        <mark key={i} className="newsletter-highlight rounded-[2px] bg-[rgba(200,121,74,0.25)] px-[2px] text-inherit">
                            {part}
                        </mark>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    }, [highlightTerms]);

    useEffect(() => {
        if (!trimmedQuery || hasScrolledToMatch.current) return;
        const timer = setTimeout(() => {
            const firstMark = document.querySelector('mark.newsletter-highlight');
            if (firstMark) {
                firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                hasScrolledToMatch.current = true;
                const root = document.getElementById('newsletter-content');
                if (root) computeMatchCount(root);
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [trimmedQuery, computeMatchCount]);

    const jumpToMatch = useCallback((direction: 'next' | 'prev') => {
        const root = document.getElementById('newsletter-content');
        if (!root) return;
        const marks = Array.from(root.querySelectorAll('mark.newsletter-highlight'));
        if (!marks.length) return;

        const idx = direction === 'next'
            ? (currentMatch + 1) % marks.length
            : (currentMatch - 1 + marks.length) % marks.length;
        setCurrentMatch(idx);
        marks[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [currentMatch]);

    const handleCopyParagraph = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedBlockId(id);
            setTimeout(() => setCopiedBlockId(null), 2000);
        } catch {
            // Copy failed
        }
    };

    const pages = useMemo(() => issue.transcription?.pages ?? issue.pages ?? [], [issue]);

    // Extract all articles and sections for Table of Contents drawer
    const articleOutline = useMemo(() => {
        const list: { title: string; pageNumber: number; anchorId: string; type: string }[] = [];
        pages.forEach((page, pIdx) => {
            const pageTitle = getPageTitle(issue, page, pIdx);
            if (pageTitle) {
                list.push({ title: pageTitle, pageNumber: page.page_number, anchorId: `page-${page.page_number}`, type: 'page' });
            }

            page.blocks?.forEach((block, bIdx) => {
                if (block.title) {
                    list.push({
                        title: block.title,
                        pageNumber: page.page_number,
                        anchorId: `block-${page.page_number}-${bIdx}`,
                        type: block.type,
                    });
                }
            });
        });
        return list;
    }, [pages, issue]);

    // If facsimile mode is selected and pdfUrl is present, render the PDF Reader client
    if (viewKind === 'facsimile' && pdfUrl) {
        return (
            <div className="h-screen w-screen flex flex-col bg-[#0F0E0D] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-[#161514] border-b border-[#2A2928]">
                    <button
                        type="button"
                        onClick={() => setViewKind('text')}
                        className="rounded-[4px] border border-[#2A2928] bg-[#161514] px-3 py-2 text-[11px] font-semibold tracking-[0.02em] text-[#C8794A] transition-colors hover:border-[#353433] hover:bg-[#1C1B1A]"
                    >
                        Return to Editorial Transcript
                    </button>
                    <span className="text-[11px] text-[#6B6560]">{issue.date_label} Facsimile Scan</span>
                </div>
                <div className="flex-1 min-h-0">
                    <PDFReaderClient
                        pdfUrl={pdfUrl}
                        title={`${title} (${issue.date_label})`}
                        documentId={documentId}
                        initialPage={1}
                        initialQuery={query ?? ''}
                        prevId={prevId}
                        nextId={nextId}
                        backHref={backHref}
                    />
                </div>
            </div>
        );
    }

    return (
        <main id="main-content" className="min-h-screen bg-[#0F0E0D] text-[#F5F0EB] relative">
            {/* Header */}
            <header className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2928] bg-[#0F0E0D]/95 px-4 py-3 backdrop-blur-xl sm:px-7 sm:py-3.5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <Link href={backHref} aria-label="Back to search" className={chromeButtonClassLg}>Back</Link>
                    <div className="min-w-0">
                        <h1
                            className="truncate text-base sm:text-lg font-semibold tracking-tight text-[#F5F0EB]"
                            style={headingFontStyle}
                        >
                            Submitters Perspective
                        </h1>
                        <p className="truncate text-[11px] font-medium tracking-[0.02em] text-[#6B6560]">{issue.date_label}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* In-Document Search Match Count */}
                    {matchCount > 0 && (
                        <div className="flex items-center gap-1 rounded-[4px] border border-[#2A2928] bg-[#161514] px-2.5 py-1 text-xs text-[#9E9690]">
                            <button
                                type="button"
                                onClick={() => jumpToMatch('prev')}
                                className="p-0.5 hover:text-[#C8794A] transition-colors"
                                aria-label="Previous match"
                            >
                                <span>Previous</span>
                            </button>
                            <span className="tabular-nums min-w-[3ch] text-center" aria-live="polite">
                                {currentMatch + 1} of {matchCount}
                            </span>
                            <button
                                type="button"
                                onClick={() => jumpToMatch('next')}
                                className="p-0.5 hover:text-[#C8794A] transition-colors"
                                aria-label="Next match"
                            >
                                <span>Next</span>
                            </button>
                        </div>
                    )}

                    {/* Table of Contents Article Drawer Toggle */}
                    {articleOutline.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setDrawerOpen((s) => !s)}
                            className={`${toolbarButtonClass} ${drawerOpen ? 'text-[#C8794A] bg-[#C8794A]/10' : ''}`}
                            title="Issue contents"
                            aria-label="Table of contents"
                        >
                            <span>Contents</span>
                        </button>
                    )}

                    {/* Typography & Reading Appearance Popover */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowTypePopover((s) => !s)}
                            className={`${toolbarButtonClass} ${showTypePopover ? 'text-[#C8794A] bg-[#C8794A]/10' : ''}`}
                            title="Reading appearance & font size"
                            aria-label="Reading appearance"
                        >
                            <span>Type</span>
                        </button>

                        {showTypePopover && (
                            <div className="absolute right-0 top-full z-30 mt-2 w-64 min-w-[180px] space-y-3 rounded-[8px] border border-[#2A2928] bg-[#161514] p-3 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.4)]">
                                <div className="flex items-center justify-between text-xs font-sans uppercase tracking-[0.12em] text-[#6B6560] pb-1 border-b border-[#2A2928]">
                                    <span>Typography</span>
                                    <button onClick={() => setShowTypePopover(false)} className="p-0.5 hover:text-[#F5F0EB]">
                                        <span>Close</span>
                                    </button>
                                </div>

                                {/* Font Size */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] text-[#6B6560]">Font Size</div>
                                    <div className="flex items-center justify-between gap-1 bg-[#1C1B1A] p-1 rounded-[4px]">
                                        <button
                                            type="button"
                                            disabled={fontSizeIndex <= 0}
                                            onClick={() => setFontSizeIndex((i) => Math.max(0, i - 1))}
                                            className="px-2.5 py-1 text-xs font-bold rounded-[4px] hover:bg-[#1E1D1C] disabled:opacity-30"
                                        >
                                            Smaller
                                        </button>
                                        <span className="text-[11px] text-[#C8794A]">
                                            {fontLabels[fontSizeIndex]}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={fontSizeIndex >= fontSizes.length - 1}
                                            onClick={() => setFontSizeIndex((i) => Math.min(fontSizes.length - 1, i + 1))}
                                            className="px-2.5 py-1 text-xs font-bold rounded-[4px] hover:bg-[#1E1D1C] disabled:opacity-30"
                                        >
                                            Larger
                                        </button>
                                    </div>
                                </div>

                                {/* Font Family */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] text-[#6B6560]">Font Style</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setFontFamily('serif')}
                                            className={`py-1 px-2 rounded-[4px] text-xs font-serif border transition-colors ${fontFamily === 'serif' ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold' : 'border-[#2A2928] text-[#9E9690] hover:border-[#353433] hover:bg-[#1C1B1A]'
                                                }`}
                                        >
                                            Serif
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFontFamily('sans')}
                                            className={`py-1 px-2 rounded-[4px] text-xs font-sans border transition-colors ${fontFamily === 'sans' ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold' : 'border-[#2A2928] text-[#9E9690] hover:border-[#353433] hover:bg-[#1C1B1A]'
                                                }`}
                                        >
                                            DM Sans
                                        </button>
                                    </div>
                                </div>

                                {/* Reading Width */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] text-[#6B6560]">Reading Width</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setReadingWidth('standard')}
                                            className={`py-1 px-2 rounded-[4px] text-xs border transition-colors ${readingWidth === 'standard' ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold' : 'border-[#2A2928] text-[#9E9690] hover:border-[#353433] hover:bg-[#1C1B1A]'
                                                }`}
                                        >
                                            Standard
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReadingWidth('wide')}
                                            className={`py-1 px-2 rounded-[4px] text-xs border transition-colors ${readingWidth === 'wide' ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold' : 'border-[#2A2928] text-[#9E9690] hover:border-[#353433] hover:bg-[#1C1B1A]'
                                                }`}
                                        >
                                            Wide
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Original Facsimile Scan Toggle */}
                    {pdfUrl && (
                        <button
                            type="button"
                            onClick={() => setViewKind('facsimile')}
                            className="hidden sm:flex items-center gap-1.5 rounded-[4px] border border-[#2A2928] bg-[#161514] px-3 py-1.5 text-xs font-semibold text-[#C8794A] transition-colors hover:border-[#353433] hover:bg-[#1C1B1A]"
                            title="View original scanned PDF facsimile"
                        >
                            Facsimile PDF
                        </button>
                    )}

                    {/* Issue Prev / Next */}
                    {(prevId || nextId) && (
                        <div className="flex items-center gap-0.5 border-l border-[#2A2928] pl-1.5 ml-1">
                            {prevId && (
                                <Link
                                    href={`/library/${prevId}`}
                                    prefetch
                                    className={toolbarButtonClass}
                                    title="Previous issue"
                                    aria-label="Previous issue"
                                >
                                    <span>Previous</span>
                                </Link>
                            )}
                            {nextId && (
                                <Link
                                    href={`/library/${nextId}`}
                                    prefetch
                                    className={toolbarButtonClass}
                                    title="Next issue"
                                    aria-label="Next issue"
                                >
                                    <span>Next</span>
                                </Link>
                            )}
                        </div>
                    )}

                    <CiteButton source={{ title: `${title} (${issue.date_label})` }} />
                </div>
            </header>

            {/* Layout Wrapper with Side Article Drawer */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Article Outline Drawer */}
                {drawerOpen && (
                    <aside className="w-64 sm:w-72 shrink-0 border-r border-[#2A2928] bg-[#161514]/70 backdrop-blur-xl p-4 overflow-y-auto z-20 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-[#2A2928]">
                            <span className="text-xs font-sans uppercase tracking-[0.12em] text-[#6B6560]">
                                Issue Contents
                            </span>
                            <button onClick={() => setDrawerOpen(false)} className="p-1 text-[#6B6560] hover:text-[#F5F0EB]">
                                <span>Close</span>
                            </button>
                        </div>
                        <div className="space-y-1.5">
                            {articleOutline.map((art, idx) => (
                                <a
                                    key={idx}
                                    href={`#${art.anchorId}`}
                                    onClick={() => {
                                        if (window.innerWidth < 768) setDrawerOpen(false);
                                    }}
                                    className="block p-2 rounded-[4px] text-xs font-medium text-[#6B6560] hover:text-[#F5F0EB] hover:bg-[#1C1B1A] transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">{art.title}</span>
                                        <span className="text-[10px] text-[#C8794A] shrink-0">
                                            p.{art.pageNumber}
                                        </span>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </aside>
                )}

                {/* Newsletter Content Stream */}
                <div
                    id="newsletter-content"
                    className={`flex-1 overflow-y-auto px-4 py-8 sm:py-12 sm:px-8 mx-auto ${readingWidth === 'wide' ? 'max-w-5xl' : 'max-w-3xl'
                        } ${fontFamily === 'sans' ? 'font-sans' : ''} space-y-12 sm:space-y-16`}
                    style={fontFamily === 'serif' ? { fontFamily: 'var(--font-newsreader), Georgia, serif' } : { fontFamily: 'var(--font-dm-sans), -apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                    {pages.map((page: PageType, pIdx: number) => (
                        <div
                            key={pIdx}
                            id={`page-${page.page_number}`}
                            className="space-y-10 pb-12 border-b border-[#2A2928] last:border-0 relative scroll-mt-24"
                        >
                            {/* Page header marker */}
                            <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.02em] text-[#6B6560]/60 pb-2 border-b border-[#2A2928]/40 uppercase tracking-widest">
                                <span>Page {page.page_number}</span>
                                <span>{issue.date_label}</span>
                            </div>

                            {!page.blocks?.length && (() => {
                                const pageTitle = getPageTitle(issue, page, pIdx);
                                const fallbackText = getFallbackPageText(page);
                                const paragraphs = fallbackText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
                                return (
                                    <article className="space-y-6">
                                        {pageTitle && (
                                            <h3
                                                className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F0EB]"
                                                style={headingFontStyle}
                                            >
                                                {highlightText(pageTitle)}
                                            </h3>
                                        )}
                                        <div className={`space-y-5 text-[#F5F0EB]/90 whitespace-pre-line ${fontSizes[fontSizeIndex]}`}>
                                            {paragraphs.map((p, i) => {
                                                const blockId = `p-${pIdx}-${i}`;
                                                return (
                                                    <div key={i} className="group relative">
                                                        <p>{highlightText(p)}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyParagraph(p, blockId)}
                                                            className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-1 text-[10px] font-semibold text-[#6B6560] hover:text-[#C8794A]"
                                                            title="Copy quote"
                                                        >
                                                            {copiedBlockId === blockId ? 'Copied' : 'Copy'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </article>
                                );
                            })()}

                            {page.blocks?.map((block: BlockType, bIdx: number) => {
                                const blockId = `block-${page.page_number}-${bIdx}`;

                                if (block.type === 'masthead') {
                                    return (
                                        <div
                                            key={bIdx}
                                            id={blockId}
                                            className="text-center space-y-4 pb-8 mb-8 border-b-2 border-[#C8794A]/20"
                                        >
                                            {block.arabic_header && (
                                                <p className="text-2xl text-[#9E9690] font-arabic leading-loose">
                                                    {block.arabic_header}
                                                </p>
                                            )}
                                            <h2
                                                className="text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F5F0EB]"
                                                style={headingFontStyle}
                                            >
                                                {highlightText(block.title || 'MUSLIM PERSPECTIVE')}
                                            </h2>
                                            <div className="flex justify-center items-center gap-4 text-xs font-sans uppercase tracking-[0.12em] text-[#6B6560]">
                                                <span>{block.publisher}</span>
                                                <span className="h-px w-8 bg-[#2A2928]"></span>
                                                <span>{block.date}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                if (block.type === 'article') {
                                    return (
                                        <article key={bIdx} id={blockId} className="space-y-6">
                                            {block.title && (
                                                <h3
                                                    className="text-xl sm:text-2xl font-bold leading-[1.25] tracking-[-0.018em] text-[#F5F0EB]"
                                                    style={headingFontStyle}
                                                >
                                                    {highlightText(block.title)}
                                                </h3>
                                            )}
                                            <div className={`space-y-5 text-[#F5F0EB]/90 ${fontSizes[fontSizeIndex]}`}>
                                                {block.paragraphs?.map((p: string, i: number) => {
                                                    const paraId = `${blockId}-p-${i}`;
                                                    return (
                                                        <div key={i} className="group relative">
                                                            <p>{highlightText(p)}</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyParagraph(p, paraId)}
                                                                className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-1 text-[10px] font-semibold text-[#6B6560] hover:text-[#C8794A]"
                                                                title="Copy quote"
                                                            >
                                                                {copiedBlockId === paraId ? 'Copied' : 'Copy'}
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </article>
                                    );
                                }

                                if (block.type === 'callout') {
                                    return (
                                        <aside
                                            key={bIdx}
                                            id={blockId}
                                            className="my-8 rounded-[8px] border border-[#C8794A]/20 bg-[#C8794A]/5 p-6 sm:p-8"
                                        >
                                            {block.title && (
                                                <h4
                                                    className="text-xl font-bold tracking-tight text-[#C8794A] mb-4"
                                                    style={headingFontStyle}
                                                >
                                                    {highlightText(block.title)}
                                                </h4>
                                            )}
                                            {block.text && (
                                                <p className={`text-[#F5F0EB] leading-relaxed ${fontSizes[fontSizeIndex]}`}>
                                                    {highlightText(block.text)}
                                                </p>
                                            )}
                                        </aside>
                                    );
                                }

                                if (block.type === 'list') {
                                    return (
                                        <div key={bIdx} id={blockId} className="space-y-4 my-8">
                                            {block.title && (
                                                <h4
                                                    className="text-xl font-semibold tracking-tight text-[#F5F0EB]"
                                                    style={headingFontStyle}
                                                >
                                                    {highlightText(block.title)}
                                                </h4>
                                            )}
                                            <ul className={`list-none pl-0 space-y-3 text-[#F5F0EB]/90 ${fontSizes[fontSizeIndex]}`}>
                                                {block.items?.map((item: string, i: number) => (
                                                    <li key={i}>{highlightText(item)}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Back to top floating button */}
            <div className="fixed bottom-6 right-6 z-20">
                <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="rounded-[4px] border border-[#2A2928] bg-[#161514]/95 px-3 py-2 text-[11px] font-semibold tracking-[0.02em] text-[#9E9690] shadow-lg backdrop-blur-xl hover:bg-[#1C1B1A] hover:text-[#F5F0EB] transition-colors"
                    aria-label="Back to top"
                    title="Back to top"
                >
                    <span>Back to top</span>
                </button>
            </div>
        </main>
    );
}
