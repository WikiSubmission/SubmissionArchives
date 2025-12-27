'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowLeft, Calendar, FileText, ChevronRight, Video, BookOpen, Headphones, Sun, Moon, Clock, User } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { searchTranscripts } from './actions';
import { useTheme } from '../components/ThemeProvider';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const { darkMode, toggleDarkMode } = useTheme();
    const [filters, setFilters] = useState({
        sermon: true,
        'quran-study': true,
        'video-program': true,
        audio: true,
        perspective: true,
        appendix: true
    });
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Theme classes (Matching HomePageClient)
    const theme = darkMode ? {
        bg: 'bg-zinc-950',
        card: 'bg-zinc-900',
        border: 'border-zinc-800',
        borderHover: 'hover:border-zinc-700',
        text: 'text-zinc-100',
        textMuted: 'text-zinc-400',
        textVeryMuted: 'text-zinc-600',
        input: 'bg-zinc-900 border-zinc-800 focus:border-zinc-700 text-zinc-100 placeholder:text-zinc-600',
        header: 'bg-black',
        highlight: 'bg-amber-900/30 text-amber-200',
        button: 'hover:bg-zinc-900'
    } : {
        bg: 'bg-gray-50',
        card: 'bg-white',
        border: 'border-gray-200',
        borderHover: 'hover:border-gray-300',
        text: 'text-gray-900',
        textMuted: 'text-gray-600',
        textVeryMuted: 'text-gray-400',
        input: 'bg-white border-gray-300 focus:border-gray-400 text-gray-900 placeholder:text-gray-400',
        header: 'bg-white',
        highlight: 'bg-amber-100 text-amber-800',
        button: 'hover:bg-gray-100'
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setResults([]);
        setErrorMsg(null);

        try {
            const typeFilters = [];
            if (filters.sermon) typeFilters.push('sermon');
            if (filters['quran-study']) typeFilters.push('quran-study');
            if (filters['video-program']) typeFilters.push('video-program');
            if (filters.audio) {
                typeFilters.push('audio');
                typeFilters.push('messenger-audio');
            }
            if (filters.perspective) typeFilters.push('perspective');
            if (filters.appendix) typeFilters.push('appendix');

            const response = await searchTranscripts(query, typeFilters);

            if (!response.success) throw new Error(response.error);

            const formattedResults = (response.data || []).map((item: any) => ({
                ...item,
                media: {
                    ...item.media,
                    ...formatMedia(item.media)
                }
            }));

            setResults(formattedResults);

        } catch (err: any) {
            console.error('Search error:', err);
            setErrorMsg(err.message || 'An unknown error occurred');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleFilter = (key: keyof typeof filters) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-200 font-sans`}>
            {/* Technical Header */}
            <header className={`border-b ${theme.border} ${theme.header} sticky top-0 z-50`}>
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/">
                                <button className={`p-2 rounded-sm ${theme.textMuted} hover:${theme.text} border ${theme.border} ${theme.borderHover} transition-colors`}>
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            </Link>
                            <div>
                                <h1 className={`text-lg font-serif font-medium ${theme.text} tracking-tight`}>
                                    Archive Search
                                </h1>
                                <p className={`text-[10px] ${theme.textVeryMuted} font-mono uppercase tracking-wider`}>
                                    System v2.0
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleDarkMode}
                            className={`p-2 ${theme.textMuted} hover:${theme.text} border ${theme.border} ${theme.borderHover} transition-colors rounded-sm`}
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                {/* Search Box */}
                <div className="mb-12">
                    <form onSubmit={handleSearch} className="relative mb-8">
                        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textVeryMuted}`} />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="SEARCH TRANSCRIPTS..."
                            className={`w-full ${theme.input} border rounded-sm py-5 pl-14 pr-32 text-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all font-mono placeholder:${theme.textVeryMuted}`}
                            autoFocus
                        />
                        <button
                            type="submit"
                            className={`absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 rounded-sm font-mono text-xs font-bold uppercase tracking-widest transition-all ${darkMode
                                ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                                : 'bg-zinc-900 text-white hover:bg-black'
                                }`}
                        >
                            Search
                        </button>
                    </form>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <FilterButton active={filters.sermon} onClick={() => toggleFilter('sermon')} theme={theme}>
                            <Video className="w-3.5 h-3.5 mr-2" />
                            SERMONS
                        </FilterButton>
                        <FilterButton active={filters['quran-study']} onClick={() => toggleFilter('quran-study')} theme={theme}>
                            <BookOpen className="w-3.5 h-3.5 mr-2" />
                            STUDIES
                        </FilterButton>
                        <FilterButton active={filters['video-program']} onClick={() => toggleFilter('video-program')} theme={theme}>
                            <Video className="w-3.5 h-3.5 mr-2" />
                            PROGRAMS
                        </FilterButton>
                        <FilterButton active={filters.audio} onClick={() => toggleFilter('audio')} theme={theme}>
                            <Headphones className="w-3.5 h-3.5 mr-2" />
                            AUDIOS
                        </FilterButton>
                        <FilterButton active={filters.perspective} onClick={() => toggleFilter('perspective')} theme={theme}>
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            PERSPECTIVES
                        </FilterButton>
                        <FilterButton active={filters.appendix} onClick={() => toggleFilter('appendix')} theme={theme}>
                            <BookOpen className="w-3.5 h-3.5 mr-2" />
                            APPENDICES
                        </FilterButton>
                    </div>

                    {errorMsg && (
                        <div className={`border border-red-200 bg-red-50 text-red-600 p-4 rounded-sm mt-8 text-center font-mono text-sm`}>
                            <p className="font-bold">SEARCH ERROR</p>
                            <p className="opacity-80">{errorMsg}</p>
                        </div>
                    )}
                </div>

                {/* Results */}
                {isSearching ? (
                    <div className={`text-center py-20 ${theme.textVeryMuted} animate-pulse font-mono text-xs uppercase tracking-widest`}>
                        Searching Archive Database...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {results.length > 0 ? (
                            <div className={`mb-6 ${theme.textVeryMuted} text-xs font-mono uppercase tracking-widest flex items-center gap-2 border-b ${theme.border} pb-4`}>
                                <FileText className="w-3.5 h-3.5" /> FOUND MATCHES IN {results.length} DOCUMENTS
                            </div>
                        ) : query && !isSearching && (
                            <div className={`text-center py-20 ${theme.textVeryMuted} font-mono text-sm`}>
                                NO MATCHES FOUND IN ARCHIVE.
                            </div>
                        )}

                        {results.map(({ media, matches }) => {
                            const Icon = media.type === 'sermon' ? Video :
                                media.type === 'quran-study' ? BookOpen :
                                    media.type === 'perspective' ? FileText :
                                        (media.type.includes('audio') || media.type === 'messenger-audio') ? Headphones : FileText;

                            const mediaLink = media.type === 'perspective'
                                ? `/submitter-perspectives/${media.filename}`
                                : media.type === 'appendix'
                                    ? `/appendices/${media.filename}`
                                    : `/watch/${media.id}`;

                            return (
                                <div key={media.id} className={`${theme.card} rounded-sm border ${theme.border} overflow-hidden shadow-sm hover:shadow-md transition-all group`}>
                                    <Link href={mediaLink} className={`block p-5 border-b ${theme.border} hover:bg-opacity-50 transition-colors`}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-0.5 rounded-sm border ${theme.border} text-[10px] font-mono uppercase tracking-wider ${theme.textVeryMuted} flex items-center gap-1.5`}>
                                                        <Icon className="w-3 h-3" />
                                                        {media.type === 'messenger-audio' ? 'AUDIO' : media.type.replace('-', ' ')}
                                                    </span>
                                                    {media.displayDate && (
                                                        <span className={`text-[10px] font-mono uppercase tracking-wider ${theme.textVeryMuted} flex items-center gap-1`}>
                                                            <Calendar className="w-3 h-3" /> {media.displayDate}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3
                                                    style={{ fontFamily: 'var(--font-roboto-slab)' }}
                                                    className={`text-lg ${theme.text} mb-1 group-hover:opacity-70 transition-opacity`}
                                                >
                                                    {media.displayTitle}
                                                </h3>
                                                <div className={`text-xs ${theme.textVeryMuted} font-mono flex items-center gap-4`}>
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" /> {media.author}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 ${theme.textVeryMuted} group-hover:translate-x-1 transition-transform`} />
                                        </div>
                                    </Link>
                                    <div className={`divide-y ${theme.border}`}>
                                        {matches.slice(0, 5).map((match: any) => (
                                            <Link
                                                key={match.id}
                                                href={media.type === 'perspective' ? mediaLink : `${mediaLink}?t=${Math.floor(match.start_time)}`}
                                                className={`block p-4 ${theme.button} transition-colors group/match`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className="shrink-0 w-16 text-right mt-1">
                                                        <span className={`text-[10px] font-mono ${theme.textVeryMuted} border ${theme.border} px-1.5 py-0.5 rounded-sm group-hover/match:${theme.text} transition-colors`}>
                                                            {media.type === 'perspective' ? 'TEXT' : formatTime(match.start_time)}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm ${theme.textMuted} leading-relaxed font-serif`}
                                                        dangerouslySetInnerHTML={{
                                                            __html: highlightMatch(match.content, query, theme)
                                                        }}
                                                    />
                                                </div>
                                            </Link>
                                        ))}
                                        {matches.length > 5 && (
                                            <Link
                                                href={`/watch/${media.id}`}
                                                className={`block p-3 text-center text-[10px] font-bold uppercase tracking-widest ${theme.textVeryMuted} hover:${theme.text} transition-colors font-mono`}
                                            >
                                                View {matches.length - 5} more matches...
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}

function FilterButton({ active, children, onClick, theme }: any) {
    // Check if we are in dark mode based on the background color in theme
    const isDark = theme.bg.includes('zinc-950');

    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-widest transition-all flex items-center border ${active
                ? isDark
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100' // Dark Mode Active: White Bg, Black Text
                    : 'bg-zinc-900 text-white border-zinc-900'    // Light Mode Active: Black Bg, White Text
                : `${theme.textMuted} ${theme.bg} ${theme.border} hover:${theme.text} hover:border-gray-400`
                }`}
        >
            {children}
        </button>
    );
}

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function highlightMatch(text: string, query: string, theme: any) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, `<span class="${theme.highlight} px-0.5 rounded-sm font-medium">$1</span>`);
}
