'use client';

import { useMemo } from 'react';
import { MediaGrid } from '@/app/components/home/MediaGrid';
import { getTheme } from '@/lib/theme';
import { useTheme } from '@/app/components/ThemeProvider';
import type { Media } from '@/types/media';

type AudioSection = {
    id: string;
    title: string;
    description: string;
    audios: Media[];
};

export default function AudiosPageClient({ initialAudios }: { initialAudios: Media[] }) {
    const { darkMode } = useTheme();
    const theme = getTheme(darkMode);

    const categorizedAudios = useMemo<AudioSection[]>(() => {
        const sections: AudioSection[] = [
            {
                id: 'quran-studies',
                title: 'Quran studies',
                description: 'Verse-by-verse study sequences and deep study series by Dr. Rashad Khalifa.',
                audios: [],
            },
            {
                id: 'messenger-audios',
                title: 'Messenger audios',
                description: 'Older audios filled with Friday Sermons, Quran Studies, among other things.',
                audios: [],
            },
        ];

        initialAudios.forEach((audio) => {
            if (audio.type === 'quran-study') {
                sections.find((section) => section.id === 'quran-studies')?.audios.push(audio);
            } else if (audio.type === 'messenger-audio') {
                sections.find((section) => section.id === 'messenger-audios')?.audios.push(audio);
            }
        });

        return sections.filter((section) => section.audios.length > 0);
    }, [initialAudios]);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <main className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="relative overflow-hidden rounded-[1.25rem] bg-black/[0.02] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.02)] dark:bg-[#0a0a0a]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
                        {/* Deep Ambient Spotlight */}
                        <div className="pointer-events-none absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[var(--ed-accent)] opacity-[0.08] blur-[100px] dark:opacity-[0.15]" />
                        
                        <div className="relative z-10 space-y-6">
                            <span className="inline-flex items-center gap-2 px-1 text-[0.68rem] uppercase tracking-[0.24em] text-ed-accent font-medium">
                                <span className="h-1.5 w-1.5 rounded-full bg-ed-accent shadow-[0_0_8px_var(--ed-accent)]" />
                                Audio index
                            </span>
                            <h1 className="max-w-[11ch] font-display text-5xl leading-[0.92] text-transparent bg-clip-text bg-gradient-to-br from-ed-fg via-ed-fg to-ed-fg-muted drop-shadow-sm sm:text-6xl lg:text-7xl">
                                The Audio Archives
                            </h1>
                            <p className="max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                                Systematic study sequences and preserved recordings - arranged for steady, focused engagement.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-wrap items-end gap-3 lg:self-end lg:justify-end">
                            <StatPill value={String(initialAudios.length)} label="audio records" />
                            <StatPill value={String(categorizedAudios.length)} label="collections" />
                        </div>
                    </header>

                    <div className="mt-16 space-y-20">
                        {categorizedAudios.map((section) => (
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
                                        {section.audios.length} records
                                    </span>
                                </div>

                                <MediaGrid media={section.audios} theme={theme} viewMode="grid" />
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
