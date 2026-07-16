'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Copy, Search } from 'lucide-react';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import type { QuranChapter, QuranVerse } from './page';

type ChapterNav = { chapterNumber: number; titleEnglish: string };
type Edition = 'primary' | '1989' | '1981';

type Props = {
    chapter: QuranChapter;
    prev?: ChapterNav;
    next?: ChapterNav;
    initialVerse?: number;
    initialQuery: string;
    initialEdition: Edition;
};

/* ---------------------------------- hooks ---------------------------------- */

/** 0 → 1 reading progress of the whole document, rAF-throttled. */
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

/** One-shot IntersectionObserver reveal. */
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
            { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [visible]);

    return { ref, visible };
}

/* ------------------------------ ornament bits ------------------------------ */

function OrnamentDivider({ className = '' }: { className?: string }) {
    return (
        <div aria-hidden="true" className={`flex items-center justify-center gap-3 text-ed-accent/70 ${className}`}>
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-ed-accent/50 sm:w-20" />
            <span className="block h-1.5 w-1.5 rotate-45 border border-ed-accent/70 bg-ed-surface" />
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-ed-accent/50 sm:w-20" />
        </div>
    );
}

/* ------------------------- segmented edition control ------------------------ */

type EditionOption = { value: Edition; label: string };

/**
 * Tactile pill control with a measured, animated sliding thumb.
 * Used at both the chapter (md) and verse (sm) scale.
 */
