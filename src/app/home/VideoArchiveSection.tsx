'use client';

import React from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { ExpectationCard } from './components/ExpectationCard';
import { SectionCta } from './components/SectionCta';

const VIDEO_SLIDES = [
    { src: '/images/sermons/Dr._Rashad_Khalifa_1987_Khutbha_Friday_Sermon_1KLZxgpGMqs.jpg', category: 'Friday Sermon', title: '1987 Khutbah' },
    { src: '/images/video-programs/Mathematical_Miracle_of_Quran.jpg', category: 'Instructional Program', title: 'Mathematical Miracle of the Quran' },
    { src: '/images/sermons/Dr._Rashad_Khalifas_Friday_Sermons_1989_1_UouRqqmb7vU.jpg', category: 'Friday Sermon', title: 'Friday Sermons, 1989' },
    { src: '/images/video-programs/Final_Speech_by_Dr._Rashad_Khalifa_1989_Conference.jpg', category: 'USI Conference', title: 'Final Speech — 1989 Conference' },
    { src: '/images/video-programs/Essentials_of_Submission_Islam.jpg', category: 'Instructional Program', title: 'Essentials of Submission' },
    { src: '/images/video-programs/Principles_of_Contact_Prayers_Salat.jpg', category: 'Instructional Program', title: 'Contact Prayers (Salat)' },
];

export function VideoArchiveSection() {
    const [current, setCurrent] = React.useState(0);
    const [visible, setVisible] = React.useState(true);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const scheduleNext = React.useCallback(() => {
        const next = () => {
            timeoutRef.current = setTimeout(() => {
                setCurrent((c) => (c + 1) % VIDEO_SLIDES.length);
                setVisible(false);
                setTimeout(() => {
                    setVisible(true);
                    next();
                }, 380);
            }, 3800);
        };
        next();
    }, []);

    const goTo = (i: number) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setVisible(false);
        setTimeout(() => {
            setCurrent(i);
            setVisible(true);
            scheduleNext();
        }, 380);
    };

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
            setVisible(false);
            setTimeout(() => {
                if (diffX > 0) {
                    setCurrent((prev) => (prev + 1) % VIDEO_SLIDES.length);
                } else {
                    setCurrent((prev) => (prev - 1 + VIDEO_SLIDES.length) % VIDEO_SLIDES.length);
                }
                setVisible(true);
            }, 300);
        }
    };

    const slide = VIDEO_SLIDES[current];

    return (
        <article className="soft-shell grid gap-8 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="space-y-6">
                <div className="flex flex-col gap-5 border-b border-ed-rule pb-5 sm:flex-row sm:items-end">
                    <div className="flex items-end">
                        <span className="font-serif text-6xl leading-none text-ed-accent sm:text-7xl">I</span>
                    </div>
                    <h3 className="font-serif text-[clamp(2.1rem,10vw,3rem)] leading-[0.98] text-ed-fg sm:text-5xl lg:whitespace-nowrap">Video Archive</h3>
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

            <div 
                className="relative overflow-hidden rounded-xl border border-ed-rule touch-pan-y"
                onMouseEnter={pauseRotation}
                onMouseLeave={resumeRotation}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div className="relative z-10 flex h-full min-h-[360px] flex-col overflow-hidden bg-ed-bg p-3 sm:min-h-[440px]">
                <div
                    className="absolute inset-0 hidden scale-105 bg-cover bg-center opacity-30 blur-2xl sm:block"
                    style={{ backgroundImage: `url("${slide.src}")` }}
                />
                <div className="absolute inset-0 bg-ed-bg/64" />

                <div className="absolute inset-x-5 top-5 z-30 flex items-center justify-between border-b border-ed-rule pb-3 text-xs font-medium uppercase tracking-[0.12em] text-ed-fg-muted">
                    <span>Video Archive</span>
                    <span>{current + 1} / {VIDEO_SLIDES.length}</span>
                </div>

                <div className="relative z-10 flex h-full min-h-[336px] items-end pt-16 sm:min-h-[416px]">
                    <div className="relative w-full overflow-hidden rounded-[1.55rem] border border-ed-rule bg-[#111111] shadow-[0_28px_80px_rgba(0,0,0,0.24)]">
                        <div className="relative aspect-video overflow-hidden">
                            <Image
                                src={slide.src}
                                alt={slide.title}
                                fill
                                priority
                                quality={60}
                                className="object-cover"
                                sizes="(min-width: 1024px) 45vw, 100vw"
                                style={{
                                    filter: 'saturate(0.78) contrast(1.04)',
                                    opacity: visible ? 1 : 0,
                                    transform: visible ? 'scale(1)' : 'scale(1.05)',
                                    transition: 'opacity 0.4s ease, transform 4s ease-out',
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/86 via-[#111111]/18 to-transparent" />
                            <div aria-hidden="true" className="absolute left-5 top-5 flex h-12 w-12 items-center justify-center rounded-full border border-[#f6efe4]/16 bg-[#111111]/70 text-[#f6efe4] shadow-[0_4px_15px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-ed-accent hover:text-[#111111] hover:shadow-[0_0_15px_color-mix(in_srgb,var(--ed-accent)_40%,transparent)]">
                                <Play className="ml-0.5 h-4 w-4 fill-current" />
                            </div>
                            <div
                                className="absolute inset-x-0 bottom-0 p-5 sm:p-6"
                                style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.38s ease' }}
                            >
                                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[#f6ae82]">{slide.category}</p>
                                <p className="max-w-xl font-serif text-xl leading-tight text-[#f6efe4] sm:text-3xl">{slide.title}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-8 z-30 flex items-center gap-2">
                    {VIDEO_SLIDES.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => goTo(i)}
                            aria-label={`Go to slide ${i + 1}`}
                            aria-current={i === current ? 'true' : undefined}
                            className="group -mx-2.5 -my-4 flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        >
                            <span className={`h-1.5 rounded-full transition-all duration-300 ease-out ${i === current ? 'w-8 bg-ed-accent shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_80%,transparent)]' : 'w-2 bg-ed-rule group-hover:w-4 group-hover:bg-ed-fg-muted'}`} />
                        </button>
                    ))}
                </div>
            </div>
            </div>
        </article>
    );
}
