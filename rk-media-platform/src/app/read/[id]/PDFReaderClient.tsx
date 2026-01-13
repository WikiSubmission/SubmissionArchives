'use client';

import React, { useEffect, useState } from 'react';
import { Viewer, Worker, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { searchPlugin } from '@react-pdf-viewer/search';
import { ChevronLeft, FileText, Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
};

export default function PDFReaderClient({ pdfUrl, title, initialPage, initialQuery }: Props) {
    const router = useRouter();
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
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-200">
            {/* Custom Header */}
            <header className="flex items-center justify-between h-14 bg-zinc-900 border-b border-zinc-800 px-4 shrink-0 z-10 relative">
                <div className="flex items-center gap-4">
                    <Link
                        href="/search?filters=other"
                        className="flex items-center text-zinc-400 hover:text-white transition-colors"
                        title="Back to Search"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium ml-1">Back</span>
                    </Link>

                    <div className="h-4 w-px bg-zinc-700" />

                    <h1 className="text-sm font-semibold truncate max-w-xl flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Example Custom Control: Toggle Outline from here if we wanted */}
                    <Link href={pdfUrl} target="_blank" className="text-xs text-zinc-500 hover:text-zinc-300">
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
                                theme="dark" // We override this with our CSS
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
                        <div className="text-zinc-500">Loading PDF viewer...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
