'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { Reveal } from './Reveal';
import { useAutoplayCarousel } from './useAutoplayCarousel';
import { GlassSheen, chromeButtonClass } from './WidgetAccents';

const HERO_IMAGES = [
    {
        src: '/images/archive-photos/M3.png',
        alt: 'Dr. Rashad Khalifa archival photograph',
        label: 'Historical Record · Historical Portrait',
    },
    {
        src: '/images/archive-photos/M1.png',
        alt: 'Dr. Rashad Khalifa with submitters in Tucson, Arizona',
        label: 'Historical Record · Tucson Community',
    },
    {
        src: '/images/archive-photos/M2.png',
        alt: 'Dr. Rashad Khalifa delivering a lecture at the annual conference',
        label: 'Historical Record · Annual Conference',
    },
    {
        src: '/images/archive-photos/M4.jpeg',
        alt: 'Archival scene from Tucson mosque',
        label: 'Historical Record · Preservation Record',
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
        <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-ed-rule bg-ed-bg pb-16 pt-8 sm:pb-24 sm:pt-14">
            {/* Background Ambient Glow */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-ed-accent/5 blur-[140px]" />
                <div className="absolute -left-32 top-1/2 h-[400px] w-[400px] rounded-full bg-ed-accent/3 blur-[140px]" />
                <Image
                    src="/assets/brand/submission-archives-mark.png"
                    alt=""
                    width={500}
                    height={500}
                    priority
                    loading="eager"
                    className="absolute -right-24 -top-20 hidden w-[34rem] select-none opacity-[0.03] grayscale lg:block"
                    aria-hidden="true"
                />
            </div>

            <div className="relative mx-auto max-w-[1160px] px-5 sm:px-8">
                {/* Hero Main Grid */}
                <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div className="max-w-2xl">
                        {/* Editorial Serif Headline */}
                        <Reveal delay={100}>
                            <h1 id="hero-title" className="font-serif text-[clamp(2.75rem,6.5vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.03em] text-ed-fg">
                                Submission <span className="italic font-normal text-ed-accent">Archives</span>
                            </h1>
                        </Reveal>

                        {/* Scholarly Description */}
                        <Reveal delay={180} className="mt-5 sm:mt-6">
                            <p
                                className="max-w-[52ch] text-base leading-[1.65] text-ed-fg-secondary sm:text-lg"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                A digital reading room and permanent preservation repository for historical audio recordings, video lectures, authorized scripture translations, and published research works of <strong className="font-medium text-ed-fg">Dr. Rashad Khalifa</strong>.
                            </p>
                        </Reveal>

                        {/* Primary & Secondary Action Buttons */}
                        <Reveal delay={260}>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/search"
                                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-ed-accent bg-ed-accent px-6 font-sans text-sm font-semibold text-white dark:text-[#0F0E0D] shadow-md transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Search Entire Corpus</span>
                                    <span className="opacity-60 text-[10px]">/</span>
                                </Link>
                                <Link
                                    href="/scripture/quran"
                                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-ed-rule bg-ed-surface px-5 font-sans text-sm font-semibold text-ed-fg shadow-sm transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Open Scripture Reader</span>
                                    <ArrowRight className="h-3.5 w-3.5 opacity-60" />
                                </Link>
                            </div>
                        </Reveal>
                    </div>

                    {/* Interactive Archival Carousel Plate */}
                    <Reveal delay={220} className="relative">
                        <div
                            ref={rootRef}
                            {...interactionProps}
                            className="group/hero-carousel relative mx-auto w-full max-w-[42rem] overflow-hidden rounded-2xl border border-ed-rule bg-gradient-to-b from-ed-surface via-ed-surface/95 to-ed-bg-secondary p-4 shadow-xl backdrop-blur-2xl transition-all duration-300 hover:border-ed-rule-strong sm:p-5"
                        >
                            <GlassSheen />
                            <div className="flex items-center justify-between border-b border-ed-rule pb-3 select-none">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5" aria-hidden="true">
                                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500/60 border border-rose-600/30" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60 border border-amber-600/30" />
                                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60 border border-emerald-600/30" />
                                    </div>
                                    <span className="h-3 w-px bg-ed-rule" aria-hidden="true" />
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
                                className="relative mt-3.5 aspect-[4/3] w-full overflow-hidden rounded-xl bg-ed-surface-strong sm:mt-4 shadow-inner"
                                style={{
                                    transform: dragOffsetPx ? `translateX(${dragOffsetPx}px)` : undefined,
                                    transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.32,0.72,0,1)',
                                }}
                            >
                                <Image
                                    src={activeImage.src}
                                    alt={activeImage.alt}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 42rem"
                                    className="object-cover transition-opacity duration-700 ease-in-out"
                                    priority
                                    loading="eager"
                                />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90 font-mono">
                                    <span className="text-[11px] text-white font-semibold">{activeImage.label.split('·')[1] || activeImage.label}</span>
                                    <span className="text-[10px] text-white/70">Plate {index + 1} of {HERO_IMAGES.length}</span>
                                </div>
                            </div>
                        </div>
                    </Reveal>
                </div>
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

