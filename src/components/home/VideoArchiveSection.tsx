'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { ExpectationCard } from './ExpectationCard';
import { SectionCta } from './SectionCta';
import { useAutoplayCarousel } from './useAutoplayCarousel';

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
        title: 'Dated recordings',
        body: 'Sermons and conference material stay connected to their historical sequence.',
    },
    {
        title: 'Searchable speech',
        body: 'Transcripts make spoken passages findable without scrubbing through an entire recording.',
    },
    {
        title: 'Original context',
        body: 'Each record keeps its title, source, thumbnail, and playback page together.',
    },
    {
        title: 'Direct study',
        body: 'Move from an index result to the recording and its synchronized transcript.',
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
    } = useAutoplayCarousel({
        count: VIDEO_SLIDES.length,
        intervalMs: ROTATION_MS,
    });

    const slide = VIDEO_SLIDES[index];

    return (
        <article className="archive-section grid gap-10 border-b border-ed-rule pb-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:pb-24">
            <div className="lg:pt-5">
                <SectionHeading numeral="I" title="Video archive" />
                <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                    Friday sermons, instructional programs, public talks, and United Submitters International conference recordings preserved as a visual study collection.
                </p>

                <div className="mt-8 grid gap-x-6 sm:grid-cols-2">
                    {VIDEO_CAPABILITIES.map((item, itemIndex) => (
                        <ExpectationCard
                            key={item.title}
                            index={String(itemIndex + 1).padStart(2, '0')}
                            title={item.title}
                            body={item.body}
                        />
                    ))}
                </div>

                <SectionCta href="/videos" label="Browse the video archive" />
            </div>

            <div
                ref={rootRef}
                {...interactionProps}
                className="min-w-0 touch-pan-y"
            >
                <div className="overflow-hidden border border-ed-rule bg-ed-surface">
                    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                        <div>
                            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                                Featured recording
                            </p>
                            <p className="mt-1 text-sm text-ed-fg" aria-live="polite">
                                {slide.category}
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            <ControlButton label="Previous featured video" onClick={previous}>
                                <ArrowLeft className="h-4 w-4" />
                            </ControlButton>
                            {!reducedMotion ? (
                                <ControlButton
                                    label={isManuallyPaused ? 'Resume video rotation' : 'Pause video rotation'}
                                    onClick={() => setIsManuallyPaused((paused) => !paused)}
                                    pressed={isManuallyPaused}
                                >
                                    {isManuallyPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                </ControlButton>
                            ) : null}
                            <ControlButton label="Next featured video" onClick={next}>
                                <ArrowRight className="h-4 w-4" />
                            </ControlButton>
                        </div>
                    </div>

                    <Link href="/videos" className="group relative block aspect-video overflow-hidden bg-[#111111]">
                        <Image
                            key={slide.src}
                            src={slide.src}
                            alt={slide.title}
                            fill
                            quality={65}
                            sizes="(min-width: 1024px) 55vw, 100vw"
                            className="object-cover motion-safe:animate-[archive-media-reveal_620ms_cubic-bezier(0.16,1,0.3,1)] transition-transform duration-700 group-hover:scale-[1.015]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/18 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                            <span className="inline-flex min-h-11 min-w-11 items-center justify-center border border-white/25 bg-black/35 text-white backdrop-blur-sm">
                                <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                            </span>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.17em] text-[#f6ae82]">
                                {slide.category}
                            </p>
                            <h4 className="mt-2 max-w-[20ch] font-display text-2xl leading-[1.02] text-[#f6efe4] sm:text-4xl">
                                {slide.title}
                            </h4>
                        </div>
                    </Link>

                    <div className="grid grid-cols-3 gap-px border-t border-ed-rule bg-ed-rule sm:grid-cols-6">
                        {VIDEO_SLIDES.map((item, itemIndex) => (
                            <button
                                key={item.src}
                                type="button"
                                onClick={() => goTo(itemIndex)}
                                aria-label={`Show ${item.title}`}
                                aria-pressed={itemIndex === index}
                                className={`relative min-h-20 overflow-hidden bg-ed-bg p-1 transition-colors ${
                                    itemIndex === index ? 'ring-2 ring-inset ring-ed-accent' : 'hover:bg-ed-surface'
                                }`}
                            >
                                <span className="relative block aspect-video overflow-hidden bg-[#111111]">
                                    <Image
                                        src={item.src}
                                        alt=""
                                        fill
                                        quality={45}
                                        sizes="140px"
                                        className={`object-cover transition duration-300 ${
                                            itemIndex === index ? 'opacity-100' : 'opacity-55 grayscale hover:opacity-90'
                                        }`}
                                    />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </article>
    );
}

function SectionHeading({ numeral, title }: { numeral: string; title: string }) {
    return (
        <header className="grid grid-cols-[auto_1fr] items-end gap-5 border-b border-ed-rule pb-5">
            <span className="font-display text-6xl leading-[0.8] text-ed-accent sm:text-7xl" aria-hidden="true">
                {numeral}
            </span>
            <h3 className="font-display text-[clamp(2.4rem,6vw,4.5rem)] font-medium leading-[0.9] tracking-[-0.035em] text-ed-fg">
                {title}
            </h3>
        </header>
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
            className="inline-flex min-h-11 min-w-11 items-center justify-center border border-ed-rule bg-ed-bg text-ed-fg-muted transition-colors hover:border-ed-accent/55 hover:text-ed-accent"
        >
            {children}
        </button>
    );
}
