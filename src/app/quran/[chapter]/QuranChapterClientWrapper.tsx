'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuranChapterClient from './QuranChapterClient';
import type { QuranChapter, QuranChapterSummary } from './page';

type ChapterNav = { chapterNumber: number; titleEnglish: string };

type Props = {
    chapter: QuranChapter;
    allChapters: QuranChapterSummary[];
    prev?: ChapterNav;
    next?: ChapterNav;
};

function QuranChapterWithParams({ chapter, allChapters, prev, next }: Props) {
    const searchParams = useSearchParams();

    const pageParam = searchParams.get('page');
    const parsedVerse = pageParam ? Number(pageParam) : undefined;
    const initialVerse = parsedVerse !== undefined && Number.isFinite(parsedVerse) && parsedVerse > 0 ? parsedVerse : undefined;

    const initialQuery = (searchParams.get('q') ?? '').slice(0, 120);

    return (
        <QuranChapterClient
            chapter={chapter}
            allChapters={allChapters}
            prev={prev}
            next={next}
            initialVerse={initialVerse}
            initialQuery={initialQuery}
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
