'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlass,
  SquaresFour,
  List,
  X,
  BookOpen,
  ArrowRight,
  Translate,
  Books,
  BookmarkSimple,
} from '@phosphor-icons/react';
import ScriptureTabs from '@/components/layout/ScriptureTabs';
import { SpotlightCard } from '@/components/ui/SpotlightCard';

export type BibleBookSummary = {
  bookCode: string;
  bookName: string;
  category: string;
  order: number;
  chapterCount: number;
  verseCount: number;
  hebrewTitle?: string;
};

type BiblePageClientProps = {
  books: BibleBookSummary[];
  testament: 'old' | 'new' | 'apocrypha';
};

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Hebrew titles for standard Old Testament books if not already in JSON
const OT_HEBREW_MAP: Record<string, string> = {
  GEN: 'בראשית',
  EXO: 'שמות',
  LEV: 'ויקרא',
  NUM: 'במדבר',
  DEU: 'דברים',
  JOS: 'יהושע',
  JDG: 'שופטים',
  RUT: 'רות',
  '1SA': 'שמואל א׳',
  '2SA': 'שמואל ב׳',
  '1KI': 'מלכים א׳',
  '2KI': 'מלכים ב׳',
  '1CH': 'דברי הימים א׳',
  '2CH': 'דברי הימים ב׳',
  EZR: 'עזרא',
  NEH: 'נחמיה',
  EST: 'אסתר',
  JOB: 'איוב',
  PSA: 'תהילים',
  PRO: 'משלי',
  ECC: 'קהלת',
  SOL: 'שיר השירים',
  SNG: 'שיר השירים',
  ISA: 'ישעיהו',
  JER: 'ירמיהו',
  LAM: 'איכה',
  EZE: 'יחזקאל',
  DAN: 'דניאל',
  HOS: 'הושע',
  JOE: 'יואל',
  AMO: 'עמוס',
  OBA: 'עובדיה',
  JON: 'יונה',
  MIC: 'מיכה',
  NAH: 'נחום',
  HAB: 'חבקוק',
  ZEP: 'צפניה',
  HAG: 'חגי',
  ZEC: 'זכריה',
  MAL: 'מלאכי',
};

