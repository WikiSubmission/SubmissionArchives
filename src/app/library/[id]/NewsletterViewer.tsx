'use client';

import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { activeChipClass, chromeButtonClassLg, IconBadge } from '@/components/home/WidgetAccents';

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
    // Special editions (e.g. bulletins, bonus issues) were transcribed with a
    // simpler page-level text schema instead of typed blocks.
    plain_text?: string;
    transcription?: string;
    transcription_text?: string;
};

type PageTitleEntry = string | { page_number: number; title: string };

type IssueType = {
    issue_id: string;
    date_label: string;
    pages?: PageType[];
    transcription?: {
        pages?: PageType[];
    };
    page_titles?: PageTitleEntry[];
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

export default function NewsletterViewer({ issue, query }: { issue: IssueType; query?: string }) {
    // Function to highlight text based on query (rudimentary highlighting)
    const highlightText = (text: string) => {
        if (!query) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <mark key={i} className="bg-ed-accent/30 text-ed-accent rounded px-1">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };

    return (
        <main id="main-content" className="min-h-screen bg-ed-bg text-ed-fg">
            {/* Header */}
            <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-ed-rule bg-ed-bg/80 px-4 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <Link
                        href="/search"
                        aria-label="Back to search"
                        className={chromeButtonClassLg}
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="truncate text-lg font-medium tracking-tight text-ed-fg sm:text-xl">
                            Submitters Perspective
                        </h1>
                        <p className="truncate text-xs text-ed-fg-muted sm:text-sm">{issue.date_label}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <IconBadge>
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconBadge>
                    <span className={`hidden rounded-full border px-3 py-1.5 text-xs uppercase tracking-[0.2em] sm:inline-flex ${activeChipClass}`}>
                        Newsletter
                    </span>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-4 sm:p-10 space-y-10 sm:space-y-16">
                {(issue.transcription?.pages ?? issue.pages ?? []).map((page: PageType, pIdx: number) => (
                    <div key={pIdx} className="space-y-12 pb-16 border-b border-ed-rule last:border-0 relative">
                        {/* Page Marker */}
                        <div className="absolute -left-12 top-0 h-full hidden lg:block">
                            <div className="sticky top-24 font-mono text-xs text-ed-fg-muted/40 uppercase tracking-widest whitespace-nowrap rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                PAGE {page.page_number}
                            </div>
                        </div>

                        {!page.blocks?.length && (() => {
                            const pageTitle = getPageTitle(issue, page, pIdx);
                            const fallbackText = getFallbackPageText(page);
                            const paragraphs = fallbackText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
                            return (
                                <article className="space-y-6">
                                    {pageTitle && (
                                        <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ed-fg">
                                            {highlightText(pageTitle)}
                                        </h3>
                                    )}
                                    <div className="space-y-5 text-lg leading-relaxed text-ed-fg/90 whitespace-pre-line">
                                        {paragraphs.map((p, i) => (
                                            <p key={i}>{highlightText(p)}</p>
                                        ))}
                                    </div>
                                </article>
                            );
                        })()}

                        {page.blocks?.map((block: BlockType, bIdx: number) => {
                            if (block.type === 'masthead') {
                                return (
                                    <div key={bIdx} className="text-center space-y-4 pb-8 mb-8 border-b-2 border-ed-accent/20">
                                        {block.arabic_header && (
                                            <p className="text-2xl text-ed-fg-muted font-arabic leading-loose">
                                                {block.arabic_header}
                                            </p>
                                        )}
                                        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-ed-fg">
                                            {highlightText(block.title || 'MUSLIM PERSPECTIVE')}
                                        </h2>
                                        <div className="flex justify-center items-center gap-4 text-sm uppercase tracking-widest text-ed-fg-muted">
                                            <span>{block.publisher}</span>
                                            <span className="w-1.5 h-1.5 rounded-full bg-ed-accent/50"></span>
                                            <span>{block.date}</span>
                                        </div>
                                    </div>
                                );
                            }

                            if (block.type === 'article') {
                                return (
                                    <article key={bIdx} className="space-y-6">
                                        {block.title && (
                                            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ed-fg">
                                                {highlightText(block.title)}
                                            </h3>
                                        )}
                                        <div className="space-y-5 text-lg leading-relaxed text-ed-fg/90">
                                            {block.paragraphs?.map((p: string, i: number) => (
                                                <p key={i}>{highlightText(p)}</p>
                                            ))}
                                        </div>
                                    </article>
                                );
                            }

                            if (block.type === 'callout') {
                                return (
                                    <aside key={bIdx} className="my-8 rounded-2xl border border-ed-accent/20 bg-ed-accent/5 p-6 sm:p-8">
                                        {block.title && (
                                            <h4 className="text-xl font-bold tracking-tight text-ed-accent mb-4">
                                                {highlightText(block.title)}
                                            </h4>
                                        )}
                                        {block.text && (
                                            <p className="text-lg leading-relaxed text-ed-fg">
                                                {highlightText(block.text)}
                                            </p>
                                        )}
                                    </aside>
                                );
                            }

                            if (block.type === 'list') {
                                return (
                                    <div key={bIdx} className="space-y-4 my-8">
                                        {block.title && (
                                            <h4 className="text-xl font-semibold tracking-tight text-ed-fg">
                                                {highlightText(block.title)}
                                            </h4>
                                        )}
                                        <ul className="list-disc pl-6 space-y-3 text-lg leading-relaxed text-ed-fg/90">
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
        </main>
    );
}
