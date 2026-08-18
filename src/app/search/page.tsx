import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchClient from './SearchClient';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Search',
    description: 'Search across Quran study transcripts, messenger audios, video programs, appendices, and Submitter Perspectives.',
};

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchLoadingShell />}>
            <SearchClient />
        </Suspense>
    );
}

function SearchLoadingShell() {
    return (
        <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB]">
            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[880px] px-4 py-8 sm:px-7 lg:py-12">
                    <div className="mb-5 h-4 w-40 animate-pulse rounded-[4px] bg-[#1C1B1A]" />
                    <div className="mb-7 space-y-3 border-b border-[#2A2928] pb-7">
                        <div className="h-6 w-48 animate-pulse rounded-[4px] bg-[#1C1B1A]" />
                        <div className="h-10 w-72 animate-pulse rounded-[4px] bg-[#1C1B1A]" />
                    </div>
                    <div className="animate-pulse rounded-[8px] border border-[#2A2928] bg-[#161514] p-6">
                        <div className="h-12 w-full rounded-[4px] bg-[#1C1B1A]" />
                    </div>
                </div>
            </main>
        </div>
    );
}
