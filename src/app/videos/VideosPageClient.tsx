'use client';

import { useMemo } from 'react';
import { PaginatedMediaGrid } from '@/components/media/PaginatedMediaGrid';
import { getTheme } from '@/lib/theme';
import { useTheme } from '@/components/providers/ThemeProvider';
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
                id: 'debates',
                title: 'Debates',
                description: 'Debates featuring Dr. Rashad Khalifa.',
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
            } else if (title.includes('debate')) {
                sections.find((section) => section.id === 'debates')?.videos.push(video);
            } else {
                sections.find((section) => section.id === 'programs')?.videos.push(video);
            }
        });

        return sections.filter((section) => section.videos.length > 0);
    }, [initialVideos]);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <main id="main-content" className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="grid gap-10 border-y border-ed-rule py-10 sm:py-12 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="relative z-10 space-y-6">
                            <p className="archive-kicker border-l-2 border-ed-accent pl-3">Video index</p>
                            <h1 className="max-w-[16ch] font-display text-[clamp(3rem,7vw,5.5rem)] leading-[0.9] text-ed-fg">
                                The Video Archive
                            </h1>
                            <p className="max-w-[64ch] text-base leading-8 text-ed-fg-muted sm:text-lg">
                                Sermons, instructional programs, and conference recordings, organized as a preserved study collection.
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
                            <section key={section.id} id={section.id} className="space-y-8">
                                <div className="flex flex-col gap-4 border-b border-ed-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="space-y-3">
                                        <p className="archive-kicker text-ed-fg-muted">Collection</p>
                                        <h2 className="font-display text-3xl text-ed-fg sm:text-4xl">
                                            {section.title}
                                        </h2>
                                        <p className="max-w-[64ch] text-base leading-7 text-ed-fg-muted">
                                            {section.description}
                                        </p>
                                    </div>
                                    <span className="text-sm tabular-nums text-ed-fg-muted">
                                        {section.videos.length} records
                                    </span>
                                </div>

                                <PaginatedMediaGrid media={section.videos} theme={theme} viewMode="grid" label={section.title} />
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
        <div className="group border-l border-ed-rule pl-4 first:border-l-0 first:pl-0">
            <span className="block font-display text-2xl text-ed-fg transition-colors group-hover:text-ed-accent">{value}</span>
            <span className="mt-1 block text-xs font-medium uppercase tracking-[0.12em] text-ed-fg-muted">{label}</span>
        </div>
    );
}
