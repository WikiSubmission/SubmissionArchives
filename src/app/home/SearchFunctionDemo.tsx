'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, Search, Play } from 'lucide-react';
import { getPublicAssetUrl } from '@/lib/mediaAssets';

export default function SearchFunctionDemo() {
    const [currentDate] = React.useState(() => {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    });

    // Fix the malformed URL
    const qsImageSrc = getPublicAssetUrl('/content/audio/quran-studies/45 Quran Study From Roxana 445 Sura 40 By Rashad Firoz\'s Home Deja Vu Believers Usually 95 Yrs Old F%20QS45.jpg');

    return (
        <div className="relative w-full overflow-hidden rounded-[1.25rem] bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_30px_80px_rgba(0,0,0,0.5)]">
            {/* Desktop Background Ambient Glow */}
            <div className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(55%_45%_at_50%_50%,color-mix(in_srgb,var(--ed-accent)_40%,transparent)_0%,transparent_100%)] opacity-60 sm:block" />

            {/* macOS Menu Bar */}
            <div className="relative z-10 flex w-full items-center justify-between px-4 py-1.5 text-[11px] font-medium text-white/70 bg-black/20 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <span className="font-bold text-white tracking-wide">Submission Archives</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">File</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Edit</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">View</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Go</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Window</span>
                    <span className="hidden sm:inline hover:text-white cursor-default">Help</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="hidden sm:inline opacity-50">100%</span>
                    <span>{currentDate}</span>
                </div>
            </div>

            {/* The Floating App Window Container */}
            <div className="relative z-20 mx-auto mb-6 mt-5 max-w-[94%] sm:mb-16 sm:mt-10 sm:max-w-[85%]">
                <div className="relative rounded-[1.25rem] p-[1px] overflow-hidden shadow-[0_0_24px_0_color-mix(in_srgb,var(--ed-accent)_8%,transparent),0_24px_48px_rgba(0,0,0,0.5)] sm:shadow-[0_0_40px_0_color-mix(in_srgb,var(--ed-accent)_10%,transparent),0_40px_80px_rgba(0,0,0,0.6)]">
                    {/* Rotating Raycast Glow for the App Window itself */}
                    <div className="absolute inset-[-100%] z-0 hidden animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,color-mix(in_srgb,var(--ed-accent)_60%,transparent)_15%,transparent_20%)] sm:block" />
                    
                    <div className="relative z-10 flex min-h-[560px] flex-col overflow-hidden rounded-[1.25rem] bg-ed-bg/92 px-3 py-6 sm:min-h-[620px] sm:px-8 sm:py-8">
                        {/* Premium Raycast-style Spotlight Background */}
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(85.77%_49.97%_at_51%_5.12%,color-mix(in_srgb,var(--ed-accent)_12%,transparent)_0%,transparent_100%)] opacity-50 dark:bg-[radial-gradient(85.77%_49.97%_at_51%_5.12%,color-mix(in_srgb,var(--ed-accent)_18%,transparent)_0%,transparent_100%)] dark:opacity-80" />

                <div className="search-demo-scene-search">
                    {/* Search Input Bar */}
                    <div className="relative mb-5 w-full">
                        <Search className="absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-ed-fg-muted" />
                        <div className="soft-pill relative flex w-full items-center bg-ed-surface px-11 py-4 pr-24 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] sm:px-12 sm:py-5 sm:pr-32">
                            <span className="flex min-w-0 flex-1 items-center font-sans text-sm text-ed-fg sm:text-base">
                                <span className="search-demo-type inline-block max-w-full overflow-hidden whitespace-nowrap align-bottom">
                                    covenant mathematical miracle
                                </span>
                                <span className="search-demo-caret ml-px inline-block h-5 w-[8px] animate-[pulse_1s_step-end_infinite] bg-ed-accent shadow-[0_0_10px_color-mix(in_srgb,var(--ed-accent)_80%,transparent)]" />
                            </span>
                        </div>
                        <div className="soft-pill absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-ed-bg px-3 py-2 text-[0.62rem] uppercase tracking-[0.14em] text-ed-fg shadow-sm sm:px-5 sm:py-2.5 sm:text-[0.68rem] sm:tracking-[0.22em]">
                            Search
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="mb-5 flex flex-wrap justify-center gap-2">
                        {['Videos', 'Quran Studies', 'Messenger Audios', 'Perspectives', 'Appendices'].map((item, index) => {
                            const active = index < 3;
                            return (
                                <span
                                    key={item}
                                    className={`soft-pill px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] transition sm:px-4 sm:py-2 sm:text-[0.68rem] ${
                                        active
                                            ? 'border-ed-accent/50 bg-ed-accent/12 text-ed-accent shadow-[inset_0_0_8px_color-mix(in_srgb,var(--ed-accent)_20%,transparent)]'
                                            : 'border-ed-rule bg-ed-surface text-ed-fg-muted'
                                    }`}
                                >
                                    {item}
                                </span>
                            );
                        })}
                    </div>

                    {/* Result Cards */}
                    <div className="relative space-y-3">
                        {/* Result 1 — selected */}
                        <div className="search-demo-result-1">
                            <article className="search-demo-selected soft-shell relative overflow-hidden transition-all backdrop-brightness-110 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] bg-white/5">
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ed-accent/10 to-transparent opacity-50" />
                                <div className="relative z-10 grid grid-cols-[72px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr] sm:gap-4 sm:p-4">
                                    <div className="soft-panel relative aspect-video overflow-hidden bg-ed-bg shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                        <Image src={qsImageSrc} alt="Quran Study 45" fill className="object-cover" sizes="120px" unoptimized />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">01</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.14em] text-ed-fg-muted sm:tracking-[0.2em]">Quran Studies</span>
                                            <span className="hidden soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.18em] text-ed-accent sm:inline-flex">Best match</span>
                                        </div>
                                        <h3 className="mt-2 font-display text-lg leading-tight text-ed-fg sm:text-2xl">Quran Study 45: Sura 40 &amp; Firoz&apos;s Home</h3>
                                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-ed-fg-muted">
                                            ...So, this is God&apos;s <span className="font-semibold text-ed-accent drop-shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_50%,transparent)]">mathematical</span> confirmation that we&apos;re living in an age where God will send the messenger of the <span className="font-semibold text-ed-accent drop-shadow-[0_0_8px_color-mix(in_srgb,var(--ed-accent)_50%,transparent)]">covenant</span>...
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>

                        {/* Result 2 */}
                        <div className="search-demo-result-2">
                            <article className="soft-shell overflow-hidden">
                                <div className="grid grid-cols-[72px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr] sm:gap-4 sm:p-4">
                                    <div className="soft-panel relative aspect-video overflow-hidden bg-ed-bg">
                                        <Image src="/images/video-programs/_Old_Message_New_Messenger.jpg" alt="Old Message New Messenger" fill quality={60} className="object-cover" sizes="120px" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">02</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-fg-muted">Videos</span>
                                            <span className="hidden soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.18em] text-ed-fg-muted sm:inline-flex">Close match</span>
                                        </div>
                                        <h3 className="mt-2 font-display text-lg leading-tight text-ed-fg sm:text-2xl">Old Message New Messenger</h3>
                                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-ed-fg-muted">
                                            ...the <span className="font-semibold text-ed-accent">covenant</span> was fulfilled through a <span className="font-semibold text-ed-accent">mathematical</span> code...
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>

                        {/* Result 3 */}
                        <div className="search-demo-result-3">
                            <article className="soft-shell overflow-hidden">
                                <div className="grid grid-cols-[72px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr] sm:gap-4 sm:p-4">
                                    <div className="soft-panel relative aspect-video overflow-hidden bg-ed-bg">
                                        <Image src="/images/messenger-audios/default.jpg" alt="Messenger Audio" fill quality={60} className="object-cover" sizes="120px" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-2 py-1 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">03</span>
                                            <span className="soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.12em] text-ed-fg-muted sm:tracking-[0.2em]">Audios</span>
                                            <span className="hidden soft-pill px-2 py-1 text-[0.56rem] uppercase tracking-[0.18em] text-ed-fg-muted sm:inline-flex">Relevant</span>
                                        </div>
                                        <h3 className="mt-2 font-display text-lg leading-tight text-ed-fg sm:text-2xl">Messenger Audio 14</h3>
                                        <p className="mt-1.5 line-clamp-2 text-[13px] leading-6 text-ed-fg-muted">
                                            ...this is a <span className="font-semibold text-ed-accent">miracle</span> from God, a proven <span className="font-semibold text-ed-accent">covenant</span>...
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </div>

                        {/* Scroll indicator */}
                        <div className="search-demo-scroll flex justify-center pt-2">
                            <div className="flex flex-col items-center gap-1 text-ed-fg-muted">
                                <span className="text-[0.56rem] uppercase tracking-[0.22em]">Selecting best result</span>
                                <ArrowRight className="h-3 w-3 rotate-90" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SCENE 2: Quran Study Media Page */}
                <div className="search-demo-scene-transcript absolute inset-0 flex flex-col px-4 pt-14 sm:px-8">
                    <div className="mx-auto w-full max-w-4xl">
                        {/* Back nav + category */}
                        <div className="mb-4 flex items-center gap-3">
                            <span className="soft-pill px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-ed-fg-muted">
                                &#8592; Back to results
                            </span>
                            <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-ed-accent">
                                Quran Studies
                            </span>
                        </div>

                        {/* Quran Study title + thumbnail */}
                        <div className="mb-5 flex items-start gap-4">
                            <div className="soft-panel relative hidden aspect-video w-[140px] shrink-0 overflow-hidden sm:block">
                                <Image src={qsImageSrc} alt="Quran Study 45" fill className="object-cover" sizes="140px" unoptimized />
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-display text-2xl leading-tight text-ed-fg sm:text-3xl">
                                    Quran Study 45: Sura 40 &amp; Firoz&apos;s Home
                                </h3>
                                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted">
                                    Quran Study 45 &middot; From Roxana
                                </p>
                            </div>
                        </div>

                        {/* Transcript passage with highlight */}
                        <div className="soft-shell p-4 sm:p-5">
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ed-accent">Best passage</span>
                                <span className="soft-pill bg-ed-bg px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted">
                                    Jump to 07:01
                                </span>
                            </div>
                            <p className="text-[15px] leading-8 text-ed-fg">
                                So, this is, this is God&apos;s
                                {' '}<span className="search-demo-highlight font-semibold text-ed-accent">mathematical</span>{' '}
                                confirmation that we&apos;re living in an age where God will send the messenger of the
                                {' '}<span className="search-demo-highlight font-semibold text-ed-accent">covenant</span>.
                            </p>
                        </div>

                        {/* Player */}
                        <div className="search-demo-player mt-5">
                            <div className="soft-shell bg-ed-surface px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
                                <div className="mb-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted">Now playing at matched timestamp</p>
                                        <p className="mt-1 text-sm text-ed-fg">Quran Study 45 &mdash; Sura 40</p>
                                    </div>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ed-accent text-[#111111] shadow-[0_0_30px_rgba(246,174,130,0.22)]">
                                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="font-mono text-xs text-ed-accent">07:01</span>
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ed-rule">
                                        <div className="search-demo-progress h-full rounded-full bg-ed-accent" />
                                    </div>
                                    <span className="font-mono text-xs text-ed-fg-muted">45:12</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
