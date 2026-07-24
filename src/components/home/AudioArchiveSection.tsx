'use client';

import Image from 'next/image';
import { Headphones, Pause, Play, Volume2 } from 'lucide-react';
import { useState } from 'react';

import { ExpectationCard } from './ExpectationCard';
import { Reveal } from './Reveal';
import { CtaLink, SectionCta } from './SectionCta';
import { SectionHeading } from './SectionHeading';
import { IconBadge, GlassSheen, activeChipClass, inactiveChipClass, widgetCardClass } from './WidgetAccents';

type AudioClip = {
    id: string;
    catalogNo: string;
    category: 'quran-study' | 'messenger-audio';
    label: string;
    title: string;
    date: string;
    thumbnail: string;
    excerpt: string;
    time: string;
    speaker: string;
    href: string;
};

const AUDIO_CLIPS: readonly AudioClip[] = [
    {
        id: 'qs01',
        catalogNo: 'QS-01',
        category: 'quran-study',
        label: 'Qur\'an Study 01',
        title: 'Sura 72–73, Jinns and Night Prayer',
        date: 'May 26, 1989',
        thumbnail: '/content/audios/quran-studies/thumbnails/01-quran-study-from-azhar-1-sura-7219-28-and-sura-73-by-kathryn-jinns-05-26-1989.jpg',
        excerpt: 'When God\'s servant advocated Him alone, they almost crowded around him in solid groups.',
        time: '18:42',
        speaker: 'Dr. Rashad Khalifa',
        href: '/audios/quran-studies/01-quran-study',
    },
    {
        id: 'qs07',
        catalogNo: 'QS-07',
        category: 'quran-study',
        label: 'Qur\'an Study 07',
        title: 'Sura 62–63 and God\'s Religion Will Dominate',
        date: 'June 1989',
        thumbnail: '/content/audios/quran-studies/thumbnails/07-quran-study-from-azhar-7-sura-62-and-sura-63-by-kathryn-gods-religion-will-dominate-in-20-to-50-yr.jpg',
        excerpt: 'The recording can be followed beside its searchable transcript and revisited by exact timestamp.',
        time: '31:06',
        speaker: 'Dr. Rashad Khalifa',
        href: '/audios/quran-studies/07-quran-study',
    },
    {
        id: 'messenger-audio',
        catalogNo: 'MSG-AUD',
        category: 'messenger-audio',
        label: 'Messenger Audio',
        title: 'Historical talks and preserved recordings',
        date: '1980–1989 Archive',
        thumbnail: '/content/audios/messenger-audios/default.jpg',
        excerpt: 'The Messenger Audio collection preserves talks with titles, source context, and synchronized text where available.',
        time: 'Archive',
        speaker: 'Dr. Rashad Khalifa',
        href: '/audios/messenger-audios',
    },
] as const;

const AUDIO_CAPABILITIES = [
    {
        title: 'Read while listening',
        body: 'Synchronized transcripts keep the active passage beside the recording.',
    },
    {
        title: 'Return by timestamp',
        body: 'Search results and transcript rows open the recording at the relevant moment.',
    },
    {
        title: 'Two audio collections',
        body: 'Qur\'an studies and Messenger Audios remain distinct while sharing one interface.',
    },
    {
        title: 'Quote with caution',
        body: 'Transcripts support research, while the original recording remains the source of record.',
    },
] as const;

const WAVEFORM = [34, 58, 42, 78, 54, 92, 63, 46, 72, 39, 84, 56, 68, 44, 88, 61, 36, 75, 52, 94, 66, 47, 81, 59, 38, 73, 49, 86, 62, 43, 79, 55] as const;

