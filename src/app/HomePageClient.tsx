'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Video, Headphones, FileText, Grid3x3, List, Filter } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { useTheme } from './components/ThemeProvider';
import { getTheme } from '@/lib/theme';
import { useDebounce } from '@/hooks/useDebounce';
import { Media, Newsletter } from '@/types/media';

import DigitalRain from '@/components/effects/DigitalRain';
import Header from '@/components/layout/Header';
import { MediaGrid } from './components/home/MediaGrid';
import { NewslettersView } from './components/home/NewslettersView';
import { AppendicesView } from './components/home/AppendicesView';
import { OtherView } from './components/home/OtherView';

interface HomePageClientProps {
    initialMedia: any[]; // Keeping any[] for initial input as per current data structure, will map to Media
}

export default function HomePageClient({ initialMedia }: HomePageClientProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [selectedType, setSelectedType] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const { darkMode, toggleDarkMode } = useTheme();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    const theme = getTheme(darkMode);

    // Perspectives State
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [loadingNewsletters, setLoadingNewsletters] = useState(false);

    useEffect(() => {
        // Fetch newsletters on mount if perspectives are selected or just pre-fetch
        // But for performance, maybe better to fetch only when needed or just once.
        // The original code passed it in useEffect []
        setLoadingNewsletters(true);
        fetch('/data/newsletters/metadata.json')
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a: any, b: any) => a.fullDate.localeCompare(b.fullDate));
                setNewsletters(sorted);
            })
            .catch(err => console.error("Failed to load newsletters", err))
            .finally(() => setLoadingNewsletters(false));
    }, []);

    // Memoize processed media
    const processedMedia: Media[] = useMemo(() => {
        return initialMedia
            .filter(item => !item.title.toLowerCase().includes('temp 52')) // Frontend Failsafe for duplicate
            .map(item => ({
                ...item,
                ...formatMedia(item)
            }));
    }, [initialMedia]);

    // Optimize filtering and sorting
    const filteredAndSortedMedia = useMemo(() => {
        const filtered = processedMedia.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
                item.displayTitle.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

            const matchesType = selectedType === 'all' ||
                item.type === selectedType ||
                (selectedType === 'audio' && (item.type === 'messenger-audio' || item.type.includes('audio')));

            return matchesSearch && matchesType;
        });

        return filtered.sort((a, b) => {
            // Sermons: Date Descending (Newest First)
            if (selectedType === 'sermon' || (!selectedType && a.type === 'sermon')) {
                return b.sortValue - a.sortValue;
            }
            // Others Returns: Numerical Ascending
            return a.sortValue - b.sortValue;
        });
    }, [processedMedia, debouncedSearchQuery, selectedType]);

    const totalPages = Math.ceil(filteredAndSortedMedia.length / itemsPerPage);

    // reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, selectedType]);

    const paginatedMedia = useMemo(() => {
        return filteredAndSortedMedia.slice(
            (currentPage - 1) * itemsPerPage,
            currentPage * itemsPerPage
        );
    }, [filteredAndSortedMedia, currentPage]);

    const stats = useMemo(() => ({
        total: processedMedia.length,
        sermons: processedMedia.filter(m => m.type === 'sermon').length,
        studies: processedMedia.filter(m => m.type === 'quran-study').length,
        audio: processedMedia.filter(m => (m.type === 'audio' || m.type === 'messenger-audio')).length
    }), [processedMedia]);


    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-200 font-sans relative overflow-hidden`}>
            {/* Background Effect */}
            <DigitalRain
                color={darkMode ? "#10B981" : "#059669"}
                fadeColor={darkMode ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)"}
                opacity={darkMode ? 0.12 : 0.08}
                speed={1.5}
                duration={5000}
                className="absolute inset-0 z-0 pointer-events-none"
            />

            {/* Technical Header */}
            <Header />

            {/* Stats Bar */}
            <div className={`border-b ${theme.border} ${theme.statsBar}`}>
                <div className="max-w-7xl mx-auto px-6 py-3">
                    <div className="flex items-center gap-8 text-xs font-mono overflow-x-auto whitespace-nowrap">
                        <div className="flex items-center gap-2">
                            <span className={theme.textVeryMuted}>TOTAL:</span>
                            <span className={`${theme.text} font-semibold`}>{stats.total}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={theme.textVeryMuted}>SERMONS:</span>
                            <span className={theme.textMuted}>{stats.sermons}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={theme.textVeryMuted}>STUDIES:</span>
                            <span className={theme.textMuted}>{stats.studies}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={theme.textVeryMuted}>AUDIO:</span>
                            <span className={theme.textMuted}>{stats.audio}</span>
                        </div>
                        <div className="ml-auto flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-800">
                            <span className={theme.textVeryMuted}>VIEW:</span>
                            <button
                                onClick={() => setViewMode('grid')}
                                aria-label="Switch to grid view"
                                className={`p-1 ${viewMode === 'grid' ? theme.text : `${theme.textVeryMuted} hover:${theme.textMuted}`}`}
                            >
                                <Grid3x3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                aria-label="Switch to list view"
                                className={`p-1 ${viewMode === 'list' ? theme.text : `${theme.textVeryMuted} hover:${theme.textMuted}`}`}
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Hero Banner */}
                <div className="mb-16 text-center max-w-4xl mx-auto flex flex-col items-center">
                    <h1 className="flex flex-col items-center leading-none mb-8">
                        <span className={`text-[3.5rem] md:text-[5rem] font-black tracking-tighter ${darkMode ? 'text-white' : 'text-zinc-900'} uppercase font-sans mb-2 leading-none`}>
                            SUBMISSION
                        </span>
                        <span style={{ fontFamily: 'var(--font-roboto-slab)' }} className={`text-5xl md:text-7xl font-bold italic tracking-widest text-white bg-zinc-700 px-6 py-2 uppercase shadow-lg min-w-[min-content] w-auto text-center block`}>
                            ARCHIVES
                        </span>
                    </h1>
                    <p className={`text-sm md:text-base ${theme.textVeryMuted} mb-12 leading-loose font-mono max-w-2xl mx-auto`}>
                        ARCHIVE SYSTEM V2.0 // COMPREHENSIVE DIGITAL ARCHIVE OF DR. RASHAD KHALIFA'S AUDIOS, VIDEOS, SERMONS, SUBMITTER PERSPECTIVES, AND QURAN STUDIES. CATALOGUED. TRANSCRIBED. SEARCHABLE.
                    </p>

                    <div className="flex flex-col items-center gap-3 mb-10 w-full">
                        {/* Row 1: Main Media Types */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <FilterButton
                                active={selectedType === 'quran-study'}
                                onClick={() => setSelectedType(selectedType === 'quran-study' ? 'all' : 'quran-study')}
                                theme={theme}
                                darkMode={darkMode}
                            >
                                <BookOpen className="w-3.5 h-3.5 mr-2" />
                                QURAN STUDIES
                            </FilterButton>
                            <FilterButton
                                active={selectedType === 'audio' || selectedType.includes('audio')}
                                onClick={() => setSelectedType(selectedType === 'audio' ? 'all' : 'audio')}
                                theme={theme}
                                darkMode={darkMode}
                            >
                                <Headphones className="w-3.5 h-3.5 mr-2" />
                                AUDIOS
                            </FilterButton>
                            <FilterButton
                                active={selectedType === 'video-program'}
                                onClick={() => setSelectedType(selectedType === 'video-program' ? 'all' : 'video-program')}
                                theme={theme}
                                darkMode={darkMode}
                            >
                                <Video className="w-3.5 h-3.5 mr-2" />
                                VIDEO PROGRAMS
                            </FilterButton>
                            <FilterButton
                                active={selectedType === 'sermon'}
                                onClick={() => setSelectedType(selectedType === 'sermon' ? 'all' : 'sermon')}
                                theme={theme}
                                darkMode={darkMode}
                            >
                                <Video className="w-3.5 h-3.5 mr-2" />
                                SERMONS
                            </FilterButton>
                        </div>

                        {/* Row 2: Resources - Single Row */}
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <FilterButton
                                active={selectedType === 'perspectives'}
                                onClick={() => setSelectedType(selectedType === 'perspectives' ? 'all' : 'perspectives')}
                                theme={theme}
                                darkMode={darkMode}
                            >
                                <FileText className="w-3.5 h-3.5 mr-2" />
                                PERSPECTIVES
                            </FilterButton>
                            <FilterButton
                                active={selectedType === 'appendices'}
                                onClick={() => setSelectedType(selectedType === 'appendices' ? 'all' : 'appendices')}
                                theme={theme}
                                darkMode={darkMode}
                            >
                                <BookOpen className="w-3.5 h-3.5 mr-2" />
                                APPENDICES
                            </FilterButton>
                            <FilterButton
                                active={selectedType === 'other'}
                                onClick={() => setSelectedType(selectedType === 'other' ? 'all' : 'other')}
                                theme={theme}
                                darkMode={darkMode}
                            >
                                <FileText className="w-3.5 h-3.5 mr-2" />
                                OTHER
                            </FilterButton>
                        </div>
                    </div>

                    <div className="flex justify-center flex-wrap gap-4">
                        <a href="https://wikisubmission.org/quran" target="_blank" rel="noopener noreferrer">
                            <button className={`px-6 py-3 rounded-sm ${darkMode ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'} text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-3`}>
                                <BookOpen className="w-4 h-4" />
                                QURAN READER
                            </button>
                        </a>
                        <Link href="/search">
                            <button className={`px-6 py-3 rounded-sm ${darkMode ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-black'} text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-3 group`}>
                                <Search className="w-4 h-4" />
                                ADVANCED SEARCH
                            </button>
                        </Link>
                        <Link href="/notes">
                            <button className={`px-6 py-3 rounded-sm ${darkMode ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 hover:bg-zinc-700' : 'bg-white text-gray-900 border border-gray-200 hover:bg-gray-50'} text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all flex items-center gap-3`}>
                                <FileText className="w-4 h-4" />
                                QUICK NOTES
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-6 mb-10 items-center justify-between font-sans border-b border-gray-100 pb-8">
                    {/* Search */}
                    <div className="flex-1 relative w-full">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textVeryMuted}`} />
                        <input
                            type="text"
                            placeholder="Search archive..."
                            aria-label="Search archives"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 ${theme.input} focus:outline-none text-sm font-mono transition-colors rounded-sm focus:ring-2 focus:ring-zinc-700`}
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto self-end md:self-auto ml-auto">
                        <div className={`p-2 rounded-md ${theme.textVeryMuted} border ${theme.border} text-xs font-mono`}>
                            VIEWING: {selectedType === 'perspectives' ? 'NEWSLETTERS' : selectedType === 'all' ? 'ALL ITEMS' : selectedType.toUpperCase().replace('-', ' ')}
                        </div>
                        <button
                            onClick={() => setSelectedType('all')}
                            className={`px-3 py-2 text-xs font-medium ${theme.textMuted} hover:${theme.text} underline decoration-dotted underline-offset-4`}
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>

                {/* Content Views */}
                {selectedType === 'perspectives' ? (
                    <NewslettersView
                        newsletters={newsletters}
                        loading={loadingNewsletters}
                        theme={theme}
                        darkMode={darkMode}
                    />
                ) : selectedType === 'appendices' ? (
                    <AppendicesView theme={theme} darkMode={darkMode} />
                ) : selectedType === 'other' ? (
                    <OtherView theme={theme} darkMode={darkMode} />
                ) : (
                    <MediaGrid media={paginatedMedia} theme={theme} viewMode={viewMode} />
                )}

                {/* Pagination */}
                {selectedType !== 'perspectives' && selectedType !== 'appendices' && selectedType !== 'other' && totalPages > 1 && (
                    <div className={`flex items-center justify-between mt-8 pt-6 border-t ${theme.border}`}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            aria-label="Previous page"
                            className={`px-4 py-2 text-xs font-mono ${theme.textMuted} hover:${theme.text} disabled:opacity-30 border ${theme.border} ${theme.borderHover} transition-colors uppercase`}
                        >
                            Prev
                        </button>
                        <span className={`text-xs font-mono ${theme.textVeryMuted}`}>
                            PAGE {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Next page"
                            className={`px-4 py-2 text-xs font-mono ${theme.textMuted} hover:${theme.text} disabled:opacity-30 border ${theme.border} ${theme.borderHover} transition-colors uppercase`}
                        >
                            Next
                        </button>
                    </div>
                )}
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
