'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled application error:', error);
    }, [error]);

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg flex items-center justify-center p-4 sm:p-6">
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

            <div className="relative z-10 max-w-lg w-full text-center space-y-6 rounded-lg border border-ed-rule bg-ed-surface p-6 sm:p-8 shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ed-accent-soft border border-ed-accent/20 text-ed-accent">
                    <AlertCircle className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="space-y-2">
                    <div className="inline-block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ed-accent">
                        System Notice · Interrupted
                    </div>
                    <h1
                        className="text-2xl sm:text-3xl font-semibold leading-tight text-ed-fg"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                    >
                        Unable to complete request
                    </h1>
                    <p
                        className="text-[14px] text-ed-fg-secondary leading-relaxed"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        An unexpected condition occurred while rendering this view. You may reload the view or return to the main catalog.
                    </p>
                </div>

                {process.env.NODE_ENV === 'development' && error.message && (
                    <div className="rounded border border-ed-rule bg-ed-surface-strong p-3 text-left font-mono text-[11px] text-ed-accent break-all">
                        {error.message}
                        {error.digest && (
                            <div className="mt-1 text-[9px] text-ed-fg-muted">Digest: {error.digest}</div>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-2 rounded border border-ed-fg bg-ed-fg px-4 py-2 text-xs font-semibold text-ed-bg transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Try again</span>
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded border border-ed-rule bg-ed-surface-strong px-4 py-2 text-xs font-semibold text-ed-fg-secondary transition-all hover:border-ed-rule-strong hover:text-ed-fg active:scale-[0.98]"
                    >
                        <Home className="h-3.5 w-3.5" />
                        <span>Return home</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
