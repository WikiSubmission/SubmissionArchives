'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuranChapterClient from './QuranChapterClient';
import type { QuranChapter } from './page';

type ChapterNav = { chapterNumber: number; titleEnglish: string };

type Props = {
    chapter: QuranChapter;
    prev?: ChapterNav;
    next?: ChapterNav;
};

// The server page is fully static (prerendered via generateStaticParams). The
// verse/query/edition deep-link params are client-only concerns, so we read them
// here with useSearchParams (which requires the Suspense boundary below) rather
// than awaiting searchParams on the server, which would force dynamic rendering.
function QuranChapterWithParams({ chapter, prev, next }: Props) {
    const searchParams = useSearchParams();

    const pageParam = searchParams.get('page');
    const parsedVerse = pageParam ? Number(pageParam) : undefined;
    const initialVerse = parsedVerse !== undefined && Number.isFinite(parsedVerse) && parsedVerse > 0 ? parsedVerse : undefined;

    const initialQuery = (searchParams.get('q') ?? '').slice(0, 120);

    const editionParam = searchParams.get('edition');
    const initialEdition = editionParam === '1989' || editionParam === '1981' ? editionParam : 'primary';

    return (
        <QuranChapterClient
            chapter={chapter}
            prev={prev}
            next={next}
            initialVerse={initialVerse}
            initialQuery={initialQuery}
            initialEdition={initialEdition}
        />
    );
}

export default function QuranChapterClientWrapper(props: Props) {
    return (
        <Suspense>
            <QuranChapterWithParams {...props} />
        </Suspense>
    );
}
