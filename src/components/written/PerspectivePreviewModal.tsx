'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, Building2, Calendar, ChevronLeft, ChevronRight, FileText, User, X } from 'lucide-react';
import type { NewsletterIssue } from '@/lib/newsletterCatalog';

type Props = {
    issue: NewsletterIssue | null;
    allIssues: NewsletterIssue[];
    onClose: () => void;
    onSelectIssue: (issue: NewsletterIssue) => void;
};

export default function PerspectivePreviewModal({ issue, allIssues, onClose, onSelectIssue }: Props) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const currentIndex = issue ? allIssues.findIndex((item) => item.id === issue.id) : -1;
    const prevIssue = currentIndex > 0 ? allIssues[currentIndex - 1] : null;
    const nextIssue = currentIndex >= 0 && currentIndex < allIssues.length - 1 ? allIssues[currentIndex + 1] : null;

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
        else if (event.key === 'ArrowLeft' && prevIssue) onSelectIssue(prevIssue);
        else if (event.key === 'ArrowRight' && nextIssue) onSelectIssue(nextIssue);
    }, [onClose, onSelectIssue, prevIssue, nextIssue]);

    useEffect(() => {
        if (!issue) return;
        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        dialogRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus();
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
            previousFocus?.focus();
        };
    }, [issue, handleKeyDown]);

    if (!issue) return null;

    const summary = issue.summary;
    const publication = summary?.publication || 'Submitters Perspective';
    const publisher = summary?.publisher || 'Masjid Tucson';
    const editor = summary?.editor || 'Dr. Rashad Khalifa, Ph.D.';
    const articles = summary?.articles ?? [];
    const pageCount = summary?.pageCount;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-issue-title"
            ref={dialogRef}
            onKeyDown={(event) => {
                if (event.key !== 'Tab') return;
                const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]') ?? []);
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
        >
            <button type="button" aria-label="Close issue preview" onClick={onClose} className="absolute inset-0 h-full w-full cursor-default bg-black/75" />

            <div className="relative flex max-h-[94dvh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-bg shadow-2xl sm:max-h-[90dvh]">
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-6">
                    <div className="flex min-w-0 items-baseline gap-3">
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-ed-accent">{issue.year} issue {currentIndex + 1}</span>
                        <h2 id="modal-issue-title" className="truncate text-lg font-semibold text-ed-fg sm:text-xl" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                            {publication} · {issue.date}
                        </h2>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                        <button type="button" onClick={() => prevIssue && onSelectIssue(prevIssue)} disabled={!prevIssue} aria-label={prevIssue ? `Previous issue: ${prevIssue.date}` : 'No previous issue'} title="Previous issue (←)" className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] text-ed-fg-secondary hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
                        <button type="button" onClick={() => nextIssue && onSelectIssue(nextIssue)} disabled={!nextIssue} aria-label={nextIssue ? `Next issue: ${nextIssue.date}` : 'No next issue'} title="Next issue (→)" className="inline-flex h-10 w-10 items-center justify-center rounded-[4px] text-ed-fg-secondary hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
                        <button type="button" onClick={onClose} aria-label="Close preview" className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-[4px] border border-ed-rule text-ed-fg-secondary hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"><X className="h-4 w-4" aria-hidden="true" /></button>
                    </div>
                </header>

                <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[264px_minmax(0,1fr)] md:overflow-hidden">
                    <aside className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-ed-rule bg-ed-surface p-4 sm:grid-cols-[108px_minmax(0,1fr)] md:flex md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:p-6">
                        <div className="relative aspect-[17/22] w-full overflow-hidden border border-ed-rule bg-ed-bg md:mx-auto md:max-w-[190px]">
                            {issue.thumbnailOverride ? (
                                <Image src={issue.thumbnailOverride} alt={`Cover facsimile of ${issue.title}`} fill className="object-cover object-right" sizes="(max-width: 768px) 108px, 190px" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-ed-fg-muted"><FileText className="h-7 w-7" aria-hidden="true" /></div>
                            )}
                        </div>

                        <dl className="flex min-w-0 flex-col justify-center gap-3 text-[12px] md:mt-5 md:justify-start">
                            <div>
                                <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted"><Calendar className="h-3 w-3 text-ed-accent" aria-hidden="true" />Issue date</dt>
                                <dd className="mt-1 text-ed-fg">{issue.date}{summary?.hijriDate ? <span className="block text-ed-fg-muted">{summary.hijriDate}</span> : null}</dd>
                            </div>
                            <div>
                                <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted"><User className="h-3 w-3 text-ed-accent" aria-hidden="true" />Editor</dt>
                                <dd className="mt-1 leading-relaxed text-ed-fg-secondary">{editor}</dd>
                            </div>
                            <div>
                                <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted"><Building2 className="h-3 w-3 text-ed-accent" aria-hidden="true" />Publisher</dt>
                                <dd className="mt-1 leading-relaxed text-ed-fg-secondary">{publisher}</dd>
                            </div>
                            {pageCount ? <div>
                                <dt className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted"><FileText className="h-3 w-3 text-ed-accent" aria-hidden="true" />Preserved pages</dt>
                                <dd className="mt-1 text-ed-fg-secondary">{pageCount} page{pageCount === 1 ? '' : 's'} · scanned issue</dd>
                            </div> : null}
                        </dl>
                    </aside>

                    <section className="flex min-h-[360px] min-w-0 flex-col overflow-hidden p-4 sm:p-6">
                        <div className="mb-3 flex items-baseline justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ed-fg">Articles</h3>
                            <span className="text-[11px] tabular-nums text-ed-fg-muted">{articles.length} {articles.length === 1 ? 'article' : 'articles'}</span>
                        </div>

                        {articles.length > 0 ? (
                            <ol className="min-h-0 flex-1 divide-y divide-ed-rule overflow-y-auto border-y border-ed-rule">
                                {articles.map((article, index) => (
                                    <li key={`${article.page}-${index}`}>
                                        <Link href={`/library/${issue.id}?page=${article.page}`} className="group block px-2 py-3 transition-colors hover:bg-ed-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ed-accent sm:px-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <span className="text-[13px] font-semibold leading-snug text-ed-fg group-hover:text-ed-accent" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>{article.title}</span>
                                                <span className="shrink-0 font-mono text-[10px] tabular-nums text-ed-fg-muted">p. {article.page}</span>
                                            </div>
                                            {article.subtitle && <p className="mt-1 text-[11px] italic text-ed-accent">{article.subtitle}</p>}
                                            {article.byline && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-ed-fg-muted">{article.byline}</p>}
                                            {article.summary && <p className="mt-1.5 text-[12px] leading-relaxed text-ed-fg-secondary" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>{article.summary}</p>}
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p className="border-y border-ed-rule py-6 text-[13px] leading-relaxed text-ed-fg-secondary">
                                No article headings could be read from this issue’s scan. Open the full issue to browse its pages.
                            </p>
                        )}
                    </section>
                </div>

                <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-ed-rule bg-ed-surface px-4 py-3 sm:px-6">
                    <span className="hidden text-[10px] text-ed-fg-muted md:inline">← → browse the issue archive</span>
                    <Link href={`/library/${issue.id}`} className="ml-auto inline-flex h-10 items-center gap-2 rounded-[4px] bg-ed-fg px-4 text-[12px] font-semibold text-ed-bg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ed-surface">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                        Read full issue
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                </footer>
            </div>
        </div>
    );
}
