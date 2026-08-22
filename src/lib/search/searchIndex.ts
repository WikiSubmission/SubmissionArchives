import 'server-only';

import fs from 'fs';
import path from 'path';
import { LRUCache } from 'lru-cache';
import { findQueryMatch, getRequiredTokens, normalizeSearchText, tokenizeForIndex } from '@/lib/search/queryMatch';
import { parseAdvancedQuery, type ParsedQuery } from '@/lib/search/queryParser';
import type { ArchiveRecord } from '@/types/archive';

export const MAX_QUERY_LENGTH = 120;

export const ALLOWED_FILTERS = new Set([
    'video',
    'sermon',
    'quran-study',
    'video-program',
    'audio',
    'messenger-audio',
    'perspective',
    'appendix',
    'other',
    'quran',
]);

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
};

export type SearchResult = {
    media: SearchMedia;
    matches: SearchMatch[];
    bestScore?: number;
    matchCount?: number;
};

const searchCache = new LRUCache<string, SearchResult[]>({
    max: 200,
    ttl: 1000 * 60 * 5, // 5 minutes
});

let cachedMasterIndex: ArchiveRecord[] | null = null;

function getSearchIndex() {
    if (!cachedMasterIndex) {
        const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');
        cachedMasterIndex = fs.existsSync(filePath)
            ? (JSON.parse(fs.readFileSync(filePath, 'utf8')) as ArchiveRecord[])
            : [];
    }
    return cachedMasterIndex;
}

// Forces the one-time index parse (and the derived suggest list) so the cost lands at
// server startup rather than on the first visitor to search. Safe to call more than once.

// --- inverted index ---------------------------------------------------------------
// Without this, every query walked all 116k segments and ran findQueryMatch on each,
// costing ~1s per distinct query (the LRU only ever hid that for repeats). A term ->
// segment postings map turns the per-query cost into "intersect a few posting lists,
// then match only the survivors".
//
// This is strictly a pre-filter: findQueryMatch still decides every match, so ranking
// and snippets are unchanged. Postings are built in ascending segment order, which keeps
// each list sorted and lets the intersection run linearly.
type FlatSegmentIndex = {
    owners: Int32Array;
    locals: Int32Array;
    postings: Map<string, number[]>;
};

let cachedFlatIndex: FlatSegmentIndex | null = null;

function getFlatIndex(): FlatSegmentIndex {
    if (cachedFlatIndex) return cachedFlatIndex;

    const records = getSearchIndex();
    let segmentCount = 0;
    for (const record of records) segmentCount += record.segments?.length ?? 0;

    const owners = new Int32Array(segmentCount);
    const locals = new Int32Array(segmentCount);
    const postings = new Map<string, number[]>();

    let flat = 0;
    const seen = new Set<string>();
    records.forEach((record, recordIndex) => {
        (record.segments ?? []).forEach((segment, localIndex) => {
            owners[flat] = recordIndex;
            locals[flat] = localIndex;

            // One posting per term per segment, not per occurrence.
            seen.clear();
            for (const token of tokenizeForIndex(segment.text || '')) {
                if (seen.has(token)) continue;
                seen.add(token);

                const list = postings.get(token);
                if (list) list.push(flat);
                else postings.set(token, [flat]);
            }

            flat++;
        });
    });

    cachedFlatIndex = { owners, locals, postings };
    return cachedFlatIndex;
}

function intersectSorted(a: number[], b: number[]): number[] {
    const out: number[] = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
        if (a[i] === b[j]) {
            out.push(a[i]);
            i++;
            j++;
        } else if (a[i] < b[j]) {
            i++;
        } else {
            j++;
        }
    }
    return out;
}

function mergeSortedUnique(lists: number[][]): number[] {
    const merged: number[] = [];
    for (const list of lists) merged.push(...list);
    merged.sort((a, b) => a - b);

    const out: number[] = [];
    for (let i = 0; i < merged.length; i++) {
        if (i === 0 || merged[i] !== merged[i - 1]) out.push(merged[i]);
    }
    return out;
}

