import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import QuranChapterClientWrapper from './QuranChapterClientWrapper';

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

// Module-level singleton cache: QURAN_CHAPTERS.json is ~7.5MB and static for the
// life of the process. Parsing it once (rather than per-render via React's
// cache(), which only dedupes within a single render) keeps build and any
// on-demand render cheap.
let chaptersCache: QuranChapter[] | null = null;

function getChapters(): QuranChapter[] {
    if (chaptersCache) return chaptersCache;
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'QURAN_CHAPTERS.json');
    if (!fs.existsSync(filePath)) return [];
    chaptersCache = JSON.parse(fs.readFileSync(filePath, 'utf8')) as QuranChapter[];
    return chaptersCache;
}

export async function generateStaticParams() {
    return getChapters().map((chapter) => ({ chapter: String(chapter.chapterNumber) }));
}

type Props = {
    params: Promise<{ chapter: string }>;
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

export default async function QuranChapterPage({ params }: Props) {
    const { chapter: chapterParam } = await params;
    const chapterNumber = Number(chapterParam);

    const chapters = getChapters();
    const chapter = chapters.find((c) => c.chapterNumber === chapterNumber);
    if (!chapter) notFound();

    const prevChapter = chapters.find((c) => c.chapterNumber === chapterNumber - 1);
    const nextChapter = chapters.find((c) => c.chapterNumber === chapterNumber + 1);

    return (
        <QuranChapterClientWrapper
            chapter={chapter}
            prev={prevChapter ? { chapterNumber: prevChapter.chapterNumber, titleEnglish: prevChapter.titleEnglish } : undefined}
            next={nextChapter ? { chapterNumber: nextChapter.chapterNumber, titleEnglish: nextChapter.titleEnglish } : undefined}
        />
    );
}
