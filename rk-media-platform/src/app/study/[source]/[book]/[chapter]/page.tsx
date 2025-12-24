import React from 'react';
import { notFound } from 'next/navigation';
import StudyReader from '@/components/Study/StudyReader';
import { fetchChapterNotes, StudyEntry } from '@/lib/studyActions';
import { fetchNTChapter, fetchQuranChapter, ScriptureChapterData } from '@/app/scripture/actions';
import { fetchSefariaText } from '@/lib/scriptureUtils';

interface PageProps {
    params: Promise<{
        source: string;
        book: string;
        chapter: string;
    }>
}

export default async function StudyPage({ params }: PageProps) {
    const { source, book, chapter } = await params;
    const chapterNum = parseInt(chapter);

    if (isNaN(chapterNum)) return notFound();

    const decodedBook = decodeURIComponent(book).replace(/_/g, ' ');

    let chapterData: ScriptureChapterData | null = null;

    // --- FETCH SCRIPTURE TEXT ---
    try {
        if (source === 'new-testament') {
            chapterData = await fetchNTChapter(decodedBook, chapterNum);
        } else if (source === 'quran') {
            // Note: Quran "book" is typically "Sura", but route might imply 'Quran/Sura/1'
            // Assuming 'book' param is ignored or verified for Quran route structure
            chapterData = await fetchQuranChapter(chapterNum);
        } else if (source === 'old-testament') {
            const sefariaData = await fetchSefariaText(decodedBook, chapterNum);
            if (sefariaData) {
                // Adapt Sefaria format to ScriptureChapterData
                chapterData = {
                    ref: sefariaData.ref,
                    verses: sefariaData.text.map((text, idx) => ({
                        num: idx + 1,
                        en: text,
                        he: sefariaData.he[idx] || '',
                    })),
                    next: !!sefariaData.next,
                    prev: !!sefariaData.prev,
                };
            }
        }
    } catch (e) {
        console.error("Error fetching scripture text:", e);
    }

    if (!chapterData) {
        // Fallback or 404
        return (
            <div className="p-12 text-center">
                <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
                <p className="text-muted-foreground">Unable to load text for {source} {decodedBook} {chapter}.</p>
            </div>
        );
    }

    // --- FETCH STUDY NOTES ---
    // Fetch notes for this chapter from Supabase
    // We normalize book name for DB consistency (e.g., "Genesis" not "genesis")
    const notes: StudyEntry[] = await fetchChapterNotes(source, decodedBook, chapterNum);

    return (
        <StudyReader
            chapterData={chapterData}
            notes={notes}
            source={source}
            bookName={decodedBook}
            chapterNum={chapterNum}
        />
    );
}
