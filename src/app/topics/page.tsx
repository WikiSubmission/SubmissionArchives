'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import { useTheme } from '@/app/components/ThemeProvider';
import { getTheme } from '@/lib/theme';
import { FileText, Disc, Layers, ChevronDown, BookOpen, Download, Headphones, Video, Mic2 } from 'lucide-react';
import quranStudiesNotes from '@/data/notes/quran-studies.json';

import Link from 'next/link';

export default function NotesPage() {
    const { darkMode } = useTheme();
    const theme = getTheme(darkMode);
    // Force reload data check v2

    // Top Level View Mode
    const [viewMode, setViewMode] = useState<'media' | 'topic'>('media');

    // Sub-Category for "By Media"
    const [mediaCategory, setMediaCategory] = useState<'quran-studies' | 'audio' | 'video' | 'sermon'>('quran-studies');

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans transition-colors duration-200`}>
            <Header />

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 text-muted-foreground">
                        <FileText className={`w-8 h-8 ${theme.textVeryMuted}`} />
                        <span className={`text-sm font-bold tracking-widest uppercase ${theme.textVeryMuted}`}>Resources</span>
                    </div>

                    <h1
                        className="text-4xl md:text-5xl font-black tracking-tight mb-8 uppercase"
                        style={{ fontFamily: 'var(--font-roboto-slab)' }}
                    >
                        Compiled Notes
                    </h1>

                    {/* Switch Module (Top Level) */}
                    <div className="flex flex-wrap gap-4 mb-8">
                        <FilterButton
                            active={viewMode === 'media'}
                            onClick={() => setViewMode('media')}
                            theme={theme}
                            darkMode={darkMode}
                        >
                            <Disc className="w-4 h-4 mr-2" />
                            By Media
                        </FilterButton>
                        <FilterButton
                            active={viewMode === 'topic'}
                            onClick={() => setViewMode('topic')}
                            theme={theme}
                            darkMode={darkMode}
                        >
                            <Layers className="w-4 h-4 mr-2" />
                            By Topic
                        </FilterButton>
                    </div>

                    {/* Disclaimer Note */}
                    <div className={`mb-10 p-6 rounded-lg border-l-4 ${darkMode ? 'bg-amber-900/20 border-amber-500' : 'bg-amber-50 border-amber-500'}`}>
                        <p className={`text-sm md:text-base leading-relaxed mb-3 ${theme.text}`}>
                            Please note that reviewing these summarized/compiled notes does <strong>NOT</strong> substitute in any way for listening to, watching, or reading the original content. This is meant to serve as a tool to find the information you are looking for more easily in a consolidated manner. Always verify everything.
                        </p>
                        <p className={`text-sm md:text-base font-serif italic ${darkMode ? 'text-amber-200' : 'text-amber-800'}`}>
                            "Quran 17:36 — You shall not accept any information, unless <strong><em>you verify it for yourself.</em></strong> I have given you the hearing, the eyesight, and the brain, and you are responsible for using them."
                        </p>
                    </div>

                    <div className="mb-8">
                        <p className={`text-xl ${theme.textMuted} leading-relaxed font-serif`}>
                            {viewMode === 'media'
                                ? "Browse compiled notes organized by their source media."
                                : "Explore compiled notes categorized by specific topics, themes, and keywords."}
                        </p>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[400px]">
                        {viewMode === 'media' ? (
                            <>
                                {/* Media Category Tabs */}
                                <div className="flex flex-wrap gap-2 mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-1">
                                    <MediaTab
                                        label="Quran Studies"
                                        active={mediaCategory === 'quran-studies'}
                                        onClick={() => setMediaCategory('quran-studies')}
                                        icon={<BookOpen className="w-4 h-4" />}
                                        theme={theme}
                                        darkMode={darkMode}
                                    />
                                    <MediaTab
                                        label="Messenger Audios"
                                        active={mediaCategory === 'audio'}
                                        onClick={() => setMediaCategory('audio')}
                                        icon={<Headphones className="w-4 h-4" />}
                                        theme={theme}
                                        darkMode={darkMode}
                                    />
                                    <MediaTab
                                        label="Video Programs"
                                        active={mediaCategory === 'video'}
                                        onClick={() => setMediaCategory('video')}
                                        icon={<Video className="w-4 h-4" />}
                                        theme={theme}
                                        darkMode={darkMode}
                                    />
                                    <MediaTab
                                        label="Sermons"
                                        active={mediaCategory === 'sermon'}
                                        onClick={() => setMediaCategory('sermon')}
                                        icon={<Mic2 className="w-4 h-4" />}
                                        theme={theme}
                                        darkMode={darkMode}
                                    />
                                </div>

                                {/* Media Content */}
                                {mediaCategory === 'quran-studies' ? (
                                    <div className="space-y-6">
                                        {quranStudiesNotes.map((note) => (
                                            <NoteAccordion
                                                key={note.id}
                                                title={note.title}
                                                content={note.content}
                                                filename={note.filename}
                                                theme={theme}
                                                darkMode={darkMode}
                                            />
                                        ))}
                                        {quranStudiesNotes.length === 0 && (
                                            <EmptyState theme={theme} icon={<BookOpen className="w-12 h-12" />} label="Quran Studies" />
                                        )}
                                    </div>
                                ) : (
                                    <EmptyState
                                        theme={theme}
                                        icon={
                                            mediaCategory === 'audio' ? <Headphones className="w-12 h-12" /> :
                                                mediaCategory === 'video' ? <Video className="w-12 h-12" /> :
                                                    <Mic2 className="w-12 h-12" />
                                        }
                                        label={
                                            mediaCategory === 'audio' ? "Messenger Audios" :
                                                mediaCategory === 'video' ? "Video Programs" :
                                                    "Sermons"
                                        }
                                    />
                                )}
                            </>
                        ) : (
                            // Topic View
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Link
                                    href="/topics/false-verses"
                                    className={`group p-6 rounded-lg border ${theme.border} transition-all hover:scale-[1.02] ${darkMode ? 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800 hover:border-emerald-500/50' : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-emerald-500/30'} flex flex-col justify-between h-48`}
                                >
                                    <div>
                                        <div className={`mb-4 w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <h3 className={`font-bold font-serif text-xl ${theme.text} mb-2 group-hover:text-emerald-500 transition-colors`}>
                                            The False Verses
                                            <span className="block text-sm font-sans font-normal opacity-60 mt-1">(9:128 & 9:129)</span>
                                        </h3>
                                    </div>
                                    <div className={`text-xs font-mono uppercase tracking-widest ${theme.textVeryMuted} flex items-center gap-2`}>
                                        Explore Topic <ChevronDown className="w-3 h-3 -rotate-90" />
                                    </div>
                                </Link>

                                {/* More placeholders or actual topics can go here */}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function FilterButton({ active, children, onClick, theme, darkMode }: any) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-widest transition-all flex items-center border ${active
                ? darkMode
                    ? 'bg-white text-zinc-900 border-white'
                    : 'bg-zinc-900 text-white border-zinc-900'
                : darkMode
                    ? 'bg-transparent text-zinc-400 border-zinc-700 hover:text-zinc-100 hover:border-zinc-500'
                    : 'bg-transparent text-gray-600 border-gray-300 hover:text-gray-900 hover:border-gray-400'
                }`}
        >
            {children}
        </button>
    );
}

function MediaTab({ label, active, onClick, icon, theme, darkMode }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors relative
                ${active
                    ? (darkMode ? 'text-emerald-400' : 'text-emerald-700')
                    : (darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-500 hover:text-zinc-800')
                }
            `}
        >
            {icon}
            {label}
            {active && (
                <span className={`absolute bottom-0 left-0 w-full h-0.5 ${darkMode ? 'bg-emerald-400' : 'bg-emerald-600'}`} />
            )}
        </button>
    );
}

