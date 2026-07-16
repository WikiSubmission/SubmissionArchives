import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QuranChapterClient from './QuranChapterClient';

export const dynamicParams = true;

export type QuranVerse = {
    verseNumber: number;
    verseId: string;
    arabic: string;
    arabicClean: string;
    transliterated: string;
    english: string;
    subtitle?: string;
    footnote?: string;
    editions?: {
        '1989'?: { english: string; subtitle?: string; footnote?: string; pdfPage?: number; printedPage?: number };
        '1981'?: { english: string; subtitle?: string; footnote?: string; pdfPage?: number; printedPage?: number };
    };
};

export type QuranChapter = {
    chapterNumber: number;
    verseCount: number;
    revelationOrder?: number;
    titleEnglish: string;
    titleArabic: string;
    titleTransliterated: string;
    verses: QuranVerse[];
};

const getChapters = cache((): QuranChapter[] => {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'QURAN_CHAPTERS.json');
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as QuranChapter[];
});

export async function generateStaticParams() {
    return getChapters().map((chapter) => ({ chapter: String(chapter.chapterNumber) }));
}

type Props = {
    params: Promise<{ chapter: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { chapter: chapterParam } = await params;
    const chapters = getChapters();
    const chapter = chapters.find((c) => c.chapterNumber === Number(chapterParam));
    if (!chapter) return { title: 'Sura Not Found' };

    const description = `Sura ${chapter.chapterNumber}, ${chapter.titleEnglish} (${chapter.titleTransliterated}): ${chapter.verseCount} verses, with English translation, footnotes, and subtitles.`;
    return {
        title: `${chapter.chapterNumber}. ${chapter.titleEnglish}`,
        description,
    };
}

export default async function QuranChapterPage({ params, searchParams }: Props) {
    const { chapter: chapterParam } = await params;
    const resolvedSearchParams = await searchParams;
    const chapterNumber = Number(chapterParam);

    const chapters = getChapters();
    const chapter = chapters.find((c) => c.chapterNumber === chapterNumber);
    if (!chapter) notFound();

    const prevChapter = chapters.find((c) => c.chapterNumber === chapterNumber - 1);
    const nextChapter = chapters.find((c) => c.chapterNumber === chapterNumber + 1);

    const initialVerse = resolvedSearchParams?.page ? Number(resolvedSearchParams.page) : undefined;
    const initialQuery = resolvedSearchParams?.q ? String(resolvedSearchParams.q).slice(0, 120) : '';
    const editionParam = typeof resolvedSearchParams?.edition === 'string' ? resolvedSearchParams.edition : '';
    const initialEdition = editionParam === '1989' || editionParam === '1981' ? editionParam : 'primary';

    return (
        <QuranChapterClient
            chapter={chapter}
            prev={prevChapter ? { chapterNumber: prevChapter.chapterNumber, titleEnglish: prevChapter.titleEnglish } : undefined}
            next={nextChapter ? { chapterNumber: nextChapter.chapterNumber, titleEnglish: nextChapter.titleEnglish } : undefined}
            initialVerse={Number.isFinite(initialVerse) && initialVerse! > 0 ? initialVerse : undefined}
            initialQuery={initialQuery}
            initialEdition={initialEdition}
        />
    );
}
