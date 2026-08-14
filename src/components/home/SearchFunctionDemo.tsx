'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
    ArrowRight,
    Filter,
    History,
    Keyboard,
    Loader2,
    Search,
    X,
} from 'lucide-react';
import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';

import { searchTranscripts } from '@/app/search/actions';
import { formatMedia } from '@/lib/formatUtils';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import { getMediaHref } from '@/lib/utils';
import { GlassSheen, widgetCardClass } from './WidgetAccents';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const DEBOUNCE_MS = 280;
const MAX_RESULTS_PREVIEW = 4;
const PROXIMITY_WINDOW = 18;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SEARCH_HISTORY_LIMIT = 20;
const SUGGESTION_LIMIT = 6;
const MIN_QUERY_LENGTH = 2;

const QUICK_PROMPTS = [
    { label: '"God alone"', query: '"God alone"', icon: Search },
    { label: 'messenger covenant', query: 'messenger covenant', icon: Search },
    { label: 'mathematical miracle', query: 'mathematical miracle', icon: Search },
    { label: 'Sura 72:18', query: 'Sura 72:18', icon: Search },
    { label: 'Rashad Khalifa', query: 'Rashad Khalifa', icon: Search },
] as const;

const MEDIA_TYPE_OPTIONS = [
    { value: 'all', label: 'All Types' },
    { value: 'audio', label: 'Audio' },
    { value: 'video', label: 'Video' },
    { value: 'book', label: 'Book' },
    { value: 'quran', label: 'Qur\'an' },
] as const;

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'matches-desc', label: 'Most Matches' },
] as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface RawMedia {
    id?: string;
    type?: string;
    title?: string;
    displayTitle?: string;
    thumbnailOverride?: string;
    date?: string;
    created_at?: string;
}

interface RawMatch {
    snippet?: string;
    startOffset?: number;
    endOffset?: number;
}

interface RawSearchResult {
    media: RawMedia;
    matches?: RawMatch[];
    matchCount?: number;
    relevanceScore?: number;
}

interface SearchResult {
    media: {
        id: string;
        type: string;
        displayTitle: string;
        thumbnailOverride?: string;
    };
    matches: RawMatch[];
    matchCount: number;
    relevanceScore: number;
}

interface SearchFilters {
    mediaType: string;
    sortBy: string;
    dateRange: 'all' | 'week' | 'month' | 'year';
}

interface SearchCacheEntry {
    results: SearchResult[];
    timestamp: number;
    filters: SearchFilters;
}

interface SearchHistoryItem {
    query: string;
    timestamp: number;
    resultCount: number;
}

type SearchStatus = 'idle' | 'typing' | 'debouncing' | 'loading' | 'success' | 'error' | 'empty';

interface SearchState {
    status: SearchStatus;
    query: string;
    results: SearchResult[];
    error: SearchError | null;
    filters: SearchFilters;
    totalMatches: number;
}

type SearchErrorType = 'network' | 'server' | 'timeout' | 'rate-limit' | 'unknown';

interface SearchError {
    type: SearchErrorType;
    message: string;
    retryable: boolean;
}

type SearchAction =
    | { type: 'SET_QUERY'; payload: string }
    | { type: 'START_SEARCH' }
    | { type: 'SEARCH_SUCCESS'; payload: { results: SearchResult[]; totalMatches: number } }
    | { type: 'SEARCH_ERROR'; payload: SearchError }
    | { type: 'SET_FILTERS'; payload: Partial<SearchFilters> }
    | { type: 'CLEAR_RESULTS' }
    | { type: 'RETRY' };

// ═══════════════════════════════════════════════════════════════════════════════
// STATE MACHINE REDUCER
// ═══════════════════════════════════════════════════════════════════════════════

function searchReducer(state: SearchState, action: SearchAction): SearchState {
    switch (action.type) {
        case 'SET_QUERY':
            return {
                ...state,
                query: action.payload,
                status: action.payload.trim().length >= MIN_QUERY_LENGTH ? 'typing' : 'idle',
                error: null,
            };
        case 'START_SEARCH':
            return { ...state, status: 'loading', error: null };
        case 'SEARCH_SUCCESS':
            return {
                ...state,
                status: action.payload.results.length === 0 ? 'empty' : 'success',
                results: action.payload.results,
                totalMatches: action.payload.totalMatches,
                error: null,
            };
        case 'SEARCH_ERROR':
            return { ...state, status: 'error', error: action.payload };
        case 'SET_FILTERS':
            return {
                ...state,
                filters: { ...state.filters, ...action.payload },
                status: state.query.trim() ? 'typing' : 'idle',
            };
        case 'CLEAR_RESULTS':
            return { ...state, results: [], totalMatches: 0, status: 'idle', error: null };
        case 'RETRY':
            return { ...state, status: 'loading', error: null };
        default:
            return state;
    }
}

