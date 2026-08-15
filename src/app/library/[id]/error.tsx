'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
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
        <div className="h-screen w-screen bg-ed-bg text-ed-fg flex flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-ed-rule bg-ed-surface/90 px-3 py-3 sm:px-4">
                <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-ed-muted/50" />
                    <div className="h-4 w-28 rounded bg-ed-muted/50 sm:w-40" />
                </div>
            </div>

            <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                        <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg sm:text-xl font-bold leading-[1.25] tracking-[-0.018em] text-ed-fg">
                            Couldn&apos;t load this document
                        </h2>
                        <p className="text-sm text-ed-fg-muted leading-[1.6]">
                            Something went wrong while preparing the reader. This might be a temporary issue with the document or your connection.
                        </p>
                    </div>

                    {process.env.NODE_ENV === 'development' && (
                        <div className="rounded-xl border border-ed-rule bg-ed-surface/50 p-4 text-left">
                            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
                            {error.digest && (
                                <p className="mt-1 text-xs font-mono text-ed-fg-muted">Digest: {error.digest}</p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-center gap-3">
                        <button
                            onClick={reset}
                            className="inline-flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface px-4 py-2.5 text-sm font-medium text-ed-fg hover:bg-ed-surface/80 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try again
                        </button>
                        <Link
                            href="/search"
                            className="inline-flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface px-4 py-2.5 text-sm font-medium text-ed-fg hover:bg-ed-surface/80 transition-colors"
                        >
                            <Home className="h-4 w-4" />
                            Back to search
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
