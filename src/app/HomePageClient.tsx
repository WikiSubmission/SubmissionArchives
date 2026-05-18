'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    ArrowRight,
    Play,
    Search,
} from 'lucide-react';
import { useTheme } from './components/ThemeProvider';
import { getPublicAssetUrl } from '@/lib/mediaAssets';

interface HomePageClientProps {
    initialMedia?: unknown[];
}

type BranchCard = {
    numeral: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    accent: string;
    meta: string;
    cardTitle: string;
    details: Array<{ title: string; body: string }>;
    icon: React.ComponentType<{ className?: string }>;
    align: 'left' | 'right' | 'center';
    kind?: 'search';
};

const archiveBranches: BranchCard[] = [
    {
        numeral: 'III',
        title: 'The Search Function',
        body: 'Search across Quran study transcripts, messenger audios, video programs, appendices, Submitter Perspectives, and other works.',
        href: '/search',
        cta: 'Go To Search',
        accent: 'Cross-collection recall',
        meta: 'Names, verses, phrases, and references across the corpus',
        cardTitle: 'Search across\n1,240 archive units',
        details: [
            {
                title: 'Proximity aware',
                body: 'Find passages where related terms appear near each other, not just exact phrase matches.',
            },
            {
                title: 'Cross-format',
                body: 'One query can surface transcript moments, video programs, written works, and appendices together.',
            },
            {
                title: 'Playable results',
                body: 'Audio and video matches open at the relevant time so search becomes immediate study.',
            },
        ],
        icon: Search,
        align: 'center',
        kind: 'search',
    },
];

const HERO_IMAGES = [
    { src: '/images/rashadandothers/M3.png', alt: 'Rashad Khalifa archival photograph' },
    { src: '/images/rashadandothers/M1.png', alt: 'Rashad Khalifa with others archival photograph' },
    { src: '/images/rashadandothers/M2.png', alt: 'Rashad Khalifa archival group photograph' },
    { src: '/images/rashadandothers/M4.jpeg', alt: 'Rashad Khalifa archival scene' },
];

const HERO_ROTATION_MS = 6500;

