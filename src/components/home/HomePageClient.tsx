'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { HeroSection } from './HeroSection';
import { VideoArchiveSection } from './VideoArchiveSection';
import { AudioArchiveSection } from './AudioArchiveSection';
import { ArchiveBranch } from './ArchiveBranch';

const archiveBranches = [
    {
        numeral: 'III',
        title: 'The Search Function',
        body: 'Search across Quran study transcripts, messenger audios, video programs, appendices, Submitter Perspectives, and other works.',
        href: '/search',
        cta: 'Search the archive',
        accent: 'Cross-collection recall',
        meta: 'Names, verses, phrases, and references across the corpus',
        cardTitle: 'Search across\nthe full archive',
        details: [
            {
                title: 'Proximity aware',
                body: 'Find passages where related terms appear near each other, not just exact phrase matches.',
            },
            {
                title: 'Cross-format',
                body: 'One query can surface transcript moments, video programs, written works, and appendices together.',
            },
            {
                title: 'Playable results',
                body: 'Audio and video matches open at the relevant time so search becomes immediate study.',
            },
        ],
        icon: Search,
        align: 'center' as const,
        kind: 'search' as const,
    },
];

export default function HomePageClient() {
    const handlePathwayPointerMove = React.useCallback((event: React.PointerEvent<HTMLElement>) => {
        if (!window.matchMedia('(pointer: fine)').matches) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        event.currentTarget.style.setProperty('--cursor-x', `${x}%`);
        event.currentTarget.style.setProperty('--cursor-y', `${y}%`);
    }, []);

    return (
        <div className="relative min-h-screen overflow-hidden bg-ed-bg text-ed-fg">
            <main id="main-content" className="relative z-10">
                <HeroSection />

                <section
                    className="archive-cursor-field relative mx-auto max-w-[1440px] px-4 pb-8 pt-16 sm:px-6 lg:px-10 lg:pt-20"
                    onPointerMove={handlePathwayPointerMove}
                    style={{ '--cursor-x': '50%', '--cursor-y': '42%' } as React.CSSProperties}
                >
                    <div className="relative mb-10 flex min-h-[120px] flex-col justify-end gap-6 border-b border-ed-rule pb-7 lg:mb-12">
                        <div className="space-y-5">
                            <p className="archive-kicker text-ed-fg-muted">
                                Branches of the archive
                            </p>
                            <h2 className="max-w-[18ch] font-serif text-[clamp(2.4rem,10vw,4.25rem)] leading-[0.95] text-ed-fg [text-wrap:balance] sm:max-w-none">
                                Three pathways into the collection.
                            </h2>
                        </div>
                    </div>

                    <div className="relative space-y-16 lg:space-y-24">
                        <VideoArchiveSection />
                        <AudioArchiveSection />
                        {archiveBranches.map((branch) => (
                            <ArchiveBranch key={branch.numeral} {...branch} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
