'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function LibraryReaderError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Library reader error:', error);
    }, [error]);

    return (
        <div className="min-h-screen w-full bg-ed-bg text-ed-fg flex flex-col justify-center items-center p-4 sm:p-6">
            <div className="max-w-md w-full text-center space-y-6 rounded-lg border border-ed-rule bg-ed-surface p-6 sm:p-8 shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ed-accent-soft border border-ed-accent/20 text-ed-accent">
                    <AlertCircle className="h-6 w-6" aria-hidden="true" />
                </div>

                <div className="space-y-2">
                    <h2
                        className="text-xl sm:text-2xl font-semibold leading-tight text-ed-fg"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                    >
                        Couldn&apos;t load this document
                    </h2>
                    <p
                        className="text-sm text-ed-fg-secondary leading-relaxed"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Something went wrong while preparing the reader. This might be a temporary issue with the document asset.
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

                <div className="flex items-center justify-center gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex items-center gap-2 rounded border border-ed-fg bg-ed-fg px-4 py-2 text-xs font-semibold text-ed-bg transition-all hover:opacity-90 active:scale-[0.98]"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Try again</span>
                    </button>
                    <Link
                        href="/search"
                        className="inline-flex items-center gap-2 rounded border border-ed-rule bg-ed-surface-strong px-4 py-2 text-xs font-semibold text-ed-fg-secondary transition-all hover:border-ed-rule-strong hover:text-ed-fg active:scale-[0.98]"
                    >
                        <Home className="h-3.5 w-3.5" />
                        <span>Back to search</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
