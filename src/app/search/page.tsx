import { Suspense } from 'react';
import type { Metadata } from 'next';
import SearchClient from './SearchClient';
import SearchLoading from './loading';

export const revalidate = 3600;

export const metadata: Metadata = {
    title: 'Search',
    description: 'Search across Quran study transcripts, messenger audios, video programs, appendices, books and Submitter Perspectives.',
};

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchLoading />}>
            <SearchClient />
        </Suspense>
    );
}
