import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, X, ChevronDown, Check } from 'lucide-react';
import type { ThemeColors } from '@/lib/theme';

export interface SearchFilters {
    yearFilter: string;
    sortBy: 'relevance' | 'date-asc' | 'date-desc';
}

interface AdvancedSearchPanelProps {
    onSearch: (query: string, filters: SearchFilters) => void;
    isSearching: boolean;
    resultCount?: number;
    theme: ThemeColors;
    availableYears: string[];
    initialQuery?: string;
}

export default function AdvancedSearchPanel({
    onSearch,
    isSearching,
    resultCount,
    theme,
    availableYears,
    initialQuery = ''
}: AdvancedSearchPanelProps) {
    const [query, setQuery] = useState(initialQuery);
    const [showFilters, setShowFilters] = useState(false);

    // Filters State
    const [yearFilter, setYearFilter] = useState('');
    const [sortBy, setSortBy] = useState<'relevance' | 'date-asc' | 'date-desc'>('relevance');

    // Debounced search effect
    useEffect(() => {
        if (!query.trim()) {
            onSearch('', { yearFilter, sortBy });
            return;
        }

        const timer = setTimeout(() => {
            onSearch(query, { yearFilter, sortBy });
        }, 300);

        return () => clearTimeout(timer);
    }, [query, yearFilter, sortBy, onSearch]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Immediate search on submit (bypasses debounce)
        onSearch(query, { yearFilter, sortBy });
    };

    const clearFilters = () => {
        setYearFilter('');
        setSortBy('relevance');
    };

    const hasActiveFilters = yearFilter !== '' || sortBy !== 'relevance';

    return (
        <div className="w-full max-w-4xl mx-auto mb-8">
            {/* Main Search Bar */}
            <form onSubmit={handleSubmit} className="relative z-20">
                <div className="relative group">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search the archive..."
                        className={`w-full ${theme.input} pl-12 pr-32 py-4 text-lg border-2 rounded-lg shadow-sm transition-all focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 outline-none`}
                    />
                    {isSearching ? (
                        <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`}>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                    )}

                    {/* Right Side Actions */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className={`p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full ${theme.textVeryMuted} transition-colors`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                        <div className={`h-6 w-px ${theme.border} mx-1`} />
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider font-bold transition-all ${showFilters || hasActiveFilters
                                ? 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800 border'
                                : `hover:bg-zinc-100 dark:hover:bg-zinc-800 ${theme.textMuted}`
                                }`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>Filters</span>
                            {hasActiveFilters && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-1" />
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {/* Collapsible Filter Panel */}
            <div className={`
                overflow-hidden transition-all duration-300 ease-in-out
                ${showFilters ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}
            `}>
                <div className={`${theme.card} border ${theme.border} rounded-lg p-6 shadow-lg`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Year Filter */}
                        <div className="space-y-3">
                            <label className={`text-xs font-mono uppercase tracking-widest font-bold ${theme.textMuted}`}>
                                Filter by Year
                            </label>
                            <div className="relative">
                                <select
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                    className={`w-full appearance-none ${theme.input} px-4 py-2.5 rounded-md border text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none cursor-pointer`}
                                >
                                    <option value="">All Years</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme.textMuted}`} />
                            </div>
                        </div>

                        {/* Sort Order */}
                        <div className="space-y-3">
                            <label className={`text-xs font-mono uppercase tracking-widest font-bold ${theme.textMuted}`}>
                                Sort Results
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'relevance', label: 'Best Match' },
                                    { id: 'date-desc', label: 'Newest First' },
                                    // { id: 'date-asc', label: 'Oldest First' } // Optional
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setSortBy(option.id as any)}
                                        className={`
                                            px-3 py-2.5 rounded-md text-sm font-medium transition-all text-center border
                                            ${sortBy === option.id
                                                ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-100'
                                                : `${theme.bg} ${theme.border} ${theme.textVeryMuted} hover:border-amber-300 dark:hover:border-zinc-700`
                                            }
                                        `}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Filters Summary */}
                    {hasActiveFilters && (
                        <div className={`mt-6 pt-4 border-t ${theme.border} flex items-center justify-between`}>
                            <div className="flex gap-2">
                                {yearFilter && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                        Year: {yearFilter}
                                    </span>
                                )}
                                {sortBy !== 'relevance' && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                        Sorted by Date
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={clearFilters}
                                className={`text-xs hover:underline ${theme.textMuted} hover:text-amber-500 transition-colors`}
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Count / Status */}
            {!isSearching && resultCount !== undefined && (
                <div className={`mt-4 flex items-center justify-between px-1`}>
                    <p className={`text-xs font-mono uppercase tracking-widest ${theme.textVeryMuted}`}>
                        {query ? (
                            <>Found <span className="font-bold text-amber-600 dark:text-amber-400">{resultCount}</span> matches</>
                        ) : (
                            <>&quot;Use quotes for exact phrases&quot;</>
                        )}
                    </p>
                </div>
            )}
        </div>
    );
}
