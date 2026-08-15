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
    <div className="min-h-screen bg-ed-bg font-sans text-ed-fg selection:bg-ed-accent/20">
      {/* Studio Luxury Hero */}
      <div className="relative overflow-hidden border-b border-ed-rule">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-ed-ambient-1 blur-[120px]" />
          <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-ed-ambient-2 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ed-fg-muted">
              Scripture Research & Notes
            </span>
            <span className="h-1 w-1 rounded-full bg-ed-fg-muted/40" />
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ed-rule bg-ed-surface/80 px-2.5 py-0.5 font-mono text-[11px] font-medium text-ed-fg">
              <Sparkle className="h-3 w-3" />
              Authorized Editions & Facsimiles
            </span>
          </div>

          <h1 className="mt-5 font-serif text-[clamp(2.5rem,6.5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ed-fg">
            Appendices
          </h1>

          <p className="mt-5 max-w-[56ch] font-serif text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg">
            38 explanatory works and mathematical research notes from the translated editions.
          </p>

          {/* Quick Stats Strip */}
          <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/80 px-3.5 py-2 backdrop-blur-md">
              <Books className="h-4 w-4 text-ed-fg-muted" />
              <span className="font-semibold text-ed-fg">{appendices.length}</span>
              <span className="text-ed-fg-muted">Works Cataloged</span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/80 px-3.5 py-2 backdrop-blur-md">
              <FileText className="h-4 w-4 text-ed-fg-muted" />
              <span className="font-semibold text-ed-fg">3</span>
              <span className="text-ed-fg-muted">Historical Editions</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/80 px-3.5 py-2 backdrop-blur-md text-ed-fg-muted">
              <span>Direct PDF Facsimile Viewer</span>
            </div>
          </div>

          <ScriptureTabs />
        </div>
      </div>

      {/* Sticky Filter & Edition Bar */}
      <div className="sticky top-16 z-30 border-b border-ed-rule bg-ed-bg/95 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1200px] px-5 py-3.5 sm:px-8">
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

            {/* Edition Switcher & Tools */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
              {/* Edition Switcher Pills */}
              <div
                className="flex items-center rounded-xl border border-ed-rule bg-ed-surface/80 p-1 backdrop-blur-md"
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
                        'relative rounded-lg px-3 py-1.5 text-xs font-mono transition-colors duration-200 active:scale-[0.96]',
                        isSelected
                          ? 'text-ed-bg font-bold'
                          : 'text-ed-fg-muted hover:text-ed-fg',
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-appendix-edition-pill"
                          className="absolute inset-0 rounded-lg bg-ed-fg shadow-sm"
                          transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                        />
                      )}
                      <span className="relative z-10">{item.key}</span>
                    </button>
                  );
                })}
              </div>

              <span className="hidden shrink-0 font-mono text-xs tabular-nums text-ed-fg-muted md:block px-1">
                {filteredAppendices.length} / {appendices.length}
              </span>

              {/* Grid / List Mode */}
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
                      layoutId="active-appendix-viewmode-pill"
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
                      layoutId="active-appendix-viewmode-pill"
                      className="absolute inset-0 rounded-lg bg-ed-fg shadow-sm"
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
      <main className="mx-auto max-w-[1200px] px-5 py-10 sm:px-8 sm:py-14">
        {filteredAppendices.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ed-rule px-6 py-24 text-center">
            <BookBookmark className="mx-auto h-10 w-10 text-ed-fg-muted" />
            <p className="mt-4 font-serif text-xl text-ed-fg-muted">
              No appendix matches &quot;{query}&quot; in the {edition} edition.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-ed-rule px-4 py-2 text-sm font-medium text-ed-fg transition-colors hover:bg-ed-surface"
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
                          <span className="font-mono text-xs font-semibold tabular-nums text-ed-fg-muted group-hover:text-ed-fg transition-colors">
                            {displayLabel}
                          </span>
                          <span className="rounded-full border border-ed-rule bg-ed-surface/70 px-2.5 py-0.5 font-mono text-[10px] text-ed-fg-muted">
                            {edition} Ed.
                          </span>
                        </div>

                        {/* Thumbnail if available */}
                        {thumbnail ? (
                          <div className="relative mb-4 aspect-[16/10] w-full overflow-hidden rounded-xl border border-ed-rule bg-ed-surface">
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
                        <h2 className="line-clamp-2 font-serif text-lg font-semibold tracking-tight text-ed-fg transition-colors">
                          {appendix.title}
                        </h2>
                      </div>

                      {/* Bottom Bar */}
                      <div className="mt-5 flex items-center justify-between border-t border-ed-rule pt-3 text-xs text-ed-fg-muted">
                        <span className="font-mono text-[11px] text-ed-fg-muted">PDF Reader</span>
                        <div className="inline-flex items-center gap-1 font-sans text-[11px] font-medium text-ed-fg-muted group-hover:text-ed-fg transition-colors">
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
                className="divide-y divide-ed-rule overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/40"
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
                      className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-ed-surface/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-inset"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="w-28 shrink-0 font-mono text-xs font-semibold uppercase tracking-wider text-ed-fg-muted group-hover:text-ed-fg transition-colors">
                          {displayLabel}
                        </span>

                        <h2 className="truncate font-serif text-base font-semibold text-ed-fg">
                          {appendix.title}
                        </h2>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:flex items-center gap-1.5">
                          {(['1981', '1989', '1992'] as const).map((ed) => (
                            <span
                              key={ed}
                              className={cn(
                                'rounded px-2 py-0.5 font-mono text-[10px]',
                                appendix.editions[ed]
                                  ? ed === edition
                                    ? 'bg-ed-fg text-ed-bg font-bold'
                                    : 'bg-ed-surface text-ed-fg-muted'
                                  : 'opacity-20 text-ed-fg-muted line-through',
                              )}
                            >
                              {ed}
                            </span>
                          ))}
                        </div>

                        <ArrowRight className="h-4 w-4 text-ed-fg-muted group-hover:text-ed-fg group-hover:translate-x-0.5 transition-all duration-200" />
                      </div>
                    </Link>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
