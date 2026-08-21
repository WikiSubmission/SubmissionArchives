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
    aspectRatio: string;
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
        pages: 252,
        badge: 'Mathematical Miracle',
        publisher: 'Islamic Productions · Tucson',
        coverSrc: '/content/written/books/thumbnails/quran-visual-presentation.png',
        facsimilePageSrc: '/content/written/books/thumbnails/quran-visual-presentation.png',
        facsimilePageNo: 'Title Page & Ch 1',
        aspectRatio: '2/3',
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
        pages: 554,
        badge: 'Authorized Translation',
        publisher: 'Islamic Productions · Tucson, Arizona',
        coverSrc: '/content/written/books/thumbnails/quran1981.png',
        facsimilePageSrc: '/content/written/books/thumbnails/quran1981.png',
        facsimilePageNo: 'Page 1 · Sura 1:1-7',
        aspectRatio: '905/1397',
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
        pages: 746,
        badge: 'Deluxe Testament',
        publisher: 'Universal Unity · Fremont, California',
        coverSrc: '/content/written/books/thumbnails/hard-cover-1989.png',
        facsimilePageSrc: '/content/written/books/thumbnails/hard-cover-1989.png',
        facsimilePageNo: 'Introduction & Appendices',
        aspectRatio: '984/1448',
        ocrSample: {
            heading: "Introduction: God's Message to the World",
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
        pages: 92,
        badge: 'Theological Treatise',
        publisher: 'Islamic Productions · Tucson',
        coverSrc: '/content/written/books/thumbnails/quran-hadith-islam.png',
        facsimilePageSrc: '/content/written/books/thumbnails/quran-hadith-islam.png',
        facsimilePageNo: 'Chapter 1',
        aspectRatio: '2/3',
        ocrSample: {
            heading: 'The Great Criterion: God Alone',
            text: 'Is the Quran complete, perfect, and fully detailed? Or do we need secondary human hearsay attributed centuries after the Prophet?\n\n"Shall I seek other than God as a lawmaker, when He has revealed to you this book fully detailed?" (6:114).\n\nTrue Islam is absolute devotion to God alone, without idols or fabricated human traditions.',
        },
        href: '/written',
    },
    {
        id: 'miracle-alphabets',
        category: 'books',
        title: 'Miracle of the Quran (Mysterious Alphabets)',
        edition: 'Comprehensive Graphic Monograph',
        year: '1982',
        pages: 216,
        badge: 'Mathematical Miracle',
        publisher: 'Islamic Productions · Tucson',
        coverSrc: '/content/written/books/thumbnails/miracle-of-quran-alphabets.png',
        facsimilePageSrc: '/content/written/books/thumbnails/miracle-of-quran-alphabets.png',
        facsimilePageNo: 'Chapter 19 Letter Analysis',
        aspectRatio: '1046/1504',
        ocrSample: {
            heading: 'The Intricate Letter Counts of Sura Maryam (19)',
            text: "Sura 19 begins with the five initials K.H.Y.A.'S. (Kaf, Ha, Ya, 'Ayn, Sad).\n\nThe total frequency of these five letters in this specific chapter adds up to exactly 798 (19 × 42).\n\nNo human could compose a meaningful theological chapter while maintaining such intricate physical constraints.",
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
        aspectRatio: '17/22',
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
        aspectRatio: '17/22',
        ocrSample: {
            heading: 'The Mathematical Miracle & Pure Monotheism',
            text: 'Detailed research articles explaining the structural safeguards of scripture and the importance of adhering to the practices of worship delivered through Abraham.',
        },
        href: '/written',
    },
    {
        id: 'sp-1989-11',
        category: 'newsletters',
        title: 'Submitters Perspective — November 1989',
        edition: 'Monthly Research Bulletin #59',
        year: 'Nov 1989',
        pages: 4,
        badge: 'Monthly Bulletin',
        publisher: 'Masjid Tucson Community',
        coverSrc: '/content/written/newsletters/thumbnails/1989_11_November.jpg',
        facsimilePageSrc: '/content/written/newsletters/thumbnails/1989_11_November.jpg',
        facsimilePageNo: 'Issue 59 · Page 1',
        aspectRatio: '17/22',
        ocrSample: {
            heading: 'Preservation of the Friday Prayer',
            text: 'Scriptural analysis of the Friday congregational prayer (Salat al-Jumu‘ah), congregational unity, and historical continuity.',
        },
        href: '/written',
    },
    {
        id: 'sp-1989-12',
        category: 'newsletters',
        title: 'Submitters Perspective — December 1989',
        edition: 'Monthly Research Bulletin #60',
        year: 'Dec 1989',
        pages: 4,
        badge: 'Monthly Bulletin',
        publisher: 'Masjid Tucson Community',
        coverSrc: '/content/written/newsletters/thumbnails/1989_12_December.jpg',
        facsimilePageSrc: '/content/written/newsletters/thumbnails/1989_12_December.jpg',
        facsimilePageNo: 'Issue 60 · Page 1',
        aspectRatio: '17/22',
        ocrSample: {
            heading: 'Year-End Review & Propagation Milestones',
            text: 'Summary of worldwide translation distribution, scripture indexing, and milestones achieved during the 1989 calendar year.',
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
            <div>
                <Reveal>
                    <h2 className="font-serif text-[clamp(1.85rem,3.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg">
                        Written Library & Facsimiles
                    </h2>
                </Reveal>
                <Reveal delay={80}>
                    <p
                        className="mt-3 max-w-3xl text-base leading-[1.65] text-ed-fg-secondary sm:text-lg"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Authorized scripture translations, published research monographs, and monthly bulletins preserved in high-resolution original print facsimiles with searchable OCR.
                    </p>
                </Reveal>
                <div className="mt-4 h-[2px] w-20 bg-ed-accent" />
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
                            ? 'border border-ed-accent bg-ed-accent-soft text-ed-accent dark:text-ed-fg shadow-sm'
                            : 'border border-ed-rule bg-ed-surface text-ed-fg-muted hover:border-ed-rule-strong hover:text-ed-fg'
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
                            ? 'border border-ed-accent bg-ed-accent-soft text-ed-accent dark:text-ed-fg shadow-sm'
                            : 'border border-ed-rule bg-ed-surface text-ed-fg-muted hover:border-ed-rule-strong hover:text-ed-fg'
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
                    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-ed-rule bg-ed-surface px-4 py-3 sm:px-6 select-none">
                        <div className="flex items-center gap-3">
                            <span className="font-sans text-xs font-semibold text-ed-accent">
                                {activeWork.badge}
                            </span>
                            <span className="text-ed-fg-faint" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-ed-fg-secondary">
                                {activeWork.edition}
                            </span>
                            <span className="text-ed-fg-faint" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-ed-fg-muted">
                                {activeWork.publisher}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 font-sans text-xs text-ed-fg-muted">
                            <span>Published {activeWork.year}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-ed-fg">{activeWork.pages} Pages</span>
                        </div>
                    </div>

                    {/* Dual Workstation Body: Full Uncropped Book Showcase (Left) + Side-by-Side Facsimile & OCR Text (Right) */}
                    <div className="grid gap-0 lg:grid-cols-[0.85fr_1.35fr]">
                        {/* Book Profile & Uncropped Cover Showcase (Left) */}
                        <div className="flex flex-col justify-between border-b border-ed-rule bg-ed-bg p-6 sm:p-8 lg:border-b-0 lg:border-r">
                            <div>
                                {/* Uncropped Full Image Display with Aspect Containment */}
                                <div 
                                    style={{ aspectRatio: activeWork.aspectRatio }}
                                    className="relative mx-auto w-44 sm:w-52 overflow-hidden rounded-xl border border-ed-rule bg-ed-surface shadow-xl transition-transform duration-500 hover:scale-[1.02]"
                                >
                                    <Image
                                        key={activeWork.coverSrc}
                                        src={activeWork.coverSrc}
                                        alt={activeWork.title}
                                        fill
                                        quality={90}
                                        sizes="(min-width: 640px) 208px, 176px"
                                        className="object-cover drop-shadow-md"
                                    />
                                </div>

                                <div className="mt-6 text-center sm:text-left">
                                    <h3 className="font-serif text-xl font-semibold leading-snug text-ed-fg">
                                        {activeWork.title}
                                    </h3>
                                    <p className="mt-1 font-sans text-xs text-ed-fg-secondary">
                                        {activeWork.edition} · {activeWork.pages} Preserved Pages
                                    </p>
                                    <p className="mt-2 text-xs leading-relaxed text-ed-fg-muted">
                                        Original archival copy scanned at 600 DPI to preserve typography, layout, and footnotes with 100% faithful accuracy.
                                    </p>
                                </div>
                            </div>

                            {/* Book Selection Strip */}
                            <div className="mt-6 pt-4 border-t border-ed-rule">
                                <span className="block font-sans text-[0.7rem] font-semibold text-ed-fg-muted mb-2">
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
                                                    ? 'border border-ed-accent bg-ed-accent/20 text-ed-accent dark:text-ed-fg font-bold'
                                                    : 'border border-ed-rule bg-ed-surface text-ed-fg-secondary hover:text-ed-fg'
                                            }`}
                                        >
                                            {work.title.split('(')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Side-by-Side Facsimile & OCR Text Preview (Right) */}
                        <div className="flex flex-col justify-between bg-ed-surface p-6 sm:p-8">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-ed-rule">
                                    <span className="font-sans text-xs font-semibold text-ed-fg">
                                        Facsimile Scan & Synced OCR
                                    </span>
                                    <span className="font-sans text-xs text-ed-fg-muted">
                                        {activeWork.facsimilePageNo}
                                    </span>
                                </div>

                                {/* Side-by-Side Panel */}
                                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                    {/* Left: Uncropped Facsimile Scan Thumbnail */}
                                    <div className="rounded-xl border border-ed-rule bg-ed-bg p-4 flex flex-col justify-between">
                                        <div>
                                            <span className="block font-sans text-xs font-semibold text-ed-accent mb-2">
                                                Archival Facsimile Page
                                            </span>
                                            <div 
                                                style={{ aspectRatio: activeWork.aspectRatio }}
                                                className="relative w-full max-w-[200px] mx-auto overflow-hidden rounded-lg border border-ed-rule bg-ed-surface shadow-sm"
                                            >
                                                <Image
                                                    src={activeWork.facsimilePageSrc}
                                                    alt="Facsimile page scan"
                                                    fill
                                                    quality={80}
                                                    sizes="200px"
                                                    className="object-cover opacity-90 sepia-[0.1]"
                                                />
                                            </div>
                                        </div>
                                        <span className="mt-3 block text-center font-sans text-xs text-ed-fg-muted">
                                            First Edition Master Facsimile
                                        </span>
                                    </div>

                                    {/* Right: Searchable OCR Text */}
                                    <div className="rounded-xl border border-ed-rule bg-ed-bg p-4 flex flex-col justify-between">
                                        <div>
                                            <span className="block font-sans text-xs font-semibold text-ed-accent mb-2">
                                                Searchable Clean OCR
                                            </span>
                                            <h4 className="font-serif text-sm font-semibold text-ed-fg">
                                                {activeWork.ocrSample.heading}
                                            </h4>
                                            <p
                                                className="mt-2 text-xs leading-relaxed text-ed-fg-secondary whitespace-pre-line italic"
                                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                            >
                                                &ldquo;{activeWork.ocrSample.text}&rdquo;
                                            </p>
                                            {activeWork.ocrSample.footnote && (
                                                <p className="mt-3 pt-2 border-t border-ed-rule font-sans text-xs text-ed-fg-muted leading-normal">
                                                    {activeWork.ocrSample.footnote}
                                                </p>
                                            )}
                                        </div>
                                        <div className="mt-3 flex items-center justify-between font-sans text-xs text-ed-fg-muted">
                                            <span>Full-text indexed</span>
                                            <span className="text-ed-accent">Ready to copy</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <div className="mt-6 pt-4 border-t border-ed-rule">
                                <Link
                                    href={activeWork.href}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-ed-accent bg-ed-accent px-5 py-2.5 font-sans text-xs font-semibold text-white dark:text-[#0F0E0D] shadow-lg transition-all hover:opacity-90 hover:scale-[1.01]"
                                >
                                    <span>Open Complete Written Library & Facsimiles</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Workstation Footer Callout */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule bg-ed-surface px-4 py-3 sm:px-6">
                        <Link
                            href="/written"
                            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-ed-fg hover:text-ed-accent transition-colors"
                        >
                            <span>Explore all 74 written publications & newsletters</span>
                            <ArrowRight className="h-3.5 w-3.5 text-ed-accent" />
                        </Link>
                        <span className="font-sans text-xs text-ed-fg-muted">
                            600 DPI Zero-Error Facsimile Preservation
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* 3 Core Preservation Highlight Cards */}
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {WRITTEN_HIGHLIGHTS.map((item, idx) => (
                    <Reveal key={item.title} delay={160 + idx * 80}>
                        <div className="flex h-full flex-col justify-between rounded-xl border border-ed-rule bg-ed-surface p-5 shadow-sm transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface-strong">
                            <div>
                                <h4 className="font-sans text-sm font-semibold text-ed-fg">
                                    {item.title}
                                </h4>
                                <p className="mt-2 text-xs leading-[1.6] text-ed-fg-secondary">
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
