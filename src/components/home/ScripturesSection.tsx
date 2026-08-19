'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { GlassSheen, widgetCardClass } from './WidgetAccents';

type CanonId = 'quran' | 'appendices' | 'ot' | 'apocrypha' | 'nt';
type ReadingMode = 'bilingual' | 'reading' | 'study';

interface ScriptureVerseSample {
    canonId: CanonId;
    canonLabel: string;
    bookTitle: string;
    reference: string;
    originalScript?: string;
    originalLang?: string;
    transliteration?: string;
    translation: string;
    footnote?: string;
    morphologyNotes?: string;
    href: string;
}

const CANON_SAMPLES: Record<CanonId, ScriptureVerseSample> = {
    quran: {
        canonId: 'quran',
        canonLabel: 'The Final Testament',
        bookTitle: 'Sura 72: The Jinns (Al-Jinn)',
        reference: 'Qur\'an 72:18',
        originalLang: 'Arabic',
        originalScript: 'وَأَنَّ الْمَسَاجِدَ لِلَّهِ فَلَا تَدْعُوا مَعَ اللَّهِ أَحَدًا',
        transliteration: 'Wa anna al-masajida lillahi fala tad\'oo ma\'a Allahi ahada.',
        translation: 'The places of worship belong to God alone; therefore, do not call on anyone else beside God.',
        footnote: 'A fundamental commandment emphasizing pure monotheism without any human or saintly intermediaries.',
        morphologyNotes: 'Root: س-ج-د (S-J-D: prostration/worship) · لِلَّهِ (Lillahi: exclusively belonging to God).',
        href: '/scripture/quran',
    },
    appendices: {
        canonId: 'appendices',
        canonLabel: '38 Appendices',
        bookTitle: 'Appendix 1: One of the Great Miracles',
        reference: 'Appendix 1 · Sura 74:30–35',
        originalLang: 'Mathematical Proof',
        originalScript: 'عَلَيْهَا تِسْعَةَ عَشَرَ',
        transliteration: '\'Alayha tis\'ata \'ashar (Over it is nineteen).',
        translation: 'The Quran is characterized by a unique mathematical structure based on the prime number 19, proving its divine authorship and complete preservation.',
        footnote: 'First discovered in 1974 by Dr. Rashad Khalifa, fulfilling the prophecy of Sura 74:30.',
        morphologyNotes: 'System includes 114 (19×6) Surahs, 6346 (19×334) verses, and 29 initialed Surahs with exact letter multiples of 19.',
        href: '/scripture/quran',
    },
    ot: {
        canonId: 'ot',
        canonLabel: 'Old Testament (Tanakh)',
        bookTitle: 'Deuteronomy (Devarim)',
        reference: 'Deuteronomy 6:4',
        originalLang: 'Biblical Hebrew',
        originalScript: 'שְׁמַע יִשְׂרָאֵל יְהוָה אֱלֹהֵינוּ יְהוָה אֶחָד',
        transliteration: 'Shema Yisrael, Adonai Eloheinu, Adonai Echad.',
        translation: 'Hear, O Israel: The Lord our God, the Lord is One.',
        footnote: 'The foundational declaration of faith (the Shema) commanded to Abraham and Moses.',
        morphologyNotes: 'Root: אֶחָד (Echad: absolute solitary oneness / indivisible singularity).',
        href: '/scripture/bible',
    },
    apocrypha: {
        canonId: 'apocrypha',
        canonLabel: 'OT Apocrypha',
        bookTitle: 'Wisdom of Solomon',
        reference: 'Wisdom 12:13',
        originalLang: 'Ancient Greek',
        originalScript: 'Οὔτε γὰρ ἔστιν θεὸς πλὴν σοῦ, ᾧ μέλει περὶ πάντων',
        transliteration: 'Oute gar estin theos plen sou, ho melei peri panton.',
        translation: 'For neither is there any God but You that cares for all, to whom You might show that Your judgment is not unrighteous.',
        footnote: 'Preserved historical deuterocanonical text reaffirming universal divine monotheism.',
        morphologyNotes: 'πλὴν σοῦ (Plen sou: except You alone / none beside You).',
        href: '/scripture/apocrypha',
    },
    nt: {
        canonId: 'nt',
        canonLabel: 'New Testament',
        bookTitle: 'The Gospel of Mark',
        reference: 'Mark 12:29',
        originalLang: 'Koine Greek',
        originalScript: 'Ἄκουε, Ἰσραήλ, Κύριος ὁ θεὸς ἡμῶν Κύριος εἷς ἐστιν',
        transliteration: 'Akoue, Israel, Kyrios ho theos hemon Kyrios heis estin.',
        translation: 'Jesus answered: "The first of all commandments is: Hear, O Israel; The Lord our God is one Lord."',
        footnote: 'Jesus confirms the eternal continuity of the First Commandment without alteration.',
        morphologyNotes: 'εἷς (Heis: masculine nominative singular for One).',
        href: '/scripture/bible',
    },
};

