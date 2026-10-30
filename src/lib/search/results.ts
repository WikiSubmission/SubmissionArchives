// Result shapes and the rules for narrowing, ordering and dating them. Shared by the
// search index, the search route and the search UI, and kept free of server-only imports
// (like rateLimit.ts) so it can be unit-tested directly.

export type SearchMatch = {
    id: string;
    content: string;
    start_time: number;
    page?: number;
    score?: number;
    kind?: string;
    distance?: number;
    label?: string;
};

export type SearchMedia = {
    id: string;
    title: string;
    type: string;
    author?: string;
    pdfLink?: string;
    page?: number;
    thumbnailOverride?: string;
    displayTitle?: string;
    displayDate?: string;
    primaryNumber?: number;
    alternateNumbers?: string[];
    alternateNumberLabel?: string;
    isOcr?: boolean;
};

export type SearchResult = {
    media: SearchMedia;
    // Strongest first, capped; matchCount is the uncapped total.
    matches: SearchMatch[];
    matchCount: number;
    relevance: number;
    // Milliseconds since the epoch, for date sorting. Null when the record is undated.
    time: number | null;
};

export const SOURCE_FILTERS = [
    { key: 'video', label: 'Videos' },
    { key: 'quran-study', label: 'Qur’an Studies' },
    { key: 'messenger-audio', label: 'Messenger Audio' },
    { key: 'perspective', label: 'Perspectives' },
    { key: 'appendix', label: 'Appendices' },
    { key: 'other', label: 'Books' },
] as const;

export type SourceFilter = (typeof SOURCE_FILTERS)[number]['key'];
export type SourceCounts = Record<SourceFilter, number>;

const SOURCE_KEYS: ReadonlySet<string> = new Set(SOURCE_FILTERS.map((source) => source.key));

// Record types, and filter names older links still carry, that belong to a source.
const SOURCE_ALIASES: Record<string, SourceFilter> = {
    'video-program': 'video',
    sermon: 'video',
    audio: 'messenger-audio',
};

export function toSourceFilter(value: string): SourceFilter | null {
    if (SOURCE_KEYS.has(value)) return value as SourceFilter;
    return SOURCE_ALIASES[value] ?? null;
}

// Unknown names are dropped, and selecting every source means the same as selecting
// none, so both come back as [] (no narrowing).
export function normalizeSourceFilters(values: readonly string[]): SourceFilter[] {
    const selected = new Set(values.map(toSourceFilter));
    const keys = SOURCE_FILTERS.map((source) => source.key).filter((key) => selected.has(key));
    return keys.length === SOURCE_FILTERS.length ? [] : keys;
}

export function getSourceLabel(type: string): string {
    const key = toSourceFilter(type);
    return SOURCE_FILTERS.find((source) => source.key === key)?.label ?? 'Resource';
}

type Sourced = { media: { type: string } };
type Dated = Sourced & { time: number | null };

export function countSources(results: readonly Sourced[]): SourceCounts {
    const counts = Object.fromEntries(SOURCE_FILTERS.map((source) => [source.key, 0])) as SourceCounts;
    for (const result of results) {
        const key = toSourceFilter(result.media.type);
        if (key) counts[key] += 1;
    }
    return counts;
}

export type SearchSort = 'relevance' | 'newest' | 'oldest';

export function parseSort(value: string | null | undefined): SearchSort {
    return value === 'newest' || value === 'oldest' ? value : 'relevance';
}

// Never reorders the input, which is a cached result set.
export function selectResults<T extends Dated>(
    results: readonly T[],
    sources: readonly SourceFilter[],
    sort: SearchSort,
): T[] {
    const narrowed = sources.length === 0
        ? [...results]
        : results.filter((result) => {
            const key = toSourceFilter(result.media.type);
            return key !== null && sources.includes(key);
        });
    if (sort === 'relevance') return narrowed;

    const direction = sort === 'newest' ? -1 : 1;
    // The sort is stable, so undated records follow the dated ones in relevance order.
    return narrowed.sort((a, b) => {
        if (a.time === null || b.time === null) return (a.time === null ? 1 : 0) - (b.time === null ? 1 : 0);
        return (a.time - b.time) * direction;
    });
}

// The best passage decides most of the order. A one-word query gives every hit the same
// passage score, though, so the title naming the subject and the number of matching
// passages break the tie. Depth has diminishing returns so one long transcript cannot
// bury a short, focused document.
export function documentRelevance(bestScore: number, matchCount: number, titleMatched: boolean): number {
    return bestScore + (titleMatched ? 20 : 0) + Math.min(20, 4 * Math.log2(1 + matchCount));
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

// The catalog mixes "1989-05-26", "10/22/1982", "August 4, 1988" and "February 1985".
function numericDate(raw: string): { year: number; month: number; day: number } | null {
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    const [year, month, day] = iso
        ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
        : us ? [Number(us[3]), Number(us[1]), Number(us[2])] : [0, 0, 0];
    return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? { year, month, day } : null;
}

export function formatRecordDate(raw: string | undefined): string {
    if (!raw) return '';
    const date = numericDate(raw.trim());
    return date ? `${MONTHS[date.month - 1]} ${date.day}, ${date.year}` : raw.trim();
}

export function getRecordTime(dates: Array<string | undefined>, year: number | null): number | null {
    for (const raw of dates) {
        if (!raw) continue;
        const date = numericDate(raw.trim());
        const time = date ? Date.UTC(date.year, date.month - 1, date.day) : Date.parse(raw);
        if (Number.isFinite(time)) return time;
    }
    return year === null ? null : Date.UTC(year, 0, 1);
}
