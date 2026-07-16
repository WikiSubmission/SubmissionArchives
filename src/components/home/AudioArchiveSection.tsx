'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Headphones, Play } from 'lucide-react';
import { useState } from 'react';

import { ExpectationCard } from './ExpectationCard';
import { SectionCta } from './SectionCta';

const AUDIO_CLIPS = [
    {
        id: 'qs01',
        label: 'Qur\'an study 01',
        title: 'Sura 72–73, Jinns and Night Prayer',
        thumbnail: '/content/audios/quran-studies/thumbnails/01-quran-study-from-azhar-1-sura-7219-28-and-sura-73-by-kathryn-jinns-05-26-1989.jpg',
        excerpt: 'When God\'s servant advocated Him alone, they almost crowded around him.',
        time: '18:42',
    },
    {
        id: 'qs07',
        label: 'Qur\'an study 07',
        title: 'Sura 62–63 and God\'s Religion Will Dominate',
        thumbnail: '/content/audios/quran-studies/thumbnails/07-quran-study-from-azhar-7-sura-62-and-sura-63-by-kathryn-gods-religion-will-dominate-in-20-to-50-yr.jpg',
        excerpt: 'The recording can be followed beside its searchable transcript and revisited by timestamp.',
        time: '31:06',
    },
    {
        id: 'messenger-audio',
        label: 'Messenger audio',
        title: 'Historical talks and preserved recordings',
        thumbnail: '/content/audios/messenger-audios/default.jpg',
        excerpt: 'The Messenger Audio collection preserves talks with titles, source context, and synchronized text where available.',
        time: 'Archive',
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
    const clip = AUDIO_CLIPS[selected];

    return (
        <article className="archive-section grid gap-10 border-b border-ed-rule pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-24">
            <div className="min-w-0 lg:order-2 lg:pt-5">
                <SectionHeading numeral="II" title="Audio archives" />
                <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                    Qur&apos;an studies and Messenger recordings paired with searchable transcripts for close listening, quotation, and historical research.
                </p>

                <div className="mt-8 grid gap-x-6 sm:grid-cols-2">
                    {AUDIO_CAPABILITIES.map((item, itemIndex) => (
                        <ExpectationCard
                            key={item.title}
                            index={String(itemIndex + 1).padStart(2, '0')}
                            title={item.title}
                            body={item.body}
                        />
                    ))}
                </div>

                <SectionCta href="/audios" label="Browse the audio archives" />
            </div>

            <div className="min-w-0 lg:order-1">
                <div className="overflow-hidden border border-ed-rule bg-ed-surface">
                    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center border border-ed-rule bg-ed-bg text-ed-accent">
                                <Headphones className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                                    Listening desk
                                </p>
                                <p className="mt-1 text-sm text-ed-fg">Transcript-linked audio</p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-ed-fg-muted">
                            {String(selected + 1).padStart(2, '0')} / {String(AUDIO_CLIPS.length).padStart(2, '0')}
                        </span>
                    </div>

                    <div className="bg-[#111111] px-4 py-5 text-[#f6efe4] sm:px-6 sm:py-7">
                        <div className="grid gap-5 sm:grid-cols-[9rem_1fr] sm:items-center">
                            <div className="relative aspect-square overflow-hidden border border-white/10 bg-[#1a1a19]">
                                <Image
                                    key={clip.thumbnail}
                                    src={clip.thumbnail}
                                    alt=""
                                    fill
                                    quality={60}
                                    sizes="144px"
                                    className="object-cover motion-safe:animate-[archive-media-reveal_520ms_cubic-bezier(0.16,1,0.3,1)]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                                <span className="absolute bottom-3 left-3 inline-flex h-11 w-11 items-center justify-center border border-white/25 bg-black/40 text-white">
                                    <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                                </span>
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#f6ae82]">{clip.label}</p>
                                <h4 className="mt-3 font-display text-2xl leading-[1.03] text-[#f6efe4] sm:text-3xl">
                                    {clip.title}
                                </h4>
                                <p className="mt-3 text-sm leading-7 text-[#cbbca9]">
                                    {clip.excerpt}
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 border-t border-white/12 pt-5">
                            <div className="flex h-20 items-center gap-[3px] overflow-hidden" aria-hidden="true">
                                {WAVEFORM.map((height, barIndex) => (
                                    <span
                                        key={`${clip.id}-${barIndex}`}
                                        className="block min-w-[3px] flex-1 rounded-full bg-[#f6ae82]/70 transition-[transform,opacity] duration-500"
                                        style={{
                                            height: `${height}%`,
                                            opacity: barIndex < 20 ? 0.86 : 0.38,
                                            transform: selected % 2 === 0 && barIndex % 3 === 0 ? 'scaleY(0.82)' : 'scaleY(1)',
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between font-mono text-xs tabular-nums text-[#cbbca9]">
                                <span>Matched passage</span>
                                <span className="text-[#f6ae82]">{clip.time}</span>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-ed-rule">
                        {AUDIO_CLIPS.map((item, itemIndex) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelected(itemIndex)}
                                aria-pressed={itemIndex === selected}
                                className={`grid min-h-20 w-full grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors sm:px-5 ${
                                    itemIndex === selected
                                        ? 'bg-ed-accent/8 text-ed-fg'
                                        : 'bg-ed-surface text-ed-fg-muted hover:bg-ed-bg hover:text-ed-fg'
                                }`}
                            >
                                <span className="relative aspect-square overflow-hidden border border-ed-rule bg-ed-bg">
                                    <Image src={item.thumbnail} alt="" fill quality={45} sizes="52px" className="object-cover" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[0.64rem] font-semibold uppercase tracking-[0.13em] text-ed-accent">
                                        {item.label}
                                    </span>
                                    <span className="mt-1 block truncate text-sm font-medium text-current">
                                        {item.title}
                                    </span>
                                </span>
                                <span className="font-mono text-xs tabular-nums text-ed-fg-muted">
                                    {String(itemIndex + 1).padStart(2, '0')}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-ed-rule px-4 py-4 sm:px-5">
                        <Link href="/audios" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ed-fg transition-colors hover:text-ed-accent">
                            Open the full listening interface
                            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        </Link>
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
