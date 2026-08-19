'use client';

import Image from 'next/image';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'motion/react';
import {
    BookMarked,
    Check,
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
import { hasOperators, parseAdvancedQuery } from '@/lib/search/queryParser';
import { logSearchEvent } from '@/lib/search/analytics';
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

type SearchResponse = {
    results: SearchResult[];
    total: number;
    totalMatches: number;
};

type Suggestion = {
    id: string;
    title: string;
    type: string;
    author?: string;
};

const PAGE_SIZE = 10;
const MIN_SUGGEST_LENGTH = 2;
const FILTERS_KEY = 'sa-search-filters';
const FILTER_KEYS: FilterKey[] = ['video', 'quran-study', 'messenger-audio', 'perspective', 'appendix', 'quran', 'other'];

// A shared link's filters always win; localStorage is only consulted when the URL
// says nothing. Unknown or malformed stored values are discarded rather than trusted.
function readStoredFilters(): Record<FilterKey, boolean> | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(FILTERS_KEY);
        if (!raw) return null;

        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) return null;

        const record = parsed as Record<string, unknown>;
        if (!FILTER_KEYS.every((key) => typeof record[key] === 'boolean')) return null;
        // All-off would render an unusable page; treat it as no preference.
        if (!FILTER_KEYS.some((key) => record[key] === true)) return null;

        return Object.fromEntries(FILTER_KEYS.map((key) => [key, record[key] as boolean])) as Record<FilterKey, boolean>;
    } catch {
        return null;
    }
}
const OPERATOR_CHIP_CLASS = 'rounded-[4px] border border-ed-accent/30 bg-ed-accent-soft px-2.5 py-1 font-mono text-[0.68rem] text-ed-accent';

function SuggestionIcon({ type }: { type: string }) {
    if (type === 'video' || type === 'video-program' || type === 'sermon') {
        return <Video className="h-3.5 w-3.5 shrink-0 text-ed-fg-muted" aria-hidden="true" />;
    }
    if (type === 'quran-study' || type === 'messenger-audio' || type === 'audio') {
        return <Headphones className="h-3.5 w-3.5 shrink-0 text-ed-fg-muted" aria-hidden="true" />;
    }
    if (type === 'quran') {
        return <BookMarked className="h-3.5 w-3.5 shrink-0 text-ed-fg-muted" aria-hidden="true" />;
    }
    return <FileText className="h-3.5 w-3.5 shrink-0 text-ed-fg-muted" aria-hidden="true" />;
}

