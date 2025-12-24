'use client';

import React, { useState, useMemo } from 'react';
import { ScriptureChapterData } from '@/app/scripture/actions';
import { StudyEntry } from '@/lib/studyActions';
import { processChapterText, TextBlock } from '@/lib/bibleFormatting';
import { GENEALOGY_PROOFS } from '@/lib/genealogyData';
import StudyNotebook from './StudyNotebook';
import GenealogyVisualizer from './GenealogyVisualizer';
import { ChevronLeft, ChevronRight, BookOpen, GitGraph } from 'lucide-react';
import Link from 'next/link';

// --- Book Groupings ---
const BOOK_GROUPS = [
    {
        title: "The Gospels",
        books: ["Mark", "Matthew", "Luke", "John", "Thomas"]
    }
];

interface StudyReaderProps {
    chapterData: ScriptureChapterData;
    notes: StudyEntry[];
    source: string;
    bookName: string;
    chapterNum: number;
}

const SPECIAL_FORMATTING: Record<string, { type: 'ot' | 'jesus', text: string }[]> = {
    // Key format: "Book Chapter:Verse"
    "Matthew 1:23": [
        { type: 'ot', text: "Behold, the virgin shall be with child, and shall bring forth a son, and they shall call his name Immanuel" },
        // Handle variations if needed, or target partials.
        // The user specifically asked for "Behold, the virgin shall be with child,"
    ],
    "Matthew 3:15": [
        { type: 'jesus', text: "Allow it now, for this is the fitting way for us to fulfill all righteousness." }
    ],
    "Matthew 4:4": [
        { type: 'jesus', text: "It is written, 'Man shall not live by bread alone, but by every word that proceeds out of the mouth of God.'" },
        // This actually contains an OT quote INSIDE Jesus' words. Nested highlighting might be tricky.
        // For now, prioritize Jesus' words as Red, maybe bold the OT part?
        // Or separate spans.
    ]
};

