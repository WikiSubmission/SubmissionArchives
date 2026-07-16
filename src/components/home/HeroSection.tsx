'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';

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
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="absolute -left-24 top-10 h-[32rem] w-[32rem] rounded-full bg-ed-accent/5 blur-3xl" />
                <Image
                    src="/assets/brand/submission-archives-mark.png"
                    alt=""
                    width={500}
                    height={500}
                    className="absolute -right-24 -top-20 hidden w-[34rem] select-none opacity-[0.035] grayscale lg:block dark:opacity-[0.055]"
                    aria-hidden="true"
                />
            </div>

            <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-20">
                <div className="max-w-3xl">
                    <div className="flex items-center gap-3">
                        <Image
                            src="/assets/brand/submission-archives-mark.png"
                            alt=""
                            width={44}
                            height={44}
                            className="h-11 w-11 object-contain opacity-80"
                            aria-hidden="true"
                        />
                        <p className="archive-kicker">A living digital archive</p>
                    </div>

                    <h1 className="mt-8 max-w-[11ch] font-display text-[clamp(3.5rem,10vw,8.25rem)] font-medium leading-[0.78] tracking-[-0.055em] text-ed-fg">
                        Submission
                        <span className="mt-3 block font-ui text-[0.31em] font-bold uppercase leading-none tracking-[0.24em] text-ed-accent sm:tracking-[0.3em]">
                            Archives
                        </span>
                    </h1>

                    <p className="mt-8 max-w-[58ch] text-[1.03rem] leading-8 text-ed-fg-muted sm:text-lg">
                        Explore preserved recordings, Qur&apos;an editions, newsletters, books, appendices, and searchable transcripts from the Submission archive.
                    </p>

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Link href="/search" className="archive-button archive-button-primary px-6 sm:px-7">
                            Search the archive
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                        <Link href="/videos" className="archive-button archive-button-secondary px-6 sm:px-7">
                            Browse recordings
                        </Link>
                    </div>

                    <dl className="mt-10 grid max-w-2xl grid-cols-3 gap-px border-y border-ed-rule bg-ed-rule text-left">
                        <div className="bg-ed-bg py-4 pr-4">
                            <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">Formats</dt>
                            <dd className="mt-1 font-display text-xl text-ed-fg">Audio, video, text</dd>
                        </div>
                        <div className="bg-ed-bg px-4 py-4">
                            <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">Access</dt>
                            <dd className="mt-1 font-display text-xl text-ed-fg">Open and searchable</dd>
                        </div>
                        <div className="bg-ed-bg py-4 pl-4">
                            <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">Purpose</dt>
                            <dd className="mt-1 font-display text-xl text-ed-fg">Study and preservation</dd>
                        </div>
                    </dl>
                </div>

                <div
                    ref={rootRef}
                    {...interactionProps}
                    className="relative touch-pan-y"
                >
                    <figure className="overflow-hidden border border-ed-rule bg-ed-surface shadow-[0_24px_70px_color-mix(in_oklch,var(--ed-fg)_13%,transparent)]">
                        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                            <div>
                                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                                    Historical photographs
                                </p>
                                <p className="mt-1 text-sm text-ed-fg" aria-live="polite">
                                    {currentImage.label}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
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

                        <div className="relative aspect-[1.22/1] overflow-hidden bg-[color-mix(in_oklch,var(--ed-surface)_78%,var(--ed-bg))] sm:aspect-[1.36/1]">
                            {HERO_IMAGES.map((image, imageIndex) => (
                                <Image
                                    key={image.src}
                                    src={image.src}
                                    alt={image.alt}
                                    fill
                                    preload={imageIndex === 0}
                                    quality={70}
                                    sizes="(min-width: 1024px) 54vw, 100vw"
                                    className={`object-contain p-4 transition-[opacity,transform] duration-700 ease-out sm:p-6 ${
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
                                        className={`min-h-11 min-w-11 border px-3 text-xs font-semibold tabular-nums transition-colors ${
                                            imageIndex === index
                                                ? 'border-ed-accent bg-ed-accent/10 text-ed-accent'
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
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ed-rule bg-ed-bg text-ed-fg-muted transition-colors hover:border-ed-accent/55 hover:text-ed-accent"
        >
            {children}
        </button>
    );
}