function EmptyState({ theme, icon, label }: any) {
    return (
        <div className={`p-16 text-center border border-dashed ${theme.border} rounded-lg`}>
            <div className="flex flex-col items-center justify-center gap-4">
                <div className={`opacity-30 ${theme.textVeryMuted}`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-lg font-bold font-mono uppercase ${theme.textMuted}`}>{label} Notes</h3>
                    <p className={`${theme.textVeryMuted} italic mt-1`}>Coming soon...</p>
                </div>
            </div>
        </div>
    );
}

// Quick parser to enhance the raw PDF text
function formatNoteContent(text: string, theme: any, darkMode: boolean) {
    const lines = text.split('\n');
    const formattedElements = [];

    let currentListType: 'bullet' | 'numeric' | null = null;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) {
            formattedElements.push(<div key={i} className="h-4" />); // Spacer
            continue;
        }

        // Headers (Sections starting with Number followed by period or specific keywords)
        if (line.match(/^\d+\.\s+[A-Za-z]/) || line.includes('Detailed Summary') || line.includes('Study Information') || line.includes('Quran Verses Discussed') || line.includes('Administrative &')) {
            formattedElements.push(
                <h4 key={i} className={`text-lg font-bold mt-6 mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-800'} font-sans uppercase tracking-wide border-b ${theme.border} pb-2`}>
                    {line}
                </h4>
            );
            continue;
        }

        // Sub-headers or Key Points (Lines ending in colon)
        if (line.match(/:$/) && line.length < 100) {
            formattedElements.push(
                <h5 key={i} className={`font-bold mt-4 mb-2 ${theme.text} font-mono text-sm`}>
                    {line}
                </h5>
            );
            continue;
        }

        // Bullet Points
        if (line.startsWith('●') || line.startsWith('○') || line.startsWith('■')) {
            const indentLevel = line.startsWith('■') ? 'ml-12' : line.startsWith('○') ? 'ml-6' : 'ml-0';
            const bulletColor = line.startsWith('●') ? 'text-emerald-500' : 'text-zinc-400';
            const cleanText = line.substring(1).trim();

            // Highlight Sura References
            const processedText = cleanText.split(/(Sura\s+\d+(?::\d+)?)/g).map((part, idx) =>
                part.match(/Sura\s+\d/) ? <span key={idx} className="font-semibold text-emerald-600 dark:text-emerald-400">{part}</span> : part
            );

            formattedElements.push(
                <div key={i} className={`flex items-start gap-3 mb-2 ${indentLevel} text-sm md:text-base`}>
                    <span className={`${bulletColor} mt-1.5 text-[0.6rem] flex-shrink-0`}>●</span>
                    <span className="leading-relaxed opacity-90">{processedText}</span>
                </div>
            );
            continue;
        }

        // Standard Paragraph
        formattedElements.push(
            <p key={i} className="mb-2 text-sm md:text-base leading-relaxed opacity-90 font-serif">
                {line}
            </p>
        );
    }

    return formattedElements;
}

