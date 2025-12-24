'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, ArrowLeft, ArrowDownUp, Search, Loader2, BookOpen, Sun, Moon, ChevronDown, ChevronRight } from 'lucide-react';
import { searchNewsletters, type SearchResult } from './actions';
import { useTheme } from '../components/ThemeProvider';

type Newsletter = {
    id: string;
    title: string;
    description: string;
    date: string; // Display date e.g. "FEBRUARY 1985"
    fullDate: string; // ISO for sorting
    filename: string;
};

export default function SubmitterPerspectives() {
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default to earliest years first
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
    const { darkMode, toggleDarkMode } = useTheme();

    // Theme classes (Matching Homepage/Search)
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
        button: 'hover:bg-zinc-900',
        yearHeader: 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
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
        button: 'hover:bg-gray-100',
        yearHeader: 'bg-white border-gray-200 hover:bg-gray-50'
    };

    useEffect(() => {
        // Load metadata
        fetch('/data/newsletters/metadata.json')
            .then(res => res.json())
            .then(data => {
                // Sort by full date
                const sorted = data.sort((a: any, b: any) => a.fullDate.localeCompare(b.fullDate));
                setNewsletters(sorted);
            })
            .catch(err => console.error("Failed to load newsletters", err));
    }, []);

    const toggleSort = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const toggleYear = (year: string) => {
        const newCollapsed = new Set(collapsedYears);
        if (newCollapsed.has(year)) {
            newCollapsed.delete(year);
        } else {
            newCollapsed.add(year);
        }
        setCollapsedYears(newCollapsed);
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchNewsletters(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    // Grouping Logic
    const groupedNewsletters = newsletters.reduce((acc, newsletter) => {
        const year = newsletter.fullDate.split('-')[0];
        if (!acc[year]) acc[year] = [];
        acc[year].push(newsletter);
        return acc;
    }, {} as Record<string, Newsletter[]>);

    // Get sorted years
    const sortedYears = Object.keys(groupedNewsletters).sort((a, b) => {
        return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });

    // Calculate count
    const count = searchResults ? searchResults.length : newsletters.length;

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.text} transition-colors duration-200 font-sans`}>
            {/* Technical Header */}
            <header className={`border-b ${theme.border} ${theme.header} sticky top-0 z-50`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className={`p-2 rounded-sm ${theme.textMuted} hover:${theme.text} border ${theme.border} ${theme.borderHover} transition-colors`}>
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                        </Link>
                        <div>
                            <h1 className={`text-lg font-serif font-medium ${theme.text} tracking-tight`}>
                                Submitter Perspectives
                            </h1>
                            <p className={`text-[10px] ${theme.textVeryMuted} font-mono uppercase tracking-wider`}>
                                Archive Collection
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
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
                    <div>
                        <h2 className={`text-4xl font-serif ${theme.text} mb-2 tracking-tight`}>Newsletter Archive</h2>
                        <p className={`${theme.textVeryMuted} font-mono text-xs uppercase tracking-widest`}>
                            {searchResults ? `Found ${count} matches` : `${count} Issues Digitized`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto font-mono">
                        <form onSubmit={handleSearch} className="relative flex-1 md:w-72">
                            <Search className={`w-4 h-4 ${theme.textVeryMuted} absolute left-3.5 top-1/2 -translate-y-1/2`} />
                            <input
                                type="search"
                                placeholder="SEARCH ARCHIVE..."
                                className={`w-full pl-10 pr-4 py-2.5 ${theme.input} border rounded-sm text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all uppercase tracking-wider shadow-sm`}
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value === '') setSearchResults(null);
                                }}
                            />
                        </form>

                        {!searchResults && (
                            <button
                                onClick={toggleSort}
                                className={`flex items-center gap-2 px-4 py-2.5 ${darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'} border rounded-sm transition-colors text-xs font-bold uppercase tracking-widest shrink-0 shadow-sm`}
                            >
                                <ArrowDownUp className="w-3.5 h-3.5" />
                                <span>{sortOrder === 'asc' ? 'Oldest Year' : 'Newest Year'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Search Results View */}
                    {searchResults ? (
                        <div className="grid gap-4">
                            {searchResults.map(result => (
                                <Link key={result.id} href={`/submitter-perspectives/${result.filename}`}>
                                    <div className={`${theme.card} p-6 border ${theme.border} rounded-sm overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer group hover:shadow-md`}>
                                        <div className="flex items-start gap-4">
                                            <div className={`p-2.5 ${darkMode ? 'bg-black border-zinc-800 text-amber-500' : 'bg-amber-50 border-amber-100 text-amber-600'} rounded-sm border transition-colors shadow-sm`}>
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className={`font-serif font-medium ${theme.text} text-xl mb-1`}>{result.title}</h3>
                                                <p className={`text-[10px] font-mono font-bold ${theme.textVeryMuted} uppercase tracking-widest mb-3`}>{result.date}</p>

                                                <div className="space-y-2">
                                                    {result.matches.map((snippet, idx) => (
                                                        <p key={idx} className={`text-sm ${theme.textMuted} font-serif ${darkMode ? 'bg-black/50 border-zinc-800' : 'bg-gray-50 border-gray-100'} p-3 rounded-sm border italic leading-relaxed`}
                                                            dangerouslySetInnerHTML={{ __html: snippet.replace(/<mark>/g, `<span class="${theme.highlight} px-0.5 rounded-sm">`).replace(/<\/mark>/g, '</span>') }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {searchResults.length === 0 && !isSearching && (
                                <div className={`text-center py-20 ${theme.card} rounded-sm border border-dashed ${theme.border}`}>
                                    <Search className={`w-12 h-12 ${theme.textVeryMuted} mx-auto mb-4 opacity-50`} />
                                    <p className={`${theme.textMuted} font-mono text-sm uppercase tracking-widest`}>No matches found for "{searchQuery}"</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Year Groups View */
                        <div className="space-y-4">
                            {sortedYears.map(year => (
                                <div key={year} className={`${theme.card} rounded-sm border ${theme.border} shadow-sm overflow-hidden`}>
                                    {/* Year Header */}
                                    <button
                                        onClick={() => toggleYear(year)}
                                        className={`w-full flex items-center justify-between p-5 ${theme.yearHeader} transition-colors border-b ${theme.border}`}
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
                                                    // Ensure months are ordered chronologically within the year (default to Date Ascending)
                                                    .sort((a, b) => a.fullDate.localeCompare(b.fullDate))
                                                    .map(item => (
                                                        <Link key={item.id} href={`/submitter-perspectives/${item.filename}`}>
                                                            <div className={`group h-full ${theme.card} border ${theme.border} rounded-sm p-5 hover:border-zinc-400 transition-all cursor-pointer flex flex-col relative overflow-hidden shadow-sm hover:shadow-md`}>
                                                                <div className="mb-4">
                                                                    <div className={`text-[10px] font-mono font-bold tracking-widest ${theme.textVeryMuted} mb-2 uppercase border-b ${theme.border} pb-2 inline-block`}>
                                                                        {item.date.split(' ')[0]} {/* Display Month Name */}
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
                        </div>
                    )}

                    {isSearching && (
                        <div className="flex justify-center py-20">
                            <Loader2 className={`w-8 h-8 ${theme.textMuted} animate-spin`} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
