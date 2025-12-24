'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen, Sun, Moon, AlignJustify, Hash, Pencil, Save, X, Loader2 } from 'lucide-react';

// Define the 3 editions we want to compare
const EDITIONS = [
    { key: '1981', label: '1981 Edition' },
    { key: '1989', label: '1989 Edition' },
    { key: 'revision', label: 'Revision' }
];

type Verse = {
    id: string;
    edition_key: string;
    verse: number;
    text: string;
    header: string | null;
    footnotes: string | null;
};

import { useTheme } from '../components/ThemeProvider';

export default function QuranCompare() {

    // State
    const [currentSura, setCurrentSura] = useState(1);
    const [currentVerse, setCurrentVerse] = useState(1);
    const [viewMode, setViewMode] = useState<'verse' | 'chapter'>('verse');
    const [isEditing, setIsEditing] = useState(false);

    // Data state: Map<EditionKey, Map<VerseNum, Verse>>
    const [verses, setVerses] = useState<Record<string, Record<number, Verse>>>({});
    const [loading, setLoading] = useState(false);
    const { darkMode, toggleDarkMode } = useTheme();

    // Refs for scrolling
    // const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Theme logic (Archive System v2.0)
    const theme = darkMode ? {
        bg: 'bg-zinc-950',
        card: 'bg-zinc-900',
        border: 'border-zinc-800',
        text: 'text-zinc-100',
        textMuted: 'text-zinc-400',
        textVeryMuted: 'text-zinc-600',
        header: 'bg-black',
        select: 'bg-zinc-900 border-zinc-800 text-zinc-100',
        button: 'hover:bg-zinc-800',
        highlight: 'bg-zinc-800',
        input: 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-emerald-500'
    } : {
        bg: 'bg-gray-50',
        card: 'bg-white',
        border: 'border-gray-200',
        text: 'text-gray-900',
        textMuted: 'text-gray-600',
        textVeryMuted: 'text-gray-400',
        header: 'bg-white',
        select: 'bg-white border-gray-200 text-gray-900',
        button: 'hover:bg-gray-50',
        highlight: 'bg-yellow-50',
        input: 'bg-white border-gray-200 text-gray-900 focus:border-emerald-500'
    };

    // Fetch data when Sura (or Verse in single mode) changes
    useEffect(() => {
        let ignore = false;

        async function fetchVerses() {
            setLoading(true);

            let query = supabase
                .from('quran_editions')
                .select('*')
                .eq('sura', currentSura)
                .in('edition_key', EDITIONS.map(e => e.key));

            // In verse mode, fetch only specific verse. In chapter mode, fetch all.
            if (viewMode === 'verse') {
                query = query.eq('verse', currentVerse);
            } else {
                query = query.order('verse', { ascending: true });
            }

            const { data, error } = await query;

            if (ignore) return;

            if (error) {
                console.error('Error fetching verses:', error);
            } else {
                const verseMap: Record<string, Record<number, Verse>> = {
                    '1981': {}, '1989': {}, 'revision': {}
                };

                data?.forEach((v: any) => {
                    if (!verseMap[v.edition_key]) verseMap[v.edition_key] = {};
                    verseMap[v.edition_key][v.verse] = v;
                });
                setVerses(verseMap);
            }
            setLoading(false);
        }

        fetchVerses();

        return () => {
            ignore = true;
        };
    }, [currentSura, currentVerse, viewMode]);

    // Scroll to verse when switching to chapter mode or changing verse in chapter mode
    useEffect(() => {
        if (viewMode === 'chapter' && !loading) {
            const verseId = `verse-1981-${currentVerse}`; // Sync scroll roughly using first col
            const el = document.getElementById(verseId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentVerse, viewMode, loading]);

    const handleNext = () => setCurrentVerse(v => v + 1);
    const handlePrev = () => setCurrentVerse(v => Math.max(1, v - 1));

    const handleVerseUpdate = (editionKey: string, verseNum: number, updatedVerse: Verse) => {
        setVerses(prev => ({
            ...prev,
            [editionKey]: {
                ...prev[editionKey],
                [verseNum]: updatedVerse
            }
        }));
    };

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-200 font-sans`}>
            {/* Header */}
            <header className={`border-b ${theme.border} ${theme.header} sticky top-0 z-50`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className={`p-2 rounded-sm ${theme.textMuted} hover:${theme.text} border ${theme.border} transition-colors`}>
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        </Link>
                        <div>
                            <h1 className={`text-lg font-serif font-medium ${theme.text} tracking-tight`}>
                                Quran Comparison
                            </h1>
                            <p className={`text-[10px] ${theme.textVeryMuted} font-mono uppercase tracking-wider`}>
                                Edition Analysis Tool
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-2">

                        {/* Edit Mode Toggle */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm border ${isEditing ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : `${theme.border} ${theme.textMuted}`} transition-colors`}
                        >
                            <Pencil className="w-3 h-3" />
                            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                                {isEditing ? 'Correcting' : 'Correct'}
                            </span>
                        </button>

                        <div className="w-px h-6 bg-gray-200 mx-2 dark:bg-zinc-800" />

                        {/* View Toggle */}
                        <div className={`flex rounded-sm border ${theme.border} p-0.5 mr-2`}>
                            <button
                                onClick={() => setViewMode('verse')}
                                className={`px-2 py-1 text-[10px] uppercase font-mono tracking-wider rounded-sm ${viewMode === 'verse' ? (darkMode ? 'bg-zinc-800' : 'bg-gray-200') : ''}`}
                            >
                                <Hash className="w-3 h-3 inline mr-1" /> Verse
                            </button>
                            <button
                                onClick={() => setViewMode('chapter')}
                                className={`px-2 py-1 text-[10px] uppercase font-mono tracking-wider rounded-sm ${viewMode === 'chapter' ? (darkMode ? 'bg-zinc-800' : 'bg-gray-200') : ''}`}
                            >
                                <AlignJustify className="w-3 h-3 inline mr-1" /> Chapter
                            </button>
                        </div>

                        <div className="w-px h-6 bg-gray-200 mx-2 dark:bg-zinc-800" />

                        <button
                            onClick={handlePrev}
                            disabled={currentVerse <= 1}
                            className={`p-2 rounded-sm border ${theme.border} ${theme.button} disabled:opacity-50 transition-colors`}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2 font-mono text-xs">
                            <span className={`${theme.textMuted}`}>SURA</span>
                            <input
                                type="number"
                                value={currentSura}
                                onChange={(e) => setCurrentSura(parseInt(e.target.value) || 1)}
                                className={`w-12 p-1 text-center rounded-sm border ${theme.border} ${theme.select}`}
                            />
                            <span className={`${theme.textMuted}`}>:</span>
                            <input
                                type="number"
                                value={currentVerse}
                                onChange={(e) => setCurrentVerse(parseInt(e.target.value) || 1)}
                                className={`w-12 p-1 text-center rounded-sm border ${theme.border} ${theme.select}`}
                            />
                        </div>

                        <button
                            onClick={handleNext}
                            className={`p-2 rounded-sm border ${theme.border} ${theme.button} transition-colors`}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>

                        <div className="w-px h-6 bg-gray-200 mx-2 dark:bg-zinc-800" />

                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 ${theme.textMuted} hover:${theme.text} border ${theme.border} ${theme.button} transition-colors rounded-sm`}
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1600px] mx-auto px-6 py-8">
                <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${viewMode === 'chapter' ? 'h-[calc(100vh-140px)]' : ''}`}>
                    {EDITIONS.map((edition) => (
                        <div key={edition.key} className={`flex flex-col h-full ${theme.card} border ${theme.border} rounded-sm shadow-sm overflow-hidden`}>
                            {/* Column Header */}
                            <div className={`p-4 border-b ${theme.border} ${theme.header} sticky top-0 z-10 flex justify-between items-center`}>
                                <h2 className={`font-mono text-xs font-bold uppercase tracking-widest ${theme.textMuted}`}>
                                    {edition.label}
                                </h2>
                                {isEditing && (
                                    <span className="text-[10px] text-emerald-500 font-mono tracking-wider animate-pulse">
                                        EDIT MODE
                                    </span>
                                )}
                            </div>

                            {/* Verse Content */}
                            <div className={`flex-1 ${viewMode === 'chapter' ? 'overflow-y-auto scroll-smooth' : 'p-8'}`}>
                                {loading ? (
                                    <div className="p-8 space-y-3 animate-pulse">
                                        <div className={`h-4 w-3/4 ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'} rounded`}></div>
                                        <div className={`h-4 w-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'} rounded`}></div>
                                        <div className={`h-4 w-5/6 ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'} rounded`}></div>
                                    </div>
                                ) : viewMode === 'verse' ? (
                                    // SINGLE AYA MODE
                                    verses[edition.key]?.[currentVerse] ? (
                                        <VerseItem
                                            verse={verses[edition.key][currentVerse]}
                                            theme={theme}
                                            isEditing={isEditing}
                                            darkMode={darkMode}
                                            onUpdate={(v) => handleVerseUpdate(edition.key, currentVerse, v)}
                                            currentSura={currentSura}
                                        />
                                    ) : (
                                        <EmptyState theme={theme} />
                                    )
                                ) : (
                                    // CHAPTER MODE
                                    <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {Object.keys(verses[edition.key] || {}).length > 0 ? (
                                            Object.values(verses[edition.key] || {}).sort((a, b) => a.verse - b.verse).map((v) => (
                                                <div
                                                    key={v.verse}
                                                    id={`verse-${edition.key}-${v.verse}`}
                                                    className={`hover:${darkMode ? 'bg-zinc-800/30' : 'bg-gray-50'} transition-colors ${v.verse === currentVerse ? theme.highlight : ''}`}
                                                >
                                                    <VerseItem
                                                        verse={v}
                                                        theme={theme}
                                                        isEditing={isEditing}
                                                        darkMode={darkMode}
                                                        onUpdate={(updated) => handleVerseUpdate(edition.key, v.verse, updated)}
                                                        currentSura={currentSura}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <EmptyState theme={theme} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

function VerseItem({ verse, theme, isEditing, darkMode, onUpdate, currentSura }: {
    verse: Verse,
    theme: any,
    isEditing: boolean,
    darkMode: boolean,
    onUpdate: (v: Verse) => void,
    currentSura: number
}) {
    const [localVerse, setLocalVerse] = useState(verse);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Sync local state when prop changes, BUT only if not dirty to avoid overwriting user edits while typing
    // Actually, simple way: reset dirty on new verse, sync.
    useEffect(() => {
        setLocalVerse(verse);
        setDirty(false);
    }, [verse.id, verse.text, verse.header, verse.footnotes]);

    const handleSave = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('quran_editions')
            .update({
                text: localVerse.text,
                header: localVerse.header || null,
                footnotes: localVerse.footnotes || null
            })
            .eq('id', localVerse.id);

        setSaving(false);
        if (error) {
            alert('Error saving: ' + error.message);
        } else {
            setDirty(false);
            onUpdate(localVerse); // Update parent state
        }
    };

    if (isEditing) {
        return (
            <div className="p-6 space-y-4">
                <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-mono text-opacity-50 ${theme.textMuted}`}>
                        {currentSura}:{verse.verse}
                    </span>
                    {dirty && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider hover:bg-emerald-700 transition"
                        >
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                        </button>
                    )}
                </div>

                {/* Header Input */}
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 block">Header</label>
                    <input
                        type="text"
                        value={localVerse.header || ''}
                        onChange={(e) => {
                            setLocalVerse({ ...localVerse, header: e.target.value });
                            setDirty(true);
                        }}
                        placeholder="Section Title..."
                        className={`w-full p-2 text-sm font-bold font-serif ${theme.input} rounded-sm outline-none border focus:ring-1 ring-emerald-500/50`}
                    />
                </div>

                {/* Text Area */}
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 block">Verse Text</label>
                    <textarea
                        value={localVerse.text}
                        onChange={(e) => {
                            setLocalVerse({ ...localVerse, text: e.target.value });
                            setDirty(true);
                        }}
                        rows={4}
                        className={`w-full p-3 text-base font-serif leading-relaxed ${theme.input} rounded-sm outline-none border focus:ring-1 ring-emerald-500/50`}
                    />
                </div>

                {/* Footnotes Area */}
                <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-zinc-500 block">Footnotes</label>
                    <textarea
                        value={typeof localVerse.footnotes === 'string' ? localVerse.footnotes : JSON.stringify(localVerse.footnotes || '')}
                        onChange={(e) => {
                            setLocalVerse({ ...localVerse, footnotes: e.target.value });
                            setDirty(true);
                        }}
                        rows={2}
                        placeholder="Footnotes..."
                        className={`w-full p-2 text-xs font-mono ${theme.input} rounded-sm outline-none border focus:ring-1 ring-emerald-500/50`}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {verse.header && (
                <h3 className={`font-serif font-bold text-lg mb-4 text-emerald-600 dark:text-emerald-400`}>
                    {verse.header}
                </h3>
            )}

            <span className={`text-[10px] font-mono text-opacity-50 mb-2 block ${theme.textMuted}`}>
                {currentSura}:{verse.verse}
            </span>

            <p className={`text-base font-serif leading-relaxed ${theme.text} whitespace-pre-wrap`}>
                {verse.text}
            </p>

            {verse.footnotes && (
                <div className={`mt-4 pt-4 border-t ${theme.border} text-sm ${theme.textMuted}`}>
                    <p className="font-mono text-[10px] uppercase mb-1 opacity-75">Footnotes</p>
                    <div className="whitespace-pre-wrap text-xs">
                        {typeof verse.footnotes === 'string' ? verse.footnotes : JSON.stringify(verse.footnotes)}
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ theme }: { theme: any }) {
    return (
        <div className={`flex flex-col items-center justify-center h-full py-12 ${theme.textVeryMuted}`}>
            <BookOpen className="w-8 h-8 mb-3 opacity-20" />
            <p className="font-mono text-xs uppercase tracking-widest">No Data Available</p>
            <p className="text-[10px] mt-2 opacity-50">Run upload script to populate</p>
        </div>
    );
}
