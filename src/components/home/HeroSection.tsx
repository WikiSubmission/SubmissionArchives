'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const HERO_IMAGES = [
    { src: '/images/archive-photos/M3.png', alt: 'Rashad Khalifa archival photograph' },
    { src: '/images/archive-photos/M1.png', alt: 'Rashad Khalifa with others archival photograph' },
    { src: '/images/archive-photos/M2.png', alt: 'Rashad Khalifa archival group photograph' },
    { src: '/images/archive-photos/M4.jpeg', alt: 'Rashad Khalifa archival scene' },
];

const HERO_ROTATION_MS = 6500;

export function HeroSection() {
    const [heroImageIndex, setHeroImageIndex] = React.useState(0);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleNext = React.useCallback(() => {
        const next = () => {
            timeoutRef.current = setTimeout(() => {
                setHeroImageIndex((current) => (current + 1) % HERO_IMAGES.length);
                next();
            }, HERO_ROTATION_MS);
        };
        next();
    }, []);

    React.useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            scheduleNext();
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [scheduleNext]);

    const pauseRotation = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    const resumeRotation = () => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
            scheduleNext();
        }
    };

    const touchStart = React.useRef({ x: 0, y: 0 });
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        pauseRotation();
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const diffX = touchStart.current.x - e.changedTouches[0].clientX;
        const diffY = touchStart.current.y - e.changedTouches[0].clientY;
        if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY) * 2) {
            if (diffX > 0) {
                setHeroImageIndex((current) => (current + 1) % HERO_IMAGES.length);
            } else {
                setHeroImageIndex((current) => (current - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
            }
        }
    };

    return (
        <section className="relative mx-auto grid max-w-[1440px] gap-12 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-10 lg:pb-24 lg:pt-20">
            {/* Hero Ambient Background Glow */}
            <div className="pointer-events-none absolute -left-20 top-10 hidden h-[800px] w-[800px] bg-[radial-gradient(closest-side,var(--ed-accent),transparent)] opacity-[0.04] dark:opacity-[0.08] sm:block" />

            <div className="relative z-10 flex flex-col justify-center">
                <div className="max-w-3xl space-y-9">
                    <div className="space-y-6">
                        <p className="archive-kicker border-l-2 border-ed-accent pl-3">
                            A living digital archive
                        </p>
                        
                        <h1 className="group flex cursor-default flex-col items-start leading-none">
                            <span className="max-w-full font-sans text-[clamp(2.7rem,15vw,3.75rem)] font-black uppercase leading-[0.9] tracking-[-0.055em] text-ed-fg md:text-[5.25rem]">
                                SUBMISSION
                            </span>
                            <span className="mt-2 block border-y border-ed-rule py-2 font-display text-[clamp(2.2rem,11vw,3.2rem)] font-medium uppercase italic leading-none tracking-[0.09em] text-ed-fg sm:text-6xl md:text-7xl">
                                ARCHIVES
                            </span>
                        </h1>
                        <p className="max-w-[60ch] text-[1.05rem] leading-8 text-ed-fg-muted sm:text-lg">
                            Explore recordings, Qur&apos;an editions, newsletters, books, and searchable transcripts from the Submission archive.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <Link
                            href="/videos"
                            className="archive-button archive-button-primary px-6 sm:px-7"
                        >
                            Start with the archive
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/search"
                            className="archive-button archive-button-secondary px-6 sm:px-7"
                        >
                            Search the corpus
                        </Link>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-center lg:justify-end">
                <div 
                    className="flex w-full max-w-[720px] touch-pan-y flex-col overflow-hidden border border-ed-rule bg-ed-surface shadow-[0_20px_55px_color-mix(in_oklch,var(--ed-fg)_14%,transparent)]"
                    onMouseEnter={pauseRotation}
                    onMouseLeave={resumeRotation}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex min-h-[3.25rem] items-center justify-between border-b border-ed-rule px-4 py-3 sm:px-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-ed-fg-muted">Archive photograph</p>
                        <p className="font-mono text-xs tabular-nums text-ed-fg-muted">{String(heroImageIndex + 1).padStart(2, '0')} / {String(HERO_IMAGES.length).padStart(2, '0')}</p>
                    </div>

                    <div className="flex w-full border-b border-ed-rule bg-ed-bg" role="group" aria-label="Archive image selector">
                        {HERO_IMAGES.map((_, index) => {
                            const isActive = index === heroImageIndex;
                            return (
                                <button
                                    key={index}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => {
                                        setHeroImageIndex(index);
                                        pauseRotation();
                                    }}
                                    className={`relative flex min-h-[44px] min-w-0 flex-1 items-center justify-center border-r border-ed-rule px-2 py-2 text-xs font-medium transition-colors last:border-r-0 sm:px-4 focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 ${
                                        isActive
                                            ? 'bg-ed-surface text-ed-accent'
                                            : 'bg-transparent text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg'
                                    }`}
                                >
                                    <span className="truncate">Plate {String(index + 1).padStart(2, '0')}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Image Frame */}
                    <div className="relative aspect-[1.38/1] w-full bg-ed-surface sm:aspect-[1.34/1] lg:aspect-[1.38/1]">
                        <div className="absolute inset-0 z-0 flex items-center justify-center">
                            <Image
                                key={HERO_IMAGES[heroImageIndex].src}
                                src={HERO_IMAGES[heroImageIndex].src}
                                alt={HERO_IMAGES[heroImageIndex].alt}
                                fill
                                priority={heroImageIndex === 0}
                                loading={heroImageIndex === 0 ? "eager" : "lazy"}
                                quality={70}
                                className="object-contain p-3 sm:p-5"
                                sizes="(min-width: 1024px) 50vw, 100vw"
                            />
                        </div>
                        <div className="absolute inset-x-0 bottom-0 z-30 h-[2px] overflow-hidden bg-ed-rule">
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
    );
}
