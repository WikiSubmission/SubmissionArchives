'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, Grid as GridIcon, List as ListIcon, X } from 'lucide-react';
import { ReactBitsParticles } from '@/components/react-bits/ParticlesBackground';
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
        ? `${books.length} books organized into Torah, History, Writings, Prophets, and Deuterocanon.`
        : `${books.length} books organized into Gospels, Acts, Letters of Paul, General Epistles, and Prophecy.`;

    // Extract unique categories in canonical order
    const categories = useMemo(() => {
        const set = new Set<string>();
        for (const book of books) {
            if (book.category) set.add(book.category);
        }
        return Array.from(set);
    }, [books]);

    // Filter books by search query and category
    const filteredBooks = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        return books.filter((book) => {
            const matchesQuery =
                !normalized ||
                book.bookName.toLowerCase().includes(normalized) ||
                book.bookCode.toLowerCase().includes(normalized) ||
                book.category.toLowerCase().includes(normalized);

            const matchesCategory =
                !selectedCategory || book.category === selectedCategory;

            return matchesQuery && matchesCategory;
        });
    }, [books, query, selectedCategory]);

    // Group filtered books by category
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
        <div className="min-h-screen bg-ed-bg font-sans text-ed-fg selection:bg-ed-accent/30">
            {/* ----------------- Hero ----------------- */}
            <div className="relative overflow-hidden border-b border-ed-rule">
                <ReactBitsParticles
                    particleCount={75}
                    speed={0.4}
                    particleColors={['#fbbf24', '#f59e0b', '#d97706', '#ffffff']}
                    particleBaseSize={2.2}
                    moveParticlesOnHover={true}
                />

                <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full bg-ed-accent/[0.07] blur-[110px]" />
                </div>

                <div className="relative mx-auto max-w-[1200px] px-5 py-16 sm:px-8 sm:py-24 lg:py-28">
                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-ed-accent">
                        Scripture
                    </p>
                    <h1 className="mt-6 font-slab text-[clamp(2.75rem,9vw,5rem)] leading-[1.05] tracking-tight text-ed-fg sm:mt-7">
                        {title}
                    </h1>
                    <p className="mt-6 max-w-[50ch] font-slab text-base leading-relaxed text-ed-fg-muted sm:mt-7 sm:text-lg">
                        {subtitle}
                    </p>

                    <ScriptureTabs />
                </div>
            </div>

            {/* ----------------- Sticky filter & section bar ----------------- */}
            <div className="sticky top-0 z-10 border-b border-ed-rule bg-ed-bg/85 backdrop-blur-md">
                <div className="mx-auto max-w-[1200px] px-5 py-3 sm:px-8 space-y-2.5">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Find a book by name or category…"
                                aria-label="Filter books"
                                className="w-full rounded-lg border border-ed-rule bg-ed-surface/50 py-2.5 pl-10 pr-9 text-sm text-ed-fg placeholder:text-ed-fg-muted/60 transition-colors focus:border-ed-accent focus:bg-ed-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/40"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery('')}
                                    aria-label="Clear filter"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ed-fg-muted transition-colors hover:text-ed-fg"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>

                        <span className="hidden shrink-0 font-mono text-xs tabular-nums text-ed-fg-muted/70 sm:block">
                            {filteredBooks.length}/{books.length}
                        </span>

                        <div className="flex shrink-0 rounded-lg border border-ed-rule p-0.5" role="group" aria-label="View mode">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                aria-pressed={viewMode === 'grid'}
                                aria-label="Grid view"
                                className={`rounded-[5px] p-2 transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-ed-surface-strong text-ed-accent'
                                        : 'text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                <GridIcon className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                aria-pressed={viewMode === 'list'}
                                aria-label="List view"
                                className={`rounded-[5px] p-2 transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-ed-surface-strong text-ed-accent'
                                        : 'text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                <ListIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Category Filter Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory(null)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                selectedCategory === null
                                    ? 'bg-ed-fg text-ed-bg shadow-sm font-semibold'
                                    : 'border border-ed-rule text-ed-fg-muted hover:border-ed-accent/40 hover:text-ed-fg'
                            }`}
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
                                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        isSelected
                                            ? 'bg-ed-accent text-black font-semibold'
                                            : 'border border-ed-rule text-ed-fg-muted hover:border-ed-accent/40 hover:text-ed-fg'
                                    }`}
                                >
                                    {cat} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ----------------- Content ----------------- */}
            <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8 sm:py-10 space-y-12">
                {filteredBooks.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-ed-rule-strong px-6 py-24 text-center">
                        <p className="font-serif text-xl text-ed-fg-muted">
                            No book matches your selection.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setQuery('');
                                setSelectedCategory(null);
                            }}
                            className="mt-4 text-sm font-medium text-ed-accent hover:underline"
                        >
                            Reset filters
                        </button>
                    </div>
                ) : (
                    groupedSections.map(([sectionTitle, sectionBooks]) => (
                        <section key={sectionTitle} className="space-y-4">
                            {/* Section Header */}
                            <div className="flex items-center justify-between border-b border-ed-rule/60 pb-3">
                                <h2 className="font-serif text-xl font-semibold tracking-tight text-ed-fg sm:text-2xl">
                                    {sectionTitle}
                                </h2>
                                <span className="font-mono text-xs tabular-nums text-ed-fg-muted/70">
                                    {sectionBooks.length} {sectionBooks.length === 1 ? 'book' : 'books'}
                                </span>
                            </div>

                            {viewMode === 'grid' ? (
                                /* --- GRID VIEW --- */
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                                    {sectionBooks.map((book) => (
                                        <Link
                                            key={book.bookCode}
                                            href={`/quran/bible/${book.bookCode.toLowerCase()}`}
                                            className="group relative flex flex-col gap-5 rounded-xl border border-ed-rule bg-ed-surface/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-ed-accent/40 hover:bg-ed-surface sm:p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/50"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="font-mono text-xs tabular-nums text-ed-fg-muted/60">
                                                    {String(book.order).padStart(2, '0')}
                                                </span>
                                                <span className="font-mono text-[10px] uppercase tracking-wider text-ed-fg-muted/50">
                                                    {book.bookCode}
                                                </span>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate font-serif text-base font-medium text-ed-fg transition-colors group-hover:text-ed-accent sm:text-lg">
                                                    {book.bookName}
                                                </h3>
                                                <p className="mt-1 truncate text-xs text-ed-fg-muted sm:text-sm">
                                                    {book.chapterCount} ch · {book.verseCount.toLocaleString()}v
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                /* --- LIST VIEW --- */
                                <div className="divide-y divide-ed-rule/70 overflow-hidden rounded-xl border border-ed-rule">
                                    {sectionBooks.map((book) => (
                                        <Link
                                            key={book.bookCode}
                                            href={`/quran/bible/${book.bookCode.toLowerCase()}`}
                                            className="group flex items-center gap-3 bg-ed-surface/20 px-4 py-3.5 transition-colors hover:bg-ed-surface sm:gap-4 sm:px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/50"
                                        >
                                            <span className="w-7 shrink-0 text-right font-mono text-sm tabular-nums text-ed-fg-muted/50 transition-colors group-hover:text-ed-accent sm:w-8">
                                                {book.order}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate font-serif text-base font-medium text-ed-fg transition-colors group-hover:text-ed-accent">
                                                    {book.bookName}
                                                </h3>
                                            </div>
                                            <span className="hidden w-20 shrink-0 text-right font-mono text-xs tabular-nums text-ed-fg-muted/50 md:block">
                                                {book.chapterCount} chapters
                                            </span>
                                            <span className="hidden w-20 shrink-0 text-right font-mono text-xs tabular-nums text-ed-fg-muted/50 md:block">
                                                {book.verseCount.toLocaleString()} verses
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