const renderTextWithNotes = (text: string, notes: string[] | undefined, book: string, chapter: number, verseNum: number) => {
    if (!text) return null;

    // Process Footnotes: Replace __NOTE:index__ with HTML structure
    const processedText = text.replace(/__NOTE:(\d+)__/g, (match, index) => {
        const noteIdx = parseInt(index);
        const noteText = notes?.[noteIdx];
        if (!noteText) return '';

        // Construct HTML for the footnote tooltip
        // We must escape quotes in noteText just in case, though mostly they are safe text.
        const safeNote = noteText.replace(/"/g, '&quot;');

        return `
            <span class="group relative inline-block align-top ml-0.5 select-none text-initial">
                <span class="text-amber-600/70 text-[0.65em] font-bold cursor-help hover:text-amber-600 transition-colors px-[1px]">+</span>
                <span class="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-96 bg-gray-900/95 backdrop-blur-sm text-gray-100 text-lg leading-relaxed p-4 rounded-lg shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 font-sans tracking-wide font-normal normal-case">
                    ${safeNote}
                    <span class="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900/95"></span>
                </span>
            </span>
        `;
    });

    // Handle Matthew 1:23 special case (legacy support if needed, or if JSON wasn't updated for it)
    // Since we are moving to JSON-based markup, we can keep this or rely on JSON updates. 
    // The user's specific request was fixed by JSON update for Ch 3/4. 
    // We'll leave the text as is, assuming JSON now carries the formatting or is plain.
    // If we need to inject formatting for things NOT in JSON yet, we'd do it here on `processedText`.

    return (
        <span dangerouslySetInnerHTML={{ __html: processedText }} />
    );
};

// --- Helper Component ---
const CollapsibleIntro = ({ subtype, content }: { subtype?: 'book' | 'chapter', content: string }) => {
    // Default collapsed (false) to minimize clutter
    const [isOpen, setIsOpen] = useState(false);

    if (subtype === 'book') {
        return (
            <div className="mb-10 mx-4 border-y border-gray-100 bg-[#fafafa] shadow-[inset_0_0_20px_rgba(0,0,0,0.01)] rounded-sm overflow-hidden transition-all">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-center gap-2 py-3 hover:bg-gray-100 transition-colors group"
                >
                    <span className="h-px w-12 bg-gray-300 group-hover:bg-gray-400"></span>
                    <span className="text-xs uppercase tracking-widest text-gray-400 font-sans group-hover:text-gray-600 transition-colors">
                        {isOpen ? 'Minimize Introduction' : 'Read Prologue'}
                    </span>
                    <span className="h-px w-12 bg-gray-300 group-hover:bg-gray-400"></span>
                </button>

                <div className={`
                    overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out
                    ${isOpen ? 'max-h-[1000px] opacity-100 pb-8 px-10' : 'max-h-0 opacity-0'}
                `}>
                    <div className="font-[family-name:var(--font-crimson)] text-[1.1rem] text-gray-700 italic leading-loose text-justify">
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    if (subtype === 'chapter') {
        return (
            <div className="mt-8 mb-6 border-l-[3px] border-gray-200 ml-4 bg-gray-50/50 rounded-r-lg overflow-hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left px-6 py-3 flex items-center justify-between hover:bg-gray-100/50 transition-colors"
                >
                    <span className="font-sans text-xs uppercase tracking-widest text-gray-500">Chapter Introduction</span>
                    <span className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>

                <div className={`
                    overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out
                    ${isOpen ? 'max-h-[500px] opacity-100 pb-4 px-6' : 'max-h-0 opacity-0'}
                `}>
                    <div className="font-[family-name:var(--font-crimson)] text-[1.05rem] text-gray-600 leading-relaxed text-justify">
                        {content}
                    </div>
                </div>
            </div>
        );
    }

    // Fallback for generic intro
    return (
        <div className="font-[family-name:var(--font-crimson)] text-lg text-gray-600 italic leading-relaxed text-center px-8 mb-6">
            {content}
        </div>
    );
};

export default function StudyReader({ chapterData, notes, source, bookName, chapterNum }: StudyReaderProps) {
    const [activeVerseNum, setActiveVerseNum] = useState<number | null>(null);
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [showChapterSelect, setShowChapterSelect] = useState(false);
    const [showBookSelect, setShowBookSelect] = useState(false);

    // Helper: Normalize source to DB prefix
    const getPrefix = (s: string) => {
        const lower = s.toLowerCase();
        if (lower === 'new-testament') return 'NT';
        if (lower === 'old-testament') return 'OT';
        if (lower === 'quran') return 'QURAN';
        return s.toUpperCase();
    };
    const dbPrefix = getPrefix(source);

    // Create a map for fast note lookup, merging strict Genealogy Proofs
    const notesMap = useMemo(() => {
        const map = new Map<number, StudyEntry>();

        // 1. Add DB notes
        notes.forEach(note => {
            const parts = note.verse_ref.split(':'); // NT:Matthew:1:1
            const vNum = parseInt(parts[3]);
            if (!isNaN(vNum)) map.set(vNum, note);
        });

        // 2. Merge Genealogy Proofs (for Matthew 1 only)
        if (bookName === 'Matthew' && chapterNum === 1) {
            Object.values(GENEALOGY_PROOFS).forEach(proof => {
                const existing = map.get(proof.verseNum);
                // Force new Exegesis content onto the entry
                // IMPORTANT: Ensure verse_ref uses the normalized DB Prefix (NT)

                const newContent = proof.exegesisContent;

                if (existing) {
                    map.set(proof.verseNum, {
                        ...existing,
                        content: newContent
                    });
                } else {
                    map.set(proof.verseNum, {
                        id: `gen-proof-${proof.verseNum}`,
                        verse_ref: `${dbPrefix}:${bookName}:${chapterNum}:${proof.verseNum}`,
                        content: newContent,
                        media_content: [],
                        cross_refs: []
                    });
                }
            });
        }

        return map;
    }, [notes, bookName, chapterNum, source, dbPrefix]);

    const activeEntry = activeVerseNum ? notesMap.get(activeVerseNum) || null : null;
    const activeRef = activeVerseNum ? `${dbPrefix}:${bookName}:${chapterNum}:${activeVerseNum}` : null;

    // Process text into blocks (Headings, Genealogies, Normal)
    const textBlocks = useMemo(() => {
        // Only apply formatting logic for NT/OT, Quran structure is different for now
        if (source === 'quran') return null;
        return processChapterText(bookName, chapterNum, chapterData.verses);
    }, [bookName, chapterNum, chapterData.verses, source]);

    // Font selection
    const fontClass = source === 'quran' ? 'font-[family-name:var(--font-scheherazade)] text-2xl leading-[2.5]'
        : source === 'old-testament' ? 'font-[family-name:var(--font-frank)] text-xl leading-loose'
            : 'font-[family-name:var(--font-crimson)] text-[1.35rem] leading-[1.8] tracking-normal';

    const renderVerse = (verse: any) => {
        const hasNote = notesMap.has(verse.num);
        const isActive = activeVerseNum === verse.num;

        return (
            <span
                key={verse.num}
                onClick={() => setActiveVerseNum(verse.num)}
                className={`
                    relative inline pt-1 pb-1 px-[2px] rounded cursor-pointer transition-colors duration-200 group/verse
                    ${isActive ? 'bg-[#F2F0E9] text-gray-900' : 'hover:bg-gray-50'}
                    ${hasNote ? 'decoration-gray-300 decoration-1 underline-offset-4' : ''}
                `}
            >
                <sup className="text-[0.6em] font-sans font-bold text-gray-400 mr-1 select-none">{verse.num}</sup>
                {renderTextWithNotes(verse.en, verse.footnotes, bookName, chapterNum, verse.num)}
                {" "}
            </span>
        );
    };

    return (
        <div className="flex h-screen bg-white">
            {/* LEFT PANEL: Scripture Text */}
            <div className="flex-1 overflow-y-auto bg-white relative">

                <div className="sticky top-0 bg-white/95 backdrop-blur z-20 px-6 py-4 border-b border-gray-100 flex items-center justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)]">

                    <div className="flex items-center gap-4 relative">
                        {/* Back Button */}
                        <Link href="/" className="group flex items-center gap-2 pr-4 border-r border-gray-200">
                            <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-800 transition-colors" />
                            </div>
                            <span className="text-sm font-sans uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors hidden sm:block">Back</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            {/* Book Selector */}
                            <div className="relative">
                                <div
                                    onClick={() => { setShowBookSelect(!showBookSelect); setShowChapterSelect(false); }}
                                    className="flex items-center gap-2 text-sm font-serif text-gray-900 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200/50 hover:border-gray-300 transition-colors cursor-pointer select-none"
                                >
                                    <BookOpen className="w-4 h-4 text-amber-700/70" />
                                    <span className="font-bold text-gray-800">{bookName}</span>
                                    <span className={`text-gray-400 transition-transform duration-200 ${showBookSelect ? 'rotate-180' : ''}`}>▼</span>
                                </div>

                                {showBookSelect && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowBookSelect(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-[600px] bg-white rounded-lg shadow-xl border border-gray-100 p-6 z-20 max-h-[80vh] overflow-y-auto grid grid-cols-2 gap-x-8 gap-y-6">
                                            {BOOK_GROUPS.map((group) => (
                                                <div key={group.title} className="flex flex-col gap-2 relative">
                                                    <h4 className="font-sans text-[0.65rem] uppercase tracking-widest font-bold text-gray-400 border-b border-gray-100 pb-1 mb-1">{group.title}</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {group.books.map(b => (
                                                            <Link
                                                                key={b}
                                                                href={`/study/${source}/${b}/1`}
                                                                className={`
                                                                    block px-2 py-1 rounded text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-100
                                                                    ${b === bookName ? 'bg-amber-50 text-amber-900 font-medium border-amber-100' : ''}
                                                                `}
                                                            >
                                                                {b}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Chapter Selector */}
                            <div className="relative">
                                <div
                                    onClick={() => { setShowChapterSelect(!showChapterSelect); setShowBookSelect(false); }}
                                    className="flex items-center gap-2 text-sm font-serif text-gray-900 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200/50 hover:border-gray-300 transition-colors cursor-pointer select-none"
                                >
                                    <span className="font-bold text-gray-800">{chapterNum}</span>
                                    <span className={`text-gray-400 transition-transform duration-200 ${showChapterSelect ? 'rotate-180' : ''}`}>▼</span>
                                </div>

                                {/* Dropdown Grid */}
                                {showChapterSelect && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowChapterSelect(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-100 p-4 z-20 grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto">
                                            {Array.from({ length: chapterData.totalChapters || 28 }, (_, i) => i + 1).map((num) => (
                                                <Link
                                                    key={num}
                                                    href={`/study/${source}/${bookName}/${num}`}
                                                    className={`
                                                        text-center py-2 rounded text-sm font-sans font-medium transition-colors
                                                        ${num === chapterNum
                                                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                                            : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'}
                                                    `}
                                                >
                                                    {num}
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Genealogy Visualizer Trigger (Matthew 1 Only) */}
                        {bookName === 'Matthew' && chapterNum === 1 && (
                            <button
                                onClick={() => setShowVisualizer(true)}
                                className="flex items-center gap-2 text-[0.65rem] font-sans uppercase tracking-[0.15em] font-bold text-amber-800 bg-amber-50 border border-amber-200/50 rounded-full pl-3 pr-4 py-1.5 hover:bg-amber-100 hover:border-amber-300 transition-all shadow-sm"
                            >
                                <GitGraph className="w-3.5 h-3.5" />
                                <span>Genealogy Chart</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-1 text-gray-400">
                        {chapterData.prev ? (
                            <Link href={`/study/${source}/${bookName}/${chapterNum - 1}`} className="p-2 hover:bg-gray-100 rounded-full hover:text-amber-800 transition-all" title="Previous Chapter">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                        ) : (
                            <span className="p-2 opacity-20 cursor-not-allowed"><ChevronLeft className="w-5 h-5" /></span>
                        )}

                        <span className="text-xs font-sans uppercase tracking-widest px-2 select-none opacity-40">Chapter {chapterNum}</span>

                        {chapterData.next ? (
                            <Link href={`/study/${source}/${bookName}/${chapterNum + 1}`} className="p-2 hover:bg-gray-100 rounded-full hover:text-amber-800 transition-all" title="Next Chapter">
                                <ChevronRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <span className="p-2 opacity-20 cursor-not-allowed"><ChevronRight className="w-5 h-5" /></span>
                        )}
                    </div>
                </div>

                {/* Text Container */}
                <div className="max-w-3xl mx-auto px-12 py-16">
                    <div className="text-center mb-16 select-none">
                        <div className="text-xs uppercase tracking-[0.3em] text-gray-400 mb-4 font-sans">World English Bible</div>
                        <h1 className="font-[family-name:var(--font-playfair)] text-5xl text-gray-900 mb-4">{bookName.toUpperCase()}</h1>
                        <div className="text-xl font-serif italic text-gray-500">The Gospel According to {bookName}</div>
                    </div>

                    <div className="relative">

                        {/* Render text with Blocks if available (NT/OT), else fallback to flat list */}
                        {textBlocks ? (
                            <div className="space-y-6">
                                {textBlocks.map((block: TextBlock, idx: number) => {
                                    if (block.type === 'intro') {
                                        return <CollapsibleIntro key={idx} subtype={block.subtype as any} content={block.content as string} />;
                                    } else if (block.type === 'heading') {
                                        return (
                                            <h3 key={idx} className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-gray-700 mt-8 mb-4 text-center">
                                                {block.content as string}
                                            </h3>
                                        );
                                    } else if (block.type === 'genealogy') {
                                        return (
                                            <div key={idx} className="my-6 pl-6 border-l-2 border-amber-100 bg-amber-50/30 p-4 rounded-r font-[family-name:var(--font-crimson)] text-lg">
                                                <div className="text-xs uppercase tracking-widest text-amber-500 mb-2 font-sans">Genealogy Record</div>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {(block.content as any[]).map(renderVerse)}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        // Verse paragraph
                                        return (
                                            <div key={idx} className={`${fontClass} text-gray-800 leading-relaxed text-justify`}>
                                                {/* Drop Cap Logic: Only pattern match start of chapter logic if needed, simplify for now */}
                                                {idx === 0 && chapterNum === 1 ? (
                                                    <span className="float-left text-7xl font-[family-name:var(--font-playfair)] leading-[0.85] text-gray-800 mr-3 mt-0 select-none">1</span>
                                                ) : null}
                                                {(block.content as any[]).map(renderVerse)}
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        ) : (
                            // Fallback for Quran or non-processed
                            <div className={`space-y-1 ${fontClass} text-gray-800`}>
                                {chapterData.verses.map(renderVerse)}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: Study Widget */}
            <div className="w-[420px] bg-[#F7F7F7] border-l border-gray-200 flex flex-col h-full shadow-inner z-30">
                <StudyNotebook
                    activeVerseRef={activeRef}
                    chapterEntries={Array.from(notesMap.values())}
                    isLoading={false}
                />
            </div>
            {/* VISUALIZER MODAL */}
            {showVisualizer && (
                <GenealogyVisualizer onClose={() => setShowVisualizer(false)} />
            )}
        </div>
    );
}
