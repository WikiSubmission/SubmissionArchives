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
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <section className="soft-shell grid gap-6 p-5 sm:p-7 lg:p-8">
                    <div className="h-8 w-44 rounded-full bg-ed-muted" />
                    <div className="h-12 max-w-3xl rounded bg-ed-muted" />
                    <div className="h-16 rounded-[1.25rem] bg-ed-muted" />
                </section>
            </main>
        </div>
    );
}
