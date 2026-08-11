'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  List,
  Copy,
  MagnifyingGlass,
  ShareNetwork,
  X,
  CaretLeft,
  CaretRight,
  BookOpen,
  TextT,
  Columns,
  ArrowsOut,
  ChatTeardropText,
  Check,
} from '@phosphor-icons/react';
import type { QuranChapter, QuranChapterSummary, QuranVerse } from './page';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ChapterNav = { chapterNumber: number; titleEnglish: string };

type ViewMode = 'reading' | 'parallel' | 'focus';

type Props = {
  chapter: QuranChapter;
  allChapters: QuranChapterSummary[];
  prev?: ChapterNav;
  next?: ChapterNav;
  initialVerse?: number;
  initialQuery: string;
};

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useReadingProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);
  return progress;
}

function useInView<T extends HTMLElement>(options?: IntersectionObserverInit, initiallyVisible = false) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(initiallyVisible);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -5% 0px', ...options },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, options]);
  return { ref, visible };
}

function useKeyPress(targetKey: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === targetKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [targetKey, callback]);
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function getHighlightTerms(query: string): string[] {
  if (!query) return [];
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function QuranChapterClient({
  chapter,
  allChapters,
  prev,
  next,
  initialVerse,
  initialQuery,
}: Props) {
  const router = useRouter();
  const progress = useReadingProgress();

  /* -- State -- */
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [suraFilter, setSuraFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('reading');
  const [fontScale, setFontScale] = useState(1);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFootnote, setShowFootnote] = useState<Record<number, boolean>>({});
  const hasScrolledToVerse = useRef(false);

  const highlightTerms = useMemo(() => getHighlightTerms(initialQuery), [initialQuery]);
  const visibleVerses = useMemo(
    () => chapter.verses.filter((v) => Boolean(v.english)),
    [chapter.verses],
  );

  const filteredSidebarChapters = useMemo(() => {
    const norm = suraFilter.trim().toLowerCase();
    if (!norm) return allChapters;
    return allChapters.filter(
      (c) =>
        String(c.chapterNumber).includes(norm) ||
        c.titleEnglish.toLowerCase().includes(norm) ||
        c.titleTransliterated.toLowerCase().includes(norm),
    );
  }, [allChapters, suraFilter]);

  /* -- Deep link scroll -- */
  useEffect(() => {
    if (!initialVerse || hasScrolledToVerse.current) return;
    hasScrolledToVerse.current = true;
    const el = document.getElementById(`verse-${initialVerse}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      requestAnimationFrame(() => setActiveVerse(initialVerse));
    }
  }, [initialVerse]);

  /* -- Keyboard shortcuts -- */
  useKeyPress('j', () => {
    setActiveVerse((prev) => {
      const nextV = prev ? Math.min(prev + 1, visibleVerses.length) : 1;
      const el = document.getElementById(`verse-${nextV}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return nextV;
    });
  });

  useKeyPress('k', () => {
    setActiveVerse((prev) => {
      const nextV = prev ? Math.max(prev - 1, 1) : 1;
      const el = document.getElementById(`verse-${nextV}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return nextV;
    });
  });

  useKeyPress('n', () => {
    if (next) router.push(`/scripture/quran/${next.chapterNumber}`);
  });

  useKeyPress('p', () => {
    if (prev) router.push(`/scripture/quran/${prev.chapterNumber}`);
  });

  /* -- Copy handler -- */
  const handleCopy = useCallback(
    (verse: QuranVerse) => {
      const text = `${verse.verseId}: ${verse.arabic}\n\n${verse.english}\n\n— ${chapter.titleEnglish} (${chapter.chapterNumber}:${verse.verseNumber})`;
      navigator.clipboard?.writeText(text);
      setCopiedId(verse.verseId);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [chapter],
  );

  /* -- Share handler -- */
  const handleShare = useCallback(
    (verseNum: number) => {
      const url = `${window.location.origin}/scripture/quran/${chapter.chapterNumber}?page=${verseNum}#verse-${verseNum}`;
      navigator.clipboard?.writeText(url);
    },
    [chapter.chapterNumber],
  );

  /* -- Font size CSS variable -- */
  const fontSizeStyle = useMemo(
    () => ({ '--verse-scale': fontScale } as React.CSSProperties),
    [fontScale],
  );

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] font-sans text-[#f5f5f7] antialiased selection:bg-white/20"
      style={fontSizeStyle}
    >
      {/* ==================== Progress Bar ==================== */}
      <div className="fixed inset-x-0 top-0 z-[60] h-[2px] bg-transparent">
        <div
          className="h-full bg-white/80 transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})`, transformOrigin: 'left' }}
        />
      </div>

      {/* ==================== Sticky Header ==================== */}
      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-8">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open surah navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-neutral-400 transition-all hover:border-white/20 hover:text-white active:scale-[0.95] xl:hidden"
            >
              <List className="h-5 w-5" />
            </button>

            <div className="hidden items-center gap-6 text-sm font-medium text-neutral-400 lg:flex">
              <Link
                href="/scripture/quran"
                className="transition-colors hover:text-white"
              >
                Surahs
              </Link>
              <Link
                href="/scripture/quran/appendices"
                className="transition-colors hover:text-white"
              >
                Appendices
              </Link>
            </div>

            <div className="ml-4 hidden h-6 w-px bg-white/10 md:block" />

            {/* Chapter Quick Switcher */}
            <div className="hidden items-center gap-2 md:flex">
              {prev && (
                <Link
                  href={`/scripture/quran/${prev.chapterNumber}`}
                  className="group flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-medium text-neutral-400 transition-all hover:border-white/20 hover:text-white active:scale-[0.97]"
                  title="Previous chapter (p)"
                >
                  <CaretLeft className="h-3.5 w-3.5" />
                  <span className="max-w-[100px] truncate">{prev.titleEnglish}</span>
                </Link>
              )}
              <span className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white">
                {chapter.chapterNumber}. {chapter.titleEnglish}
              </span>
              {next && (
                <Link
                  href={`/scripture/quran/${next.chapterNumber}`}
                  className="group flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-medium text-neutral-400 transition-all hover:border-white/20 hover:text-white active:scale-[0.97]"
                  title="Next chapter (n)"
                >
                  <span className="max-w-[100px] truncate">{next.titleEnglish}</span>
                  <CaretRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-2">
            {/* View Mode Toggle */}
            <div className="hidden items-center rounded-lg border border-white/10 p-0.5 md:flex">
              {([
                { key: 'reading', icon: BookOpen, label: 'Reading' },
                { key: 'parallel', icon: Columns, label: 'Parallel' },
                { key: 'focus', icon: ArrowsOut, label: 'Focus' },
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewMode(key)}
                  aria-pressed={viewMode === key}
                  aria-label={label}
                  title={label}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-md transition-all active:scale-[0.95]',
                    viewMode === key
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" weight={viewMode === key ? 'fill' : 'regular'} />
                </button>
              ))}
            </div>

            {/* Font Size Slider */}
            <div className="hidden items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 lg:flex">
              <TextT className="h-4 w-4 text-neutral-500" />
              <input
                type="range"
                min="0.85"
                max="1.35"
                step="0.05"
                value={fontScale}
                onChange={(e) => setFontScale(parseFloat(e.target.value))}
                aria-label="Font size"
                className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/10 accent-white"
              />
            </div>

            <button
              type="button"
              onClick={() => handleShare(initialVerse || 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-neutral-400 transition-all hover:border-white/20 hover:text-white active:scale-[0.95]"
              aria-label="Share chapter"
            >
              <ShareNetwork className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className={cn(
                'hidden h-10 w-10 items-center justify-center rounded-xl border transition-all active:scale-[0.95] xl:inline-flex',
                sidebarOpen
                  ? 'border-white/20 bg-white/10 text-white'
                  : 'border-white/10 text-neutral-400 hover:text-white',
              )}
              aria-label="Toggle sidebar"
              aria-pressed={sidebarOpen}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================== Main Layout ==================== */}
      <div className="mx-auto flex max-w-[1600px]">
        {/* -------- Main Content -------- */}
        <main
          id="main-content"
          className={cn(
            'flex-1 min-w-0 px-4 pb-32 pt-10 transition-all duration-500 sm:px-10 lg:px-16',
            sidebarOpen && 'xl:pr-8',
          )}
        >
          <div className={cn('mx-auto', viewMode === 'parallel' ? 'max-w-[1200px]' : 'max-w-[900px]')}>
            {/* ---- Chapter Header Card ---- */}
            <header className="relative mb-16 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 sm:p-12">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/[0.02] blur-[100px]"
              />
              <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
                <div className="space-y-3">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Sura {chapter.chapterNumber}
                  </p>
                  <h1 className="font-serif text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                    {chapter.chapterNumber}. {chapter.titleEnglish}
                  </h1>
                  <p className="text-lg font-medium tracking-wide text-neutral-300">
                    {chapter.titleTransliterated}
                  </p>
                </div>

                <div className="text-right">
                  <h2
                    dir="rtl"
                    className="font-arabic text-5xl leading-none text-white sm:text-6xl"
                    style={{ fontSize: `calc(3rem * ${fontScale})` }}
                  >
                    {chapter.titleArabic}
                  </h2>
                  <p className="mt-3 font-arabic text-sm tracking-widest text-neutral-400">
                    {chapter.chapterNumber === 1 || chapter.revelationOrder
                      ? 'مَكِّيَّة'
                      : 'مَدَنِيَّة'}{' '}
                    &middot; {visibleVerses.length} آيَات
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="mt-10 grid grid-cols-2 gap-4 border-t border-white/[0.08] pt-8 sm:grid-cols-4">
                <MetaItem label="Surah Number" value={String(chapter.chapterNumber)} />
                <MetaItem
                  label="Type"
                  value={chapter.chapterNumber === 1 || chapter.revelationOrder ? 'Makki' : 'Madani'}
                />
                <MetaItem label="Ayahs" value={String(visibleVerses.length)} />
                <MetaItem
                  label="Revelation Order"
                  value={chapter.revelationOrder ? String(chapter.revelationOrder) : '—'}
                />
              </div>
            </header>

            {/* ---- Search Within Sura ---- */}
            <div className="relative mb-10 max-w-md">
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Search within this sura..."
                aria-label="Search within this sura"
                className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] pl-11 pr-4 text-sm text-white placeholder:text-neutral-500 backdrop-blur-sm transition-all focus:border-white/20 focus:bg-white/[0.06] focus:outline-none"
              />
            </div>

            {/* ---- Verses ---- */}
            <div className={cn('space-y-2', viewMode === 'parallel' && 'space-y-8')}>
              {visibleVerses.map((verse) => (
                <QuranVerseBlock
                  key={verse.verseId}
                  verse={verse}
                  viewMode={viewMode}
                  fontScale={fontScale}
                  highlightTerms={highlightTerms}
                  isActive={activeVerse === verse.verseNumber}
                  isTarget={initialVerse === verse.verseNumber}
                  copiedId={copiedId}
                  showFootnote={showFootnote[verse.verseNumber]}
                  onCopy={handleCopy}
                  onShare={handleShare}
                  onToggleFootnote={(n) =>
                    setShowFootnote((prev) => ({ ...prev, [n]: !prev[n] }))
                  }
                  onSetActive={setActiveVerse}
                />
              ))}
            </div>

            {/* ---- Chapter Footer Nav ---- */}
            <div className="mt-20 flex items-center justify-between border-t border-white/[0.08] pt-10">
              {prev ? (
                <Link
                  href={`/scripture/quran/${prev.chapterNumber}`}
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-4 transition-all hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98]"
                >
                  <CaretLeft className="h-5 w-5 text-neutral-500 transition-colors group-hover:text-white" />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
                      Previous
                    </p>
                    <p className="mt-0.5 font-medium text-neutral-300 group-hover:text-white transition-colors">
                      {prev.chapterNumber}. {prev.titleEnglish}
                    </p>
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {next ? (
                <Link
                  href={`/scripture/quran/${next.chapterNumber}`}
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-4 transition-all hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98]"
                >
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
                      Next
                    </p>
                    <p className="mt-0.5 font-medium text-neutral-300 group-hover:text-white transition-colors">
                      {next.chapterNumber}. {next.titleEnglish}
                    </p>
                  </div>
                  <CaretRight className="h-5 w-5 text-neutral-500 transition-colors group-hover:text-white" />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </div>
        </main>

        {/* -------- Desktop Sidebar -------- */}
        <aside
          className={cn(
            'sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-l border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-2xl transition-all duration-500 xl:flex',
            sidebarOpen ? 'w-[360px] opacity-100' : 'w-0 overflow-hidden opacity-0',
          )}
        >
          <div className="w-[360px] flex h-full flex-col">
            {/* Sidebar Header */}
            <div className="space-y-4 border-b border-white/[0.08] p-5">
              <div>
                <h3 className="font-serif text-sm font-semibold text-white">
                  Surah Navigator
                </h3>
                <p className="mt-1 text-xs text-neutral-400">Jump to any surah instantly</p>
              </div>

              <div className="relative">
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={suraFilter}
                  onChange={(e) => setSuraFilter(e.target.value)}
                  placeholder="Filter 114 suras..."
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] pl-10 pr-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/20 focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  max={114}
                  placeholder="#"
                  className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-center text-sm text-white placeholder:text-neutral-500 focus:border-white/20 focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const n = parseInt((e.target as HTMLInputElement).value, 10);
                      if (n >= 1 && n <= 114) router.push(`/scripture/quran/${n}`);
                    }
                  }}
                />
                <button
                  type="button"
                  className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-black transition-opacity hover:opacity-90 active:scale-[0.96]"
                >
                  Go
                </button>
              </div>
            </div>

            {/* Surah List */}
            <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredSidebarChapters.map((item) => {
                const isActive = item.chapterNumber === chapter.chapterNumber;
                return (
                  <Link
                    key={item.chapterNumber}
                    href={`/scripture/quran/${item.chapterNumber}`}
                    className={cn(
                      'group flex items-center justify-between rounded-xl px-4 py-3 text-sm transition-all active:scale-[0.98]',
                      isActive
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white',
                    )}
                  >
                    <span className={cn('font-medium', isActive && 'font-semibold')}>
                      {item.chapterNumber}. {item.titleTransliterated}
                    </span>
                    <span
                      className={cn(
                        'font-mono text-xs',
                        // neutral-500 on this near-black surface is ~4.3:1, just under
                        // the 4.5:1 needed for small text; neutral-400 clears it.
                        isActive ? 'text-black/60' : 'text-neutral-400',
                      )}
                    >
                      {item.verseCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* -------- Mobile Drawer -------- */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-[70] flex xl:hidden">
            <div
              className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
              aria-hidden
            />
            <div className="relative mr-auto flex w-80 max-w-[85vw] flex-col border-r border-white/[0.08] bg-[#0d0d0d] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
                <span className="font-serif font-semibold text-white">Surahs Index</span>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                  aria-label="Close navigation"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="border-b border-white/[0.08] p-4">
                <input
                  type="text"
                  value={suraFilter}
                  onChange={(e) => setSuraFilter(e.target.value)}
                  placeholder="Filter 114 suras..."
                  className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white placeholder:text-neutral-500 focus:border-white/20 focus:outline-none"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-2 py-2">
                {filteredSidebarChapters.map((item) => {
                  const isActive = item.chapterNumber === chapter.chapterNumber;
                  return (
                    <Link
                      key={item.chapterNumber}
                      href={`/scripture/quran/${item.chapterNumber}`}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors',
                        isActive
                          ? 'bg-white font-semibold text-black'
                          : 'text-neutral-400 hover:bg-white/[0.04] hover:text-white',
                      )}
                    >
                      <span>
                        {item.chapterNumber}. {item.titleTransliterated}
                      </span>
                      <span className="font-mono text-xs text-neutral-300">{item.verseCount}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* -------- Keyboard Hint -------- */}
      <div className="fixed bottom-6 left-6 z-40 hidden items-center gap-3 rounded-full border border-white/[0.08] bg-[#0d0d0d]/90 px-4 py-2 text-[11px] text-neutral-400 backdrop-blur-md lg:flex">
        <span>
          Press <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-white">j</kbd>{' '}
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-white">k</kbd> to navigate verses
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span>
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-white">n</kbd>{' '}
          <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-white">p</kbd> for chapters
        </span>
      </div>

      {/* -------- Global Styles -------- */}
      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 10px;
        }
        .quran-mark {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 0 2px;
          border-radius: 2px;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-Components                                                     */
/* ------------------------------------------------------------------ */

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">{label}</p>
      <p className="font-mono text-lg font-medium text-white">{value}</p>
    </div>
  );
}

function QuranVerseBlock({
  verse,
  viewMode,
  fontScale,
  highlightTerms,
  isActive,
  isTarget,
  copiedId,
  showFootnote,
  onCopy,
  onShare,
  onToggleFootnote,
  onSetActive,
}: {
  verse: QuranVerse;
  viewMode: ViewMode;
  fontScale: number;
  highlightTerms: string[];
  isActive: boolean;
  isTarget: boolean;
  copiedId: string | null;
  showFootnote?: boolean;
  onCopy: (v: QuranVerse) => void;
  onShare: (n: number) => void;
  onToggleFootnote: (n: number) => void;
  onSetActive: (n: number | null) => void;
}) {
  const { ref, visible } = useInView<HTMLElement>(undefined, isTarget);
  const [hovered, setHovered] = useState(false);

  const arabicSize = `calc(1.75rem * ${fontScale})`;
  const englishSize = `calc(1.05rem * ${fontScale})`;

  return (
    <article
      ref={ref}
      id={`verse-${verse.verseNumber}`}
      onMouseEnter={() => {
        setHovered(true);
        onSetActive(verse.verseNumber);
      }}
      onMouseLeave={() => {
        setHovered(false);
        onSetActive(null);
      }}
      className={cn(
        'group relative scroll-mt-32 rounded-2xl border border-transparent py-8 transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        isTarget && 'border-white/20 bg-white/[0.04]',
        isActive && !isTarget && 'bg-white/[0.02]',
        hovered && 'bg-white/[0.02]',
      )}
    >
      {/* Subtitle */}
      {verse.subtitle && (
        <div className="mb-8 flex items-center justify-center gap-4 px-4">
          <span aria-hidden className="h-px w-10 bg-white/10" />
          <h3 className="text-center font-sans text-[11px] font-bold uppercase tracking-[0.25em] text-neutral-400">
            <HighlightedText text={verse.subtitle} terms={highlightTerms} />
          </h3>
          <span aria-hidden className="h-px w-10 bg-white/10" />
        </div>
      )}

      {/* Verse Content */}
      <div
        className={cn(
          'px-4 sm:px-8',
          viewMode === 'parallel' &&
            'grid gap-8 md:grid-cols-2 md:gap-12',
          viewMode === 'focus' && 'max-w-2xl mx-auto',
        )}
      >
        {/* Arabic */}
        {verse.arabic && viewMode !== 'focus' && (
          <div className={cn(viewMode === 'parallel' && 'md:text-right')}>
            <p
              dir="rtl"
              className="font-arabic leading-[2.2] text-[#f5f5f7] antialiased"
              style={{ fontSize: arabicSize }}
            >
              {verse.arabic}
            </p>
          </div>
        )}

        {/* English + Toolbar */}
        <div className="relative flex-1">
          {/* Floating Toolbar */}
          <div
            className={cn(
              'absolute -top-3 right-0 z-10 flex items-center gap-1 rounded-xl border border-white/10 bg-[#111]/95 p-1 shadow-xl backdrop-blur-2xl transition-all duration-200',
              hovered || isActive ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none',
            )}
          >
            <ToolbarButton
              icon={copiedId === verse.verseId ? Check : Copy}
              label="Copy verse"
              active={copiedId === verse.verseId}
              onClick={() => onCopy(verse)}
            />
            <ToolbarButton
              icon={ShareNetwork}
              label="Copy link"
              onClick={() => onShare(verse.verseNumber)}
            />
            {verse.footnote && (
              <ToolbarButton
                icon={ChatTeardropText}
                label="Toggle footnote"
                active={showFootnote}
                onClick={() => onToggleFootnote(verse.verseNumber)}
              />
            )}
          </div>

          {/* Verse Number Badge */}
          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <svg
                className="absolute inset-0 h-full w-full text-white/20 transition-colors group-hover:text-white/40"
                viewBox="0 0 54 54"
                fill="none"
              >
                <path
                  d="M27 1L33 8.5L42 7.5L45 16L53 20L49 27L53 34L45 38L42 46.5L33 45.5L27 53L21 45.5L12 46.5L9 38L1 34L5 27L1 20L9 16L12 7.5L21 8.5L27 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <circle cx="27" cy="27" r="18" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.4" />
              </svg>
              <span className="relative z-10 font-mono text-[10px] font-bold tracking-tight text-neutral-400 group-hover:text-white">
                {verse.verseNumber}
              </span>
            </div>
            {verse.verseId && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-300">
                {verse.verseId}
              </span>
            )}
          </div>

          {/* English Text */}
          <p
            className="max-w-prose font-serif leading-[1.9] text-neutral-300"
            style={{ fontSize: englishSize }}
          >
            <HighlightedText text={verse.english} terms={highlightTerms} />
          </p>

          {/* Transliteration */}
          {viewMode === 'parallel' && verse.transliterated && (
            <p className="mt-3 text-sm italic leading-relaxed text-neutral-300">
              {verse.transliterated}
            </p>
          )}

          {/* Footnote */}
          {verse.footnote && showFootnote && (
            <aside className="mt-6 rounded-xl border-l-2 border-white/40 bg-white/[0.03] p-5">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-300">
                <ChatTeardropText className="h-3.5 w-3.5" />
                Footnote {verse.verseNumber}
              </p>
              <p className="text-sm leading-7 text-neutral-300">
                <HighlightedText text={verse.footnote} terms={highlightTerms} />
              </p>
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg transition-all active:scale-[0.95]',
        active
          ? 'bg-white text-black'
          : 'text-neutral-400 hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon className="h-3.5 w-3.5" weight={active ? 'fill' : 'regular'} />
    </button>
  );
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0 || !text) return <>{text}</>;
  const pattern = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        terms.some((t) => t.toLowerCase() === part.toLowerCase()) ? (
          <mark key={i} className="quran-mark">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}