// Expansion is the subtle part. findQueryMatch's phrase path tests
// `normalizeSearchText(text).includes(query)`, i.e. it matches on substrings — so the
// query "miracle" legitimately matches a segment containing "miracles". An exact-token
// lookup would silently drop those, which is a wrong-answer bug rather than a slow one
// (measured: 207 documents down to 191 before this was added). So a token expands to
// every indexed term containing it, giving a superset — which is what a pre-filter needs.
const MAX_EXPANSION_CACHE = 500;
const expansionCache = new Map<string, number[]>();

function postingsForToken(token: string): number[] {
    const cached = expansionCache.get(token);
    if (cached) return cached;

    const { postings } = getFlatIndex();
    const lists: number[][] = [];
    for (const [term, list] of postings) {
        if (term.includes(token)) lists.push(list);
    }

    const merged = lists.length <= 1 ? (lists[0] ?? []) : mergeSortedUnique(lists);

    if (expansionCache.size >= MAX_EXPANSION_CACHE) expansionCache.clear();
    expansionCache.set(token, merged);
    return merged;
}

// null means "cannot pre-filter, fall back to a full scan". An empty array means the
// index is certain there are no matches.
function candidateSegments(queryText: string): number[] | null {
    const tokens = getRequiredTokens(queryText);
    if (tokens.length === 0) return null;

    const lists: number[][] = [];
    for (const token of tokens) {
        const list = postingsForToken(token);
        if (list.length === 0) return [];
        lists.push(list);
    }

    // Smallest list first, so the intersection shrinks as fast as possible.
    lists.sort((a, b) => a.length - b.length);

    let accumulated = lists[0];
    for (let i = 1; i < lists.length && accumulated.length > 0; i++) {
        accumulated = intersectSorted(accumulated, lists[i]);
    }
    return accumulated;
}

export function warmSearchIndex(): number {
    const records = getSearchIndex();
    getSuggestEntries();
    getFlatIndex();
    return records.length;
}

export function normalizeFilters(filters: string[]): string[] {
    return [...new Set(filters.filter((filter) => ALLOWED_FILTERS.has(filter)))];
}

export const MIN_SUGGEST_LENGTH = 2;
export const MAX_SUGGESTIONS = 8;

export type Suggestion = {
    id: string;
    title: string;
    type: string;
    author?: string;
};

type SuggestEntry = Suggestion & {
    titleLower: string;
    words: string[];
    authorLower: string;
};

let cachedSuggestEntries: SuggestEntry[] | null = null;

