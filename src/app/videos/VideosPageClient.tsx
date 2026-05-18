'use client';

import { useMemo } from 'react';
import { MediaGrid } from '@/app/components/home/MediaGrid';
import { getTheme } from '@/lib/theme';
import { useTheme } from '@/app/components/ThemeProvider';
import type { Media } from '@/types/media';

type VideoSection = {
    id: string;
    title: string;
    description: string;
    videos: Media[];
};

export default function VideosPageClient({ initialVideos }: { initialVideos: Media[] }) {
    const { darkMode } = useTheme();
    const theme = getTheme(darkMode);

    const categorizedVideos = useMemo<VideoSection[]>(() => {
        const sections: VideoSection[] = [
            {
                id: 'programs',
                title: 'Video programs',
                description: 'Core broadcasts, explainers, and documentary-style presentations.',
                videos: [],
            },
            {
                id: 'instructional',
                title: 'Instructional works',
                description: 'Practical lessons and foundational teaching materials.',
                videos: [],
            },
            {
                id: 'sermons',
                title: 'Friday sermons',
                description: 'Chronological sermon material and preserved public addresses.',
                videos: [],
            },
            {
                id: 'conferences',
                title: 'USI conferences',
                description: 'Conference footage and public event documentation.',
                videos: [],
            },
        ];

        initialVideos.forEach((video) => {
            const title = video.title.toLowerCase();

            if (title.includes('friday sermon')) {
                sections.find((section) => section.id === 'sermons')?.videos.push(video);
            } else if (
                title.includes('united submitters international conference') ||
                title.includes('usi conference') ||
                title.includes('fulfillment of the covenant')
            ) {
                sections.find((section) => section.id === 'conferences')?.videos.push(video);
            } else if (
                title.includes('essentials of submission') ||
                title.includes('principles of contact prayers') ||
                title.includes('principles of friday prayer') ||
                title.includes('arabic language lessons')
            ) {
                sections.find((section) => section.id === 'instructional')?.videos.push(video);
            } else {
                sections.find((section) => section.id === 'programs')?.videos.push(video);
            }
        });

        return sections.filter((section) => section.videos.length > 0);
    }, [initialVideos]);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <main className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="relative overflow-hidden rounded-[1.25rem] bg-black/[0.02] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.02)] dark:bg-[#0a0a0a]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl grid gap-10 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
                        {/* Deep Ambient Spotlight */}
                        <div className="pointer-events-none absolute -right-40 -top-40 hidden h-96 w-96 rounded-full bg-[var(--ed-accent)] opacity-[0.08] blur-[100px] dark:opacity-[0.15] sm:block" />
                        
                        <div className="relative z-10 space-y-6">
                            <span className="inline-flex items-center gap-2 px-1 text-[0.68rem] uppercase tracking-[0.24em] text-ed-accent font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-ed-accent shadow-[0_0_8px_var(--ed-accent)]" />
                                Video index
                            </span>
                            <h1 className="max-w-[11ch] font-display text-5xl leading-[0.92] text-transparent bg-clip-text bg-gradient-to-br from-ed-fg via-ed-fg to-ed-fg-muted drop-shadow-sm sm:text-6xl lg:text-7xl">
                                The Video Archive
                            </h1>
                            <p className="max-w-[64ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                                Sermons, instructional programs, and conference recordings - organized as a preserved study collection.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-wrap items-end gap-3 lg:self-end lg:justify-end">
                            <StatPill value={String(initialVideos.length)} label="videos indexed" />
                            <StatPill value={String(categorizedVideos.length)} label="collections" />
                            <StatPill value="Editorial" label="presentation" />
                        </div>
                    </header>

                    <div className="mt-16 space-y-20">
                        {categorizedVideos.map((section) => (
                            <section key={section.id} className="space-y-8">
                                <div className="flex flex-col gap-4 border-b border-ed-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="space-y-3">
                                        <span className="inline-flex items-center gap-2 px-1 text-[0.58rem] uppercase tracking-[0.2em] text-ed-fg-muted">
                                            <span className="h-1 w-1 rounded-full bg-ed-fg-muted" />
                                            Collection
                                        </span>
                                        <h2 className="font-display text-3xl text-ed-fg sm:text-4xl">
                                            {section.title}
                                        </h2>
                                        <p className="max-w-[64ch] text-base leading-7 text-ed-fg-muted">
                                            {section.description}
                                        </p>
                                    </div>
                                    <span className="flex items-center gap-2 rounded-full px-4 py-2 bg-black/[0.02] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] text-[0.64rem] uppercase tracking-[0.22em] text-ed-fg-muted">
                                        {section.videos.length} records
                                    </span>
                                </div>

                                <MediaGrid media={section.videos} theme={theme} viewMode="grid" />
                            </section>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}

function StatPill({ value, label }: { value: string; label: string }) {
    return (
        <div className="group flex items-center gap-3 rounded-full px-5 py-2.5 bg-black/[0.02] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] hover:bg-black/[0.04] transition-colors dark:bg-[#0a0a0a]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-[#0a0a0a]/60 backdrop-blur-md">
            <span className="font-display text-xl text-ed-fg transition-colors group-hover:text-ed-accent">{value}</span>
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ed-fg-muted">{label}</span>
        </div>
    );
}
