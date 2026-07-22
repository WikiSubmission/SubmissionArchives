'use client';

import { BookMarked } from 'lucide-react';
import { useState } from 'react';

import { CtaLink } from './SectionCta';

const SAMPLE_VERSES = [
    {
        ref: '1:1',
        sura: 'Sura 1 · The Key',
        arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        translation: 'In the name of GOD, Most Gracious, Most Merciful.',
        editions: ['1992 Primary', '1989 Edition', '1981 Edition'],
    },
    {
        ref: '3:81',
        sura: 'Sura 3 · The Amramites',
        arabic: 'وَإِذْ أَخَذَ ٱللَّهُ مِيثَٰقَ ٱلنَّبِيِّۦنَ لَمَآ ءَاتَيْتُكُم مِّن كِتَٰبٍ وَحِكْمَةٍ ثُمَّ جَآءَكُمْ رَسُولٌ مُّصَدِّقٌ لِّمَا مَعَكُمْ لَتُؤْمِنُنَّ بِهِۦ وَلَتَنصُرُنَّهُۥ',
        translation: 'GOD took a covenant from the prophets: "I will give you the scripture and wisdom. Afterwards, a messenger will come to confirm all existing scriptures. You shall believe in him and support him."',
        editions: ['1992 Primary', '1989 Edition', '1981 Edition'],
    },
    {
        ref: '72:18',
        sura: 'Sura 72 · The Jinn',
        arabic: 'وَأَنَّ ٱلْمَسَٰجِدَ لِلَّهِ فَلَا تَدْعُوا۟ مَعَ ٱللَّهِ أَحَدًا',
        translation: 'The places of worship belong to GOD; do not call on anyone else beside GOD.',
        editions: ['1992 Primary', '1989 Edition', '1981 Edition'],
    },
] as const;

export function QuranEditionsVisual() {
    const [selectedVerseIndex, setSelectedVerseIndex] = useState(0);
    const [activeEditionIndex, setActiveEditionIndex] = useState(0);
    const activeVerse = SAMPLE_VERSES[selectedVerseIndex];

    return (
        <div className="lift-card relative overflow-hidden rounded-none border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
            />

            {/* Header bar */}
            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-ed-rule bg-ed-bg text-ed-accent">
                        <BookMarked className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                            Verse study
                        </p>
                        <p className="mt-1 text-sm text-ed-fg">{activeVerse.sura}</p>
                    </div>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-ed-accent">
                    [{activeVerse.ref}]
                </span>
            </div>

            <div className="px-4 py-6 sm:px-6 sm:py-8">
                {/* Verse Selector Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {SAMPLE_VERSES.map((v, index) => (
                            <button
                                key={v.ref}
                                type="button"
                                onClick={() => setSelectedVerseIndex(index)}
                                className={`inline-flex min-h-8 items-center border px-3 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                                    index === selectedVerseIndex
                                        ? 'border-ed-accent bg-ed-accent/12 text-ed-accent'
                                        : 'border-ed-rule text-ed-fg-muted hover:border-ed-accent/50 hover:text-ed-fg'
                                }`}
                            >
                                {v.ref}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1">
                        {activeVerse.editions.map((ed, index) => (
                            <button
                                key={ed}
                                type="button"
                                onClick={() => setActiveEditionIndex(index)}
                                className={`inline-flex min-h-7 items-center border px-2.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.06em] transition-colors ${
                                    index === activeEditionIndex
                                        ? 'border-ed-accent/40 bg-ed-accent/10 text-ed-accent'
                                        : 'border-ed-rule text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                {ed}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Verse Display Panel */}
                <div className="relative mt-4 overflow-hidden rounded-none border border-ed-rule bg-ed-bg px-5 py-7 sm:px-7">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_50%_0%,color-mix(in_oklch,var(--ed-gold)_12%,transparent),transparent_60%)]"
                    />
                    <p
                        dir="rtl"
                        lang="ar"
                        className="relative text-center font-arabic text-[clamp(1.7rem,3.8vw,2.4rem)] leading-[2] text-ed-fg"
                    >
                        <span aria-hidden="true" className="mx-2 text-[0.6em] text-ed-accent">﴿</span>
                        {activeVerse.arabic}
                        <span aria-hidden="true" className="mx-2 text-[0.6em] text-ed-accent">﴾</span>
                    </p>

                    <div className="relative mt-6 flex gap-4 border-t border-ed-rule/60 pt-5">
                        <span
                            aria-hidden="true"
                            className="w-[3px] shrink-0 rounded-none bg-gradient-to-b from-ed-accent to-ed-accent-soft"
                        />
                        <div>
                            <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-ed-accent">
                                Translation ({activeVerse.editions[activeEditionIndex]})
                            </p>
                            <p className="mt-1 font-display text-base leading-8 text-ed-fg sm:text-lg">
                                {activeVerse.translation}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mt-5 max-w-[52ch] text-xs leading-6 text-ed-fg-muted">
                    Every verse carries its Arabic text, three English editions, and the subtitles and footnotes recorded by Dr. Rashad Khalifa.
                </p>
            </div>

            {/* Footer bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-3 sm:px-5">
                <CtaLink href={`/quran/${activeVerse.ref.split(':')[0]}`} label={`Read ${activeVerse.sura}`} />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    114 suras · 3 editions
                </span>
            </div>
        </div>
    );
}
