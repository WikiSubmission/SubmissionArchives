'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Search } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { getMediaHref } from '@/lib/utils';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import { searchTranscripts } from './actions';
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

const FILTER_ROWS: Array<{ label: string; items: Array<{ key: FilterKey; label: string }> }> = [
    {
        label: 'Media',
        items: [
            { key: 'video', label: 'Videos' },
            { key: 'quran-study', label: 'Quran studies' },
            { key: 'messenger-audio', label: 'Messenger audios' },
        ],
    },
    {
        label: 'Texts',
        items: [
            { key: 'perspective', label: 'Submitter Perspectives' },
            { key: 'appendix', label: 'Appendices' },
            { key: 'other', label: 'Books' },
        ],
    },
    {
        label: 'Scripture',
        items: [
            { key: 'quran', label: "Qur'an" },
        ],
    },
];

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

    const toggleFilter = (key: FilterKey) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

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

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">


            <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <section className="grid gap-8 border-y border-ed-rule py-10 sm:py-12 lg:grid-cols-[0.85fr_1.15fr]">
                    <div className="relative z-10 space-y-5 lg:col-span-2">
                        <div className="inline-flex items-center gap-3 border-l-2 border-ed-accent pl-3 text-ed-accent">
                            <Search className="h-4 w-4" />
                            <span className="archive-kicker">
                                Archive search
                            </span>
                        </div>
                        <h1 className="!mt-8 max-w-[18ch] font-display text-[clamp(2.75rem,6vw,5rem)] leading-[0.92] text-ed-fg">
                            Find exact words and buried passages.
                        </h1>
                        <p className="max-w-[70ch] text-base leading-8 text-ed-fg-muted sm:text-lg">
                            Search recordings, transcripts, books, newsletters, appendices, and all three Qur&apos;an editions. Exact phrases and nearby terms are ranked automatically.
                        </p>
                    </div>

                    <div className="relative z-10 order-3 grid gap-8 border-t border-ed-rule pt-8 lg:col-span-2 lg:grid-cols-[0.8fr_1.2fr] lg:self-end">
                        <div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="archive-kicker text-ed-fg-muted">
                                        Try a search
                                    </p>
                                    <p className="mt-1 text-[15px] leading-6 text-ed-fg">
                                        Closest findings appear first.
                                    </p>
                                </div>
                                <span className="text-xs font-medium text-ed-accent">
                                    exact + nearby + repeated
                                </span>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2 text-sm text-ed-fg-muted">
                                <button type="button" onClick={() => setQuery('"God alone"')} className="archive-button archive-button-secondary min-h-11 px-4">
                                    &quot;God alone&quot;
                                </button>
                                <button type="button" onClick={() => setQuery('messenger covenant')} className="archive-button archive-button-secondary min-h-11 px-4">
                                    messenger covenant
                                </button>
                                <button type="button" onClick={() => setQuery('quran mathematical miracle')} className="archive-button archive-button-secondary min-h-11 px-4">
                                    mathematical miracle
                                </button>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                <p className="archive-kicker text-ed-fg-muted">
                                    Searchable collections
                                </p>
                                <p className="text-xs leading-5 text-ed-fg-muted">
                                    Videos, two audio archives, perspectives, appendices, books, and the Qur&apos;an.
                                </p>
                            </div>
                            {FILTER_ROWS.map((row) => (
                                <div key={row.label} className="flex flex-col gap-2 sm:grid sm:grid-cols-[88px_1fr] sm:items-center">
                                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
                                        {row.label}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {row.items.map((item) => (
                                            <FilterButton
                                                key={item.key}
                                                active={filters[item.key]}
                                                onClick={() => toggleFilter(item.key)}
                                                label={item.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleSearch();
                        }}
                        className="relative order-2 lg:col-span-2"
                    >
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ed-fg-muted" />
                        <label htmlFor="archive-search-input" className="sr-only">
                            Search transcripts, perspectives, appendices
                        </label>
                        <input
                            id="archive-search-input"
                            name="q"
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search the archive..."
                            className="archive-input w-full py-4 pl-12 pr-28 text-base sm:min-h-16 sm:text-lg"
                        />
                        <button
                            type="submit"
                            className="archive-button archive-button-primary absolute right-2 top-1/2 -translate-y-1/2 px-5"
                        >
                            Search
                        </button>
                    </form>
                </section>

                {errorMsg ? (
                    <div className="soft-panel mt-8 p-4 text-sm text-[#961515] dark:text-[#f6ae82]">
                        {errorMsg}
                    </div>
                ) : null}

                <section className="mt-8 space-y-6">
                    {isSearching ? (
                        <div className="soft-shell px-6 py-14 text-center text-[0.72rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                            Searching the archive...
                        </div>
                    ) : null}

                    {!isSearching && query && results.length === 0 ? (
                        <div className="soft-shell px-6 py-14 text-center">
                            <p className="font-display text-3xl text-ed-fg">No matches found.</p>
                            <p className="mt-3 text-sm leading-7 text-ed-fg-muted">
                                Try a shorter phrase, remove a filter, or search by title keywords.
                            </p>
                        </div>
                    ) : null}

                    {!isSearching && results.length > 0 ? (
                        <div className="flex flex-col gap-3 border-b border-ed-rule pb-4 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    Best matches first
                                </p>
                                <p className="mt-1 font-display text-3xl text-ed-fg">
                                    {results.length} documents, {totalMatches} passages
                                </p>
                            </div>
                            <p className="whitespace-nowrap text-[clamp(0.52rem,2.7vw,0.875rem)] leading-6 text-ed-fg-muted sm:text-right">
                                Exact phrases and nearby terms are already folded into the ranking.
                            </p>
                        </div>
                    ) : null}

                    <div className="space-y-5">
                        {rankedResults.slice(0, visibleCount).map((result, index) => {
                            const itemKey = `${result.media.id}${result.media.page ? `-${result.media.page}` : ''}`;
                            return (
                                <SearchResultCard
                                    key={itemKey}
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
                        <div className="flex justify-center pt-8">
                            <button
                                type="button"
                                onClick={() => setVisibleCount((prev) => prev + 10)}
                                className="soft-pill px-6 py-3 text-sm font-semibold uppercase tracking-widest text-ed-fg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-ed-accent focus-visible:ring-offset-2"
                            >
                                Load more results
                            </button>
                        </div>
                    ) : null}
                </section>
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
}: {
    result: SearchResult;
    query: string;
    rank: number;
    expanded: boolean;
    onToggle: () => void;
}) {
    const { media, matches } = result;
    const mediaLink = getMediaLink(media, query);
    const thumbnailSrc = getThumbnailSrc(media);
    const isDocument = isDocumentType(media.type);
    const visibleMatches = expanded ? matches : matches.slice(0, 2);
    const bestMatch = matches[0];
    const bestHref = bestMatch
        ? isDocumentType(media.type)
            ? getDocumentMatchLink(media, bestMatch, query)
            : `${mediaLink}?t=${Math.floor(bestMatch.start_time)}`
        : mediaLink;

    return (
        <article className={`soft-shell overflow-hidden ${isDocument ? 'bg-ed-muted/20' : ''}`}>
            <div className={`grid gap-5 p-4 sm:p-5 lg:p-6 ${isDocument ? 'lg:grid-cols-[156px_1fr]' : 'lg:grid-cols-[210px_1fr]'
                }`}>
                <Link
                    href={bestHref}
                    className={`soft-panel group relative overflow-hidden ${isDocument
                            ? 'mx-auto aspect-[3/4] w-full max-w-[176px] rounded-[0.85rem] bg-ed-bg p-2 shadow-[0_18px_44px_rgba(31,26,20,0.12)]'
                            : 'aspect-video'
                        }`}
                    aria-label={`Open ${media.displayTitle || media.title}`}
                >
                    <Image
                        src={thumbnailSrc}
                        alt={media.displayTitle || media.title}
                        fill
                        quality={60}
                        sizes={isDocument ? '(max-width: 1024px) 176px, 156px' : '(max-width: 1024px) 100vw, 210px'}
                        className={`h-full w-full transition duration-500 group-hover:scale-[1.03] ${isDocument ? 'object-contain' : 'object-cover'
                            }`}
                    />
                    {!isDocument ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(12,12,12,0.16)]">
                            <div className="soft-pill p-2 text-ed-fg shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
                                <Play className="h-4 w-4 fill-current" />
                            </div>
                        </div>
                    ) : null}
                </Link>

                <div className="min-w-0">
                    <div className="flex flex-col gap-4 border-b border-ed-rule pb-5 sm:flex-row sm:items-start sm:justify-between">
                        <Link href={mediaLink} className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-ed-accent">
                                    {String(rank).padStart(2, '0')}
                                </span>
                                <span className="soft-pill px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-ed-fg-muted">
                                    {getMediaTypeLabel(media.type)}
                                </span>
                                {media.displayDate ? (
                                    <span className="text-[0.68rem] uppercase tracking-[0.18em] text-ed-fg-muted">
                                        {media.displayDate}
                                    </span>
                                ) : null}
                            </div>
                            <h3 className="mt-3 font-display text-3xl leading-tight text-ed-fg sm:text-4xl">
                                {media.displayTitle || media.title}
                            </h3>
                            {media.author ? (
                                <p className="mt-2 text-[15px] leading-6 text-ed-fg-muted">
                                    {media.author}
                                </p>
                            ) : null}
                        </Link>

                        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            {bestMatch && getQuranVerseRef(media, bestMatch) ? (
                                <span className="font-mono text-xs font-bold text-ed-fg-muted">
                                    {getQuranVerseRef(media, bestMatch)}
                                </span>
                            ) : null}
                            <SignalBadge score={result.bestScore ?? mediaBestScore(matches)} />
                            {bestMatch?.label ? <ContentLabelPill label={bestMatch.label} /> : null}
                            {bestMatch?.kind ? <MatchKindPill match={bestMatch} /> : null}
                        </div>
                    </div>

                    {bestMatch ? (
                        <Link
                            href={bestHref}
                            className="my-4 block rounded-[1.35rem] border border-ed-rule bg-ed-muted/45 px-4 py-4 transition hover:border-ed-accent/50"
                        >
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ed-accent">
                                    Best passage
                                </span>
                                {getQuranVerseRef(media, bestMatch) ? (
                                    <span className="font-mono text-xs font-bold text-ed-fg">
                                        {getQuranVerseRef(media, bestMatch)}
                                    </span>
                                ) : null}
                                {bestMatch.label ? (
                                    <span className="soft-pill px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-ed-accent">
                                        {getContentLabelText(bestMatch.label)}
                                    </span>
                                ) : null}
                                <span className="soft-pill px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted">
                                    {isDocumentType(media.type) ? 'Open text' : `Play at ${formatTime(bestMatch.start_time)}`}
                                </span>
                            </div>
                            <p
                                className="text-[15px] leading-7 text-ed-fg"
                                dangerouslySetInnerHTML={{
                                    __html: highlightMatch(bestMatch.content, query),
                                }}
                            />
                        </Link>
                    ) : null}

                    {visibleMatches.length > 1 ? (
                        <div>
                            {visibleMatches.slice(1).map((match) => (
                                <SearchMatchRow
                                    key={match.id}
                                    media={media}
                                    mediaLink={mediaLink}
                                    match={match}
                                    query={query}
                                />
                            ))}
                        </div>
                    ) : null}

                    {matches.length > 2 ? (
                        <button
                            type="button"
                            onClick={onToggle}
                            aria-expanded={expanded}
                            className="mt-4 soft-pill inline-flex min-h-11 items-center px-4 py-3 text-[0.66rem] uppercase tracking-[0.2em] text-ed-fg-muted transition hover:border-ed-accent hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        >
                            {expanded ? 'Show fewer passages' : `Show ${matches.length - 2} more passages`}
                        </button>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

function SearchMatchRow({
    media,
    mediaLink,
    match,
    query,
}: {
    media: SearchResultMedia;
    mediaLink: string;
    match: SearchMatch;
    query: string;
}) {
    const href = isDocumentType(media.type)
        ? getDocumentMatchLink(media, match, query)
        : `${mediaLink}?t=${Math.floor(match.start_time)}`;

    return (
        <Link
            href={href}
            className="group flex gap-4 border-t border-ed-rule py-4 transition first:border-t-0 first:pt-3"
        >
            <span className="w-12 shrink-0 pt-0.5 text-right font-mono text-[0.72rem] font-bold tabular-nums text-ed-fg-muted transition-colors group-hover:text-ed-accent sm:w-14">
                {getQuranVerseRef(media, match) || (isDocumentType(media.type) ? 'Text' : formatTime(match.start_time))}
            </span>
            <div className="min-w-0 flex-1 border-l border-ed-rule pl-4 transition-colors group-hover:border-ed-accent/40">
                {match.kind || match.label ? (
                    <span className="mb-1.5 block text-[0.6rem] uppercase tracking-[0.16em] text-ed-fg-muted">
                        {match.label ? `${getContentLabelText(match.label)} · ` : ''}
                        {getMatchKindLabel(match.kind || '')}
                        {typeof match.distance === 'number' && match.kind !== 'single-term'
                            ? ` · ${match.distance} words apart`
                            : ''}
                    </span>
                ) : null}
                <p
                    className="text-sm leading-7 text-ed-fg/90"
                    dangerouslySetInnerHTML={{
                        __html: highlightMatch(match.content, query),
                    }}
                />
            </div>
        </Link>
    );
}

function FilterButton({
    active,
    onClick,
    label,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex min-h-11 items-center rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${active
                    ? 'border-ed-accent bg-ed-accent/10 text-ed-accent'
                    : 'text-ed-fg-muted hover:border-ed-accent/50 hover:text-ed-fg'
                }`}
        >
            {label}
        </button>
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

function MatchKindPill({ match }: { match: SearchMatch }) {
    return (
        <span className="soft-pill px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-ed-fg-muted">
            {getMatchKindLabel(match.kind || '')}
            {typeof match.distance === 'number' && match.kind !== 'single-term'
                ? `, ${match.distance} words apart`
                : ''}
        </span>
    );
}

function ContentLabelPill({ label }: { label: string }) {
    return (
        <span className="soft-pill border-ed-accent/40 bg-ed-accent/10 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.18em] text-ed-accent">
            {getContentLabelText(label)}
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

function getThumbnailSrc(media: SearchResultMedia) {
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

    return safeText.replace(regex, '<span class="rounded bg-ed-accent/12 px-1 font-semibold text-ed-accent">$1</span>');
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
