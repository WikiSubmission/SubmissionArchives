'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Play, Clock, Calendar, User, Video, Headphones, FileText, ArrowRight, Grid3x3, List, Filter, Moon, Sun, MessageCircle, ChevronDown, ChevronRight, Loader2, ArrowLeft, X } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { useTheme } from './components/ThemeProvider';

import DigitalRain from '@/components/effects/DigitalRain';
import Header from '@/components/Header';

type Newsletter = {
    id: string;
    title: string;
    description: string;
    date: string;
    fullDate: string;
    filename: string;
};

export default function HomePageClient({ initialMedia }: { initialMedia: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const { darkMode, toggleDarkMode } = useTheme();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Perspectives State
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
    const [loadingNewsletters, setLoadingNewsletters] = useState(false);

    useEffect(() => {
        // Fetch newsletters on mount
        setLoadingNewsletters(true);
        fetch('/data/newsletters/metadata.json')
            .then(res => res.json())
            .then(data => {
                const sorted = data.sort((a: any, b: any) => a.fullDate.localeCompare(b.fullDate));
                setNewsletters(sorted);
                // Initialize all years as collapsed
                const years = new Set(data.map((n: any) => n.fullDate.split('-')[0]));
                setCollapsedYears(new Set(years as any));
            })
            .catch(err => console.error("Failed to load newsletters", err))
            .finally(() => setLoadingNewsletters(false));
    }, []);

    const toggleYear = (year: string) => {
        const newCollapsed = new Set(collapsedYears);
        if (newCollapsed.has(year)) {
            newCollapsed.delete(year);
        } else {
            newCollapsed.add(year);
        }
        setCollapsedYears(newCollapsed);
    };

    const groupedNewsletters = useMemo(() => {
        return newsletters.reduce((acc, newsletter) => {
            const year = newsletter.fullDate.split('-')[0];
            if (!acc[year]) acc[year] = [];
            acc[year].push(newsletter);
            return acc;
        }, {} as Record<string, Newsletter[]>);
    }, [newsletters]);

    const sortedYears = useMemo(() => {
        return Object.keys(groupedNewsletters).sort();
    }, [groupedNewsletters]);

    const fonts = {
        heading: "font-serif",
        body: "font-sans",
        sans: "font-sans"
    };

    // Appendices Data
    const APPENDICES = [
        { id: 'proclamation', title: 'Proclamation' },
        { id: 'glossary', title: 'Glossary' },
        { id: 'introduction', title: 'Introduction' },
        { id: 'appendix-1', title: '1. One of the Great Miracles [74:35]' },
        { id: 'appendix-2', title: '2. God\'s Messenger of the Covenant [3:81]' },
        { id: 'appendix-3', title: '3. We Made the Quran Easy [54:17]' },
        { id: 'appendix-4', title: '4. Why Was the Quran Revealed in Arabic?' },
        { id: 'appendix-5', title: '5. Heaven and Hell' },
        { id: 'appendix-6', title: '6. Greatness of God' },
        { id: 'appendix-7', title: '7. Why Were We Created?' },
        { id: 'appendix-8', title: '8. The Myth of Intercession' },
        { id: 'appendix-9', title: '9. Abraham: Original Messenger of Islam' },
        { id: 'appendix-10', title: '10. God\'s Usage of the Plural Tense' },
        { id: 'appendix-11', title: '11. The Day of Resurrection' },
        { id: 'appendix-12', title: '12. Role of the Prophet Muhammad' },
        { id: 'appendix-13', title: '13. The First Pillar of Islam' },
        { id: 'appendix-14', title: '14. Predestination' },
        { id: 'appendix-15', title: '15. Religious Duties: Gift from God' },
        { id: 'appendix-16', title: '16. Dietary Prohibition' },
        { id: 'appendix-17', title: '17. Death' },
        { id: 'appendix-18', title: '18. Quran Is All You Need' },
        { id: 'appendix-19', title: '19. Hadith and Sunna: Satanic Innovations' },
        { id: 'appendix-20', title: '20. Quran: Unlike Any Other Book' },
        { id: 'appendix-21', title: '21. Satan: Fallen Angel' },
        { id: 'appendix-22', title: '22. Jesus' },
        { id: 'appendix-23', title: '23. Chronological Order of Revelation' },
        { id: 'appendix-24', title: '24. Two False Verses Removed from the Quran' },
        { id: 'appendix-25', title: '25. End of the World' },
        { id: 'appendix-26', title: '26. The Three Messengers of Islam' },
        { id: 'appendix-27', title: '27. Who Is Your God?' },
        { id: 'appendix-28', title: '28. Muhammad Wrote God\'s Revelations With His Own Hand' },
        { id: 'appendix-29', title: '29. The Missing Basmalah' },
        { id: 'appendix-30', title: '30. Polygamy' },
        { id: 'appendix-31', title: '31. Evolution: A Divinely Guided Process' },
        { id: 'appendix-32', title: '32. The Crucial Age of 40' },
        { id: 'appendix-33', title: '33. Why Did God Send a Messenger Now?' },
        { id: 'appendix-34', title: '34. Virginity/Chastity: A Trait of the True Believers' },
        { id: 'appendix-35', title: '35. Drugs & Alcohol' },
        { id: 'appendix-36', title: '36. What Price a Great Nation' },
        { id: 'appendix-37', title: '37. Criminal Justice in Islam' },
        { id: 'appendix-38', title: '38. The Creator\'s Signature' },
    ];


    const processedMedia = useMemo(() => {
        return initialMedia.map(item => ({
            ...item,
            ...formatMedia(item)
        }));
    }, [initialMedia]);

    let filteredMedia = processedMedia.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.displayTitle.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType === 'all' || item.type === selectedType ||
            (selectedType === 'audio' && item.type === 'messenger-audio');
        return matchesSearch && matchesType;
    });

    filteredMedia = [...filteredMedia].sort((a, b) => {
        if (selectedType === 'quran-study' || selectedType === 'audio') {
            return a.sortValue - b.sortValue;
        }
        // Default: Recent First (Date Descending)
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
    });

    const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
    const paginatedMedia = filteredMedia.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const stats = {
        total: processedMedia.length,
        sermons: processedMedia.filter(m => m.type === 'sermon').length,
        studies: processedMedia.filter(m => m.type === 'quran-study').length,
        audio: processedMedia.filter(m => m.type === 'audio' || m.type === 'messenger-audio').length
    };

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedType]);

    // Theme classes
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
        statsBar: 'bg-zinc-950',
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
        statsBar: 'bg-gray-100',
        button: 'hover:bg-gray-100'
    };

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-200 font-sans relative overflow-hidden`}>
            {/* Background Effect: Intro Animation */}
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
                                className={`p-1 ${viewMode === 'grid' ? theme.text : `${theme.textVeryMuted} hover:${theme.textMuted}`}`}
                            >
                                <Grid3x3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1 ${viewMode === 'list' ? theme.text : `${theme.textVeryMuted} hover:${theme.textMuted}`}`}
                            >
                                <List className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 py-12">
                {/* Hero Banner Banner */}
                {/* Hero Banner Banner */}
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

                    <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                        <FilterButton
                            active={selectedType === 'quran-study'}
                            onClick={() => setSelectedType(selectedType === 'quran-study' ? 'all' : 'quran-study')}
                            theme={theme}
                        >
                            <BookOpen className="w-3.5 h-3.5 mr-2" />
                            QURAN STUDIES
                        </FilterButton>
                        <FilterButton
                            active={selectedType === 'audio' || selectedType.includes('audio')}
                            onClick={() => setSelectedType(selectedType === 'audio' ? 'all' : 'audio')}
                            theme={theme}
                        >
                            <Headphones className="w-3.5 h-3.5 mr-2" />
                            AUDIOS
                        </FilterButton>
                        <FilterButton
                            active={selectedType === 'video-program'}
                            onClick={() => setSelectedType(selectedType === 'video-program' ? 'all' : 'video-program')}
                            theme={theme}
                        >
                            <Video className="w-3.5 h-3.5 mr-2" />
                            VIDEO PROGRAMS
                        </FilterButton>
                        <FilterButton
                            active={selectedType === 'sermon'}
                            onClick={() => setSelectedType(selectedType === 'sermon' ? 'all' : 'sermon')}
                            theme={theme}
                        >
                            <Video className="w-3.5 h-3.5 mr-2" />
                            SERMONS
                        </FilterButton>
                        <FilterButton
                            active={selectedType === 'perspectives'}
                            onClick={() => setSelectedType(selectedType === 'perspectives' ? 'all' : 'perspectives')}
                            theme={theme}
                        >
                            <FileText className="w-3.5 h-3.5 mr-2" />
                            PERSPECTIVES
                        </FilterButton>
                        <FilterButton
                            active={selectedType === 'appendices'}
                            onClick={() => setSelectedType(selectedType === 'appendices' ? 'all' : 'appendices')}
                            theme={theme}
                        >
                            <BookOpen className="w-3.5 h-3.5 mr-2" />
                            APPENDICES
                        </FilterButton>
                    </div>

                    <div className="flex justify-center flex-wrap gap-4">
                        <Link href="/quran-compare">
                            <button className={`px-6 py-3 rounded-sm ${theme.text === 'text-zinc-100' ? 'bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-700' : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'} text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all shadow-sm hover:shadow-md flex items-center gap-3`}>
                                <BookOpen className="w-4 h-4" />
                                COMPARE EDITIONS
                            </button>
                        </Link>
                        <Link href="/search">
                            <button className={`px-6 py-3 rounded-sm ${theme.text === 'text-zinc-100' ? 'bg-zinc-100 text-zinc-900 hover:bg-white' : 'bg-zinc-900 text-white hover:bg-black'} text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all shadow-sm hover:shadow-md flex items-center gap-3 group`}>
                                <Search className="w-4 h-4" />
                                ADVANCED SEARCH
                            </button>
                        </Link>
                        <Link href="/notes">
                            <button className={`px-6 py-3 rounded-sm ${theme.text === 'text-zinc-100' ? 'bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700 hover:bg-zinc-700' : 'bg-white text-gray-900 ring-1 ring-gray-200 hover:bg-gray-50'} text-xs font-mono font-bold tracking-[0.2em] uppercase transition-all shadow-sm hover:shadow-md flex items-center gap-3`}>
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
                            suppressHydrationWarning
                            type="text"
                            placeholder="Search archive..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 ${theme.input} focus:outline-none text-sm font-mono transition-colors rounded-sm`}
                        />
                    </div>

                    {/* Filters - Simplified since we have the banner */}
                    <div className="flex items-center gap-2 w-full sm:w-auto self-end md:self-auto ml-auto">
                        <div className={`p-2 rounded-md ${theme.textVeryMuted} border ${theme.border} text-xs font-mono`}>
                            VIEWING: {selectedType === 'perspectives' ? 'NEWSLETTERS' : selectedType === 'all' ? 'ALL ITEMS' : selectedType.toUpperCase().replace('-', ' ')}
                        </div>
                        <button
                            suppressHydrationWarning
                            onClick={() => setSelectedType('all')}
                            className={`px-3 py-2 text-xs font-medium ${theme.textMuted} hover:${theme.text} underline decoration-dotted underline-offset-4`}
                        >
                            Clear Filter
                        </button>
                    </div>
                </div>

                {/* Media Display */}
                {selectedType === 'perspectives' ? (
                    <div className="space-y-4">
                        {loadingNewsletters && (
                            <div className="flex justify-center py-20">
                                <Loader2 className={`w-8 h-8 ${theme.textMuted} animate-spin`} />
                            </div>
                        )}
                        {!loadingNewsletters && sortedYears.map(year => (
                            <div key={year} className={`${theme.card} rounded-sm border ${theme.border} shadow-sm overflow-hidden`}>
                                {/* Year Header */}
                                <button
                                    onClick={() => toggleYear(year)}
                                    className={`w-full flex items-center justify-between p-5 ${darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-gray-50'} transition-colors border-b ${theme.border}`}
                                >
                                    <div className="flex items-baseline gap-4">
                                        <h3 className={`text-2xl font-serif ${theme.text}`}>{year}</h3>
                                        <span className={`text-[10px] font-mono font-bold ${theme.textVeryMuted} border ${theme.border} px-2 py-0.5 rounded-sm uppercase tracking-wider`}>
                                            {groupedNewsletters[year].length} Issues
                                        </span>
                                    </div>
                                    <div className={`transform transition-transform duration-200 ${collapsedYears.has(year) ? '-rotate-90' : 'rotate-0'} ${theme.textMuted}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </button>

                                {/* Issues Grid */}
                                {!collapsedYears.has(year) && (
                                    <div className={`p-6 ${darkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {groupedNewsletters[year]
                                                .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
                                                .map(item => (
                                                    <Link key={item.id} href={`/submitter-perspectives/${item.filename}`}>
                                                        <div className={`group h-full ${theme.card} border ${theme.border} rounded-sm p-5 hover:border-zinc-400 transition-all cursor-pointer flex flex-col relative overflow-hidden shadow-sm hover:shadow-md`}>
                                                            <div className="mb-4">
                                                                <div className={`text-[10px] font-mono font-bold tracking-widest ${theme.textVeryMuted} mb-2 uppercase border-b ${theme.border} pb-2 inline-block`}>
                                                                    {item.date.split(' ')[0]}
                                                                </div>
                                                                <h4 className={`font-serif text-lg ${theme.text} group-hover:opacity-70 transition-opacity line-clamp-2 leading-tight`}>
                                                                    {item.title}
                                                                </h4>
                                                            </div>

                                                            <div className={`mt-auto flex items-center justify-between pt-4 border-t ${theme.border} text-xs font-mono uppercase tracking-widest ${theme.textVeryMuted}`}>
                                                                <div className="flex items-center gap-1.5">
                                                                    <FileText className="w-3 h-3" />
                                                                    <span>Read</span>
                                                                </div>
                                                                <ArrowLeft className={`w-3 h-3 rotate-180 transform group-hover:translate-x-1 transition-transform ${theme.text}`} />
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>) : selectedType === 'appendices' ? (
                        <div className="space-y-6">
                            <div className={`${theme.card} rounded-sm border ${theme.border} shadow-sm overflow-hidden`}>
                                <div className={`p-6 ${darkMode ? 'bg-zinc-900' : 'bg-white'} border-b ${theme.border}`}>
                                    <div className="flex items-baseline gap-4">
                                        <h3 className={`text-2xl font-serif ${theme.text}`}>Quran Translation Appendices</h3>
                                        <span className={`text-[10px] font-mono font-bold ${theme.textVeryMuted} border ${theme.border} px-2 py-0.5 rounded-sm uppercase tracking-wider`}>
                                            {APPENDICES.length} Appendices
                                        </span>
                                    </div>
                                </div>
                                <div className={`p-6 ${darkMode ? 'bg-black/20' : 'bg-gray-50/50'}`}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {APPENDICES.map((appendix) => (
                                            <Link
                                                key={appendix.id}
                                                href={`/appendices/${appendix.id}`}
                                                className={`group h-full ${theme.card} border ${theme.border} rounded-sm p-5 hover:border-zinc-400 transition-all cursor-pointer flex flex-col relative overflow-hidden shadow-sm hover:shadow-md`}
                                            >
                                                <div className="mb-4">
                                                    <h4 className={`font-serif text-base ${theme.text} group-hover:opacity-70 transition-opacity leading-tight`}>
                                                        {appendix.title}
                                                    </h4>
                                                </div>
                                                <div className={`mt-auto flex items-center justify-between pt-4 border-t ${theme.border} text-xs font-mono uppercase tracking-widest ${theme.textVeryMuted}`}>
                                                    <div className="flex items-center gap-1.5">
                                                        <BookOpen className="w-3 h-3" />
                                                        <span>Read</span>
                                                    </div>
                                                    <ArrowLeft className={`w-3 h-3 rotate-180 transform group-hover:translate-x-1 transition-transform ${theme.text}`} />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {paginatedMedia.map((item) => (
                                <Link href={`/watch/${item.id}`} key={item.id} className="block h-full">
                                    <MediaCardTech item={item} theme={theme} />
                                </Link>
                            ))}
                        </div>
                    ) : (
                    <div className="space-y-3">
                        {paginatedMedia.map((item) => (
                            <Link href={`/watch/${item.id}`} key={item.id} className="block">
                                <MediaListTech item={item} theme={theme} />
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {selectedType !== 'perspectives' && totalPages > 1 && (
                    <div className={`flex items-center justify-between mt-8 pt-6 border-t ${theme.border}`}>
                        <button
                            suppressHydrationWarning
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 text-xs font-mono ${theme.textMuted} hover:${theme.text} disabled:opacity-30 border ${theme.border} ${theme.borderHover} transition-colors uppercase`}
                        >
                            Prev
                        </button>
                        <span className={`text-xs font-mono ${theme.textVeryMuted}`}>
                            PAGE {currentPage} / {totalPages}
                        </span>
                        <button
                            suppressHydrationWarning
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
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

function FilterButton({ active, children, onClick, theme }: any) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-widest transition-all flex items-center border ${active
                ? `bg-zinc-100 text-zinc-900 border-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100`
                : `${theme.textMuted} ${theme.bg} ${theme.border} hover:${theme.text} hover:border-gray-400 dark:hover:border-zinc-600`
                }`}
        >
            {children}
        </button>
    );
}

function MediaCardTech({ item, theme }: any) {
    const Icon = item.type === 'sermon' ? Video :
        item.type === 'quran-study' ? BookOpen :
            (item.type.includes('audio') || item.type === 'messenger-audio') ? Headphones : FileText;

    return (
        <div className={`h-full border ${theme.border} rounded-lg ${theme.card} p-6 ${theme.borderHover} transition-all duration-300 flex flex-col justify-between relative overflow-hidden group cursor-pointer shadow-sm hover:shadow-md`}>
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-sm ${theme.border} border bg-opacity-50`}>
                        <Icon className={`w-3 h-3 ${theme.textVeryMuted}`} />
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${theme.textVeryMuted}`}>
                            {item.type === 'messenger-audio' ? 'Audio' : item.type.replace('-', ' ')}
                        </span>
                    </div>
                </div>

                <h3
                    style={{ fontFamily: 'var(--font-roboto-slab)' }}
                    className={`text-lg ${theme.text} leading-[1.4] mb-3 line-clamp-2 group-hover:opacity-70 transition-colors`}
                >
                    {item.displayTitle}
                </h3>
            </div>

            <div className={`relative z-10 pt-4 mt-auto border-t ${theme.border} flex items-center justify-between text-xs ${theme.textVeryMuted} font-mono`}>
                <span className="flex items-center gap-1.5 line-clamp-1">
                    <User className="w-3 h-3 flex-shrink-0" />
                    {item.author}
                </span>
                <span className="flex items-center gap-3 flex-shrink-0">
                    {item.duration_seconds && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.floor(item.duration_seconds / 60)}m
                        </span>
                    )}
                </span>
            </div>
        </div>
    );
}

function MediaListTech({ item, theme }: any) {
    const Icon = item.type === 'sermon' ? Video :
        item.type === 'quran-study' ? BookOpen :
            (item.type.includes('audio') || item.type === 'messenger-audio') ? Headphones : FileText;

    return (
        <div className={`${theme.card} border ${theme.border} ${theme.borderHover} transition-colors group cursor-pointer rounded-sm shadow-sm hover:shadow-md`}>
            <div className="px-5 py-4 flex items-center gap-6">
                <div className="flex items-center gap-3 w-32 flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${theme.textVeryMuted}`} />
                    <span className={`text-[10px] ${theme.textVeryMuted} font-mono uppercase tracking-wider truncate`}>
                        {item.type === 'messenger-audio' ? 'Audio' : item.type.replace('-', ' ')}
                    </span>
                </div>

                <h3
                    style={{ fontFamily: 'var(--font-roboto-slab)' }}
                    className={`flex-1 text-sm ${theme.text} group-hover:opacity-70 transition-opacity font-medium truncate`}
                >
                    {item.displayTitle}
                </h3>

                <div className={`hidden sm:flex items-center gap-6 text-[10px] font-mono ${theme.textVeryMuted}`}>
                    <span className="w-32 truncate">{item.author}</span>
                    <span className="w-24 truncate">{item.displayDate}</span>
                    {item.duration_seconds && (
                        <span className="w-12 text-right">{Math.floor(item.duration_seconds / 60)}m</span>
                    )}
                </div>

                <ArrowRight className={`w-3.5 h-3.5 ${theme.textVeryMuted} group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-auto sm:ml-0`} />
            </div>
        </div>
    );
}
