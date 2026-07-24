'use client';

import { useSearchParams } from 'next/navigation';
import SearchClient from './SearchClient';
import AskArchiveClient from '@/components/rag/AskArchiveClient';

export default function SearchModeSwitcher() {
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') === 'ask' ? 'ask' : 'search';

    if (mode === 'ask') {
        return (
            <div className="min-h-screen bg-ed-bg text-ed-fg">
                <main id="main-content">
                    <AskArchiveClient />
                </main>
            </div>
        );
    }

    return <SearchClient />;
}
