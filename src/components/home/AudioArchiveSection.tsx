'use client';

import React from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/providers/ThemeProvider';
import { ExpectationCard } from './ExpectationCard';
import { SectionCta } from './SectionCta';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

// FEATURED PREVIEW — static data
const AUDIO_CLIPS = [
    {
        id: 'qs01',
        label: 'Quran Study',
        title: 'Sura 72–73: Jinns & Night Prayer',
        youtubeId: 'XKeWeiYcQOA',
        excerpt: '[72:19] When GOD\'s servant advocated Him alone…',
    },
    {
        id: 'qs07',
        label: 'Quran Study',
        title: 'Sura 62–63: God\'s Religion Will Dominate',
        youtubeId: 'aJUK9hsqmeQ',
        excerpt: '"The true Quran, the pure Quran, never existed in the past…"',
    },
];

function getYoutubeThumb(youtubeId: string) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
}

export function AudioArchiveSection() {
    const { darkMode } = useTheme();
    const [selected, setSelected] = React.useState(0);
    const clip = AUDIO_CLIPS[selected];
    const thumb = getYoutubeThumb(clip.youtubeId);

    return (
        <article className="soft-shell grid gap-8 p-5 sm:p-7 lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
            <div className="space-y-6">
                <div className="flex flex-col gap-5 border-b border-ed-rule pb-5 sm:flex-row sm:items-end">
                    <div className="flex items-end">
                        <span className="font-serif text-6xl leading-none text-ed-accent sm:text-7xl">II</span>
                    </div>
                    <h3 className="font-serif text-[clamp(2.1rem,10vw,3rem)] leading-[0.98] text-ed-fg sm:text-5xl lg:whitespace-nowrap">The Audio Archives</h3>
                </div>
                <div className="space-y-4">
                    <p className="max-w-[64ch] text-[15px] leading-8 text-ed-fg-muted">
                        Qur&apos;an studies and Messenger recordings with synchronized transcripts for careful listening and research.
                    </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <ExpectationCard title="Study sessions" body="Quran studies organized by sequence, topic, and transcript moments." />
                    <ExpectationCard title="Messenger recordings" body="Preserved talks and historical audio with context for careful listening." />
                    <ExpectationCard title="Read along" body="Synchronized transcripts make it possible to listen, quote, and return." />
                    <ExpectationCard title="Useful previews" body="Use the example display on the right to see a sample of how the Audios work with a live transcript." />
                </div>
                <SectionCta href="/audios" label="Browse the audio archive" />
            </div>

            <div className="relative overflow-hidden rounded-xl border border-ed-rule">
                <div className="relative z-10 flex h-full flex-col overflow-hidden bg-ed-bg p-2">
                    <div className="mx-2 mt-2 flex items-center justify-between border-b border-ed-rule px-1 py-3 text-xs font-medium uppercase tracking-[0.12em] text-ed-fg-muted">
                        <span>Audio Archive</span>
                        <span>{selected + 1} / {AUDIO_CLIPS.length}</span>
                    </div>

                    <div className="relative mx-2 mt-3 overflow-hidden rounded-[1.65rem] bg-[#111111] p-3 text-[#f6efe4]">
                        <div className="relative grid gap-4 sm:grid-cols-[176px_1fr] sm:items-end">
                            <div className="relative aspect-video overflow-hidden rounded-[1.2rem] border border-[#f6efe4]/10 bg-[#181817] shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
                                <ReactPlayer
                                    key={clip.youtubeId}
                                    url={`https://www.youtube.com/watch?v=${clip.youtubeId}`}
                                    light={thumb}
                                    controls
                                    playing
                                    width="100%"
                                    height="100%"
                                />
                            </div>
                            <div className="min-w-0 space-y-2 pb-1">
                                <p className="text-xs uppercase tracking-[0.18em] text-[#f6ae82]">
                                    {clip.label}
                                </p>
                                <h4 className="font-serif text-2xl leading-tight text-[#f6efe4] sm:text-3xl">
                                    {clip.title}
                                </h4>
                                <p className="max-w-[44ch] text-sm leading-6 text-[#cbbca9]">
                                    {clip.excerpt}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-2 p-2 sm:grid-cols-2">
                        {AUDIO_CLIPS.map((c, i) => (
                            <button
                                key={c.id}
                                type="button"
                                aria-pressed={i === selected}
                                onClick={() => setSelected(i)}
                                className={`relative flex w-full gap-3 rounded-[1.35rem] border px-3 py-3 text-left transition min-h-[44px] focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2 ${
                                    i === selected
                                        ? 'border-ed-accent/32 bg-ed-accent/8 text-ed-fg shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                                        : 'border-ed-rule bg-ed-surface/44 text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[1rem] border border-ed-rule">
                                    <Image src={getYoutubeThumb(c.youtubeId)} alt="" fill quality={50} className={`object-cover ${i === selected ? '' : 'grayscale'}`} sizes="56px" />
                                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${i === selected ? 'bg-[#111111]/45 opacity-100' : 'opacity-0'}`}>
                                        <span className="block border-y-[5px] border-l-[8px] border-y-transparent border-l-[#f6ae82]" />
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-ed-accent">{c.label}</p>
                                        <p className={`font-mono text-[0.68rem] tabular-nums ${i === selected ? 'text-ed-accent' : 'text-ed-fg-muted'}`}>
                                            {String(i + 1).padStart(2, '0')}
                                        </p>
                                    </div>
                                    <p className={`line-clamp-2 text-sm leading-snug transition-colors ${i === selected ? 'font-semibold text-ed-fg' : 'font-medium text-ed-fg/70'}`}>
                                        {c.title}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className={`soft-panel mx-2 mb-2 px-5 py-4 ${darkMode ? 'bg-[#0d0d0d]' : 'bg-[#e8e4de]'}`}>
                        <p className={`mb-3 text-xs uppercase tracking-[0.18em] ${darkMode ? 'text-white/26' : 'text-black/35'}`}>
                            Preview
                        </p>
                        <p
                            className="text-[15px] leading-6"
                            style={{ color: darkMode ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)' }}
                        >
                            {clip.excerpt}
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
