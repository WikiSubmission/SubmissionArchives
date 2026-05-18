'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Play, Search } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { getMediaHref } from '@/lib/utils';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import { getHighlightTerms } from '@/lib/search/queryMatch';
import { searchTranscripts } from './actions';
import quranStudyThumbnails from '@/data/quran_study_thumbnails.json';
import thumbnailMapping from '@/data/thumbnail_mapping.json';

type FilterKey =
    | 'video'
    | 'quran-study'
    | 'messenger-audio'
    | 'perspective'
    | 'appendix';

type SearchMatch = {
    id: string;
    content: string;
    start_time: number;
    page?: number;
    score?: number;
    kind?: string;
    distance?: number;
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
        ],
    },
];

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialQuery = searchParams.get('q') || '';
    const initialFilters = searchParams.get('filters')?.split(',') || [];
    const initialNear = Number(searchParams.get('near') || 18);

    const [query, setQuery] = useState(initialQuery);
    const [proximityWindow] = useState(Number.isFinite(initialNear) ? Math.min(40, Math.max(2, initialNear)) : 18);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
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

    const updateURL = (
        searchQuery: string,
        currentFilters: Record<FilterKey, boolean>,
        currentProximityWindow: number,
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

        if (currentProximityWindow !== 18) {
            params.set('near', String(currentProximityWindow));
        }

        const nextUrl = params.toString() ? `/search?${params.toString()}` : '/search';
        router.push(nextUrl, { scroll: false });
    };

    const handleSearch = async () => {
        if (!query.trim()) {
            setResults([]);
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

            const response = await searchTranscripts(query, typeFilters, { proximityWindow });
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
            updateURL(query, filters, proximityWindow);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            setErrorMsg(message);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
        if (initialQuery && results.length === 0 && !isSearching) {
            void handleSearch();
        }
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, filters, proximityWindow]);

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


            <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <section className="relative overflow-hidden rounded-[1.25rem] bg-black/[0.02] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.02)] dark:bg-[#0a0a0a]/40 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl grid gap-8 p-5 sm:p-7 lg:grid-cols-[0.85fr_1.15fr] lg:p-8">
                    {/* Ambient Center Glow */}
                    <div className="pointer-events-none absolute left-1/2 top-0 hidden h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--ed-accent)] opacity-[0.06] blur-[120px] dark:opacity-[0.12] sm:block" />

                    <div className="relative z-10 flex flex-col items-center space-y-5 text-center lg:col-span-2">
                        <div className="inline-flex items-center gap-3 rounded-full bg-black/[0.02] px-4 py-2 text-ed-accent shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
                            <Search className="h-4 w-4" />
                            <span className="text-[0.68rem] font-medium uppercase tracking-[0.28em]">
                                Archive search
                            </span>
                        </div>
                        <h1 className="max-w-full whitespace-nowrap font-display text-[clamp(0.72rem,3vw,2.9rem)] leading-none text-transparent bg-clip-text bg-gradient-to-br from-ed-fg via-ed-fg to-ed-fg-muted drop-shadow-sm">
                            Find exact words, nearby ideas, and buried passages.
                        </h1>
                        <p className="max-w-full whitespace-nowrap font-sans text-[clamp(0.38rem,1.1vw,0.92rem)] font-semibold leading-7 tracking-[0.01em] text-ed-fg-muted">
                            Search normally. Exact phrases, close word clusters, and repeated terms rise together
                            so the strongest findings stay at the top.
                        </p>
                    </div>

                    <div className="relative z-10 grid gap-5 lg:col-span-2 lg:grid-cols-[0.95fr_1.05fr] lg:self-end">
                        <div className="rounded-2xl bg-black/[0.02] p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] backdrop-blur-md dark:bg-[#0a0a0a]/50 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-[0.66rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                        Ranked automatically
                                    </p>
                                    <p className="mt-1 text-[15px] leading-6 text-ed-fg">
                                        Closest findings appear first.
                                    </p>
                                </div>
                                <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ed-accent font-medium">
                                    exact + nearby + repeated
                                </span>
                            </div>
                            <div className="mt-5 flex flex-wrap gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-ed-fg-muted">
                                <button type="button" onClick={() => setQuery('"God alone"')} className="rounded-full bg-black/[0.03] px-4 py-2 font-medium shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all hover:bg-black/[0.06] hover:text-ed-accent dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.04]">
                                    &quot;God alone&quot;
                                </button>
                                <button type="button" onClick={() => setQuery('messenger covenant')} className="rounded-full bg-black/[0.03] px-4 py-2 font-medium shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all hover:bg-black/[0.06] hover:text-ed-accent dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.04]">
                                    messenger covenant
                                </button>
                                <button type="button" onClick={() => setQuery('quran mathematical miracle')} className="rounded-full bg-black/[0.03] px-4 py-2 font-medium shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all hover:bg-black/[0.06] hover:text-ed-accent dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.04]">
                                    mathematical miracle
                                </button>
                            </div>
                        </div>

                        <div className="rounded-2xl bg-black/[0.02] p-5 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] backdrop-blur-md dark:bg-[#0a0a0a]/50 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] space-y-5">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                <p className="text-[0.66rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                    Searchable collections
                                </p>
                                <p className="text-xs leading-5 text-ed-fg-muted">
                                    Videos, two audio archives, perspectives, and appendices.
                                </p>
                            </div>
                            {FILTER_ROWS.map((row) => (
                                <div key={row.label} className="flex flex-col gap-2 sm:grid sm:grid-cols-[88px_1fr] sm:items-center">
                                    <span className="text-[0.68rem] uppercase tracking-[0.2em] text-ed-fg-muted">
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
                        className="relative lg:col-span-2"
                    >
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ed-fg-muted" />
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search transcripts, perspectives, appendices..."
                            className="w-full rounded-[1.25rem] border border-black/5 bg-black/[0.02] px-12 py-4 pr-28 text-base text-ed-fg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.02)] outline-none backdrop-blur-md transition-all placeholder:text-ed-fg-muted/70 focus:bg-black/[0.04] focus:shadow-[inset_0_0_0_1px_var(--ed-accent),0_10px_40px_rgba(0,0,0,0.05)] sm:py-5 sm:text-lg dark:border-white/5 dark:bg-[#0a0a0a]/50 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.5)] dark:focus:bg-[#0a0a0a]/80 dark:focus:shadow-[inset_0_0_0_1px_var(--ed-accent),0_20px_60px_rgba(0,0,0,0.8)]"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-[1rem] bg-black/[0.03] px-4 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-ed-fg shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all hover:bg-black/[0.06] hover:text-ed-accent sm:px-5 sm:py-2.5 dark:bg-white/[0.02] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)] dark:hover:bg-white/[0.04]"
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
                        {rankedResults.map((result, index) => {
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
            <div className={`grid gap-5 p-4 sm:p-5 lg:p-6 ${
                isDocument ? 'lg:grid-cols-[156px_1fr]' : 'lg:grid-cols-[210px_1fr]'
            }`}>
                <Link
                    href={bestHref}
                    className={`soft-panel group relative overflow-hidden ${
                        isDocument
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
                        className={`h-full w-full transition duration-500 group-hover:scale-[1.03] ${
                            isDocument ? 'object-contain' : 'object-cover'
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
                                    {media.alternateNumberLabel ? ` | ${media.alternateNumberLabel}` : ''}
                                </p>
                            ) : null}
                        </Link>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                            <SignalBadge score={result.bestScore ?? mediaBestScore(matches)} />
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
                        <div className="divide-y divide-ed-rule">
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
                            onClick={onToggle}
                            className="mt-4 soft-pill px-4 py-2 text-[0.66rem] uppercase tracking-[0.2em] text-ed-fg-muted transition hover:border-ed-accent hover:text-ed-accent"
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
        <div className="grid gap-3 py-4 sm:grid-cols-[104px_1fr]">
            <Link
                href={href}
                className="soft-pill inline-flex h-fit w-fit px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.18em] text-ed-accent transition hover:border-ed-accent"
            >
                {isDocumentType(media.type) ? 'Open text' : formatTime(match.start_time)}
            </Link>
            <div>
                <div className="mb-2 flex flex-wrap gap-2">
                    {match.kind ? <MatchKindPill match={match} /> : null}
                </div>
                <p
                    className="text-sm leading-7 text-ed-fg-muted"
                    dangerouslySetInnerHTML={{
                        __html: highlightMatch(match.content, query),
                    }}
                />
            </div>
        </div>
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
            className={`soft-pill inline-flex items-center px-4 py-2.5 text-[0.68rem] uppercase tracking-[0.18em] transition ${
                active
                    ? 'border-ed-accent bg-ed-accent/12 text-ed-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]'
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
    return ['perspective', 'appendix', 'other'].includes(type);
}

function getMediaLink(media: SearchResultMedia, query: string) {
    if (isDocumentType(media.type)) {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (typeof media.page === 'number') params.append('page', String(media.page));
        return `/library/${media.id}?${params.toString()}`;
    }

    return getMediaHref(media.id);
}

function getDocumentMatchLink(media: SearchResultMedia, match: SearchMatch, query: string) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);

    const page = typeof match.page === 'number' ? match.page : media.page;
    if (typeof page === 'number') {
        params.append('page', String(page));
    }

    const queryString = params.toString();
    return queryString ? `/library/${media.id}?${queryString}` : `/library/${media.id}`;
}

function getThumbnailSrc(media: SearchResultMedia) {
    if (media.thumbnailOverride) {
        return getPublicAssetUrl(media.thumbnailOverride);
    }

    if (media.type === 'sermon') {
        const mappedFilename = (thumbnailMapping as Record<string, string>)[media.id];
        return mappedFilename
            ? `/images/sermons/${mappedFilename}.jpg`
            : `/images/sermons/${getCleanMediaId(media.id)}.jpg`;
    }

    if (media.type === 'video-program') {
        const mappedFilename = (thumbnailMapping as Record<string, string>)[media.id];
        return mappedFilename
            ? `/images/video-programs/${mappedFilename}.jpg`
            : `/images/video-programs/${getCleanMediaId(media.id)}.jpg`;
    }

    if (media.type === 'audio' || media.type === 'messenger-audio') {
        return getPublicAssetUrl('/content/audio/messenger-audios/default.jpg');
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

function getCleanMediaId(id: string) {
    return id
        .replace(/^media\/(FRIDAY SERMONS|VIDEO PROGRAMS|disorganized_sermons|rk_video_programs)\//, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w\-_.]/g, '')
        .replace(/\.mp4$/, '');
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
