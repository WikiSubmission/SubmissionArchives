'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play, BookOpen, Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { Reveal } from './Reveal';
import { useAutoplayCarousel } from './useAutoplayCarousel';
import { GlassSheen, chromeButtonClass } from './WidgetAccents';

const HERO_IMAGES = [
    {
        src: '/images/archive-photos/M3.png',
        alt: 'Dr. Rashad Khalifa archival photograph',
        label: 'Archive Plate 01 · Historical Portrait',
    },
    {
        src: '/images/archive-photos/M1.png',
        alt: 'Dr. Rashad Khalifa with submitters in Tucson, Arizona',
        label: 'Archive Plate 02 · Tucson Community',
    },
    {
        src: '/images/archive-photos/M2.png',
        alt: 'Dr. Rashad Khalifa delivering a lecture at the annual conference',
        label: 'Archive Plate 03 · Annual Conference',
    },
    {
        src: '/images/archive-photos/M4.jpeg',
        alt: 'Archival scene from Tucson mosque',
        label: 'Archive Plate 04 · Preservation Record',
    },
] as const;

const ARCHIVE_PORTALS = [
    {
        title: 'Scriptures',
        badge: '5 Canons',
        desc: '114 Surahs, 38 Appendices, 39 OT, 15 Apocrypha & 27 NT books',
        href: '/scripture/quran',
    },
    {
        title: 'Audio Archives',
        badge: '600+ Audios',
        desc: 'Friday sermons, Qur\'an studies & synchronized speech transcripts',
        href: '/audios',
    },
    {
        title: 'Video Lectures',
        badge: '300+ Videos',
        desc: 'Historic sermons, conferences, televised programs & debates',
        href: '/videos',
    },
    {
        title: 'Written Library',
        badge: '74 Publications',
        desc: '10 Published books, 64 monthly newsletters & scanned facsimiles',
        href: '/written',
    },
    {
        title: 'Universal Search',
        badge: 'Deep Search',
        desc: 'Full-text query across every transcript, newsletter & verse',
        href: '/search',
    },
] as const;

const HERO_ROTATION_MS = 7_000;

