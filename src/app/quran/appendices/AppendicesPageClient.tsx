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
    <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
      {/* Ambient page glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
        }}
      />

      <main id="main-content" className="relative z-[1] overflow-hidden">
        <div className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-ed-fg-muted">
            <Link href="/" className="text-ed-fg-muted transition-colors hover:text-ed-accent">
              Submission Archives
            </Link>
            <span className="text-ed-fg-faint">/</span>
            <span className="text-ed-fg-secondary">Appendices</span>
          </nav>

          {/* Hero Header */}
          <header className="mb-8 border-b border-ed-rule pb-8">
            <div className="flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-[640px]">
                <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                  <Sparkle className="h-3 w-3" />
                  Scripture Appendix Index
                </div>
                <h1
                  className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg"
                  style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                >
                  Appendices
                </h1>
                <p
                  className="text-[16.5px] leading-[1.6] text-ed-fg-secondary"
                  style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                  38 explanatory works and mathematical research notes from the translated editions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-ed-rule bg-ed-surface px-6 py-4 shadow-sm">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1.5 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-ed-fg">
                      <Books className="h-4 w-4 text-ed-fg-muted" />
                      {appendices.length}
                    </span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                      Works Cataloged
                    </span>
                  </div>
                  <div className="flex flex-col border-l border-ed-rule pl-6">
                    <span className="flex items-center gap-1.5 text-[24px] font-semibold leading-[1.1] tracking-[-0.02em] text-ed-fg">
                      <FileText className="h-4 w-4 text-ed-fg-muted" />
                      3
                    </span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                      Historical Editions
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-col justify-center border-l border-ed-rule pl-6">
                    <span className="text-[13px] font-semibold leading-[1.2] text-ed-fg-secondary">Direct PDF</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
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
        <div className="sticky top-16 z-30 border-b border-ed-rule bg-ed-bg/95 backdrop-blur-2xl">
          <div className="mx-auto max-w-[1160px] px-4 py-3.5 sm:px-7">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find an appendix by title, topic, or number..."
                  aria-label="Filter appendices"
                  className="h-11 w-full rounded-[4px] border border-ed-rule bg-ed-surface py-2.5 pl-10 pr-10 text-sm text-ed-fg placeholder:text-ed-fg-muted transition-all focus:border-ed-rule-strong focus:bg-ed-surface-strong focus:outline-none"
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
                    <kbd className="rounded-[4px] border border-ed-rule bg-ed-surface px-1.5 py-0.5 text-[10px] text-ed-fg-muted">
                      /
                    </kbd>
                  </div>
                )}
              </div>

              {/* Edition Switcher & Tools */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                {/* Edition Switcher Pills */}
                <div
                  className="flex items-center rounded-[4px] border border-ed-rule bg-ed-surface p-1"
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
                          isSelected ? 'text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg',
                        )}
                      >
                        {isSelected && (
                          <motion.div
                            layoutId="active-appendix-edition-pill"
                            className="absolute inset-0 rounded-[3px] border border-ed-accent/40 bg-ed-accent-soft"
                            transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                          />
                        )}
                        <span className="relative z-10">{item.key}</span>
                      </button>
                    );
                  })}
                </div>

                <span className="hidden shrink-0 text-xs tabular-nums text-ed-fg-muted md:block px-1">
                  {filteredAppendices.length} / {appendices.length}
                </span>

                {/* Grid / List Mode */}
                <div
                  className="flex shrink-0 rounded-[4px] border border-ed-rule bg-ed-surface p-1"
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
                      viewMode === 'grid' ? 'text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg',
                    )}
                  >
                    {viewMode === 'grid' && (
                      <motion.div
                        layoutId="active-appendix-viewmode-pill"
                        className="absolute inset-0 rounded-[3px] border border-ed-accent/40 bg-ed-accent-soft"
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
                      viewMode === 'list' ? 'text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg',
                    )}
                  >
                    {viewMode === 'list' && (
                      <motion.div
                        layoutId="active-appendix-viewmode-pill"
                        className="absolute inset-0 rounded-[3px] border border-ed-accent/40 bg-ed-accent-soft"
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
            <div className="rounded-[12px] border border-dashed border-ed-rule bg-ed-surface px-6 py-24 text-center">
              <BookBookmark className="mx-auto h-10 w-10 text-ed-fg-muted" />
              <p
                className="mt-4 text-[17px] text-ed-fg-secondary"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
              >
                No appendix matches &quot;{query}&quot; in the {edition} edition.
              </p>
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-rule bg-ed-surface px-4 py-2 text-sm font-medium text-ed-fg-secondary transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg"
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
                          <div className="flex items-center justify-between gap-2 border-b border-ed-rule pb-3 mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-ed-fg-muted transition-colors group-hover:text-ed-fg">
                              {displayLabel}
                            </span>
                            <span className="rounded-[4px] border border-ed-rule bg-ed-bg px-2.5 py-0.5 text-[10px] font-medium text-ed-fg-muted">
                              {edition} Ed.
                            </span>
                          </div>

                          {/* Thumbnail if available */}
                          {thumbnail ? (
                            <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-[4px] border border-ed-rule bg-ed-bg">
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
                            className="line-clamp-2 text-lg font-semibold tracking-tight text-ed-fg transition-colors group-hover:text-ed-accent"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                          >
                            {appendix.title}
                          </h2>
                        </div>

                        {/* Bottom Bar */}
                        <div className="mt-5 flex items-center justify-between border-t border-ed-rule pt-3 text-xs text-ed-fg-muted">
                          <span className="text-[11px] text-ed-fg-muted">PDF Reader</span>
                          <div className="inline-flex items-center gap-1 text-[11px] font-medium text-ed-fg-muted transition-colors group-hover:text-ed-fg">
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
                  className="divide-y divide-ed-rule overflow-hidden rounded-[12px] border border-ed-rule bg-ed-surface/40"
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
                        className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ed-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-inset"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="w-28 shrink-0 text-xs font-semibold uppercase tracking-wider text-ed-fg-muted transition-colors group-hover:text-ed-fg">
                            {displayLabel}
                          </span>

                          <h2
                            className="truncate text-base font-semibold text-ed-fg"
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
                                       ? 'bg-ed-accent-soft text-ed-accent'
                                       : 'bg-ed-surface-strong text-ed-fg-muted'
                                     : 'opacity-20 text-ed-fg-muted line-through',
                                 )}
                              >
                                {ed}
                              </span>
                            ))}
                          </div>

                          <ArrowRight className="h-4 w-4 text-ed-fg-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ed-accent" />
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <footer className="mt-16 border-t border-ed-rule py-9 text-center text-[12px] font-medium tracking-[0.04em] text-ed-fg-muted">
            Dedicated to preserving and sharing the message of God alone.
          </footer>
        </div>
      </main>
    </div>
  );
}
