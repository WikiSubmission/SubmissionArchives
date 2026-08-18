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
        <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-7 lg:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-[#4A4542]">
            <a href="/" className="text-[#6B6560] transition-colors hover:text-[#C8794A]">
              Submission Archives
            </a>
            <span className="text-[#353433]">/</span>
            <span className="text-[#6B6560]">{title}</span>
          </nav>

          {/* Hero Header */}
          <header className="mb-7 flex flex-wrap items-end justify-between gap-8 border-b border-[#2A2928] pb-7">
            <div className="max-w-[640px]">
              <div className="mb-3.5 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#C8794A]/15 bg-[#C8794A]/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">
                  <BookOpen className="h-3 w-3" />
                  Scripture Collection
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-[#2A2928] bg-[#161514] px-2.5 py-1 text-[11px] font-medium text-[#6B6560]">
                  <Translate className="h-3 w-3" />
                  {testament === 'new' ? 'Greek & English' : 'Hebrew & English'}
                </span>
              </div>
              <h1
                className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              >
                {title}
              </h1>
              <p
                className="text-[16.5px] leading-[1.6] text-[#9E9690]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                {subtitle}
              </p>
            </div>

            <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-[#2A2928] bg-[#161514] px-6 py-4">
              <div className="flex flex-col">
                <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                  {books.length}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                  <Books className="h-3 w-3" />
                  Books
                </span>
              </div>
              <div className="flex flex-col border-l border-[#2A2928] pl-6">
                <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                  {totalStats.chapters}
                </span>
                <span className="mt-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                  <BookmarkSimple className="h-3 w-3" />
                  Chapters
                </span>
              </div>
              <div className="flex flex-col border-l border-[#2A2928] pl-6">
                <span className="text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                  {totalStats.verses.toLocaleString()}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                  Verses
                </span>
              </div>
            </div>
          </header>

          <ScriptureTabs />

          {/* Segmented Category Filter Pills */}
          <div className="mt-8 mb-6 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'rounded-[4px] border px-3.5 py-1.5 text-[13px] font-medium transition-all active:scale-[0.96]',
                selectedCategory === null
                  ? 'border-[#C8794A] bg-[#C8794A]/[0.06] text-[#C8794A] font-semibold'
                  : 'border-[#2A2928] bg-[#161514] text-[#6B6560] hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#9E9690]',
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
                    'rounded-[4px] border px-3.5 py-1.5 text-[13px] font-medium transition-all active:scale-[0.96]',
                    isSelected
                      ? 'border-[#C8794A] bg-[#C8794A]/[0.06] text-[#C8794A] font-semibold'
                      : 'border-[#2A2928] bg-[#161514] text-[#6B6560] hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#9E9690]',
                  )}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Filter Bar */}
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-[#2A2928] pb-5">
            <div className="flex min-w-[280px] flex-1 flex-wrap items-center gap-3">
              <div className="relative max-w-[420px] flex-1">
                <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A4542]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a book by English name, Hebrew name, or category..."
                  aria-label="Filter books"
                  className="w-full rounded-[4px] border border-[#2A2928] bg-[#161514] py-2.5 pl-9 pr-10 text-[13px] font-medium text-[#F5F0EB] placeholder:text-[#4A4542] outline-none transition-all focus:border-[#353433] focus:bg-[#1C1B1A]"
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
                    <kbd className="rounded border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 text-[10px] font-mono text-[#6B6560]">
                      /
                    </kbd>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden shrink-0 text-[12px] font-medium tabular-nums text-[#6B6560] sm:block">
                {filteredBooks.length} / {books.length} books
              </span>

              {/* View Mode Toggle */}
              <div
                className="flex shrink-0 rounded-[4px] border border-[#2A2928] bg-[#161514] p-0.5"
                role="group"
                aria-label="View mode"
              >
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Grid view"
                  className={cn(
                    'relative rounded-[4px] p-2.5 transition-colors active:scale-[0.95]',
                    viewMode === 'grid' ? 'text-[#C8794A] font-semibold' : 'text-[#6B6560] hover:text-[#9E9690]',
                  )}
                >
                  {viewMode === 'grid' && (
                    <motion.div
                      layoutId="active-bible-viewmode-toolbar"
                      className="absolute inset-0 rounded-[4px] border border-[#C8794A]/40 bg-[#C8794A]/10 shadow-sm"
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
                    'relative rounded-[4px] p-2.5 transition-colors active:scale-[0.95]',
                    viewMode === 'list' ? 'text-[#C8794A] font-semibold' : 'text-[#6B6560] hover:text-[#9E9690]',
                  )}
                >
                  {viewMode === 'list' && (
                    <motion.div
                      layoutId="active-bible-viewmode-toolbar"
                      className="absolute inset-0 rounded-[4px] border border-[#C8794A]/40 bg-[#C8794A]/10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <List className="relative z-10 h-4 w-4" weight={viewMode === 'list' ? 'bold' : 'regular'} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          {filteredBooks.length === 0 ? (
            <div className="mb-16 rounded-[12px] border border-dashed border-[#2A2928] bg-[#161514] px-6 py-16 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-[#6B6560]" />
              <h3
                className="mt-4 text-[20px] font-semibold text-[#F5F0EB]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              >
                No book matches &quot;{query}&quot;{selectedCategory ? ` in ${selectedCategory}` : ''}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-[14px] text-[#6B6560]">
                Try clearing your query or selecting a different category.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory(null);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-[#C8794A] bg-[#C8794A]/10 px-4 py-2 text-[13px] font-semibold text-[#C8794A] transition-colors hover:bg-[#C8794A]/20"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            groupedSections.map(([sectionTitle, sectionBooks]) => (
              <section key={sectionTitle} className="mb-14">
                {/* Section Header */}
                <div className="mb-7 flex items-center gap-4 border-b border-[#2A2928] pb-3">
                  <h2
                    className="whitespace-nowrap text-[22px] font-semibold tracking-[-0.01em] text-[#F5F0EB]"
                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                  >
                    {sectionTitle}
                  </h2>
                  <div className="h-px flex-1 bg-[#2A2928]" />
                  <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-[#6B6560]">
                    {sectionBooks.length} {sectionBooks.length === 1 ? 'book' : 'books'}
                  </span>
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
                      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                      {sectionBooks.map((book) => {
                        const hebrew = book.hebrewTitle || OT_HEBREW_MAP[book.bookCode.toUpperCase()];
                        const href = `/scripture/bible/${book.bookCode.toLowerCase()}`;

                        return (
                          <SpotlightCard key={book.bookCode} href={href} className="h-full flex flex-col justify-between">
                            {/* Top Meta Bar */}
                            <div>
                              <div className="mb-4 flex items-center justify-between gap-2 border-b border-[#2A2928] pb-3">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6560] transition-colors group-hover:text-[#9E9690]">
                                  #{String(book.order).padStart(2, '0')}
                                </span>
                                {hebrew ? (
                                  <span
                                    dir="rtl"
                                    className="font-hebrew text-base font-normal text-[#6B6560] transition-colors group-hover:text-[#9E9690]"
                                  >
                                    {hebrew}
                                  </span>
                                ) : (
                                  <span className="text-[10px] uppercase tracking-wider text-[#6B6560]">
                                    {book.bookCode}
                                  </span>
                                )}
                              </div>

                              {/* Title & Category */}
                              <h3
                                className="text-xl font-semibold tracking-tight text-[#F5F0EB] transition-colors group-hover:text-[#C8794A]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                              >
                                {book.bookName}
                              </h3>

                              <p className="mt-1 text-xs text-[#6B6560] line-clamp-1">{book.category}</p>
                            </div>

                            {/* Bottom Metrics Bar */}
                            <div className="mt-6 flex items-center justify-between border-t border-[#2A2928] pt-3 text-xs text-[#6B6560]">
                              <div className="flex items-center gap-1.5 text-[11px] tabular-nums">
                                <span className="font-medium text-[#F5F0EB]">{book.chapterCount}</span>
                                <span>{book.chapterCount === 1 ? 'ch' : 'chs'}</span>
                                <span className="text-[#4A4542]">&middot;</span>
                                <span className="font-medium text-[#F5F0EB]">{book.verseCount.toLocaleString()}</span>
                                <span>v</span>
                              </div>

                              <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6560] transition-colors group-hover:text-[#9E9690]">
                                <span>Read</span>
                                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          </SpotlightCard>
                        );
                      })}
                    </motion.div>
                  ) : (
                    /* Data List View */
                    <motion.div
                      key="list"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                      className="divide-y divide-[#2A2928] overflow-hidden rounded-[8px] border border-[#2A2928] bg-[#161514]"
                    >
                      {sectionBooks.map((book) => {
                        const hebrew = book.hebrewTitle || OT_HEBREW_MAP[book.bookCode.toUpperCase()];
                        const href = `/scripture/bible/${book.bookCode.toLowerCase()}`;

                        return (
                          <Link
                            key={book.bookCode}
                            href={href}
                            className="group flex flex-col justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#1C1B1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8794A] focus-visible:ring-inset sm:flex-row sm:items-center"
                          >
                            {/* Left: Order & Titles */}
                            <div className="flex min-w-0 items-center gap-4">
                              <span className="w-8 shrink-0 text-xs font-semibold tabular-nums text-[#6B6560] transition-colors group-hover:text-[#9E9690]">
                                #{String(book.order).padStart(2, '0')}
                              </span>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2.5">
                                  <h3
                                    className="truncate text-base font-semibold text-[#F5F0EB] transition-colors group-hover:text-[#C8794A]"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                  >
                                    {book.bookName}
                                  </h3>
                                  {hebrew && (
                                    <span dir="rtl" className="hidden font-hebrew text-base text-[#6B6560] sm:inline">
                                      {hebrew}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-[#6B6560] sm:hidden">{book.category}</span>
                              </div>
                            </div>

                            {/* Right: Category, Metrics, Action */}
                            <div className="flex shrink-0 items-center justify-between gap-5 text-xs sm:justify-end">
                              <span className="hidden rounded-[4px] border border-[#2A2928] bg-[#161514] px-2.5 py-1 text-[11px] text-[#6B6560] md:inline-block">
                                {book.category}
                              </span>

                              <div className="flex items-center gap-3 text-xs tabular-nums text-[#6B6560]">
                                <span>
                                  {book.chapterCount} {book.chapterCount === 1 ? 'ch' : 'chs'}
                                </span>
                                <span className="text-[#4A4542]">&middot;</span>
                                <span>{book.verseCount.toLocaleString()} v</span>
                              </div>

                              <ArrowRight className="h-4 w-4 text-[#6B6560] transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#C8794A]" />
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

          {/* Page Footer */}
          <footer className="mt-16 border-t border-[#2A2928] py-9 text-center text-[12px] font-medium tracking-[0.04em] text-[#4A4542]">
            Dedicated to preserving and sharing the message of God alone.
          </footer>
        </div>
      </main>
    </div>
  );
}
