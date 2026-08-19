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

  const totalVerses = useMemo(
    () => chapters.reduce((sum, chapter) => sum + chapter.verseCount, 0),
    [chapters],
  );

  return (
    <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans antialiased selection:bg-[#C8794A]/25 selection:text-[#F5F0EB]">
      {/* Ambient page glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.025) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.015) 0%, transparent 70%)',
        }}
      />

      <main id="main-content" className="relative z-[1] overflow-hidden">
        <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-[#4A4542]">
            <a href="/" className="text-[#6B6560] transition-colors hover:text-[#C8794A]">
              Submission Archives
            </a>
            <span className="text-[#353433]">/</span>
            <span className="text-[#6B6560]">The Qur&apos;an</span>
          </nav>

          {/* Hero Header */}
          <header className="mb-8 flex flex-wrap items-end justify-between gap-8 border-b border-[#2A2928] pb-8">
            <div className="max-w-[640px]">
              <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-[#C8794A]/15 bg-[#C8794A]/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">
                Scripture Index
              </div>
              <h1
                className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              >
                The Qur&apos;an
              </h1>
              <p
                className="text-[16.5px] leading-[1.6] text-[#9E9690]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                114 surahs, with Arabic text, English translation, transliteration, and footnotes.
              </p>
            </div>

            <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-[#2A2928] bg-[#161514] px-6 py-4">
              <div className="flex flex-col">
                <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                  {chapters.length}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                  Surahs
                </span>
              </div>
              <div className="flex flex-col border-l border-[#2A2928] pl-6">
                <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                  {totalVerses.toLocaleString()}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                  Verses
                </span>
              </div>
            </div>
          </header>

          <ScriptureTabs />
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-16 z-30 border-y border-[#2A2928] bg-[#0F0E0D]/95 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1160px] items-center gap-3 px-4 py-3 sm:px-7">
            <div className="relative flex-1">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6560]" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by surah name, number, or translation..."
                className="w-full rounded-[4px] border border-[#2A2928] bg-[#161514] py-2 pl-10 pr-10 text-sm text-[#F5F0EB] placeholder:text-[#6B6560] transition-colors focus:border-[#353433] focus:bg-[#1C1B1A] focus:outline-none"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear filter"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] transition-colors hover:text-[#F5F0EB]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 sm:flex">
                  <kbd className="rounded-[4px] border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 font-mono text-[10px] text-[#6B6560]">
                    /
                  </kbd>
                </div>
              )}
            </div>

            {/* Grid / List Switcher with Motion */}
            <div
              className="flex shrink-0 rounded-[6px] border border-[#2A2928] bg-[#161514] p-1"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                aria-label="Grid view"
                className={cn(
                  'relative rounded-[4px] p-2 transition-colors active:scale-[0.95]',
                  viewMode === 'grid' ? 'text-[#C8794A]' : 'text-[#6B6560] hover:text-[#9E9690]',
                )}
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="active-quran-viewmode-pill"
                    className="absolute inset-0 rounded-[4px] border border-[#C8794A]/40 bg-[#C8794A]/10"
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
                  'relative rounded-[4px] p-2 transition-colors active:scale-[0.95]',
                  viewMode === 'list' ? 'text-[#C8794A]' : 'text-[#6B6560] hover:text-[#9E9690]',
                )}
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="active-quran-viewmode-pill"
                    className="absolute inset-0 rounded-[4px] border border-[#C8794A]/40 bg-[#C8794A]/10"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <List className="relative z-10 h-4 w-4" weight={viewMode === 'list' ? 'bold' : 'regular'} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[1160px] px-4 py-10 sm:px-7 sm:py-14">
          {filteredChapters.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#2A2928] bg-[#161514] px-6 py-24 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-[#6B6560]" />
              <p
                className="mt-4 text-xl text-[#9E9690]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              >
                No surah matches &quot;{query}&quot;.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 text-sm font-medium text-[#C8794A] transition-colors hover:text-[#D9916A] hover:underline"
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
                      <div className="flex items-start justify-between gap-2 border-b border-[#2A2928] pb-2.5 mb-3">
                        <span className="font-mono text-xs tabular-nums text-[#6B6560] transition-colors group-hover:text-[#9E9690]">
                          #{String(chapter.chapterNumber).padStart(3, '0')}
                        </span>
                        <span
                          dir="rtl"
                          className="font-arabic text-base leading-none text-[#6B6560] transition-colors group-hover:text-[#9E9690]"
                        >
                          {chapter.titleArabic}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h2
                          className="truncate text-sm sm:text-base font-semibold text-[#F5F0EB] transition-colors"
                          style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                          {chapter.titleTransliterated}
                        </h2>
                        <p className="mt-1 truncate text-xs text-[#6B6560]">
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
                  className="divide-y divide-[#2A2928] overflow-hidden rounded-[8px] border border-[#2A2928] bg-[#161514]"
                >
                  {filteredChapters.map((chapter) => (
                    <Link
                      key={chapter.chapterNumber}
                      href={`/scripture/quran/${chapter.chapterNumber}`}
                      className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#1C1B1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8794A] focus-visible:ring-inset"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-10 shrink-0 font-mono text-xs font-semibold tabular-nums text-[#6B6560] transition-colors group-hover:text-[#9E9690]">
                          #{String(chapter.chapterNumber).padStart(3, '0')}
                        </span>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <h2
                              className="truncate text-base font-semibold text-[#F5F0EB]"
                              style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                              {chapter.titleTransliterated}
                            </h2>
                            <span className="hidden sm:inline text-xs text-[#6B6560]">
                              ({chapter.titleEnglish})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 shrink-0 text-xs">
                        <span
                          dir="rtl"
                          className="font-arabic text-base text-[#6B6560] transition-colors group-hover:text-[#9E9690]"
                        >
                          {chapter.titleArabic}
                        </span>

                        <span className="font-mono text-xs tabular-nums text-[#6B6560]">
                          {chapter.verseCount} verses
                        </span>

                        <ArrowRight className="h-4 w-4 text-[#6B6560] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#C8794A]" />
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Page Footer */}
          <footer className="mt-16 border-t border-[#2A2928] py-9 text-center text-[12px] font-medium tracking-[0.04em] text-[#4A4542]">
            Dedicated to preserving and sharing the message of God alone.
          </footer>
        </div>
      </main>
    </div>
  );
}
