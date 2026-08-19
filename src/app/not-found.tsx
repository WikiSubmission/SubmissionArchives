import Link from 'next/link';
import type { Metadata } from 'next';
import { Compass, Home, Search, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Record Not Found — Submission Archives',
    description: 'The requested archival record or transmission does not exist in the collection.',
};

export default function NotFound() {
    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg flex flex-col justify-between">
            {/* Ambient background glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-10 flex-1 flex items-center justify-center px-4 py-16 sm:px-6 sm:py-24">
                <div className="max-w-xl w-full text-center space-y-8">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                        <Compass className="h-3 w-3" />
                        Archival Index · 404
                    </div>

                    {/* Headings */}
                    <div className="space-y-3">
                        <h1
                            className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.1] tracking-[-0.02em] text-ed-fg"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                            Record Not Found
                        </h1>
                        <p
                            className="text-[15px] sm:text-base text-ed-fg-secondary leading-[1.65] max-w-md mx-auto"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            The archival entry, document, or audio-visual recording you requested could not be located. It may have been re-indexed or cataloged under an alternative reference.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 rounded border border-ed-fg bg-ed-fg px-4 py-2.5 text-xs font-semibold text-ed-bg transition-all hover:opacity-90 active:scale-[0.98]"
                        >
                            <Home className="w-3.5 h-3.5" />
                            <span>Return Home</span>
                        </Link>
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 rounded border border-ed-rule bg-ed-surface px-4 py-2.5 text-xs font-semibold text-ed-fg-secondary transition-all hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:scale-[0.98]"
                        >
                            <Search className="w-3.5 h-3.5" />
                            <span>Search Records</span>
                        </Link>
                        <Link
                            href="/quran"
                            className="inline-flex items-center gap-2 rounded border border-ed-rule bg-ed-surface px-4 py-2.5 text-xs font-semibold text-ed-fg-secondary transition-all hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:scale-[0.98]"
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Browse Quran</span>
                        </Link>
                    </div>

                    {/* Quick helper note */}
                    <div className="pt-6 border-t border-ed-rule text-[11px] text-ed-fg-muted font-mono">
                        Reference: HTTP_STATUS_404 · Local Repository
                    </div>
                </div>
            </main>
        </div>
    );
}
