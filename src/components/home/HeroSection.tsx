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
        <section aria-labelledby="hero-title" className="relative overflow-hidden bg-ed-bg">

            <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                <Image
                    src="/images/symbols/sub-sign.png"
                    alt=""
                    width={500}
                    height={500}
                    className="absolute -right-24 -top-20 hidden w-[34rem] select-none opacity-[0.04] grayscale lg:block dark:opacity-[0.06]"
                    aria-hidden="true"
                />
            </div>

            <div className="relative mx-auto grid max-w-[1440px] gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-10 lg:pb-24 lg:pt-20">
                <div className="max-w-3xl">

                    <Reveal delay={120} className="flex justify-center sm:justify-start">
                        <h1 id="hero-title" className="flex flex-col text-ed-fg w-fit items-center sm:items-start text-center sm:text-left">
                            <span className="block font-sans text-[clamp(2.8rem,9vw,5.2rem)] font-black uppercase leading-[0.88] tracking-tight">
                                Submission
                            </span>
                            <span className="mt-2 block w-full border border-ed-fg bg-ed-surface-strong px-5 py-3 text-center font-slab text-[clamp(3rem,10vw,5.6rem)] font-black italic uppercase leading-none tracking-tight text-ed-fg">
                                Archives
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={180} className="mt-4 sm:mt-5 lg:mt-6">
                        <p className="max-w-[52ch] text-[1.05rem] leading-8 text-ed-fg-muted sm:text-lg text-center sm:text-left mx-auto sm:mx-0">
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
                </div>

                <Reveal delay={200} className="relative">
                    <div
                        ref={rootRef}
                        {...interactionProps}
                        className="group/hero-carousel relative mx-auto w-full max-w-[42rem] overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/95 p-3 shadow-2xl transition-all duration-300 hover:border-ed-rule-strong sm:p-4"
                    >
                        <GlassSheen />
                        <div className="flex items-center justify-between border-b border-ed-rule/70 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-ed-fg/20" />
                                <span className="h-2.5 w-2.5 rounded-full bg-ed-fg/20" />
                                <span className="h-2.5 w-2.5 rounded-full bg-ed-fg/20" />
                                <span className="ml-2 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                    Historical Photographs · {activeImage.label}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <CarouselButton label="Previous photo" onClick={previous}>
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                </CarouselButton>

                                <CarouselButton
                                    label={isManuallyPaused ? 'Play photo rotation' : 'Pause photo rotation'}
                                    onClick={() => setIsManuallyPaused(!isManuallyPaused)}
                                    pressed={isManuallyPaused}
                                >
                                    {isManuallyPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                                </CarouselButton>

                                <CarouselButton label="Next photo" onClick={next}>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </CarouselButton>
                            </div>
                        </div>

                        <div
                            className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-ed-bg sm:mt-4"
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
                            />
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
