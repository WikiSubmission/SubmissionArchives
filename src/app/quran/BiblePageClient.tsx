'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlass, SquaresFour, List, X, BookOpen } from '@phosphor-icons/react';
import ScriptureTabs from '@/components/layout/ScriptureTabs';

export type BibleBookSummary = {
  bookCode: string;
  bookName: string;
  category: string;
  order: number;
  chapterCount: number;
  verseCount: number;
};

type BiblePageClientProps = {
  books: BibleBookSummary[];
  testament: 'old' | 'new';
};

export default function BiblePageClient({ books, testament }: BiblePageClientProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const isOT = testament === 'old';
  const title = isOT ? 'Old Testament' : 'New Testament';
  const subtitle = isOT
    ? `${books.length} books — Torah, History, Writings, Prophets, and Deuterocanon.`
    : `${books.length} books — Gospels, Acts, Letters of Paul, General Epistles, and Prophecy.`;

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
      const matchesQuery =
        !normalized ||
        book.bookName.toLowerCase().includes(normalized) ||
        book.bookCode.toLowerCase().includes(normalized) ||
        book.category.toLowerCase().includes(normalized);
      const matchesCategory = !selectedCategory || book.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [books, query, selectedCategory]);

  const groupedSections = useMemo(() => {
    const map = new Map<string, BibleBookSummary[]>();
    for (const book of filteredBooks) {
      const cat = book.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(book);
    }
    return Array.from(map.entries());
  }, [filteredBooks]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-[#f5f5f7] selection:bg-white/20">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-white/[0.08]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white/[0.02] blur-[120px]" />
          <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-white/[0.01] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 py-20 sm:px-8 sm:py-28 lg:py-32">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
            Scripture
          </p>
          <h1 className="mt-6 font-serif text-[clamp(2.75rem,8vw,5rem)] leading-[1.05] tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-6 max-w-[50ch] font-serif text-lg leading-relaxed text-neutral-400 sm:text-xl">
            {subtitle}
          </p>
          <ScriptureTabs />
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#0a0a0a]/80 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1200px] px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a book by name or category..."
                aria-label="Filter books"
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
              {filteredBooks.length}/{books.length}
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

          {/* Category Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5">
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all active:scale-[0.96]',
                selectedCategory === null
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'border border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white',
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
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'border border-white/[0.08] text-neutral-400 hover:border-white/20 hover:text-white',
                  )}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14 space-y-14">
        {filteredBooks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.08] px-6 py-24 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-neutral-600" />
            <p className="mt-4 font-serif text-xl text-neutral-400">No book matches your selection.</p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedCategory(null);
              }}
              className="mt-4 text-sm font-medium text-white hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          groupedSections.map(([sectionTitle, sectionBooks]) => (
            <section key={sectionTitle} className="space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <h2 className="font-serif text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {sectionTitle}
                </h2>
                <span className="font-mono text-xs tabular-nums text-neutral-500">
                  {sectionBooks.length} {sectionBooks.length === 1 ? 'book' : 'books'}
                </span>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {sectionBooks.map((book) => (
                    <Link
                      key={book.bookCode}
                      href={`/scripture/bible/${book.bookCode.toLowerCase()}`}
                      className="group relative flex flex-col gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono text-xs tabular-nums text-neutral-500">
                          {String(book.order).padStart(2, '0')}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                          {book.bookCode}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-serif text-base font-medium text-white transition-colors sm:text-lg">
                          {book.bookName}
                        </h3>
                        <p className="mt-1 truncate text-xs text-neutral-400 sm:text-sm">
                          {book.chapterCount} ch &middot; {book.verseCount.toLocaleString()}v
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04] overflow-hidden rounded-2xl border border-white/[0.06]">
                  {sectionBooks.map((book) => (
                    <Link
                      key={book.bookCode}
                      href={`/scripture/bible/${book.bookCode.toLowerCase()}`}
                      className="group flex items-center gap-3 bg-white/[0.01] px-5 py-4 transition-colors hover:bg-white/[0.04] sm:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      <span className="w-8 shrink-0 text-right font-mono text-sm tabular-nums text-neutral-500 transition-colors group-hover:text-white">
                        {book.order}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-serif text-base font-medium text-white">
                          {book.bookName}
                        </h3>
                      </div>
                      <span className="hidden w-20 shrink-0 text-right font-mono text-xs tabular-nums text-neutral-500 md:block">
                        {book.chapterCount} ch
                      </span>
                      <span className="hidden w-20 shrink-0 text-right font-mono text-xs tabular-nums text-neutral-500 md:block">
                        {book.verseCount.toLocaleString()} v
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </main>
    </div>
  );
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
