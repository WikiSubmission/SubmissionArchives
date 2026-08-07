'use client';

import { useEffect, useState } from 'react';

import { CtaLink } from './SectionCta';
import { GlassSheen, activeChipClass, inactiveChipClass, widgetCardClass } from './WidgetAccents';

type ScriptureVerse = {
    id: string;
    canon: string;
    reference: string;
    original: string;
    lang: 'he' | 'grc' | 'ar';
    dir: 'ltr' | 'rtl';
    translation: string;
    stat: string;
    href: string;
    cta: string;
};

const SCRIPTURE_VERSES: ScriptureVerse[] = [
    {
        id: 'old-testament',
        canon: 'Old Testament',
        reference: 'Deuteronomy 6:4',
        original: 'שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד',
        lang: 'he',
        dir: 'rtl',
        translation: 'Hear, Israel: The LORD is our God. The LORD is one.',
        stat: '39 books',
        href: '/scriptures/old-testament',
        cta: 'Read the Old Testament',
    },
    {
        id: 'new-testament',
        canon: 'New Testament',
        reference: 'Mark 12:29',
        original: 'Ἄκουε, Ἰσραήλ, κύριος ὁ θεὸς ἡμῶν κύριος εἷς ἐστιν',
        lang: 'grc',
        dir: 'ltr',
        translation:
            'Jesus answered, "The greatest [commandment] is: \u2018Hear, Israel, the Lord our God, the Lord is one.\u2019"',
        stat: '27 books',
        href: '/scriptures/new-testament',
        cta: 'Read the New Testament',
    },
    {
        id: 'quran',
        canon: "Qur'an",
        reference: "Qur'an 112:1",
        original: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        lang: 'ar',
        dir: 'rtl',
        translation: 'Proclaim, "He is the One and only GOD."',
        stat: '114 suras',
        href: '/scriptures/quran',
        cta: "Read the Qur'an",
    },
];

const ROTATE_MS = 7000;

export function ScripturesVisual() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    const [fill, setFill] = useState(false);
    const active = SCRIPTURE_VERSES[activeIndex];

    // Advance to the next verse on a timer.
    useEffect(() => {
        if (paused) return;
        const id = setTimeout(() => {
            setActiveIndex((i) => (i + 1) % SCRIPTURE_VERSES.length);
        }, ROTATE_MS);
        return () => clearTimeout(id);
    }, [activeIndex, paused]);

    // Restart the progress rail whenever the slide or pause state changes.
    useEffect(() => {
        let secondFrame: number;
        const firstFrame = requestAnimationFrame(() => {
            setFill(false);
            secondFrame = requestAnimationFrame(() => setFill(true));
        });
        return () => {
            cancelAnimationFrame(firstFrame);
            cancelAnimationFrame(secondFrame);
        };
    }, [activeIndex, paused]);

    return (
        <div
            className={widgetCardClass}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            <GlassSheen />

            {/* Header bar */}
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-2.5 sm:px-5 bg-ed-surface/50">
                <div>
                    <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                        Scripture Study · One God, Three Witnesses
                    </p>
                </div>
                <span className="rounded-full border border-ed-rule bg-ed-surface/60 px-3 py-0.5 font-mono text-xs font-semibold text-ed-fg">
                    [{active.reference}]
                </span>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6">
                {/* Canon tabs */}
                <div className="flex flex-wrap items-center gap-1.5 pb-3">
                    {SCRIPTURE_VERSES.map((verse, index) => (
                        <button
                            key={verse.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            aria-current={index === activeIndex}
                            className={`inline-flex min-h-7 items-center rounded-full border px-3 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ${index === activeIndex ? activeChipClass : inactiveChipClass
                                }`}
                        >
                            {verse.canon}
                        </button>
                    ))}
                </div>

                {/* Progress rail — one segment per verse, filling while it is on screen */}
                <div className="mb-4 grid grid-cols-3 gap-1.5" aria-hidden="true">
                    {SCRIPTURE_VERSES.map((verse, index) => (
                        <span key={verse.id} className="h-[2px] overflow-hidden rounded-full bg-ed-rule">
                            <span
                                className="block h-full bg-ed-fg"
                                style={
                                    index < activeIndex
                                        ? { width: '100%' }
                                        : index === activeIndex
                                            ? paused
                                                ? { width: '100%', transitionDuration: '0ms' }
                                                : {
                                                    width: fill ? '100%' : '0%',
                                                    transitionProperty: 'width',
                                                    transitionTimingFunction: 'linear',
                                                    transitionDuration: fill ? `${ROTATE_MS}ms` : '0ms',
                                                }
                                            : { width: '0%' }
                                }
                            />
                        </span>
                    ))}
                </div>

                {/* Verse Display Panel */}
                <div
                    className="relative overflow-hidden rounded-xl border border-ed-rule bg-ed-bg/90 p-5 shadow-inner sm:p-6"
                    aria-live="polite"
                >
                    <p
                        key={active.id}
                        dir={active.dir}
                        lang={active.lang}
                        className={`relative text-center leading-[1.9] text-ed-fg text-[clamp(1.1rem,2.8vw,1.5rem)] ${active.lang === 'ar' ? 'font-arabic text-[clamp(1.5rem,3.4vw,2rem)]' : ''
                            }`}
                    >
                        {active.lang === 'ar' && (
                            <span aria-hidden="true" className="mx-2 text-[0.6em] text-ed-fg-muted">
                                ﴿
                            </span>
                        )}
                        {active.original}
                        {active.lang === 'ar' && (
                            <span aria-hidden="true" className="mx-2 text-[0.6em] text-ed-fg-muted">
                                ﴾
                            </span>
                        )}
                    </p>

                    <div className="relative mt-5 flex gap-4 border-t border-ed-rule/60 pt-4">
                        <span aria-hidden="true" className="w-1 shrink-0 rounded-full bg-ed-fg" />
                        <div>
                            <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                {active.canon} · {active.reference}
                            </p>
                            <p className="mt-1 font-sans text-sm font-semibold leading-7 text-ed-fg sm:text-base">
                                {active.translation}
                            </p>
                        </div>
                    </div>
                </div>

                <p className="mt-7 max-w-[52ch] font-sans text-xs leading-5 text-ed-fg-muted">
                    The same declaration of God&apos;s oneness, recorded across the Torah, the Gospel, and the
                    Qur&apos;an.
                </p>
            </div>

            {/* Footer bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-3 sm:px-5 bg-ed-surface/50">
                <CtaLink href={active.href} label={active.cta} />
                <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    {active.stat}
                </span>
            </div>
        </div>
    );
}
