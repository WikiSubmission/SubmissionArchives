'use client';

import { useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
    X,
    BookOpen,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    Building2,
    FileText,
    Bookmark,
    Layers,
} from 'lucide-react';
import type { NewsletterIssue } from '@/lib/newsletterCatalog';

type Props = {
    issue: NewsletterIssue | null;
    allIssues: NewsletterIssue[];
    onClose: () => void;
    onSelectIssue: (issue: NewsletterIssue) => void;
};

export default function PerspectivePreviewModal({
    issue,
    allIssues,
    onClose,
    onSelectIssue,
}: Props) {
    const currentIndex = issue ? allIssues.findIndex((i) => i.id === issue.id) : -1;
    const prevIssue = currentIndex > 0 ? allIssues[currentIndex - 1] : null;
    const nextIssue = currentIndex >= 0 && currentIndex < allIssues.length - 1 ? allIssues[currentIndex + 1] : null;

    // Handle ESC key and arrow navigation
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowLeft' && prevIssue) {
                onSelectIssue(prevIssue);
            } else if (e.key === 'ArrowRight' && nextIssue) {
                onSelectIssue(nextIssue);
            }
        },
        [onClose, onSelectIssue, prevIssue, nextIssue]
    );

    useEffect(() => {
        if (!issue) return;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [issue, handleKeyDown]);

    if (!issue) return null;

    const summary = issue.summary;
    const publication = summary?.publication || 'Submitters Perspective';
    const publisher = summary?.publisher || 'Masjid Tucson';
    const editor = summary?.editor || 'Dr. Rashad Khalifa, Ph.D.';
    const hijriDate = summary?.hijriDate;
    const pageCount = summary?.pageCount || 4;
    const articles = summary?.articles || [];
    const verses = summary?.versesReferenced || [];

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-issue-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal Dialog Card */}
            <div className="relative z-10 flex flex-col w-full max-w-4xl max-h-[92vh] md:max-h-[88vh] rounded-xl border border-ed-rule bg-ed-bg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-ed-fg">
                {/* Top Mobile Bar with Title & Close */}
                <div className="flex items-center justify-between border-b border-ed-rule bg-ed-surface/80 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="inline-flex items-center gap-1 rounded border border-ed-accent/15 bg-ed-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ed-accent shrink-0">
                            Issue #{currentIndex + 1}
                        </span>
                        <span className="text-xs font-semibold text-ed-fg-secondary truncate">
                            {publication} · {issue.date}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        {/* Prev / Next Header Buttons */}
                        <div className="flex items-center gap-0.5 mr-2">
                            <button
                                type="button"
                                onClick={() => prevIssue && onSelectIssue(prevIssue)}
                                disabled={!prevIssue}
                                aria-label="Previous issue"
                                title="Previous issue (Left Arrow)"
                                className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => nextIssue && onSelectIssue(nextIssue)}
                                disabled={!nextIssue}
                                aria-label="Next issue"
                                title="Next issue (Right Arrow)"
                                className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close dialog"
                            className="rounded p-1 text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-fg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body Content (2 Columns on Desktop) */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr] divide-y md:divide-y-0 md:divide-x divide-ed-rule">
                    {/* Left Column: Cover & Issue Metadata */}
                    <div className="p-4 sm:p-6 bg-ed-surface/40 flex flex-col justify-between space-y-6">
                        <div className="space-y-5">
                            {/* Thumbnail Preview */}
                            <div className="relative aspect-[17/22] w-full max-w-[240px] mx-auto md:max-w-none overflow-hidden rounded-lg border border-ed-rule bg-ed-bg shadow-sm">
                                {issue.thumbnailOverride ? (
                                    <Image
                                        src={issue.thumbnailOverride}
                                        alt={`Cover facsimile of ${issue.title}`}
                                        fill
                                        className="object-cover object-right"
                                        sizes="(max-width: 768px) 240px, 340px"
                                        priority
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-ed-fg-muted">
                                        <FileText className="h-10 w-10 opacity-30 mb-2" />
                                        <span className="text-xs font-semibold">{issue.date}</span>
                                    </div>
                                )}
                            </div>

                            {/* Metadata Specs */}
                            <div className="rounded-lg border border-ed-rule bg-ed-surface p-3.5 space-y-2.5 text-[12px]">
                                <div className="flex items-start gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-ed-accent shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-semibold text-ed-fg">{issue.date}</div>
                                        {hijriDate && (
                                            <div className="text-[11px] text-ed-fg-muted">{hijriDate}</div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 border-t border-ed-rule pt-2">
                                    <User className="h-3.5 w-3.5 text-ed-accent shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-ed-fg-muted font-semibold">Editor</div>
                                        <div className="font-medium text-ed-fg">{editor}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 border-t border-ed-rule pt-2">
                                    <Building2 className="h-3.5 w-3.5 text-ed-accent shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-ed-fg-muted font-semibold">Publisher</div>
                                        <div className="font-medium text-ed-fg">{publisher}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 border-t border-ed-rule pt-2">
                                    <Layers className="h-3.5 w-3.5 text-ed-accent shrink-0 mt-0.5" />
                                    <div>
                                        <div className="text-[10px] uppercase tracking-wider text-ed-fg-muted font-semibold">Preservation Format</div>
                                        <div className="font-medium text-ed-fg">{pageCount} Pages · Scanned Facsimile & Text</div>
                                    </div>
                                </div>
                            </div>

                            {/* Verses Cited */}
                            {verses.length > 0 && (
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ed-fg-muted">
                                        <Bookmark className="h-3 w-3 text-ed-accent" />
                                        <span>Referenced Verses</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {verses.map((v, i) => (
                                            <span
                                                key={i}
                                                className="rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 text-[10px] font-mono font-medium text-ed-fg-secondary"
                                            >
                                                {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Title, Article Summaries & Action */}
                    <div className="p-4 sm:p-6 flex flex-col justify-between space-y-6">
                        <div className="space-y-6">
                            {/* Headline Header */}
                            <div className="space-y-2 border-b border-ed-rule pb-4">
                                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                                    Historical Transcripts & Articles
                                </div>
                                <h2
                                    id="modal-issue-title"
                                    className="text-2xl sm:text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-ed-fg"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    {publication} — {issue.date}
                                </h2>
                                <p
                                    className="text-[14px] text-ed-fg-secondary leading-[1.6]"
                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                >
                                    Preserved monthly publication from Masjid Tucson containing original Quranic research, theological studies, community news, and historical documentation.
                                </p>
                            </div>

                            {/* Table of Contents & Article Summaries */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
                                        Table of Contents ({articles.length} {articles.length === 1 ? 'Article' : 'Articles'})
                                    </span>
                                    <span className="text-[11px] text-ed-fg-faint">
                                        Click &apos;Read Full Issue&apos; to view all pages
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {articles.map((art, idx) => (
                                        <div
                                            key={idx}
                                            className="group rounded-lg border border-ed-rule bg-ed-surface/70 p-3.5 transition-all hover:border-ed-rule-strong hover:bg-ed-surface"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-1.5">
                                                <h3
                                                    className="text-[15px] font-semibold text-ed-fg leading-snug"
                                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                                >
                                                    {art.title}
                                                </h3>
                                                <span className="shrink-0 rounded-[4px] border border-ed-accent/20 bg-ed-accent-soft px-1.5 py-0.5 text-[10px] font-semibold font-mono text-ed-accent">
                                                    Page {art.page}
                                                </span>
                                            </div>

                                            {art.subtitle && (
                                                <div className="text-[12px] font-medium italic text-ed-accent mb-1">
                                                    {art.subtitle}
                                                </div>
                                            )}

                                            {art.byline && (
                                                <div className="text-[11px] font-semibold uppercase tracking-wider text-ed-fg-muted mb-1.5">
                                                    {art.byline}
                                                </div>
                                            )}

                                            {art.summary && (
                                                <p
                                                    className="text-[13px] text-ed-fg-secondary leading-[1.55]"
                                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                >
                                                    {art.summary}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule bg-ed-surface px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2 text-xs text-ed-fg-muted font-medium">
                        <span>Use</span>
                        <kbd className="rounded border border-ed-rule bg-ed-bg px-1.5 py-0.5 text-[10px] font-mono text-ed-fg">←</kbd>
                        <kbd className="rounded border border-ed-rule bg-ed-bg px-1.5 py-0.5 text-[10px] font-mono text-ed-fg">→</kbd>
                        <span>to browse issues</span>
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
                            href={`/library/${issue.id}`}
                            className="inline-flex items-center gap-2 rounded border border-ed-fg bg-ed-fg px-4 py-2 text-xs font-semibold text-ed-bg transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span>Read Full Issue</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
