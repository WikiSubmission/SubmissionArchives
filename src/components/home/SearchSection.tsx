'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, X } from 'lucide-react';
import { Reveal } from './Reveal';
import { GlassSheen, widgetCardClass } from './WidgetAccents';

type CorpusFilter = 'all' | 'audio' | 'video' | 'books' | 'scripture';

interface SearchResultItem {
    id: string;
    corpus: 'audio' | 'video' | 'books' | 'scripture';
    corpusLabel: string;
    title: string;
    targetLocation: string;
    highlight: string;
    href: string;
}

const PRESET_QUERIES: Record<string, { query: string; label: string; results: SearchResultItem[] }> = {
    god_alone: {
        query: 'God alone',
        label: '"God alone"',
        results: [
            {
                id: 'res-1',
                corpus: 'audio',
                corpusLabel: 'Audio Master Tape',
                title: 'QS-01: Sura 72–73 Jinns and Night Prayer',
                targetLocation: 'Timestamp 04:22',
                highlight: 'The places of worship belong to <mark class="bg-[#C8794A]/25 text-[#F5F0EB] px-1 rounded">God alone</mark>; do not call on anyone else beside God.',
                href: '/audios/quran-studies/01-quran-study',
            },
            {
                id: 'res-2',
                corpus: 'scripture',
                corpusLabel: 'Qur\'an Verse',
                title: 'Sura 39: The Groups (Az-Zumar) · Verse 45',
                targetLocation: 'Verse 39:45',
                highlight: 'When <mark class="bg-[#C8794A]/25 text-[#F5F0EB] px-1 rounded">God alone</mark> is mentioned, the hearts of those who do not believe in the Hereafter shrink with aversion.',
                href: '/scripture/quran',
            },
            {
                id: 'res-3',
                corpus: 'books',
                corpusLabel: 'Published Book',
                title: 'Quran, Hadith, and Islam (1982)',
                targetLocation: 'Chapter 1 · Page 12',
                highlight: 'True Submission is absolute devotion to <mark class="bg-[#C8794A]/25 text-[#F5F0EB] px-1 rounded">God alone</mark>, without idols, saints, or fabricated human traditions.',
                href: '/written',
            },
            {
                id: 'res-4',
                corpus: 'video',
                corpusLabel: 'Video Lecture',
                title: 'What is Life All About?',
                targetLocation: 'Chapter Marker 39:10',
                highlight: 'One God, one message across all eras uniting Abraham, Moses, Jesus, and Muhammad in devotion to <mark class="bg-[#C8794A]/25 text-[#F5F0EB] px-1 rounded">God alone</mark>.',
                href: '/videos',
            },
        ],
    },
    mathematical_miracle: {
        query: 'mathematical miracle 19',
        label: 'mathematical miracle 19',
        results: [
            {
                id: 'res-5',
                corpus: 'video',
                corpusLabel: 'Instructional Video',
                title: 'The Great Debate: Dr. Rashad Khalifa vs Dr. Abdel Rahman',
                targetLocation: 'Chapter Marker 55:30',
                highlight: 'The 19-based letter counts in the initialed Surahs provide a <mark class="bg-[#C8794A]/25 text-[#F5F0EB] px-1 rounded">mathematical miracle</mark> impossible to imitate.',
                href: '/videos',
            },
            {
                id: 'res-6',
                corpus: 'books',
                corpusLabel: 'Deluxe Testament',
                title: 'Quran: The Final Testament · Appendix 1',
                targetLocation: 'Appendix 1 · Page 540',
                highlight: 'Physical facts and interlocking counts confirming the divine origin of the text: "Over it is nineteen" (74:30).',
                href: '/written',
            },
            {
                id: 'res-7',
                corpus: 'scripture',
                corpusLabel: 'Qur\'an Verse',
                title: 'Sura 74: The Hidden Secret · Verse 30–31',
                targetLocation: 'Verse 74:30',
                highlight: 'Over it is nineteen. We appointed angels to be guardians of Hell, and we assigned their number to disturb the disbelievers...',
                href: '/scripture/quran',
            },
        ],
    },
    covenant_prophets: {
        query: 'covenant of the prophets 3:81',
        label: 'covenant of the prophets',
        results: [
            {
                id: 'res-8',
                corpus: 'scripture',
                corpusLabel: 'Qur\'an Verse',
                title: 'Sura 3: The Family of Imran (Al-Imran) · Verse 81',
                targetLocation: 'Verse 3:81',
                highlight: 'God took a <mark class="bg-[#C8794A]/25 text-[#F5F0EB] px-1 rounded">covenant from the prophets</mark>: "I have given you the scripture and wisdom. Afterwards, a messenger will come to confirm..."',
                href: '/scripture/quran',
            },
            {
                id: 'res-9',
                corpus: 'books',
                corpusLabel: 'Deluxe Testament',
                title: 'Quran: The Final Testament · Appendix 2',
                targetLocation: 'Appendix 2 · Page 558',
                highlight: 'God\'s Messenger of the Covenant prophesied in Malachi 3:1, Luke 17:22, and Qur\'an 3:81.',
                href: '/written',
            },
        ],
    },
    contact_prayers: {
        query: 'contact prayers salat',
        label: 'contact prayers salat',
        results: [
            {
                id: 'res-10',
                corpus: 'video',
                corpusLabel: 'Video Lecture',
                title: 'What is Life All About?',
                targetLocation: 'Chapter Marker 26:45',
                highlight: 'Instruction and theological basis for the five daily <mark class="bg-[#C8794A]/25 text-[#F5F0EB] px-1 rounded">contact prayers (Salat)</mark> preserved since Abraham.',
                href: '/videos',
            },
            {
                id: 'res-11',
                corpus: 'audio',
                corpusLabel: 'Messenger Audio',
                title: 'Devotion to God Alone — The Great Commandment',
                targetLocation: 'Timestamp 15:35',
                highlight: 'Salat is our direct communication line with God, practiced five times daily to nourish our souls.',
                href: '/audios/messenger-audio/submission-the-religion-of-abraham',
            },
        ],
    },
};

