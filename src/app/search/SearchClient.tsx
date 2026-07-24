'use client';

import Image from 'next/image';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    BookMarked,
    ChevronDown,
    FileText,
    Headphones,
    Play,
    Search,
    SlidersHorizontal,
    Video,
    X,
} from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { getMediaHref } from '@/lib/utils';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import { searchTranscripts } from './actions';
import { useSearchKeyboardNav } from './useSearchKeyboardNav';
import quranStudyThumbnails from '@/data/quran_study_thumbnails.json';

type FilterKey =
    | 'video'
    | 'quran-study'
    | 'messenger-audio'
    | 'perspective'
    | 'appendix'
    | 'quran'
    | 'other';

type SearchMatch = {
    id: string;
    content: string;
    start_time: number;
    page?: number;
    score?: number;
    kind?: string;
    distance?: number;
    label?: string;
};

type SearchResultMedia = {
    id: string;
    title: string;
    type: string;
    displayTitle?: string;
    displayDate?: string;
    author?: string;
    filename?: string;
    page?: number;
    pdfLink?: string;
    thumbnailOverride?: string;
    primaryNumber?: number;
    alternateNumbers?: string[];
    alternateNumberLabel?: string;
};

type SearchResult = {
    media: SearchResultMedia;
    matches: SearchMatch[];
    bestScore?: number;
    matchCount?: number;
};

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const initialFilters = searchParams.get('filters')?.split(',') || [];

    const [query, setQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [visibleCount, setVisibleCount] = useState(10);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
    const attemptedInitialQueryRef = useRef<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
        video: initialFilters.length === 0
            || initialFilters.includes('video')
            || initialFilters.includes('sermon')
            || initialFilters.includes('video-program'),
        'quran-study': initialFilters.length === 0 || initialFilters.includes('quran-study'),
        'messenger-audio': initialFilters.length === 0
            || initialFilters.includes('messenger-audio')
            || initialFilters.includes('audio'),
        perspective: initialFilters.length === 0 || initialFilters.includes('perspective'),
        appendix: initialFilters.length === 0 || initialFilters.includes('appendix'),
        quran: initialFilters.length === 0 || initialFilters.includes('quran'),
        other: initialFilters.length === 0 || initialFilters.includes('other'),
    });

    const rankedResults = useMemo(() => {
        return [...results].sort((a, b) => {
            const bScore = b.bestScore ?? mediaBestScore(b.matches);
            const aScore = a.bestScore ?? mediaBestScore(a.matches);
            return bScore - aScore;
        });
    }, [results]);

    const rankedRef = useRef(rankedResults);
    const queryRef = useRef(query);
    const expandedRef = useRef(expandedMatches);

    useLayoutEffect(() => {
        rankedRef.current = rankedResults;
        queryRef.current = query;
        expandedRef.current = expandedMatches;
    });

    const itemKeyFor = useCallback((cardIndex: number) => {
        const media = rankedRef.current[cardIndex]?.media;
        return media ? `${media.id}${media.page ? `-${media.page}` : ''}` : '';
    }, []);

    const expandCard = useCallback((cardIndex: number) => {
        setExpandedMatches((prev) => {
            const next = new Set(prev);
            next.add(itemKeyFor(cardIndex));
            return next;
        });
        // itemKeyFor is memoized with an empty dependency array, so its identity
        // never changes; omitting it here keeps expandCard stable for the nav hook.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const collapseCard = useCallback((cardIndex: number) => {
        setExpandedMatches((prev) => {
            const next = new Set(prev);
            next.delete(itemKeyFor(cardIndex));
            return next;
        });
        // itemKeyFor is memoized with an empty dependency array, so its identity
        // never changes; omitting it here keeps collapseCard stable for the nav hook.
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const isCardExpanded = useCallback(
        (cardIndex: number) => expandedRef.current.has(itemKeyFor(cardIndex)),
        [itemKeyFor],
    );

    const getHref = useCallback((cardIndex: number, passageIndex: number) => {
        const result = rankedRef.current[cardIndex];
        if (!result) {
            return null;
        }
        const index = passageIndex >= 0 ? passageIndex : 0;
        const match = result.matches[index];
        return match
            ? getMatchHref(result.media, match, queryRef.current)
            : getMediaLink(result.media, queryRef.current);
    }, []);

    const navigate = useCallback((href: string) => {
        router.push(href);
    }, [router]);

    const navBounds = useMemo(
        () => ({
            cardCount: Math.min(visibleCount, rankedResults.length),
            passageCountFor: (cardIndex: number) => rankedRef.current[cardIndex]?.matches.length ?? 0,
        }),
        [visibleCount, rankedResults.length],
    );

    const nav = useSearchKeyboardNav({
        bounds: navBounds,
        getHref,
        navigate,
        expandCard,
        collapseCard,
        isCardExpanded,
    });

    useEffect(() => {
        nav.reset();
    }, [results, visibleCount, nav.reset]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!nav.activeNodeId) {
            return;
        }
        document.getElementById(nav.activeNodeId)?.scrollIntoView({ block: 'nearest' });
    }, [nav.activeNodeId]);

    const totalMatches = useMemo(
        () => results.reduce((sum, result) => sum + (result.matchCount ?? result.matches.length), 0),
        [results],
    );

    const updateURL = useCallback((
        searchQuery: string,
        currentFilters: Record<FilterKey, boolean>
    ) => {
        const params = new URLSearchParams();

        if (searchQuery.trim()) {
            params.set('q', searchQuery.trim());
        }

        const activeFilters = Object.entries(currentFilters)
            .filter(([, active]) => active)
            .map(([key]) => key);

        if (activeFilters.length > 0 && activeFilters.length < Object.keys(currentFilters).length) {
            params.set('filters', activeFilters.join(','));
        }

        const nextUrl = params.toString() ? `/search?${params.toString()}` : '/search';
        router.push(nextUrl, { scroll: false });
    }, [router]);

    const handleSearch = useCallback(async () => {
        if (!query.trim()) {
            setResults([]);
            setVisibleCount(10);
            setErrorMsg(null);
            return;
        }

        setIsSearching(true);
        setResults([]);
        setExpandedMatches(new Set());
        setErrorMsg(null);

        try {
            const typeFilters: string[] = [];
            if (filters.video) typeFilters.push('video');
            if (filters['quran-study']) typeFilters.push('quran-study');
            if (filters['messenger-audio']) typeFilters.push('messenger-audio');
            if (filters.perspective) typeFilters.push('perspective');
            if (filters.appendix) typeFilters.push('appendix');
            if (filters.quran) typeFilters.push('quran');
            if (filters.other) typeFilters.push('other');

            const response = await searchTranscripts(query, typeFilters, { proximityWindow: 18 });
            if (!response.success) {
                throw new Error(response.error || 'Search failed');
            }

            const rawResults = (response.data || []) as SearchResult[];
            const formattedResults = rawResults.map((item) => {
                const formattedMedia = formatMedia(item.media);
                return {
                    ...item,
                    media: {
                        ...item.media,
                        ...formattedMedia,
                        displayTitle: item.media.displayTitle || formattedMedia.displayTitle,
                    },
                };
            });

            setResults(formattedResults);
            setVisibleCount(10);
            updateURL(query, filters);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            setErrorMsg(message);
        } finally {
            setIsSearching(false);
        }
    }, [query, filters, updateURL, setResults, setVisibleCount, setErrorMsg, setIsSearching, setExpandedMatches]);

    useEffect(() => {
        // Runs the search once per distinct URL-provided query (e.g. arriving via a
        // shared search link), regardless of outcome. Gating on results.length === 0
        // instead would retry forever on a legitimate zero-result search or a failed
        // request (e.g. rate limiting), hammering the server indefinitely.
        const timer = setTimeout(() => {
            if (initialQuery && attemptedInitialQueryRef.current !== initialQuery && !isSearching) {
                attemptedInitialQueryRef.current = initialQuery;
                void handleSearch();
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [handleSearch, initialQuery, isSearching]);

    useEffect(() => {
        if (!query.trim()) {
            const timer = setTimeout(() => {
                setResults([]);
                setExpandedMatches(new Set());
            }, 0);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(() => {
            void handleSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [query, filters, handleSearch]);

    const toggleMatches = (itemKey: string) => {
        setExpandedMatches((prev) => {
            const next = new Set(prev);
            if (next.has(itemKey)) {
                next.delete(itemKey);
            } else {
                next.add(itemKey);
            }
            return next;
        });
    };

    const isAllSelected = useMemo(
        () => Object.values(filters).every(Boolean),
        [filters],
    );

    const isVideosSelected = useMemo(
        () => filters.video && !filters['messenger-audio'] && !filters['quran-study'] && !filters.perspective && !filters.appendix && !filters.quran && !filters.other,
        [filters],
    );

    const isAudiosSelected = useMemo(
        () => (filters['messenger-audio'] || filters['quran-study']) && !filters.video && !filters.perspective && !filters.appendix && !filters.quran && !filters.other,
        [filters],
    );

    const isWrittenSelected = useMemo(
        () => (filters.perspective || filters.appendix || filters.other) && !filters.video && !filters['messenger-audio'] && !filters['quran-study'] && !filters.quran,
        [filters],
    );

    const isQuranSelected = useMemo(
        () => filters.quran && !filters.video && !filters['messenger-audio'] && !filters['quran-study'] && !filters.perspective && !filters.appendix && !filters.other,
        [filters],
    );

    const selectAllSources = useCallback(() => {
        setFilters({
            video: true,
            'quran-study': true,
            'messenger-audio': true,
            perspective: true,
            appendix: true,
            quran: true,
            other: true,
        });
    }, []);

    const selectVideosCategory = useCallback(() => {
        if (isVideosSelected) {
            selectAllSources();
        } else {
            setFilters({
                video: true,
                'quran-study': false,
                'messenger-audio': false,
                perspective: false,
                appendix: false,
                quran: false,
                other: false,
            });
        }
    }, [isVideosSelected, selectAllSources]);

    const selectAudiosCategory = useCallback(() => {
        if (isAudiosSelected) {
            selectAllSources();
        } else {
            setFilters({
                video: false,
                'quran-study': true,
                'messenger-audio': true,
                perspective: false,
                appendix: false,
                quran: false,
                other: false,
            });
        }
    }, [isAudiosSelected, selectAllSources]);

    const selectWrittenCategory = useCallback(() => {
        if (isWrittenSelected) {
            selectAllSources();
        } else {
            setFilters({
                video: false,
                'quran-study': false,
                'messenger-audio': false,
                perspective: true,
                appendix: true,
                quran: false,
                other: true,
            });
        }
    }, [isWrittenSelected, selectAllSources]);

    const selectQuranCategory = useCallback(() => {
        if (isQuranSelected) {
            selectAllSources();
        } else {
            setFilters({
                video: false,
                'quran-study': false,
                'messenger-audio': false,
                perspective: false,
                appendix: false,
                quran: true,
                other: false,
            });
        }
    }, [isQuranSelected, selectAllSources]);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <div className="mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-6">
                <div className="flex flex-col gap-6">
                    
                    {/* ==========================================================================
                       MAIN SEARCH FEED
                       ========================================================================== */}
                    <main className="min-w-0 flex-1 space-y-6">
                        
                        {/* Search Control Bar Header Card */}
                        <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-ed-rule-strong/40 dark:border-white/10 bg-ed-surface/90 dark:bg-ed-surface/50 p-4 sm:p-5 backdrop-blur-2xl shadow-md dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] transition-all duration-300 space-y-4">
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleSearch();
                                }}
                                className="relative flex flex-col sm:flex-row sm:items-center gap-3"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                                    <input
                                        id="archive-search-input"
                                        name="q"
                                        type="text"
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        placeholder="Search transcripts, perspectives, appendices..."
                                        aria-label="Search transcripts, perspectives, appendices"
                                        className="archive-input w-full py-2.5 pl-11 pr-24 text-sm sm:text-base rounded-2xl border border-ed-rule/60 dark:border-white/10 bg-ed-bg/60 dark:bg-black/40 text-ed-fg backdrop-blur-xl focus:border-ed-fg dark:focus:border-white/30 transition-all"
                                        onKeyDown={nav.onKeyDown}
                                        role="combobox"
                                        aria-expanded={rankedResults.length > 0}
                                        aria-controls="search-results"
                                        aria-autocomplete="list"
                                        aria-activedescendant={nav.activeNodeId ?? undefined}
                                    />
                                    {query ? (
                                        <button
                                            type="button"
                                            onClick={() => setQuery('')}
                                            className="absolute right-[4.5rem] top-1/2 -translate-y-1/2 p-1 text-ed-fg-muted hover:text-ed-fg"
                                            aria-label="Clear search query"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    ) : null}
                                    <button
                                        type="submit"
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl bg-ed-fg px-4 py-1.5 text-xs font-bold text-ed-bg transition-colors hover:bg-ed-accent"
                                    >
                                        Search
                                    </button>
                                </div>

                                {/* Source Filter Segmented Pill Group */}
                                <div className="overflow-x-auto pb-1 sm:pb-0">
                                    <div className="relative flex items-center gap-1 p-1 rounded-full border border-ed-rule/60 dark:border-white/10 bg-ed-bg/60 dark:bg-black/40 backdrop-blur-xl overflow-hidden isolation-auto">
                                        <button
                                            type="button"
                                            onClick={selectAllSources}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] tracking-wider transition-all shrink-0 ${
                                                isAllSelected
                                                    ? 'bg-ed-fg text-ed-bg font-bold [transform:translateZ(0)] relative z-10'
                                                    : 'text-ed-fg-muted hover:text-ed-fg font-medium'
                                            }`}
                                        >
                                            <SlidersHorizontal className="h-3 w-3" />
                                            All Sources
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectVideosCategory}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] tracking-wider transition-all shrink-0 ${
                                                isVideosSelected
                                                    ? 'bg-ed-fg text-ed-bg font-bold [transform:translateZ(0)] relative z-10'
                                                    : 'text-ed-fg-muted hover:text-ed-fg font-medium'
                                            }`}
                                        >
                                            <Video className="h-3 w-3" />
                                            Videos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectAudiosCategory}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] tracking-wider transition-all shrink-0 ${
                                                isAudiosSelected
                                                    ? 'bg-ed-fg text-ed-bg font-bold [transform:translateZ(0)] relative z-10'
                                                    : 'text-ed-fg-muted hover:text-ed-fg font-medium'
                                            }`}
                                        >
                                            <Headphones className="h-3 w-3" />
                                            Audios
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectWrittenCategory}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] tracking-wider transition-all shrink-0 ${
                                                isWrittenSelected
                                                    ? 'bg-ed-fg text-ed-bg font-bold [transform:translateZ(0)] relative z-10'
                                                    : 'text-ed-fg-muted hover:text-ed-fg font-medium'
                                            }`}
                                        >
                                            <FileText className="h-3 w-3" />
                                            Written
                                        </button>
                                        <button
                                            type="button"
                                            onClick={selectQuranCategory}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[0.68rem] tracking-wider transition-all shrink-0 ${
                                                isQuranSelected
                                                    ? 'bg-ed-fg text-ed-bg font-bold [transform:translateZ(0)] relative z-10'
                                                    : 'text-ed-fg-muted hover:text-ed-fg font-medium'
                                            }`}
                                        >
                                            <BookMarked className="h-3 w-3" />
                                            Qur&apos;an
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* Stats Line below search bar */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-ed-rule/60 text-xs">
                                <div className="flex items-center gap-2 font-sans font-bold text-ed-fg">
                                    <span>{results.length > 0 ? `${results.length} documents, ${totalMatches} passages` : 'Search Preserved Archive'}</span>
                                </div>
                                <span className="font-mono text-[0.68rem] text-ed-fg-muted">
                                    Exact phrases and nearby terms are already folded into the ranking.
                                </span>
                            </div>
                        </div>

                        {errorMsg ? (
                            <div className="soft-panel p-4 text-sm text-[#961515] dark:text-[#f6ae82] rounded-xl border border-red-500/20">
                                {errorMsg}
                            </div>
                        ) : null}

                        {/* Search Results List */}
                        <div id="search-results" role="listbox" aria-label="Search results" className="space-y-6">
                            {isSearching ? (
                                <div className="lift-card rounded-2xl p-12 text-center font-mono text-xs uppercase tracking-widest text-ed-fg-muted">
                                    Searching the archive...
                                </div>
                            ) : null}

                            {!isSearching && query && results.length === 0 ? (
                                <div className="lift-card rounded-2xl p-12 text-center">
                                    <p className="font-sans text-2xl font-extrabold text-ed-fg">No matches found.</p>
                                    <p className="mt-2 text-sm text-ed-fg-muted">
                                        Try a shorter phrase, clear filter options, or search by title.
                                    </p>
                                </div>
                            ) : null}

                            {!isSearching && rankedResults.slice(0, visibleCount).map((result, index) => {
                                const itemKey = `${result.media.id}${result.media.page ? `-${result.media.page}` : ''}`;
                                const active = nav.activeCardIndex === index ? nav.activePassageIndex : null;
                                return (
                                    <SearchResultCard
                                        key={itemKey}
                                        cardIndex={index}
                                        active={active}
                                        result={result}
                                        query={query}
                                        rank={index + 1}
                                        expanded={expandedMatches.has(itemKey)}
                                        onToggle={() => toggleMatches(itemKey)}
                                    />
                                );
                            })}
                        </div>

                        {visibleCount < rankedResults.length ? (
                            <div className="flex justify-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => setVisibleCount((prev) => prev + 10)}
                                    className="archive-button archive-button-secondary rounded-full px-8 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ed-fg hover:border-ed-fg shadow-md"
                                >
                                    Load More Results ({rankedResults.length - visibleCount} remaining)
                                </button>
                            </div>
                        ) : null}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default function SearchClient() {
    return <SearchContent />;
}

function SearchResultCard({
    result,
    query,
    rank,
    expanded,
    onToggle,
    cardIndex,
    active,
}: {
    result: SearchResult;
    query: string;
    rank: number;
    expanded: boolean;
    onToggle: () => void;
    cardIndex: number;
    active: number | null;
}) {
    const { media, matches } = result;
    const mediaLink = getMediaLink(media, query);
    const thumbnailSrc = getThumbnailSrc(media);
    const isDocument = isDocumentType(media.type);
    const visibleMatches = expanded ? matches : matches.slice(0, 3);
    const bestMatch = matches[0];
    const bestHref = bestMatch ? getMatchHref(media, bestMatch, query) : mediaLink;

    const cardActive = active === -1;
    const cardId = `search-card-${cardIndex}`;
    const cardTitle = media.displayTitle || media.title;
    const bestPassageId = `search-card-${cardIndex}-passage-0`;
    const bestPassageActive = active === 0;

    return (
        <article
            id={cardId}
            role="group"
            aria-label={cardTitle}
            className={`group relative flex flex-col overflow-hidden rounded-3xl border border-ed-rule-strong/40 dark:border-white/10 bg-ed-surface/90 dark:bg-ed-surface/50 p-5 sm:p-6 backdrop-blur-2xl shadow-md dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:border-ed-rule-strong dark:hover:border-white/20 hover:bg-ed-surface dark:hover:bg-ed-surface/70 hover:shadow-lg dark:hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.5)] ${
                cardActive ? 'ring-2 ring-ed-fg ring-offset-2 ring-offset-ed-bg' : ''
            }`}
        >
            <div className="space-y-5">
                {/* Main Media & Header Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 sm:gap-6 items-start">
                    <Link
                        href={bestHref}
                        className={`group relative overflow-hidden rounded-2xl border border-ed-rule-strong/40 dark:border-white/10 bg-black/5 dark:bg-black/40 shadow-inner ${
                            isDocument ? 'aspect-[3/4] w-full max-w-[160px] mx-auto' : 'aspect-video w-full'
                        }`}
                        aria-label={`Open ${media.displayTitle || media.title}`}
                    >
                        <Image
                            src={thumbnailSrc}
                            alt={media.displayTitle || media.title}
                            fill
                            unoptimized
                            className={`h-full w-full transition duration-500 group-hover:scale-[1.04] ${
                                media.type === 'perspective'
                                    ? 'object-cover object-right'
                                    : 'object-cover'
                            }`}
                        />
                        {!isDocument ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 dark:bg-black/30 backdrop-blur-[2px] transition-opacity group-hover:bg-black/10">
                                <div className="h-11 w-11 rounded-full border border-white/40 bg-black/70 backdrop-blur-xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110">
                                    <Play className="h-4 w-4 fill-current ml-0.5" />
                                </div>
                            </div>
                        ) : null}
                    </Link>

                    <div className="min-w-0 space-y-2">
                        {/* Top Badges Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ed-rule/60 dark:border-white/10 pb-3">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-ed-rule-strong/40 dark:border-white/15 bg-black/5 dark:bg-black/40 px-2.5 py-0.5 font-mono text-[0.68rem] font-bold text-ed-fg dark:text-white/90 backdrop-blur-xl">
                                    {String(rank).padStart(2, '0')}
                                </span>
                                <span className="rounded-full border border-ed-rule-strong/40 dark:border-white/15 bg-black/5 dark:bg-black/40 px-3 py-0.5 font-mono text-[0.68rem] font-bold text-ed-fg-muted dark:text-white/80 uppercase backdrop-blur-xl tracking-wider">
                                    {getMediaTypeLabel(media.type)}
                                </span>
                                {media.displayDate ? (
                                    <span className="font-mono text-xs text-ed-fg-muted">
                                        {media.displayDate}
                                    </span>
                                ) : null}
                            </div>

                            <div className="flex items-center gap-2">
                                <SignalBadge score={result.bestScore ?? mediaBestScore(matches)} />
                            </div>
                        </div>

                        {/* Title & Author */}
                        <Link href={mediaLink} className="block pt-1 group">
                            <h3 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-ed-fg leading-snug group-hover:text-ed-accent transition-colors">
                                {media.displayTitle || media.title}
                            </h3>
                            {media.author ? (
                                <p className="mt-1 font-mono text-xs font-medium text-ed-fg-muted">
                                    {media.author}
                                </p>
                            ) : null}
                        </Link>
                    </div>
                </div>

                {/* BEST PASSAGE Highlight Box */}
                {bestMatch ? (
                    <Link
                        href={bestHref}
                        id={bestPassageId}
                        role="option"
                        aria-selected={bestPassageActive}
                        className={`block rounded-2xl border border-ed-rule-strong/40 dark:border-white/10 bg-black/5 dark:bg-black/50 p-4 sm:p-5 shadow-inner backdrop-blur-xl transition hover:border-ed-fg/40 dark:hover:border-white/20 hover:bg-black/10 dark:hover:bg-black/60 ${
                            bestPassageActive ? 'ring-2 ring-ed-fg' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-ed-fg-muted">
                                Best Passage
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-ed-rule dark:border-white/15 bg-ed-fg text-ed-bg dark:bg-black/60 dark:text-white px-3 py-1 font-mono text-xs font-semibold backdrop-blur-xl transition-all shadow-sm">
                                <Play className="h-3 w-3 fill-current" />
                                {isDocumentType(media.type) ? `Open Page ${bestMatch.page || 1}` : `Play at ${formatTime(bestMatch.start_time)}`}
                            </span>
                        </div>

                        <div className="flex gap-3 items-start">
                            <span className="font-serif text-3xl leading-none text-ed-fg-muted/60 select-none">“</span>
                            <p
                                className="font-sans text-sm sm:text-base leading-relaxed text-ed-fg"
                                dangerouslySetInnerHTML={{
                                    __html: highlightMatch(bestMatch.content, query),
                                }}
                            />
                        </div>
                    </Link>
                ) : null}

                {/* PASSAGES TIMELINE */}
                {visibleMatches.length > 1 ? (
                    <div className="pt-2 border-t border-ed-rule/60 dark:border-white/10 space-y-3">
                        <p className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-ed-fg-muted">
                            Passages in this {isDocument ? 'document' : 'recording'}
                        </p>

                        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-ed-rule dark:before:bg-white/10">
                            {visibleMatches.slice(1).map((match) => {
                                const passageIndex = matches.indexOf(match);
                                return (
                                    <SearchMatchRow
                                        key={`${match.id}-${passageIndex}`}
                                        media={media}
                                        match={match}
                                        query={query}
                                        nodeId={`search-card-${cardIndex}-passage-${passageIndex}`}
                                        active={active === passageIndex}
                                    />
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {/* Expander Button */}
                {matches.length > 3 ? (
                    <div className="pt-2">
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-expanded={expanded}
                            className="archive-button archive-button-secondary rounded-full px-5 py-2 font-mono text-xs font-semibold text-ed-fg hover:border-ed-fg dark:hover:border-white/30 flex items-center gap-2 backdrop-blur-xl"
                        >
                            <span>{expanded ? 'Show fewer passages' : `Show ${matches.length - 3} more passages`}</span>
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                ) : null}
            </div>
        </article>
    );
}

function SearchMatchRow({
    media,
    match,
    query,
    nodeId,
    active,
}: {
    media: SearchResultMedia;
    match: SearchMatch;
    query: string;
    nodeId: string;
    active: boolean;
}) {
    const href = getMatchHref(media, match, query);

    return (
        <Link
            href={href}
            id={nodeId}
            role="option"
            aria-selected={active}
            className={`group relative flex items-start justify-between gap-4 rounded-lg p-2 transition hover:bg-ed-surface/80 ${
                active ? 'bg-ed-surface border border-ed-fg/40' : ''
            }`}
        >
            {/* Timeline Circle Node Dot */}
            <span className="absolute -left-[1.125rem] top-3 h-2.5 w-2.5 rounded-full border-2 border-ed-bg bg-ed-fg shadow-sm" />

            <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-ed-fg shrink-0 pt-0.5">
                    {getQuranVerseRef(media, match) || (isDocumentType(media.type) ? `Page ${match.page || 1}` : formatTime(match.start_time))}
                </span>
                <div className="min-w-0 flex-1">
                    {match.kind || match.label ? (
                        <span className="block font-mono text-[0.62rem] uppercase tracking-wider text-ed-fg-muted/80 mb-0.5">
                            {match.label ? `${getContentLabelText(match.label)} · ` : ''}
                            {getMatchKindLabel(match.kind || '')}
                        </span>
                    ) : null}
                    <p
                        className="font-sans text-xs sm:text-sm leading-relaxed text-ed-fg-muted group-hover:text-ed-fg transition-colors"
                        dangerouslySetInnerHTML={{
                            __html: highlightMatch(match.content, query),
                        }}
                    />
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-ed-fg-muted group-hover:text-ed-fg">
                <Play className="h-3.5 w-3.5 fill-current" />
                <ChevronDown className="h-3.5 w-3.5" />
            </div>
        </Link>
    );
}

function SignalBadge({ score }: { score: number }) {
    const label = score >= 100 ? 'Best match' : score >= 80 ? 'Close match' : score >= 55 ? 'Relevant' : 'Broad match';
    return (
        <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-ed-accent">
            {label}
        </span>
    );
}

// Distinguishes what kind of content a match came from — most relevant for the
// Qur'an, where a single result can be a verse, a section heading, or a footnote,
// and without this a footnote hit reads as an unexplained/out-of-place match.
function getContentLabelText(label: string) {
    const editionMatch = label.match(/^(verse|heading|footnote)-(1989|1992)$/);
    if (editionMatch) {
        const [, kind, edition] = editionMatch;
        return `${edition} ${kind[0].toUpperCase()}${kind.slice(1)}`;
    }

    switch (label) {
        case 'verse':
            return 'Verse';
        case 'heading':
            return 'Heading';
        case 'footnote':
            return 'Footnote';
        default:
            return label;
    }
}

function getQuranEditionFromLabel(label?: string) {
    const edition = label?.match(/-(1989|1992)$/)?.[1];
    return edition === '1989' || edition === '1992' ? edition : undefined;
}

// "chapter:verse" reference chip (e.g. "49:12"), mirroring how the standalone
// Qur'an reader identifies a verse — makes a Qur'an search hit self-explanatory
// without needing to open it first.
function getQuranVerseRef(media: SearchResultMedia, match: SearchMatch) {
    if (media.type !== 'quran' || typeof match.page !== 'number') return null;
    const chapterNumber = media.id.replace(/^quran\//, '');
    return `${chapterNumber}:${match.page}`;
}

function getMediaTypeLabel(type: string) {
    switch (type) {
        case 'sermon':
        case 'video':
            return 'Videos';
        case 'quran-study':
            return 'Quran Studies';
        case 'video-program':
            return 'Videos';
        case 'messenger-audio':
        case 'audio':
            return 'Messenger Audios';
        case 'perspective':
            return 'Submitter Perspectives';
        case 'appendix':
            return 'Appendices';
        case 'quran':
            return "Qur'an";
        case 'other':
            return 'Books';
        default:
            return 'Resource';
    }
}

function getMatchKindLabel(kind: string) {
    switch (kind) {
        case 'phrase':
            return 'Exact phrase';
        case 'proximity':
            return 'Nearby terms';
        case 'single-term':
            return 'Term match';
        case 'all-terms':
            return 'All terms';
        default:
            return 'Ranked match';
    }
}

function mediaBestScore(matches: SearchMatch[]) {
    return Math.max(0, ...matches.map((match) => match.score ?? 0));
}

function isDocumentType(type: string) {
    return ['perspective', 'appendix', 'other', 'quran'].includes(type);
}

function getDocumentBasePath(media: SearchResultMedia) {
    if (media.type === 'quran') {
        return `/quran/${media.id.replace(/^quran\//, '')}`;
    }
    return `/library/${media.id}`;
}

function getMediaLink(media: SearchResultMedia, query: string) {
    if (isDocumentType(media.type)) {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (typeof media.page === 'number') params.append('page', String(media.page));
        return `${getDocumentBasePath(media)}?${params.toString()}`;
    }

    return getMediaHref(media.id);
}

function getDocumentMatchLink(media: SearchResultMedia, match: SearchMatch, query: string) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);

    if (media.type === 'quran') {
        const edition = getQuranEditionFromLabel(match.label);
        if (edition) params.append('edition', edition);
    }

    const page = typeof match.page === 'number' ? match.page : media.page;
    if (typeof page === 'number') {
        params.append('page', String(page));
    }

    const basePath = getDocumentBasePath(media);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
}

function getMatchHref(media: SearchResultMedia, match: SearchMatch, query: string) {
    if (isDocumentType(media.type)) {
        return getDocumentMatchLink(media, match, query);
    }
    return `${getMediaLink(media, query)}?t=${Math.floor(match.start_time)}`;
}

function getThumbnailSrc(media: SearchResultMedia) {
    if (media.type === 'quran') {
        return '/images/placeholders/quran.jpg';
    }

    if (media.thumbnailOverride) {
        return getPublicAssetUrl(media.thumbnailOverride);
    }

    if (media.type === 'audio' || media.type === 'messenger-audio') {
        return getPublicAssetUrl('/content/audios/messenger-audios/default.jpg');
    }

    if (media.type === 'perspective') {
        return '/images/placeholders/newsletter.png';
    }

    if (media.type === 'appendix') {
        return '/images/placeholders/appendix.png';
    }

    if (media.type === 'other') {
        return '/images/placeholders/rashad-khalifa.png';
    }

    if (media.type === 'quran-study') {
        const match =
            (media.title || '').match(/^(\d+)\)/) || (media.id || '').match(/quran-study-v2\/(\d+)/);
        if (match) {
            const studyNumber = Number(match[1]);
            return (quranStudyThumbnails as Record<string, string>)[String(studyNumber)]
                || '/images/placeholders/rashad-khalifa.png';
        }
    }

    return '/images/placeholders/rashad-khalifa.png';
}

function formatTime(seconds: number) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

function highlightMatch(text: string, query: string) {
    const safeText = escapeHtml(text);

    if (!query) {
        return safeText;
    }

    const terms = getHighlightTerms(query).map(escapeHtml);
    if (terms.length === 0) {
        return safeText;
    }

    const regex = new RegExp(
        `(${terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
        'gi',
    );

    return safeText.replace(regex, '<span class="search-term-highlight">$1</span>');
}

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case "'":
                return '&#39;';
            default:
                return char;
        }
    });
}
