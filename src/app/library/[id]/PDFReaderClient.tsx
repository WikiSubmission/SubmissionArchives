'use client';

import React, { useEffect, useState } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import { ChevronLeft, FileText, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/app/components/ThemeProvider';

// Styles
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/search/lib/styles/index.css';
import '../pdf-theme.css';

// PDF.js Worker
const WORKER_URL = 'https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js';

type Props = {
    pdfUrl: string;
    title: string;
    initialPage: number; // 1-based
    initialQuery: string;
    prevId?: string | null;
    nextId?: string | null;
};

export default function PDFReaderClient({ pdfUrl, title, initialPage, initialQuery, prevId, nextId }: Props) {
    const router = useRouter();
    const { darkMode } = useTheme();
    const [isMounted, setIsMounted] = useState(false);

    // Ensure component only renders on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Plugins
    const searchPluginInstance = searchPlugin({
        keyword: initialQuery,
    });
    const defaultLayoutPluginInstance = defaultLayoutPlugin({
        sidebarTabs: (defaultTabs) => [
            defaultTabs[0], // Thumbnails
            // defaultTabs[1], // Bookmarks (often empty for these PDFs)
            // defaultTabs[2], // Attachments
        ],
    });

    const { highlight, clearHighlights } = searchPluginInstance;
    const { toggleTab } = defaultLayoutPluginInstance;

    // Trigger initial search if present
    const [hasHighlighted, setHasHighlighted] = useState(false);

    useEffect(() => {
        if (initialQuery && !hasHighlighted && isMounted) {
            // Slight delay to ensure viewer is ready
            setTimeout(() => {
                highlight([initialQuery]);
                setHasHighlighted(true);
            }, 500);
        }
    }, [initialQuery, highlight, hasHighlighted, isMounted]);

    return (
        <div className="flex flex-col h-full bg-ed-bg text-ed-fg">
            {/* Custom Header */}
            <header className="flex items-center justify-between h-14 bg-ed-surface border-b border-ed-rule px-4 shrink-0 z-10 relative">
                <div className="flex items-center gap-4">
                    <Link
                        href="/search?filters=other"
                        className="flex items-center text-ed-fg-muted hover:text-ed-fg transition-colors"
                        title="Back to Search"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium ml-1">Back</span>
                    </Link>

                    <div className="h-4 w-px bg-ed-rule" />

                    <h1 className="text-sm font-semibold truncate max-w-xl flex items-center gap-2">
                        <FileText className="w-4 h-4 text-ed-accent" />
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Navigation Buttons */}
                    {(prevId || nextId) && (
                        <div className="flex items-center gap-1 mr-4 border-r border-ed-rule pr-4">
                            {prevId ? (
                                <Link
                                    href={`/library/${prevId}`}
                                    className="p-1.5 rounded-sm hover:bg-ed-bg text-ed-fg-muted hover:text-ed-fg transition-colors"
                                    title="Previous"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Link>
                            ) : <div className="w-8" />}

                            {nextId ? (
                                <Link
                                    href={`/library/${nextId}`}
                                    className="p-1.5 rounded-sm hover:bg-ed-bg text-ed-fg-muted hover:text-ed-fg transition-colors"
                                    title="Next"
                                >
                                    <ChevronLeft className="w-5 h-5 rotate-180" />
                                </Link>
                            ) : <div className="w-8" />}
                        </div>
                    )}

                    {/* Example Custom Control: Toggle Outline from here if we wanted */}
                    <Link href={pdfUrl} target="_blank" className="text-xs text-ed-fg-muted hover:text-ed-fg">
                        View Original PDF
                    </Link>
                </div>
            </header>

            {/* Viewer Container */}
            <div className="flex-1 overflow-hidden relative isolate">
                {/* The 'isolate' class and relative positioning isolate the viewer's stacking context 
                     so the header sits on top correctly. */}
                {isMounted ? (
                    <Worker workerUrl={WORKER_URL}>
                        <div className="h-full w-full">
                            <Viewer
                                fileUrl={pdfUrl}
                                initialPage={initialPage - 1} // Viewer uses 0-based indexing
                                defaultScale={SpecialZoomLevel.PageFit}
                                theme={darkMode ? 'dark' : 'light'} // PDF viewer follows the site theme.
                                plugins={[
                                    defaultLayoutPluginInstance,
                                    searchPluginInstance
                                ]}
                            // Key for true dark mode:
                            // We use CSS inversion, so we don't need excessive prop configuration here
                            // other than ensuring the text layer is rendered.
                            />
                        </div>
                    </Worker>
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <div className="text-ed-fg-muted">Loading PDF viewer...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
