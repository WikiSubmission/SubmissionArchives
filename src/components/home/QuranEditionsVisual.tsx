'use client';

import { BookMarked } from 'lucide-react';
import { useState } from 'react';

import { CtaLink } from './SectionCta';
import { IconBadge, GlassSheen, activeChipClass, inactiveChipClass, widgetCardClass } from './WidgetAccents';

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
        <div className={widgetCardClass}>
            <GlassSheen />
            {/* Header bar */}
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-2.5 sm:px-5 bg-ed-surface/50">
                <div className="flex items-center gap-3">
                    <IconBadge>
                        <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
                    </IconBadge>
                    <div>
                        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                            Verse Study · {activeVerse.sura}
                        </p>
                    </div>
                </div>
                <span className="rounded-full border border-ed-rule bg-ed-surface/60 px-3 py-0.5 font-mono text-xs font-semibold tabular-nums text-ed-fg">
                    [{activeVerse.ref}]
                </span>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6">
                {/* Verse Selector Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                        {SAMPLE_VERSES.map((v, index) => (
                            <button
                                key={v.ref}
                                type="button"
                                onClick={() => setSelectedVerseIndex(index)}
                                className={`inline-flex min-h-7 items-center rounded-full border px-3 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                                    index === selectedVerseIndex ? activeChipClass : inactiveChipClass
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
                                className={`inline-flex min-h-6 items-center rounded-full border px-2.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.06em] transition-all duration-200 ${
                                    index === activeEditionIndex
                                        ? 'border-ed-accent/40 bg-ed-accent/10 text-ed-accent font-bold'
                                        : 'border-ed-rule/60 text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                {ed}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Verse Display Panel */}
                <div className="relative mt-2 overflow-hidden rounded-xl border border-ed-rule bg-ed-bg/90 p-5 sm:p-6 shadow-inner">
                    <p
                        dir="rtl"
                        lang="ar"
                        className="relative text-center font-arabic text-[clamp(1.7rem,3.8vw,2.4rem)] leading-[2] text-ed-fg"
                    >
                        <span aria-hidden="true" className="mx-2 text-[0.6em] text-ed-fg-muted">﴿</span>
                        {activeVerse.arabic}
                        <span aria-hidden="true" className="mx-2 text-[0.6em] text-ed-fg-muted">﴾</span>
                    </p>

                    <div className="relative mt-5 flex gap-4 border-t border-ed-rule/60 pt-4">
                        <span
                            aria-hidden="true"
                            className="w-1 shrink-0 rounded-full bg-ed-fg"
                        />
                        <div>
                            <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                Translation ({activeVerse.editions[activeEditionIndex]})
                            </p>
                            <p className="mt-1 font-sans text-sm font-semibold leading-7 text-ed-fg sm:text-base">
                                {activeVerse.translation}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mt-4 max-w-[52ch] font-sans text-xs leading-5 text-ed-fg-muted">
                    Every verse carries its Arabic text, English translation, subtitles, and footnotes recorded by Dr. Rashad Khalifa.
                </p>
            </div>

            {/* Footer bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-3 sm:px-5 bg-ed-surface/50">
                <CtaLink href={`/quran/${activeVerse.ref.split(':')[0]}`} label={`Read ${activeVerse.sura}`} />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    114 suras
                </span>
            </div>
        </div>
    );
}
