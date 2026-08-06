'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlignLeft, Copy, Search, Share2, X } from 'lucide-react';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import type { QuranChapter, QuranChapterSummary, QuranVerse } from './page';

type ChapterNav = { chapterNumber: number; titleEnglish: string };

type Props = {
    chapter: QuranChapter;
    allChapters: QuranChapterSummary[];
    prev?: ChapterNav;
    next?: ChapterNav;
    initialVerse?: number;
    initialQuery: string;
};

/* ---------------------------------- Hooks ---------------------------------- */

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

function useReveal<T extends HTMLElement>(initiallyVisible = false) {
    const ref = useRef<T | null>(null);
    const [visible, setVisible] = useState(initiallyVisible);

    useEffect(() => {
        if (visible) return;
        const el = ref.current;
        if (!el) return;
        if (typeof IntersectionObserver === 'undefined') {
            queueMicrotask(() => setVisible(true));
            return;
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        io.disconnect();
                    }
                }
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [visible]);

    return { ref, visible };
}

/* ------------------------------- Main Component ---------------------------- */

export default function QuranChapterClient({
    chapter,
    allChapters,
    initialVerse,
    initialQuery,
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [suraFilter, setSuraFilter] = useState('');
    const [query] = useState(initialQuery);
    const hasScrolledToVerse = useRef(false);
    const progress = useReadingProgress();

    const highlightTerms = useMemo(() => getHighlightTerms(query.trim().toLowerCase()), [query]);
    const visibleVerses = useMemo(
        () => chapter.verses.filter((verse) => Boolean(verse.english)),
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

    useEffect(() => {
        if (!initialVerse || hasScrolledToVerse.current) return;
        hasScrolledToVerse.current = true;
        const el = document.getElementById(`verse-${initialVerse}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [initialVerse]);

    return (
        <div className="min-h-screen bg-ed-bg font-body text-ed-fg antialiased">
            {/* ------------------------- Top Header Bar ------------------------ */}
            <header className="sticky top-[65px] z-30 flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-ed-rule bg-ed-bg/80 px-4 sm:px-8 backdrop-blur-md transition-all duration-300">
                <div className="flex min-w-0 items-center gap-4">
                    {/* Mobile menu toggle */}
                    <button
                        type="button"
                        onClick={() => setMobileDrawerOpen(true)}
                        aria-label="Open surah navigation"
                        className="inline-flex xl:hidden items-center justify-center h-10 w-10 rounded-md text-ed-fg-muted hover:text-ed-accent focus-visible:outline-none"
                    >
                        <AlignLeft className="h-5 w-5" />
                    </button>

                    {/* Navigation Dropdowns (Placeholder matching image) */}
                    <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-ed-fg-muted">
                        <Link href="/quran" className="hover:text-ed-fg transition-colors">Surahs</Link>
                        <Link href="/quran/appendices" className="hover:text-ed-fg transition-colors">Appendices</Link>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        aria-label="Share chapter"
                        className="flex h-10 w-10 items-center justify-center rounded-md border border-ed-rule text-ed-fg-muted hover:text-ed-accent"
                    >
                        <Share2 className="h-4 w-4" />
                    </button>

                    {/* Sidebar Toggle */}
                    <button
                        onClick={() => setSidebarOpen((prev) => !prev)}
                        className={`hidden xl:flex h-10 w-10 items-center justify-center rounded-md border border-ed-rule transition-colors ${sidebarOpen ? 'bg-ed-accent/10 text-ed-accent border-ed-accent/30' : 'text-ed-fg-muted hover:text-ed-accent'}`}
                        aria-label="Toggle Sidebar"
                    >
                        <AlignLeft className="h-4 w-4" />
                    </button>
                </div>

                {/* Reading Progress Line */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-[1px] origin-left bg-ed-accent/80 transition-transform duration-150 ease-out"
                    style={{ transform: `scaleX(${progress})` }}
                />
            </header>

            <div className="mx-auto flex max-w-[1600px]">
                {/* ------------------ Main Reading Content Area (Left) ------------------ */}
                <main id="main-content" className="flex-1 min-w-0 px-4 py-10 sm:px-10 lg:px-16 pb-32">
                    <div className="mx-auto max-w-[900px]">
                        {/* Chapter Header Card (Matching image style) */}
                        <header className="border-b border-ed-rule pb-12 mb-12">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                                <div className="space-y-2">
                                    <h1 className="font-sans text-[2.5rem] font-semibold text-ed-fg tracking-tight">
                                        {chapter.chapterNumber}. {chapter.titleEnglish}
                                    </h1>
                                    <p className="text-ed-accent text-lg font-medium tracking-wide">
                                        {chapter.titleTransliterated}
                                    </p>
                                </div>

                                <div className="text-right space-y-3">
                                    <h2 dir="rtl" className="font-arabic text-[3.5rem] leading-none text-ed-fg drop-shadow-sm">
                                        {chapter.titleArabic}
                                    </h2>
                                    <p className="text-ed-accent text-sm font-arabic tracking-widest">
                                        {chapter.chapterNumber === 1 || chapter.revelationOrder ? 'مَكِّيَّة' : 'مَدَنِيَّة'} &middot; {visibleVerses.length} آيَات
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 mt-12 text-sm">
                                <div className="space-y-1.5">
                                    <p className="text-xs text-ed-fg-muted uppercase tracking-wider">Surah Number</p>
                                    <p className="font-semibold text-ed-fg text-lg">{chapter.chapterNumber}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-ed-fg-muted uppercase tracking-wider">Type</p>
                                    <p className="font-semibold text-ed-fg text-base">{chapter.chapterNumber === 1 || chapter.revelationOrder ? 'Makki' : 'Madani'}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-ed-fg-muted uppercase tracking-wider">Ayahs</p>
                                    <p className="font-semibold text-ed-fg text-lg">{visibleVerses.length}</p>
                                </div>
                                <div className="space-y-1.5">
                                    <p className="text-xs text-ed-fg-muted uppercase tracking-wider">Revelation Order</p>
                                    <p className="font-semibold text-ed-fg text-lg">{chapter.revelationOrder || '-'}</p>
                                </div>
                                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                    <p className="text-xs text-ed-fg-muted uppercase tracking-wider">Language</p>
                                    <div className="flex gap-2">
                                        <span className="rounded border border-ed-rule px-2 py-0.5 text-xs">Arabic</span>
                                        <span className="rounded border border-ed-rule px-2 py-0.5 text-xs">English</span>
                                    </div>
                                </div>
                            </div>
                        </header>

                        {/* Search Within Sura Input */}
                        <div className="relative mb-8 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setSuraFilter(e.target.value)}
                                placeholder="Search within this sura..."
                                aria-label="Search within this sura"
                                className="w-full rounded-xl border border-ed-rule bg-ed-surface py-2.5 pl-10 pr-4 text-sm text-ed-fg placeholder:text-ed-fg-muted focus:border-ed-accent focus:outline-none"
                            />
                        </div>

                        {/* Verses List */}
                        <div className="space-y-6">
                            {visibleVerses.map((verse) => (
                                <QuranVerseCard
                                    key={verse.verseId}
                                    verse={verse}
                                    highlightTerms={highlightTerms}
                                    isTarget={initialVerse === verse.verseNumber}
                                />
                            ))}
                        </div>

                    </div>
                </main>

                {/* ------------------ Right Sidebar (Desktop) ------------------ */}
                <aside
                    className={`hidden xl:flex flex-col sticky top-[130px] h-[calc(100vh-130px)] shrink-0 border-l border-ed-rule bg-ed-bg transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[340px] opacity-100' : 'w-[0px] opacity-0 overflow-hidden border-none'
                        }`}
                >
                    <div className="w-[340px] flex flex-col h-full">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-ed-rule">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                                <input
                                    type="text"
                                    value={suraFilter}
                                    onChange={(e) => setSuraFilter(e.target.value)}
                                    placeholder="Filter by surah..."
                                    className="w-full rounded-md border border-ed-rule bg-ed-surface py-2.5 pl-9 pr-3 text-sm focus:border-ed-accent focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Page Navigator block */}
                        <div className="p-4 border-b border-ed-rule space-y-5">
                            <div>
                                <h3 className="text-sm font-semibold text-ed-fg">Surah Navigator</h3>
                                <p className="text-xs text-ed-fg-muted mt-1">Quick jump to a surah</p>
                            </div>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Surah number" className="flex-1 rounded-md border border-ed-rule bg-ed-surface px-3 py-2 text-sm focus:outline-none focus:border-ed-accent" />
                                <button className="rounded-md bg-ed-accent/90 px-4 py-2 text-sm font-medium text-[#131110] hover:bg-ed-accent transition-colors">Go</button>
                            </div>
                        </div>

                        {/* Suras Scroll List */}
                        <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-none space-y-1">
                            {filteredSidebarChapters.map((item) => {
                                const isActive = item.chapterNumber === chapter.chapterNumber;
                                return (
                                    <Link
                                        key={item.chapterNumber}
                                        href={`/quran/${item.chapterNumber}`}
                                        className={`group flex items-center justify-between rounded-md px-4 py-3 text-sm transition-all duration-200 ${isActive
                                                ? 'bg-ed-surface shadow-sm'
                                                : 'text-ed-fg-muted hover:bg-ed-surface/50 hover:text-ed-fg'
                                            }`}
                                    >
                                        <span className={`font-medium ${isActive ? 'text-ed-accent' : ''}`}>
                                            {item.titleTransliterated}
                                        </span>
                                        <span className={`font-mono text-xs ${isActive ? 'text-ed-accent' : 'text-ed-fg-muted/60'}`}>
                                            {item.chapterNumber}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* ------------------ Mobile Drawer (Slide-over) ------------------ */}
                {mobileDrawerOpen && (
                    <div className="fixed inset-0 z-50 flex xl:hidden">
                        <div
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                            onClick={() => setMobileDrawerOpen(false)}
                        />
                        <div className="relative mr-auto flex w-80 max-w-[85vw] flex-col border-r border-ed-rule bg-ed-bg shadow-2xl">
                            <div className="flex items-center justify-between border-b border-ed-rule p-4">
                                <span className="font-semibold">Surahs Index</span>
                                <button
                                    type="button"
                                    onClick={() => setMobileDrawerOpen(false)}
                                    className="rounded-md p-1.5 text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-4 border-b border-ed-rule">
                                <input
                                    type="text"
                                    value={suraFilter}
                                    onChange={(e) => setSuraFilter(e.target.value)}
                                    placeholder="Filter 114 suras..."
                                    className="w-full rounded-md border border-ed-rule bg-ed-surface py-2 pl-3 pr-3 text-sm"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
                                {filteredSidebarChapters.map((item) => {
                                    const isActive = item.chapterNumber === chapter.chapterNumber;
                                    return (
                                        <Link
                                            key={item.chapterNumber}
                                            href={`/quran/${item.chapterNumber}`}
                                            onClick={() => setMobileDrawerOpen(false)}
                                            className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm ${isActive ? 'bg-ed-surface text-ed-accent font-semibold' : 'text-ed-fg-muted hover:text-ed-fg'
                                                }`}
                                        >
                                            <span>{item.titleTransliterated}</span>
                                            <span className="font-mono text-xs">{item.chapterNumber}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* -------------------------------- Verse Card ------------------------------- */

function QuranVerseCard({
    verse,
    highlightTerms,
    isTarget,
}: {
    verse: QuranVerse;
    highlightTerms: string[];
    isTarget: boolean;
}) {
    const { ref, visible } = useReveal<HTMLElement>(isTarget);

    return (
        <article
            ref={ref}
            id={`verse-${verse.verseNumber}`}
            className={`group scroll-mt-32 border-b border-ed-rule py-10 transition-all duration-700 ease-out
                ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'} 
                ${isTarget ? 'bg-ed-accent/5' : ''}`}
        >
            {verse.subtitle && (
                <div className="mb-10 flex items-center justify-center gap-4">
                    <span aria-hidden="true" className="h-[1px] w-12 bg-ed-accent/30" />
                    <h3 className="text-center font-sans text-xs font-bold uppercase tracking-[0.2em] text-ed-accent">
                        <HighlightedText text={verse.subtitle} terms={highlightTerms} />
                    </h3>
                    <span aria-hidden="true" className="h-[1px] w-12 bg-ed-accent/30" />
                </div>
            )}

            <div className="flex gap-4 sm:gap-8 lg:gap-12 items-start">
                {/* Ornate Medallion */}
                <div className="relative mt-2 flex h-12 w-12 shrink-0 items-center justify-center">
                    <svg className="absolute inset-0 h-full w-full text-ed-accent/50 transition-colors group-hover:text-ed-accent/80" viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M27 1L33 8.5L42 7.5L45 16L53 20L49 27L53 34L45 38L42 46.5L33 45.5L27 53L21 45.5L12 46.5L9 38L1 34L5 27L1 20L9 16L12 7.5L21 8.5L27 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                        <circle cx="27" cy="27" r="18" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                    </svg>
                    <span className="relative z-10 font-sans text-[0.7rem] font-medium tracking-tight text-ed-fg-muted group-hover:text-ed-fg">
                        {verse.verseId}
                    </span>
                </div>

                {/* Right-aligned text content */}
                <div className="flex-1 flex flex-col space-y-6">
                    {verse.arabic && (
                        <p dir="rtl" className="font-arabic text-right text-[2.2rem] sm:text-[2.6rem] leading-[2.2] text-ed-fg antialiased">
                            {verse.arabic}
                        </p>
                    )}

                    <div className="flex justify-start">
                        <p className="max-w-[75ch] font-sans text-left text-[1.1rem] leading-8 text-ed-accent">
                            <HighlightedText text={verse.english} terms={highlightTerms} />
                        </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                        <button
                            type="button"
                            aria-label="Copy verse"
                            onClick={() => navigator.clipboard?.writeText?.(`${verse.verseId}: ${verse.english}`)}
                            className="inline-flex items-center gap-1.5 rounded-md border border-ed-rule bg-ed-surface px-2.5 py-1 font-mono text-[0.68rem] text-ed-fg-muted hover:text-ed-fg transition-colors"
                        >
                            <Copy className="h-3 w-3" />
                            Copy verse
                        </button>
                    </div>

                    {verse.footnote && (
                        <div className="flex justify-start pt-2">
                            <aside className="w-full max-w-[75ch] rounded border-l-2 border-ed-accent bg-ed-surface p-4 text-left">
                                <p className="font-sans text-sm leading-7 text-ed-fg-muted">
                                    <HighlightedText text={verse.footnote} terms={highlightTerms} />
                                </p>
                            </aside>
                        </div>
                    )}
                </div>
            </div>
        </article>
    );
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
    if (terms.length === 0 || !text) return <>{text}</>;
    const pattern = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) =>
                terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
                    <mark key={index} className="quran-mark">
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                ),
            )}
        </>
    );
}