export function HeroSection() {
    const {
        rootRef,
        index,
        next,
        previous,
        isManuallyPaused,
        setIsManuallyPaused,
        interactionProps,
        dragOffsetPx,
        isDragging,
    } = useAutoplayCarousel({
        count: HERO_IMAGES.length,
        intervalMs: HERO_ROTATION_MS,
    });

    const activeImage = HERO_IMAGES[index];

    return (
        <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ed-bg border-b border-ed-rule pb-12 pt-6 sm:pb-20 sm:pt-10">
            {/* Background Ambient Glow */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-ed-ambient-1 blur-[140px]" />
                <div className="absolute -left-32 top-1/2 h-[400px] w-[400px] rounded-full bg-ed-ambient-2 blur-[140px]" />
                <Image
                    src="/assets/brand/submission-archives-mark.png"
                    alt=""
                    width={500}
                    height={500}
                    priority
                    loading="eager"
                    className="absolute -right-24 -top-20 hidden w-[34rem] select-none opacity-[0.03] grayscale lg:block dark:opacity-[0.05]"
                    aria-hidden="true"
                />
            </div>

            <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
                {/* Hero Main Grid */}
                <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
                    <div className="max-w-2xl">
                        <Reveal delay={80} className="flex justify-center sm:justify-start">
                            <h1 id="hero-title" className="flex flex-col text-ed-fg w-fit items-center sm:items-start text-center sm:text-left">
                                <span className="block font-sans text-[clamp(2.5rem,7.5vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[-0.035em]">
                                    Submission
                                </span>
                                <span className="mt-2 block w-full border border-ed-fg bg-ed-surface-strong px-5 py-2.5 text-center font-slab text-[clamp(2.6rem,8vw,4.75rem)] font-black italic uppercase leading-none tracking-[-0.03em] text-ed-fg">
                                    Archives
                                </span>
                            </h1>
                        </Reveal>

                        <Reveal delay={160} className="mt-5 sm:mt-6">
                            <p className="max-w-[54ch] text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg text-center sm:text-left mx-auto sm:mx-0 font-sans">
                                The comprehensive digital repository dedicated to the permanent preservation of historical audio recordings, video lectures, authorized scripture translations, and published works of Dr. Rashad Khalifa.
                            </p>
                        </Reveal>

                        <Reveal delay={240}>
                            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center justify-center sm:justify-start">
                                <Link href="/search" className="archive-button archive-button-primary group px-7 active:scale-[0.98]">
                                    <Search className="h-4 w-4" />
                                    Search entire archive
                                    <ArrowRight
                                        className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                                        aria-hidden="true"
                                    />
                                </Link>
                                <Link href="/scripture/quran" className="archive-button archive-button-secondary px-7 active:scale-[0.98]">
                                    <BookOpen className="h-4 w-4" />
                                    Open Scripture Reader
                                </Link>
                            </div>
                        </Reveal>
                    </div>

                    {/* Interactive Archival Carousel */}
                    <Reveal delay={220} className="relative">
                        <div
                            ref={rootRef}
                            {...interactionProps}
                            className="group/hero-carousel relative mx-auto w-full max-w-[44rem] overflow-hidden rounded-3xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/95 via-ed-surface/85 to-ed-surface/65 p-4 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-2xl transition-all duration-300 hover:border-ed-fg/40 sm:p-6"
                        >
                            <GlassSheen />
                            <div className="flex items-center justify-between border-b border-ed-rule pb-3.5 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5" aria-hidden="true">
                                        <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
                                        <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
                                        <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                                    </div>
                                    <span className="h-3.5 w-px bg-ed-rule-strong/60" aria-hidden="true" />
                                    <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                        Historical Record · <span className="text-ed-fg font-bold">{activeImage.label.split('·')[1] || activeImage.label}</span>
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <CarouselButton label="Previous photograph" onClick={previous}>
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                    </CarouselButton>

                                    <CarouselButton
                                        label={isManuallyPaused ? 'Play photo rotation' : 'Pause photo rotation'}
                                        onClick={() => setIsManuallyPaused(!isManuallyPaused)}
                                        pressed={isManuallyPaused}
                                    >
                                        {isManuallyPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                                    </CarouselButton>

                                    <CarouselButton label="Next photograph" onClick={next}>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </CarouselButton>
                                </div>
                            </div>

                            <div
                                className="relative mt-3.5 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-ed-bg sm:mt-4 shadow-inner"
                                style={{
                                    transform: dragOffsetPx ? `translateX(${dragOffsetPx}px)` : undefined,
                                    transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.32,0.72,0,1)',
                                }}
                            >
                                <Image
                                    src={activeImage.src}
                                    alt={activeImage.alt}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 44rem"
                                    className="object-cover transition-opacity duration-700 ease-in-out"
                                    priority
                                    loading="eager"
                                />
                            </div>
                        </div>
                    </Reveal>
                </div>

                {/* 5 Portals Navigation Ribbon */}
                <Reveal delay={300} className="mt-14 sm:mt-20">
                    <div>
                        <div className="mb-4 flex items-center justify-between">
                            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-ed-fg-muted">
                                Archive Portals & Sections
                            </span>
                            <span className="font-mono text-xs text-ed-fg-muted">
                                Instant Access to Collections
                            </span>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10">
                            {ARCHIVE_PORTALS.map((portal) => (
                                <Link
                                    key={portal.title}
                                    href={portal.href}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-5 shadow-[0_12px_28px_-10px_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.05)_inset] backdrop-blur-xl transition-all duration-250 ease-out hover:border-ed-fg/40 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.99]"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-full border border-ed-rule-strong bg-ed-surface-strong px-2.5 py-0.5 font-mono text-[0.62rem] font-bold text-ed-fg-muted transition-colors group-hover:text-ed-fg">
                                                {portal.badge}
                                            </span>
                                        </div>
                                        <h2 className="mt-3.5 font-sans text-[0.95rem] sm:text-base font-bold leading-snug tracking-[-0.015em] text-ed-fg">
                                            {portal.title}
                                        </h2>
                                        <p className="mt-1.5 text-xs sm:text-[0.82rem] leading-[1.55] text-ed-fg-muted line-clamp-2">
                                            {portal.desc}
                                        </p>
                                    </div>
                                    <div className="mt-5 flex items-center gap-1 font-mono text-[0.68rem] font-semibold uppercase tracking-wider text-ed-fg-muted transition-colors group-hover:text-ed-fg">
                                        <span>Explore portal</span>
                                        <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function CarouselButton({
    label,
    onClick,
    pressed,
    children,
}: {
    label: string;
    onClick: () => void;
    pressed?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={pressed}
            className={chromeButtonClass}
        >
            {children}
        </button>
    );
}