const CANON_LIST: { id: CanonId; label: string }[] = [
    { id: 'quran', label: 'The Final Testament (Qur\'an)' },
    { id: 'appendices', label: '38 Appendices' },
    { id: 'ot', label: 'Old Testament (39 Books)' },
    { id: 'apocrypha', label: 'OT Apocrypha (15 Books)' },
    { id: 'nt', label: 'New Testament (27 Books)' },
];

const SCRIPTURE_HIGHLIGHTS = [
    {
        title: '5 Canonical Collections',
        description: 'The Qur\'an (114 Surahs), 38 Appendices, Old Testament (39 books), Apocrypha (15 books), and New Testament (27 books).',
    },
    {
        title: 'Parallel Multilingual Study',
        description: 'Original Arabic, Hebrew, and Greek script paired with verbatim transliteration and verified English translations.',
    },
    {
        title: 'Tri-Mode Academic Reader',
        description: 'Toggle instantly between continuous reading flow, side-by-side bilingual study, and morphological root breakdown.',
    },
];

export function ScripturesSection() {
    const [activeCanon, setActiveCanon] = useState<CanonId>('quran');
    const [readingMode, setReadingMode] = useState<ReadingMode>('bilingual');
    const [copied, setCopied] = useState<boolean>(false);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const activeSample = CANON_SAMPLES[activeCanon];

    // Automatic cycling through scripture canons every 7 seconds
    useEffect(() => {
        if (isHovered) return;

        const interval = setInterval(() => {
            setActiveCanon((prevCanon) => {
                const currentIndex = CANON_LIST.findIndex((c) => c.id === prevCanon);
                const nextIndex = (currentIndex + 1) % CANON_LIST.length;
                return CANON_LIST[nextIndex].id;
            });
        }, 7000);

        return () => clearInterval(interval);
    }, [isHovered]);

    const copyCitation = () => {
        const textToCopy = `"${activeSample.translation}" — [${activeSample.reference}]`;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <article
            className="space-y-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header & Description */}
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                <Reveal>
                    <div>
                        <h2 className="font-serif text-[clamp(1.85rem,3.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]">
                            Scriptures & Appendices Vault
                        </h2>
                        <div className="mt-2 h-[2px] w-20 bg-[#C8794A]" />
                    </div>
                </Reveal>
                <Reveal delay={80}>
                    <p
                        className="text-base leading-[1.65] text-[#9E9690] sm:text-lg"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        The Qur&apos;an (114 Surahs with Arabic, English, Transliteration, Footnotes & 3 View Modes), 38 Appendices, Old Testament, Apocrypha, and New Testament presented with verse-by-verse precision.
                    </p>
                </Reveal>
            </div>

            {/* 5 Canon Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2">
                {CANON_LIST.map((canon) => (
                    <button
                        key={canon.id}
                        type="button"
                        onClick={() => setActiveCanon(canon.id)}
                        className={`rounded-lg px-4 py-1.5 font-sans text-xs font-semibold transition-all duration-200 ${
                            activeCanon === canon.id
                                ? 'border border-[#C8794A] bg-[#C8794A]/15 text-[#F5F0EB] shadow-sm'
                                : 'border border-[#2A2928] bg-[#161514] text-[#9E9690] hover:border-[#353433] hover:text-[#F5F0EB]'
                        }`}
                    >
                        {canon.label}
                    </button>
                ))}
            </div>

            {/* Academic Reading Room Workstation */}
            <Reveal delay={120}>
                <div className={widgetCardClass}>
                    <GlassSheen />

                    {/* Window Header Bar */}
                    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-[#2A2928] bg-[#161514] px-4 py-3 sm:px-6 select-none">
                        <div className="flex items-center gap-3">
                            <span className="font-sans text-xs font-semibold text-[#C8794A]">
                                {activeSample.canonLabel}
                            </span>
                            <span className="text-[#6B6560]" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-[#F5F0EB]">
                                {activeSample.bookTitle}
                            </span>
                        </div>

                        {/* Tri-Mode Reader View Toggles */}
                        <div className="flex items-center gap-1 rounded-lg border border-[#2A2928] bg-[#121110] p-1">
                            <button
                                type="button"
                                onClick={() => setReadingMode('reading')}
                                className={`rounded px-3 py-1 font-sans text-xs font-medium transition-colors ${
                                    readingMode === 'reading'
                                        ? 'bg-[#C8794A] text-[#0F0E0D] font-semibold'
                                        : 'text-[#9E9690] hover:text-[#F5F0EB]'
                                }`}
                            >
                                Reading View
                            </button>
                            <button
                                type="button"
                                onClick={() => setReadingMode('bilingual')}
                                className={`rounded px-3 py-1 font-sans text-xs font-medium transition-colors ${
                                    readingMode === 'bilingual'
                                        ? 'bg-[#C8794A] text-[#0F0E0D] font-semibold'
                                        : 'text-[#9E9690] hover:text-[#F5F0EB]'
                                }`}
                            >
                                Bilingual Parallel
                            </button>
                            <button
                                type="button"
                                onClick={() => setReadingMode('study')}
                                className={`rounded px-3 py-1 font-sans text-xs font-medium transition-colors ${
                                    readingMode === 'study'
                                        ? 'bg-[#C8794A] text-[#0F0E0D] font-semibold'
                                        : 'text-[#9E9690] hover:text-[#F5F0EB]'
                                }`}
                            >
                                Focus Study
                            </button>
                        </div>
                    </div>

                    {/* Workstation Verse Chamber */}
                    <div className="p-6 sm:p-10 bg-[#121110]">
                        {/* Reference Badge & Copy Action */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#2A2928]">
                            <div className="flex items-center gap-2">
                                <span className="font-sans text-xs font-semibold text-[#C8794A]">
                                    [{activeSample.reference}]
                                </span>
                                <span className="text-[#6B6560]" aria-hidden="true">·</span>
                                <span className="font-sans text-xs text-[#9E9690]">
                                    Language: {activeSample.originalLang}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={copyCitation}
                                className="inline-flex items-center rounded-md border border-[#2A2928] bg-[#161514] px-3 py-1 font-sans text-xs text-[#9E9690] hover:border-[#C8794A] hover:text-[#F5F0EB] transition-colors"
                            >
                                {copied ? 'Citation Copied' : 'Copy Verse Citation'}
                            </button>
                        </div>

                        {/* Dynamic Mode Rendering */}
                        <div className="mt-8 space-y-6">
                            {/* Original Script (if in bilingual or study mode) */}
                            {readingMode !== 'reading' && activeSample.originalScript && (
                                <div className="rounded-xl border border-[#2A2928] bg-[#0E0D0C] p-6 text-center">
                                    <span className="block font-sans text-xs font-semibold text-[#C8794A] mb-3">
                                        {activeSample.originalLang} Text
                                    </span>
                                    <p
                                        className="text-2xl sm:text-3xl lg:text-4xl text-[#F5F0EB] leading-relaxed select-text"
                                        style={{
                                            fontFamily: activeSample.canonId === 'quran' || activeSample.canonId === 'appendices'
                                                ? 'var(--font-amiri), serif'
                                                : 'var(--font-serif), Georgia, serif',
                                            direction: activeSample.canonId === 'quran' || activeSample.canonId === 'appendices' || activeSample.canonId === 'ot'
                                                ? 'rtl'
                                                : 'ltr',
                                        }}
                                    >
                                        {activeSample.originalScript}
                                    </p>
                                    {activeSample.transliteration && (
                                        <p className="mt-3 font-serif text-sm italic text-[#9E9690] sm:text-base">
                                            {activeSample.transliteration}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* English Authorized Translation */}
                            <div className="rounded-xl border border-[#2A2928] bg-[#161514] p-6 sm:p-8">
                                <span className="block font-sans text-xs font-semibold text-[#C8794A] mb-2">
                                    Authorized English Translation
                                </span>
                                <p
                                    className="text-lg sm:text-xl lg:text-2xl font-serif italic leading-relaxed text-[#F5F0EB]"
                                >
                                    &ldquo;{activeSample.translation}&rdquo;
                                </p>

                                {activeSample.footnote && (
                                    <div className="mt-4 pt-4 border-t border-[#2A2928]">
                                        <p className="text-xs sm:text-sm text-[#9E9690] leading-relaxed" style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}>
                                            {activeSample.footnote}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Focus Study Breakdown (in study mode) */}
                            {readingMode === 'study' && activeSample.morphologyNotes && (
                                <div className="rounded-xl border border-[#C8794A]/30 bg-[#C8794A]/5 p-5">
                                    <span className="block font-sans text-xs font-semibold text-[#C8794A] mb-2">
                                        Scholarly Cross-Reference & Morphological Root Analysis
                                    </span>
                                    <p className="font-sans text-xs text-[#F5F0EB] leading-relaxed">
                                        {activeSample.morphologyNotes}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Launch Full Reader Button */}
                        <div className="mt-8">
                            <Link
                                href={activeSample.href}
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C8794A] bg-[#C8794A] px-5 py-3 font-sans text-sm font-semibold text-[#0F0E0D] shadow-lg transition-all hover:bg-[#D9916A] hover:scale-[1.01]"
                            >
                                <span>Launch Scripture Reader for {activeSample.canonLabel}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Window Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2928] bg-[#161514] px-4 py-3 sm:px-6">
                        <Link
                            href="/scripture/quran"
                            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-[#F5F0EB] hover:text-[#C8794A] transition-colors"
                        >
                            <span>Open 114 Surahs, 38 Appendices & Multi-Canon Reader</span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#C8794A]" />
                        </Link>
                        <span className="font-sans text-xs text-[#6B6560]">
                            Verse-by-Verse Bilingual Engine
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* 3 Core Scripture Preservation Highlights */}
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {SCRIPTURE_HIGHLIGHTS.map((item, idx) => (
                    <Reveal key={item.title} delay={160 + idx * 80}>
                        <div className="flex h-full flex-col justify-between rounded-xl border border-[#2A2928] bg-[#161514] p-5 shadow-sm transition-all duration-200 hover:border-[#353433] hover:bg-[#1C1B1A]">
                            <div>
                                <h4 className="font-sans text-sm font-semibold text-[#F5F0EB]">
                                    {item.title}
                                </h4>
                                <p className="mt-2 text-xs leading-[1.6] text-[#9E9690]">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </article>
    );
}
