'use client';

import { ChevronLeft, FileText } from 'lucide-react';
import Link from 'next/link';

type Props = {
    pdfUrl: string;
    title: string;
    initialPage: number;
    initialQuery: string;
    prevId?: string | null;
    nextId?: string | null;
};

export default function PDFReaderClient({ pdfUrl, title, initialPage, initialQuery, prevId, nextId }: Props) {
    const viewerUrl = buildPdfViewerUrl(pdfUrl, initialPage, initialQuery);

    return (
        <div className="flex h-full flex-col bg-ed-bg text-ed-fg">
            <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-ed-rule bg-ed-surface px-4">
                <div className="flex min-w-0 items-center gap-4">
                    <Link
                        href="/search?filters=other"
                        className="flex items-center text-ed-fg-muted transition-colors hover:text-ed-fg"
                        title="Back to Search"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        <span className="ml-1 text-sm font-medium">Back</span>
                    </Link>

                    <div className="h-4 w-px bg-ed-rule" />

                    <h1 className="flex min-w-0 items-center gap-2 truncate text-sm font-semibold">
                        <FileText className="h-4 w-4 shrink-0 text-ed-accent" />
                        <span className="truncate">{title}</span>
                    </h1>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    {(prevId || nextId) && (
                        <div className="mr-4 flex items-center gap-1 border-r border-ed-rule pr-4">
                            {prevId ? (
                                <Link
                                    href={`/library/${prevId}`}
                                    className="rounded-sm p-1.5 text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg"
                                    title="Previous"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Link>
                            ) : (
                                <div className="w-8" />
                            )}

                            {nextId ? (
                                <Link
                                    href={`/library/${nextId}`}
                                    className="rounded-sm p-1.5 text-ed-fg-muted transition-colors hover:bg-ed-bg hover:text-ed-fg"
                                    title="Next"
                                >
                                    <ChevronLeft className="h-5 w-5 rotate-180" />
                                </Link>
                            ) : (
                                <div className="w-8" />
                            )}
                        </div>
                    )}

                    <Link href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-ed-fg-muted hover:text-ed-fg">
                        View Original PDF
                    </Link>
                </div>
            </header>

            <div className="min-h-0 flex-1 bg-ed-bg">
                <iframe
                    title={title}
                    src={viewerUrl}
                    className="h-full w-full border-0 bg-ed-bg"
                    referrerPolicy="same-origin"
                />
            </div>
        </div>
    );
}

function buildPdfViewerUrl(pdfUrl: string, initialPage: number, initialQuery: string) {
    const fragment = new URLSearchParams();
    fragment.set('page', String(Math.max(1, initialPage)));

    const query = initialQuery.trim();
    if (query) {
        fragment.set('search', query);
    }

    return `${pdfUrl}#${fragment.toString()}`;
}
