import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import type { Metadata } from 'next';
import QuranPageClient from '@/app/quran/QuranPageClient';

export const revalidate = 86400;

export type QuranChapterSummary = {
    chapterNumber: number;
    verseCount: number;
    revelationOrder?: number;
    titleEnglish: string;
    titleArabic: string;
    titleTransliterated: string;
};

type QuranChapter = QuranChapterSummary & {
    verses: unknown[];
};

const getChapters = cache((): QuranChapterSummary[] => {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'QURAN_CHAPTERS.json');
    if (!fs.existsSync(filePath)) return [];
    const chapters = JSON.parse(fs.readFileSync(filePath, 'utf8')) as QuranChapter[];
    return chapters.map(({ chapterNumber, verseCount, revelationOrder, titleEnglish, titleArabic, titleTransliterated }) => ({
        chapterNumber,
        verseCount,
        revelationOrder,
        titleEnglish,
        titleArabic,
        titleTransliterated,
    }));
});

export const metadata: Metadata = {
    title: "The Qur'an",
    description: "Read the Qur'an: Arabic text, English translation, footnotes, and subtitles for all 114 suras.",
};

export default function QuranPage() {
    const chapters = getChapters().sort((a, b) => a.chapterNumber - b.chapterNumber);
    return <QuranPageClient chapters={chapters} />;
}
