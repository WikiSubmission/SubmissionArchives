'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { ExpectationCard } from './ExpectationCard';
import { Reveal } from './Reveal';
import { SectionCta } from './SectionCta';
import { SectionHeading } from './SectionHeading';
import { useAutoplayCarousel } from './useAutoplayCarousel';
import { GlassSheen, chromeButtonClass, widgetCardClass } from './WidgetAccents';

const VIDEO_SLIDES = [
    {
        src: '/content/videos/thumbnails/friday-sermon-universal-unity-through-devotion-to-god-alone.webp',
        category: 'Friday sermon',
        title: 'Universal Unity Through Devotion to God Alone',
    },
    {
        src: '/content/videos/thumbnails/mathematical-miracle-of-quran.jpg',
        category: 'Instructional program',
        title: 'Mathematical Miracle of the Qur\'an',
    },
    {
        src: '/content/videos/thumbnails/friday-sermon-united-submitters-international-conference-1989.webp',
        category: 'Friday sermon',
        title: 'United Submitters International Conference, 1989',
    },
    {
        src: '/content/videos/thumbnails/united-submitters-international-conference-final-speech-by-dr-rashad-khalifa-1989.webp',
        category: 'Conference recording',
        title: 'Final Speech at the 1989 Conference',
    },
    {
        src: '/content/videos/thumbnails/essentials-of-submission-islam.jpg',
        category: 'Instructional program',
        title: 'Essentials of Submission',
    },
    {
        src: '/content/videos/thumbnails/principles-of-contact-prayers-salat.jpg',
        category: 'Instructional program',
        title: 'Principles of Contact Prayers',
    },
] as const;

const VIDEO_CAPABILITIES = [
    {
        title: '300+ Preserved Lectures',
        body: 'Friday sermons, annual United Submitters International conference keynotes, television programs, and debates.',
    },
    {
        title: 'Real-Time Synced Transcripts',
        body: 'Read line-by-line speech text that follows along with audio and video playback automatically.',
    },
    {
        title: 'Chapter Markers & Timestamps',
        body: 'Jump instantly to key topics, mathematical proofs, scripture discussions, and audience Q&A sessions.',
    },
    {
        title: 'Direct Citation Deep Links',
        body: 'Copy and share links that open the video at the exact second of evidence for independent verification.',
    },
] as const;

const ROTATION_MS = 6_200;

export function VideoArchiveSection() {
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
        dragOffsetPx,
        isDragging,
    } = useAutoplayCarousel({
        count: VIDEO_SLIDES.length,
        intervalMs: ROTATION_MS,
    });

    const slide = VIDEO_SLIDES[index];

    return (
        <article className="archive-section grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:pt-5">
                <Reveal>
                    <SectionHeading numeral="I" title="Video archive" />
                </Reveal>
                <Reveal delay={80} className="mt-4 sm:mt-5 lg:mt-6">
                    <p className="max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                        Friday sermons, instructional programs, public talks, and United Submitters International conference recordings preserved as a visual study collection.
                    </p>
                </Reveal>

                <div className="mt-10 grid gap-5 sm:grid-cols-2 sm:gap-6">
                    {VIDEO_CAPABILITIES.map((item, itemIndex) => (
                        <Reveal key={item.title} delay={140 + itemIndex * 80}>
                            <ExpectationCard
                                index={String(itemIndex + 1).padStart(2, '0')}
                                title={item.title}
                                body={item.body}
                            />
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={140 + VIDEO_CAPABILITIES.length * 80} className="mt-8 sm:mt-10">
                    <SectionCta href="/videos" label="Browse the video archive" />
                </Reveal>
            </div>

            <Reveal delay={160} className="min-w-0">
                <div ref={rootRef} {...interactionProps} className="touch-pan-y">
                    <div className={widgetCardClass}>
                        <GlassSheen />
                        {/* Header Bar with Traffic Lights */}
                        <div className="flex min-h-12 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-6 bg-ed-surface-strong/40 select-none">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5" aria-hidden="true">
                                    <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
                                    <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
                                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                                </div>
                                <span className="h-3.5 w-px bg-ed-rule-strong/60" aria-hidden="true" />
                                <div>
                                    <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                        Recording · <span className="text-ed-fg font-bold">{slide.category}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ControlButton label="Previous featured video" onClick={previous}>
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                </ControlButton>
                                {!reducedMotion ? (
                                    <ControlButton
                                        label={isManuallyPaused ? 'Resume video rotation' : 'Pause video rotation'}
                                        onClick={() => setIsManuallyPaused((paused) => !paused)}
                                        pressed={isManuallyPaused}
                                    >
                                        {isManuallyPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                                    </ControlButton>
                                ) : null}
                                <ControlButton label="Next featured video" onClick={next}>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </ControlButton>
                            </div>
                        </div>

                        <Link
                            href="/videos"
                            className="group relative block aspect-video overflow-hidden bg-ed-console"
                            style={{
                                transform: dragOffsetPx ? `translateX(${dragOffsetPx}px)` : undefined,
                                transition: isDragging ? 'none' : 'transform 400ms cubic-bezier(0.32,0.72,0,1)',
                            }}
                        >
                            <Image
                                key={slide.src}
                                src={slide.src}
                                alt={slide.title}
                                fill
                                quality={85}
                                sizes="(min-width: 1024px) 55vw, 100vw"
                                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:animate-[archive-media-reveal_620ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                <span className="inline-flex h-13 w-13 items-center justify-center rounded-2xl border border-white/30 bg-white/15 text-white backdrop-blur-xl transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-black shadow-2xl">
                                    <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                                </span>
                                <div className="mt-4">
                                    <span className="inline-block rounded-full border border-white/20 bg-white/10 px-3 py-0.5 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md">
                                        {slide.category}
                                    </span>
                                </div>
                                <h4 className="mt-2.5 max-w-[24ch] font-sans text-2xl font-black leading-[1.05] tracking-tight text-white sm:text-3xl">
                                    {slide.title}
                                </h4>
                            </div>
                        </Link>

                        <div className="grid grid-cols-3 gap-2 p-3 border-t border-ed-rule bg-ed-surface/40 sm:grid-cols-6">
                            {VIDEO_SLIDES.map((item, itemIndex) => (
                                <button
                                    key={item.src}
                                    type="button"
                                    onClick={() => goTo(itemIndex)}
                                    aria-label={`Show ${item.title}`}
                                    aria-pressed={itemIndex === index}
                                    className={`relative min-h-16 overflow-hidden rounded-xl border transition-all duration-200 ${
                                        itemIndex === index ? 'border-ed-fg ring-2 ring-ed-fg/40 shadow-md scale-[1.02]' : 'border-ed-rule-strong/60 opacity-60 hover:opacity-100 hover:border-ed-fg-muted'
                                    }`}
                                >
                                    <span className="relative block aspect-video overflow-hidden bg-ed-console">
                                        <Image
                                            src={item.src}
                                            alt=""
                                            fill
                                            quality={55}
                                            sizes="140px"
                                            className={`object-cover transition duration-300 ${
                                                itemIndex === index
                                                    ? 'opacity-100'
                                                    : 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0'
                                            }`}
                                        />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Reveal>
        </article>
    );
}

function ControlButton({
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
