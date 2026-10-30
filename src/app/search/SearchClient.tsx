'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileText, Headphones, Search, Video, X } from 'lucide-react';
import { getMatchHref, getMediaLink } from '@/lib/search/navigation';
import { EXAMPLE_QUERIES, hasOperators, parseAdvancedQuery } from '@/lib/search/queryParser';
import { logSearchEvent } from '@/lib/search/analytics';
import {
    SOURCE_FILTERS,
    normalizeSourceFilters,
    parseSort,
    type SearchResult,
    type SearchSort,
    type SourceCounts,
    type SourceFilter,
} from '@/lib/search/results';
import type { Suggestion } from '@/lib/search/searchIndex';
import SearchResultCard, { getResultKey } from './SearchResultCard';
import { useSearchKeyboardNav } from './useSearchKeyboardNav';

type SearchResponse = {
    results: SearchResult[];
    total: number;
    totalMatches: number;
    counts: SourceCounts;
};

const PAGE_SIZE = 10;
const MIN_SUGGEST_LENGTH = 2;
const TYPING_DEBOUNCE_MS = 300;
const CONNECTION_ERROR = 'Search is unavailable right now. Check your connection and try again.';

const OPERATOR_CHIP_CLASS = 'rounded-[4px] border border-ed-accent/30 bg-ed-accent-soft px-2.5 py-1 font-mono text-[0.68rem] text-ed-accent';

const SYNTAX_TIPS = [
    { syntax: '"exact phrase"', meaning: 'Match these words in this order' },
    { syntax: '-word', meaning: 'Leave out passages with this word' },
    { syntax: 'type:books', meaning: 'Search one kind of source' },
    { syntax: 'before:1990', meaning: 'Only dated sources before a year (or after:)' },
];

const SORT_OPTIONS: Array<{ value: SearchSort; label: string }> = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
];

function SuggestionIcon({ type }: { type: string }) {
    const className = 'h-3.5 w-3.5 shrink-0 text-ed-fg-muted';
    if (type === 'video' || type === 'video-program' || type === 'sermon') return <Video className={className} aria-hidden="true" />;
    if (type === 'quran-study' || type === 'messenger-audio' || type === 'audio') return <Headphones className={className} aria-hidden="true" />;
    return <FileText className={className} aria-hidden="true" />;
}