export function AudioArchiveSection() {
    const [selected, setSelected] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<'all' | 'quran-study' | 'messenger-audio'>('all');

    const filteredClips = AUDIO_CLIPS.filter(
        (c) => categoryFilter === 'all' || c.category === categoryFilter
    );

    const clip = filteredClips[Math.min(selected, filteredClips.length - 1)] || AUDIO_CLIPS[0];

    return (
        <article className="archive-section grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="min-w-0 lg:order-2 lg:pt-5">
                <Reveal>
                    <SectionHeading numeral="II" title="Audio archives" />
                </Reveal>
                <Reveal delay={80}>
                    <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                        Qur&apos;an studies and Messenger recordings paired with searchable transcripts for close listening, quotation, and historical research.
                    </p>
                </Reveal>

                <div className="mt-8 grid gap-x-6 divide-y divide-ed-rule sm:grid-cols-2">
                    {AUDIO_CAPABILITIES.map((item, itemIndex) => (
                        <Reveal key={item.title} delay={140 + itemIndex * 80}>
                            <ExpectationCard
                                index={String(itemIndex + 1).padStart(2, '0')}
                                title={item.title}
                                body={item.body}
                            />
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={140 + AUDIO_CAPABILITIES.length * 80}>
                    <SectionCta href="/audios" label="Browse the audio archives" />
                </Reveal>
            </div>

            <Reveal delay={160} className="min-w-0 lg:order-1">
                <div className={widgetCardClass}>
                    <GlassSheen />
                    {/* Header bar */}
                    <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-2.5 sm:px-5 bg-ed-surface/50">
                        <div className="flex items-center gap-3">
                            <IconBadge>
                                <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                            </IconBadge>
                            <div>
                                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                    Listening Desk · Transcript-Linked
                                </p>
                            </div>
                        </div>

                        {/* Collection Filter Pill Buttons */}
                        <div className="flex items-center gap-1.5">
                            {(['all', 'quran-study', 'messenger-audio'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() => {
                                        setCategoryFilter(filter);
                                        setSelected(0);
                                    }}
                                    className={`inline-flex min-h-7 items-center rounded-full border px-3 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ${
                                        categoryFilter === filter ? activeChipClass : inactiveChipClass
                                    }`}
                                >
                                    {filter === 'all' ? 'All' : filter === 'quran-study' ? "Qur'an Studies" : 'Messenger'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dark Console Player / Widget */}
                    <div className="bg-ed-console p-5 text-ed-console-fg sm:p-6">
                        {/* Top provenance metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ed-console-rule pb-3 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.15em] text-ed-console-muted">
                            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-white">[{clip.catalogNo}]</span>
                            <span>{clip.speaker}</span>
                            <span>{clip.date}</span>
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-[8.5rem_1fr] sm:items-center">
                            <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-ed-console-raised shadow-md">
                                <Image
                                    key={clip.thumbnail}
                                    src={clip.thumbnail}
                                    alt=""
                                    fill
                                    quality={70}
                                    sizes="144px"
                                    className="object-cover motion-safe:animate-[archive-media-reveal_520ms_cubic-bezier(0.16,1,0.3,1)]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <button
                                    type="button"
                                    onClick={() => setIsPlaying((p) => !p)}
                                    className="absolute bottom-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-white hover:text-black shadow-md"
                                    aria-label={isPlaying ? 'Pause audio demo' : 'Play audio demo'}
                                >
                                    {isPlaying ? (
                                        <Pause className="h-4 w-4 fill-current" />
                                    ) : (
                                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                                    )}
                                </button>
                            </div>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white">
                                        <Volume2 size={12} className={isPlaying ? 'animate-pulse text-white' : ''} />
                                        {isPlaying ? 'Now Playing' : clip.label}
                                    </span>
                                </div>
                                <h4 className="mt-2.5 font-sans text-xl font-extrabold leading-[1.1] tracking-tight text-ed-console-fg sm:text-2xl">
                                    {clip.title}
                                </h4>
                                <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">
                                    <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-white/80">
                                        Synchronized Passage [{clip.time}]
                                    </p>
                                    <p className="mt-1 text-xs leading-relaxed text-ed-console-muted">
                                        &ldquo;{clip.excerpt}&rdquo;
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Waveform Bar */}
                        <div className="mt-5 border-t border-ed-console-rule pt-4">
                            <div className="flex h-12 items-center gap-[3px] overflow-hidden" aria-hidden="true">
                                {WAVEFORM.map((height, barIndex) => {
                                    const isActive = isPlaying && barIndex % 4 === (selected * 3) % 4;
                                    return (
                                        <span
                                            key={`${clip.id}-${barIndex}`}
                                            className={`block min-w-[3px] flex-1 rounded-full transition-all duration-300 ${
                                                isActive
                                                    ? 'bg-ed-accent'
                                                    : barIndex < 18
                                                    ? 'bg-white/60'
                                                    : 'bg-white/15'
                                            }`}
                                            style={{
                                                height: isPlaying ? `${Math.min(100, height * (isActive ? 1.25 : 0.85))}%` : `${height}%`,
                                                opacity: barIndex < 18 ? 0.9 : 0.4,
                                            }}
                                        />
                                    );
                                })}
                            </div>
                            <div className="mt-2 flex items-center justify-between font-mono text-[0.7rem] tabular-nums text-ed-console-muted">
                                <span>Timestamp Match</span>
                                <span className="font-semibold text-white">{clip.time}</span>
                            </div>
                        </div>
                    </div>

                    {/* Clip Selector List */}
                    <div className="space-y-1 p-2 bg-ed-surface/40">
                        {filteredClips.map((item, itemIndex) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                    setSelected(itemIndex);
                                    setIsPlaying(true);
                                }}
                                aria-pressed={itemIndex === selected}
                                className={`grid w-full grid-cols-[2.75rem_1fr_auto] items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                                    itemIndex === selected
                                        ? 'border-ed-accent/50 bg-ed-accent/10 text-ed-fg shadow-sm shadow-ed-accent/20'
                                        : 'border-transparent text-ed-fg-muted hover:border-ed-rule hover:bg-ed-surface/50 hover:text-ed-fg'
                                }`}
                            >
                                <span className="relative aspect-square overflow-hidden rounded-lg border border-ed-rule bg-ed-bg">
                                    <Image src={item.thumbnail} alt="" fill quality={45} sizes="52px" className="object-cover" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block font-mono text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                                        [{item.catalogNo}] {item.label}
                                    </span>
                                    <span className="mt-0.5 block truncate font-sans text-xs font-semibold text-current">
                                        {item.title}
                                    </span>
                                </span>
                                <span className="font-mono text-xs tabular-nums text-ed-fg-muted px-2">
                                    {item.time}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Footer CTA link */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-3 sm:px-5 bg-ed-surface/50">
                        <CtaLink href={clip.href} label={`Listen to ${clip.label}`} />
                        <span className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                            80+ recordings available
                        </span>
                    </div>
                </div>
            </Reveal>
        </article>
    );
}