const initialSearchState: SearchState = {
    status: 'idle',
    query: '"God alone"',
    results: [],
    error: null,
    filters: {
        mediaType: 'all',
        sortBy: 'relevance',
        dateRange: 'all',
    },
    totalMatches: 0,
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sanitizeHtml(text: string): string {
    if (typeof document === 'undefined') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function highlightMatches(snippet: string, query: string): string {
    if (!snippet || !query) return sanitizeHtml(snippet);

    const quotedPhrases: string[] = [];
    const unquotedQuery = query.replace(/"([^"]+)"/g, (_, phrase) => {
        quotedPhrases.push(escapeRegExp(phrase));
        return '';
    });

    const words = unquotedQuery
        .split(/\s+/)
        .filter((w) => w.length > 2)
        .map(escapeRegExp);

    const allTerms = [...quotedPhrases, ...words];
    if (allTerms.length === 0) return sanitizeHtml(snippet);

    const pattern = new RegExp(`(${allTerms.join('|')})`, 'gi');
    return sanitizeHtml(snippet).replace(
        pattern,
        '<mark class="bg-ed-accent/20 text-ed-accent font-semibold px-0.5 rounded-none">$1</mark>'
    );
}

function categorizeError(err: unknown): SearchError {
    if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message.includes('timeout')) {
            return { type: 'timeout', message: 'Search timed out. Please try again.', retryable: true };
        }
        if (err.message.includes('network') || err.message.includes('fetch')) {
            return { type: 'network', message: 'Network error. Check your connection.', retryable: true };
        }
        if (err.message.includes('429') || err.message.includes('rate')) {
            return { type: 'rate-limit', message: 'Too many searches. Please wait a moment.', retryable: true };
        }
        if (err.message.includes('500') || err.message.includes('server')) {
            return { type: 'server', message: 'Server error. Our team has been notified.', retryable: true };
        }
        return { type: 'unknown', message: err.message, retryable: false };
    }
    return { type: 'unknown', message: 'An unexpected error occurred.', retryable: false };
}

