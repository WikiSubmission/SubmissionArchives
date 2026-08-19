'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { GlassSheen, widgetCardClass } from './WidgetAccents';

type VideoCategory = 'all' | 'essential' | 'theology' | 'debate' | 'bulletin';

interface VideoChapter {
    time: string;
    seconds: number;
    title: string;
}

interface VideoProgram {
    id: string;
    title: string;
    category: VideoCategory;
    categoryLabel: string;
    date: string;
    duration: string;
    masterFormat: string;
    thumbnail: string;
    summary: string;
    chapters: VideoChapter[];
    href: string;
}

const FEATURED_PROGRAMS: VideoProgram[] = [
    {
        id: 'what-is-life-all-about',
        title: 'What is Life All About?',
        category: 'essential',
        categoryLabel: 'Essential Discourse',
        date: 'Studio Master',
        duration: '48:15',
        masterFormat: 'Broadcast Video Master',
        thumbnail: '/content/videos/thumbnails/what-is-life-all-about.png',
        summary: 'Dr. Rashad Khalifa addresses the primordial question of human existence, the heavenly feud, and the purpose of our life on earth as a temporary redemption opportunity.',
        chapters: [
            { time: '00:00', seconds: 0, title: 'The Great Question of Human Purpose' },
            { time: '12:30', seconds: 750, title: 'The Heavenly Feud & Our Decision' },
            { time: '26:45', seconds: 1605, title: 'Redemption & Growth in This Life' },
            { time: '39:10', seconds: 2350, title: 'The Ultimate Choice: God Alone' },
        ],
        href: '/videos',
    },
    {
        id: 'who-is-god',
        title: 'Who is GOD?',
        category: 'theology',
        categoryLabel: 'Theological Foundation',
        date: 'Studio Master',
        duration: '52:20',
        masterFormat: 'Studio Master Archive',
        thumbnail: '/content/videos/thumbnails/who-is-god.png',
        summary: 'A definitive scriptural examination of the attributes, omnipotence, and nature of the Almighty Creator as revealed in the Holy Scriptures.',
        chapters: [
            { time: '00:00', seconds: 0, title: 'Understanding God\'s Absolute Omnipotence' },
            { time: '14:15', seconds: 855, title: 'The Greatness of the Creator' },
            { time: '29:40', seconds: 1780, title: 'Recognizing Idolatry in Subtle Forms' },
            { time: '42:50', seconds: 2570, title: 'Direct Devotion Without Intermediaries' },
        ],
        href: '/videos',
    },
    {
        id: 'world-news-bulletin',
        title: 'World News Bulletin',
        category: 'bulletin',
        categoryLabel: 'Preserved Broadcast',
        date: 'Historical Broadcast',
        duration: '34:40',
        masterFormat: 'Broadcast Recording',
        thumbnail: '/content/videos/thumbnails/world-news-bulletin.png',
        summary: 'Special video bulletin analyzing global religious developments, scriptural confirmations, and historic announcements regarding the mathematical miracle of the Qur\'an.',
        chapters: [
            { time: '00:00', seconds: 0, title: 'Current Global Religious Events' },
            { time: '09:20', seconds: 560, title: 'Scientific & Mathematical Confirmations' },
            { time: '19:45', seconds: 1185, title: 'Reports from Global Submitter Communities' },
            { time: '28:10', seconds: 1690, title: 'Closing Analysis & Next Steps' },
        ],
        href: '/videos',
    },
    {
        id: 'great-debate',
        title: 'The Great Debate: Dr. Rashad Khalifa vs Dr. Abdel Rahman',
        category: 'debate',
        categoryLabel: 'Historical Debate',
        date: '1987 Master',
        duration: '1:45:30',
        masterFormat: 'Complete Uncut Master',
        thumbnail: '/content/videos/thumbnails/the-great-debate-dr-rashad-khalifa-vs-dr-abdel-rahman.png',
        summary: 'The historic debate on the sufficiency of the Qur\'an versus secondary traditions, presenting direct manuscript evidence and mathematical verification.',
        chapters: [
            { time: '00:00', seconds: 0, title: 'Opening Statements & Core Propositions' },
            { time: '24:10', seconds: 1450, title: 'The Criterion of Sura 6:114' },
            { time: '55:30', seconds: 3330, title: 'Manuscript Evidence & Mathematical Proofs' },
            { time: '1:22:15', seconds: 4935, title: 'Rebuttals & Audience Q&A' },
        ],
        href: '/videos',
    },
];