function EditionSegmentedControl({
    options,
    value,
    onChange,
    size,
    ariaLabel,
}: {
    options: EditionOption[];
    value: Edition;
    onChange: (edition: Edition) => void;
    size: 'md' | 'sm';
    ariaLabel: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRefs = useRef<Partial<Record<Edition, HTMLButtonElement | null>>>({});
    const [thumb, setThumb] = useState<{ left: number; width: number; visible: boolean }>({
        left: 0,
        width: 0,
        visible: false,
    });

    const measure = useCallback(() => {
        const container = containerRef.current;
        const active = buttonRefs.current[value];
        if (!container || !active) {
            setThumb((t) => ({ ...t, visible: false }));
            return;
        }
        setThumb({ left: active.offsetLeft, width: active.offsetWidth, visible: true });
    }, [value]);

    useLayoutEffect(measure, [measure, options.length]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(measure);
        ro.observe(container);
        return () => ro.disconnect();
    }, [measure]);

    const sizing =
        size === 'md'
            ? { button: 'min-h-11 px-5 text-sm', thumb: 'inset-y-1 rounded-md' }
            : { button: 'min-h-9 px-3 text-[0.65rem] font-bold uppercase tracking-widest', thumb: 'inset-y-0.5 rounded-md' };

    return (
        <div
            ref={containerRef}
            role="group"
            aria-label={ariaLabel}
            className={`relative flex w-fit max-w-full flex-wrap items-center rounded-lg border border-ed-rule bg-ed-surface p-1 shadow-[var(--ed-shadow-sm,0_1px_2px_rgba(0,0,0,0.06))] ${
                size === 'sm' ? 'rounded-md p-0.5' : ''
            }`}
        >
            {/* Sliding thumb */}
            <span
                aria-hidden="true"
                className={`quran-thumb pointer-events-none absolute left-0 bg-ed-bg text-transparent shadow-md ring-1 ring-ed-rule ${sizing.thumb}`}
                style={{
                    width: thumb.width,
                    transform: `translateX(${thumb.left}px)`,
                    opacity: thumb.visible ? 1 : 0,
                }}
            />
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        ref={(el) => {
                            buttonRefs.current[option.value] = el;
                        }}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={active}
                        className={`relative z-10 rounded-[inherit] font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${sizing.button} ${
                            size === 'md' ? 'rounded-md' : 'rounded-md'
                        } ${active ? 'text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ------------------------------- main component ---------------------------- */

export default function QuranChapterClient({ chapter, prev, next, initialVerse, initialQuery, initialEdition }: Props) {
    const [query, setQuery] = useState(initialQuery);
    const has1981 = chapter.verses.some((verse) => Boolean(verse.editions?.['1981']));
    const safeInitialEdition = initialEdition === '1981' && !has1981 ? 'primary' : initialEdition;
    const [globalEdition, setGlobalEdition] = useState<Edition>(safeInitialEdition);
    const hasScrolledToVerse = useRef(false);
    const progress = useReadingProgress();

    const highlightTerms = useMemo(() => getHighlightTerms(query.trim().toLowerCase()), [query]);
    const visibleVerses = useMemo(
        () => chapter.verses.filter((verse) => Boolean(verse.english) || Boolean(verse.editions?.[globalEdition as '1989' | '1981'])),
        [chapter.verses, globalEdition],
    );

    const matchCount = useMemo(() => {
        if (highlightTerms.length === 0) return 0;
        const pattern = new RegExp(
            highlightTerms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
            'i',
        );
        return visibleVerses.filter((verse) => {
            const edition = verse.editions?.[globalEdition as '1989' | '1981'];
            const english = globalEdition === 'primary' ? verse.english : edition?.english ?? verse.english;
            const subtitle = globalEdition === 'primary' ? verse.subtitle : edition?.subtitle ?? verse.subtitle;
            return (english && pattern.test(english)) || (subtitle && pattern.test(subtitle));
        }).length;
    }, [highlightTerms, visibleVerses, globalEdition]);

    useEffect(() => {
        if (!initialVerse || hasScrolledToVerse.current) return;
        hasScrolledToVerse.current = true;
        const el = document.getElementById(`verse-${initialVerse}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [initialVerse]);

    const globalOptions: EditionOption[] = useMemo(() => {
        const options: EditionOption[] = [
            { value: 'primary', label: 'Primary · 1992' },
            { value: '1989', label: '1989' },
        ];
        if (has1981) options.push({ value: '1981', label: '1981' });
        return options;
    }, [has1981]);

    return (
        <div className="min-h-screen bg-ed-bg font-body text-ed-fg">
            {/* ------------------------- frosted instrument bar ------------------------ */}
            <header className="quran-glass sticky top-[65px] z-20 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-ed-rule/60 px-4">
                <div className="flex min-w-0 items-center gap-4">
                    <Link
                        href="/quran"
                        className="-mx-1 flex min-h-11 items-center rounded-md px-1 text-ed-fg-muted transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Back to Qur'an"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="ml-1 text-sm font-medium">Back</span>
                    </Link>
                    <div className="h-4 w-px bg-ed-rule" />
                    <h1 className="min-w-0 truncate font-display text-sm font-semibold tracking-wide">
                        {chapter.chapterNumber}. {chapter.titleEnglish}
                    </h1>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    {prev ? (
                        <Link
                            href={`/quran/${prev.chapterNumber}`}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-ed-fg-muted transition-all hover:-translate-x-0.5 hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                            aria-label={`Previous sura: ${prev.chapterNumber}. ${prev.titleEnglish}`}
                            title={`${prev.chapterNumber}. ${prev.titleEnglish}`}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                    ) : (
                        <div className="w-11" />
                    )}
                    {next ? (
                        <Link
                            href={`/quran/${next.chapterNumber}`}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-ed-fg-muted transition-all hover:translate-x-0.5 hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                            aria-label={`Next sura: ${next.chapterNumber}. ${next.titleEnglish}`}
                            title={`${next.chapterNumber}. ${next.titleEnglish}`}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    ) : (
                        <div className="w-11" />
                    )}
                </div>

                {/* Reading progress */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-[-1px] h-0.5 origin-left bg-ed-accent/80"
                    style={{ transform: `scaleX(${progress})` }}
                />
            </header>

            <main id="main-content" className="mx-auto max-w-[820px] px-4 pb-16 sm:px-6">
                {/* --------------------------------- hero --------------------------------- */}
                <section className="space-y-4 pb-10 pt-12 text-center sm:pt-16">
                    <p className="archive-kicker">
                        Sura {chapter.chapterNumber} &middot; {visibleVerses.length} verses
                        {chapter.revelationOrder ? <> &middot; Revelation {chapter.revelationOrder}</> : null}
                    </p>
                    <div className="h-4 sm:h-8" aria-hidden="true" />
                    <h2 className="font-display text-[clamp(2.4rem,6vw,3.75rem)] leading-[1.05] tracking-tight text-ed-fg">
                        {chapter.titleEnglish}
                    </h2>
                    <p className="text-sm italic tracking-wide text-ed-fg-muted">{chapter.titleTransliterated}</p>

                    <div className="flex items-center justify-center gap-4 pt-1 sm:gap-6">
                        <span aria-hidden="true" className="h-px w-10 bg-ed-rule sm:w-16" />
                        <p dir="rtl" className="font-arabic text-4xl leading-snug text-ed-fg sm:text-[2.75rem]">
                            {chapter.titleArabic}
                        </p>
                        <span aria-hidden="true" className="h-px w-10 bg-ed-rule sm:w-16" />
                    </div>

                    <OrnamentDivider className="pt-3" />

                    {/* Search */}
                    <div className="mx-auto max-w-md pt-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                            <label htmlFor="quran-verse-search" className="sr-only">
                                Search within this sura
                            </label>
                            <input
                                id="quran-verse-search"
                                name="quranVerseSearch"
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search within this sura..."
                                className="archive-input w-full rounded-full py-3 pl-11 pr-4 shadow-sm transition-shadow focus:shadow-[var(--ed-shadow-md)]"
                            />
                        </div>
                        <p aria-live="polite" className="h-5 pt-2 text-xs text-ed-fg-muted">
                            {highlightTerms.length > 0
                                ? matchCount > 0
                                    ? `${matchCount} ${matchCount === 1 ? 'verse' : 'verses'} matching`
                                    : 'No verses matching'
                                : ''}
                        </p>
                    </div>

                    {/* Global edition switch */}
                    <div className="flex flex-col items-center gap-2 pt-1">
                        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ed-fg-muted">
                            Translation edition
                        </span>
                        <EditionSegmentedControl
                            options={globalOptions}
                            value={globalEdition}
                            onChange={setGlobalEdition}
                            size="md"
                            ariaLabel="Translation edition"
                        />
                        {!has1981 && (
                            <Link
                                href="/library/quran1981"
                                className="text-xs font-semibold text-ed-fg-muted underline decoration-ed-accent/40 underline-offset-4 transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                title="Open the page-transcribed 1981 facsimile"
                            >
                                View the 1981 facsimile edition
                            </Link>
                        )}
                    </div>
                </section>

                {/* -------------------------------- verses -------------------------------- */}
                <div className="border-t border-ed-rule/70">
                    {visibleVerses.map((verse) => (
                        <QuranVerseCard
                            key={verse.verseId}
                            verse={verse}
                            chapterNumber={chapter.chapterNumber}
                            highlightTerms={highlightTerms}
                            isTarget={initialVerse === verse.verseNumber}
                            globalEdition={globalEdition}
                        />
                    ))}
                </div>

                {/* ------------------------------ footer nav ------------------------------ */}
                <OrnamentDivider className="mt-12" />
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                    {prev ? (
                        <Link href={`/quran/${prev.chapterNumber}`} className="archive-button archive-button-secondary px-4">
                            <ChevronLeft className="h-4 w-4" /> {prev.chapterNumber}. {prev.titleEnglish}
                        </Link>
                    ) : (
                        <span />
                    )}
                    {next ? (
                        <Link href={`/quran/${next.chapterNumber}`} className="archive-button archive-button-secondary px-4">
                            {next.chapterNumber}. {next.titleEnglish} <ChevronRight className="h-4 w-4" />
                        </Link>
                    ) : (
                        <span />
                    )}
                </div>
            </main>
        </div>
    );
}

/* -------------------------------- verse card ------------------------------- */

function QuranVerseCard({
    verse,
    chapterNumber,
    highlightTerms,
    isTarget,
    globalEdition,
}: {
    verse: QuranVerse;
    chapterNumber: number;
    highlightTerms: string[];
    isTarget: boolean;
    globalEdition: Edition;
}) {
    const [copied, setCopied] = useState(false);
    const [edition, setEdition] = useState<Edition>(globalEdition);
    const [prevGlobalEdition, setPrevGlobalEdition] = useState(globalEdition);
    const { ref, visible } = useReveal<HTMLElement>(isTarget);

    if (globalEdition !== prevGlobalEdition) {
        setEdition(globalEdition);
        setPrevGlobalEdition(globalEdition);
    }

    const activeEnglish = edition === 'primary' ? verse.english : verse.editions?.[edition]?.english ?? verse.english;
    const activeSubtitle = edition === 'primary' ? verse.subtitle : verse.editions?.[edition]?.subtitle ?? verse.subtitle;
    const activeFootnote = edition === 'primary' ? verse.footnote : verse.editions?.[edition]?.footnote ?? verse.footnote;

    const verseOptions: EditionOption[] = [];
    if (verse.english) verseOptions.push({ value: 'primary', label: 'Primary' });
    if (verse.editions?.['1989']) verseOptions.push({ value: '1989', label: '1989' });
    if (verse.editions?.['1981']) verseOptions.push({ value: '1981', label: '1981' });

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`${verse.verseId} ${activeEnglish}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard access can fail silently (e.g. permissions); no-op.
        }
    };

    return (
        <article
            ref={ref}
            id={`verse-${verse.verseNumber}`}
            className={`quran-reveal group scroll-mt-40 border-b border-ed-rule/70 transition-colors duration-500 ${
                visible ? 'is-visible' : ''
            } ${isTarget ? 'bg-ed-accent/[0.06] shadow-[inset_0_0_0_1px_var(--ed-accent)]/10' : ''}`}
        >
            <div className="space-y-6 px-1 py-10 sm:px-3 sm:py-12">
                {/* Subtitle — ornamented sectional heading (cross-fades with edition) */}
                {activeSubtitle ? (
                    <div key={`sub-${edition}`} className="quran-edition-swap flex items-center justify-center gap-3 pt-2">
                        <span aria-hidden="true" className="h-px w-8 bg-ed-accent/40" />
                        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-ed-accent">
                            <HighlightedText text={activeSubtitle} terms={highlightTerms} />
                        </p>
                        <span aria-hidden="true" className="h-px w-8 bg-ed-accent/40" />
                    </div>
                ) : null}

                {/* Meta row — medallion, per-verse edition, copy */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <span
                            aria-hidden="true"
                            className="block h-1.5 w-1.5 rotate-45 border border-ed-accent/60 bg-ed-accent/20"
                        />
                        <span className="inline-flex items-center gap-1 rounded-full border border-ed-accent/30 bg-ed-surface/70 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-ed-accent shadow-sm">
                            {chapterNumber}
                            <span className="text-ed-accent/50">:</span>
                            {verse.verseNumber}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {verseOptions.length > 1 && (
                            <EditionSegmentedControl
                                options={verseOptions}
                                value={edition}
                                onChange={setEdition}
                                size="sm"
                                ariaLabel={`Edition for verse ${verse.verseNumber}`}
                            />
                        )}
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent sm:h-9 sm:w-9 ${
                                copied
                                    ? 'border-ed-accent/50 bg-ed-accent/10 text-ed-accent'
                                    : 'border-ed-rule text-ed-fg-muted hover:border-ed-accent/50 hover:bg-ed-surface hover:text-ed-accent sm:opacity-0 sm:group-hover:opacity-100'
                            }`}
                            aria-label={copied ? 'Copied' : 'Copy verse'}
                            title="Copy verse"
                        >
                            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        <span aria-live="polite" className="sr-only">
                            {copied ? 'Copied' : ''}
                        </span>
                    </div>
                </div>

                {/* Arabic — the dominant voice */}
                {verse.arabic ? (
                    <p dir="rtl" className="font-arabic text-right text-[1.9rem] leading-[2.3] text-ed-fg sm:text-[2.15rem]">
                        {verse.arabic}
                    </p>
                ) : null}

                {/* English + footnote — cross-fade on edition change */}
                <div key={edition} className="quran-edition-swap space-y-5">
                    <p className="max-w-[68ch] text-[1.075rem] leading-8 text-ed-fg sm:text-[1.125rem]">
                        <HighlightedText text={activeEnglish} terms={highlightTerms} />
                    </p>

                    {activeFootnote ? (
                        <aside className="whitespace-pre-wrap border-l-2 border-ed-accent/35 bg-ed-surface/40 py-2 pl-4 pr-3 text-sm leading-6 text-ed-fg-muted">
                            <HighlightedText text={activeFootnote} terms={highlightTerms} />
                        </aside>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

/* ------------------------------ search highlight --------------------------- */

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