function getThumbnailSrc(media: SearchResult['media']): string {
    if (media.type === 'quran') return getPublicAssetUrl('/images/placeholders/quran.jpg');
    if (media.thumbnailOverride) return getPublicAssetUrl(media.thumbnailOverride);
    if (media.type === 'audio' || media.type === 'messenger-audio') {
        return getPublicAssetUrl('/content/audios/messenger-audios/default.jpg');
    }
    return getPublicAssetUrl('/images/placeholders/rashad-khalifa.png');
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

function useSearchHistory() {
    const [history, setHistory] = useState<SearchHistoryItem[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const raw = localStorage.getItem('search-history');
            if (raw) {
                const parsed = JSON.parse(raw) as SearchHistoryItem[];
                const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
                return parsed.filter((h) => h.timestamp > thirtyDaysAgo).slice(0, SEARCH_HISTORY_LIMIT);
            }
        } catch {
            // localStorage unavailable or corrupted
        }
        return [];
    });
    const [isHydrated, setIsHydrated] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setIsHydrated(true), 0);
        return () => clearTimeout(timer);
    }, []);

    const addToHistory = useCallback((query: string, resultCount: number) => {
        if (!query.trim() || query.trim().length < MIN_QUERY_LENGTH) return;

        setHistory((prev) => {
            const filtered = prev.filter((h) => h.query.toLowerCase() !== query.toLowerCase());
            const updated = [
                { query: query.trim(), timestamp: Date.now(), resultCount },
                ...filtered,
            ].slice(0, SEARCH_HISTORY_LIMIT);

            try {
                localStorage.setItem('search-history', JSON.stringify(updated));
            } catch {
                // localStorage full or unavailable
            }
            return updated;
        });
    }, []);

    const removeFromHistory = useCallback((query: string) => {
        setHistory((prev) => {
            const updated = prev.filter((h) => h.query !== query);
            try {
                localStorage.setItem('search-history', JSON.stringify(updated));
            } catch {
                // localStorage unavailable
            }
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        try {
            localStorage.removeItem('search-history');
        } catch {
            // localStorage unavailable
        }
    }, []);

    return { history, isHydrated, addToHistory, removeFromHistory, clearHistory };
}

function useUrlSync(query: string, filters: SearchFilters) {
    const hasSynced = useRef(false);

    useEffect(() => {
        if (hasSynced.current) return;
        hasSynced.current = true;
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (filters.mediaType !== 'all') params.set('type', filters.mediaType);
        if (filters.sortBy !== 'relevance') params.set('sort', filters.sortBy);
        if (filters.dateRange !== 'all') params.set('date', filters.dateRange);

        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState(null, '', newUrl);
    }, [query, filters]);
}

function useKeyboardNavigation(
    inputRef: React.RefObject<HTMLInputElement | null>,
    resultsContainerRef: React.RefObject<HTMLDivElement | null>,
    resultCount: number,
    onSelectResult: (index: number) => void,
    onFocusInput: () => void
) {
    const [focusedIndex, setFocusedIndex] = useState(-1);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                onFocusInput();
                return;
            }

            if (e.key === 'Escape') {
                setFocusedIndex(-1);
                inputRef.current?.focus();
                return;
            }

            if (resultCount === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex((prev) => (prev < resultCount - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex((prev) => {
                    if (prev <= 0) {
                        onFocusInput();
                        return -1;
                    }
                    return prev - 1;
                });
            } else if (e.key === 'Enter' && focusedIndex >= 0) {
                e.preventDefault();
                onSelectResult(focusedIndex);
            }
        };

        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [resultCount, focusedIndex, onFocusInput, onSelectResult, inputRef]);

    useEffect(() => {
        if (focusedIndex < 0 || !resultsContainerRef.current) return;
        const results = resultsContainerRef.current.querySelectorAll('[data-result-index]');
        const target = results[focusedIndex] as HTMLElement | undefined;
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            target.focus({ preventScroll: true });
        }
    }, [focusedIndex, resultsContainerRef]);

    return { focusedIndex, setFocusedIndex };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH CACHE
// ═══════════════════════════════════════════════════════════════════════════════

const searchCache = new Map<string, SearchCacheEntry>();
const inFlightRequests = new Map<string, AbortController>();

function getCacheKey(query: string, filters: SearchFilters): string {
    return `${query.trim().toLowerCase()}|${filters.mediaType}|${filters.sortBy}|${filters.dateRange}`;
}

function getCachedResults(query: string, filters: SearchFilters): SearchResult[] | null {
    const key = getCacheKey(query, filters);
    const entry = searchCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        searchCache.delete(key);
        return null;
    }
    return entry.results;
}

function setCachedResults(query: string, filters: SearchFilters, results: SearchResult[]): void {
    const key = getCacheKey(query, filters);
    searchCache.set(key, { results, timestamp: Date.now(), filters });

    if (searchCache.size > 50) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
    }
}

