'use client';

import React from 'react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';

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
};

type IssueType = {
    issue_id: string;
    date_label: string;
    pages: PageType[];
    transcription?: {
        pages?: PageType[];
    };
};

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
            <header className="sticky top-0 z-10 border-b border-ed-rule bg-ed-bg/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/search"
                        aria-label="Back to search"
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-ed-muted/40 text-ed-fg hover:bg-ed-accent/20 hover:text-ed-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <h1 className="text-xl font-medium tracking-tight text-ed-fg">
                            Submitters Perspective
                        </h1>
                        <p className="text-sm text-ed-fg-muted">{issue.date_label}</p>
                    </div>
                </div>
                <div>
                    <span className="soft-pill px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-ed-accent border border-ed-accent/20 bg-ed-accent/10">
                        <BookOpen size={14} className="inline mr-2" />
                        Newsletter
                    </span>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-6 sm:p-10 space-y-16">
                {issue.transcription?.pages?.map((page: PageType, pIdx: number) => (
                    <div key={pIdx} className="space-y-12 pb-16 border-b border-ed-rule last:border-0 relative">
                        {/* Page Marker */}
                        <div className="absolute -left-12 top-0 h-full hidden lg:block">
                            <div className="sticky top-24 font-mono text-xs text-ed-fg-muted/40 uppercase tracking-widest whitespace-nowrap rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                PAGE {page.page_number}
                            </div>
                        </div>

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
