'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, FileText } from 'lucide-react';
import type { QuranChapterSummary } from './page';

export default function QuranPageClient({ chapters }: { chapters: QuranChapterSummary[] }) {
    const [query, setQuery] = useState('');

    const filteredChapters = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return chapters;
        return chapters.filter((chapter) =>
            String(chapter.chapterNumber).includes(normalized)
            || chapter.titleEnglish.toLowerCase().includes(normalized)
            || chapter.titleTransliterated.toLowerCase().includes(normalized)
        );
    }, [chapters, query]);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <main id="main-content" className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="grid gap-10 border-y border-ed-rule py-10 sm:py-12 lg:grid-cols-[1fr_0.9fr]">
                        <div className="relative z-10 space-y-6">
                            <p className="archive-kicker border-l-2 border-ed-accent pl-3">Scripture</p>
                            <h1 className="!mt-8 max-w-[16ch] font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] text-ed-fg">
                                The Qur&apos;an
                            </h1>
                            <p className="!mt-8 max-w-[62ch] text-base leading-8 text-ed-fg-muted sm:text-lg">
                                All 114 suras with Arabic text and the 1981, 1989, and 1992 English editions, including subtitles and footnotes by Dr. Rashad Khalifa.
                            </p>
                            <div className="pt-2">
                                <Link href="/quran/appendices" className="archive-button archive-button-primary inline-flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Read Appendices
                                </Link>
                            </div>
                        </div>

                        <div className="relative z-10 flex flex-col justify-end gap-3">
                            <label htmlFor="quran-chapter-search" className="sr-only">
                                Filter suras
                            </label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                                <input
                                    id="quran-chapter-search"
                                    name="quranChapterSearch"
                                    type="text"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Filter by sura name or number..."
                                    className="archive-input w-full py-3 pl-11 pr-4"
                                />
                            </div>
                            <span className="text-sm tabular-nums text-ed-fg-muted">
                                {filteredChapters.length} of {chapters.length} suras
                            </span>
                        </div>
                    </header>

                    <div className="mt-12 grid border-t border-ed-rule sm:grid-cols-2 lg:grid-cols-3">
                        {filteredChapters.map((chapter) => (
                            <Link
                                key={chapter.chapterNumber}
                                href={`/quran/${chapter.chapterNumber}`}
                                className="group flex min-h-24 items-center gap-4 border-b border-ed-rule p-4 transition-colors hover:bg-ed-surface sm:border-r sm:[&:nth-child(even)]:border-r-0 lg:[&:nth-child(even)]:border-r lg:[&:nth-child(3n)]:border-r-0"
                            >
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center border-r border-ed-rule pr-4 font-mono text-sm tabular-nums text-ed-accent">
                                    {chapter.chapterNumber}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate font-serif text-lg font-medium text-ed-fg transition-colors group-hover:text-ed-accent">
                                        {chapter.titleEnglish}
                                    </h2>
                                    <p className="truncate text-xs leading-5 text-ed-fg-muted">
                                        {chapter.titleTransliterated} &middot; {chapter.verseCount} verses
                                    </p>
                                </div>
                                <span dir="rtl" className="shrink-0 font-serif text-xl text-ed-fg-muted">
                                    {chapter.titleArabic}
                                </span>
                            </Link>
                        ))}
                    </div>

                    {filteredChapters.length === 0 ? (
                        <div className="mt-12 border-y border-ed-rule px-6 py-14 text-center">
                            <p className="font-display text-2xl text-ed-fg">No suras match &quot;{query}&quot;.</p>
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}
