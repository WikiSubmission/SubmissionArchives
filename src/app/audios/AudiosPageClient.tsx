'use client';

import { useMemo } from 'react';
import { PaginatedMediaGrid } from '@/components/media/PaginatedMediaGrid';
import '@/components/player/quran-study-golden-player.css';
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
        <div className="qs-golden-player audio-archive-shell min-h-screen">
            <div className="qs-page-bg" />
            <main id="main-content" className="relative overflow-hidden">
                <div className="qs-container py-6 sm:py-8 lg:py-12">
                    <header className="audio-archive-hero grid gap-8 lg:grid-cols-[1fr_0.9fr]">
                        <div className="relative z-10 flex flex-col items-start gap-4">
                            <p className="qs-audio-kicker">Audio index</p>
                            <h1 className="max-w-[16ch] font-display text-[clamp(2.5rem,6.5vw,4.5rem)] font-bold leading-[1.08] tracking-[-0.035em] text-[var(--qs-text-primary)]">
                                The Audio Archives
                            </h1>
                            <p className="max-w-[62ch] text-base leading-[1.65] tracking-[-0.01em] text-[var(--qs-text-secondary)] sm:text-lg">
                                Systematic study sequences and preserved recordings, arranged for steady, focused engagement.
                            </p>
                        </div>

                        <div className="relative z-10 flex flex-wrap items-end gap-3 lg:self-end lg:justify-end">
                            <StatPill value={String(initialAudios.length)} label="audio records" />
                            <StatPill value={String(categorizedAudios.length)} label="collections" />
                        </div>
                    </header>

                    <div className="mt-14 space-y-16">
                        {categorizedAudios.map((section) => (
                            <section key={section.id} id={section.id} className="audio-archive-section">
                                <div className="audio-section-header flex flex-col gap-4 pb-5 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="flex flex-col items-start gap-3">
                                        <p className="qs-audio-kicker">Collection</p>
                                        <h2 className="font-display text-headline font-bold text-[var(--qs-text-primary)]">
                                            {section.title}
                                        </h2>
                                        <p className="max-w-[64ch] text-sm leading-[1.6] text-[var(--qs-text-secondary)] sm:text-base">
                                            {section.description}
                                        </p>
                                    </div>
                                    <span className="text-sm tabular-nums text-[var(--qs-text-muted)]">
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
        <div className="audio-stat-pill group">
            <span className="block font-display text-2xl text-[var(--qs-text-primary)] transition-colors group-hover:text-[var(--qs-accent)]">{value}</span>
            <span className="mt-1 block text-[0.63rem] font-medium uppercase tracking-[0.14em] text-[var(--qs-text-muted)]">{label}</span>
        </div>
    );
}
