'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { GlassSheen, widgetCardClass } from './WidgetAccents';

type WrittenCategory = 'books' | 'newsletters';

interface WrittenWork {
    id: string;
    category: WrittenCategory;
    title: string;
    edition: string;
    year: string;
    pages: number;
    badge: string;
    publisher: string;
    coverSrc: string;
    facsimilePageSrc: string;
    facsimilePageNo: string;
    ocrSample: {
        heading: string;
        text: string;
        footnote?: string;
    };
    href: string;
}

const FEATURED_WRITINGS: WrittenWork[] = [
    {
        id: 'quran-visual-presentation',
        category: 'books',
        title: 'Quran: Visual Presentation of the Miracle',
        edition: 'Physical Mathematical Proofs',
        year: '1982',
        pages: 260,
        badge: 'Mathematical Miracle',
        publisher: 'Islamic Productions · Tucson',
        coverSrc: '/content/written/books/thumbnails/quran-visual-presentation.png',
        facsimilePageSrc: '/content/written/books/thumbnails/quran-visual-presentation.png',
        facsimilePageNo: 'Chapter 1',
        ocrSample: {
            heading: 'Physical Verification of Sura 74:30',
            text: 'Every Quranic initial, word count, and verse arrangement is mathematically locked to the prime number 19.\n\nVisual tables and computer-verified counts prove that no human could have authored or preserved this intricate structural composition.',
            footnote: 'Includes exhaustive letter frequency charts for all 29 initialed Surahs.',
        },
        href: '/written',
    },
    {
        id: 'quran1981',
        category: 'books',
        title: 'Quran: The Final Scripture (1981)',
        edition: 'Authorized First Edition',
        year: '1981',
        pages: 736,
        badge: 'Authorized Translation',
        publisher: 'Islamic Productions · Tucson, Arizona',
        coverSrc: '/content/written/books/thumbnails/quran1981.png',
        facsimilePageSrc: '/content/written/books/thumbnails/quran1981.png',
        facsimilePageNo: 'Page 1',
        ocrSample: {
            heading: 'Sura 1: The Key (Al-Fãtehah)',
            text: '1. In the name of God, Most Gracious, Most Merciful.\n2. Praise be to God, Lord of the universe.\n3. Most Gracious, Most Merciful.\n4. Master of the Day of Judgment.\n5. You alone we worship; You alone we ask for help.\n6. Guide us in the right path;\n7. the path of those whom You blessed; not of those who have incurred wrath, nor the strayers.',
            footnote: '*1:1 The Arabic text consists of 19 letters. Every word in this foundational opening verse occurs in the Qur\'an in exact multiples of 19.',
        },
        href: '/written',
    },
    {
        id: 'hard-cover-1989',
        category: 'books',
        title: 'Quran: The Final Testament (1989)',
        edition: 'Deluxe Authorized Edition with 38 Appendices',
        year: '1989',
        pages: 760,
        badge: 'Deluxe Testament',
        publisher: 'Universal Unity · Fremont, California',
        coverSrc: '/content/written/books/thumbnails/hard-cover-1989.png',
        facsimilePageSrc: '/content/written/books/thumbnails/hard-cover-1989.png',
        facsimilePageNo: 'Preface',
        ocrSample: {
            heading: 'Introduction: God\'s Message to the World',
            text: 'The Quran is the final scripture from the Creator of the universe. Unlike previous scriptures which were corrupted over time, God Himself pledged to preserve the Quran intact (15:9).\n\nIn this modern scientific era, God has revealed an intricate mathematical composition built into the very fabric of the Arabic text, proving beyond doubt its divine origin.',
            footnote: 'Verified against original 7th-century Tashkent and Topkapi manuscripts.',
        },
        href: '/written',
    },
    {
        id: 'quran-hadith-islam',
        category: 'books',
        title: 'Quran, Hadith, and Islam',
        edition: 'Landmark Theological Treatise',
        year: '1982',
        pages: 128,
        badge: 'Theological Treatise',
        publisher: 'Islamic Productions · Tucson',
        coverSrc: '/content/written/books/thumbnails/quran-hadith-islam.png',
        facsimilePageSrc: '/content/written/books/thumbnails/quran-hadith-islam.png',
        facsimilePageNo: 'Chapter 1',
        ocrSample: {
            heading: 'The Great Criterion: God Alone',
            text: 'Is the Quran complete, perfect, and fully detailed? Or do we need secondary human hearsay attributed centuries after the Prophet?\n\n"Shall I seek other than God as a lawmaker, when He has revealed to you this book fully detailed?" (6:114).\n\nTrue Islam is absolute devotion to God alone, without idols or fabricated human traditions.',
        },
        href: '/written',
    },
    {
        id: 'miracle-alphabets',
        category: 'books',
        title: 'Visual Presentation of the Miracle (Alphabets)',
        edition: 'Comprehensive Graphic Monograph',
        year: '1982',
        pages: 220,
        badge: 'Mathematical Miracle',
        publisher: 'Islamic Productions · Tucson',
        coverSrc: '/content/written/books/thumbnails/miracle-of-quran-alphabets.png',
        facsimilePageSrc: '/content/written/books/thumbnails/miracle-of-quran-alphabets.png',
        facsimilePageNo: 'Section 2',
        ocrSample: {
            heading: 'The Intricate Letter Counts of Sura Maryam (19)',
            text: 'Sura 19 begins with the five initials K.H.Y.A.\'S. (Kaf, Ha, Ya, \'Ayn, Sad).\n\nThe total frequency of these five letters in this specific chapter adds up to exactly 798 (19 × 42).\n\nNo human could compose a meaningful theological chapter while maintaining such intricate physical constraints.',
        },
        href: '/written',
    },
    {
        id: 'sp-1989-09',
        category: 'newsletters',
        title: 'Submitters Perspective — September 1989',
        edition: 'Monthly Research Bulletin #57',
        year: 'Sep 1989',
        pages: 4,
        badge: 'Monthly Bulletin',
        publisher: 'Masjid Tucson Community',
        coverSrc: '/content/written/newsletters/thumbnails/1989_09_September.jpg',
        facsimilePageSrc: '/content/written/newsletters/thumbnails/1989_09_September.jpg',
        facsimilePageNo: 'Issue 57 · Page 1',
        ocrSample: {
            heading: '1989 Annual Conference Highlights',
            text: 'Submitters from across North America, Europe, Africa, and Asia gathered in Tucson, Arizona for the landmark 1989 United Submitters International conference.\n\nKey presentations examined the global propagation of monotheism, local study groups, and the distribution of the authorized English translation.',
        },
        href: '/written',
    },
    {
        id: 'sp-1989-10',
        category: 'newsletters',
        title: 'Submitters Perspective — October 1989',
        edition: 'Monthly Research Bulletin #58',
        year: 'Oct 1989',
        pages: 4,
        badge: 'Monthly Bulletin',
        publisher: 'Masjid Tucson Community',
        coverSrc: '/content/written/newsletters/thumbnails/1989_10_October.jpg',
        facsimilePageSrc: '/content/written/newsletters/thumbnails/1989_10_October.jpg',
        facsimilePageNo: 'Issue 58 · Page 1',
        ocrSample: {
            heading: 'The Pure Religion: Sura 39:3',
            text: 'Absolute devotion is due to God alone. Those who set up idols beside Him say, "We idolize them only to bring us closer to God."\n\nGod will judge them regarding their disputes. God does not guide any liar, disbeliever.',
        },
        href: '/written',
    },
];

