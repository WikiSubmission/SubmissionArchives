'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
  MagnifyingGlass,
  SquaresFour,
  List,
  X,
  BookBookmark,
  FileText,
  ArrowRight,
  Sparkle,
  Books,
} from '@phosphor-icons/react';
import ScriptureTabs from '@/components/layout/ScriptureTabs';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import type { AppendixEdition, AppendixItem } from '@/lib/appendixCatalog';

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

type Props = {
  appendices: AppendixItem[];
};

export default function AppendicesPageClient({ appendices }: Props) {
  const [query, setQuery] = useState('');
  const [edition, setEdition] = useState<AppendixEdition>('1992');
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

  const editions: { key: AppendixEdition; label: string }[] = [
    { key: '1992', label: '1992 Authorized' },
    { key: '1989', label: '1989 Edition' },
    { key: '1981', label: '1981 First Edition' },
  ];

  const filteredAppendices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return appendices.filter((appendix) => {
      // Must be available in chosen edition
      const hasEdition = Boolean(appendix.editions[edition]);
      if (!hasEdition) return false;

      if (!normalized) return true;
      return (
        appendix.title.toLowerCase().includes(normalized) ||
        appendix.id.toLowerCase().includes(normalized) ||
        appendix.filename.toLowerCase().includes(normalized)
      );
    });
  }, [appendices, query, edition]);

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
            <span className="text-[#6B6560]">Appendices</span>
          </nav>

          {/* Hero Header */}
          <header className="mb-8 border-b border-[#2A2928] pb-8">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-[640px]">
                <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-[#C8794A]/15 bg-[#C8794A]/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">
                  <Sparkle className="h-3 w-3" />
                  Scripture Appendix Index
                </div>
                <h1
                  className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]"
                  style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                >
                  Appendices
                </h1>
                <p
                  className="text-[16.5px] leading-[1.6] text-[#9E9690]"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  38 explanatory works and mathematical research notes from the translated editions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-[#2A2928] bg-[#161514] px-6 py-4">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                      <Books className="h-4 w-4 text-[#6B6560]" />
                      {appendices.length}
                    </span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                      Works Cataloged
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-[#2A2928] pl-6">
                    <span className="flex items-center gap-1.5 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#F5F0EB]">
                      <FileText className="h-4 w-4 text-[#6B6560]" />
                      3
                    </span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                      Historical Editions
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col justify-center border-l border-[#2A2928] pl-6">
                    <span className="text-[13px] font-semibold leading-[1.2] text-[#9E9690]">Direct PDF</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6560]">
                      Facsimile Viewer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <ScriptureTabs />
          </header>
        </div>

        {/* Sticky Filter & Edition Bar */}
        <div className="sticky top-16 z-30 border-b border-[#2A2928] bg-[#0F0E0D]/95 backdrop-blur-2xl">
          <div className="mx-auto max-w-[1160px] px-4 py-3.5 sm:px-7">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A4542]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find an appendix by title, topic, or number..."
                  aria-label="Filter appendices"
                  className="h-11 w-full rounded-[4px] border border-[#2A2928] bg-[#161514] py-2.5 pl-10 pr-10 text-sm text-[#F5F0EB] placeholder:text-[#4A4542] transition-all focus:border-[#353433] focus:bg-[#1C1B1A] focus:outline-none"
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
                    <kbd className="rounded-[4px] border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 text-[10px] text-[#4A4542]">
                      /
                    </kbd>
                  </div>
                )}
              </div>

              {/* Edition Switcher & Tools */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                {/* Edition Switcher Pills */}
                <div
                  className="flex items-center rounded-[4px] border border-[#2A2928] bg-[#161514] p-1"
                  role="group"
                  aria-label="Appendix Edition"
                >
                  {editions.map((item) => {
                    const isSelected = edition === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setEdition(item.key)}
                        aria-pressed={isSelected}
                        className={cn(
                          'relative rounded-[3px] px-3 py-1.5 text-xs font-medium transition-colors duration-200 active:scale-[0.96]',
                          isSelected ? 'text-[#C8794A]' : 'text-[#6B6560] hover:text-[#9E9690]',
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-appendix-edition-pill"
                            className="absolute inset-0 rounded-[3px] border border-[#C8794A]/40 bg-[#C8794A]/10"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10">{item.key}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="hidden shrink-0 text-xs tabular-nums text-[#6B6560] md:block px-1">
                  {filteredAppendices.length} / {appendices.length}
                </span>

                {/* Grid / List Mode */}
                <div
                  className="flex shrink-0 rounded-[4px] border border-[#2A2928] bg-[#161514] p-1"
                  role="group"
                  aria-label="View mode"
                >
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    aria-pressed={viewMode === 'grid'}
                    aria-label="Grid view"
                    className={cn(
                      'relative rounded-[3px] p-2 transition-colors active:scale-[0.95]',
                      viewMode === 'grid' ? 'text-[#C8794A]' : 'text-[#6B6560] hover:text-[#9E9690]',
                    )}
                  >
                    {viewMode === 'grid' && (
                      <motion.div
                        layoutId="active-appendix-viewmode-pill"
                        className="absolute inset-0 rounded-[3px] border border-[#C8794A]/40 bg-[#C8794A]/10"
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
                      'relative rounded-[3px] p-2 transition-colors active:scale-[0.95]',
                      viewMode === 'list' ? 'text-[#C8794A]' : 'text-[#6B6560] hover:text-[#9E9690]',
                    )}
                  >
                    {viewMode === 'list' && (
                      <motion.div
                        layoutId="active-appendix-viewmode-pill"
                        className="absolute inset-0 rounded-[3px] border border-[#C8794A]/40 bg-[#C8794A]/10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                    <List className="relative z-10 h-4 w-4" weight={viewMode === 'list' ? 'bold' : 'regular'} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-[1160px] px-4 py-10 sm:px-7 sm:py-14">
          {filteredAppendices.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#2A2928] bg-[#161514] px-6 py-24 text-center">
              <BookBookmark className="mx-auto h-10 w-10 text-[#6B6560]" />
              <p
                className="mt-4 text-[17px] text-[#9E9690]"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                No appendix matches &quot;{query}&quot; in the {edition} edition.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-[#2A2928] bg-[#161514] px-4 py-2 text-sm font-medium text-[#9E9690] transition-colors hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#F5F0EB]"
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
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                >
                  {filteredAppendices.map((appendix) => {
                    const url = `/library/${appendix.id}?edition=${edition}`;
                    const asset = appendix.editions[edition];
                    const thumbnail = asset?.thumbnail;
                    const appNumber = appendix.id.match(/\d+/)?.[0];
                    const displayLabel = appNumber
                      ? `Appendix ${appNumber}`
                      : appendix.id.toUpperCase();

                    return (
                      <SpotlightCard
                        key={appendix.id}
                        href={url}
                        className="h-full flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Bar */}
                          <div className="flex items-center justify-between gap-2 border-b border-[#2A2928] pb-3 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B6560] transition-colors group-hover:text-[#F5F0EB]">
                              {displayLabel}
                            </span>
                            <span className="rounded-[4px] border border-[#2A2928] bg-[#0F0E0D] px-2.5 py-0.5 text-[10px] font-medium text-[#6B6560]">
                              {edition} Ed.
                            </span>
                          </div>

                          {/* Thumbnail if available */}
                          {thumbnail ? (
                            <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-[#2A2928] bg-[#0F0E0D]">
                              <Image
                                src={thumbnail}
                                alt={`Cover for ${appendix.title}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              />
                            </div>
                          ) : null}

                          {/* Title */}
                          <h2
                            className="line-clamp-2 text-lg font-semibold tracking-tight text-[#F5F0EB] transition-colors group-hover:text-[#C8794A]"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                          >
                            {appendix.title}
                          </h2>
                        </div>

                        {/* Bottom Bar */}
                        <div className="mt-5 flex items-center justify-between border-t border-[#2A2928] pt-3 text-xs text-[#6B6560]">
                          <span className="text-[11px] text-[#6B6560]">PDF Reader</span>
                          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B6560] transition-colors group-hover:text-[#F5F0EB]">
                            <span>Open</span>
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </SpotlightCard>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  className="divide-y divide-[#2A2928] overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514]/40"
                >
                  {filteredAppendices.map((appendix) => {
                    const url = `/library/${appendix.id}?edition=${edition}`;
                    const appNumber = appendix.id.match(/\d+/)?.[0];
                    const displayLabel = appNumber
                      ? `Appendix ${appNumber}`
                      : appendix.id;

                    return (
                      <Link
                        key={appendix.id}
                        href={url}
                        className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#1C1B1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8794A] focus-visible:ring-inset"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-[#6B6560] transition-colors group-hover:text-[#F5F0EB]">
                            {displayLabel}
                          </span>

                          <h2
                            className="truncate text-base font-semibold text-[#F5F0EB]"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                          >
                            {appendix.title}
                          </h2>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="hidden sm:flex items-center gap-1.5">
                            {(['1981', '1989', '1992'] as const).map((ed) => (
                              <span
                                key={ed}
                                className={cn(
                                  'rounded-[4px] px-2 py-0.5 text-[10px] font-semibold',
                                  appendix.editions[ed]
                                    ? ed === edition
                                      ? 'bg-[#C8794A]/15 text-[#C8794A]'
                                      : 'bg-[#1C1B1A] text-[#6B6560]'
                                    : 'opacity-20 text-[#4A4542] line-through',
                                )}
                              >
                                {ed}
                              </span>
                            ))}
                          </div>

                          <ArrowRight className="h-4 w-4 text-[#6B6560] transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#C8794A]" />
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <footer className="mt-16 border-t border-[#2A2928] py-9 text-center text-[12px] font-medium tracking-[0.04em] text-[#4A4542]">
            Dedicated to preserving and sharing the message of God alone.
          </footer>
        </div>
      </main>
    </div>
  );
}
