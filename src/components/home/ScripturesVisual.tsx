'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { GlassSheen, activeChipClass, inactiveChipClass, widgetCardClass } from './WidgetAccents';

type ScriptureItem = {
    id: string;
    canon: string;
    badge: string;
    reference: string;
    original: string;
    lang: 'he' | 'grc' | 'ar' | 'en';
    dir: 'ltr' | 'rtl';
    translation: string;
    stat: string;
    href: string;
    cta: string;
    tag: string;
};

const SCRIPTURE_ITEMS: ScriptureItem[] = [
    {
        id: 'quran',
        canon: "The Qur'an",
        badge: 'Final Testament',
        reference: "Sura 112:1",
        original: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
        lang: 'ar',
        dir: 'rtl',
        translation: 'Proclaim, "He is the One and only GOD."',
        stat: '114 Surahs · 6,346 Ayahs',
        href: '/scripture/quran',
        cta: "Explore 114 Surahs",
        tag: 'Arabic · Transliteration · Translation · 3 View Modes',
    },
    {
        id: 'appendices',
        canon: 'Appendices',
        badge: 'Authorized Study',
        reference: 'Appendix 1: One of the Great Miracles',
        original: 'BISMILLAH AL-RAHMAN AL-RAHIM',
        lang: 'en',
        dir: 'ltr',
        translation: 'The mathematical miracle of the Qur\'an based on the prime number 19 (74:30–35), proving divine authorship.',
        stat: '38 Appendices · 1981–1992 Editions',
        href: '/scripture/quran/appendices',
        cta: 'Browse 38 Appendices',
        tag: 'Mathematical Proofs · Historical Facsimiles · Complete Text',
    },
    {
        id: 'old-testament',
        canon: 'Old Testament',
        badge: 'Torah & Tanakh',
        reference: 'Deuteronomy 6:4',
        original: 'שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד',
        lang: 'he',
        dir: 'rtl',
        translation: 'Hear, O Israel: The LORD our God, the LORD is one.',
        stat: '39 Canonical Books',
        href: '/scripture/old-testament',
        cta: 'Read the Old Testament',
        tag: 'Hebrew & English · Chapter Index · Verse Links',
    },
    {
        id: 'ot-apocrypha',
        canon: 'OT Apocrypha',
        badge: 'Deuterocanonical',
        reference: 'Wisdom of Solomon 12:13',
        original: 'οὔτε γὰρ θεός ἐστιν πλὴν σοῦ ᾧ μέλει περὶ πάντων',
        lang: 'grc',
        dir: 'ltr',
        translation: 'For neither is there any God but Thou that carest for all, to whom Thou mightest show that Thy judgment is not unright.',
        stat: '15 Historical Writings',
        href: '/scripture/old-testament/apocrypha',
        cta: 'Explore OT Apocrypha',
        tag: 'Tobit · Judith · Wisdom · Sirach · Maccabees · Jubilees',
    },
    {
        id: 'new-testament',
        canon: 'New Testament',
        badge: 'Gospel & Epistles',
        reference: 'Mark 12:29',
        original: 'Ἄκουε, Ἰσραήλ, κύριος ὁ θεὸς ἡμῶν κύριος εἷς ἐστιν',
        lang: 'grc',
        dir: 'ltr',
        translation: 'Jesus answered, "The most important one is: Hear, O Israel: The Lord our God, the Lord is one."',
        stat: '27 Canonical Books',
        href: '/scripture/new-testament',
        cta: 'Read the New Testament',
        tag: 'Greek & English · Gospels · Epistles · Revelation',
    },
];

const ROTATE_MS = 6500;

export function ScripturesVisual() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [paused, setPaused] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });
    const [fill, setFill] = useState(false);
    const active = SCRIPTURE_ITEMS[activeIndex];

    // Advance to the next verse on a timer.
    useEffect(() => {
        if (paused) return;
        const id = setTimeout(() => {
            setActiveIndex((i) => (i + 1) % SCRIPTURE_ITEMS.length);
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

            {/* Header bar with Traffic Lights */}
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-6 bg-ed-surface-strong/40 select-none">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
                        <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
                        <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                    </div>
                    <span className="h-3.5 w-px bg-ed-rule-strong/60" aria-hidden="true" />
                    <div>
                        <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                            Scripture Study · <span className="text-ed-fg font-bold">One God, Three Witnesses</span>
                        </p>
                    </div>
                </div>
                <span className="rounded-full border border-ed-rule-strong bg-ed-surface-strong px-3 py-0.5 font-mono text-[0.65rem] font-bold uppercase tracking-wider text-ed-fg">
                    {active.badge}
                </span>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6">
                {/* 5 Canon Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 pb-3">
                    {SCRIPTURE_ITEMS.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            aria-current={index === activeIndex}
                            className={`inline-flex min-h-8 items-center rounded-full border px-3.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                                index === activeIndex ? activeChipClass : inactiveChipClass
                            }`}
                        >
                            {item.canon}
                        </button>
                    ))}
                </div>

                {/* Progress rail */}
                <div className="mb-4 grid grid-cols-5 gap-1.5" aria-hidden="true">
                    {SCRIPTURE_ITEMS.map((item, index) => (
                        <span key={item.id} className="h-[2px] overflow-hidden rounded-full bg-ed-rule">
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

                {/* Display Panel */}
                <div
                    className="relative overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/50 p-5 shadow-inner sm:p-6"
                    aria-live="polite"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <span className="font-mono text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ed-fg-muted">
                            {active.reference}
                        </span>
                        <span className="rounded-md border border-ed-rule/80 bg-ed-surface px-2 py-0.5 font-mono text-[0.6rem] font-medium text-ed-fg-muted">
                            {active.stat}
                        </span>
                    </div>

                    {active.original && (
                        <p
                            key={active.id}
                            dir={active.dir}
                            lang={active.lang}
                            className={`relative text-center leading-[1.85] text-ed-fg text-[clamp(1.15rem,2.9vw,1.6rem)] ${
                                active.lang === 'ar' ? 'font-arabic text-[clamp(1.6rem,3.6vw,2.2rem)] font-normal py-1' : 'font-serif'
                            } ${active.lang === 'he' ? 'font-serif text-[clamp(1.3rem,3.2vw,1.8rem)]' : ''}`}
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
                    )}

                    <div className="relative mt-5 flex gap-4 border-t border-ed-rule/60 pt-4">
                        <span aria-hidden="true" className="w-1 shrink-0 rounded-full bg-ed-fg" />
                        <div>
                            <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                English Translation & Meaning
                            </p>
                            <p className="mt-1 font-serif text-sm leading-7 text-ed-fg sm:text-base">
                                {active.translation}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-ed-fg-muted">
                    <span className="font-mono text-[0.65rem] tracking-tight">{active.tag}</span>
                    <span className="hidden font-mono text-[0.65rem] sm:inline">Press canon buttons to switch</span>
                </div>
            </div>

            {/* Footer bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-3 sm:px-5 bg-ed-surface/60">
                <Link
                    href={active.href}
                    className="inline-flex items-center gap-1.5 font-sans text-xs font-bold text-ed-fg hover:text-ed-accent transition-colors"
                >
                    <span>{active.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    Interactive Reader Available
                </span>
            </div>
        </div>
    );
}
