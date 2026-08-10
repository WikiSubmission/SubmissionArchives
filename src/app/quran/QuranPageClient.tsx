'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlass, SquaresFour, List, X, BookOpen } from '@phosphor-icons/react';
import ScriptureTabs from '@/components/layout/ScriptureTabs';
import type { QuranChapterSummary } from './page';

type Props = {
  chapters: QuranChapterSummary[];
};

export default function QuranPageClient({ chapters }: Props) {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredChapters = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return chapters;
    return chapters.filter(
      (c) =>
        String(c.chapterNumber).includes(normalized) ||
        c.titleEnglish.toLowerCase().includes(normalized) ||
        c.titleTransliterated.toLowerCase().includes(normalized),
    );
  }, [chapters, query]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-[#f5f5f7] selection:bg-white/20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.08]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
          <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-white/[0.01] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
            Scripture
          </p>
          <h1 className="mt-6 font-serif text-[clamp(2.75rem,8vw,5rem)] leading-[1.05] tracking-tight text-white">
            The Qur&apos;an
          </h1>
          <p className="mt-6 max-w-[50ch] font-serif text-lg leading-relaxed text-neutral-400 sm:text-xl">
            114 surahs, with Arabic text, English translation, transliteration, and footnotes.
          </p>

          <ScriptureTabs />
        </div>


      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-5 py-3 sm:px-8">
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a surah by name or number..."
              aria-label="Filter surahs"
              className="h-11 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-2.5 pl-10 pr-9 text-sm text-white placeholder:text-neutral-500 transition-all focus:border-white/20 focus:bg-white/[0.06] focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition-colors hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <span className="hidden shrink-0 font-mono text-xs tabular-nums text-neutral-500 sm:block">
            {filteredChapters.length}/{chapters.length}
          </span>

          <div
            className="flex shrink-0 rounded-xl border border-white/[0.08] p-0.5"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
              className={cn(
                'rounded-lg p-2.5 transition-colors active:scale-[0.95]',
                viewMode === 'grid'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white',
              )}
            >
              <SquaresFour className="h-4 w-4" weight={viewMode === 'grid' ? 'fill' : 'regular'} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
              className={cn(
                'rounded-lg p-2.5 transition-colors active:scale-[0.95]',
                viewMode === 'list'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white',
              )}
            >
              <List className="h-4 w-4" weight={viewMode === 'list' ? 'bold' : 'regular'} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        {filteredChapters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] px-6 py-24 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-neutral-600" />
            <p className="mt-4 font-serif text-xl text-neutral-400">
              No surah matches &quot;{query}&quot;.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 text-sm font-medium text-white hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredChapters.map((chapter) => (
              <Link
                key={chapter.chapterNumber}
                href={`/scripture/quran/${chapter.chapterNumber}`}
                className="group relative flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs tabular-nums text-neutral-500">
                    {String(chapter.chapterNumber).padStart(3, '0')}
                  </span>
                  <span
                    dir="rtl"
                    className="font-arabic text-lg leading-none text-neutral-400 transition-colors group-hover:text-white sm:text-xl"
                  >
                    {chapter.titleArabic}
                  </span>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-serif text-base font-medium text-white transition-colors sm:text-lg">
                    {chapter.titleTransliterated}
                  </h2>
                  <p className="mt-1 truncate text-xs text-neutral-400 sm:text-sm">
                    {chapter.titleEnglish} &middot; {chapter.verseCount}v
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04] overflow-hidden rounded-2xl border border-white/[0.06]">
            {filteredChapters.map((chapter) => (
              <Link
                key={chapter.chapterNumber}
                href={`/scripture/quran/${chapter.chapterNumber}`}
                className="group flex items-center gap-3 bg-white/[0.01] px-5 py-4 transition-colors hover:bg-white/[0.04] sm:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-inset"
              >
                <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums text-neutral-300 transition-colors group-hover:text-white">
                  {chapter.chapterNumber}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h2 className="truncate font-serif text-base font-medium text-white">
                      {chapter.titleTransliterated}
                    </h2>
                    <span className="hidden truncate text-sm text-neutral-300 md:inline">
                      {chapter.titleEnglish}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-neutral-300 md:hidden">
                    {chapter.titleEnglish} &middot; {chapter.verseCount} verses
                  </p>
                </div>

                <span
                  dir="rtl"
                  className="hidden shrink-0 font-arabic text-lg text-neutral-300 sm:block group-hover:text-white transition-colors"
                >
                  {chapter.titleArabic}
                </span>

                <span className="hidden w-20 shrink-0 text-right font-mono text-xs tabular-nums text-neutral-300 md:block">
                  {chapter.verseCount} verses
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
