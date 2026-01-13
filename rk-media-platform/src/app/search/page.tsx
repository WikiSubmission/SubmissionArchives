'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, ArrowLeft, Calendar, FileText, ChevronRight, Video, BookOpen, Headphones, Sun, Moon, Clock, User, ChevronDown, Play } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { searchTranscripts } from './actions';
import { useTheme } from '../components/ThemeProvider';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initialize from URL params
    const initialQuery = searchParams.get('q') || '';
    const initialFilters = searchParams.get('filters')?.split(',') || [];

    const [query, setQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const { darkMode, toggleDarkMode } = useTheme();
    const [filters, setFilters] = useState({
        sermon: initialFilters.length === 0 || initialFilters.includes('sermon'),
        'quran-study': initialFilters.length === 0 || initialFilters.includes('quran-study'),
        'video-program': initialFilters.length === 0 || initialFilters.includes('video-program'),
        audio: initialFilters.length === 0 || initialFilters.includes('audio'),
        perspective: initialFilters.length === 0 || initialFilters.includes('perspective'),
        appendix: initialFilters.length === 0 || initialFilters.includes('appendix'),
        other: initialFilters.length === 0 || initialFilters.includes('other')
    });
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

    // Theme classes (Matching HomePageClient)
    const theme = darkMode ? {
        bg: 'bg-zinc-950',
        card: 'bg-zinc-900',
        border: 'border-zinc-800',
        borderHover: 'hover:border-zinc-700',
        text: 'text-zinc-100',
        textMuted: 'text-zinc-400',
        textVeryMuted: 'text-zinc-500', // Brightened from 600 for better visibility
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

    // Helper to update URL with current search state
    const updateURL = (searchQuery: string, currentFilters: typeof filters) => {
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
            params.set('q', searchQuery.trim());
        }

        // Only add filters param if not all are selected
        const activeFilters = Object.entries(currentFilters)
            .filter(([_, isActive]) => isActive)
            .map(([key, _]) => key);

        const allFilters = Object.keys(currentFilters);
        if (activeFilters.length > 0 && activeFilters.length < allFilters.length) {
            params.set('filters', activeFilters.join(','));
        }

        const newUrl = params.toString() ? `/search?${params.toString()}` : '/search';
        router.push(newUrl, { scroll: false });
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
            if (filters.other) typeFilters.push('other');

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

            // Update URL with search state
            updateURL(query, filters);

        } catch (err: any) {
            console.error('Search error:', err);
            setErrorMsg(err.message || 'An unknown error occurred');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleFilter = (key: keyof typeof filters) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: !prev[key] };
            // Update URL when filters change
            updateURL(query, newFilters);
            return newFilters;
        });
    };

    // Auto-search on initial load if URL has query
    useEffect(() => {
        if (initialQuery && results.length === 0 && !isSearching) {
            handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    const toggleSection = (sectionKey: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionKey)) {
                newSet.delete(sectionKey);
            } else {
                newSet.add(sectionKey);
            }
            return newSet;
        });
    };

    // Group results by type
    const groupedResults = useMemo(() => {
        const groups: Record<string, any[]> = {};

        results.forEach(result => {
            const type = result.media.type;
            if (!groups[type]) groups[type] = [];
            groups[type].push(result);
        });

        return groups;
    }, [results]);

    // Debounced search effect
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const timer = setTimeout(() => {
            handleSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [query, filters]);

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

                    {/* Filters - Organized by Category */}
                    <div className="space-y-3">
                        {/* Video Row */}
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted} w-20`}>Video</span>
                            <div className="flex flex-wrap items-center gap-3">
                                <FilterButton active={filters['video-program']} onClick={() => toggleFilter('video-program')} theme={theme}>
                                    <Video className="w-3.5 h-3.5 mr-2" />
                                    PROGRAMS
                                </FilterButton>
                                <FilterButton active={filters.sermon} onClick={() => toggleFilter('sermon')} theme={theme}>
                                    <Video className="w-3.5 h-3.5 mr-2" />
                                    SERMONS
                                </FilterButton>
                            </div>
                        </div>

                        {/* Audio Row */}
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted} w-20`}>Audio</span>
                            <div className="flex flex-wrap items-center gap-3">
                                <FilterButton active={filters['quran-study']} onClick={() => toggleFilter('quran-study')} theme={theme}>
                                    <BookOpen className="w-3.5 h-3.5 mr-2" />
                                    QURAN STUDIES
                                </FilterButton>
                                <FilterButton active={filters.audio} onClick={() => toggleFilter('audio')} theme={theme}>
                                    <Headphones className="w-3.5 h-3.5 mr-2" />
                                    MESSENGER AUDIOS
                                </FilterButton>
                            </div>
                        </div>

                        {/* Written Row */}
                        <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono uppercase tracking-widest ${theme.textMuted} w-20`}>Written</span>
                            <div className="flex flex-wrap items-center gap-3">
                                <FilterButton active={filters.perspective} onClick={() => toggleFilter('perspective')} theme={theme}>
                                    <FileText className="w-3.5 h-3.5 mr-2" />
                                    PERSPECTIVES
                                </FilterButton>
                                <FilterButton active={filters.appendix} onClick={() => toggleFilter('appendix')} theme={theme}>
                                    <BookOpen className="w-3.5 h-3.5 mr-2" />
                                    APPENDICES
                                </FilterButton>
                                <FilterButton active={filters.other} onClick={() => toggleFilter('other')} theme={theme}>
                                    <FileText className="w-3.5 h-3.5 mr-2" />
                                    OTHER
                                </FilterButton>
                            </div>
                        </div>
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

                        {/* Grouped Results */}
                        {Object.entries(groupedResults).map(([type, typeResults]) => {
                            if (typeResults.length === 0) return null;

                            // Enhanced config for all types
                            const sectionConfig: any = {
                                'sermon': { title: 'FRIDAY SERMONS', icon: Video, color: 'text-emerald-500' },
                                'quran-study': { title: 'QURAN STUDIES', icon: BookOpen, color: 'text-blue-500' },
                                'video-program': { title: 'VIDEO PROGRAMS', icon: Video, color: 'text-purple-500' },
                                'messenger-audio': { title: 'AUDIO RECORDINGS', icon: Headphones, color: 'text-pink-500' },
                                'audio': { title: 'AUDIO RECORDINGS', icon: Headphones, color: 'text-pink-500' },
                                'perspective': { title: 'NEWSLETTERS', icon: FileText, color: 'text-amber-500' },
                                'appendix': { title: 'APPENDICES', icon: BookOpen, color: 'text-green-500' },
                                'other': { title: 'OTHER RESOURCES', icon: BookOpen, color: 'text-indigo-500' }
                            }[type] || { title: type.toUpperCase().replace('-', ' '), icon: FileText, color: 'text-gray-500' };

                            const SectionIcon = sectionConfig.icon;
                            const isCollapsed = collapsedSections.has(type);

                            return (
                                <div key={type} className={`${theme.card} rounded-lg border ${theme.border} overflow-hidden shadow-sm`}>
                                    {/* Section Header */}
                                    <button
                                        onClick={() => toggleSection(type)}
                                        className={`w-full flex items-center justify-between p-5 ${darkMode ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-white hover:bg-gray-50'} transition-colors border-b ${theme.border}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <SectionIcon className={`w-5 h-5 ${sectionConfig.color}`} />
                                            <h3 className={`text-sm font-mono font-bold ${theme.text} uppercase tracking-wider`}>
                                                {sectionConfig.title}
                                            </h3>
                                            <span className={`text-[10px] font-mono font-bold ${theme.textVeryMuted} border ${theme.border} px-2 py-0.5 rounded-sm uppercase tracking-wider`}>
                                                {typeResults.length} {typeResults.length === 1 ? 'Result' : 'Results'}
                                            </span>
                                        </div>
                                        <div className={`transform transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'} ${theme.textMuted}`}>
                                            <ChevronDown className="w-5 h-5" />
                                        </div>
                                    </button>

                                    {/* Section Content */}
                                    {!isCollapsed && (
                                        <div className="divide-y divide-zinc-800">
                                            {typeResults.map(({ media, matches }) => {
                                                const Icon = sectionConfig.icon;

                                                // Universal PDF Reader linking
                                                let mediaLink = `/watch/${media.id}`;
                                                let thumbnailSrc = '/images/placeholders/appendix.png'; // Default

                                                // Determine Thumbnail
                                                if (['sermon'].includes(media.type)) {
                                                    // Use YouTube thumbnail for sermons
                                                    const cleanId = media.id
                                                        .replace(/^media\/(disorganized_sermons|VIDEO PROGRAMS)\//, '')
                                                        .replace(/\s+/g, '_')
                                                        .replace(/[^\w\-_.]/g, '')
                                                        .replace(/\.mp4$/, '');
                                                    thumbnailSrc = `/images/sermons/${cleanId}.jpg`;
                                                } else if (['video-program'].includes(media.type)) {
                                                    // Use YouTube thumbnail for video programs
                                                    const cleanId = media.id
                                                        .replace(/^media\/(disorganized_sermons|VIDEO PROGRAMS)\//, '')
                                                        .replace(/\s+/g, '_')
                                                        .replace(/[^\w\-_.]/g, '')
                                                        .replace(/\.mp4$/, '');
                                                    thumbnailSrc = `/images/video-programs/${cleanId}.jpg`;
                                                } else if (['audio', 'messenger-audio'].includes(media.type)) {
                                                    thumbnailSrc = '/images/messenger-audios/default.jpg';
                                                } else if (['perspective'].includes(media.type)) {
                                                    thumbnailSrc = `/images/newsletters/${media.id}.jpg`;
                                                } else if (['appendix'].includes(media.type)) {
                                                    thumbnailSrc = `/images/appendices/${media.id}.jpg`;
                                                } else if (['other'].includes(media.type)) {
                                                    thumbnailSrc = `/images/other/${media.id}.jpg`;
                                                } else if (media.type === 'quran-study') {
                                                    // Extract number from title/id (e.g. "1) Quran Study...")
                                                    const match = media.title.match(/^(\d+)\)/) || media.id.match(/quran-study-v2\/(\d+)/);
                                                    if (match) {
                                                        const num = parseInt(match[1]);
                                                        if (num === 52) {
                                                            thumbnailSrc = `/images/quran-studies/QS${num}.png`;
                                                        } else if (num >= 1 && num <= 51) {
                                                            thumbnailSrc = `/images/quran-studies/QS${num}.jpg`;
                                                        }
                                                    } else {
                                                        thumbnailSrc = '/images/placeholders/rashad-khalifa.png';
                                                    }
                                                }

                                                if (['perspective', 'appendix', 'other'].includes(media.type)) {
                                                    const params = new URLSearchParams();
                                                    if (query) params.append('q', query);
                                                    if (media.page) params.append('page', media.page.toString());

                                                    mediaLink = `/read/${media.id}?${params.toString()}`;
                                                }

                                                return (
                                                    <div key={`${media.id}${media.page ? `-${media.page}` : ''}`} className={`${theme.card} overflow-hidden group border-b ${theme.border} last:border-0`}>
                                                        <div className="flex flex-col md:flex-row">
                                                            {/* Thumbnail Column */}
                                                            <div className="w-32 md:w-40 shrink-0 p-3">
                                                                <Link href={mediaLink} className="block w-full aspect-video relative rounded-md overflow-hidden shadow-sm bg-black/5 dark:bg-black/20">
                                                                    <img
                                                                        src={thumbnailSrc}
                                                                        alt={media.title}
                                                                        className={`w-full h-full ${['quran-study', 'perspective', 'appendix', 'other'].includes(media.type) ? 'object-contain p-1 bg-black/5 dark:bg-black' : 'object-cover'} opacity-90 group-hover:opacity-100 transition-opacity`}
                                                                    />
                                                                    {/* Overlay Icon for Media */}
                                                                    {['sermon', 'video-program', 'audio', 'messenger-audio'].includes(media.type) && (
                                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                            <div className="bg-black/30 rounded-full p-1.5 backdrop-blur-[1px]">
                                                                                <Play className="w-4 h-4 text-white fill-white" />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </Link>
                                                            </div>

                                                            {/* Content Column */}
                                                            <div className="flex-1 min-w-0">
                                                                {/* Header Link */}
                                                                <Link href={mediaLink} className={`block p-4 md:p-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors`}>
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <span className={`px-2 py-0.5 rounded-sm border ${theme.border} text-[10px] font-mono uppercase tracking-wider ${theme.textVeryMuted} flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800`}>
                                                                            <Icon className="w-3 h-3" />
                                                                            {media.type === 'messenger-audio' ? 'AUDIO' : media.type.replace('-', ' ')}
                                                                        </span>
                                                                        {media.displayDate && (
                                                                            <span className={`text-[11px] font-mono uppercase tracking-wider ${theme.textVeryMuted} flex items-center gap-1.5`}>
                                                                                <Calendar className="w-3 h-3" />
                                                                                {media.displayDate}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <h3 style={{ fontFamily: 'var(--font-playfair)' }} className={`text-lg md:text-xl ${theme.text} mb-1 leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors`}>
                                                                        {media.displayTitle || media.title}
                                                                    </h3>
                                                                    <div className={`text-xs ${theme.textVeryMuted} font-mono flex items-center gap-2`}>
                                                                        <User className="w-3 h-3" />
                                                                        <span>{media.author}</span>
                                                                    </div>
                                                                </Link>

                                                                {/* Matches Grid */}
                                                                <div className={`border-t ${theme.border}`}>
                                                                    <div className="divide-y divide-dashed dark:divide-zinc-800/50">
                                                                        {matches.slice(0, 3).map((match: any) => (
                                                                            <div key={match.id} className="p-3 pl-4 md:pl-6 transition-colors group/match">
                                                                                <div className="flex gap-4 items-baseline">
                                                                                    <div className="shrink-0 w-16 pt-0.5">
                                                                                        <Link
                                                                                            href={['perspective', 'appendix', 'other'].includes(media.type) ? mediaLink : `${mediaLink}?t=${Math.floor(match.start_time)}`}
                                                                                            className={`group/time flex items-center gap-1.5 text-xs font-mono font-bold transition-colors cursor-pointer ${(['perspective', 'appendix', 'other'].includes(media.type))
                                                                                                ? 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                                                                                                : 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300'
                                                                                                }`}
                                                                                        >
                                                                                            {!(['perspective', 'appendix', 'other'].includes(media.type)) && (
                                                                                                <Play className="w-3 h-3 fill-current opacity-70 group-hover/time:opacity-100" />
                                                                                            )}
                                                                                            {(['perspective', 'appendix', 'other'].includes(media.type)) ? 'TEXT' : formatTime(match.start_time)}
                                                                                        </Link>
                                                                                    </div>
                                                                                    <p className={`text-sm ${theme.textMuted} leading-relaxed font-sans select-text cursor-text line-clamp-2`}
                                                                                        dangerouslySetInnerHTML={{
                                                                                            __html: highlightMatch(match.content, query, theme)
                                                                                        }}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    {matches.length > 3 && (
                                                                        <Link
                                                                            href={mediaLink}
                                                                            className={`block py-2 text-center text-[10px] font-bold uppercase tracking-widest ${theme.textVeryMuted} hover:${theme.text} transition-colors font-mono border-t border-dashed dark:border-zinc-800/50`}
                                                                        >
                                                                            +{matches.length - 3} more matches
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
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
    const isDark = theme.bg.includes('zinc-950');

    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 rounded-sm text-xs font-mono uppercase tracking-widest transition-all flex items-center border ${active
                ? isDark
                    ? 'bg-zinc-100 text-zinc-900 border-zinc-100'
                    : 'bg-zinc-900 text-white border-zinc-900'
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
    return text.replace(regex, `<span class="font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 rounded px-0.5">$1</span>`);
}
