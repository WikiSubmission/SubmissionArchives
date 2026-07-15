'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Copy, Search } from 'lucide-react';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import type { QuranChapter, QuranVerse } from './page';

type ChapterNav = { chapterNumber: number; titleEnglish: string };

type Props = {
    chapter: QuranChapter;
    prev?: ChapterNav;
    next?: ChapterNav;
    initialVerse?: number;
    initialQuery: string;
    initialEdition: 'primary' | '1989' | '1981';
};

export default function QuranChapterClient({ chapter, prev, next, initialVerse, initialQuery, initialEdition }: Props) {
    const [query, setQuery] = useState(initialQuery);
    const has1981 = chapter.verses.some((verse) => Boolean(verse.editions?.['1981']));
    const safeInitialEdition = initialEdition === '1981' && !has1981 ? 'primary' : initialEdition;
    const [globalEdition, setGlobalEdition] = useState<'primary' | '1989' | '1981'>(safeInitialEdition);
    const hasScrolledToVerse = useRef(false);
    const highlightTerms = useMemo(() => getHighlightTerms(query.trim().toLowerCase()), [query]);
    const visibleVerses = useMemo(
        () => chapter.verses.filter((verse) => Boolean(verse.english) || Boolean(verse.editions?.[globalEdition as '1989' | '1981'])),
        [chapter.verses, globalEdition],
    );

    useEffect(() => {
        if (!initialVerse || hasScrolledToVerse.current) return;
        hasScrolledToVerse.current = true;
        const el = document.getElementById(`verse-${initialVerse}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [initialVerse]);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <header className="sticky top-[65px] z-20 flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-ed-rule bg-ed-bg px-4">
                <div className="flex min-w-0 items-center gap-4">
                    <Link
                        href="/quran"
                        className="-mx-1 flex min-h-11 items-center px-1 text-ed-fg-muted transition-colors hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Back to Qur'an"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="ml-1 text-sm font-medium">Back</span>
                    </Link>
                    <div className="h-4 w-px bg-ed-rule" />
                    <h1 className="min-w-0 truncate text-sm font-semibold">
                        {chapter.chapterNumber}. {chapter.titleEnglish}
                    </h1>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    {prev ? (
                        <Link
                            href={`/quran/${prev.chapterNumber}`}
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
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
                            className="flex min-h-11 min-w-11 items-center justify-center rounded-sm text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                            aria-label={`Next sura: ${next.chapterNumber}. ${next.titleEnglish}`}
                            title={`${next.chapterNumber}. ${next.titleEnglish}`}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Link>
                    ) : (
                        <div className="w-11" />
                    )}
                </div>
            </header>

            <main id="main-content" className="mx-auto max-w-[820px] px-4 py-10 sm:px-6">
                <section className="mb-8 space-y-2 border-y border-ed-rule py-8 text-center sm:py-10">
                    <p className="archive-kicker">
                        Sura {chapter.chapterNumber} &middot; {visibleVerses.length} verses
                    </p>
                    <h2 className="font-display text-3xl text-ed-fg sm:text-4xl">{chapter.titleEnglish}</h2>
                    <p className="text-sm text-ed-fg-muted">{chapter.titleTransliterated}</p>
                    <p dir="rtl" className="font-arabic pt-2 text-3xl text-ed-fg">{chapter.titleArabic}</p>

                    <div className="relative mx-auto max-w-md pt-4">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                        <label htmlFor="quran-verse-search" className="sr-only">Search within this sura</label>
                        <input
                            id="quran-verse-search"
                            name="quranVerseSearch"
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search within this sura..."
                            className="archive-input w-full py-3 pl-11 pr-4"
                        />
                    </div>

                    <div role="group" aria-label="Translation edition" className="mx-auto mt-4 flex w-fit max-w-full flex-wrap items-center justify-center gap-1 rounded-lg border border-ed-rule bg-ed-surface p-1">
                        <button
                            type="button"
                            onClick={() => setGlobalEdition('primary')}
                            aria-pressed={globalEdition === 'primary'}
                            className={`min-h-11 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                globalEdition === 'primary' ? 'bg-ed-bg text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'
                            }`}
                        >
                            Primary (1992)
                        </button>
                        <button
                            type="button"
                            onClick={() => setGlobalEdition('1989')}
                            aria-pressed={globalEdition === '1989'}
                            className={`min-h-11 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                globalEdition === '1989' ? 'bg-ed-bg text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'
                            }`}
                        >
                            1989
                        </button>
                        {has1981 ? (
                            <button
                                type="button"
                                onClick={() => setGlobalEdition('1981')}
                                aria-pressed={globalEdition === '1981'}
                                className={`min-h-11 rounded-md px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                    globalEdition === '1981' ? 'bg-ed-bg text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                1981
                            </button>
                        ) : (
                            <Link
                                href="/library/quran1981"
                                className="flex min-h-11 items-center rounded-md px-4 py-2.5 text-sm font-semibold text-ed-fg-muted transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                title="Open the page-transcribed 1981 facsimile"
                            >
                                1981 facsimile
                            </Link>
                        )}
                    </div>
                </section>

                <div>
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

                <div className="mt-10 flex items-center justify-between gap-3 border-t border-ed-rule pt-6">
                    {prev ? (
                        <Link href={`/quran/${prev.chapterNumber}`} className="archive-button archive-button-secondary px-4">
                            <ChevronLeft className="h-4 w-4" /> {prev.chapterNumber}. {prev.titleEnglish}
                        </Link>
                    ) : <span />}
                    {next ? (
                        <Link href={`/quran/${next.chapterNumber}`} className="archive-button archive-button-secondary px-4">
                            {next.chapterNumber}. {next.titleEnglish} <ChevronRight className="h-4 w-4" />
                        </Link>
                    ) : <span />}
                </div>
            </main>
        </div>
    );
}

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
    globalEdition: 'primary' | '1989' | '1981';
}) {
    const [copied, setCopied] = useState(false);
    const [edition, setEdition] = useState<'primary' | '1989' | '1981'>(globalEdition);
    const [prevGlobalEdition, setPrevGlobalEdition] = useState(globalEdition);

    if (globalEdition !== prevGlobalEdition) {
        setEdition(globalEdition);
        setPrevGlobalEdition(globalEdition);
    }

    const activeEnglish = edition === 'primary' ? verse.english : verse.editions?.[edition]?.english ?? verse.english;
    const activeSubtitle = edition === 'primary' ? verse.subtitle : verse.editions?.[edition]?.subtitle ?? verse.subtitle;
    const activeFootnote = edition === 'primary' ? verse.footnote : verse.editions?.[edition]?.footnote ?? verse.footnote;

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
            id={`verse-${verse.verseNumber}`}
            className={`scroll-mt-36 overflow-hidden border-b border-ed-rule transition-colors first:border-t ${
                isTarget ? 'bg-ed-accent/5' : ''
            }`}
        >
            <div className="space-y-4 py-7 sm:px-2 sm:py-8">
                {activeSubtitle ? (
                    <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-ed-accent">
                        <HighlightedText text={activeSubtitle} terms={highlightTerms} />
                    </p>
                ) : null}

                <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex w-fit shrink-0 items-center gap-1 border-l-2 border-ed-accent pl-3 font-mono text-ed-accent">
                        <span className="text-base font-semibold">{chapterNumber}</span>
                        <span className="text-ed-accent/60">:</span>
                        <span className="text-base font-semibold">{verse.verseNumber}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {verse.editions && Object.keys(verse.editions).length > 0 && (
                            <div role="group" aria-label={`Edition for verse ${verse.verseNumber}`} className="flex items-center gap-1 rounded-full bg-black/5 p-0.5 dark:bg-white/5">
                                {verse.english && (
                                    <button
                                        type="button"
                                        onClick={() => setEdition('primary')}
                                        aria-pressed={edition === 'primary'}
                                        className={`min-h-9 rounded-full px-3 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                            edition === 'primary' ? 'bg-ed-surface text-ed-accent shadow-sm' : 'text-ed-fg-muted hover:text-ed-fg'
                                        }`}
                                    >
                                        Primary
                                    </button>
                                )}
                                {verse.editions['1989'] && (
                                    <button
                                        type="button"
                                        onClick={() => setEdition('1989')}
                                        aria-pressed={edition === '1989'}
                                        className={`min-h-9 rounded-full px-3 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                            edition === '1989' ? 'bg-ed-surface text-ed-accent shadow-sm' : 'text-ed-fg-muted hover:text-ed-fg'
                                        }`}
                                    >
                                        1989
                                    </button>
                                )}
                                {verse.editions['1981'] && (
                                    <button
                                        type="button"
                                        onClick={() => setEdition('1981')}
                                        aria-pressed={edition === '1981'}
                                        className={`min-h-9 rounded-full px-3 py-2 text-[0.65rem] font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                                            edition === '1981' ? 'bg-ed-surface text-ed-accent shadow-sm' : 'text-ed-fg-muted hover:text-ed-fg'
                                        }`}
                                    >
                                        1981
                                    </button>
                                )}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleCopy}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ed-rule text-ed-fg-muted transition-colors hover:bg-ed-surface hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
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

                {verse.arabic ? (
                    <p dir="rtl" className="font-arabic text-right text-2xl leading-[2.4] text-ed-fg">
                        {verse.arabic}
                    </p>
                ) : null}

                <p className="text-[1.08rem] leading-8 text-ed-fg sm:text-lg">
                    <HighlightedText text={activeEnglish} terms={highlightTerms} />
                </p>

                {activeFootnote ? (
                    <p className="whitespace-pre-wrap border-l-2 border-ed-accent/40 pl-3 text-sm leading-6 text-ed-fg-muted">
                        <HighlightedText text={activeFootnote} terms={highlightTerms} />
                    </p>
                ) : null}
            </div>
        </article>
    );
}

function HighlightedText({ text, terms }: { text: string; terms: string[] }) {
    if (terms.length === 0 || !text) return <>{text}</>;

    const pattern = terms
        .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|');
    const regex = new RegExp(`(${pattern})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, index) =>
                terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
                    <mark key={index} className="rounded bg-ed-accent/25 px-0.5 text-ed-fg">
                        {part}
                    </mark>
                ) : (
                    <span key={index}>{part}</span>
                )
            )}
        </>
    );
}
