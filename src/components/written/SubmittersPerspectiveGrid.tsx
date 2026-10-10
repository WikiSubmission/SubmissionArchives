'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, Newspaper, Search, X } from 'lucide-react';
import type { NewsletterIssue } from '@/lib/newsletterCatalog';
import PerspectivePreviewModal from './PerspectivePreviewModal';

type Props = {
    issues: NewsletterIssue[];
};

export default function SubmittersPerspectiveGrid({ issues }: Props) {
    const [selectedIssue, setSelectedIssue] = useState<NewsletterIssue | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [query, setQuery] = useState('');

    const years = useMemo(() => Array.from(new Set(issues.map((issue) => issue.year))).sort((a, b) => a - b), [issues]);
    const filteredIssues = useMemo(() => {
        const normalizedQuery = query.trim().toLocaleLowerCase();
        return issues.filter((issue) => {
            if (selectedYear !== null && issue.year !== selectedYear) return false;
            if (!normalizedQuery) return true;
            return [issue.title, issue.date, issue.year.toString(), ...(issue.summary?.articles.map((article) => article.title) ?? [])]
                .some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
        });
    }, [issues, query, selectedYear]);

    const groupedIssues = useMemo(() => {
        const groups = new Map<number, NewsletterIssue[]>();
        for (const issue of filteredIssues) groups.set(issue.year, [...(groups.get(issue.year) ?? []), issue]);
        return Array.from(groups.entries()).sort(([left], [right]) => left - right);
    }, [filteredIssues]);

    return (
        <>
            <div className="mb-6 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <p className="max-w-[65ch] text-[13px] leading-relaxed text-ed-fg-secondary">
                        Browse the monthly record in publication order, with each year collected into its own shelf.
                    </p>
                    <label className="relative block w-full lg:w-[280px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" aria-hidden="true" />
                        <span className="sr-only">Search issues and article titles</span>
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search issues or articles"
                            className="h-10 w-full rounded-[4px] border border-ed-rule bg-ed-surface py-2 pl-9 pr-9 text-[12px] text-ed-fg placeholder:text-ed-fg-muted focus:border-ed-accent focus:outline-none focus:ring-2 focus:ring-ed-accent/30"
                        />
                        {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear issue search" className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[4px] text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"><X className="h-3.5 w-3.5" aria-hidden="true" /></button>}
                    </label>
                </div>

                <nav aria-label="Filter Submitters Perspectives by year" className="flex gap-1 overflow-x-auto border-y border-ed-rule py-2">
                    <button
                        type="button"
                        onClick={() => setSelectedYear(null)}
                        aria-pressed={selectedYear === null}
                        className={`shrink-0 rounded-[4px] px-3 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${selectedYear === null ? 'bg-ed-fg text-ed-bg' : 'text-ed-fg-secondary hover:bg-ed-surface-strong hover:text-ed-fg'}`}
                    >
                        All years <span className="ml-1 tabular-nums opacity-70">{issues.length}</span>
                    </button>
                    {years.map((year) => {
                        const count = issues.filter((issue) => issue.year === year).length;
                        const active = selectedYear === year;
                        return (
                            <button
                                key={year}
                                type="button"
                                onClick={() => setSelectedYear(active ? null : year)}
                                aria-pressed={active}
                                className={`shrink-0 rounded-[4px] px-3 py-2 text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${active ? 'bg-ed-fg text-ed-bg' : 'text-ed-fg-secondary hover:bg-ed-surface-strong hover:text-ed-fg'}`}
                            >
                                {year} <span className="ml-1 opacity-70">{count}</span>
                            </button>
                        );
                    })}
                    <span className="ml-auto hidden shrink-0 self-center text-[11px] tabular-nums text-ed-fg-muted sm:inline" aria-live="polite">
                        Showing {filteredIssues.length} of {issues.length} issues
                    </span>
                </nav>
            </div>

            {groupedIssues.length > 0 ? (
                <div className="space-y-9">
                    {groupedIssues.map(([year, yearIssues]) => (
                        <section key={year} aria-labelledby={`perspectives-year-${year}`}>
                            <header className="mb-3 flex items-baseline gap-3 border-b border-ed-rule pb-2">
                                <h3 id={`perspectives-year-${year}`} className="text-[25px] font-semibold leading-none text-ed-fg" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                    {year}
                                </h3>
                                <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-ed-fg-muted">
                                    {yearIssues.length} {yearIssues.length === 1 ? 'issue' : 'issues'}
                                </span>
                                <div className="h-px flex-1 bg-ed-rule" />
                                {selectedYear !== null && <button type="button" onClick={() => setSelectedYear(null)} className="text-[11px] font-semibold text-ed-accent hover:text-ed-accent-strong">All years</button>}
                            </header>

                            <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 xl:grid-cols-3">
                                {yearIssues.map((issue) => {
                                    const articleCount = issue.summary?.articles.length ?? 0;
                                    return (
                                        <article key={issue.id} className="grid min-h-[116px] grid-cols-[68px_minmax(0,1fr)] gap-3 border-b border-ed-rule py-3">
                                            <Link
                                                href={`/library/${issue.id}`}
                                                aria-label={`Read ${issue.title}`}
                                                className="relative block h-[92px] w-[68px] overflow-hidden border border-ed-rule bg-ed-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                            >
                                                {issue.thumbnailOverride ? (
                                                    <Image src={issue.thumbnailOverride} alt={`Cover of ${issue.title}`} fill className="object-cover object-right" sizes="68px" />
                                                ) : (
                                                    <span className="flex h-full items-center justify-center text-ed-fg-muted"><Newspaper className="h-5 w-5" aria-hidden="true" /></span>
                                                )}
                                            </Link>
                                            <div className="flex min-w-0 flex-col">
                                                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-accent">{issue.date}</p>
                                                <h4 className="mt-1 line-clamp-1 text-[14px] font-semibold text-ed-fg" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>
                                                    <Link href={`/library/${issue.id}`} className="rounded-sm hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">Submitter Perspectives</Link>
                                                </h4>
                                                <p className="mt-1 text-[10px] text-ed-fg-muted">
                                                    {articleCount} {articleCount === 1 ? 'article' : 'articles'}{issue.summary?.pageCount ? ` · ${issue.summary.pageCount} pages` : ''}
                                                </p>
                                                <div className="mt-auto flex items-center gap-3 pt-2">
                                                    <button type="button" onClick={() => setSelectedIssue(issue)} className="text-[10px] font-semibold text-ed-fg-secondary transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">Contents</button>
                                                    <Link href={`/library/${issue.id}`} className="inline-flex items-center gap-1 text-[10px] font-semibold text-ed-fg-secondary transition-colors hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">
                                                        Read issue <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="border-y border-ed-rule py-12 text-center">
                    <p className="text-lg text-ed-fg" style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}>No issues found</p>
                    <p className="mt-1 text-sm text-ed-fg-secondary">Try another year, month, or article title.</p>
                    <button type="button" onClick={() => { setQuery(''); setSelectedYear(null); }} className="mt-4 text-xs font-semibold text-ed-accent hover:text-ed-accent-strong">Show all issues</button>
                </div>
            )}

            {selectedIssue && (
                <PerspectivePreviewModal
                    issue={selectedIssue}
                    allIssues={issues}
                    onClose={() => setSelectedIssue(null)}
                    onSelectIssue={setSelectedIssue}
                />
            )}
        </>
    );
}
