'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Landmark, Layers3, Pause, Play, Unlock } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

import { Reveal } from './Reveal';
import { useAutoplayCarousel } from './useAutoplayCarousel';
import { GlassSheen, IconBadge, chromeButtonClass, widgetCardClass } from './WidgetAccents';

const HERO_IMAGES = [
    {
        src: '/images/archive-photos/M3.png',
        alt: 'Rashad Khalifa archival photograph',
        label: 'Archive plate 01',
    },
    {
        src: '/images/archive-photos/M1.png',
        alt: 'Rashad Khalifa with others in an archival photograph',
        label: 'Archive plate 02',
    },
    {
        src: '/images/archive-photos/M2.png',
        alt: 'Rashad Khalifa in an archival group photograph',
        label: 'Archive plate 03',
    },
    {
        src: '/images/archive-photos/M4.jpeg',
        alt: 'Rashad Khalifa archival scene',
        label: 'Archive plate 04',
    },
] as const;

const HERO_STATS: readonly { label: string; value: string; Icon: ComponentType<{ className?: string }> }[] = [
    { label: 'Formats', value: 'Audio, video, text', Icon: Layers3 },
    { label: 'Access', value: 'Open and searchable', Icon: Unlock },
    { label: 'Purpose', value: 'Study and preservation', Icon: Landmark },
];

const HERO_ROTATION_MS = 7_000;

