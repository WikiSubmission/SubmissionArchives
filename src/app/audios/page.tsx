'use client';

import { useMemo } from 'react';
import { MediaGrid } from '@/app/components/home/MediaGrid';
import { getTheme } from '@/lib/theme';
import { useTheme } from '@/app/components/ThemeProvider';
import type { Media } from '@/types/media';
import audiosData from '../../../public/data/generated_indices/AUDIOS_LIST.json';

type AudioRecord = Media & {
    audioFile?: string;
    vttFile?: string;
};

type AudioSection = {
    id: string;
    title: string;
    description: string;
    audios: Media[];
};

const LOCAL_AUDIOS: Media[] = (audiosData as AudioRecord[]).map((audio, index) => ({
    ...audio,
    sortValue: index + 1,
    displayDate: '',
}));

export default function AudiosPage() {
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

        LOCAL_AUDIOS.forEach((audio) => {
            if (audio.type === 'quran-study') {
                sections.find((s) => s.id === 'quran-studies')?.audios.push(audio);
            } else if (audio.type === 'messenger-audio') {
                sections.find((s) => s.id === 'messenger-audios')?.audios.push(audio);
            }
        });

        return sections.filter((section) => section.audios.length > 0);
    }, []);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <main className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="soft-shell grid gap-8 p-6 backdrop-blur-sm sm:p-8 lg:grid-cols-[1fr_0.9fr] lg:p-10">
                        <div className="space-y-6">
                            <span className="soft-pill inline-flex px-4 py-2 text-[0.64rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                Audio index
                            </span>
                            <h1 className="max-w-[11ch] font-display text-5xl leading-[0.92] text-ed-fg sm:text-6xl lg:text-7xl">
                                The Audio Archives
                            </h1>
                            <p className="max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                                Systematic study sequences and preserved recordings — arranged for steady, focused engagement.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-end gap-3 lg:self-end lg:justify-end">
                            <StatPill value={String(LOCAL_AUDIOS.length)} label="audio records" />
                            <StatPill value={String(categorizedAudios.length)} label="collections" />
                        </div>
                    </header>

                    <div className="mt-16 space-y-20">
                        {categorizedAudios.map((section) => (
                            <section key={section.id} className="space-y-8">
                                <div className="flex flex-col gap-4 border-b border-ed-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="space-y-3">
                                        <span className="soft-pill inline-flex px-3 py-1.5 text-[0.58rem] uppercase tracking-[0.2em] text-ed-fg-muted">
                                            Collection
                                        </span>
                                        <h2 className="font-display text-3xl text-ed-fg sm:text-4xl">
                                            {section.title}
                                        </h2>
                                        <p className="max-w-[64ch] text-base leading-7 text-ed-fg-muted">
                                            {section.description}
                                        </p>
                                    </div>
                                    <span className="soft-pill shrink-0 px-4 py-2 text-[0.64rem] uppercase tracking-[0.22em] text-ed-fg-muted">
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
        <div className="soft-pill flex items-center gap-3 px-5 py-2.5">
            <span className="font-display text-xl text-ed-fg">{value}</span>
            <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ed-fg-muted">{label}</span>
        </div>
    );
}
