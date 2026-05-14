'use client';

import { Headphones, Mic2, Music, Radio, Waves } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function AudiosPage() {
    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <Header />

            <main className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(150,21,21,0.08),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(246,174,130,0.1),_transparent_28%)]" />
                </div>

                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="grid gap-8 border border-ed-rule bg-ed-surface/70 p-6 backdrop-blur-sm sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-ed-accent">
                                <Headphones className="h-6 w-6" />
                                <span className="text-[0.68rem] uppercase tracking-[0.28em]">
                                    Audio archive
                                </span>
                            </div>
                            <h1 className="max-w-[11ch] font-display text-5xl leading-[0.92] text-ed-fg sm:text-6xl lg:text-7xl">
                                A listening room for preserved voices.
                            </h1>
                            <p className="max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                                This section is being prepared for a fuller rollout. The theme system now carries
                                properly into light mode here, and the surface is ready for the audio collection to
                                be structured with the same calm editorial rhythm as the rest of the archive.
                            </p>
                        </div>

                        <div className="grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-3 lg:self-end">
                            <AudioStat label="Modes" value="Remastered" />
                            <AudioStat label="Intent" value="Study-first" />
                            <AudioStat label="Surface" value="Light and dark" />
                        </div>
                    </header>

                    <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="space-y-6 border border-ed-rule bg-ed-surface/68 p-6 sm:p-8">
                            <div className="flex items-center gap-3 text-ed-accent">
                                <Music className="h-5 w-5" />
                                <span className="text-[0.68rem] uppercase tracking-[0.24em]">
                                    Planned audio shelves
                                </span>
                            </div>
                            <div className="space-y-5">
                                {[
                                    ['Quran studies', 'Verse-by-verse study sequences and deep study series.'],
                                    ['Messenger audios', 'Historical recordings, talks, and preserved statements.'],
                                    ['Supplemental reflections', 'Curated long-form audio that belongs near the archive.'],
                                ].map(([title, body]) => (
                                    <div key={title} className="border-b border-ed-rule pb-5 last:border-0 last:pb-0">
                                        <h2 className="font-display text-2xl text-ed-fg">{title}</h2>
                                        <p className="mt-2 text-sm leading-7 text-ed-fg-muted">{body}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border border-dashed border-ed-rule bg-ed-surface/44 p-8 sm:p-10">
                            <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-ed-rule bg-ed-surface text-ed-accent">
                                    <Radio className="h-7 w-7" />
                                </div>
                                <h2 className="font-display text-4xl text-ed-fg sm:text-5xl">
                                    No audio records are currently indexed on this route.
                                </h2>
                                <p className="mt-5 max-w-[46ch] text-sm leading-8 text-ed-fg-muted sm:text-[15px]">
                                    The page now supports the new dual-theme presentation, but the actual audio
                                    catalog still needs to be wired into a visible library surface.
                                </p>
                                <div className="mt-8 inline-flex items-center gap-3 border border-ed-rule bg-ed-surface px-5 py-3 text-[0.68rem] uppercase tracking-[0.22em] text-ed-fg-muted">
                                    <Waves className="h-4 w-4 text-ed-accent" />
                                    Ready for catalog integration
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="mt-14 grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-3">
                        <AudioPill icon={Mic2} title="Verbatim" copy="Preserve source speech with minimal ornamental UI." />
                        <AudioPill icon={Radio} title="Atmosphere" copy="Light mode stays parchment-like, not flat white." />
                        <AudioPill icon={Headphones} title="Direction" copy="Listening experience should feel intimate and steady." />
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function AudioStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-ed-surface px-5 py-5">
            <p className="font-display text-2xl text-ed-fg">{value}</p>
            <p className="mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-ed-fg-muted">{label}</p>
        </div>
    );
}

function AudioPill({
    icon: Icon,
    title,
    copy,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    copy: string;
}) {
    return (
        <div className="bg-ed-surface px-6 py-6">
            <Icon className="h-5 w-5 text-ed-accent" />
            <h3 className="mt-4 font-display text-2xl text-ed-fg">{title}</h3>
            <p className="mt-2 text-sm leading-7 text-ed-fg-muted">{copy}</p>
        </div>
    );
}