// Titles only — derived once so suggest requests never walk the segment arrays that
// make up nearly all of the master index's weight.
function getSuggestEntries(): SuggestEntry[] {
    if (cachedSuggestEntries) return cachedSuggestEntries;

    const seen = new Set<string>();
    const entries: SuggestEntry[] = [];
    for (const item of getSearchIndex()) {
        if (seen.has(item.id)) continue;
        seen.add(item.id);

        const title = item.displayTitle || item.title || item.id;
        const titleLower = title.toLowerCase();
        entries.push({
            id: item.id,
            title,
            type: item.type,
            author: item.author,
            titleLower,
            words: titleLower.split(/[^a-z0-9']+/).filter(Boolean),
            authorLower: (item.author ?? '').toLowerCase(),
        });
    }

    cachedSuggestEntries = entries;
    return entries;
}

export function getSuggestions(rawQuery: string, limit = MAX_SUGGESTIONS): Suggestion[] {
    const needle = rawQuery.trim().toLowerCase().slice(0, MAX_QUERY_LENGTH);
    if (needle.length < MIN_SUGGEST_LENGTH) return [];

    const scored: Array<{ entry: SuggestEntry; score: number }> = [];
    for (const entry of getSuggestEntries()) {
        const score = scoreSuggestion(entry, needle);
        if (score > 0) scored.push({ entry, score });
    }

    // Same score: prefer the shorter title, which is the more specific match.
    scored.sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length);

    return scored.slice(0, limit).map(({ entry }) => ({
        id: entry.id,
        title: entry.title,
        type: entry.type,
        author: entry.author,
    }));
}

function scoreSuggestion(entry: SuggestEntry, needle: string): number {
    if (entry.titleLower.startsWith(needle)) return 100;
    if (entry.words.some((word) => word.startsWith(needle))) return 80;
    if (entry.titleLower.includes(needle)) return 60;
    if (entry.authorLower.includes(needle)) return 40;
    // Typo tolerance is the last resort, and only against whole words of comparable
    // length, so it never dominates a genuine prefix hit.
    if (entry.words.some((word) => withinEditDistance(word, needle, 2))) return 20;
    return 0;
}

function withinEditDistance(a: string, b: string, max: number): boolean {
    if (Math.abs(a.length - b.length) > max) return false;
    if (a === b) return true;

    let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i++) {
        const current = [i];
        let rowMin = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
            rowMin = Math.min(rowMin, current[j]);
        }
        // Every path through this row already exceeds the budget.
        if (rowMin > max) return false;
        previous = current;
    }

    return previous[b.length] <= max;
}

// Returns the full ranked result set for a query, memoized per
// (query, filters, proximityWindow). Callers slice it for pagination, so paging
// through a large result set costs one scan rather than one scan per page.
export function runSearch(query: string, filters: string[], proximityWindow: number): SearchResult[] {
    const cleanQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
    if (!cleanQuery) return [];

    const parsed = parseAdvancedQuery(cleanQuery);
    // Operators with nothing left to match (e.g. a bare "type:video") have no results.
    if (!parsed.text) return [];

    const cleanWindow = clamp(proximityWindow, 2, 40);
    // An explicit type: operator overrides the checkbox selection; otherwise the
    // checkboxes stand, so the two remain aliases of the same mechanism.
    const requestedTypes = normalizeFilters(parsed.types);
    const cleanFilters = requestedTypes.length > 0 ? requestedTypes : normalizeFilters(filters);

    // cleanQuery encodes every operator, so it alone distinguishes cache entries.
    const cacheKey = `${cleanQuery}::${[...cleanFilters].sort().join(',')}::${cleanWindow}`;
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;

    const results = searchMasterIndex(parsed, cleanFilters, cleanWindow)
        .map(rankResult)
        .sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0));

    searchCache.set(cacheKey, results);
    return results;
}

