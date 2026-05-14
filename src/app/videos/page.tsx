'use client';

import { useMemo } from 'react';
import { Database, PlayCircle, Sparkles } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MediaGrid } from '@/app/components/home/MediaGrid';
import { getTheme } from '@/lib/theme';
import { useTheme } from '@/app/components/ThemeProvider';
import type { Media } from '@/types/media';
import videosData from '../../../public/data/generated_indices/VIDEO_PROGRAMS_LIST.json';

type VideoRecord = Omit<Media, 'sortValue' | 'displayDate'> & {
    thumbnailOverride?: string;
    folder?: string;
    vttFile?: string;
    videoFile?: string;
};

type VideoSection = {
    id: string;
    title: string;
    description: string;
    videos: Media[];
};

const LOCAL_VIDEOS: Media[] = (videosData as VideoRecord[]).map((video, index) => ({
    ...video,
    sortValue: index + 1,
    displayDate: '',
}));

export default function VideosPage() {
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

        LOCAL_VIDEOS.forEach((video) => {
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
    }, []);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <Header />

            <main className="relative overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(246,174,130,0.12),_transparent_28%),linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.03)_100%)]" />
                    <div className="absolute inset-0 opacity-[0.09] [background-image:linear-gradient(rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.08)_1px,transparent_1px)] [background-size:108px_108px] dark:[background-image:linear-gradient(rgba(233,223,211,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(233,223,211,0.08)_1px,transparent_1px)]" />
                </div>

                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="grid gap-10 border border-ed-rule bg-ed-surface/70 p-6 backdrop-blur-sm sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 text-ed-accent">
                                <PlayCircle className="h-6 w-6" />
                                <span className="text-[0.68rem] uppercase tracking-[0.28em]">
                                    Visual archive
                                </span>
                            </div>
                            <h1 className="max-w-[11ch] font-display text-5xl leading-[0.92] text-ed-fg sm:text-6xl lg:text-7xl">
                                Moving image, arranged like a collection.
                            </h1>
                            <p className="max-w-[64ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                                These recordings are organized as preserved material rather than content inventory.
                                The light mode keeps the page airy and archival, while dark mode stays quiet and dense.
                            </p>
                        </div>

                        <div className="grid gap-px border border-ed-rule bg-ed-rule sm:grid-cols-3 lg:self-end">
                            <SurfaceStat label="Indexed videos" value={String(LOCAL_VIDEOS.length)} />
                            <SurfaceStat label="Major groupings" value="4" />
                            <SurfaceStat label="Presentation" value="Editorial" />
                        </div>
                    </header>

                    <div className="mt-16 space-y-20">
                        {categorizedVideos.map((section) => (
                            <section key={section.id} className="space-y-8">
                                <div className="grid gap-6 border-b border-ed-rule pb-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-ed-accent">
                                            <Database className="h-4 w-4" />
                                            <span className="text-[0.68rem] uppercase tracking-[0.24em]">
                                                {section.title}
                                            </span>
                                        </div>
                                        <h2 className="font-display text-3xl text-ed-fg sm:text-4xl">
                                            {section.title}
                                        </h2>
                                    </div>
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                        <p className="max-w-[48ch] text-sm leading-7 text-ed-fg-muted">
                                            {section.description}
                                        </p>
                                        <div className="inline-flex items-center gap-2 text-[0.64rem] uppercase tracking-[0.22em] text-ed-fg-muted">
                                            <Sparkles className="h-3.5 w-3.5 text-ed-accent" />
                                            {section.videos.length} records
                                        </div>
                                    </div>
                                </div>

                                <MediaGrid media={section.videos} theme={theme} viewMode="grid" />
                            </section>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function SurfaceStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-ed-surface px-5 py-5">
            <p className="font-display text-2xl text-ed-fg">{value}</p>
            <p className="mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-ed-fg-muted">{label}</p>
        </div>
    );
}
