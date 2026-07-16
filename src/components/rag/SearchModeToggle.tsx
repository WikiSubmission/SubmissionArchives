'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './AskArchive.module.css';

interface SearchModeToggleProps {
    mode: 'search' | 'ask';
}

function buildModeHref(
    searchParams: URLSearchParams,
    mode: 'search' | 'ask',
): string {
    const params = new URLSearchParams(searchParams.toString());

    if (mode === 'ask') {
        params.set('mode', 'ask');
    } else {
        params.delete('mode');
    }

    const query = params.toString();
    return query ? `/search?${query}` : '/search';
}

export default function SearchModeToggle({ mode }: SearchModeToggleProps) {
    const searchParams = useSearchParams();

    return (
        <nav className={styles.modeToggle} aria-label="Archive discovery mode">
            <Link
                href={buildModeHref(searchParams, 'search')}
                aria-current={mode === 'search' ? 'page' : undefined}
                data-active={mode === 'search'}
                scroll={false}
            >
                Exact search
            </Link>

            <Link
                href={buildModeHref(searchParams, 'ask')}
                aria-current={mode === 'ask' ? 'page' : undefined}
                data-active={mode === 'ask'}
                scroll={false}
            >
                Ask the Archive
            </Link>
        </nav>
    );
}
