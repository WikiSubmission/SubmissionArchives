'use client';

import Image from 'next/image';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    BookOpen,
    ChevronDown,
    FileText,
    Headphones,
    Play,
    Search,
    Video,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { formatMedia } from '@/lib/formatUtils';
import { getMediaHref } from '@/lib/utils';
import { searchTranscripts } from './actions';
import quranStudyThumbnails from '@/data/quran_study_thumbnails.json';

type FilterKey =
    | 'sermon'
    | 'quran-study'
    | 'video-program'
    | 'audio'
    | 'perspective'
    | 'appendix'
    | 'other';

type SearchMatch = {
    id: string;
    content: string;
    start_time: number;
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
};

type SearchResult = {
    media: SearchResultMedia;
    matches: SearchMatch[];
};

const FILTER_ROWS: Array<{ label: string; items: Array<{ key: FilterKey; label: string; icon: typeof Video }> }> = [
    {
        label: 'Video',
        items: [
            { key: 'video-program', label: 'Programs', icon: Video },
            { key: 'sermon', label: 'Sermons', icon: Video },
        ],
    },
    {
        label: 'Audio',
        items: [
            { key: 'quran-study', label: 'Quran studies', icon: BookOpen },
            { key: 'audio', label: 'Messenger audios', icon: Headphones },
        ],
    },
    {
        label: 'Written',
        items: [
            { key: 'perspective', label: 'Perspectives', icon: FileText },
            { key: 'appendix', label: 'Appendices', icon: BookOpen },
            { key: 'other', label: 'Other', icon: FileText },
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
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [expandedMatches, setExpandedMatches] = useState<Set<string>>(new Set());
    const [filters, setFilters] = useState<Record<FilterKey, boolean>>({
        sermon: initialFilters.length === 0 || initialFilters.includes('sermon'),
        'quran-study': initialFilters.length === 0 || initialFilters.includes('quran-study'),
        'video-program': initialFilters.length === 0 || initialFilters.includes('video-program'),
        audio: initialFilters.length === 0 || initialFilters.includes('audio'),
        perspective: initialFilters.length === 0 || initialFilters.includes('perspective'),
        appendix: initialFilters.length === 0 || initialFilters.includes('appendix'),
        other: initialFilters.length === 0 || initialFilters.includes('other'),
    });

    const groupedResults = useMemo(() => {
        const groups = new Map<string, SearchResult[]>();

        results.forEach((result) => {
            const type = result.media.type;
            const existing = groups.get(type) || [];
            existing.push(result);
            groups.set(type, existing);
        });

        return Array.from(groups.entries());
    }, [results]);

    const updateURL = (searchQuery: string, currentFilters: Record<FilterKey, boolean>) => {
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
            if (!response.success) {
                throw new Error(response.error || 'Search failed');
            }

            const rawResults = (response.data || []) as SearchResult[];
            const formattedResults = rawResults.map((item) => ({
                ...item,
                media: {
                    ...item.media,
                    ...formatMedia(item.media),
                },
            }));

            setResults(formattedResults);
            updateURL(query, filters);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            setErrorMsg(message);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (initialQuery && results.length === 0 && !isSearching) {
            void handleSearch();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setExpandedMatches(new Set());
            return;
        }

        const timer = setTimeout(() => {
            void handleSearch();
        }, 300);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, filters]);

    const toggleFilter = (key: FilterKey) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleSection = (sectionKey: string) => {
        setCollapsedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionKey)) {
                next.delete(sectionKey);
            } else {
                next.add(sectionKey);
            }
            return next;
        });
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
            <Header />

            <main className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
                <section className="grid gap-8 border border-ed-rule bg-ed-surface/72 p-6 backdrop-blur-sm sm:p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-ed-accent">
                            <Search className="h-6 w-6" />
                            <span className="text-[0.68rem] uppercase tracking-[0.28em]">
                                Archive search
                            </span>
                        </div>
                        <h1 className="max-w-[11ch] font-display text-5xl leading-[0.92] text-ed-fg sm:text-6xl lg:text-7xl">
                            Find what matters without turning the archive into a dashboard.
                        </h1>
                        <p className="max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted sm:text-base">
                            Search across transcripts and written material from one surface. The interface stays
                            quiet in both dark and light mode so the results, not the chrome, carry the attention.
                        </p>
                    </div>

                    <div className="space-y-6 lg:self-end">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                void handleSearch();
                            }}
                            className="relative"
                        >
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ed-fg-muted" />
                            <input
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search transcripts, newsletters, appendices..."
                                className="w-full border border-ed-rule bg-ed-bg px-12 py-4 text-base text-ed-fg outline-none transition placeholder:text-ed-fg-muted/70 focus:border-ed-accent"
                                autoFocus
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 border border-ed-rule bg-ed-surface px-4 py-2 text-[0.68rem] uppercase tracking-[0.22em] text-ed-fg transition hover:border-ed-accent hover:text-ed-accent"
                            >
                                Search
                            </button>
                        </form>

                        <div className="space-y-3">
                            {FILTER_ROWS.map((row) => (
                                <div key={row.label} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                    <span className="w-20 text-[0.64rem] uppercase tracking-[0.22em] text-ed-fg-muted">
                                        {row.label}
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {row.items.map((item) => (
                                            <FilterButton
                                                key={item.key}
                                                active={filters[item.key]}
                                                onClick={() => toggleFilter(item.key)}
                                                label={item.label}
                                                icon={item.icon}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {errorMsg ? (
                    <div className="mt-8 border border-[#961515]/24 bg-[#961515]/10 p-4 text-sm text-[#961515] dark:text-[#f6ae82]">
                        {errorMsg}
                    </div>
                ) : null}

                <section className="mt-12 space-y-6">
                    {isSearching ? (
                        <div className="border border-ed-rule bg-ed-surface/64 px-6 py-14 text-center text-[0.72rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                            Searching the archive...
                        </div>
                    ) : null}

                    {!isSearching && query && results.length === 0 ? (
                        <div className="border border-ed-rule bg-ed-surface/64 px-6 py-14 text-center">
                            <p className="font-display text-3xl text-ed-fg">No matches found.</p>
                            <p className="mt-3 text-sm leading-7 text-ed-fg-muted">
                                Try a shorter phrase, remove a filter, or search by title keywords.
                            </p>
                        </div>
                    ) : null}

                    {!isSearching && results.length > 0 ? (
                        <div className="flex items-center gap-3 border-b border-ed-rule pb-4 text-[0.68rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                            <FileText className="h-4 w-4 text-ed-accent" />
                            {results.length} documents matched
                        </div>
                    ) : null}

                    {groupedResults.map(([type, typeResults]) => {
                        const config = getSectionConfig(type);
                        const isCollapsed = collapsedSections.has(type);
                        const Icon = config.icon;

                        return (
                            <div key={type} className="border border-ed-rule bg-ed-surface/74">
                                <button
                                    onClick={() => toggleSection(type)}
                                    className="flex w-full items-center justify-between gap-4 border-b border-ed-rule px-5 py-5 text-left transition hover:bg-ed-bg/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <Icon className="h-5 w-5 text-ed-accent" />
                                        <div>
                                            <p className="text-[0.66rem] uppercase tracking-[0.24em] text-ed-fg-muted">
                                                {config.title}
                                            </p>
                                            <p className="mt-1 font-display text-2xl text-ed-fg">{config.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[0.62rem] uppercase tracking-[0.22em] text-ed-fg-muted">
                                            {typeResults.length} results
                                        </span>
                                        <ChevronDown
                                            className={`h-5 w-5 text-ed-fg-muted transition-transform ${
                                                isCollapsed ? '-rotate-90' : 'rotate-0'
                                            }`}
                                        />
                                    </div>
                                </button>

                                {!isCollapsed ? (
                                    <div className="divide-y divide-ed-rule">
                                        {typeResults.map(({ media, matches }) => {
                                            const itemKey = `${media.id}${media.page ? `-${media.page}` : ''}`;
                                            const isExpanded = expandedMatches.has(itemKey);
                                            const visibleMatches = isExpanded ? matches : matches.slice(0, 3);
                                            const mediaLink = getMediaLink(media, query);
                                            const thumbnailSrc = getThumbnailSrc(media);

                                            return (
                                                <article key={itemKey} className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[180px_1fr]">
                                                    <Link
                                                        href={mediaLink}
                                                        className="relative aspect-video overflow-hidden border border-ed-rule bg-ed-bg"
                                                    >
                                                        <Image
                                                            src={thumbnailSrc}
                                                            alt={media.displayTitle || media.title}
                                                            fill
                                                            sizes="(max-width: 1024px) 100vw, 180px"
                                                            className={`h-full w-full ${
                                                                isDocumentType(media.type)
                                                                    ? 'object-contain p-1'
                                                                    : 'object-cover'
                                                            }`}
                                                        />
                                                        {!isDocumentType(media.type) ? (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/12">
                                                                <div className="rounded-full bg-black/45 p-2 text-white">
                                                                    <Play className="h-4 w-4 fill-current" />
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </Link>

                                                    <div className="min-w-0">
                                                        <Link href={mediaLink} className="block border-b border-ed-rule pb-4">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <span className="border border-ed-rule bg-ed-bg px-2 py-1 text-[0.58rem] uppercase tracking-[0.22em] text-ed-fg-muted">
                                                                    {media.type === 'messenger-audio'
                                                                        ? 'audio'
                                                                        : media.type.replace('-', ' ')}
                                                                </span>
                                                                {media.displayDate ? (
                                                                    <span className="text-[0.62rem] uppercase tracking-[0.2em] text-ed-fg-muted">
                                                                        {media.displayDate}
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                            <h3 className="mt-3 font-display text-3xl leading-tight text-ed-fg">
                                                                {media.displayTitle || media.title}
                                                            </h3>
                                                            {media.author ? (
                                                                <p className="mt-2 text-sm text-ed-fg-muted">
                                                                    {media.author}
                                                                </p>
                                                            ) : null}
                                                        </Link>

                                                        <div className="divide-y divide-ed-rule">
                                                            {visibleMatches.map((match) => (
                                                                <div key={match.id} className="grid gap-3 py-4 sm:grid-cols-[78px_1fr]">
                                                                    <Link
                                                                        href={
                                                                            isDocumentType(media.type)
                                                                                ? mediaLink
                                                                                : `${mediaLink}?t=${Math.floor(
                                                                                    match.start_time,
                                                                                )}`
                                                                        }
                                                                        className="inline-flex items-start text-[0.64rem] uppercase tracking-[0.2em] text-ed-accent"
                                                                    >
                                                                        {isDocumentType(media.type)
                                                                            ? 'Text'
                                                                            : formatTime(match.start_time)}
                                                                    </Link>
                                                                    <p
                                                                        className="text-sm leading-7 text-ed-fg-muted"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: highlightMatch(
                                                                                match.content,
                                                                                query,
                                                                            ),
                                                                        }}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {matches.length > 3 ? (
                                                            <button
                                                                onClick={() => toggleMatches(itemKey)}
                                                                className="mt-2 text-[0.62rem] uppercase tracking-[0.22em] text-ed-fg-muted transition hover:text-ed-accent"
                                                            >
                                                                {isExpanded
                                                                    ? 'Show less'
                                                                    : `Show ${matches.length - 3} more matches`}
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        );
                    })}
                </section>
            </main>

            <Footer />
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-ed-bg text-ed-fg flex items-center justify-center text-[0.72rem] uppercase tracking-[0.24em]">
                    Loading search...
                </div>
            }
        >
            <SearchContent />
        </Suspense>
    );
}

function FilterButton({
    active,
    onClick,
    label,
    icon: Icon,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: typeof Video;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 border px-3 py-2 text-[0.64rem] uppercase tracking-[0.22em] transition ${
                active
                    ? 'border-ed-accent bg-ed-accent/10 text-ed-accent'
                    : 'border-ed-rule bg-ed-surface text-ed-fg-muted hover:text-ed-fg'
            }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}

function getSectionConfig(type: string): { title: string; icon: typeof Video } {
    switch (type) {
        case 'sermon':
            return { title: 'Friday sermons', icon: Video };
        case 'quran-study':
            return { title: 'Quran studies', icon: BookOpen };
        case 'video-program':
            return { title: 'Video programs', icon: Video };
        case 'messenger-audio':
        case 'audio':
            return { title: 'Audio recordings', icon: Headphones };
        case 'perspective':
            return { title: 'Newsletters', icon: FileText };
        case 'appendix':
            return { title: 'Appendices', icon: BookOpen };
        default:
            return { title: 'Other resources', icon: FileText };
    }
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

function getThumbnailSrc(media: SearchResultMedia) {
    if (media.type === 'sermon') {
        const cleanId = media.id
            .replace(/^media\/(disorganized_sermons|VIDEO PROGRAMS)\//, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w\-_.]/g, '')
            .replace(/\.mp4$/, '');
        return `/images/sermons/${cleanId}.jpg`;
    }

    if (media.type === 'video-program') {
        const cleanId = media.id
            .replace(/^media\/(disorganized_sermons|VIDEO PROGRAMS)\//, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w\-_.]/g, '')
            .replace(/\.mp4$/, '');
        return `/images/video-programs/${cleanId}.jpg`;
    }

    if (media.type === 'audio' || media.type === 'messenger-audio') {
        return '/images/messenger-audios/default.jpg';
    }

    if (media.type === 'perspective') {
        return '/images/placeholders/rashad-khalifa.png';
    }

    if (media.type === 'appendix') {
        return '/images/placeholders/rashad-khalifa.png';
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
    if (!query) {
        return text;
    }

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(
        regex,
        '<span class="rounded bg-ed-accent/12 px-1 font-semibold text-ed-accent">$1</span>',
    );
}