function searchMasterIndex(parsed: ParsedQuery, filters: string[], proximityWindow: number): SearchResult[] {
    const records = getSearchIndex();
    const scopedByDate = parsed.before !== undefined || parsed.after !== undefined;

    const candidates = candidateSegments(parsed.text);
    if (candidates !== null && candidates.length === 0) return [];

    // Group the surviving segments by their record so results stay assembled per document,
    // and walk records in index order so equal-scoring documents keep a stable order.
    const byRecord = new Map<number, number[]>();
    if (candidates === null) {
        records.forEach((record, recordIndex) => {
            const total = record.segments?.length ?? 0;
            byRecord.set(recordIndex, Array.from({ length: total }, (_, localIndex) => localIndex));
        });
    } else {
        const { owners, locals } = getFlatIndex();
        for (const flat of candidates) {
            const recordIndex = owners[flat];
            const list = byRecord.get(recordIndex);
            if (list) list.push(locals[flat]);
            else byRecord.set(recordIndex, [locals[flat]]);
        }
    }

    const results: SearchResult[] = [];
    for (const recordIndex of Array.from(byRecord.keys()).sort((a, b) => a - b)) {
        const item = records[recordIndex];
        if (!isMasterItemAllowed(item, filters)) continue;

        if (scopedByDate) {
            const year = getRecordYear(item);
            // Undateable records cannot satisfy a date scope, so they drop out rather
            // than leaking through as false positives.
            if (year === null) continue;
            if (parsed.before !== undefined && year >= parsed.before) continue;
            if (parsed.after !== undefined && year <= parsed.after) continue;
        }

        const matches: SearchMatch[] = [];
        for (const index of byRecord.get(recordIndex)!) {
            const segment = item.segments[index];
            if (!segment) continue;

            const text = segment.text || '';
            if (hasExcludedTerm(text, parsed.exclusions)) continue;

            const result = findQueryMatch(text, parsed.text, { proximityWindow });
            if (!result.matched) continue;

            // Page/verse-based documents (books, appendices, the Qur'an) all set
            // start: 0 on every segment since there's no timestamp, so start can't
            // disambiguate them — page (or verse number) must be checked first, or
            // every match on the same document collapses to the same id.
            matches.push({
                id: `${item.id}-${segment.page ?? segment.start ?? index}`,
                content: result.snippet || segment.text || '',
                start_time: segment.start ?? 0,
                page: segment.page,
                score: result.score,
                kind: result.kind,
                distance: result.distance,
                label: segment.label,
            });
        }

        if (matches.length === 0) continue;

        results.push({
            media: {
                id: item.id,
                title: item.displayTitle || item.title || item.id,
                type: item.type,
                author: item.author || 'Dr. Rashad Khalifa',
                pdfLink: item.pdfLink,
                page: matches[0]?.page,
                thumbnailOverride: item.thumbnailOverride,
                displayTitle: item.displayTitle || item.title || item.id,
                displayDate: item.date || item.fullDate || '',
                primaryNumber: item.primaryNumber,
                alternateNumbers: item.alternateNumbers,
                alternateNumberLabel: item.alternateNumberLabel,
            },
            matches: sortMatches(matches).slice(0, 20),
        });
    }

    return results;
}

const EXCLUDED_QURAN_EDITION_IDS = new Set([
    'english-meanings-of-the-quran',
]);

function isMasterItemAllowed(item: ArchiveRecord, filters: string[]) {
    // Exclude alternate Qur'an translation edition books only when explicitly filtering by 'quran' category
    if (filters.includes('quran') && EXCLUDED_QURAN_EDITION_IDS.has(item.id)) {
        return false;
    }

    if (filters.length === 0) return true;

    return filters.some((filter) => {
        if (filter === 'video' || filter === 'sermon' || filter === 'video-program') {
            return item.type === 'video-program' || item.type === 'sermon' || item.type === 'video';
        }
        if (filter === 'quran-study') return item.type === 'quran-study';
        if (filter === 'audio' || filter === 'messenger-audio') {
            return item.type === 'messenger-audio' || item.type === 'audio';
        }
        if (filter === 'perspective') return item.type === 'perspective';
        if (filter === 'appendix') return item.type === 'appendix';
        return filter === item.type;
    });
}

function getRecordYear(item: ArchiveRecord): number | null {
    if (typeof item.year === 'number') return item.year;
    const match = (item.fullDate || item.date || '').match(/\b(1[89]\d{2}|20\d{2})\b/);
    return match ? Number(match[1]) : null;
}

// Whole-word exclusion, so `-art` drops "art" without also dropping "start".
function hasExcludedTerm(text: string, exclusions: string[]): boolean {
    if (exclusions.length === 0) return false;

    const haystack = ` ${normalizeSearchText(text)} `;
    return exclusions.some((term) => {
        const needle = normalizeSearchText(term);
        return needle.length > 0 && haystack.includes(` ${needle} `);
    });
}

function sortMatches(matches: SearchMatch[]) {
    return matches.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.start_time - b.start_time);
}

function rankResult(result: SearchResult): SearchResult {
    const matches = sortMatches(result.matches);
    return {
        ...result,
        matches,
        bestScore: matches[0]?.score ?? 0,
        matchCount: matches.length,
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}