const WRITTEN_HIGHLIGHTS = [
    {
        title: '10 Published First Editions',
        description: 'Complete research books, authorized translations, and mathematical treatises by Dr. Rashad Khalifa.',
    },
    {
        title: '64 Historical Newsletters',
        description: 'Every monthly issue of Submitters Perspective (1985–1990) scanned at archival resolution and transcribed.',
    },
    {
        title: 'Side-by-Side Facsimile & OCR',
        description: 'Examine original first edition print pages alongside clean, searchable, selectable digital text.',
    },
];

export function WrittenLibrarySection() {
    const [activeTab, setActiveTab] = useState<WrittenCategory>('books');
    const [selectedWorkId, setSelectedWorkId] = useState<string>(FEATURED_WRITINGS[0].id);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const filteredWorks = FEATURED_WRITINGS.filter((w) => w.category === activeTab);
    const activeWork = FEATURED_WRITINGS.find((w) => w.id === selectedWorkId) ?? filteredWorks[0];

    // Automatic cycling through featured books/newsletters every 7 seconds
    useEffect(() => {
        if (isHovered || filteredWorks.length <= 1) return;

        const interval = setInterval(() => {
            setSelectedWorkId((prevId) => {
                const currentIndex = filteredWorks.findIndex((w) => w.id === prevId);
                const nextIndex = (currentIndex + 1) % filteredWorks.length;
                return filteredWorks[nextIndex].id;
            });
        }, 7000);

        return () => clearInterval(interval);
    }, [isHovered, filteredWorks]);

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
                            Written Library & Facsimiles
                        </h2>
                        <div className="mt-2 h-[2px] w-20 bg-[#C8794A]" />
                    </div>
                </Reveal>
                <Reveal delay={80}>
                    <p
                        className="text-base leading-[1.65] text-[#9E9690] sm:text-lg"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Authorized scripture translations, published research monographs, and monthly bulletins preserved in high-resolution original print facsimiles with searchable OCR.
                    </p>
                </Reveal>
            </div>

            {/* Category Selector Tabs */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('books');
                        setSelectedWorkId('quran-visual-presentation');
                    }}
                    className={`rounded-lg px-4 py-1.5 font-sans text-xs font-semibold transition-all duration-200 ${
                        activeTab === 'books'
                            ? 'border border-[#C8794A] bg-[#C8794A]/15 text-[#F5F0EB] shadow-sm'
                            : 'border border-[#2A2928] bg-[#161514] text-[#9E9690] hover:border-[#353433] hover:text-[#F5F0EB]'
                    }`}
                >
                    Published Books & Monographs (10 Works)
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('newsletters');
                        setSelectedWorkId('sp-1989-09');
                    }}
                    className={`rounded-lg px-4 py-1.5 font-sans text-xs font-semibold transition-all duration-200 ${
                        activeTab === 'newsletters'
                            ? 'border border-[#C8794A] bg-[#C8794A]/15 text-[#F5F0EB] shadow-sm'
                            : 'border border-[#2A2928] bg-[#161514] text-[#9E9690] hover:border-[#353433] hover:text-[#F5F0EB]'
                    }`}
                >
                    Submitters Perspective Monthly Bulletins (1985–1990)
                </button>
            </div>

            {/* Facsimile Reading Room Workstation */}
            <Reveal delay={120}>
                <div className={widgetCardClass}>
                    <GlassSheen />

                    {/* Workstation Header Bar */}
                    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-[#2A2928] bg-[#161514] px-4 py-3 sm:px-6 select-none">
                        <div className="flex items-center gap-3">
                            <span className="font-sans text-xs font-semibold text-[#C8794A]">
                                {activeWork.badge}
                            </span>
                            <span className="text-[#6B6560]" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-[#9E9690]">
                                {activeWork.edition}
                            </span>
                            <span className="text-[#6B6560]" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-[#6B6560]">
                                {activeWork.publisher}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 font-sans text-xs text-[#6B6560]">
                            <span>Published {activeWork.year}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-[#F5F0EB]">{activeWork.pages} Pages</span>
                        </div>
                    </div>

                    {/* Dual Workstation Body: Full Uncropped Book Showcase (Left) + Side-by-Side Facsimile & OCR Text (Right) */}
                    <div className="grid gap-0 lg:grid-cols-[0.85fr_1.35fr]">
                        {/* Book Profile & Uncropped Cover Showcase (Left) */}
                        <div className="flex flex-col justify-between border-b border-[#2A2928] bg-[#121110] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                            <div>
                                {/* Uncropped Full Image Display with Aspect Containment */}
                                <div className="relative mx-auto aspect-[3/4] w-48 overflow-hidden rounded-xl border border-[#2A2928] bg-[#0A0908] p-2 shadow-2xl transition-transform duration-500 hover:scale-[1.02] sm:w-56">
                                    <Image
                                        key={activeWork.coverSrc}
                                        src={activeWork.coverSrc}
                                        alt={activeWork.title}
                                        fill
                                        quality={90}
                                        sizes="240px"
                                        className="object-contain p-1 drop-shadow-md"
                                    />
                                </div>

                                <div className="mt-6 text-center sm:text-left">
                                    <h3 className="font-serif text-xl font-semibold leading-snug text-[#F5F0EB]">
                                        {activeWork.title}
                                    </h3>
                                    <p className="mt-1 font-sans text-xs text-[#9E9690]">
                                        {activeWork.edition} · {activeWork.pages} Preserved Pages
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-[#6B6560]">
                                        Original archival copy scanned at 600 DPI to preserve typography, layout, and footnotes with 100% faithful accuracy.
                                    </p>
                                </div>
                            </div>

                            {/* Book Selection Strip */}
                            <div className="mt-6 pt-4 border-t border-[#2A2928]">
                                <span className="block font-sans text-[0.7rem] font-semibold text-[#6B6560] mb-2">
                                    Browse Works in this Category
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {filteredWorks.map((work) => (
                                        <button
                                            key={work.id}
                                            type="button"
                                            onClick={() => setSelectedWorkId(work.id)}
                                            className={`rounded-md px-3 py-1 font-sans text-xs transition-all ${
                                                work.id === activeWork.id
                                                    ? 'border border-[#C8794A] bg-[#C8794A]/20 text-[#F5F0EB] font-bold'
                                                    : 'border border-[#2A2928] bg-[#161514] text-[#9E9690] hover:text-[#F5F0EB]'
                                            }`}
                                        >
                                            {work.title.split('(')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Side-by-Side Facsimile & OCR Text Preview (Right) */}
                        <div className="flex flex-col justify-between bg-[#161514] p-6 sm:p-8">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-[#2A2928]">
                                    <span className="font-sans text-xs font-semibold text-[#F5F0EB]">
                                        Facsimile Scan & Synced OCR
                                    </span>
                                    <span className="font-sans text-xs text-[#6B6560]">
                                        {activeWork.facsimilePageNo}
                                    </span>
                                </div>

                                {/* Side-by-Side Panel */}
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    {/* Left: Uncropped Facsimile Scan Thumbnail */}
                                    <div className="rounded-xl border border-[#2A2928] bg-[#0E0D0C] p-4 flex flex-col justify-between">
                                        <div>
                                            <span className="block font-sans text-xs font-semibold text-[#C8794A] mb-2">
                                                Archival Facsimile Page
                                            </span>
                                            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-[#2A2928] bg-[#161514] p-1">
                                                <Image
                                                    src={activeWork.facsimilePageSrc}
                                                    alt="Facsimile page scan"
                                                    fill
                                                    quality={80}
                                                    sizes="200px"
                                                    className="object-contain opacity-90 sepia-[0.1]"
                                                />
                                            </div>
                                        </div>
                                        <span className="mt-3 block text-center font-sans text-xs text-[#6B6560]">
                                            First Edition Master Facsimile
                                        </span>
                                    </div>

                                    {/* Right: Searchable OCR Text */}
                                    <div className="rounded-xl border border-[#2A2928] bg-[#11100F] p-4 flex flex-col justify-between">
                                        <div>
                                            <span className="block font-sans text-xs font-semibold text-[#C8794A] mb-2">
                                                Searchable Clean OCR
                                            </span>
                                            <h4 className="font-serif text-sm font-semibold text-[#F5F0EB]">
                                                {activeWork.ocrSample.heading}
                                            </h4>
                                            <p
                                                className="mt-2 text-xs leading-relaxed text-[#9E9690] whitespace-pre-line italic"
                                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                            >
                                                &ldquo;{activeWork.ocrSample.text}&rdquo;
                                            </p>
                                            {activeWork.ocrSample.footnote && (
                                                <p className="mt-3 pt-2 border-t border-[#2A2928] font-sans text-xs text-[#6B6560] leading-normal">
                                                    {activeWork.ocrSample.footnote}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between font-sans text-xs text-[#6B6560]">
                                            <span>Full-text indexed</span>
                                            <span className="text-[#C8794A]">Ready to copy</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-6 pt-4 border-t border-[#2A2928]">
                                <Link
                                    href={activeWork.href}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C8794A] bg-[#C8794A] px-5 py-2.5 font-sans text-xs font-semibold text-[#0F0E0D] shadow-lg transition-all hover:bg-[#D9916A] hover:scale-[1.01]"
                                >
                                    <span>Open Complete Written Library & Facsimiles</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Workstation Footer Callout */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2928] bg-[#161514] px-4 py-3 sm:px-6">
                        <Link
                            href="/written"
                            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-[#F5F0EB] hover:text-[#C8794A] transition-colors"
                        >
                            <span>Explore all 74 written publications & newsletters</span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#C8794A]" />
                        </Link>
                        <span className="font-sans text-xs text-[#6B6560]">
                            600 DPI Zero-Error Facsimile Preservation
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* 3 Core Preservation Highlight Cards */}
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {WRITTEN_HIGHLIGHTS.map((item, idx) => (
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
