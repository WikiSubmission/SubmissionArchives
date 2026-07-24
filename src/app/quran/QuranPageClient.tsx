'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Grid as GridIcon, List as ListIcon, ChevronRight, X } from 'lucide-react';
import { ReactBitsParticles } from '@/components/react-bits/ParticlesBackground';
import type { QuranChapterSummary } from './page';

export default function QuranPageClient({ chapters }: { chapters: QuranChapterSummary[] }) {
    const [query, setQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const filteredChapters = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        if (!normalized) return chapters;
        return chapters.filter((chapter) =>
            String(chapter.chapterNumber).includes(normalized) ||
            chapter.titleEnglish.toLowerCase().includes(normalized) ||
            chapter.titleTransliterated.toLowerCase().includes(normalized)
        );
    }, [chapters, query]);

    return (
        <div className="min-h-screen bg-ed-bg font-sans text-ed-fg selection:bg-ed-accent/30">
            {/* ----------------- Hero ----------------- */}
            <div className="relative overflow-hidden border-b border-ed-rule">
                {/* React Bits Animated Background */}
                <ReactBitsParticles
                    particleCount={75}
                    speed={0.4}
                    particleColors={['#fbbf24', '#f59e0b', '#d97706', '#ffffff']}
                    particleBaseSize={2.2}
                    moveParticlesOnHover={true}
                />

                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-ed-accent/[0.07] blur-[110px]" />
                </div>

                <div className="relative mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ed-accent">
                        Scripture
                    </p>
                    <h1 className="mt-6 font-serif text-[clamp(2.75rem,9vw,5rem)] leading-[1.05] tracking-tight text-ed-fg sm:mt-7">
                        The Qur&apos;an
                    </h1>
                    <p className="mt-6 max-w-[50ch] text-base leading-relaxed text-ed-fg-muted sm:mt-7 sm:text-lg">
                        114 surahs, with Arabic text, English translation, transliteration, and footnotes.
                    </p>
                    <Link
                        href="/quran/appendices"
                        className="mt-9 inline-flex items-center rounded-full border border-ed-rule px-5 py-2.5 text-sm font-medium text-ed-accent transition-colors hover:border-ed-accent/50 hover:bg-ed-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/50"
                    >
                        Read appendices
                    </Link>
                </div>
            </div>

            {/* ----------------- Sticky filter bar ----------------- */}
            <div className="sticky top-0 z-10 border-b border-ed-rule bg-ed-bg/85 backdrop-blur-md">
                <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-5 py-3 sm:px-8">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Find a surah by name or number…"
                            aria-label="Filter surahs"
                            className="w-full rounded-lg border border-ed-rule bg-ed-surface/50 py-2.5 pl-10 pr-9 text-sm text-ed-fg placeholder:text-ed-fg-muted/60 transition-colors focus:border-ed-accent focus:bg-ed-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/40"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                aria-label="Clear filter"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ed-fg-muted transition-colors hover:text-ed-fg"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <span className="hidden shrink-0 font-mono text-xs tabular-nums text-ed-fg-muted/70 sm:block">
                        {filteredChapters.length}/{chapters.length}
                    </span>

                    <div className="flex shrink-0 rounded-lg border border-ed-rule p-0.5" role="group" aria-label="View mode">
                        <button
                            type="button"
                            onClick={() => setViewMode('grid')}
                            aria-pressed={viewMode === 'grid'}
                            aria-label="Grid view"
                            className={`rounded-[5px] p-2 transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-ed-surface-strong text-ed-accent'
                                    : 'text-ed-fg-muted hover:text-ed-fg'
                            }`}
                        >
                            <GridIcon className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('list')}
                            aria-pressed={viewMode === 'list'}
                            aria-label="List view"
                            className={`rounded-[5px] p-2 transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-ed-surface-strong text-ed-accent'
                                    : 'text-ed-fg-muted hover:text-ed-fg'
                            }`}
                        >
                            <ListIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ----------------- Content ----------------- */}
            <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10">
                {filteredChapters.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ed-rule-strong px-6 py-24 text-center">
                        <p className="font-serif text-xl text-ed-fg-muted">
                            No surah matches &quot;{query}&quot;.
                        </p>
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            className="mt-4 text-sm font-medium text-ed-accent hover:underline"
                        >
                            Clear filter
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    /* --- GRID VIEW --- */
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {filteredChapters.map((chapter) => (
                            <Link
                                key={chapter.chapterNumber}
                                href={`/quran/${chapter.chapterNumber}`}
                                className="group relative flex flex-col gap-5 rounded-xl border border-ed-rule bg-ed-surface/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-ed-accent/40 hover:bg-ed-surface sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/50"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="font-mono text-xs tabular-nums text-ed-fg-muted/60">
                                        {String(chapter.chapterNumber).padStart(3, '0')}
                                    </span>
                                    <span
                                        dir="rtl"
                                        className="font-arabic text-lg leading-none text-ed-fg-muted/70 transition-colors group-hover:text-ed-accent sm:text-xl"
                                    >
                                        {chapter.titleArabic}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <h2 className="truncate font-serif text-base font-medium text-ed-fg transition-colors group-hover:text-ed-accent sm:text-lg">
                                        {chapter.titleTransliterated}
                                    </h2>
                                    <p className="mt-1 truncate text-xs text-ed-fg-muted sm:text-sm">
                                        {chapter.titleEnglish} · {chapter.verseCount}v
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    /* --- LIST VIEW --- */
                    <div className="divide-y divide-ed-rule/70 overflow-hidden rounded-xl border border-ed-rule">
                        {filteredChapters.map((chapter) => (
                            <Link
                                key={chapter.chapterNumber}
                                href={`/quran/${chapter.chapterNumber}`}
                                className="group flex items-center gap-3 bg-ed-surface/20 px-4 py-3.5 transition-colors hover:bg-ed-surface sm:gap-4 sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/50 focus-visible:ring-inset"
                            >
                                <span className="w-7 shrink-0 text-right font-mono text-sm tabular-nums text-ed-fg-muted/50 transition-colors group-hover:text-ed-accent sm:w-8">
                                    {chapter.chapterNumber}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-baseline gap-2">
                                        <h2 className="truncate font-serif text-base font-medium text-ed-fg transition-colors group-hover:text-ed-accent">
                                            {chapter.titleTransliterated}
                                        </h2>
                                        <span className="hidden truncate text-sm text-ed-fg-muted md:inline">
                                            {chapter.titleEnglish}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-ed-fg-muted md:hidden">
                                        {chapter.titleEnglish} · {chapter.verseCount} verses
                                    </p>
                                </div>

                                <span
                                    dir="rtl"
                                    className="hidden shrink-0 font-arabic text-lg text-ed-fg-muted/70 sm:block"
                                >
                                    {chapter.titleArabic}
                                </span>

                                <span className="hidden w-20 shrink-0 text-right font-mono text-xs tabular-nums text-ed-fg-muted/50 md:block">
                                    {chapter.verseCount} verses
                                </span>

                                <ChevronRight className="hidden h-4 w-4 shrink-0 text-ed-fg-muted/30 transition-colors group-hover:text-ed-accent sm:block" />
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
