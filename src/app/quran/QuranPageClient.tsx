'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { MagnifyingGlass, SquaresFour, List, X, BookOpen, ArrowRight } from '@phosphor-icons/react';
import ScriptureTabs from '@/components/layout/ScriptureTabs';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import type { QuranChapterSummary } from './page';

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type Props = {
  chapters: QuranChapterSummary[];
};

export default function QuranPageClient({ chapters }: Props) {
  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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
    <div className="min-h-screen bg-ed-bg font-sans text-ed-fg selection:bg-ed-accent/20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-ed-rule">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-ed-ambient-1 blur-[120px]" />
          <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-ed-ambient-2 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ed-fg-muted">
            Scripture
          </p>
          <h1 className="mt-6 font-serif text-[clamp(2.5rem,6.5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ed-fg">
            The Qur&apos;an
          </h1>
          <p className="mt-6 max-w-[50ch] font-serif text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg">
            114 surahs, with Arabic text, English translation, transliteration, and footnotes.
          </p>

          <ScriptureTabs />
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-30 border-b border-ed-rule bg-ed-bg/95 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-5 py-3 sm:px-8">
          <div className="relative flex-1">
            <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by surah name, number, or translation..."
              className="w-full rounded-xl border border-ed-rule bg-ed-surface/70 py-2 pl-10 pr-10 text-sm text-ed-fg placeholder:text-ed-fg-muted backdrop-blur-md transition-colors focus:border-ed-fg focus:bg-ed-surface focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ed-fg-muted transition-colors hover:text-ed-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 sm:flex">
                <kbd className="rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 font-mono text-[10px] text-ed-fg-muted">
                  /
                </kbd>
              </div>
            )}
          </div>

          {/* Grid / List Switcher with Motion */}
          <div
            className="flex shrink-0 rounded-xl border border-ed-rule bg-ed-surface/80 p-1"
            role="group"
            aria-label="View mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              aria-label="Grid view"
              className={cn(
                'relative rounded-lg p-2 transition-colors active:scale-[0.95]',
                viewMode === 'grid'
                  ? 'text-ed-bg font-semibold'
                  : 'text-ed-fg-muted hover:text-ed-fg',
              )}
            >
              {viewMode === 'grid' && (
                <motion.div
                  layoutId="active-quran-viewmode-pill"
                  className="absolute inset-0 rounded-lg bg-ed-fg shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <SquaresFour className="relative z-10 h-4 w-4" weight={viewMode === 'grid' ? 'fill' : 'regular'} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              aria-label="List view"
              className={cn(
                'relative rounded-lg p-2 transition-colors active:scale-[0.95]',
                viewMode === 'list'
                  ? 'text-ed-bg font-semibold'
                  : 'text-ed-fg-muted hover:text-ed-fg',
              )}
            >
              {viewMode === 'list' && (
                <motion.div
                  layoutId="active-quran-viewmode-pill"
                  className="absolute inset-0 rounded-lg bg-ed-fg shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <List className="relative z-10 h-4 w-4" weight={viewMode === 'list' ? 'bold' : 'regular'} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        {filteredChapters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ed-rule px-6 py-24 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-ed-fg-muted" />
            <p className="mt-4 font-serif text-xl text-ed-fg-muted">
              No surah matches &quot;{query}&quot;.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 text-sm font-medium text-ed-fg hover:underline"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              >
                {filteredChapters.map((chapter) => (
                  <SpotlightCard
                    key={chapter.chapterNumber}
                    href={`/scripture/quran/${chapter.chapterNumber}`}
                    className="h-full flex flex-col justify-between !p-4"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-ed-rule pb-2.5 mb-3">
                      <span className="font-mono text-xs tabular-nums text-ed-fg-muted group-hover:text-ed-fg transition-colors">
                        #{String(chapter.chapterNumber).padStart(3, '0')}
                      </span>
                      <span
                        dir="rtl"
                        className="font-arabic text-base leading-none text-ed-fg-muted transition-colors group-hover:text-ed-fg"
                      >
                        {chapter.titleArabic}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-serif text-sm sm:text-base font-semibold text-ed-fg transition-colors">
                        {chapter.titleTransliterated}
                      </h2>
                      <p className="mt-1 truncate text-xs text-ed-fg-muted">
                        {chapter.titleEnglish} &middot; {chapter.verseCount}v
                      </p>
                    </div>
                  </SpotlightCard>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                className="divide-y divide-ed-rule overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/40"
              >
                {filteredChapters.map((chapter) => (
                  <Link
                    key={chapter.chapterNumber}
                    href={`/scripture/quran/${chapter.chapterNumber}`}
                    className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ed-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-inset"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="w-10 shrink-0 font-mono text-xs font-semibold tabular-nums text-ed-fg-muted group-hover:text-ed-fg transition-colors">
                        #{String(chapter.chapterNumber).padStart(3, '0')}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <h2 className="truncate font-serif text-base font-semibold text-ed-fg">
                            {chapter.titleTransliterated}
                          </h2>
                          <span className="hidden sm:inline text-xs text-ed-fg-muted">
                            ({chapter.titleEnglish})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 shrink-0 text-xs">
                      <span
                        dir="rtl"
                        className="font-arabic text-base text-ed-fg-muted group-hover:text-ed-fg transition-colors"
                      >
                        {chapter.titleArabic}
                      </span>

                      <span className="font-mono text-xs text-ed-fg-muted tabular-nums">
                        {chapter.verseCount} verses
                      </span>

                      <ArrowRight className="h-4 w-4 text-ed-fg-muted group-hover:text-ed-fg group-hover:translate-x-0.5 transition-all duration-200" />
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