const PRESERVATION_HIGHLIGHTS = [
    {
        title: '300+ Preserved Lectures',
        description: 'Complete Friday sermons, international conferences, television debates, and instructional workshops.',
    },
    {
        title: 'Synchronized Chapter Markers',
        description: 'Jump directly to mathematical proofs, scripture discussions, and Q&A sessions with second-accurate timestamps.',
    },
    {
        title: 'Citation Deep Links',
        description: 'Instantly copy shareable links that open the video at the exact moment of evidence for independent verification.',
    },
];

export function VideoArchiveSection() {
    const [activeCategory, setActiveCategory] = useState<VideoCategory>('all');
    const [selectedVideoId, setSelectedVideoId] = useState<string>(FEATURED_PROGRAMS[0].id);
    const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const filteredVideos = FEATURED_PROGRAMS.filter(
        (v) => activeCategory === 'all' || v.category === activeCategory
    );

    const activeVideo = FEATURED_PROGRAMS.find((v) => v.id === selectedVideoId) ?? filteredVideos[0];

    // Automatic cycling through featured programs every 7 seconds
    useEffect(() => {
        if (isHovered || filteredVideos.length <= 1) return;

        const interval = setInterval(() => {
            setSelectedVideoId((prevId) => {
                const currentIndex = filteredVideos.findIndex((v) => v.id === prevId);
                const nextIndex = (currentIndex + 1) % filteredVideos.length;
                return filteredVideos[nextIndex].id;
            });
            setActiveChapterIndex(0);
        }, 7000);

        return () => clearInterval(interval);
    }, [isHovered, filteredVideos]);

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
                        Video Archive
                    </h2>
                </Reveal>
                <Reveal delay={80}>
                    <p
                        className="mt-3 max-w-3xl text-base leading-[1.65] text-ed-fg-secondary sm:text-lg"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Friday sermons, instructional programs, television debates, and annual conference recordings preserved in a chapter-indexed screening theater.
                    </p>
                </Reveal>
                <div className="mt-4 h-[2px] w-20 bg-ed-accent" />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
                {(
                    [
                        { id: 'all', label: 'All Programs' },
                        { id: 'essential', label: 'Essential Discourses' },
                        { id: 'theology', label: 'Theology' },
                        { id: 'bulletin', label: 'News Bulletins' },
                        { id: 'debate', label: 'Debates' },
                    ] as const
                ).map((cat) => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                            setActiveCategory(cat.id);
                            const matching = FEATURED_PROGRAMS.filter(
                                (v) => cat.id === 'all' || v.category === cat.id
                            );
                            if (matching.length > 0) {
                                setSelectedVideoId(matching[0].id);
                                setActiveChapterIndex(0);
                            }
                        }}
                        className={`rounded-lg px-4 py-1.5 font-sans text-xs font-semibold transition-all duration-200 ${
                            activeCategory === cat.id
                                ? 'border border-ed-accent bg-ed-accent-soft text-ed-accent dark:text-ed-fg shadow-sm'
                                : 'border border-ed-rule bg-ed-surface text-ed-fg-muted hover:border-ed-rule-strong hover:text-ed-fg'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Interactive Screening Theater Window */}
            <Reveal delay={120}>
                <div className={widgetCardClass}>
                    <GlassSheen />

                    {/* Window Title Bar */}
                    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-ed-rule bg-ed-surface px-4 py-3 sm:px-6 select-none">
                        <div className="flex items-center gap-3">
                            <span className="font-sans text-xs font-semibold text-ed-accent">
                                {activeVideo.categoryLabel}
                            </span>
                            <span className="text-ed-fg-faint" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-ed-fg-muted">
                                {activeVideo.masterFormat}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs text-ed-fg-muted">
                            <span>{activeVideo.date}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-ed-fg">{activeVideo.duration}</span>
                        </div>
                    </div>

                    {/* Theater Main Grid: Unobstructed Video Stage (Left) + Interactive Chapter Timeline (Right) */}
                    <div className="grid gap-0 lg:grid-cols-[1.35fr_0.85fr]">
                        {/* Video Stage Frame & Information */}
                        <div className="flex flex-col justify-between bg-ed-bg">
                            {/* Unobstructed High-Visibility Thumbnail Stage */}
                            <Link
                                href={activeVideo.href}
                                className="group relative block aspect-video w-full overflow-hidden bg-black"
                                aria-label={`Open ${activeVideo.title}`}
                            >
                                <Image
                                    key={activeVideo.thumbnail}
                                    src={activeVideo.thumbnail}
                                    alt={activeVideo.title}
                                    fill
                                    quality={90}
                                    sizes="(min-width: 1024px) 60vw, 100vw"
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                                />
                                <div className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-transparent" />
                            </Link>

                            {/* Clean Details Panel Below Thumbnail */}
                            <div className="p-6 sm:p-7 border-t border-ed-rule bg-ed-surface/50">
                                <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight text-ed-fg sm:text-2xl">
                                    {activeVideo.title}
                                </h3>
                                <p
                                    className="mt-2 text-xs leading-relaxed text-ed-fg-secondary sm:text-sm"
                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                >
                                    {activeVideo.summary}
                                </p>

                                <div className="mt-5">
                                    <Link
                                        href={activeVideo.href}
                                        className="inline-flex items-center gap-2 rounded-lg border border-ed-accent bg-ed-accent px-4 py-2 font-sans text-xs font-semibold text-white dark:text-[#0F0E0D] shadow-md transition-all hover:opacity-90"
                                    >
                                        <span>Watch Full Video Presentation</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Chapter Timeline Sidebar */}
                        <div className="flex flex-col justify-between border-t border-ed-rule bg-ed-surface p-4 sm:p-5 lg:border-l lg:border-t-0">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-ed-rule">
                                    <span className="font-sans text-xs font-semibold text-ed-fg">
                                        Chapter Markers
                                    </span>
                                    <span className="font-mono text-xs text-ed-fg-muted">
                                        {activeVideo.chapters.length} Segments
                                    </span>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {activeVideo.chapters.map((chap, cIdx) => {
                                        const isChapActive = cIdx === activeChapterIndex;
                                        return (
                                            <button
                                                key={chap.title}
                                                type="button"
                                                onClick={() => setActiveChapterIndex(cIdx)}
                                                className={`flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition-all duration-200 ${
                                                    isChapActive
                                                        ? 'border-ed-accent/50 bg-ed-accent/10 text-ed-fg shadow-sm'
                                                        : 'border-transparent text-ed-fg-secondary hover:border-ed-rule hover:bg-ed-bg hover:text-ed-fg'
                                                }`}
                                            >
                                                <span className={`inline-flex h-6 min-w-12 items-center justify-center rounded font-sans text-xs font-semibold ${
                                                    isChapActive
                                                        ? 'bg-ed-accent text-white dark:text-[#0F0E0D]'
                                                        : 'border border-ed-rule bg-ed-bg text-ed-accent'
                                                }`}>
                                                    {chap.time}
                                                </span>
                                                <div className="min-w-0">
                                                    <span className="block truncate font-sans text-xs font-semibold">
                                                        {chap.title}
                                                    </span>
                                                    <span className="block font-sans text-[0.7rem] text-ed-fg-muted">
                                                        Verified segment at {chap.seconds}s
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Program Switcher Strip */}
                            <div className="mt-4 pt-4 border-t border-ed-rule">
                                <span className="block font-sans text-[0.7rem] font-semibold text-ed-fg-muted mb-2">
                                    Featured in this category
                                </span>
                                <div className="grid grid-cols-4 gap-2">
                                    {filteredVideos.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedVideoId(item.id);
                                                setActiveChapterIndex(0);
                                            }}
                                            aria-label={`Select ${item.title}`}
                                            className={`relative aspect-video overflow-hidden rounded-md border transition-all ${
                                                item.id === activeVideo.id
                                                    ? 'border-ed-accent ring-1 ring-ed-accent/60'
                                                    : 'border-ed-rule opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <Image
                                                src={item.thumbnail}
                                                alt=""
                                                fill
                                                quality={40}
                                                sizes="100px"
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Callout Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule bg-ed-surface px-4 py-3 sm:px-6">
                        <Link
                            href="/videos"
                            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-ed-fg hover:text-ed-accent transition-colors"
                        >
                            <span>Browse all 300+ preserved video recordings</span>
                            <ArrowRight className="h-3.5 w-3.5 text-ed-accent" />
                        </Link>
                        <span className="font-sans text-xs text-ed-fg-muted">
                            Original Master Collection
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* 3 Core Preservation Highlight Cards */}
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {PRESERVATION_HIGHLIGHTS.map((item, idx) => (
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
