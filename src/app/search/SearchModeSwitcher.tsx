'use client';

import { useSearchParams } from 'next/navigation';
import SearchClient from './SearchClient';
import SearchModeToggle from '@/components/rag/SearchModeToggle';
import AskArchiveClient from '@/components/rag/AskArchiveClient';

export default function SearchModeSwitcher() {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') === 'ask' ? 'ask' : 'search';

    if (mode === 'ask') {
        return (
            <div className="min-h-screen bg-ed-bg text-ed-fg">
                <main id="main-content">
                    <div className="relative z-20 mx-auto max-w-[1440px] px-4 pt-7 sm:px-6 lg:px-10">
                        <SearchModeToggle mode="ask" />
                    </div>

                    <AskArchiveClient />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg">
            <div className="relative z-20 mx-auto max-w-[1440px] px-4 pt-7 sm:px-6 lg:px-10">
                <SearchModeToggle mode="search" />
            </div>

            <SearchClient />
        </div>
    );
}
