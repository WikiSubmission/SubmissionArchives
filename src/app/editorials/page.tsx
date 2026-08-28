import type { Metadata } from 'next';
import { Layers } from 'lucide-react';

import EditorialCard from '@/components/editorials/EditorialCard';
import { getEditorials } from '@/lib/editorials';

import './editorials.css';

export const metadata: Metadata = {
    title: 'Archive Research Editorials',
    description:
        'Long-form research notes, preservation methodologies, and technical accounts of how the Submission Archives historical record is acquired, digitized, transcribed, and indexed.',
};

export default function EditorialsIndexPage() {
    const editorials = getEditorials();
    const pinnedSlug = 'how-the-archive-is-assembled';
    const pinnedEditorial = editorials.find((e) => e.slug === pinnedSlug);
    const chronologicalEditorials = editorials.filter((e) => e.slug !== pinnedSlug);

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            {/* Ambient page glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                {/* Hero Header */}
                <header className="mb-10 flex flex-wrap items-end justify-between gap-8 border-b border-ed-rule pb-8">
                    <div className="max-w-[640px]">
                        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/20 bg-ed-accent-soft px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-ed-accent" style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}>
                            Archive Research Editorials
                        </div>
                        <h1
                            className="mb-3 text-[clamp(2.5rem,4vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg"
                            style={{ fontFamily: 'var(--font-editorial-serif, var(--font-new-york, Georgia, serif))' }}
                        >
                            Archive Editorials
                        </h1>
                        <p
                            className="text-[clamp(1.0625rem,1.2vw,1.1875rem)] leading-[1.6] text-ed-fg-secondary"
                            style={{ fontFamily: 'var(--font-editorial-sans, var(--font-inter, sans-serif))' }}
                        >
                            Long-form research notes, preservation methodologies, and technical accounts of how the historical
                            record is acquired, digitized, transcribed, and indexed.
                        </p>
                    </div>

                    <div className="flex flex-shrink-0 gap-6 rounded-[8px] border border-ed-rule bg-ed-surface px-6 py-3.5 shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-mono text-[22px] font-medium leading-[1.1] text-ed-fg" style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}>
                                {editorials.length}
                            </span>
                            <span className="mt-0.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
                                Published
                            </span>
                        </div>
                        <div className="flex flex-col border-l border-ed-rule pl-6">
                            <span className="font-mono text-[22px] font-medium leading-[1.1] text-ed-fg" style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}>
                                4 Stages
                            </span>
                            <span className="mt-0.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
                                Pipeline
                            </span>
                        </div>
                        <div className="flex flex-col border-l border-ed-rule pl-6">
                            <span className="font-mono text-[22px] font-medium leading-[1.1] text-ed-fg" style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}>
                                100%
                            </span>
                            <span className="mt-0.5 font-sans text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
                                Audited
                            </span>
                        </div>
                    </div>
                </header>

                {/* Section Header */}
                <div className="mb-6 flex items-center gap-4 border-b border-ed-rule pb-3">
                    <h2
                        className="whitespace-nowrap text-[clamp(1.25rem,1.8vw,1.5rem)] font-semibold tracking-[-0.015em] text-ed-fg"
                        style={{ fontFamily: 'var(--font-editorial-serif, var(--font-new-york, Georgia, serif))' }}
                    >
                        Published Editorials &amp; Monographs
                    </h2>
                    <div className="h-px flex-1 bg-ed-rule" />
                    <span
                        className="whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ed-fg-muted"
                        style={{ fontFamily: 'var(--font-editorial-mono, monospace)' }}
                    >
                        {editorials.length} Article{editorials.length === 1 ? '' : 's'}
                    </span>
                </div>

                {editorials.length === 0 ? (
                    <div className="py-20 text-center">
                        <Layers className="mx-auto mb-3 h-8 w-8 text-ed-fg-faint" />
                        <p className="text-[15px] font-medium text-ed-fg-muted">
                            No editorials have been published yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Pinned Foundational Article */}
                        {pinnedEditorial ? (
                            <section aria-label="Pinned Editorial">
                                <ul className="list-none">
                                    <li>
                                        <EditorialCard
                                            editorial={pinnedEditorial}
                                            index={1}
                                            headingLevel={3}
                                            isPinned={true}
                                        />
                                    </li>
                                </ul>
                            </section>
                        ) : null}

                        {/* Chronological Research Articles */}
                        <section aria-label="Research Monographs">
                            <ul className="list-none border-t border-ed-rule">
                                {chronologicalEditorials.map((editorial, index) => (
                                    <li key={editorial.slug}>
                                        <EditorialCard
                                            editorial={editorial}
                                            index={index + 2}
                                            headingLevel={3}
                                        />
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </div>
                )}

                <footer className="mt-20 border-t border-ed-rule py-9 text-center text-[12px] font-medium tracking-[0.04em] text-ed-fg-muted">
                    Dedicated to preserving and sharing the message of God alone.
                </footer>
            </main>
        </div>
    );
}