function abortInFlightRequest(query: string, filters: SearchFilters): void {
    const key = getCacheKey(query, filters);
    const controller = inFlightRequests.get(key);
    if (controller) {
        controller.abort();
        inFlightRequests.delete(key);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const SkeletonCard = memo(function SkeletonCard() {
    return (
        <div className="border border-ed-rule bg-ed-bg p-4 animate-pulse" aria-hidden="true">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <div className="hidden aspect-video w-24 shrink-0 bg-ed-surface sm:block" />
                <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex gap-2">
                        <div className="h-3 w-8 bg-ed-surface" />
                        <div className="h-3 w-16 bg-ed-surface" />
                        <div className="h-3 w-12 bg-ed-surface" />
                    </div>
                    <div className="h-5 w-3/4 bg-ed-surface" />
                    <div className="h-3 w-full bg-ed-surface" />
                    <div className="h-3 w-2/3 bg-ed-surface" />
                </div>
            </div>
        </div>
    );
});

const SearchResultCard = memo(function SearchResultCard({
    result,
    index,
    query,
    isFocused,
    onMouseEnter,
}: {
    result: SearchResult;
    index: number;
    query: string;
    isFocused: boolean;
    onMouseEnter: () => void;
}) {
    const topMatch = result.matches[0];
    const thumbnailSrc = getThumbnailSrc(result.media);
    const itemLink = getMediaHref(result.media.id);

    const highlightedSnippet = useMemo(
        () => highlightMatches(topMatch?.snippet || '', query),
        [topMatch?.snippet, query]
    );

    return (
        <article
            data-result-index={index}
            tabIndex={-1}
            onMouseEnter={onMouseEnter}
            className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 outline-none ${
                isFocused
                    ? 'border-ed-fg bg-ed-surface/90 shadow-md ring-1 ring-ed-fg'
                    : 'border-ed-rule bg-ed-surface/40 hover:border-ed-rule-strong hover:bg-ed-surface/70'
            }`}
        >
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
                <span className="relative hidden aspect-video w-28 shrink-0 overflow-hidden rounded-xl border border-ed-rule bg-ed-surface sm:block shadow-inner">
                    <Image
                        src={thumbnailSrc}
                        alt={`Thumbnail for ${result.media.displayTitle}`}
                        fill
                        quality={50}
                        sizes="112px"
                        loading={index < 2 ? 'eager' : 'lazy'}
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[0.64rem] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
                        <span className="text-ed-fg">[{String(index + 1).padStart(2, '0')}]</span>
                        <span className="rounded-md border border-ed-rule bg-ed-surface px-2 py-0.5 uppercase text-ed-fg">
                            {result.media.type}
                        </span>
                        <span className="rounded-md border border-ed-rule bg-ed-surface px-2 py-0.5 text-ed-fg-muted">
                            {result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'}
                        </span>
                    </div>
                    <h4 className="mt-2 font-sans text-base font-bold leading-snug text-ed-fg transition-colors group-hover:text-ed-accent sm:text-lg">
                        <Link href={itemLink} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">
                            {result.media.displayTitle}
                        </Link>
                    </h4>

                    {topMatch?.snippet ? (
                        <p
                            className="mt-2 text-xs leading-relaxed text-ed-fg-muted line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: highlightedSnippet }}
                        />
                    ) : null}
                </div>
            </div>
        </article>
    );
});

const ErrorBanner = memo(function ErrorBanner({
    error,
    onRetry,
}: {
    error: SearchError;
    onRetry: () => void;
}) {
    const iconMap: Record<SearchErrorType, string> = {
        network: '⚠️',
        server: '🔧',
        timeout: '⏱️',
        'rate-limit': '🚦',
        unknown: '❌',
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 backdrop-blur-md"
        >
            <div className="flex items-start gap-3.5">
                <span className="text-xl" aria-hidden="true">{iconMap[error.type]}</span>
                <div className="flex-1">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                        {error.type === 'network'
                            ? 'Connection Issue'
                            : error.type === 'server'
                            ? 'Server Error'
                            : error.type === 'timeout'
                            ? 'Request Timed Out'
                            : error.type === 'rate-limit'
                            ? 'Rate Limited'
                            : 'Search Error'}
                    </p>
                    <p className="mt-1 text-xs text-red-600/80 dark:text-red-300/80">
                        {error.message}
                    </p>
                    {error.retryable && (
                        <button
                            type="button"
                            onClick={onRetry}
                            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-300 transition-colors hover:bg-red-500/20"
                        >
                            Try Again
                            <ArrowRight size={12} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

const EmptyState = memo(function EmptyState({ query }: { query: string }) {
    return (
        <div className="rounded-2xl border border-ed-rule bg-ed-surface/50 p-10 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-ed-rule bg-ed-surface shadow-sm">
                <Search size={22} className="text-ed-fg-muted" strokeWidth={1.5} />
            </div>
            <p className="font-serif text-xl font-bold text-ed-fg">No matches found.</p>
            <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-ed-fg-muted">
                We couldn&apos;t find anything for &quot;<span className="font-semibold text-ed-fg">{query}</span>&quot;.
                Try a different phrase or select one of the suggested query pills below.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
                {QUICK_PROMPTS.slice(0, 3).map((prompt) => (
                    <span
                        key={prompt.label}
                        className="inline-flex items-center rounded-full border border-ed-rule bg-ed-surface/70 px-3 py-1 font-mono text-[0.68rem] text-ed-fg-muted"
                    >
                        {prompt.label}
                    </span>
                ))}
            </div>
        </div>
    );
});

const SearchSuggestions = memo(function SearchSuggestions({
    query,
    history,
    isOpen,
    onSelect,
    onRemoveHistory,
    activeIndex,
}: {
    query: string;
    history: SearchHistoryItem[];
    isOpen: boolean;
    onSelect: (value: string) => void;
    onRemoveHistory: (value: string) => void;
    activeIndex: number;
}) {
    if (!isOpen) return null;

    const filteredHistory = query.length >= MIN_QUERY_LENGTH
        ? history.filter((h) => h.query.toLowerCase().includes(query.toLowerCase()))
        : history.slice(0, SUGGESTION_LIMIT);

    const showHistory = filteredHistory.length > 0;
    const showPrompts = query.length === 0 || query.length < MIN_QUERY_LENGTH;

    if (!showHistory && !showPrompts) return null;

    return (
        <div
            id="search-suggestions"
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/98 p-2 shadow-2xl backdrop-blur-2xl"
            role="listbox"
            aria-label="Search suggestions"
        >
            {showPrompts && (
                <div className="p-1">
                    <p className="px-3 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] text-ed-fg-muted">
                        Suggested Searches
                    </p>
                    {QUICK_PROMPTS.map((prompt, i) => (
                        <button
                            key={prompt.label}
                            type="button"
                            role="option"
                            aria-selected={activeIndex === i}
                            onClick={() => onSelect(prompt.query)}
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                activeIndex === i ? 'bg-ed-fg text-ed-bg font-semibold' : 'text-ed-fg hover:bg-ed-surface-strong'
                            }`}
                        >
                            <Search size={14} className="shrink-0 text-ed-fg-muted" />
                            <span>{prompt.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {showHistory && (
                <div className="border-t border-ed-rule/60 p-1">
                    <p className="px-3 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] text-ed-fg-muted">
                        Recent History
                    </p>
                    {filteredHistory.map((item, i) => (
                        <div
                            key={item.query}
                            className={`flex items-center justify-between rounded-xl px-3 py-1.5 transition-colors ${
                                activeIndex === (showPrompts ? QUICK_PROMPTS.length + i : i)
                                    ? 'bg-ed-fg text-ed-bg'
                                    : 'hover:bg-ed-surface-strong'
                            }`}
                        >
                            <button
                                type="button"
                                role="option"
                                aria-selected={activeIndex === (showPrompts ? QUICK_PROMPTS.length + i : i)}
                                onClick={() => onSelect(item.query)}
                                className="flex flex-1 items-center gap-2 text-left text-sm text-ed-fg"
                            >
                                <History size={13} className="shrink-0 text-ed-fg-muted" />
                                <span>{item.query}</span>
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveHistory(item.query);
                                }}
                                className="grid h-6 w-6 place-items-center rounded-md text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg"
                                aria-label={`Remove ${item.query} from history`}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

const SearchFiltersPanel = memo(function SearchFiltersPanel({
    filters,
    onChange,
    isOpen,
}: {
    filters: SearchFilters;
    onChange: (filters: Partial<SearchFilters>) => void;
    isOpen: boolean;
}) {
    if (!isOpen) return null;

    return (
        <div className="mt-3 rounded-2xl border border-ed-rule bg-ed-surface/80 p-4 backdrop-blur-md shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
                <div>
                    <label className="mb-1.5 block font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] text-ed-fg-muted">
                        Media Type
                    </label>
                    <select
                        value={filters.mediaType}
                        onChange={(e) => onChange({ mediaType: e.target.value })}
                        className="w-full rounded-xl border border-ed-rule bg-ed-surface px-3 py-2 text-xs font-medium text-ed-fg outline-none focus:border-ed-fg"
                    >
                        {MEDIA_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                        Sort By
                    </label>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => onChange({ sortBy: e.target.value })}
                        className="w-full border border-ed-rule bg-ed-surface px-3 py-2 text-xs text-ed-fg outline-none focus:border-ed-accent"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1.5 block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                        Date Range
                    </label>
                    <select
                        value={filters.dateRange}
                        onChange={(e) => onChange({ dateRange: e.target.value as SearchFilters['dateRange'] })}
                        className="w-full border border-ed-rule bg-ed-surface px-3 py-2 text-xs text-ed-fg outline-none focus:border-ed-accent"
                    >
                        <option value="all">All Time</option>
                        <option value="week">Past Week</option>
                        <option value="month">Past Month</option>
                        <option value="year">Past Year</option>
                    </select>
                </div>
            </div>
        </div>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function SearchFunctionDemo() {
    const [state, dispatch] = useReducer(searchReducer, initialSearchState);
    const { history, isHydrated, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

    const inputRef = useRef<HTMLInputElement>(null);
    const resultsContainerRef = useRef<HTMLDivElement>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const liveRegionRef = useRef<HTMLDivElement>(null);

    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [activeSuggestionIndex] = useState(-1);

    // URL sync
    useUrlSync(state.query, state.filters);

    // Keyboard navigation
    const { focusedIndex, setFocusedIndex } = useKeyboardNavigation(
        inputRef,
        resultsContainerRef,
        state.results.length,
        (index) => {
            const result = state.results[index];
            if (result) {
                window.location.href = getMediaHref(result.media.id);
            }
        },
        () => {
            inputRef.current?.focus();
            setShowSuggestions(true);
        }
    );

    // Clear history listener
    useEffect(() => {
        const handler = () => clearHistory();
        document.addEventListener('clear-search-history', handler);
        return () => document.removeEventListener('clear-search-history', handler);
    }, [clearHistory]);

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH EXECUTION
    // ═══════════════════════════════════════════════════════════════════════════

    const performSearch = useCallback(
        async (searchQuery: string, filters: SearchFilters) => {
            const trimmed = searchQuery.trim();
            if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
                dispatch({ type: 'CLEAR_RESULTS' });
                return;
            }

            // Check cache first
            const cached = getCachedResults(trimmed, filters);
            if (cached) {
                const total = cached.reduce((sum, r) => sum + r.matchCount, 0);
                dispatch({
                    type: 'SEARCH_SUCCESS',
                    payload: { results: cached, totalMatches: total },
                });
                return;
            }

            dispatch({ type: 'START_SEARCH' });

            // Abort any in-flight request for this exact query+filters
            abortInFlightRequest(trimmed, filters);

            const controller = new AbortController();
            const cacheKey = getCacheKey(trimmed, filters);
            inFlightRequests.set(cacheKey, controller);

            try {
                const timeoutId = setTimeout(() => controller.abort(), 15000);

                const response = await searchTranscripts(
                    trimmed,
                    [],
                    { proximityWindow: PROXIMITY_WINDOW }
                );

                clearTimeout(timeoutId);

                if (!response.success) {
                    throw new Error(response.error || 'Search failed');
                }

                const rawResults = (response.data || []) as RawSearchResult[];

                // Format and deduplicate
                const seenIds = new Set<string>();
                const formattedResults: SearchResult[] = rawResults
                    .map((item): SearchResult | null => {
                        const id = String(item.media?.id || '');
                        if (!id || seenIds.has(id)) return null;
                        seenIds.add(id);

                        const mediaObj = {
                            id,
                            type: String(item.media?.type || ''),
                            title: String(
                                item.media?.title || item.media?.displayTitle || item.media?.id || ''
                            ),
                            date: item.media?.date || item.media?.created_at,
                        };
                        const formattedMedia = formatMedia(mediaObj);

                        return {
                            media: {
                                id: mediaObj.id,
                                type: mediaObj.type,
                                displayTitle: formattedMedia.displayTitle || mediaObj.title,
                                thumbnailOverride: item.media?.thumbnailOverride
                                    ? String(item.media.thumbnailOverride)
                                    : undefined,
                            },
                            matches: item.matches || [],
                            matchCount: item.matchCount || item.matches?.length || 0,
                            relevanceScore: item.relevanceScore || 0,
                        };
                    })
                    .filter((r): r is SearchResult => r !== null)
                    .slice(0, MAX_RESULTS_PREVIEW);

                // Apply client-side sorting if needed
                const sortedResults = sortResults(formattedResults, filters.sortBy);

                const totalMatches = sortedResults.reduce((sum, r) => sum + r.matchCount, 0);

                // Cache results
                setCachedResults(trimmed, filters, sortedResults);

                dispatch({
                    type: 'SEARCH_SUCCESS',
                    payload: { results: sortedResults, totalMatches },
                });

                // Add to history
                addToHistory(trimmed, sortedResults.length);

                // Announce to screen readers
                if (liveRegionRef.current) {
                    liveRegionRef.current.textContent =
                        sortedResults.length === 0
                            ? `No results found for ${trimmed}`
                            : `Found ${sortedResults.length} documents with ${totalMatches} matching passages`;
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                const searchError = categorizeError(err);
                dispatch({ type: 'SEARCH_ERROR', payload: searchError });

                if (liveRegionRef.current) {
                    liveRegionRef.current.textContent = `Search error: ${searchError.message}`;
                }
            } finally {
                inFlightRequests.delete(cacheKey);
            }
        },
        [addToHistory]
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // DEBOUNCED SEARCH EFFECT
    // ═══════════════════════════════════════════════════════════════════════════

    useEffect(() => {
        const trimmed = state.query.trim();

        if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
            dispatch({ type: 'CLEAR_RESULTS' });
            return;
        }

        dispatch({ type: 'SET_QUERY', payload: state.query });

        debounceTimerRef.current = setTimeout(() => {
            void performSearch(state.query, state.filters);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [state.query, state.filters, performSearch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            inFlightRequests.forEach((controller) => controller.abort());
            inFlightRequests.clear();
        };
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENT HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════

    const handleQueryChange = useCallback((value: string) => {
        dispatch({ type: 'SET_QUERY', payload: value });
        setShowSuggestions(true);
        setFocusedIndex(-1);
    }, [setFocusedIndex]);

    const handleSuggestionSelect = useCallback(
        (value: string) => {
            dispatch({ type: 'SET_QUERY', payload: value });
            setShowSuggestions(false);
            inputRef.current?.focus();
        },
        []
    );

    const handleFilterChange = useCallback((newFilters: Partial<SearchFilters>) => {
        dispatch({ type: 'SET_FILTERS', payload: newFilters });
    }, []);

    const handleRetry = useCallback(() => {
        dispatch({ type: 'RETRY' });
        void performSearch(state.query, state.filters);
    }, [state.query, state.filters, performSearch]);

    const handleClear = useCallback(() => {
        dispatch({ type: 'SET_QUERY', payload: '' });
        setShowSuggestions(false);
        inputRef.current?.focus();
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    const statusText = useMemo(() => {
        switch (state.status) {
            case 'loading':
                return 'Querying index across all collections...';
            case 'success':
                return `${state.results.length} documents · ${state.totalMatches} matching passages`;
            case 'empty':
                return 'No matches found';
            case 'error':
                return state.error?.message || 'Search error';
            default:
                return 'Type any phrase or select a quick query below';
        }
    }, [state.status, state.results.length, state.totalMatches, state.error]);

    const isLoading = state.status === 'loading';
    const showSkeleton = isLoading && state.results.length === 0;
    const showEmpty = state.status === 'empty';
    const showError = state.status === 'error' && state.error;
    const showResults = state.results.length > 0;

    return (
        <section
            className={widgetCardClass}
            aria-label="Live interactive search terminal"
        >
            <GlassSheen />

            {/* Screen reader live region */}
            <div
                ref={liveRegionRef}
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            />

            {/* Header / Title bar with Traffic Lights */}
            <div className="flex min-h-12 flex-wrap items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-6 bg-ed-surface-strong/40 select-none">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                        <span className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
                        <span className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
                        <span className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                    </div>
                    <span className="h-3.5 w-px bg-ed-rule-strong/60" aria-hidden="true" />
                    <div>
                        <p className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                            Universal Search · <span className="text-ed-fg font-bold">Interactive Terminal</span>
                        </p>
                        <p
                            className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-wider text-ed-fg-muted/80"
                            aria-live="polite"
                        >
                            {statusText}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Keyboard shortcut hint */}
                    <kbd className="hidden items-center gap-1 rounded-lg border border-ed-rule-strong bg-ed-surface-strong px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-ed-fg sm:inline-flex shadow-sm">
                        <Keyboard size={11} />
                        <span>Ctrl K</span>
                    </kbd>
                    <Link
                        href={`/search${state.query ? `?q=${encodeURIComponent(state.query)}` : ''}`}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-ed-rule-strong bg-ed-surface-strong px-3.5 font-mono text-[0.68rem] font-bold text-ed-fg shadow-sm transition-all hover:bg-ed-fg hover:text-ed-bg active:scale-95"
                    >
                        <span>Full search</span>
                        <ArrowRight size={12} />
                    </Link>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {/* Search Bar */}
                <div className="relative">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            setShowSuggestions(false);
                            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                            void performSearch(state.query, state.filters);
                        }}
                        className="relative"
                    >
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ed-fg-muted" />
                        <input
                            ref={inputRef}
                            type="text"
                            role="combobox"
                            value={state.query}
                            onChange={(e) => handleQueryChange(e.target.value)}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="Type to search all transcripts, books, and Qur'an..."
                            enterKeyHint="search"
                            inputMode="search"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck="false"
                            aria-label="Search transcripts, books, and Qur'an"
                            aria-autocomplete="list"
                            aria-controls="search-suggestions"
                            aria-expanded={showSuggestions}
                            className="archive-input w-full rounded-2xl py-3.5 pl-12 pr-32 font-sans text-base sm:text-lg shadow-inner bg-ed-bg/80"
                        />
                        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                            {/* Filter toggle */}
                            <button
                                type="button"
                                onClick={() => setShowFilters((p) => !p)}
                                className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
                                    showFilters
                                        ? 'border-ed-fg bg-ed-fg text-ed-bg'
                                        : 'border-ed-rule text-ed-fg-muted hover:border-ed-fg hover:text-ed-fg'
                                }`}
                                aria-label="Toggle filters"
                                aria-pressed={showFilters}
                            >
                                <Filter size={15} />
                            </button>

                            {state.query ? (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="grid h-9 w-9 place-items-center rounded-xl text-ed-fg-muted transition-colors hover:bg-ed-surface hover:text-ed-fg"
                                    aria-label="Clear search input"
                                >
                                    <X size={16} />
                                </button>
                            ) : null}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="archive-button archive-button-primary min-h-9 px-4 text-xs font-bold"
                            >
                                {isLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    'Search'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Suggestions Dropdown */}
                    <SearchSuggestions
                        query={state.query}
                        history={history}
                        isOpen={showSuggestions && isHydrated}
                        onSelect={handleSuggestionSelect}
                        onRemoveHistory={removeFromHistory}
                        activeIndex={activeSuggestionIndex}
                    />
                </div>

                {/* Filters Panel */}
                <SearchFiltersPanel
                    filters={state.filters}
                    onChange={handleFilterChange}
                    isOpen={showFilters}
                />

                {/* Quick Prompts */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[0.66rem] font-bold uppercase tracking-[0.14em] text-ed-fg-muted">
                        Try query:
                    </span>
                    {QUICK_PROMPTS.map((prompt) => (
                        <button
                            key={prompt.label}
                            type="button"
                            onClick={() => handleSuggestionSelect(prompt.query)}
                            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3.5 font-mono text-[0.7rem] font-semibold transition-all duration-150 active:scale-95 ${
                                state.query === prompt.query
                                    ? 'border-ed-fg bg-ed-fg text-ed-bg shadow-sm'
                                    : 'border-ed-rule bg-ed-surface/70 text-ed-fg-muted hover:border-ed-fg hover:text-ed-fg'
                            }`}
                        >
                            <prompt.icon size={12} />
                            {prompt.label}
                        </button>
                    ))}
                </div>

                {/* Error Banner */}
                {showError && state.error && (
                    <ErrorBanner error={state.error} onRetry={handleRetry} />
                )}

                {/* Live Results Panel */}
                <div ref={resultsContainerRef} className="mt-6 space-y-3" role="region" aria-label="Search results">
                    {/* Skeleton Loading */}
                    {showSkeleton && (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    )}

                    {/* Empty State */}
                    {showEmpty && <EmptyState query={state.query} />}

                    {/* Results */}
                    {showResults && (
                        <ul className="space-y-3" role="list">
                            {state.results.map((result, index) => (
                                <li key={result.media.id} role="listitem">
                                    <SearchResultCard
                                        result={result}
                                        index={index}
                                        query={state.query}
                                        isFocused={focusedIndex === index}
                                        onMouseEnter={() => setFocusedIndex(index)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLIENT-SIDE SORTING
// ═══════════════════════════════════════════════════════════════════════════════

function sortResults(results: SearchResult[], sortBy: string): SearchResult[] {
    const sorted = [...results];
    switch (sortBy) {
        case 'date-desc':
            return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
        case 'date-asc':
            return sorted.sort((a, b) => a.relevanceScore - b.relevanceScore);
        case 'matches-desc':
            return sorted.sort((a, b) => b.matchCount - a.matchCount);
        case 'relevance':
        default:
            return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
}