function formatResult(item: SearchResult): SearchResult {
    const formattedMedia = formatMedia(item.media);
    return {
        ...item,
        media: {
            ...item.media,
            ...formattedMedia,
            displayTitle: item.media.displayTitle || formattedMedia.displayTitle,
        },
    };
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const initialFilters = searchParams.get('filters')?.split(',') || [];

    const [query, setQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [total, setTotal] = useState(0);
    const [totalMatches, setTotalMatches] = useState(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
    const parsedQuery = useMemo(() => parseAdvancedQuery(query), [query]);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [suggestOpen, setSuggestOpen] = useState(false);
    const abortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestAbortRef = useRef<AbortController | null>(null);
    const suggestCacheRef = useRef<Map<string, Suggestion[]>>(new Map());
    const searchFieldRef = useRef<HTMLDivElement>(null);
    const isFirstRunRef = useRef(true);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);
    const [filters, setFilters] = useState<Record<FilterKey, boolean>>(() => {
        // A shared link is explicit intent and outranks a stored preference.
        if (initialFilters.length === 0) {
            const stored = readStoredFilters();
            if (stored) return stored;
        }

        return {
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
        };
    });

    // Persist the current selection so a hard refresh without URL filters restores it.
    useEffect(() => {
        try {
            window.localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
        } catch {
            // Private mode or a full quota — persistence is a convenience, not a requirement.
        }
    }, [filters]);

    // The API returns globally rank-ordered pages and they are appended in order,
    // so the rendered list is already sorted by score.
    const resultsRef = useRef(results);
    const queryRef = useRef(query);
    const expandedRef = useRef(expandedMatches);
    const listRef = useRef<HTMLDivElement>(null);
    const [listOffsetTop, setListOffsetTop] = useState(0);

    // The virtualizer measures against document scroll, so it needs the list's offset
    // from the top of the page. The control card above it changes height (error banner,
    // wrapping filter chips), so this is observed rather than measured once.
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const observer = new ResizeObserver(() => setListOffsetTop(el.offsetTop));
        observer.observe(document.body);
        return () => observer.disconnect();
    }, []);

    // Cards are variable height (match lists expand), the page itself is the scroll
    // container, and only the mounted window is measured — so heights come from
    // measureElement rather than a fixed estimate.
    const virtualizer = useWindowVirtualizer({
        count: results.length,
        estimateSize: () => 240,
        overscan: 6,
        scrollMargin: listOffsetTop,
    });
    const virtualizerRef = useRef(virtualizer);

    useLayoutEffect(() => {
        resultsRef.current = results;
        queryRef.current = query;
        expandedRef.current = expandedMatches;
        virtualizerRef.current = virtualizer;
    });

    const itemKeyFor = useCallback((cardIndex: number) => {
        const media = resultsRef.current[cardIndex]?.media;
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
        const result = resultsRef.current[cardIndex];
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
            cardCount: results.length,
            passageCountFor: (cardIndex: number) => resultsRef.current[cardIndex]?.matches.length ?? 0,
        }),
        [results.length],
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
    }, [results, nav.reset]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const nodeId = nav.activeNodeId;
        if (!nodeId) {
            return;
        }
        // The target card may be outside the rendered window, in which case its node
        // does not exist yet — bring it into range first, then scroll to the passage
        // on the next frame once it has mounted.
        if (nav.activeCardIndex >= 0) {
            virtualizerRef.current.scrollToIndex(nav.activeCardIndex, { align: 'auto' });
        }
        const frame = requestAnimationFrame(() => {
            document.getElementById(nodeId)?.scrollIntoView({ block: 'nearest' });
        });
        return () => cancelAnimationFrame(frame);
    }, [nav.activeNodeId, nav.activeCardIndex]);

    // Keeps the address bar shareable without pushing a history entry per keystroke
    // or filter toggle. router.push would also trigger an RSC request on every
    // change; the search is entirely client-driven, so there is nothing to refetch.
    const syncUrl = useCallback((
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
        if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
            window.history.replaceState(null, '', nextUrl);
        }
    }, []);

    const runQuery = useCallback(async (offset: number) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        // Supersede any in-flight request so a slow earlier response can never
        // overwrite the results of a newer query.
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        if (offset === 0) {
            setIsSearching(true);
        } else {
            setIsLoadingMore(true);
        }
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

            const params = new URLSearchParams({
                q: trimmed,
                limit: String(PAGE_SIZE),
                offset: String(offset),
            });
            if (typeFilters.length > 0) {
                params.set('filters', typeFilters.join(','));
            }

            const startedAt = performance.now();
            const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
            const latencyMs = performance.now() - startedAt;
            if (!response.ok) {
                throw new Error(
                    response.status === 429
                        ? 'Too many searches. Please wait a moment.'
                        : 'Search failed. Please try again shortly.',
                );
            }

            const payload = (await response.json()) as SearchResponse;
            const formatted = payload.results.map(formatResult);

            // Results are only swapped once the new set has arrived, so a new query
            // never blanks the list mid-flight.
            setResults((prev) => (offset === 0 ? formatted : [...prev, ...formatted]));
            setTotal(payload.total);
            setTotalMatches(payload.totalMatches);
            if (offset === 0) {
                setExpandedMatches(new Set());
            }

            if (offset === 0) {
                logSearchEvent({
                    name: 'search.query',
                    query: trimmed,
                    filterCount: typeFilters.length,
                    resultCount: payload.total,
                    latencyMs,
                });
            }
        } catch (error) {
            if (controller.signal.aborted) return;
            setErrorMsg(error instanceof Error ? error.message : 'An unknown error occurred');
        } finally {
            // A superseded request must not clear the loading state its successor set.
            if (!controller.signal.aborted) {
                setIsSearching(false);
                setIsLoadingMore(false);
            }
        }
    }, [
        query,
        filters,
        setResults,
        setTotal,
        setTotalMatches,
        setErrorMsg,
        setIsSearching,
        setIsLoadingMore,
        setExpandedMatches,
    ]);

    useEffect(() => {
        // A query arriving from the URL (a shared search link) runs immediately;
        // everything after that is debounced so typing does not fire a request per key.
        // The URL is synced at the same settle point, independent of the request
        // outcome, so a failed or rate-limited search still leaves a shareable URL.
        const immediate = isFirstRunRef.current;
        isFirstRunRef.current = false;

        if (!query.trim()) {
            abortRef.current?.abort();
            debounceRef.current = setTimeout(() => {
                syncUrl('', filters);
                setResults([]);
                setTotal(0);
                setTotalMatches(0);
                setExpandedMatches(new Set());
                setErrorMsg(null);
            }, 0);
        } else {
            debounceRef.current = setTimeout(() => {
                syncUrl(query, filters);
                void runQuery(0);
            }, immediate ? 0 : 300);
        }

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query, filters, runQuery, syncUrl]);

    useEffect(() => () => abortRef.current?.abort(), []);

    // Suggestions are advisory, so failures are swallowed rather than surfaced. Results
    // are cached per prefix, so retyping a prefix never costs a second request.
    useEffect(() => {
        const needle = query.trim();

        if (needle.length < MIN_SUGGEST_LENGTH) {
            suggestAbortRef.current?.abort();
            const timer = setTimeout(() => {
                setSuggestions([]);
                setSuggestOpen(false);
            }, 0);
            return () => clearTimeout(timer);
        }

        const key = needle.toLowerCase();
        const cached = suggestCacheRef.current.get(key);
        if (cached) {
            const timer = setTimeout(() => {
                setSuggestions(cached);
                setSuggestOpen(cached.length > 0);
            }, 0);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(async () => {
            suggestAbortRef.current?.abort();
            const controller = new AbortController();
            suggestAbortRef.current = controller;

            try {
                const response = await fetch(`/api/search/suggest?q=${encodeURIComponent(needle)}`, {
                    signal: controller.signal,
                });
                if (!response.ok) return;

                const payload = (await response.json()) as { suggestions: Suggestion[] };
                suggestCacheRef.current.set(key, payload.suggestions);
                setSuggestions(payload.suggestions);
                setSuggestOpen(payload.suggestions.length > 0);
            } catch {
                // Aborted or offline — leave whatever is on screen alone.
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query, setSuggestions, setSuggestOpen]);

    // Delegated so clicks are captured without threading a callback through every
    // card, and attached as a listener rather than a JSX handler because the container
    // is a listbox wrapper, not an interactive control.
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const onClick = (event: MouseEvent) => {
            const row = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-media-id]');
            const rank = Number(row?.dataset.resultRank);
            if (!row || !Number.isFinite(rank)) return;

            logSearchEvent({
                name: 'search.click',
                query: queryRef.current.trim(),
                rank,
                mediaId: row.dataset.mediaId ?? '',
                matchKind: row.dataset.matchKind,
            });
        };

        el.addEventListener('click', onClick);
        return () => el.removeEventListener('click', onClick);
    }, []);

    useEffect(() => {
        if (!suggestOpen) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!searchFieldRef.current?.contains(event.target as Node)) {
                setSuggestOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [suggestOpen, setSuggestOpen]);

    const [filterOpen, setFilterOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!filterOpen) return;
        const onPointerDown = (event: PointerEvent) => {
            if (!filterRef.current?.contains(event.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [filterOpen]);

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


    // Labelled list of individual filter keys shown in the checkbox dropdown.
    const FILTER_CHECKBOXES: Array<{ key: FilterKey; label: string; icon: typeof SlidersHorizontal }> = [
        { key: 'video',           label: 'Videos',          icon: Video },
        { key: 'quran-study',     label: 'Qur\u2019an Study', icon: Headphones },
        { key: 'messenger-audio', label: 'Messenger Audio', icon: Headphones },
        { key: 'perspective',     label: 'Perspectives',    icon: FileText },
        { key: 'appendix',        label: 'Appendices',      icon: FileText },
        { key: 'quran',           label: 'Qur\u2019an Text', icon: BookMarked },
        { key: 'other',           label: 'Other',           icon: FileText },
    ];

    const toggleFilter = useCallback((key: FilterKey) => {
        setFilters((prev) => {
            const next = { ...prev, [key]: !prev[key] };
            // Never leave every filter off — revert to all-on instead.
            if (!Object.values(next).some(Boolean)) {
                return { video: true, 'quran-study': true, 'messenger-audio': true, perspective: true, appendix: true, quran: true, other: true };
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (isAllSelected) {
            // Already all-on — nothing to do (all-off is disallowed).
            return;
        }
        setFilters({ video: true, 'quran-study': true, 'messenger-audio': true, perspective: true, appendix: true, quran: true, other: true });
    }, [isAllSelected]);

    // Human-readable summary for the filter button label.
    const activeFilterLabel = useMemo(() => {
        if (isAllSelected) return 'All';
        const active = FILTER_CHECKBOXES.filter(({ key }) => filters[key]);
        if (active.length === 1) return active[0].label;
        return `${active.length} sources`;
    }, [filters, isAllSelected]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setSuggestOpen(false);
        syncUrl(query, filters);
        void runQuery(0);
    }, [query, filters, runQuery, syncUrl]);

    const clearSearchQuery = useCallback(() => {
        setQuery('');
        setSuggestions([]);
        setSuggestOpen(false);
    }, []);

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1] overflow-hidden">
                <div className="mx-auto max-w-[880px] px-4 py-8 sm:px-7 lg:py-12">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-[12px] font-medium text-ed-fg-muted">
                        <Link href="/" className="text-ed-fg-muted transition-colors hover:text-ed-accent">
                            Submission Archives
                        </Link>
                        <span className="text-ed-fg-faint">/</span>
                        <span className="text-ed-fg-secondary">Search</span>
                    </nav>

                    {/* Hero Header */}
                    <header className="mb-7 border-b border-ed-rule pb-7">
                        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                            <Search className="h-3 w-3" />
                            Universal Search Index
                        </div>
                        <h1
                            className="mb-3 text-[clamp(28px,3.6vw,40px)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                            Search the Archive
                        </h1>
                        <p
                            className="max-w-2xl text-[15.5px] leading-[1.6] text-ed-fg-secondary"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            Query transcripts, perspectives, and appendices across the full preserved corpus.
                        </p>
                    </header>

                    <div className="space-y-6">

                        {/* Search Control Card */}
                        <div className="rounded-[8px] border border-ed-rule bg-ed-surface p-4 sm:p-6 space-y-4 shadow-sm">
                                <form
                                    onSubmit={handleSearchSubmit}
                                    className="relative flex w-full flex-col gap-3 sm:flex-row sm:items-center"
                                >
                                    <div ref={searchFieldRef} className="relative z-20 min-w-0 flex-1">
                                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                                        <input
                                            id="archive-search-input"
                                            name="q"
                                            type="text"
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            placeholder="Search transcripts, perspectives, appendices..."
                                            aria-label="Search transcripts, perspectives, appendices"
                                            className="w-full rounded-[4px] border border-ed-rule bg-ed-surface py-2.5 pl-10 pr-10 text-sm sm:text-base text-ed-fg placeholder:text-ed-fg-muted outline-none transition-all focus:border-ed-rule-strong focus:bg-ed-surface-strong"
                                            onKeyDown={(event) => {
                                                if (event.key === 'Escape' && suggestOpen) {
                                                    event.preventDefault();
                                                    setSuggestOpen(false);
                                                    return;
                                                }
                                                nav.onKeyDown(event);
                                            }}
                                            role="combobox"
                                            aria-expanded={suggestOpen || results.length > 0}
                                            aria-controls="search-results"
                                            aria-autocomplete="list"
                                            aria-activedescendant={nav.activeNodeId ?? undefined}
                                        />
                                        {query ? (
                                            <button
                                                type="button"
                                                onClick={clearSearchQuery}
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-[4px] p-1 text-ed-fg-muted hover:text-ed-fg"
                                                aria-label="Clear search query"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        ) : null}

                                        {suggestOpen && suggestions.length > 0 ? (
                                            <ul
                                                id="search-suggestions"
                                                role="listbox"
                                                aria-label="Title suggestions"
                                                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface shadow-2xl"
                                            >
                                                {suggestions.map((suggestion, position) => (
                                                    <li key={`${suggestion.type}-${suggestion.id}`} role="option" aria-selected="false">
                                                        <Link
                                                            href={getMediaLink({ id: suggestion.id, title: suggestion.title, type: suggestion.type }, '')}
                                                            onClick={() => {
                                                                setSuggestOpen(false);
                                                                logSearchEvent({
                                                                    name: 'search.suggest_select',
                                                                    query: query.trim(),
                                                                    suggestionId: suggestion.id,
                                                                    position,
                                                                });
                                                            }}
                                                            className="flex items-center gap-2.5 px-4 py-2.5 text-left text-sm text-ed-fg transition-colors hover:bg-ed-surface-strong"
                                                        >
                                                            <SuggestionIcon type={suggestion.type} />
                                                            <span className="truncate">{suggestion.title}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>

                                    <div className="flex items-center gap-2 sm:shrink-0">
                                        <button
                                            type="submit"
                                            disabled={!query.trim()}
                                            className="inline-flex items-center justify-center rounded-[4px] bg-ed-accent px-4 py-2.5 text-xs font-bold text-white dark:text-[#0F0E0D] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ed-surface-strong disabled:text-ed-fg-muted"
                                            aria-label="Run search"
                                        >
                                            Search
                                        </button>

                                        <div ref={filterRef} className="relative flex items-center justify-end sm:justify-center">
                                            {/* Filter trigger button */}
                                            <button
                                                type="button"
                                                onClick={() => setFilterOpen((o) => !o)}
                                                className="relative z-30 inline-flex h-[42px] items-center gap-2 rounded-[4px] border border-ed-rule bg-ed-surface px-3 transition-colors hover:border-ed-rule-strong select-none"
                                                aria-haspopup="listbox"
                                                aria-expanded={filterOpen}
                                                aria-label="Filter sources"
                                            >
                                                <SlidersHorizontal className="h-4 w-4 text-ed-fg-muted" />
                                                <span className="font-mono text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ed-fg">
                                                    {activeFilterLabel}
                                                </span>
                                                <ChevronDown className={`h-3.5 w-3.5 text-ed-fg-muted transition-transform duration-150 ${filterOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Multi-select checkbox dropdown */}
                                            <AnimatePresence>
                                                {filterOpen && (
                                                    <motion.div
                                                        key="filter-panel"
                                                        initial={{ opacity: 0, scale: 0.97, y: -4 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.97, y: -4 }}
                                                        transition={{ duration: 0.12, ease: 'easeOut' }}
                                                        style={{ transformOrigin: 'top right' }}
                                                        className="absolute right-0 top-full z-30 mt-2 w-52 overflow-hidden rounded-[8px] border border-ed-rule bg-ed-surface p-1.5 shadow-2xl"
                                                        role="listbox"
                                                        aria-label="Filter sources"
                                                        aria-multiselectable="true"
                                                    >
                                                        {/* All toggle */}
                                                        <button
                                                            type="button"
                                                            role="option"
                                                            aria-selected={isAllSelected}
                                                            onClick={toggleAll}
                                                            className={`flex w-full cursor-pointer items-center justify-between rounded-[4px] px-2.5 py-2 text-left transition-colors ${isAllSelected ? 'bg-ed-accent-soft' : 'hover:bg-ed-surface-strong'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <SlidersHorizontal className={`h-4 w-4 ${isAllSelected ? 'text-ed-accent' : 'text-ed-fg-muted'}`} />
                                                                <span className={`text-sm tracking-tight ${isAllSelected ? 'font-semibold text-ed-accent' : 'font-medium text-ed-fg'}`}>All</span>
                                                            </div>
                                                            <div
                                                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors duration-100"
                                                                style={{
                                                                    backgroundColor: isAllSelected ? 'var(--ed-accent)' : 'transparent',
                                                                    borderColor: isAllSelected ? 'var(--ed-accent)' : 'var(--ed-rule)',
                                                                }}
                                                            >
                                                                {isAllSelected && <Check className="h-3 w-3 text-white dark:text-[#0F0E0D]" />}
                                                            </div>
                                                        </button>

                                                        {/* Divider */}
                                                        <div className="mx-2.5 my-1 h-px bg-ed-rule" />

                                                        {/* Individual source checkboxes */}
                                                        {FILTER_CHECKBOXES.map(({ key, label, icon: Icon }) => {
                                                            const checked = filters[key];
                                                            return (
                                                                <button
                                                                    key={key}
                                                                    type="button"
                                                                    role="option"
                                                                    aria-selected={checked}
                                                                    onClick={() => toggleFilter(key)}
                                                                    className={`flex w-full cursor-pointer items-center justify-between rounded-[4px] px-2.5 py-2 text-left transition-colors ${checked ? 'bg-ed-accent-soft' : 'hover:bg-ed-surface-strong'}`}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <Icon className={`h-4 w-4 ${checked ? 'text-ed-accent' : 'text-ed-fg-muted'}`} />
                                                                        <span className={`text-sm tracking-tight ${checked ? 'font-semibold text-ed-accent' : 'font-medium text-ed-fg'}`}>{label}</span>
                                                                    </div>
                                                                    <div
                                                                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] transition-colors duration-100"
                                                                        style={{
                                                                            backgroundColor: checked ? 'var(--ed-accent)' : 'transparent',
                                                                            borderColor: checked ? 'var(--ed-accent)' : 'var(--ed-rule)',
                                                                        }}
                                                                    >
                                                                        {checked && <Check className="h-3 w-3 text-white dark:text-[#0F0E0D]" />}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </form>

                                {/* Recognised query operators, so it is visible when syntax took effect */}
                                {hasOperators(parsedQuery) ? (
                                    <div className="flex flex-wrap items-center gap-1.5" aria-label="Active query operators">
                                        {parsedQuery.types.map((type) => (
                                            <span key={`type-${type}`} className={OPERATOR_CHIP_CLASS}>type:{type}</span>
                                        ))}
                                        {parsedQuery.exclusions.map((term) => (
                                            <span key={`not-${term}`} className={OPERATOR_CHIP_CLASS}>excluding {term}</span>
                                        ))}
                                        {parsedQuery.after !== undefined ? (
                                            <span className={OPERATOR_CHIP_CLASS}>after {parsedQuery.after}</span>
                                        ) : null}
                                        {parsedQuery.before !== undefined ? (
                                            <span className={OPERATOR_CHIP_CLASS}>before {parsedQuery.before}</span>
                                        ) : null}
                                    </div>
                                ) : null}

                                {/* Stats Line below search bar */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ed-rule text-xs">
                                    <div className="flex items-center gap-2 font-sans font-bold text-ed-fg">
                                        <span>{total > 0 ? `${total} documents, ${totalMatches} passages` : 'Search Preserved Archive'}</span>
                                        {isSearching && results.length > 0 ? (
                                            <span aria-live="polite" className="font-mono text-[0.68rem] font-normal text-ed-fg-muted">
                                                Updating results…
                                            </span>
                                        ) : null}
                                    </div>
                                    <span className="font-mono text-[0.68rem] text-ed-fg-muted">
                                        Exact phrases and nearby terms are already folded into the ranking.
                                    </span>
                                </div>
                        </div>

                        {errorMsg ? (
                            <div className="rounded-[8px] border border-red-500/20 bg-ed-surface p-4 text-sm text-red-600 dark:text-[#f6ae82]">
                                {errorMsg}
                            </div>
                        ) : null}

                        {/* Search Results List */}
                        <div ref={listRef} id="search-results" role="listbox" aria-label="Search results" className="space-y-6">
                            {/* Skeletons only when there is nothing to keep on screen; an
                                existing result set is dimmed and left in place instead. */}
                            {isSearching && results.length === 0 ? (
                                <div aria-live="polite" className="space-y-4">
                                    <span className="sr-only">Searching the archive...</span>
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div
                                            key={index}
                                            aria-hidden="true"
                                            className="flex animate-pulse gap-4 rounded-[12px] border border-ed-rule bg-ed-surface p-5 shadow-sm"
                                        >
                                            <div className="h-16 w-16 shrink-0 rounded-[8px] bg-ed-surface-strong sm:h-20 sm:w-20" />
                                            <div className="flex-1 space-y-3 py-1">
                                                <div className="h-4 w-2/3 rounded bg-ed-surface-strong" />
                                                <div className="h-3 w-full rounded bg-ed-surface-strong" />
                                                <div className="h-3 w-1/2 rounded bg-ed-surface-strong" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {!isSearching && query && results.length === 0 ? (
                                <div className="rounded-[12px] border border-dashed border-ed-rule bg-ed-surface p-12 text-center shadow-sm">
                                    <p
                                        className="text-2xl font-semibold text-ed-fg"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        No matches found.
                                    </p>
                                    <p className="mt-2 text-sm text-ed-fg-muted">
                                        Try a shorter phrase, clear filter options, or search by title.
                                    </p>
                                </div>
                            ) : null}

                            {results.length > 0 ? (
                                <div
                                    className={`relative transition-opacity duration-200 ${isSearching ? 'opacity-50' : 'opacity-100'}`}
                                    style={{ height: virtualizer.getTotalSize() }}
                                >
                                    {virtualizer.getVirtualItems().map((virtualRow) => {
                                        const result = results[virtualRow.index];
                                        const itemKey = `${result.media.id}${result.media.page ? `-${result.media.page}` : ''}`;
                                        const active = nav.activeCardIndex === virtualRow.index ? nav.activePassageIndex : null;
                                        return (
                                            <div
                                                key={itemKey}
                                                data-index={virtualRow.index}
                                                data-media-id={result.media.id}
                                                data-result-rank={virtualRow.index}
                                                data-match-kind={result.matches[0]?.kind}
                                                ref={virtualizer.measureElement}
                                                className="absolute left-0 top-0 w-full"
                                                style={{
                                                    transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
                                                }}
                                            >
                                                {/* Absolute positioning drops the parent's space-y gap, so the
                                                    gap rides along inside the measured height instead. */}
                                                <div className="pb-6">
                                                    <SearchResultCard
                                                        cardIndex={virtualRow.index}
                                                        active={active}
                                                        result={result}
                                                        query={query}
                                                        rank={virtualRow.index + 1}
                                                        expanded={expandedMatches.has(itemKey)}
                                                        onToggle={() => toggleMatches(itemKey)}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>

                        {!isSearching && results.length < total ? (
                            <div className="flex justify-center pt-4">
                                <button
                                    type="button"
                                    onClick={() => void runQuery(results.length)}
                                    disabled={isLoadingMore}
                                    className="rounded-[4px] border border-ed-rule bg-ed-surface px-8 py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ed-fg-muted transition-colors hover:border-ed-rule-strong hover:text-ed-fg disabled:opacity-50"
                                >
                                    {isLoadingMore
                                        ? 'Loading…'
                                        : `Load More Results (${total - results.length} remaining)`}
                                </button>
                            </div>
                        ) : null}
                    </div>

                    <footer className="mt-16 border-t border-ed-rule py-9 text-center text-[12px] font-medium tracking-[0.04em] text-ed-fg-muted">
                        Dedicated to preserving and sharing the message of God alone.
                    </footer>
                </div>
            </main>
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
            className={`group relative flex flex-col overflow-hidden rounded-[12px] border border-ed-rule bg-ed-surface p-5 sm:p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:shadow-md ${
                cardActive ? 'ring-2 ring-ed-accent ring-offset-2 ring-offset-ed-bg' : ''
            }`}
        >
            <div className="space-y-5">
                {/* Main Media & Header Row */}
                <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-6 items-start">
                    <Link
                        href={bestHref}
                        className={`group relative overflow-hidden rounded-[8px] border border-ed-rule bg-ed-bg ${
                            isDocument ? 'aspect-[3/4] w-full max-w-[160px] mx-auto' : 'aspect-video w-full'
                        }`}
                        aria-label={`Open ${media.displayTitle || media.title}`}
                    >
                        <Image
                            src={thumbnailSrc}
                            alt={media.displayTitle || media.title}
                            fill
                            unoptimized
                            className={`h-full w-full transition duration-500 group-hover:scale-[1.05] ${
                                media.type === 'perspective'
                                    ? 'object-cover object-right'
                                    : 'object-cover'
                            }`}
                        />
                        {!isDocument ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] transition-colors group-hover:bg-black/10">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-ed-rule bg-ed-bg/85 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:border-ed-accent">
                                    <Play className="ml-0.5 h-4 w-4 fill-ed-fg transition-colors group-hover:fill-ed-accent" />
                                </div>
                            </div>
                        ) : null}
                    </Link>

                    <div className="min-w-0 space-y-2.5">
                        {/* Top Badges Row */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ed-rule pb-3">
                            <div className="flex items-center gap-2">
                                <span className="rounded-[4px] border border-ed-rule bg-ed-surface-strong px-2.5 py-0.5 font-mono text-[0.68rem] font-bold text-ed-fg">
                                    {String(rank).padStart(2, '0')}
                                </span>
                                <span className="rounded-[4px] border border-ed-rule bg-ed-surface px-3 py-0.5 font-mono text-[0.68rem] font-bold text-ed-fg-muted uppercase tracking-wider">
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
                        <Link href={mediaLink} className="block pt-0.5 group">
                            <h3
                                className="text-xl sm:text-2xl font-semibold tracking-tight text-ed-fg leading-snug transition-colors group-hover:text-ed-accent"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
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
                        className={`block rounded-[8px] border border-ed-rule bg-ed-surface-strong p-4 sm:p-5 transition hover:border-ed-rule-strong ${
                            bestPassageActive ? 'ring-2 ring-ed-accent' : ''
                        }`}
                    >
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="font-mono text-[0.68rem] font-bold uppercase tracking-widest text-ed-fg-muted">
                                Best Matching Passage
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-[4px] bg-ed-accent text-white dark:text-[#0F0E0D] px-3.5 py-1 font-mono text-xs font-bold transition-all hover:opacity-90">
                                <Play className="h-3 w-3 fill-current" />
                                {isDocumentType(media.type) ? `Open Page ${bestMatch.page || 1}` : `Play at ${formatTime(bestMatch.start_time)}`}
                            </span>
                        </div>

                        <div className="flex gap-3 items-start">
                            <span className="font-serif text-3xl leading-none text-ed-fg-muted select-none">“</span>
                            <p
                                className="text-sm sm:text-base leading-relaxed text-ed-fg"
                                dangerouslySetInnerHTML={{
                                    __html: highlightMatch(bestMatch.content, query),
                                }}
                            />
                        </div>
                    </Link>
                ) : null}

                {/* PASSAGES TIMELINE */}
                {visibleMatches.length > 1 ? (
                    <div className="pt-2 border-t border-ed-rule space-y-3">
                        <p className="font-mono text-[0.68rem] font-bold uppercase tracking-widest text-ed-fg-muted">
                            Passages in this {isDocument ? 'document' : 'recording'}
                        </p>

                        <div className="relative pl-6 space-y-3.5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-ed-rule">
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
                            className="inline-flex items-center gap-2 rounded-[4px] border border-ed-rule bg-ed-surface px-5 py-2 font-mono text-xs font-semibold text-ed-fg-muted transition-all hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg"
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
            className={`group relative flex items-start justify-between gap-4 rounded-[4px] p-2.5 transition-all hover:bg-ed-surface-strong ${
                active ? 'bg-ed-surface-strong border border-ed-accent/40' : ''
            }`}
        >
            {/* Timeline Circle Node Dot */}
            <span className="absolute -left-[1.125rem] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-ed-surface bg-ed-accent" />

            <div className="flex items-start gap-3 min-w-0 flex-1">
                <span className="font-mono text-xs font-bold text-ed-fg shrink-0 pt-0.5">
                    {getQuranVerseRef(media, match) || (isDocumentType(media.type) ? `Page ${match.page || 1}` : formatTime(match.start_time))}
                </span>
                <div className="min-w-0 flex-1">
                    {match.kind || match.label ? (
                        <span className="block font-mono text-[0.62rem] uppercase tracking-wider text-ed-fg-muted mb-0.5">
                            {match.label ? `${getContentLabelText(match.label)} · ` : ''}
                            {getMatchKindLabel(match.kind || '')}
                        </span>
                    ) : null}
                    <p
                        className="text-xs sm:text-sm leading-relaxed text-ed-fg-secondary group-hover:text-ed-fg transition-colors"
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
        <span className="inline-flex items-center rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.16em] text-emerald-400">
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
        return `/scripture/quran/${media.id.replace(/^quran\//, '')}`;
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

    return safeText.replace(regex, '<span class="qs-highlight">$1</span>');
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
