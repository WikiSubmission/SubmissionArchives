'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import PDFReaderClient from './PDFReaderWrapper';

const toolbarButtonClass =
    'inline-flex min-h-9 items-center justify-center rounded-[4px] px-2.5 text-[11px] font-semibold tracking-[0.02em] text-ed-fg-muted transition-colors hover:bg-ed-surface-strong hover:text-ed-fg active:bg-ed-surface-raised disabled:pointer-events-none disabled:opacity-30';

const chromeButtonClassLg =
    'inline-flex h-9 items-center justify-center rounded-[4px] border border-ed-rule bg-ed-surface px-3 text-[11px] font-semibold tracking-[0.02em] text-ed-fg-muted transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:bg-ed-surface-raised disabled:pointer-events-none disabled:opacity-30';

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

    const fontSizes = ['text-sm leading-relaxed', 'text-base leading-relaxed', 'text-lg leading-relaxed', 'text-xl leading-relaxed'];
    const fontLabels = ['Small', 'Normal', 'Large', 'Extra'];

    const pages = useMemo<PageType[]>(() => {
        if (issue.pages && issue.pages.length > 0) return issue.pages;
        if (issue.transcription?.pages && issue.transcription.pages.length > 0) return issue.transcription.pages;
        return [];
    }, [issue]);

    const highlightText = useCallback((text: string) => {
        if (!text) return '';
        if (highlightTerms.length === 0) return text;

        const regex = new RegExp(`(${highlightTerms.map(escapeRegExp).join('|')})`, 'gi');
        const parts = text.split(regex);

        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark
                    key={i}
                    data-match-index="true"
                    className="rounded-sm bg-ed-accent/25 px-0.5 py-0.5 text-ed-fg font-medium"
                >
                    {part}
                </mark>
            ) : (
                part
            )
        );
    }, [highlightTerms]);

    // Handle jumping to next / previous match
    const jumpToMatch = useCallback((dir: 'next' | 'prev') => {
        const matches = document.querySelectorAll('[data-match-index="true"]');
        if (matches.length === 0) return;

        let nextIdx = dir === 'next' ? currentMatch + 1 : currentMatch - 1;
        if (nextIdx >= matches.length) nextIdx = 0;
        if (nextIdx < 0) nextIdx = matches.length - 1;

        setCurrentMatch(nextIdx);
        const target = matches[nextIdx];
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('ring-2', 'ring-ed-accent');
            setTimeout(() => target.classList.remove('ring-2', 'ring-ed-accent'), 1500);
        }
    }, [currentMatch]);

    const activeMatchCount = highlightTerms.length > 0 ? matchCount : 0;

    useEffect(() => {
        if (highlightTerms.length === 0) return;

        const timer = setTimeout(() => {
            const matches = document.querySelectorAll('[data-match-index="true"]');
            setMatchCount(matches.length);
            if (matches.length > 0 && !hasScrolledToMatch.current) {
                hasScrolledToMatch.current = true;
                matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [highlightTerms]);

    const handleCopyParagraph = useCallback((text: string, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedBlockId(id);
        setTimeout(() => setCopiedBlockId(null), 2000);
    }, []);

    // Article outline for quick jumping
    const articleOutline = useMemo(() => {
        const list: Array<{ title: string; pageNumber: number; anchorId: string; type: string }> = [];
        pages.forEach((page) => {
            page.blocks?.forEach((block, bIdx) => {
                if ((block.type === 'article' || block.type === 'masthead') && block.title) {
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
    }, [pages]);

    // If facsimile mode is selected and pdfUrl is present, render the PDF Reader client
    if (viewKind === 'facsimile' && pdfUrl) {
        return (
            <div className="h-screen w-screen flex flex-col bg-ed-bg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-ed-surface border-b border-ed-rule">
                    <button
                        type="button"
                        onClick={() => setViewKind('text')}
                        className="rounded-[4px] border border-ed-rule bg-ed-surface px-3 py-2 text-[11px] font-semibold tracking-[0.02em] text-ed-accent transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong"
                    >
                        Return to Editorial Transcript
                    </button>
                    <span className="text-[11px] text-ed-fg-muted">{issue.date_label} Facsimile Scan</span>
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
        <main id="main-content" className="min-h-screen bg-ed-bg text-ed-fg relative">
            {/* Header */}
            <header className="sticky top-16 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-ed-rule bg-ed-bg/95 px-4 py-3 backdrop-blur-xl sm:px-7 sm:py-3.5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <Link href={backHref} aria-label="Back to search" className={chromeButtonClassLg}>Back</Link>
                    <div className="min-w-0">
                        <h1
                            className="truncate text-base sm:text-lg font-semibold tracking-tight text-ed-fg"
                            style={headingFontStyle}
                        >
                            Submitters Perspective
                        </h1>
                        <p className="truncate text-[11px] font-medium tracking-[0.02em] text-ed-fg-muted">{issue.date_label}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                    {/* In-Document Search Match Count */}
                    {activeMatchCount > 0 && (
                        <div className="flex items-center gap-1 rounded-[4px] border border-ed-rule bg-ed-surface px-2.5 py-1 text-xs text-ed-fg-muted">
                            <button
                                type="button"
                                onClick={() => jumpToMatch('prev')}
                                className="p-0.5 hover:text-ed-accent transition-colors"
                                aria-label="Previous match"
                            >
                                <span>Previous</span>
                            </button>
                            <span className="tabular-nums min-w-[3ch] text-center" aria-live="polite">
                                {currentMatch + 1} of {activeMatchCount}
                            </span>
                            <button
                                type="button"
                                onClick={() => jumpToMatch('next')}
                                className="p-0.5 hover:text-ed-accent transition-colors"
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
                            className={`${toolbarButtonClass} ${drawerOpen ? 'text-ed-accent bg-ed-accent-soft' : ''}`}
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
                            className={`${toolbarButtonClass} ${showTypePopover ? 'text-ed-accent bg-ed-accent-soft' : ''}`}
                            title="Reading appearance & font size"
                            aria-label="Reading appearance"
                        >
                            <span>Type</span>
                        </button>

                        {showTypePopover && (
                            <div className="absolute right-0 top-full z-30 mt-2 w-64 min-w-[180px] space-y-3 rounded-[8px] border border-ed-rule bg-ed-surface p-3 shadow-xl">
                                <div className="flex items-center justify-between text-xs font-sans uppercase tracking-[0.12em] text-ed-fg-muted pb-1 border-b border-ed-rule">
                                    <span>Typography</span>
                                    <button onClick={() => setShowTypePopover(false)} className="p-0.5 hover:text-ed-fg">
                                        <span>Close</span>
                                    </button>
                                </div>

                                {/* Font Size */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] text-ed-fg-muted">Font Size</div>
                                    <div className="flex items-center justify-between gap-1 bg-ed-surface-strong p-1 rounded-[4px]">
                                        <button
                                            type="button"
                                            disabled={fontSizeIndex <= 0}
                                            onClick={() => setFontSizeIndex((i) => Math.max(0, i - 1))}
                                            className="px-2.5 py-1 text-xs font-bold rounded-[4px] hover:bg-ed-surface-raised disabled:opacity-30"
                                        >
                                            Smaller
                                        </button>
                                        <span className="text-[11px] text-ed-accent">
                                            {fontLabels[fontSizeIndex]}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={fontSizeIndex >= fontSizes.length - 1}
                                            onClick={() => setFontSizeIndex((i) => Math.min(fontSizes.length - 1, i + 1))}
                                            className="px-2.5 py-1 text-xs font-bold rounded-[4px] hover:bg-ed-surface-raised disabled:opacity-30"
                                        >
                                            Larger
                                        </button>
                                    </div>
                                </div>

                                {/* Font Family */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] text-ed-fg-muted">Font Style</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setFontFamily('serif')}
                                            className={`py-1 px-2 rounded-[4px] text-xs font-serif border transition-colors ${fontFamily === 'serif' ? 'border-ed-accent/40 bg-ed-accent-soft text-ed-accent font-semibold' : 'border-ed-rule text-ed-fg-muted hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg'
                                                }`}
                                        >
                                            Serif
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFontFamily('sans')}
                                            className={`py-1 px-2 rounded-[4px] text-xs font-sans border transition-colors ${fontFamily === 'sans' ? 'border-ed-accent/40 bg-ed-accent-soft text-ed-accent font-semibold' : 'border-ed-rule text-ed-fg-muted hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg'
                                                }`}
                                        >
                                            DM Sans
                                        </button>
                                    </div>
                                </div>

                                {/* Reading Width */}
                                <div className="space-y-1.5">
                                    <div className="text-[11px] text-ed-fg-muted">Reading Width</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setReadingWidth('standard')}
                                            className={`py-1 px-2 rounded-[4px] text-xs border transition-colors ${readingWidth === 'standard' ? 'border-ed-accent/40 bg-ed-accent-soft text-ed-accent font-semibold' : 'border-ed-rule text-ed-fg-muted hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg'
                                                }`}
                                        >
                                            Standard
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setReadingWidth('wide')}
                                            className={`py-1 px-2 rounded-[4px] text-xs border transition-colors ${readingWidth === 'wide' ? 'border-ed-accent/40 bg-ed-accent-soft text-ed-accent font-semibold' : 'border-ed-rule text-ed-fg-muted hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg'
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
                            className="hidden sm:flex items-center gap-1.5 rounded-[4px] border border-ed-rule bg-ed-surface px-3 py-1.5 text-xs font-semibold text-ed-accent transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong"
                            title="View original scanned PDF facsimile"
                        >
                            Facsimile PDF
                        </button>
                    )}

                    {/* Issue Prev / Next */}
                    {(prevId || nextId) && (
                        <div className="flex items-center gap-0.5 border-l border-ed-rule pl-1.5 ml-1">
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
                </div>
            </header>

            {/* Layout Wrapper with Side Article Drawer */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Article Outline Drawer */}
                {drawerOpen && (
                    <aside className="w-64 sm:w-72 shrink-0 border-r border-ed-rule bg-ed-surface/80 backdrop-blur-xl p-4 overflow-y-auto z-20 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-ed-rule">
                            <span className="text-xs font-sans uppercase tracking-[0.12em] text-ed-fg-muted">
                                Issue Contents
                            </span>
                            <button onClick={() => setDrawerOpen(false)} className="p-1 text-ed-fg-muted hover:text-ed-fg">
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
                                    className="block p-2 rounded-[4px] text-xs font-medium text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="truncate">{art.title}</span>
                                        <span className="text-[10px] text-ed-accent shrink-0">
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
                            className="space-y-10 pb-12 border-b border-ed-rule last:border-0 relative scroll-mt-24"
                        >
                            {/* Page header marker */}
                            <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.02em] text-ed-fg-muted/60 pb-2 border-b border-ed-rule/40 uppercase tracking-widest">
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
                                                className="text-2xl sm:text-3xl font-semibold tracking-tight text-ed-fg"
                                                style={headingFontStyle}
                                            >
                                                {highlightText(pageTitle)}
                                            </h3>
                                        )}
                                        <div className={`space-y-5 text-ed-fg/90 whitespace-pre-line ${fontSizes[fontSizeIndex]}`}>
                                            {paragraphs.map((p, i) => {
                                                const blockId = `p-${pIdx}-${i}`;
                                                return (
                                                    <div key={i} className="group relative">
                                                        <p>{highlightText(p)}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCopyParagraph(p, blockId)}
                                                            className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-1 text-[10px] font-semibold text-ed-fg-muted hover:text-ed-accent"
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
                                            className="text-center space-y-4 pb-8 mb-8 border-b-2 border-ed-accent/20"
                                        >
                                            {block.arabic_header && (
                                                <p className="text-2xl text-ed-fg-muted font-arabic leading-loose">
                                                    {block.arabic_header}
                                                </p>
                                            )}
                                            <h2
                                                className="text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.08] tracking-[-0.03em] text-ed-fg"
                                                style={headingFontStyle}
                                            >
                                                {highlightText(block.title || 'MUSLIM PERSPECTIVE')}
                                            </h2>
                                            <div className="flex justify-center items-center gap-4 text-xs font-sans uppercase tracking-[0.12em] text-ed-fg-muted">
                                                <span>{block.publisher}</span>
                                                <span className="h-px w-8 bg-ed-rule"></span>
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
                                                    className="text-xl sm:text-2xl font-bold leading-[1.25] tracking-[-0.018em] text-ed-fg"
                                                    style={headingFontStyle}
                                                >
                                                    {highlightText(block.title)}
                                                </h3>
                                            )}
                                            <div className={`space-y-5 text-ed-fg/90 ${fontSizes[fontSizeIndex]}`}>
                                                {block.paragraphs?.map((p: string, i: number) => {
                                                    const paraId = `${blockId}-p-${i}`;
                                                    return (
                                                        <div key={i} className="group relative">
                                                            <p>{highlightText(p)}</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCopyParagraph(p, paraId)}
                                                                className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity px-1.5 py-1 text-[10px] font-semibold text-ed-fg-muted hover:text-ed-accent"
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
                                            className="my-8 rounded-[8px] border border-ed-accent/20 bg-ed-accent-soft/40 p-6 sm:p-8"
                                        >
                                            {block.title && (
                                                <h4
                                                    className="text-xl font-bold tracking-tight text-ed-accent mb-4"
                                                    style={headingFontStyle}
                                                >
                                                    {highlightText(block.title)}
                                                </h4>
                                            )}
                                            {block.text && (
                                                <p className={`text-ed-fg leading-relaxed ${fontSizes[fontSizeIndex]}`}>
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
                                                    className="text-xl font-semibold tracking-tight text-ed-fg"
                                                    style={headingFontStyle}
                                                >
                                                    {highlightText(block.title)}
                                                </h4>
                                            )}
                                            <ul className={`list-none pl-0 space-y-3 text-ed-fg/90 ${fontSizes[fontSizeIndex]}`}>
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
                    className="rounded-[4px] border border-ed-rule bg-ed-surface/95 px-3 py-2 text-[11px] font-semibold tracking-[0.02em] text-ed-fg-muted shadow-lg backdrop-blur-xl hover:bg-ed-surface-strong hover:text-ed-fg transition-colors"
                    aria-label="Back to top"
                    title="Back to top"
                >
                    <span>Back to top</span>
                </button>
            </div>
        </main>
    );
}