export default function BiblePageClient({ books, testament }: BiblePageClientProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

  const title =
    testament === 'old'
      ? 'Old Testament'
      : testament === 'new'
      ? 'New Testament'
      : 'OT Apocrypha';

  const subtitle =
    testament === 'old'
      ? `${books.length} canonical books across Torah, History, Writings, and the Prophets.`
      : testament === 'new'
      ? `${books.length} books spanning the Gospels, Acts of the Apostles, Epistles, and Revelation.`
      : `${books.length} deuterocanonical and historical writings — Tobit, Judith, Wisdom of Solomon, Sirach, Maccabees, Jubilees, and more.`;

  // Aggregate stats
  const totalStats = useMemo(() => {
    let chapters = 0;
    let verses = 0;
    for (const b of books) {
      chapters += b.chapterCount;
      verses += b.verseCount;
    }
    return { chapters, verses };
  }, [books]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const book of books) {
      if (book.category) set.add(book.category);
    }
    return Array.from(set);
  }, [books]);

  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return books.filter((book) => {
      const heb = book.hebrewTitle || OT_HEBREW_MAP[book.bookCode.toUpperCase()] || '';
      const matchesQuery =
        !normalized ||
        book.bookName.toLowerCase().includes(normalized) ||
        book.bookCode.toLowerCase().includes(normalized) ||
        book.category.toLowerCase().includes(normalized) ||
        heb.includes(normalized);
      const matchesCategory = !selectedCategory || book.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [books, query, selectedCategory]);

  const groupedSections = useMemo(() => {
    const map = new Map<string, BibleBookSummary[]>();
    for (const book of filteredBooks) {
      const cat = book.category || 'General';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(book);
    }
    return Array.from(map.entries());
  }, [filteredBooks]);

  return (
    <div className="min-h-screen bg-ed-bg font-sans text-ed-fg selection:bg-ed-accent/20">
      {/* Studio Luxury Hero */}
      <div className="relative overflow-hidden border-b border-ed-rule">
        {/* Ambient atmospheric glows */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-ed-ambient-1 blur-[120px]" />
          <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-ed-ambient-2 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ed-fg-muted">
              Scripture Collection
            </span>
            <span className="h-1 w-1 rounded-full bg-ed-fg-muted/40" />
            <span className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/80 px-3 py-1 font-mono text-[11px] text-ed-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-ed-fg-muted" />
              {testament === 'new' ? 'Greek & English' : 'Hebrew & English'}
            </span>
          </div>

          <h1 className="mt-6 font-serif text-[clamp(2.5rem,6.5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ed-fg">
            {title}
          </h1>

          <p className="mt-6 max-w-[58ch] font-serif text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg font-normal">
            {subtitle}
          </p>

          {/* Quick Stats Strip */}
          <div className="mt-10 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/80 px-3.5 py-2 backdrop-blur-md">
              <Books className="h-4 w-4 text-ed-fg-muted" />
              <span className="font-semibold text-ed-fg">{books.length}</span>
              <span className="text-ed-fg-muted">Books</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/80 px-3.5 py-2 backdrop-blur-md">
              <BookmarkSimple className="h-4 w-4 text-ed-fg-muted" />
              <span className="font-semibold text-ed-fg">{totalStats.chapters}</span>
              <span className="text-ed-fg-muted">Chapters</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/80 px-3.5 py-2 backdrop-blur-md">
              <span className="font-semibold text-ed-fg">{totalStats.verses.toLocaleString()}</span>
              <span className="text-ed-fg-muted">Verses</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/80 px-3.5 py-2 backdrop-blur-md text-ed-fg-muted">
              <Translate className="h-4 w-4 text-ed-fg-muted" />
              <span>Parallel Translation</span>
            </div>
          </div>

          <ScriptureTabs />
        </div>
      </div>

      {/* Sticky Interactive Toolbar */}
      <div className="sticky top-16 z-30 border-b border-ed-rule bg-ed-bg/95 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1200px] px-5 py-3.5 sm:px-8 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a book by English name, Hebrew name, or category..."
                aria-label="Filter books"
                className="h-11 w-full rounded-xl border border-ed-rule bg-ed-surface/70 py-2.5 pl-10 pr-10 text-sm text-ed-fg placeholder:text-ed-fg-muted transition-all focus:border-ed-fg focus:bg-ed-surface focus:outline-none"
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

            {/* Results Count */}
            <span className="hidden shrink-0 font-mono text-xs tabular-nums text-ed-fg-muted sm:block px-1">
              {filteredBooks.length} / {books.length} books
            </span>

            {/* View Mode Toggle */}
            <div
              className="flex shrink-0 rounded-xl border border-ed-rule bg-ed-surface/80 p-0.5"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                aria-label="Grid view"
                className={cn(
                  'relative rounded-lg p-2.5 transition-colors active:scale-[0.95]',
                  viewMode === 'grid'
                    ? 'text-ed-bg font-semibold'
                    : 'text-ed-fg-muted hover:text-ed-fg',
                )}
              >
                {viewMode === 'grid' && (
                  <motion.div
                    layoutId="active-bible-viewmode-toolbar"
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
                  'relative rounded-lg p-2.5 transition-colors active:scale-[0.95]',
                  viewMode === 'list'
                    ? 'text-ed-bg font-semibold'
                    : 'text-ed-fg-muted hover:text-ed-fg',
                )}
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="active-bible-viewmode-toolbar"
                    className="absolute inset-0 rounded-lg bg-ed-fg shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <List className="relative z-10 h-4 w-4" weight={viewMode === 'list' ? 'bold' : 'regular'} />
              </button>
            </div>
          </div>

          {/* Segmented Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-[0.96]',
                selectedCategory === null
                  ? 'bg-ed-fg text-ed-bg font-semibold shadow-sm'
                  : 'border border-ed-rule bg-ed-surface/60 text-ed-fg-muted hover:border-ed-rule-strong hover:text-ed-fg',
              )}
            >
              All ({books.length})
            </button>
            {categories.map((cat) => {
              const count = books.filter((b) => b.category === cat).length;
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : cat)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-[0.96]',
                    isSelected
                      ? 'bg-ed-fg text-ed-bg font-semibold shadow-sm'
                      : 'border border-ed-rule bg-ed-surface/60 text-ed-fg-muted hover:border-ed-rule-strong hover:text-ed-fg',
                  )}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14 space-y-16">
        {filteredBooks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ed-rule px-6 py-24 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-ed-fg-muted" />
            <p className="mt-4 font-serif text-xl text-ed-fg-muted">
              No book matches &quot;{query}&quot;{selectedCategory ? ` in ${selectedCategory}` : ''}.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory(null);
              }}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-ed-rule px-4 py-2 text-sm font-medium text-ed-fg transition-colors hover:bg-ed-surface"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          groupedSections.map(([sectionTitle, sectionBooks]) => (
            <section key={sectionTitle} className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center justify-between border-b border-ed-rule pb-3.5">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-2xl font-semibold tracking-tight text-ed-fg sm:text-3xl">
                    {sectionTitle}
                  </h2>
                  <span className="rounded-full border border-ed-rule bg-ed-surface/70 px-2.5 py-0.5 font-mono text-[11px] font-medium text-ed-fg-muted">
                    {sectionBooks.length} {sectionBooks.length === 1 ? 'book' : 'books'}
                  </span>
                </div>
              </div>

              {/* View Switch with Spring Motion */}
              <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5"
                  >
                    {sectionBooks.map((book) => {
                      const hebrew = book.hebrewTitle || OT_HEBREW_MAP[book.bookCode.toUpperCase()];
                      const href = `/scripture/bible/${book.bookCode.toLowerCase()}`;

                      return (
                        <SpotlightCard
                          key={book.bookCode}
                          href={href}
                          className="h-full flex flex-col justify-between"
                        >
                          {/* Top Meta Bar */}
                          <div>
                            <div className="flex items-center justify-between gap-2 border-b border-ed-rule pb-3 mb-4">
                              <span className="font-mono text-xs font-semibold tabular-nums text-ed-fg-muted group-hover:text-ed-fg transition-colors">
                                #{String(book.order).padStart(2, '0')}
                              </span>
                              {hebrew ? (
                                <span
                                  dir="rtl"
                                  className="font-hebrew text-base font-normal text-ed-fg-muted group-hover:text-ed-fg transition-colors"
                                >
                                  {hebrew}
                                </span>
                              ) : (
                                <span className="font-mono text-[10px] uppercase tracking-wider text-ed-fg-muted">
                                  {book.bookCode}
                                </span>
                              )}
                            </div>

                            {/* Title & Category */}
                            <h3 className="font-serif text-xl font-semibold tracking-tight text-ed-fg transition-colors">
                              {book.bookName}
                            </h3>

                            <p className="mt-1 text-xs text-ed-fg-muted line-clamp-1">
                              {book.category}
                            </p>
                          </div>

                          {/* Bottom Metrics Bar */}
                          <div className="mt-6 flex items-center justify-between border-t border-ed-rule pt-3 text-xs text-ed-fg-muted">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums">
                              <span className="text-ed-fg font-medium">{book.chapterCount}</span>
                              <span>{book.chapterCount === 1 ? 'ch' : 'chs'}</span>
                              <span className="text-ed-fg-muted/40">&middot;</span>
                              <span className="text-ed-fg font-medium">{book.verseCount.toLocaleString()}</span>
                              <span>v</span>
                            </div>

                            <div className="inline-flex items-center gap-1 font-sans text-[11px] font-medium text-ed-fg-muted group-hover:text-ed-fg transition-colors">
                              <span>Read</span>
                              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </SpotlightCard>
                      );
                    })}
                  </motion.div>
                ) : (
                  /* Enterprise Data List View */
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="divide-y divide-ed-rule overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/40"
                  >
                    {sectionBooks.map((book) => {
                      const hebrew = book.hebrewTitle || OT_HEBREW_MAP[book.bookCode.toUpperCase()];
                      const href = `/scripture/bible/${book.bookCode.toLowerCase()}`;

                      return (
                        <Link
                          key={book.bookCode}
                          href={href}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-ed-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-inset"
                        >
                          {/* Left: Order & Titles */}
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="w-8 shrink-0 font-mono text-xs font-semibold tabular-nums text-ed-fg-muted group-hover:text-ed-fg transition-colors">
                              #{String(book.order).padStart(2, '0')}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2.5">
                                <h3 className="truncate font-serif text-base font-semibold text-ed-fg transition-colors">
                                  {book.bookName}
                                </h3>
                                {hebrew && (
                                  <span
                                    dir="rtl"
                                    className="font-hebrew text-base text-ed-fg-muted hidden sm:inline"
                                  >
                                    {hebrew}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-ed-fg-muted sm:hidden">
                                {book.category}
                              </span>
                            </div>
                          </div>

                          {/* Right: Category, Metrics, Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 text-xs">
                            <span className="hidden md:inline-block rounded-full border border-ed-rule bg-ed-surface/60 px-2.5 py-1 text-[11px] text-ed-fg-muted">
                              {book.category}
                            </span>

                            <div className="flex items-center gap-3 font-mono text-xs text-ed-fg-muted tabular-nums">
                              <span>{book.chapterCount} {book.chapterCount === 1 ? 'ch' : 'chs'}</span>
                              <span className="text-ed-fg-muted/40">&middot;</span>
                              <span>{book.verseCount.toLocaleString()} v</span>
                            </div>

                            <ArrowRight className="h-4 w-4 text-ed-fg-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ed-fg" />
                          </div>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