const PRESET_KEYS = ['god_alone', 'mathematical_miracle', 'covenant_prophets', 'contact_prayers'];

const SEARCH_HIGHLIGHTS = [
    {
        title: 'Unified Cross-Corpus Index',
        description: 'Search across 600+ audio tapes, 300+ videos, 74 publications, and 5 scripture canons simultaneously.',
    },
    {
        title: 'Direct Second & Page Jumps',
        description: 'Results jump straight to the exact second in audio or exact facsimile page in books for instant verification.',
    },
    {
        title: 'Boolean & Exact Syntax',
        description: 'Support for exact phrases, boolean operators, author filters, and verse references.',
    },
];

export function SearchSection() {
    const [selectedPresetKey, setSelectedPresetKey] = useState<string>('god_alone');
    const [activeCorpusFilter, setActiveCorpusFilter] = useState<CorpusFilter>('all');
    const [customQuery, setCustomQuery] = useState<string>('God alone');
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const activePreset = PRESET_QUERIES[selectedPresetKey] ?? PRESET_QUERIES.god_alone;

    // Automatic cycling through search presets every 7 seconds
    useEffect(() => {
        if (isHovered) return;

        const interval = setInterval(() => {
            setSelectedPresetKey((prevKey) => {
                const currentIndex = PRESET_KEYS.indexOf(prevKey);
                const nextIndex = (currentIndex + 1) % PRESET_KEYS.length;
                const nextKey = PRESET_KEYS[nextIndex];
                setCustomQuery(PRESET_QUERIES[nextKey].label);
                return nextKey;
            });
        }, 7000);

        return () => clearInterval(interval);
    }, [isHovered]);

    const filteredResults = activePreset.results.filter(
        (item) => activeCorpusFilter === 'all' || item.corpus === activeCorpusFilter
    );

    return (
        <article
            className="space-y-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header & Description */}
            <div>
                <Reveal>
                    <h2 className="font-serif text-[clamp(1.85rem,3.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]">
                        Universal Search Engine
                    </h2>
                </Reveal>
                <Reveal delay={80}>
                    <p
                        className="mt-3 max-w-3xl text-base leading-[1.65] text-[#9E9690] sm:text-lg"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Query across all recorded sermons, conference talks, newsletter issues, books, appendices, and scripture verses simultaneously with instant direct jump links.
                    </p>
                </Reveal>
                <div className="mt-4 h-[2px] w-20 bg-[#C8794A]" />
            </div>

            {/* Omnisearch Command Console */}
            <Reveal delay={120}>
                <div className={widgetCardClass}>
                    <GlassSheen />

                    {/* Search Bar Header */}
                    <div className="border-b border-[#2A2928] bg-[#161514] p-4 sm:p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6560]" />
                                <input
                                    type="text"
                                    value={customQuery}
                                    onChange={(e) => setCustomQuery(e.target.value)}
                                    placeholder="Search transcripts, perspectives, appendices..."
                                    className="w-full rounded-[4px] border border-[#2A2928] bg-[#0E0D0C] py-2.5 pl-10 pr-10 font-sans text-sm text-[#F5F0EB] placeholder:text-[#6B6560] focus:border-[#C8794A] focus:outline-none focus:ring-1 focus:ring-[#C8794A]"
                                />
                                {customQuery ? (
                                    <button
                                        type="button"
                                        onClick={() => setCustomQuery('')}
                                        aria-label="Clear search query"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6560] hover:text-[#F5F0EB]"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-2 sm:shrink-0">
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center rounded-[4px] bg-[#C8794A] px-4 py-2.5 font-sans text-xs font-bold text-[#0F0E0D] transition-all hover:bg-[#D9916A]"
                                >
                                    Search
                                </button>
                                <span className="hidden sm:inline-flex items-center gap-1 rounded-[4px] border border-[#2A2928] bg-[#161514] px-2 py-2.5 font-sans text-xs text-[#6B6560]">
                                    Ctrl + K
                                </span>
                            </div>
                        </div>

                        {/* Interactive Query Playground Pills */}
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <span className="font-sans text-xs font-semibold text-[#6B6560] mr-1">
                                Try Research Queries:
                            </span>
                            {PRESET_KEYS.map((key) => {
                                const preset = PRESET_QUERIES[key];
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => {
                                            setSelectedPresetKey(key);
                                            setCustomQuery(preset.label);
                                        }}
                                        className={`rounded-md px-3 py-1 font-sans text-xs transition-all ${
                                            selectedPresetKey === key
                                                ? 'border border-[#C8794A] bg-[#C8794A]/20 text-[#F5F0EB] font-bold shadow-sm'
                                                : 'border border-[#2A2928] bg-[#121110] text-[#9E9690] hover:text-[#F5F0EB]'
                                        }`}
                                    >
                                        {preset.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Filter Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2928] bg-[#121110] px-4 py-2.5 sm:px-6">
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-sans text-xs font-semibold text-[#6B6560] mr-1">Filter:</span>
                            {(
                                [
                                    { id: 'all', label: 'All Corpi' },
                                    { id: 'audio', label: 'Audio' },
                                    { id: 'video', label: 'Video' },
                                    { id: 'books', label: 'Written Books' },
                                    { id: 'scripture', label: 'Scriptures' },
                                ] as const
                            ).map((filter) => (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => setActiveCorpusFilter(filter.id)}
                                    className={`rounded px-2.5 py-0.5 font-sans text-xs transition-colors ${
                                        activeCorpusFilter === filter.id
                                            ? 'bg-[#C8794A]/20 text-[#C8794A] font-bold border border-[#C8794A]/40'
                                            : 'text-[#6B6560] hover:text-[#9E9690]'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <span className="font-sans text-xs text-[#6B6560]">
                            Showing {filteredResults.length} Verified Citations
                        </span>
                    </div>

                    {/* Search Results Deck */}
                    <div className="space-y-3 bg-[#0E0D0C] p-3 sm:p-4">
                        {filteredResults.map((result, idx) => (
                            <div
                                key={result.id}
                                className="rounded-[12px] border border-[#2A2928] bg-[#161514] p-4 sm:p-5 transition-all duration-200 hover:border-[#353433]"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2928] pb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-[4px] border border-[#2A2928] bg-[#121110] px-2.5 py-0.5 font-mono text-[0.68rem] font-bold text-[#F5F0EB]">
                                            {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <span className="rounded-[4px] border border-[#2A2928] bg-[#161514] px-3 py-0.5 font-sans text-[0.68rem] font-bold text-[#9E9690]">
                                            {result.corpusLabel}
                                        </span>
                                    </div>
                                    <span className="font-sans text-xs font-semibold text-[#C8794A]">
                                        [{result.targetLocation}]
                                    </span>
                                </div>

                                <Link href={result.href} className="group block pt-3">
                                    <h4 className="font-serif text-lg font-semibold leading-snug text-[#F5F0EB] transition-colors group-hover:text-[#D9916A] sm:text-xl">
                                        {result.title}
                                    </h4>
                                </Link>

                                <Link
                                    href={result.href}
                                    className="group mt-3 block rounded-[8px] border border-[#2A2928] bg-[#0E0D0C] p-4 transition hover:border-[#353433]"
                                >
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <span className="font-sans text-[0.68rem] font-bold uppercase tracking-widest text-[#6B6560]">
                                            Best Matching Passage
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#C8794A] px-3 py-1 font-sans text-xs font-bold text-[#0F0E0D] transition-transform group-hover:translate-x-0.5">
                                            Direct Jump
                                            <ArrowRight className="h-3 w-3" />
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="select-none font-serif text-2xl leading-none text-[#4A4542]" aria-hidden="true">
                                            &ldquo;
                                        </span>
                                        <p
                                            className="text-sm leading-relaxed text-[#9E9690]"
                                            dangerouslySetInnerHTML={{ __html: result.highlight }}
                                        />
                                    </div>
                                </Link>
                            </div>
                        ))}
                    </div>

                    {/* Console Footer Callout */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2928] bg-[#161514] px-4 py-3 sm:px-6">
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-[#F5F0EB] hover:text-[#C8794A] transition-colors"
                        >
                            <span>Launch Full-Screen Universal Search Console</span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#C8794A]" />
                        </Link>
                        <span className="font-sans text-xs text-[#6B6560]">
                            Instant Multi-Corpus Evidence Retrieval
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* 3 Core Search Preservation Highlights */}
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {SEARCH_HIGHLIGHTS.map((item, idx) => (
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