function SourceChip({ label, count, pressed, disabled, onClick }: {
    label: string;
    count?: number;
    pressed: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-40 ${
                pressed
                    ? 'border-ed-accent/40 bg-ed-accent-soft text-ed-accent'
                    : 'border-ed-rule bg-ed-surface text-ed-fg-secondary enabled:hover:border-ed-rule-strong enabled:hover:text-ed-fg'
            }`}
        >
            {label}
            {count !== undefined ? <span className="font-mono text-[0.68rem] opacity-75">{count.toLocaleString()}</span> : null}
        </button>
    );
}

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    // An empty selection means every source.
    const [sources, setSources] = useState<SourceFilter[]>(() => normalizeSourceFilters(searchParams.get('filters')?.split(',') ?? []));
    const [sort, setSort] = useState<SearchSort>(() => parseSort(searchParams.get('sort')));
    const [results, setResults] = useState<SearchResult[]>([]);
    const [total, setTotal] = useState(0);
    const [totalMatches, setTotalMatches] = useState(0);
    const [counts, setCounts] = useState<SourceCounts | null>(null);
    // The query the results on screen belong to. Null until a search completes.
    const [resultsQuery, setResultsQuery] = useState<string | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [suggestOpen, setSuggestOpen] = useState(false);

    const parsedQuery = useMemo(() => parseAdvancedQuery(query), [query]);
    // Operators shape the result set but never appear in the text, so they are left out of
    // highlighting and out of the query handed to readers and players.
    const highlightQuery = useMemo(() => (resultsQuery ? parseAdvancedQuery(resultsQuery).text : ''), [resultsQuery]);

    const abortRef = useRef<AbortController | null>(null);
    const suggestAbortRef = useRef<AbortController | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // The query last sent (or cleared). Null before the first run, which goes out at once.
    const settledQueryRef = useRef<string | null>(null);
    const submittedQueryRef = useRef<string | null>(initialQuery.trim() || null);
    // The offset of the last request, so "Try again" repeats a failed Load More rather
    // than replacing the pages already shown.
    const lastOffsetRef = useRef(0);
    const suggestCacheRef = useRef<Map<string, Suggestion[]>>(new Map());
    const searchFieldRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const resultsRef = useRef(results);
    const highlightQueryRef = useRef(highlightQuery);
    const expandedRef = useRef(expandedMatches);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        resultsRef.current = results;
        highlightQueryRef.current = highlightQuery;
        expandedRef.current = expandedMatches;
    });

    const setCardExpanded = useCallback((cardIndex: number, expanded: boolean) => {
        const media = resultsRef.current[cardIndex]?.media;
        if (!media) return;
        setExpandedMatches((prev) => {
            const next = new Set(prev);
            if (expanded) next.add(getResultKey(media));
            else next.delete(getResultKey(media));
            return next;
        });
    }, []);

    const expandCard = useCallback((cardIndex: number) => setCardExpanded(cardIndex, true), [setCardExpanded]);
    const collapseCard = useCallback((cardIndex: number) => setCardExpanded(cardIndex, false), [setCardExpanded]);
    const isCardExpanded = useCallback((cardIndex: number) => {
        const media = resultsRef.current[cardIndex]?.media;
        return media ? expandedRef.current.has(getResultKey(media)) : false;
    }, []);

    const getHref = useCallback((cardIndex: number, passageIndex: number) => {
        const result = resultsRef.current[cardIndex];
        if (!result) return null;
        // Card level opens the strongest passage, like the card's own thumbnail link.
        const match = result.matches[Math.max(0, passageIndex)];
        return match
            ? getMatchHref(result.media, match, highlightQueryRef.current)
            : getMediaLink(result.media, highlightQueryRef.current);
    }, []);

    const navigate = useCallback((href: string) => router.push(href), [router]);

    const navBounds = useMemo(
        () => ({
            cardCount: results.length,
            passageCountFor: (cardIndex: number) => resultsRef.current[cardIndex]?.matches.length ?? 0,
        }),
        [results.length],
    );

    const nav = useSearchKeyboardNav({ bounds: navBounds, getHref, navigate, expandCard, collapseCard, isCardExpanded });

    useEffect(() => {
        nav.reset();
    }, [results, nav.reset]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!nav.activeNodeId) return;
        // A passage revealed by auto-expansion mounts on the next frame.
        const nodeId = nav.activeNodeId;
        const frame = requestAnimationFrame(() => {
            document.getElementById(nodeId)?.scrollIntoView({ block: 'nearest' });
        });
        return () => cancelAnimationFrame(frame);
    }, [nav.activeNodeId]);

    // Keeps the address bar shareable without pushing a history entry per keystroke or
    // filter change. router.push would also trigger an RSC request on every change; the
    // search is entirely client-driven, so there is nothing to refetch.
    const syncUrl = useCallback((searchQuery: string, selected: SourceFilter[], order: SearchSort) => {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selected.length > 0) params.set('filters', selected.join(','));
        if (order !== 'relevance') params.set('sort', order);

        const nextUrl = params.toString() ? `/search?${params.toString()}` : '/search';
        if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
            window.history.replaceState(null, '', nextUrl);
        }
    }, []);

    const runQuery = useCallback(async (offset: number) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        // Supersede any in-flight request so a slow earlier response can never overwrite
        // the results of a newer query.
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        lastOffsetRef.current = offset;

        if (offset === 0) setIsSearching(true);
        else setIsLoadingMore(true);
        setErrorMsg(null);

        try {
            const params = new URLSearchParams({ q: trimmed, limit: String(PAGE_SIZE), offset: String(offset) });
            if (sources.length > 0) params.set('filters', sources.join(','));
            if (sort !== 'relevance') params.set('sort', sort);

            const startedAt = performance.now();
            const response = await fetch(`/api/search?${params.toString()}`, { signal: controller.signal });
            const latencyMs = performance.now() - startedAt;
            if (!response.ok) {
                setErrorMsg(response.status === 429
                    ? 'Too many searches in a short time. Please wait a moment and try again.'
                    : 'Search failed. Please try again shortly.');
                return;
            }

            const payload = (await response.json()) as SearchResponse;
            // Results are only swapped once the new set has arrived, so a new query never
            // blanks the list mid-flight.
            setResults((prev) => (offset === 0 ? payload.results : [...prev, ...payload.results]));
            setTotal(payload.total);
            setTotalMatches(payload.totalMatches);
            setCounts(payload.counts);
            setResultsQuery(trimmed);

            if (offset === 0) {
                setExpandedMatches(new Set());
                logSearchEvent({
                    name: 'search.query',
                    query: trimmed,
                    filterCount: sources.length,
                    resultCount: payload.total,
                    latencyMs,
                });
            }
        } catch {
            if (controller.signal.aborted) return;
            setErrorMsg(CONNECTION_ERROR);
        } finally {
            // A superseded request must not clear the loading state its successor set.
            if (!controller.signal.aborted) {
                setIsSearching(false);
                setIsLoadingMore(false);
            }
        }
    }, [query, sources, sort]);

    useEffect(() => {
        // The first run (a shared link) and changes to sources or sort go out at once; only
        // typing is debounced. The URL is synced at the same settle point, independent of
        // the outcome, so a failed or rate-limited search still leaves a shareable URL.
        const trimmed = query.trim();
        const settled = settledQueryRef.current;
        const delay = !trimmed || settled === null || settled === query ? 0 : TYPING_DEBOUNCE_MS;
        if (!trimmed) abortRef.current?.abort();

        const timer = setTimeout(() => {
            settledQueryRef.current = query;
            syncUrl(query, sources, sort);
            if (trimmed) {
                void runQuery(0);
                return;
            }
            setResults([]);
            setTotal(0);
            setTotalMatches(0);
            setCounts(null);
            setResultsQuery(null);
            setExpandedMatches(new Set());
            setErrorMsg(null);
            // The aborted request skips its own reset, so clear the loading state here.
            setIsSearching(false);
            setIsLoadingMore(false);
        }, delay);
        debounceRef.current = timer;

        return () => clearTimeout(timer);
    }, [query, sources, sort, runQuery, syncUrl]);

    useEffect(() => () => abortRef.current?.abort(), []);

    // Suggestions are advisory, so failures are swallowed rather than surfaced. Results
    // are cached per prefix, so retyping a prefix never costs a second request.
    useEffect(() => {
        const needle = query.trim();

        if (needle && submittedQueryRef.current === needle) {
            suggestAbortRef.current?.abort();
            setSuggestions([]);
            setSuggestOpen(false);
            return;
        }

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
            suggestAbortRef.current?.abort();
            const timer = setTimeout(() => {
                if (submittedQueryRef.current === needle) return;
                setSuggestions(cached);
                setSuggestOpen(cached.length > 0);
            }, 0);
            return () => clearTimeout(timer);
        }

        const timer = setTimeout(async () => {
            // Enter can land inside the debounce; a submitted query keeps the dropdown closed.
            if (submittedQueryRef.current === needle) return;
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
                // Aborted or offline: leave whatever is on screen alone.
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [query]);

    // Delegated so clicks are captured without threading a callback through every card,
    // and limited to links that open the source, not Save or the expander.
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;

        const onClick = (event: MouseEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target?.closest('[data-result-link]')) return;
            const row = target.closest<HTMLElement>('[data-media-id]');
            const rank = Number(row?.dataset.resultRank);
            if (!row || !Number.isFinite(rank)) return;

            logSearchEvent({
                name: 'search.click',
                query: highlightQueryRef.current,
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
            if (!searchFieldRef.current?.contains(event.target as Node)) setSuggestOpen(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [suggestOpen]);

    const toggleMatches = useCallback((itemKey: string) => {
        setExpandedMatches((prev) => {
            const next = new Set(prev);
            if (next.has(itemKey)) next.delete(itemKey);
            else next.add(itemKey);
            return next;
        });
    }, []);

    const toggleSource = useCallback((key: SourceFilter) => {
        // Selecting every source collapses back to "All".
        setSources((prev) => normalizeSourceFilters(prev.includes(key) ? prev.filter((value) => value !== key) : [...prev, key]));
    }, []);

    const handleSearchSubmit = useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        settledQueryRef.current = query;
        submittedQueryRef.current = query.trim();
        suggestAbortRef.current?.abort();
        setSuggestions([]);
        setSuggestOpen(false);
        syncUrl(query, sources, sort);
        void runQuery(0);
    }, [query, sources, sort, runQuery, syncUrl]);

    const runExample = useCallback((example: string) => {
        // Marked settled first so it runs at once instead of waiting out the typing debounce.
        settledQueryRef.current = example;
        submittedQueryRef.current = example;
        setQuery(example);
    }, []);

    const clearSearchQuery = useCallback(() => {
        submittedQueryRef.current = null;
        setQuery('');
        setSuggestions([]);
        setSuggestOpen(false);
        // The clear button unmounts with the query, so keep focus in the field.
        document.getElementById('archive-search-input')?.focus();
    }, []);

    const allCount = counts ? Object.values(counts).reduce((sum, count) => sum + count, 0) : undefined;
    const showEmpty = resultsQuery !== null && !isSearching && !errorMsg && results.length === 0;
    const showIdle = !query.trim() && resultsQuery === null;

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
                <div className="mx-auto max-w-5xl px-4 py-8 sm:px-7 lg:py-12">
                    <header className="mb-7 border-b border-ed-rule pb-7">
                        <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-[4px] border border-ed-accent/15 bg-ed-accent-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ed-accent">
                            <Search className="h-3 w-3" aria-hidden="true" />
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
                            Transcripts, newsletters, appendices and books, searched together.
                        </p>
                    </header>

                    <div className="space-y-5">
                        <div className="space-y-4 rounded-[8px] border border-ed-rule bg-ed-surface p-4 shadow-sm sm:p-5">
                            <form onSubmit={handleSearchSubmit} className="flex w-full items-center gap-2">
                                <div ref={searchFieldRef} className="relative z-20 min-w-0 flex-1">
                                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" aria-hidden="true" />
                                    <input
                                        id="archive-search-input"
                                        name="q"
                                        type="text"
                                        enterKeyHint="search"
                                        autoComplete="off"
                                        value={query}
                                        onChange={(event) => {
                                            submittedQueryRef.current = null;
                                            setQuery(event.target.value);
                                        }}
                                        placeholder="Search transcripts, perspectives, appendices..."
                                        aria-label="Search transcripts, perspectives, appendices"
                                        className="w-full rounded-[4px] border border-ed-rule bg-ed-bg py-2.5 pl-10 pr-10 text-base text-ed-fg outline-none transition-colors placeholder:text-ed-fg-muted focus:border-ed-rule-strong"
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
                                            className="absolute right-2.5 top-1/2 z-20 -translate-y-1/2 rounded-[4px] p-1 text-ed-fg-muted hover:text-ed-fg"
                                            aria-label="Clear search query"
                                        >
                                            <X className="h-4 w-4" aria-hidden="true" />
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

                                <button
                                    type="submit"
                                    disabled={!query.trim()}
                                    className="inline-flex shrink-0 items-center justify-center rounded-[4px] bg-ed-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-ed-surface-strong disabled:text-ed-fg-muted dark:text-[#0F0E0D]"
                                >
                                    Search
                                </button>
                            </form>

                            <div
                                role="group"
                                aria-label="Filter by source"
                                className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible"
                            >
                                <SourceChip label="All" count={allCount} pressed={sources.length === 0} onClick={() => setSources([])} />
                                {SOURCE_FILTERS.map(({ key, label }) => {
                                    const pressed = sources.includes(key);
                                    return (
                                        <SourceChip
                                            key={key}
                                            label={label}
                                            count={counts?.[key]}
                                            pressed={pressed}
                                            disabled={!pressed && counts !== null && counts[key] === 0}
                                            onClick={() => toggleSource(key)}
                                        />
                                    );
                                })}
                            </div>

                            {/* Recognised query operators, so it is visible when syntax took effect */}
                            {hasOperators(parsedQuery) ? (
                                <div className="flex flex-wrap items-center gap-1.5" aria-label="Active query operators">
                                    {parsedQuery.types.map((type) => (
                                        <span key={`type-${type}`} className={OPERATOR_CHIP_CLASS}>type:{type}</span>
                                    ))}
                                    {parsedQuery.exclusions.map((term) => (
                                        <span key={`not-${term}`} className={OPERATOR_CHIP_CLASS}>excluding {term}</span>
                                    ))}
                                    {parsedQuery.after !== undefined ? <span className={OPERATOR_CHIP_CLASS}>after {parsedQuery.after}</span> : null}
                                    {parsedQuery.before !== undefined ? <span className={OPERATOR_CHIP_CLASS}>before {parsedQuery.before}</span> : null}
                                </div>
                            ) : null}
                        </div>

                        {errorMsg ? (
                            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-red-500/25 bg-ed-surface px-4 py-3 text-sm">
                                <span className="text-red-700 dark:text-[#f6ae82]">{errorMsg}</span>
                                <button
                                    type="button"
                                    onClick={() => void runQuery(lastOffsetRef.current)}
                                    className="rounded-[4px] border border-ed-rule px-3 py-1.5 text-xs font-semibold text-ed-fg transition-colors hover:border-ed-rule-strong"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : null}

                        <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-ed-rule pb-3 ${showIdle ? 'sr-only' : ''}`}>
                            <p className="text-sm text-ed-fg-muted" aria-live="polite">
                                {resultsQuery !== null ? (
                                    <>
                                        <span className="font-semibold text-ed-fg">{total.toLocaleString()}</span> {total === 1 ? 'source' : 'sources'}
                                        {' · '}
                                        <span className="font-semibold text-ed-fg">{totalMatches.toLocaleString()}</span> {totalMatches === 1 ? 'passage' : 'passages'}
                                    </>
                                ) : 'Search across the preserved archive'}
                                {isSearching && results.length > 0 ? ' · Updating…' : ''}
                            </p>
                            {resultsQuery !== null ? (
                                <label className="inline-flex items-center gap-2 text-xs text-ed-fg-muted">
                                    Sort
                                    <select
                                        aria-label="Sort results"
                                        value={sort}
                                        onChange={(event) => setSort(parseSort(event.target.value))}
                                        className="rounded-[4px] border border-ed-rule bg-ed-surface px-2 py-1.5 text-xs text-ed-fg outline-none transition-colors hover:border-ed-rule-strong focus-visible:border-ed-rule-strong"
                                    >
                                        {SORT_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : null}
                        </div>

                        {showIdle ? (
                            <section aria-label="Search tips" className="rounded-[8px] border border-ed-rule bg-ed-surface p-5 sm:p-6">
                                <h2 className="text-sm font-semibold text-ed-fg">Try a search</h2>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {EXAMPLE_QUERIES.map((example) => (
                                        <button
                                            key={example}
                                            type="button"
                                            onClick={() => runExample(example)}
                                            className="rounded-[4px] border border-ed-rule bg-ed-bg px-2.5 py-1.5 font-mono text-xs text-ed-fg-secondary transition-colors hover:border-ed-rule-strong hover:text-ed-fg"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                                <dl className="mt-5 grid gap-x-8 gap-y-2.5 border-t border-ed-rule pt-4 text-sm sm:grid-cols-2">
                                    {SYNTAX_TIPS.map((tip) => (
                                        <div key={tip.syntax} className="flex gap-3">
                                            <dt className="w-28 shrink-0 font-mono text-xs leading-5 text-ed-accent">{tip.syntax}</dt>
                                            <dd className="text-ed-fg-muted">{tip.meaning}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </section>
                        ) : null}

                        <div ref={listRef} id="search-results" role="listbox" aria-label="Search results">
                            {/* Skeletons only when there is nothing to keep on screen; an existing
                                result set is dimmed and left in place instead. */}
                            {isSearching && results.length === 0 ? (
                                <div aria-live="polite" className="space-y-4">
                                    <span className="sr-only">Searching the archive...</span>
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} aria-hidden="true" className="flex animate-pulse gap-4 rounded-[8px] border border-ed-rule bg-ed-surface p-5">
                                            <div className="aspect-video w-24 shrink-0 rounded-[6px] bg-ed-surface-strong sm:w-36" />
                                            <div className="flex-1 space-y-3 py-1">
                                                <div className="h-3 w-1/4 rounded bg-ed-surface-strong" />
                                                <div className="h-4 w-2/3 rounded bg-ed-surface-strong" />
                                                <div className="h-3 w-full rounded bg-ed-surface-strong" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}

                            {showEmpty ? (
                                <div className="rounded-[8px] border border-dashed border-ed-rule bg-ed-surface px-6 py-12 text-center">
                                    <p
                                        className="text-xl font-semibold text-ed-fg"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        No matches for &ldquo;{resultsQuery}&rdquo;
                                    </p>
                                    <p className="mx-auto mt-2 max-w-md text-sm text-ed-fg-muted">
                                        {sources.length > 0
                                            ? 'Nothing matched in the selected sources.'
                                            : 'Check the spelling, try fewer or more general words, or remove quotes and operators.'}
                                    </p>
                                    {sources.length > 0 ? (
                                        <button
                                            type="button"
                                            onClick={() => setSources([])}
                                            className="mt-5 rounded-[4px] border border-ed-rule px-4 py-2 text-xs font-semibold text-ed-fg transition-colors hover:border-ed-rule-strong"
                                        >
                                            Search all sources
                                        </button>
                                    ) : null}
                                </div>
                            ) : null}

                            {results.length > 0 ? (
                                <div className={`space-y-4 transition-opacity duration-200 ${isSearching ? 'opacity-50' : 'opacity-100'}`}>
                                    {results.map((result, index) => {
                                        const itemKey = getResultKey(result.media);
                                        return (
                                            <div
                                                key={itemKey}
                                                data-media-id={result.media.id}
                                                data-result-rank={index}
                                                data-match-kind={result.matches[0]?.kind}
                                            >
                                                <SearchResultCard
                                                    result={result}
                                                    query={highlightQuery}
                                                    cardIndex={index}
                                                    active={nav.activeCardIndex === index ? nav.activePassageIndex : null}
                                                    expanded={expandedMatches.has(itemKey)}
                                                    onToggle={() => toggleMatches(itemKey)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </div>

                        {!isSearching && results.length > 0 && results.length < total ? (
                            <div className="flex justify-center pt-2">
                                <button
                                    type="button"
                                    onClick={() => void runQuery(results.length)}
                                    disabled={isLoadingMore}
                                    className="rounded-[4px] border border-ed-rule bg-ed-surface px-6 py-2.5 text-sm font-medium text-ed-fg-secondary transition-colors hover:border-ed-rule-strong hover:text-ed-fg disabled:opacity-50"
                                >
                                    {isLoadingMore ? 'Loading…' : `Load More Results (${total - results.length} remaining)`}
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