export default function HomePageClient({ initialMedia: _initialMedia }: HomePageClientProps) {
    void _initialMedia;
    const { darkMode } = useTheme();
    const [heroImageIndex, setHeroImageIndex] = React.useState(0);
    const handlePathwayPointerMove = React.useCallback((event: React.PointerEvent<HTMLElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        event.currentTarget.style.setProperty('--cursor-x', `${x}%`);
        event.currentTarget.style.setProperty('--cursor-y', `${y}%`);
    }, []);

    React.useEffect(() => {
        const timer = window.setInterval(() => {
            setHeroImageIndex((current) => (current + 1) % HERO_IMAGES.length);
        }, HERO_ROTATION_MS);

        return () => window.clearInterval(timer);
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-ed-bg text-ed-fg">
            <main className="relative z-10">
                <section className="relative mx-auto grid max-w-[1440px] gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:pb-20 lg:pt-16">
                    {/* Hero Ambient Background Glow */}
                    <div className="pointer-events-none absolute -left-20 top-10 h-[800px] w-[800px] rounded-full bg-[var(--ed-accent)] opacity-[0.04] blur-[200px] dark:opacity-[0.08]" />

                    <div className="relative z-10 flex flex-col justify-center">
                        <div className="max-w-3xl space-y-8">
                            <div className="space-y-6">
                                <span className="inline-flex items-center gap-2 rounded-full bg-black/[0.02] px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.24em] text-ed-accent shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] backdrop-blur-md dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-ed-accent shadow-[0_0_8px_var(--ed-accent)]" />
                                    Preservation infrastructure for a living archive
                                </span>
                                
                                <h1 className="group flex cursor-default flex-col items-start leading-none mb-8">
                                    <span className="mb-2 font-sans text-[3.5rem] font-black uppercase leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-ed-fg via-ed-fg to-ed-fg-muted drop-shadow-sm md:text-[5rem]">
                                        SUBMISSION
                                    </span>
                                    <span
                                        style={{ fontFamily: 'var(--font-roboto-slab)' }}
                                        className="block min-w-[min-content] w-auto rounded-[1.25rem] bg-black/[0.02] px-8 py-3 text-center text-5xl font-bold uppercase italic tracking-widest text-ed-fg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] backdrop-blur-md dark:bg-[#111111]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] md:text-7xl"
                                    >
                                        ARCHIVES
                                    </span>
                                </h1>
                                <p className="max-w-[62ch] text-[16px] leading-8 text-ed-fg-muted sm:text-lg font-medium">
                                    Watch, Listen, and Search a variety of materials.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4 sm:flex-row">
                                <Link
                                    href="/videos"
                                    className="inline-flex items-center justify-center gap-3 rounded-full bg-ed-fg px-8 py-4 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-ed-bg shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_10px_30px_rgba(255,255,255,0.15)]"
                                >
                                    Start with the archive
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/search"
                                    className="inline-flex items-center justify-center gap-3 rounded-full bg-black/[0.03] px-8 py-4 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-ed-fg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] backdrop-blur-md transition-all hover:bg-black/[0.06] hover:text-ed-accent dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.04]"
                                >
                                    Search the corpus
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-center lg:justify-end">
                        <div className="flex w-full max-w-[720px] flex-col overflow-hidden rounded-[1rem] border border-black/10 bg-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] backdrop-blur-3xl dark:border-white/10 dark:bg-[#1c1c1c]/80 dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                            {/* Window Title Bar */}
                            <div className="flex h-[3.25rem] items-center bg-[#e5e5e5]/50 px-4 dark:bg-[#2d2d2d]/50">
                                <div className="flex shrink-0 gap-2">
                                    <div className="h-3 w-3 rounded-full bg-[#ff5f56] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" />
                                    <div className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" />
                                    <div className="h-3 w-3 rounded-full bg-[#27c93f] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.15)] dark:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" />
                                </div>
                                <div className="mx-auto flex h-7 w-64 items-center justify-center rounded-[0.4rem] border border-black/5 bg-white/60 text-[0.65rem] font-medium tracking-wide text-black/60 shadow-sm dark:border-black/50 dark:bg-black/20 dark:text-white/60">
                                    Submission Archives
                                </div>
                                <div className="w-[52px]" />
                            </div>

                            {/* Window Tab Bar */}
                            <div className="flex w-full border-b border-black/10 bg-[#dfdfdf]/50 dark:border-black/80 dark:bg-[#151515]/50">
                                {HERO_IMAGES.map((_, index) => {
                                    const isActive = index === heroImageIndex;
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setHeroImageIndex(index)}
                                            className={`relative flex flex-1 items-center justify-center border-r border-black/10 px-4 py-2 text-[0.65rem] transition-colors last:border-r-0 dark:border-black/80 ${
                                                isActive
                                                    ? 'bg-[#f4f4f4]/90 font-medium text-black dark:bg-[#1e1e1e]/90 dark:text-white'
                                                    : 'bg-transparent font-normal text-black/60 hover:bg-black/5 dark:text-white/50 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            <span className="truncate tracking-wide">Archive {String(index + 1).padStart(2, '0')}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Image Frame */}
                            <div className="relative aspect-[1.38/1] w-full bg-[#f4f4f4]/90 dark:bg-[#1e1e1e]/90 sm:aspect-[1.34/1] lg:aspect-[1.38/1]">
                                {HERO_IMAGES.map((image, index) => (
                                    <div
                                        key={image.src}
                                        className={`absolute inset-0 z-0 flex items-center justify-center transition-opacity duration-1000 ease-out ${
                                            index === heroImageIndex ? 'opacity-100' : 'opacity-0'
                                        }`}
                                    >
                                        <div
                                            className="absolute inset-0 scale-105 bg-cover bg-center opacity-10 blur-2xl dark:opacity-30"
                                            style={{ backgroundImage: `url("${image.src}")` }}
                                        />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={image.src}
                                            alt={image.alt}
                                            className="relative z-10 h-[92%] w-[92%] object-contain"
                                        />
                                    </div>
                                ))}
                                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/5 via-transparent to-transparent dark:from-black/40" />

                                <div className="absolute inset-x-0 bottom-0 z-30 h-[2px] overflow-hidden bg-black/10 dark:bg-white/10">
                                    <div
                                        key={heroImageIndex}
                                        className="hero-image-progress h-full bg-ed-accent"
                                        style={{ animationDuration: `${HERO_ROTATION_MS}ms` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                <section
                    className="archive-cursor-field relative mx-auto max-w-[1440px] px-4 pb-8 pt-16 sm:px-6 lg:px-10 lg:pt-20"
                    onPointerMove={handlePathwayPointerMove}
                    style={{ '--cursor-x': '50%', '--cursor-y': '42%' } as React.CSSProperties}
                >
                    <div className="relative mb-10 flex min-h-[120px] flex-col items-center justify-end gap-6 pb-4 text-center lg:mb-12">
                        <div className="space-y-5">
                            <p className="text-sm uppercase tracking-[0.22em] text-ed-fg-muted">
                                Branches of the archive
                            </p>
                            <h2 className="whitespace-nowrap font-serif text-[clamp(2rem,5vw,3.75rem)] leading-[0.98] text-ed-fg">
                                Three pathways into the collection.
                            </h2>
                        </div>
                    </div>

                    <div className="relative space-y-16 lg:space-y-24">
                        <VideoArchiveSection />
                        <AudioArchiveSection />
                        {archiveBranches.map((branch) => (
                            <ArchiveBranch key={branch.numeral} {...branch} />
                        ))}
                    </div>
                </section>

            </main>


        </div>
    );
}

const QS01_BASE = '/content/audio/quran-studies/01%20Quran%20Study%20From%20Azhar%201%20Sura%2072%3B19%2028%20%26%20Sura%2073%20By%20Kathryn%20Jinns%2005%2026%201989';
const QS07_BASE = '/content/audio/quran-studies/07%20Quran%20Study%20From%20Azhar%207%20Sura%2062%20%26%20Sura%2063%20By%20Kathryn%20God%27s%20Religion%20Will%20Dominate%20In%2020%20To%2050%20Yr';

const AUDIO_CLIPS = [
    {
        id: 'qs01',
        label: 'Quran Study',
        title: 'Sura 72–73: Jinns & Night Prayer',
        src: `${QS01_BASE}/QS01.mp3`,
        thumb: `${QS01_BASE}/QS1.jpg`,
        excerpt: '[72:19] When GOD\'s servant advocated Him alone…',
    },
    {
        id: 'qs07',
        label: 'Quran Study',
        title: 'Sura 62–63: God\'s Religion Will Dominate',
        src: `${QS07_BASE}/QS07.mp3`,
        thumb: `${QS07_BASE}/QS7.jpg`,
        excerpt: '"The true Quran, the pure Quran, never existed in the past…"',
    },
];

const WAVEFORM = [0.25,0.45,0.75,0.55,0.85,0.40,0.65,0.90,0.50,0.70,0.35,0.80,0.60,0.45,0.75,0.55,0.90,0.40,0.65,0.85,0.50,0.70,0.30,0.80,0.60,0.45,0.75,0.90,0.35,0.65,0.80,0.50,0.70,0.40,0.85,0.60,0.45,0.75,0.55,0.90,0.30,0.65,0.80,0.50,0.70,0.40,0.85,0.60];

function formatTime(s: number): string {
    const sec = Math.floor(s % 60);
    const min = Math.floor(s / 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

type TranscriptCue = { start: number; end: number; text: string };

const CLIP_TRANSCRIPTS: Record<string, TranscriptCue[]> = {
    qs01: [
        { start: 0,  end: 2,  text: 'Dr. Khalifa: Our teacher is Catherine.' },
        { start: 3,  end: 5,  text: 'Dr. Khalifa: The new translation, page 573.' },
        { start: 6,  end: 13, text: "Catherine: And if you don't have your new translation, it's page 415 in the Quran." },
        { start: 15, end: 18, text: 'Bism Allah Arrahman Arraheem' },
    ],
    qs07: [
        { start: 1,  end: 7,  text: 'Dr. Khalifa: I think I need to start by making a momentous announcement.' },
        { start: 8,  end: 18, text: 'As you know, the true Quran, the pure Quran, never existed in the past.' },
    ],
};

function MiniAudioPlayer({
    src,
    maxSeconds,
    onProgress,
}: {
    src: string;
    maxSeconds: number;
    onProgress?: (sec: number) => void;
}) {
    const { darkMode } = useTheme();
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const rafRef = React.useRef<number>(0);
    const [playing, setPlaying] = React.useState(false);
    const [progress, setProgress] = React.useState(0);

    const stop = React.useCallback(() => {
        cancelAnimationFrame(rafRef.current);
        const el = audioRef.current;
        if (el) { el.pause(); el.currentTime = 0; }
        setPlaying(false);
        setProgress(0);
        onProgress?.(0);
    }, [onProgress]);

    React.useEffect(() => {
        const timer = window.setTimeout(() => stop(), 0);
        return () => window.clearTimeout(timer);
    }, [src, stop]);
    React.useEffect(() => () => { cancelAnimationFrame(rafRef.current); audioRef.current?.pause(); }, []);

    React.useEffect(() => {
        if (!playing) return;
        const tick = () => {
            const el = audioRef.current;
            if (!el) return;
            if (el.currentTime >= maxSeconds) { stop(); return; }
            const p = el.currentTime / maxSeconds;
            setProgress(p);
            onProgress?.(el.currentTime);
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [playing, maxSeconds, onProgress, stop]);

    const toggle = () => {
        const el = audioRef.current;
        if (!el) return;
        if (playing) { el.pause(); cancelAnimationFrame(rafRef.current); setPlaying(false); }
        else { el.play(); setPlaying(true); }
    };

    const playheadBar = Math.floor(progress * WAVEFORM.length);

    const dark = darkMode;
    const pillBg    = dark ? 'bg-[#141414] shadow-[inset_0_2px_10px_rgba(0,0,0,0.75),inset_0_0_0_1px_rgba(255,255,255,0.04)]'
                           : 'bg-[#ececec] shadow-[inset_0_2px_8px_rgba(0,0,0,0.10),inset_0_0_0_1px_rgba(0,0,0,0.06)]';
    const btnBg     = dark ? 'bg-[#0d0d0d] shadow-[inset_0_2px_6px_rgba(0,0,0,0.85),inset_0_0_0_1px_rgba(255,255,255,0.05)]'
                           : 'bg-white shadow-[inset_0_2px_5px_rgba(0,0,0,0.12),0_1px_0_rgba(255,255,255,0.9)]';
    const iconColor = dark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.60)';
    const barPlayed = '#f6ae82';
    const barRest   = dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
    const timeColor = dark ? 'text-white/30' : 'text-black/35';

    return (
        <div className={`flex items-center gap-3 rounded-full px-3 py-2.5 ${pillBg}`}>
            <audio ref={audioRef} src={src} />
            <button
                onClick={toggle}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition duration-300 active:scale-95 ${btnBg} ${playing ? 'shadow-[0_0_0_1px_rgba(246,174,130,0.4),0_0_15px_rgba(246,174,130,0.15)] scale-[1.02]' : ''}`}
            >
                {playing ? (
                    <span className="flex gap-[3px]">
                        <span className="block h-3 w-[3px] rounded-sm" style={{ backgroundColor: iconColor }} />
                        <span className="block h-3 w-[3px] rounded-sm" style={{ backgroundColor: iconColor }} />
                    </span>
                ) : (
                    <span className="ml-0.5 block border-y-[5px] border-l-[9px] border-y-transparent" style={{ borderLeftColor: iconColor }} />
                )}
            </button>
            <div className="relative flex flex-1 items-center gap-px overflow-hidden" style={{ height: 32 }}>
                {WAVEFORM.map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-full"
                        style={{
                            height: `${h * 100}%`,
                            backgroundColor: i < playheadBar ? barPlayed : barRest,
                        }}
                    />
                ))}
                <div
                    className="pointer-events-none absolute inset-y-0 flex flex-col items-center"
                    style={{ left: `calc(${progress * 100}% - 1px)`, willChange: 'left' }}
                >
                    <div className="absolute -top-0.5 h-2 w-2 -translate-x-[3px] rounded-full bg-ed-accent animate-pulse shadow-[0_0_6px_color-mix(in_srgb,var(--ed-accent)_80%,transparent)]" />
                    <div className="h-full w-px bg-ed-accent/90 shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_40%,transparent)]" />
                </div>
            </div>
            <span className={`shrink-0 font-mono text-xs tabular-nums ${timeColor}`}>
                {formatTime(progress * maxSeconds)}
            </span>
        </div>
    );
}

function AudioArchiveSection() {
    const { darkMode } = useTheme();
    const [selected, setSelected] = React.useState(0);
    const [currentSec, setCurrentSec] = React.useState(0);
    const clip = AUDIO_CLIPS[selected];
    const cues = CLIP_TRANSCRIPTS[clip.id] ?? [];
    const activeCue = cues.find(c => currentSec >= c.start && currentSec < c.end) ?? null;

    return (
        <article className="soft-shell grid gap-8 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="space-y-6">
                <div className="flex flex-col gap-5 border-b border-ed-rule pb-5 sm:flex-row sm:items-end">
                    <div className="flex items-end">
                        <span className="font-serif text-6xl leading-none text-transparent bg-clip-text bg-gradient-to-b from-ed-accent to-ed-accent-soft sm:text-7xl drop-shadow-[0_0_15px_color-mix(in_srgb,var(--ed-accent)_30%,transparent)]">II</span>
                    </div>
                    <h3 className="font-serif text-4xl leading-[0.98] text-transparent bg-clip-text bg-gradient-to-br from-ed-fg via-ed-fg to-ed-fg-muted sm:text-5xl lg:whitespace-nowrap">The Audio Archives</h3>
                </div>
                <div className="space-y-4">
                    <p className="max-w-[64ch] text-[15px] leading-8 text-ed-fg-muted">
                        Consists of Quran Studies and Messenger Audios to browse through.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <ExpectationCard title="Study sessions" body="Quran studies organized by sequence, topic, and transcript moments." />
                    <ExpectationCard title="Messenger recordings" body="Preserved talks and historical audio with context for careful listening." />
                    <ExpectationCard title="Read along" body="Synchronized transcripts make it possible to listen, quote, and return." />
                    <ExpectationCard title="Useful previews" body="Use the example display on the right to see a sample of how the Audios work with a live transcript." />
                </div>
                <SectionCta href="/audios" label="Browse the audio archive" />
            </div>

            <div className="relative rounded-[1.25rem] p-[1px] overflow-hidden shadow-[0_0_30px_0_color-mix(in_srgb,var(--ed-accent)_6%,transparent)]">
                {/* Rotating glow for the slideshow frame */}
                <div className="absolute inset-[-100%] z-0 animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,color-mix(in_srgb,var(--ed-accent)_40%,transparent)_15%,transparent_20%)]" />
                
                <div className="relative z-10 flex flex-col h-full overflow-hidden rounded-[1.25rem] bg-ed-bg/95 p-2 backdrop-blur-xl">
                <div className="soft-pill mx-2 mt-2 flex items-center justify-between px-5 py-3 text-xs uppercase tracking-[0.18em] text-ed-fg-muted">
                    <span>Audio Archive</span>
                    <span>{selected + 1} / {AUDIO_CLIPS.length}</span>
                </div>

                <div className="relative mx-2 mt-3 overflow-hidden rounded-[1.65rem] bg-[#111111] p-3 text-[#f6efe4]">
                    <div
                        className="absolute inset-0 scale-105 bg-cover bg-center opacity-25 blur-xl"
                        style={{ backgroundImage: `url("${clip.thumb}")` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/64 to-[#111111]/14" />
                    <div className="relative grid gap-4 sm:grid-cols-[132px_1fr] sm:items-end">
                        <div className="relative aspect-square overflow-hidden rounded-[1.2rem] border border-[#f6efe4]/10 bg-[#181817] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={clip.thumb} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/34 to-transparent" />
                        </div>
                        <div className="min-w-0 space-y-4 pb-1">
                            <div className="space-y-2">
                                <p className="text-xs uppercase tracking-[0.18em] text-[#f6ae82]">
                                    {clip.label}
                                </p>
                                <h4 className="font-serif text-2xl leading-tight text-[#f6efe4] sm:text-3xl">
                                    {clip.title}
                                </h4>
                                <p className="max-w-[44ch] text-sm leading-6 text-[#cbbca9]">
                                    {clip.excerpt}
                                </p>
                            </div>
                            <MiniAudioPlayer src={clip.src} maxSeconds={18} onProgress={setCurrentSec} />
                        </div>
                    </div>
                </div>

                <div className="grid gap-2 p-2 sm:grid-cols-2">
                    {AUDIO_CLIPS.map((c, i) => (
                        <button
                            key={c.id}
                            onClick={() => { setSelected(i); setCurrentSec(0); }}
                            className={`relative flex w-full gap-3 rounded-[1.35rem] border px-3 py-3 text-left transition ${
                                i === selected
                                    ? 'border-ed-accent/32 bg-ed-accent/8 text-ed-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                                    : 'border-ed-rule bg-ed-surface/44 text-ed-fg-muted hover:text-ed-fg'
                            }`}
                        >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] border border-ed-rule">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={c.thumb} alt="" className={`h-full w-full object-cover ${i === selected ? '' : 'grayscale'}`} />
                                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${i === selected ? 'bg-[#111111]/45 opacity-100' : 'opacity-0'}`}>
                                    <span className="block border-y-[5px] border-l-[8px] border-y-transparent border-l-[#f6ae82]" />
                                </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[0.68rem] uppercase tracking-[0.18em] text-ed-accent">{c.label}</p>
                                    <p className={`font-mono text-[0.68rem] tabular-nums ${i === selected ? 'text-ed-accent' : 'text-ed-fg-muted'}`}>
                                        {String(i + 1).padStart(2, '0')}
                                    </p>
                                </div>
                                <p className={`line-clamp-2 text-sm leading-snug transition-colors ${i === selected ? 'font-semibold text-ed-fg' : 'font-medium text-ed-fg/70'}`}>
                                    {c.title}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="hidden">
                    <p className={`mb-2.5 text-[0.58rem] uppercase tracking-[0.22em] ${darkMode ? 'text-white/25' : 'text-black/30'}`}>
                        Preview — first 18 seconds
                    </p>
                    <MiniAudioPlayer src={clip.src} maxSeconds={18} onProgress={setCurrentSec} />
                </div>

                <div className={`soft-panel mx-2 mb-2 px-5 py-4 ${darkMode ? 'bg-[#0d0d0d]' : 'bg-[#e8e4de]'}`}>
                    <p className={`mb-3 text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-white/26' : 'text-black/35'}`}>
                        Transcript
                    </p>
                    <div className="space-y-2">
                        {cues.map((cue, i) => {
                            const isActive = cue === activeCue;
                            return (
                                <p
                                    key={i}
                                    className="text-[15px] leading-6 transition-all duration-300 ease-out"
                                    style={{
                                        color: isActive
                                            ? (darkMode ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)')
                                            : (darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)'),
                                        fontWeight: isActive ? 500 : 400,
                                        transform: isActive ? 'translateX(6px) scale(1.02)' : 'translateX(0) scale(1)',
                                        textShadow: isActive && darkMode ? '0 0 15px rgba(255,255,255,0.3)' : 'none',
                                    }}
                                >
                                    {isActive && (
                                        <span className="mr-3 inline-block h-2 w-2 translate-y-[-1px] rounded-full bg-ed-accent shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_60%,transparent)] animate-[pulse_1s_ease-in-out_infinite]" />
                                    )}
                                    {cue.text}
                                </p>
                            );
                        })}
                        {cues.length === 0 && (
                            <p className={`text-[0.78rem] ${darkMode ? 'text-white/20' : 'text-black/25'}`}>
                                Press play to follow along.
                            </p>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </article>
    );
}

function SectionCta({ href, label }: { href: string; label: string }) {
    return (
        <div className="rounded-[2rem] bg-ed-surface p-1.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.16),inset_0_0_0_1px_rgba(0,0,0,0.08)]">
            <Link
                href={href}
                className="flex w-full items-center justify-center gap-3 rounded-[1.65rem] bg-ed-accent px-6 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[#1a0e00] shadow-[0_2px_12px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.18)] transition hover:opacity-90 active:scale-[0.995]"
            >
                {label}
                <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
    );
}

function ExpectationCard({ title, body }: { title: string; body: string }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 bg-black/[0.02] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] hover:bg-black/[0.04] hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12),0_10px_40px_rgba(0,0,0,0.08)] dark:bg-[#0a0a0a]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-[#0a0a0a]/60 dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15),0_10px_40px_rgba(0,0,0,0.4)]">
            {/* Hover Spotlight Glow */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-40 w-40 rounded-full bg-[var(--ed-accent)] opacity-0 blur-[40px] transition-opacity duration-500 group-hover:opacity-10 dark:blur-[50px] dark:group-hover:opacity-20" />
            
            <div className="relative z-10">
                <div className="flex items-center gap-2">
                    {/* Glowing Accent Dot */}
                    <span className="h-1.5 w-1.5 rounded-full bg-ed-accent shadow-[0_0_6px_var(--ed-accent)] dark:shadow-[0_0_8px_var(--ed-accent)]" />
                    <h4 className="text-[15px] font-medium tracking-wide text-ed-fg">
                        {title}
                    </h4>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ed-fg-muted">
                    {body}
                </p>
            </div>
        </div>
    );
}

const VIDEO_SLIDES = [
    { src: '/images/sermons/Dr._Rashad_Khalifa_1987_Khutbha_Friday_Sermon_1KLZxgpGMqs.jpg', category: 'Friday Sermon', title: '1987 Khutbah' },
    { src: '/images/video-programs/Mathematical_Miracle_of_Quran.jpg', category: 'Instructional Program', title: 'Mathematical Miracle of the Quran' },
    { src: '/images/sermons/Dr._Rashad_Khalifas_Friday_Sermons_1989_1_UouRqqmb7vU.jpg', category: 'Friday Sermon', title: 'Friday Sermons, 1989' },
    { src: '/images/video-programs/Final_Speech_by_Dr._Rashad_Khalifa_1989_Conference.jpg', category: 'USI Conference', title: 'Final Speech — 1989 Conference' },
    { src: '/images/video-programs/Essentials_of_Submission_Islam.jpg', category: 'Instructional Program', title: 'Essentials of Submission' },
    { src: '/images/video-programs/Principles_of_Contact_Prayers_Salat.jpg', category: 'Instructional Program', title: 'Contact Prayers (Salat)' },
];

function VideoArchiveSection() {
    const [current, setCurrent] = React.useState(0);
    const [visible, setVisible] = React.useState(true);
    const currentRef = React.useRef(0);

    React.useEffect(() => {
        currentRef.current = current;
    }, [current]);

    const goTo = React.useCallback((i: number) => {
        setVisible(false);
        setTimeout(() => { setCurrent(i); setVisible(true); }, 380);
    }, []);

    React.useEffect(() => {
        const timer = setInterval(() => {
            goTo((currentRef.current + 1) % VIDEO_SLIDES.length);
        }, 3800);
        return () => clearInterval(timer);
    }, [goTo]);

    const slide = VIDEO_SLIDES[current];

    return (
        <article className="soft-shell grid gap-8 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="space-y-6">
                <div className="flex flex-col gap-5 border-b border-ed-rule pb-5 sm:flex-row sm:items-end">
                    <div className="flex items-end">
                        <span className="font-serif text-6xl leading-none text-transparent bg-clip-text bg-gradient-to-b from-ed-accent to-ed-accent-soft sm:text-7xl drop-shadow-[0_0_15px_color-mix(in_srgb,var(--ed-accent)_30%,transparent)]">I</span>
                    </div>
                    <h3 className="font-serif text-4xl leading-[0.98] text-transparent bg-clip-text bg-gradient-to-br from-ed-fg via-ed-fg to-ed-fg-muted sm:text-5xl lg:whitespace-nowrap">Video Archive</h3>
                </div>
                <div className="space-y-4">
                    <p className="max-w-[64ch] text-[15px] leading-8 text-ed-fg-muted">
                        Friday sermons, instructional video programs, and United Submitters International conference recordings — preserved as a comprehensive visual study collection.
                    </p>
                </div>
                <div className="hidden">
                    <p className="text-[0.62rem] uppercase tracking-[0.24em] text-ed-accent">What&apos;s in the archive</p>
                    <ul className="space-y-1 text-sm leading-7 text-ed-fg-muted list-none">
                        <li>Weekly Friday sermons, 1986–1990</li>
                        <li>Instructional programs on Quranic study</li>
                        <li>USI conference recordings and speeches</li>
                        <li>Debate programs and public appearances</li>
                    </ul>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <ExpectationCard title="Friday sermons" body="Chronological sermon recordings with preserved titles, dates, and playable pages." />
                    <ExpectationCard title="Instructional programs" body="Watch explanations from Dr. Khalifa on The Contact Prayers, Ablution, The Essentials of Submission, and more." />
                    <ExpectationCard title="Conference footage" body="USI Conferences, public talks, and speeches displayed." />
                    <ExpectationCard title="Visual context" body="Thumbnails and transcript links help you understand what each recording contains." />
                </div>
                <SectionCta href="/videos" label="Browse the video archive" />
            </div>

            <div className="relative rounded-[1.25rem] p-[1px] overflow-hidden shadow-[0_0_30px_0_color-mix(in_srgb,var(--ed-accent)_6%,transparent)]">
                {/* Rotating glow for the slideshow frame */}
                <div className="absolute inset-[-100%] z-0 animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,color-mix(in_srgb,var(--ed-accent)_40%,transparent)_15%,transparent_20%)]" />
                
                <div className="relative z-10 flex flex-col h-full min-h-[440px] overflow-hidden rounded-[1.25rem] bg-ed-bg/95 p-3 backdrop-blur-xl">
                <div
                    className="absolute inset-0 scale-105 bg-cover bg-center opacity-30 blur-2xl"
                    style={{ backgroundImage: `url("${slide.src}")` }}
                />
                <div className="absolute inset-0 bg-ed-bg/64" />

                <div className="soft-pill absolute inset-x-5 top-5 z-30 flex items-center justify-between px-5 py-3 text-xs uppercase tracking-[0.18em] text-ed-fg-muted backdrop-blur-sm">
                    <span>Video Archive</span>
                    <span>{current + 1} / {VIDEO_SLIDES.length}</span>
                </div>

                <div className="relative z-10 flex h-full min-h-[416px] items-end pt-16">
                    <div className="relative w-full overflow-hidden rounded-[1.55rem] border border-ed-rule bg-[#111111] shadow-[0_28px_80px_rgba(0,0,0,0.24)]">
                        <div className="relative aspect-video overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={slide.src}
                                alt={slide.title}
                                className="h-full w-full object-cover"
                                style={{
                                    filter: 'saturate(0.78) contrast(1.04)',
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? 'scale(1)' : 'scale(1.05)',
                                    transition: 'opacity 0.4s ease, transform 4s ease-out',
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/86 via-[#111111]/18 to-transparent" />
                            <div className="absolute left-5 top-5 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#f6efe4]/16 bg-[#111111]/70 text-[#f6efe4] shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-ed-accent hover:text-[#111111] hover:shadow-[0_0_15px_color-mix(in_srgb,var(--ed-accent)_40%,transparent)]">
                                <Play className="ml-0.5 h-4 w-4 fill-current" />
                            </div>
                            <div
                                className="absolute inset-x-0 bottom-0 p-5 sm:p-6"
                                style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.38s ease' }}
                            >
                                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#f6ae82]">{slide.category}</p>
                                <p className="max-w-xl font-serif text-2xl leading-tight text-[#f6efe4] sm:text-3xl">{slide.title}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-8 z-30 flex items-center gap-2">
                    {VIDEO_SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`h-1.5 rounded-full transition-all duration-300 ease-out ${i === current ? 'w-8 bg-ed-accent shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_80%,transparent)]' : 'w-2 bg-ed-rule hover:w-4 hover:bg-ed-fg-muted'}`}
                        />
                    ))}
                </div>
            </div>
            </div>
        </article>
    );
}

function SearchFunctionDemo() {
    return (
        <div className="relative w-full overflow-hidden rounded-[1.25rem] bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_80px_rgba(0,0,0,0.5)]">
            {/* Desktop Background Ambient Glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-60">
                <div className="h-[400px] w-[800px] rounded-full bg-[var(--ed-accent)] blur-[120px]" />
                <div className="absolute h-[300px] w-[500px] rounded-full bg-ed-accent-soft blur-[100px]" />
            </div>

            {/* Fake macOS Menu Bar */}
            <div className="relative z-10 flex w-full items-center justify-between px-4 py-1.5 text-[11px] font-medium text-white/70 bg-black/20 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-white tracking-wide">Submission Archives</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">File</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Edit</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">View</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Go</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Window</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Help</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline opacity-50">100%</span>
                    <span>Mon Jun 22 9:41 AM</span>
                </div>
            </div>

            {/* The Floating App Window Container */}
            <div className="relative z-20 mx-auto mt-10 mb-16 max-w-[90%] sm:max-w-[85%]">
                <div className="relative rounded-[1.25rem] p-[1px] overflow-hidden shadow-[0_0_40px_0_color-mix(in_srgb,var(--ed-accent)_10%,transparent),0_40px_80px_rgba(0,0,0,0.6)]">
                    {/* Rotating Raycast Glow for the App Window itself */}
                    <div className="absolute inset-[-100%] z-0 animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,color-mix(in_srgb,var(--ed-accent)_60%,transparent)_15%,transparent_20%)]" />
                    
                    <div className="relative z-10 flex min-h-[620px] flex-col overflow-hidden rounded-[1.25rem] bg-ed-bg/85 px-4 py-8 sm:px-8 backdrop-blur-[30px]">
                        {/* Premium Raycast-style Spotlight Background */}
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85.77%_49.97%_at_51%_5.12%,color-mix(in_srgb,var(--ed-accent)_8%,transparent)_0%,color-mix(in_srgb,var(--ed-primary)_6%,transparent)_45.83%,transparent_100%)]" />

                <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-5">

                {/* Phase indicator dots */}
                <div className="flex items-center justify-center gap-3 pb-1">
                    {[
                        { cls: 'search-demo-phase-1', label: 'Search' },
                        { cls: 'search-demo-phase-2', label: 'Results' },
                        { cls: 'search-demo-phase-3', label: 'Select' },
                        { cls: 'search-demo-phase-4', label: 'Play' },
                    ].map((dot) => (
                        <div key={dot.label} className="flex items-center gap-1.5">
                            <span className={`${dot.cls} inline-block h-1.5 w-1.5 rounded-full`} />
                            <span className="text-[0.56rem] uppercase tracking-[0.2em] text-ed-fg-muted">{dot.label}</span>
                        </div>
                    ))}
                </div>

                {/* ═══════ SCENE 1: Search Page ═══════ */}
                <div className="search-demo-scene-search">
                    {/* Search Input Bar */}
                    <div className="relative mb-5 w-full">
                        <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-ed-fg-muted" />
                        <div className="soft-pill relative flex w-full items-center bg-ed-surface px-12 py-4 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] sm:py-5">
                            <span className="flex min-w-0 flex-1 items-center font-sans text-sm text-ed-fg sm:text-base">
                                <span className="search-demo-type inline-block max-w-full overflow-hidden whitespace-nowrap align-bottom">
                                    covenant mathematical miracle
                                </span>
                                <span className="search-demo-caret ml-px inline-block h-5 w-[8px] animate-[pulse_1s_step-end_infinite] bg-ed-accent shadow-[0_0_10px_color-mix(in_srgb,var(--ed-accent)_80%,transparent)]" />
                            </span>
                        </div>
                        <div className="soft-pill absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-ed-bg px-4 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-ed-fg shadow-sm sm:px-5 sm:py-2.5">
                            Search
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="mb-5 flex flex-wrap justify-center gap-2">
                        {['Videos', 'Quran Studies', 'Messenger Audios', 'Perspectives', 'Appendices'].map((item, index) => {
                            const active = index < 3;
                            return (
                                <span
                                    key={item}
                                    className={`soft-pill px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] transition sm:px-4 sm:py-2 sm:text-[0.68rem] ${
                                        active
                                            ? 'border-ed-accent/50 bg-ed-accent/12 text-ed-accent shadow-[inset_0_0_8px_color-mix(in_srgb,var(--ed-accent)_20%,transparent)]'
                                            : 'border-ed-rule bg-ed-surface text-ed-fg-muted'
                                    }`}
                                >
                                    {item}
                                </span>
                            );
                        })}
                    </div>

                    {/* Result Cards */}
                    <div className="relative space-y-3">
                        {/* Result 1 — selected */}
                        <div className="search-demo-result-1">
                            <article className="search-demo-selected soft-shell relative overflow-hidden transition-all backdrop-brightness-110 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] bg-white/5">
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ed-accent/10 to-transparent opacity-50" />
                                <div className="relative z-10 grid grid-cols-[80px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr] sm:gap-4 sm:p-4">
                                    <div className="soft-panel relative aspect-video overflow-hidden bg-ed-bg shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                        <Image src={getPublicAssetUrl('/content/audio/quran-studies/45 Quran Study From Roxana 445 Sura 40 By Rashad Firoz\'s Home Deja Vu Believers Usually 95 Yrs Old F/QS45.jpg')} alt="Quran Study 45" fill className="object-cover" sizes="120px" unoptimized />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">01</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-fg-muted">Quran Studies</span>
                                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.18em] text-ed-accent">Best match</span>
                                        </div>
                                        <h3 className="mt-2 font-display text-lg leading-tight text-ed-fg sm:text-2xl">Quran Study 45: Sura 40 & Firoz's Home</h3>
                                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-ed-fg-muted">
                                            ...So, this is God's <span className="font-semibold text-ed-accent drop-shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_50%,transparent)]">mathematical</span> confirmation that we're living in an age where God will send the messenger of the <span className="font-semibold text-ed-accent drop-shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_50%,transparent)]">covenant</span>...
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>

                        {/* Result 2 */}
                        <div className="search-demo-result-2">
                            <article className="soft-shell overflow-hidden">
                                <div className="grid grid-cols-[80px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr] sm:gap-4 sm:p-4">
                                    <div className="soft-panel relative aspect-video overflow-hidden bg-ed-bg">
                                        <Image src="/images/video-programs/_Old_Message_New_Messenger.jpg" alt="Old Message New Messenger" fill className="object-cover" sizes="120px" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">02</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-fg-muted">Videos</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.18em] text-ed-fg-muted">Close match</span>
                                        </div>
                                        <h3 className="mt-2 font-display text-lg leading-tight text-ed-fg sm:text-2xl">Old Message New Messenger</h3>
                                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-ed-fg-muted">
                                            ...the <span className="font-semibold text-ed-accent">covenant</span> was fulfilled through a <span className="font-semibold text-ed-accent">mathematical</span> code...
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>

                        {/* Result 3 */}
                        <div className="search-demo-result-3">
                            <article className="soft-shell overflow-hidden">
                                <div className="grid grid-cols-[80px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr] sm:gap-4 sm:p-4">
                                    <div className="soft-panel relative aspect-video overflow-hidden bg-ed-bg">
                                        <Image src="/images/messenger-audios/default.jpg" alt="Messenger Audio" fill className="object-cover" sizes="120px" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">03</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-fg-muted">Messenger Audios</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.18em] text-ed-fg-muted">Relevant</span>
                                        </div>
                                        <h3 className="mt-2 font-display text-lg leading-tight text-ed-fg sm:text-2xl">Messenger Audio 14</h3>
                                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-ed-fg-muted">
                                            ...this is a <span className="font-semibold text-ed-accent">miracle</span> from God, a proven <span className="font-semibold text-ed-accent">covenant</span>...
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>

                        {/* Scroll indicator */}
                        <div className="search-demo-scroll flex justify-center pt-2">
                            <div className="flex flex-col items-center gap-1 text-ed-fg-muted">
                                <span className="text-[0.56rem] uppercase tracking-[0.22em]">Selecting best result</span>
                                <ArrowRight className="h-3 w-3 rotate-90" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════ SCENE 2: Quran Study Media Page ═══════ */}
                <div className="search-demo-scene-transcript absolute inset-0 flex flex-col px-4 pt-14 sm:px-8">
                    <div className="mx-auto w-full max-w-4xl">
                        {/* Back nav + category */}
                        <div className="mb-4 flex items-center gap-3">
                            <span className="soft-pill px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-ed-fg-muted">
                                &#8592; Back to results
                            </span>
                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">
                                Quran Studies
                            </span>
                        </div>

                        {/* Quran Study title + thumbnail */}
                        <div className="mb-5 flex items-start gap-4">
                            <div className="soft-panel relative hidden aspect-video w-[140px] shrink-0 overflow-hidden sm:block">
                                <Image src={getPublicAssetUrl('/content/audio/quran-studies/45 Quran Study From Roxana 445 Sura 40 By Rashad Firoz\'s Home Deja Vu Believers Usually 95 Yrs Old F/QS45.jpg')} alt="Quran Study 45" fill className="object-cover" sizes="140px" unoptimized />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-display text-2xl leading-tight text-ed-fg sm:text-3xl">
                                    Quran Study 45: Sura 40 & Firoz's Home
                                </h3>
                                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted">
                                    Quran Study 45 &middot; From Roxana
                                </p>
                            </div>
                        </div>

                        {/* Transcript passage with highlight */}
                        <div className="soft-shell p-4 sm:p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ed-accent">Best passage</span>
                                <span className="soft-pill bg-ed-bg px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted">
                                    Jump to 07:01
                                </span>
                            </div>
                            <p className="text-[15px] leading-8 text-ed-fg">
                                So, this is, this is God's
                                {' '}<span className="search-demo-highlight font-semibold text-ed-accent">mathematical</span>{' '}
                                confirmation that we're living in an age where God will send the messenger of the
                                {' '}<span className="search-demo-highlight font-semibold text-ed-accent">covenant</span>.
                            </p>
                        </div>

                        {/* Player */}
                        <div className="search-demo-player mt-5">
                            <div className="soft-shell bg-ed-surface px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                                <div className="mb-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted">Now playing at matched timestamp</p>
                                        <p className="mt-1 text-sm text-ed-fg">Quran Study 45 &mdash; Sura 40</p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ed-accent text-[#111111] shadow-[0_0_30px_rgba(246,174,130,0.22)]">
                                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-ed-accent">07:01</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ed-rule">
                                        <div className="search-demo-progress h-full rounded-full bg-ed-accent" />
                                    </div>
                                    <span className="font-mono text-xs text-ed-fg-muted">45:12</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

            </div>
            </div>
            </div>
        </div>
    );
}


function ArchiveBranch({
    numeral,
    title,
    body,
    href,
    cta,
    cardTitle,
    details,
    icon: Icon,
    align,
    kind,
}: {
    numeral: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    cardTitle: string;
    details: Array<{ title: string; body: string }>;
    icon: React.ComponentType<{ className?: string }>;
    align: 'left' | 'right' | 'center';
    kind?: 'search';
}) {
    const isRight = align === 'right';
    const isCenter = align === 'center';

    return (
        <article
            className={`soft-shell grid gap-8 p-5 sm:p-7 lg:p-8 ${
                isCenter ? 'mx-auto w-full max-w-6xl lg:grid-cols-[1fr]' : 'lg:grid-cols-[0.95fr_1.05fr]'
            }`}
        >
            <div className={`${isRight ? 'lg:order-2' : ''} ${isCenter ? 'mx-auto max-w-4xl text-center' : ''} space-y-6`}>
                <div className={`flex flex-col gap-5 border-b border-ed-rule pb-5 sm:flex-row sm:items-end ${isCenter ? 'justify-center' : ''}`}>
                    <div className={`flex items-end ${isCenter ? 'justify-center' : ''}`}>
                        <span className="font-serif text-6xl leading-none text-transparent bg-clip-text bg-gradient-to-b from-ed-accent to-ed-accent-soft sm:text-7xl drop-shadow-[0_0_15px_color-mix(in_srgb,var(--ed-accent)_30%,transparent)]">
                            {numeral}
                        </span>
                    </div>
                    <h3 className="font-serif text-4xl leading-[0.98] text-transparent bg-clip-text bg-gradient-to-br from-ed-fg via-ed-fg to-ed-fg-muted sm:text-5xl lg:whitespace-nowrap">
                        {title}
                    </h3>
                </div>

                <div className="space-y-4">
                    <p className={`${isCenter ? 'mx-auto lg:max-w-none lg:whitespace-nowrap' : ''} max-w-[68ch] text-[15px] leading-8 text-ed-fg-muted`}>
                        {body}
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    {details.map((item) => (
                        <ExpectationCard key={item.title} title={item.title} body={item.body} />
                    ))}
                </div>

                <SectionCta href={href} label={cta} />
            </div>

            <div className={`${isRight ? 'lg:order-1' : ''} ${isCenter ? 'mx-auto w-full max-w-5xl' : ''}`}>
                {kind === 'search' ? (
                    <SearchFunctionDemo />
                ) : (
                    <div className="relative rounded-[1.25rem] p-[1px] overflow-hidden shadow-[0_0_30px_0_color-mix(in_srgb,var(--ed-accent)_6%,transparent)]">
                        {/* Rotating glow for the slideshow frame */}
                        <div className="absolute inset-[-100%] z-0 animate-[spin_6s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0%,color-mix(in_srgb,var(--ed-accent)_40%,transparent)_15%,transparent_20%)]" />
                        
                        <div className="relative z-10 flex flex-col h-full min-h-[320px] overflow-hidden rounded-[1.25rem] bg-ed-bg/95 p-3 backdrop-blur-xl sm:min-h-[360px] sm:p-4">
                            <div className="archive-soft-orb absolute inset-0" />
                            <div className="relative flex h-full flex-col justify-between">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="inline-flex h-12 w-12 items-center justify-center border border-ed-rule bg-ed-surface text-ed-accent">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <p className="max-w-[18ch] text-right text-[0.58rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                        Archival Record
                                    </p>
                                </div>

                        <div className="space-y-4">
                            <div className="h-px w-24 bg-ed-rule" />
                            <h4 className="whitespace-pre-line font-serif text-3xl leading-tight text-ed-fg sm:text-4xl">
                                {cardTitle}
                            </h4>
                            <p className="max-w-[34ch] text-sm leading-7 text-ed-fg-muted">
                                Watch, Listen, and Search a variety of materials.
                            </p>
                        </div>

                        <div className="grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-2">
                            <div className="bg-ed-surface px-4 py-4">
                                <p className="text-[0.56rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    Orientation
                                </p>
                                <p className="mt-2 text-sm text-ed-fg/76">Editorial, spare, tactile</p>
                            </div>
                            <div className="bg-ed-surface px-4 py-4">
                                <p className="text-[0.56rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    Behavior
                                </p>
                                <p className="mt-2 text-sm text-ed-fg/76">Readable first, product second</p>
                            </div>
                        </div>
                    </div>
                    </div>
                    </div>
                )}
            </div>
        </article>
    );
}

