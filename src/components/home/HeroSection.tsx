'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { Reveal } from './Reveal';
import { useAutoplayCarousel } from './useAutoplayCarousel';

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

const HERO_STATS = [
    { label: 'Formats', value: 'Audio, video, text' },
    { label: 'Access', value: 'Open and searchable' },
    { label: 'Purpose', value: 'Study and preservation' },
] as const;

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
            {/* Local atmosphere: a slow-drifting lamp glow + the ghost brand mark */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="animate-float-slow absolute -left-28 top-8 h-[34rem] w-[34rem] rounded-full bg-ed-accent/10 blur-3xl dark:bg-ed-accent/15" />
                <div className="absolute -bottom-32 left-1/3 h-[26rem] w-[26rem] rounded-full bg-ed-gold/10 blur-3xl dark:bg-ed-gold/12" />
                <Image
                    src="/assets/brand/submission-archives-mark.png"
                    alt=""
                    width={500}
                    height={500}
                    className="absolute -right-24 -top-20 hidden w-[34rem] select-none opacity-[0.04] grayscale lg:block dark:opacity-[0.06]"
                    aria-hidden="true"
                />
            </div>

            <div className="relative mx-auto grid max-w-[1440px] gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
                <div className="max-w-3xl">
                    <Reveal>
                        <div className="flex items-center gap-4">
                            <span className="grid h-12 w-12 place-items-center rounded-[var(--ed-radius-md)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-sm)]">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt=""
                                    width={30}
                                    height={30}
                                    className="h-[1.875rem] w-[1.875rem] object-contain opacity-85"
                                    aria-hidden="true"
                                />
                            </span>
                            <p className="archive-kicker">A living digital archive</p>
                        </div>
                    </Reveal>

                    <Reveal delay={90}>
                        <h1 className="mt-24 font-display text-[clamp(3.6rem,9.5vw,7.75rem)] font-medium leading-[0.8] tracking-[-0.05em] text-ed-fg">
                            <span className="block">Submission</span>
                            <span className="mt-5 flex items-center gap-5 font-ui text-[clamp(1.4rem,3vw,1.8rem)] font-bold uppercase leading-none tracking-[0.34em] text-ed-accent">
                                Archives
                                <span
                                    aria-hidden="true"
                                    className="h-px max-w-40 flex-1 bg-gradient-to-r from-ed-accent/70 to-transparent"
                                />
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={180}>
                        <p className="mt-20 max-w-[54ch] text-[1.05rem] leading-8 text-ed-fg-muted sm:text-lg">
                            Explore preserved recordings, Qur&apos;an editions, newsletters, books, appendices, and searchable transcripts from the Submission archive.
                        </p>
                    </Reveal>

                    <Reveal delay={270}>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link href="/search" className="archive-button archive-button-primary group px-6 sm:px-7">
                                Search the archive
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                            <Link href="/videos" className="archive-button archive-button-secondary px-6 sm:px-7">
                                Browse recordings
                            </Link>
                        </div>
                    </Reveal>

                    <Reveal delay={380}>
                        <dl className="glass-panel mt-10 grid max-w-2xl grid-cols-1 gap-y-4 rounded-[var(--ed-radius-lg)] p-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-ed-rule sm:p-0">
                            {HERO_STATS.map((stat) => (
                                <div key={stat.label} className="sm:px-5 sm:py-4">
                                    <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ed-fg-muted">
                                        {stat.label}
                                    </dt>
                                    <dd className="mt-1 font-display text-lg leading-snug text-ed-fg sm:text-xl">
                                        {stat.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </div>

                <Reveal delay={220} className="relative">
                    {/* Halo behind the plate */}
                    <div
                        aria-hidden="true"
                        className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--ed-accent)_18%,transparent),transparent)] blur-2xl"
                    />
                    <div ref={rootRef} {...interactionProps} className="touch-pan-y">
                        <figure className="lift-card relative overflow-hidden rounded-[var(--ed-radius-xl)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-lg)]">
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/70 to-transparent"
                            />

                            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                                <div>
                                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                                        Historical photographs
                                    </p>
                                    <p className="mt-1 text-sm text-ed-fg" aria-live="polite">
                                        {currentImage.label}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CarouselButton label="Previous photograph" onClick={previous}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </CarouselButton>
                                    {!reducedMotion ? (
                                        <CarouselButton
                                            label={isManuallyPaused ? 'Resume photograph rotation' : 'Pause photograph rotation'}
                                            onClick={() => setIsManuallyPaused((paused) => !paused)}
                                            pressed={isManuallyPaused}
                                        >
                                            {isManuallyPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        </CarouselButton>
                                    ) : null}
                                    <CarouselButton label="Next photograph" onClick={next}>
                                        <ArrowRight className="h-4 w-4" />
                                    </CarouselButton>
                                </div>
                            </div>

                            <div className="relative aspect-[1.22/1] overflow-hidden bg-[color-mix(in_oklch,var(--ed-surface)_72%,var(--ed-bg))] shadow-[inset_0_2px_20px_color-mix(in_oklch,var(--ed-fg)_7%,transparent)] sm:aspect-[1.36/1]">
                                {HERO_IMAGES.map((image, imageIndex) => (
                                    <Image
                                        key={image.src}
                                        src={image.src}
                                        alt={image.alt}
                                        fill
                                        preload={imageIndex === 0}
                                        quality={70}
                                        sizes="(min-width: 1024px) 54vw, 100vw"
                                        className={`object-contain p-4 transition-[opacity,transform] duration-700 ease-out sm:p-7 ${
                                            imageIndex === index
                                                ? 'scale-100 opacity-100'
                                                : 'pointer-events-none scale-[1.015] opacity-0'
                                        }`}
                                    />
                                ))}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ed-bg/25 via-transparent to-transparent" />
                            </div>

                            <figcaption className="grid gap-4 border-t border-ed-rule px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                                <p className="max-w-[54ch] text-sm leading-6 text-ed-fg-muted">
                                    A rotating selection from the visual archive. Original captions should be added as provenance becomes available.
                                </p>
                                <div className="flex items-center gap-2" role="group" aria-label="Select archive photograph">
                                    {HERO_IMAGES.map((image, imageIndex) => (
                                        <button
                                            key={image.src}
                                            type="button"
                                            onClick={() => goTo(imageIndex)}
                                            aria-label={`Show ${image.label.toLowerCase()}`}
                                            aria-pressed={imageIndex === index}
                                            className={`min-h-11 min-w-11 rounded-[var(--ed-radius-sm)] border px-3 text-xs font-semibold tabular-nums transition-all duration-200 ${
                                                imageIndex === index
                                                    ? 'border-ed-accent bg-ed-accent/12 text-ed-accent shadow-[var(--ed-shadow-sm)]'
                                                    : 'border-ed-rule text-ed-fg-muted hover:border-ed-accent/50 hover:text-ed-fg'
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
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-surface text-ed-fg-muted transition-[color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:border-ed-accent/60 hover:text-ed-accent hover:shadow-[var(--ed-shadow-sm)] active:scale-95"
        >
            {children}
        </button>
    );
}