export function HeroSection() {
    const {
        rootRef,
        index,
        goTo,
        next,
        previous,
        reducedMotion,
        isManuallyPaused,
        setIsManuallyPaused,
        interactionProps,
    } = useAutoplayCarousel({
        count: HERO_IMAGES.length,
        intervalMs: HERO_ROTATION_MS,
    });

    const currentImage = HERO_IMAGES[index];

    return (
        <section className="relative border-b border-ed-rule">
            {/* Ambient atmosphere: slow-drifting lamp glow + ghost brand mark */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="animate-float-slow absolute -left-28 top-8 h-[34rem] w-[34rem] rounded-full bg-white/[0.02] blur-3xl dark:bg-white/[0.03]" />
                <div className="absolute -bottom-32 left-1/3 h-[26rem] w-[26rem] rounded-full bg-white/[0.015] blur-3xl dark:bg-white/[0.02]" />
                <Image
                    src="/assets/brand/submission-archives-mark.png"
                    alt=""
                    width={500}
                    height={500}
                    className="absolute -right-24 -top-20 hidden w-[34rem] select-none opacity-[0.04] grayscale lg:block dark:opacity-[0.06]"
                    aria-hidden="true"
                />
            </div>

            <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-20">
                <div className="max-w-3xl">
                    <Reveal delay={70} className="flex justify-center sm:justify-start">
                        <div className="archive-kicker mb-6">
                            <span>Submission Archives Preserved Collection</span>
                        </div>
                    </Reveal>

                    <Reveal delay={120} className="flex justify-center sm:justify-start">
                        <h1 className="flex flex-col text-ed-fg w-fit items-center sm:items-start text-center sm:text-left">
                            <span className="block font-sans text-[clamp(2.8rem,9vw,5.2rem)] font-black uppercase leading-[0.88] tracking-tight">
                                Submission
                            </span>
                            <span className="mt-2 block font-sans text-[clamp(3rem,10vw,5.6rem)] font-black uppercase leading-[0.88] tracking-tight text-ed-fg/90">
                                Archives
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={180}>
                        <p className="mt-8 max-w-[52ch] text-[1.05rem] leading-8 text-ed-fg-muted sm:text-lg text-center sm:text-left mx-auto sm:mx-0">
                            Explore preserved recordings, Qur&apos;an editions, newsletters, books, appendices, and searchable transcripts from the Submission archive.
                        </p>
                    </Reveal>

                    <Reveal delay={240}>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center justify-center sm:justify-start">
                            <Link href="/search" className="archive-button archive-button-primary group px-7 active:scale-[0.98]">
                                Search the archive
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                            <Link href="/videos" className="archive-button archive-button-secondary px-7 active:scale-[0.98]">
                                Browse recordings
                            </Link>
                        </div>
                    </Reveal>

                    <Reveal delay={320}>
                        <div role="region" aria-label="Archive highlights" className="mt-10 grid max-w-2xl grid-cols-1 gap-2.5 sm:grid-cols-3">
                            {HERO_STATS.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="relative flex items-center gap-3 overflow-hidden rounded-xl border border-ed-rule bg-ed-surface/80 px-4 py-3 shadow-lg shadow-ed-accent/5 backdrop-blur-xl"
                                >
                                    <GlassSheen />
                                    <IconBadge size="sm">
                                        <stat.Icon className="h-3.5 w-3.5" />
                                    </IconBadge>
                                    <div className="min-w-0">
                                        <span className="block font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                            {stat.label}
                                        </span>
                                        <span className="mt-0.5 block truncate font-sans text-sm font-semibold leading-snug text-ed-fg">
                                            {stat.value}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Reveal>
                </div>

                <Reveal delay={200} className="relative">
                    {/* Subtle backdrop glow */}
                    <div
                        aria-hidden="true"
                        className="absolute -inset-6 -z-10 bg-[radial-gradient(closest-side,rgba(255,255,255,0.03),transparent)] blur-2xl rounded-3xl"
                    />
                    <div ref={rootRef} {...interactionProps} className="touch-pan-y">
                        <figure className={widgetCardClass}>
                            <GlassSheen />
                            {/* Window Top Controls Header */}
                            <div className="flex min-h-12 items-center justify-between gap-4 border-b border-ed-rule px-4 py-2.5 sm:px-5 bg-ed-surface/50">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5" aria-hidden="true">
                                        <span className="h-2.5 w-2.5 rounded-full border border-ed-rule bg-ed-fg-muted/30" />
                                        <span className="h-2.5 w-2.5 rounded-full border border-ed-rule bg-ed-fg-muted/20" />
                                        <span className="h-2.5 w-2.5 rounded-full border border-ed-rule bg-ed-fg-muted/20" />
                                    </div>
                                    <span className="h-3 w-px bg-ed-rule" aria-hidden="true" />
                                    <div>
                                        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                            Historical Photographs · {currentImage.label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CarouselButton label="Previous photograph" onClick={previous}>
                                        <ArrowLeft className="h-3.5 w-3.5" />
                                    </CarouselButton>
                                    {!reducedMotion ? (
                                        <CarouselButton
                                            label={isManuallyPaused ? 'Resume photograph rotation' : 'Pause photograph rotation'}
                                            onClick={() => setIsManuallyPaused((paused) => !paused)}
                                            pressed={isManuallyPaused}
                                        >
                                            {isManuallyPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                                        </CarouselButton>
                                    ) : null}
                                    <CarouselButton label="Next photograph" onClick={next}>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </CarouselButton>
                                </div>
                            </div>

                            <div className="relative aspect-[1.28/1] overflow-hidden bg-[color-mix(in_oklch,var(--ed-surface)_72%,var(--ed-bg))] p-3 sm:p-5 sm:aspect-[1.38/1]">
                                <div className="relative h-full w-full overflow-hidden rounded-xl border border-ed-rule/60 bg-black/40">
                                    {HERO_IMAGES.map((image, imageIndex) => (
                                        <Image
                                            key={image.src}
                                            src={image.src}
                                            alt={image.alt}
                                            fill
                                            priority={imageIndex === 0}
                                            quality={75}
                                            sizes="(min-width: 1024px) 54vw, 100vw"
                                            className={`object-contain p-4 transition-[opacity,transform] duration-700 ease-out sm:p-6 ${
                                                imageIndex === index
                                                    ? 'scale-100 opacity-100'
                                                    : 'pointer-events-none scale-[1.015] opacity-0'
                                            }`}
                                        />
                                    ))}
                                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                </div>
                            </div>

                            <figcaption className="grid gap-4 border-t border-ed-rule px-4 py-3.5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5 bg-ed-surface/50">
                                <p className="max-w-[54ch] text-xs leading-5 text-ed-fg-muted">
                                    Rotating visual evidence from the historical archive collections.
                                </p>
                                <div className="flex items-center gap-1.5" role="group" aria-label="Select archive photograph">
                                    {HERO_IMAGES.map((image, imageIndex) => (
                                        <button
                                            key={image.src}
                                            type="button"
                                            onClick={() => goTo(imageIndex)}
                                            aria-label={`Show ${image.label.toLowerCase()}`}
                                            aria-pressed={imageIndex === index}
                                            className={`min-h-8 min-w-8 rounded-lg border px-2.5 font-mono text-[0.7rem] font-semibold tabular-nums transition-all duration-200 ${
                                                imageIndex === index
                                                    ? 'border-ed-accent/50 bg-ed-accent/15 text-ed-accent shadow-sm shadow-ed-accent/30'
                                                    : 'border-ed-rule bg-ed-surface/60 text-ed-fg-muted hover:border-ed-accent/40 hover:text-ed-fg'
                                            }`}
                                        >
                                            {String(imageIndex + 1).padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                            </figcaption>
                        </figure>
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