function NoteAccordion({ title, content, filename, theme, darkMode }: any) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`border ${theme.border} rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? (darkMode ? 'bg-zinc-900 ring-1 ring-emerald-500/30' : 'bg-white ring-1 ring-emerald-500/30 shadow-lg') : (darkMode ? 'bg-zinc-900/30 hover:bg-zinc-900/80' : 'bg-white hover:bg-gray-50')}`}>
            <div className="flex items-center">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex-1 flex items-center justify-between p-5 text-left focus:outline-none"
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isOpen ? 'bg-emerald-600 text-white' : (darkMode ? 'bg-zinc-800 text-emerald-500' : 'bg-emerald-50 text-emerald-600')}`}>
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-500 mb-1 uppercase">Quick Note</p>
                            <h3 className={`font-bold font-serif text-xl ${theme.text}`}>
                                {title}
                            </h3>
                        </div>
                    </div>

                </button>

                {/* Actions */}
                <div className="pr-5 flex items-center gap-2">
                    <a
                        href={`/quran-study-notes/${filename}`}
                        download
                        className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-900'}`}
                        title="Download Original PDF"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Download className="w-4 h-4" />
                    </a>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${darkMode ? 'text-zinc-400' : 'text-zinc-400'}`}
                    >
                        <ChevronDown className="w-5 h-5" />
                    </button>
                </div>
            </div>


            {
                isOpen && (
                    <div className={`px-5 pb-8 pt-2 pl-[4.5rem]`}>
                        <div className={`h-px w-full ${darkMode ? 'bg-zinc-800' : 'bg-gray-100'} mb-6`} />
                        <div className="prose max-w-none">
                            {formatNoteContent(content, theme, darkMode)}
                        </div>
                        <div className="mt-8 pt-4">
                            <a
                                href={`/quran-study-notes/${filename}`}
                                target="_blank"
                                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500 hover:text-emerald-400 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Download Full PDF Source
                            </a>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
