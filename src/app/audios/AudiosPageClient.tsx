'use client';

import { useMemo } from 'react';
import { PaginatedMediaGrid } from '@/components/media/PaginatedMediaGrid';
import type { Media } from '@/types/media';

type AudioSection = {
    id: string;
    title: string;
    description: string;
    audios: Media[];
};

export default function AudiosPageClient({ initialAudios }: { initialAudios: Media[] }) {
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
                description: 'Earlier recordings of Friday sermons, Qur\'an studies, and related archival material.',
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
            <main id="main-content" className="relative overflow-hidden">
                <div className="relative mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                    <header className="grid gap-10 border-y border-ed-rule py-10 sm:py-12 lg:grid-cols-[1fr_0.9fr]">
                        <div className="relative z-10 flex flex-col items-start gap-4">
                            <p className="archive-kicker">Audio index</p>
                            <h1 className="max-w-[16ch] font-display text-[clamp(2.5rem,6.5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.035em] text-ed-fg">
                                The Audio Archives
                            </h1>
                            <p className="max-w-[62ch] text-base leading-[1.65] tracking-[-0.01em] text-ed-fg-muted sm:text-lg">
                                Systematic study sequences and preserved recordings, arranged for steady, focused engagement.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-wrap items-end gap-3 lg:self-end lg:justify-end">
                            <StatPill value={String(initialAudios.length)} label="audio records" />
                            <StatPill value={String(categorizedAudios.length)} label="collections" />
                        </div>
                    </header>

                    <div className="mt-16 space-y-20">
                        {categorizedAudios.map((section) => (
                            <section key={section.id} id={section.id} className="space-y-8">
                                <div className="flex flex-col gap-4 border-b border-ed-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="flex flex-col items-start gap-3">
                                        <p className="archive-kicker">Collection</p>
                                        <h2 className="font-display text-2xl font-bold leading-[1.15] tracking-[-0.025em] text-ed-fg sm:text-3xl lg:text-4xl">
                                            {section.title}
                                        </h2>
                                        <p className="max-w-[64ch] text-sm sm:text-base leading-[1.6] text-ed-fg-muted">
                                            {section.description}
                                        </p>
                                    </div>
                                    <span className="text-sm tabular-nums text-ed-fg-muted">
                                        {section.audios.length} records
                                    </span>
                                </div>

                                <PaginatedMediaGrid media={section.audios} viewMode="grid" label={section.title} />
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
