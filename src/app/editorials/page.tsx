import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight } from 'lucide-react';

import EditorialCard from '@/components/editorials/EditorialCard';
import { getEditorials } from '@/lib/editorials';

export const metadata: Metadata = {
    title: 'Archive Editorials — Submission Archives',
    description:
        'Long-form editorials drawn from the archive: research notes, historical context, and readings of the preserved record.',
};

export default function EditorialsIndexPage() {
    const editorials = getEditorials();

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            <main id="main-content" className="mx-auto max-w-[1160px] px-4 py-8 sm:px-7 lg:py-12">
                <header className="mb-10 flex flex-wrap items-end justify-between gap-8 border-b border-ed-rule pb-8">
                    <div className="max-w-[640px]">
                        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                            Archive Editorials
                        </div>
                        <h1
                            className="mb-3 text-[clamp(32px,4.2vw,46px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                            Editorials
                        </h1>
                        <p
                            className="text-[16.5px] leading-[1.6] text-ed-fg-secondary"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            Long-form readings of the preserved record: research notes, historical context, and
                            explanations of what the archive holds and how it was assembled.
                        </p>
                    </div>

                    <Link
                        href="/written"
                        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ed-accent transition-colors hover:opacity-90"
                    >
                        Back to the Written Archives
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                </header>

                {editorials.length === 0 ? (
                    <p className="py-16 text-center text-[14px] text-ed-fg-muted">
                        No editorials have been published yet.
                    </p>
                ) : (
                    <ul className="list-none border-t border-ed-rule">
                        {editorials.map((editorial, index) => (
                            <li key={editorial.slug}>
                                <EditorialCard editorial={editorial} index={index + 1} headingLevel={2} />
                            </li>
                        ))}
                    </ul>
                )}

                <footer className="mt-16 border-t border-ed-rule py-9 text-center text-[12px] font-medium tracking-[0.04em] text-ed-fg-muted">
                    Dedicated to preserving and sharing the message of God alone.
                </footer>
            </main>
        </div>
    );
}
