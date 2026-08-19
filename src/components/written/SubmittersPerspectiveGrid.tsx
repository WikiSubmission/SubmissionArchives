'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Newspaper, ArrowUpRight, Info } from 'lucide-react';
import type { NewsletterIssue } from '@/lib/newsletterCatalog';
import PerspectivePreviewModal from './PerspectivePreviewModal';

type Props = {
    issues: NewsletterIssue[];
};

export default function SubmittersPerspectiveGrid({ issues }: Props) {
    const [selectedIssue, setSelectedIssue] = useState<NewsletterIssue | null>(null);

    return (
        <>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {issues.map((issue) => {
                    const articlesCount = issue.summary?.articles.length || 0;
                    return (
                        <button
                            key={issue.id}
                            type="button"
                            onClick={() => setSelectedIssue(issue)}
                            className="group relative flex flex-col overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface p-3 text-left transition-all duration-[280ms] ease-out hover:-translate-y-1 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:shadow-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        >
                            {/* Cover Aspect Ratio 17:22 */}
                            <div className="relative aspect-[17/22] w-full overflow-hidden rounded-[4px] border border-ed-rule bg-ed-bg">
                                {issue.thumbnailOverride ? (
                                    <Image
                                        src={issue.thumbnailOverride}
                                        alt={`Cover of ${issue.title}`}
                                        fill
                                        className="object-cover object-right transition-transform duration-500 ease-out group-hover:scale-105"
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-ed-bg px-4 text-center text-ed-fg-muted">
                                        <Newspaper className="h-7 w-7 opacity-40" aria-hidden="true" />
                                        <span className="sr-only">No cover available</span>
                                    </div>
                                )}

                                {/* Overlay preview badge on hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <div className="rounded-full bg-ed-bg/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-semibold text-ed-fg shadow-lg flex items-center gap-1.5">
                                        <Info className="w-3.5 h-3.5 text-ed-accent" />
                                        <span>Preview Summary</span>
                                    </div>
                                </div>
                            </div>

                            {/* Newsletter Details */}
                            <div className="mt-3 flex flex-1 flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-1 mb-1">
                                        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ed-fg-muted">
                                            {issue.date}
                                        </span>
                                        {articlesCount > 0 && (
                                            <span className="text-[9px] font-medium font-mono text-ed-accent">
                                                {articlesCount} {articlesCount === 1 ? 'topic' : 'topics'}
                                            </span>
                                        )}
                                    </div>
                                    <h3
                                        className="line-clamp-2 text-[14px] font-semibold leading-[1.3] text-ed-fg transition-colors group-hover:text-ed-accent"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        {issue.title}
                                    </h3>
                                </div>

                                <div className="mt-3 flex items-center justify-between border-t border-ed-rule pt-2 text-[11px] font-medium text-ed-fg-muted group-hover:text-ed-fg">
                                    <span>Summary &amp; Articles</span>
                                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-ed-accent" />
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Modal Dialog */}
            {selectedIssue && (
                <PerspectivePreviewModal
                    issue={selectedIssue}
                    allIssues={issues}
                    onClose={() => setSelectedIssue(null)}
                    onSelectIssue={(next) => setSelectedIssue(next)}
                />
            )}
        </>
    );
}
