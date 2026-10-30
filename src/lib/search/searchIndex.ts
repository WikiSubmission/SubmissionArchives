import 'server-only';

import fs from 'fs';
import path from 'path';
import { LRUCache } from 'lru-cache';
import { findQueryMatch, getRequiredTokens, normalizeSearchText, parseSearchQuery, tokenizeForIndex } from '@/lib/search/queryMatch';
import { parseAdvancedQuery, type ParsedQuery } from '@/lib/search/queryParser';
import {
    countSources,
    documentRelevance,
    formatRecordDate,
    getRecordTime,
    normalizeSourceFilters,
    selectResults,
    type SearchMatch,
    type SearchResult,
    type SearchSort,
    type SourceCounts,
} from '@/lib/search/results';
import type { ArchiveRecord } from '@/types/archive';

export const MAX_QUERY_LENGTH = 120;
const MAX_MATCHES_PER_RESULT = 20;

// One ranked set per query across every source. Source filters, sorting and paging are
// applied to it afterwards, so changing any of them is a cache hit rather than a second
// scan, and the per-source counts come from the same pass. Excerpts are only cut for the
// records on a requested page, then kept with the cached entry.
type SegmentHit = {
    index: number;
    text: string;
    page?: number;
    start: number;
    score: number;
};

type RankedEntry = Omit<SearchResult, 'matches'> & { record: ArchiveRecord; hits: SegmentHit[] };
type RankedSearch = { entries: RankedEntry[]; counts: SourceCounts; matchQuery: string; proximityWindow: number };

export type SearchOptions = {
    filters?: string[];
    sort?: SearchSort;
    offset?: number;
    limit?: number;
    proximityWindow?: number;
};

export type SearchPage = {
    results: SearchResult[];
    total: number;
    totalMatches: number;
    counts: SourceCounts;
};

const excerptCache = new WeakMap<RankedEntry, SearchMatch[]>();

const searchCache = new LRUCache<string, RankedSearch>({
    max: 200,
    ttl: 1000 * 60 * 5, // 5 minutes
});

let cachedMasterIndex: ArchiveRecord[] | null = null;
let cachedMasterIndexMtime: number | null = null;

function getSearchIndex() {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');
    const fileMtime = fs.existsSync(filePath) ? fs.statSync(filePath).mtimeMs : null;

    if (!cachedMasterIndex || cachedMasterIndexMtime !== fileMtime) {
        cachedMasterIndex = fileMtime === null
            ? []
            : (JSON.parse(fs.readFileSync(filePath, 'utf8')) as ArchiveRecord[]);
        cachedMasterIndexMtime = fileMtime;
        cachedFlatIndex = null;
        // Both hold positions or titles from the previous index.
        expansionCache.clear();
        cachedSuggestEntries = null;
        searchCache.clear();
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

// Returns one page of the ranked, narrowed and ordered results, with totals for the
// whole set. Paging through a large result set costs one scan rather than one per page.
export function runSearch(query: string, options: SearchOptions = {}): SearchPage {
    const { filters = [], sort = 'relevance', offset = 0, limit = 10, proximityWindow = 18 } = options;
    const cleanQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
    const parsed = parseAdvancedQuery(cleanQuery);
    // Operators with nothing left to match (e.g. a bare "type:video") have no results.
    if (!parsed.text) return { results: [], total: 0, totalMatches: 0, counts: countSources([]) };

    const cleanWindow = clamp(proximityWindow, 2, 40);
    // cleanQuery encodes every operator, so with the window it distinguishes cache entries.
    const cacheKey = `${cleanQuery}::${cleanWindow}`;
    // Check the source index before looking up a cached query so a changed index
    // invalidates both the query result cache and the derived posting lists.
    getSearchIndex();
    let ranked = searchCache.get(cacheKey);
    if (!ranked) {
        const entries = searchMasterIndex(parsed, cleanWindow).sort((a, b) => b.relevance - a.relevance);
        ranked = { entries, counts: countSources(entries), matchQuery: parsed.text, proximityWindow: cleanWindow };
        searchCache.set(cacheKey, ranked);
    }

    // An explicit type: operator overrides the source selection; otherwise the selection
    // stands, so the two remain aliases of the same mechanism.
    const requestedSources = normalizeSourceFilters(parsed.types);
    const sources = requestedSources.length > 0 ? requestedSources : normalizeSourceFilters(filters);
    const selected = selectResults(ranked.entries, sources, sort);

    return {
        results: selected.slice(offset, offset + limit).map((entry) => toSearchResult(entry, ranked)),
        total: selected.length,
        totalMatches: selected.reduce((sum, entry) => sum + entry.matchCount, 0),
        // A type: operator is part of the query itself, so the counts honor it too.
        counts: requestedSources.length > 0 ? countSources(selected) : ranked.counts,
    };
}

function toSearchResult(entry: RankedEntry, ranked: RankedSearch): SearchResult {
    let matches = excerptCache.get(entry);
    if (!matches) {
        matches = entry.hits.map((hit) => toSearchMatch(entry.record, hit, ranked.matchQuery, ranked.proximityWindow));
        excerptCache.set(entry, matches);
    }
    return { media: entry.media, matches, matchCount: entry.matchCount, relevance: entry.relevance, time: entry.time };
}

function searchMasterIndex(parsed: ParsedQuery, proximityWindow: number): RankedEntry[] {
    const records = getSearchIndex();
    const scopedByDate = parsed.before !== undefined || parsed.after !== undefined;

    // A query of only stopwords or single letters has no term or phrase for findQueryMatch
    // to match, so the full-scan fallback below could only ever return nothing.
    if (!parsed.text.startsWith('literal:')) {
        const { phrases, terms } = parseSearchQuery(parsed.text);
        if (phrases.length === 0 && terms.length === 0) return [];
    }

    const titleTokens = getRequiredTokens(parsed.text);
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

    const results: RankedEntry[] = [];
    for (const recordIndex of Array.from(byRecord.keys()).sort((a, b) => a - b)) {
        const item = records[recordIndex];

        if (scopedByDate) {
            const year = getRecordYear(item);
            // Undateable records cannot satisfy a date scope, so they drop out rather
            // than leaking through as false positives.
            if (year === null) continue;
            if (parsed.before !== undefined && year >= parsed.before) continue;
            if (parsed.after !== undefined && year <= parsed.after) continue;
        }

        // Scored without snippets first: a broad term can match thousands of passages,
        // but only the strongest few per record are ever shown.
        const hits: SegmentHit[] = [];
        for (const index of byRecord.get(recordIndex)!) {
            const segment = item.segments[index];
            if (!segment) continue;

            const sourceText = segment.text || '';
            const text = item.type === 'other' ? cleanBookOcrForSearch(sourceText, segment.label) : sourceText;
            if (hasExcludedTerm(text, parsed.exclusions)) continue;

            const result = findQueryMatch(text, parsed.text, { proximityWindow, snippet: false });
            if (!result.matched) continue;
            hits.push({ index, text, page: segment.page, start: segment.start ?? 0, score: result.score });
        }

        if (hits.length === 0) continue;

        const orderedHits = item.type === 'other' || item.type === 'appendix'
            ? collapseDocumentHits(hits)
            : sortHits(hits);
        const title = item.displayTitle || item.title || item.id;

        results.push({
            media: {
                id: item.id,
                title,
                type: item.type,
                author: item.author || 'Dr. Rashad Khalifa',
                pdfLink: item.pdfLink,
                // The first matching page in reading order, which is where the title link opens.
                page: hits[0].page,
                thumbnailOverride: item.thumbnailOverride,
                displayTitle: title,
                displayDate: formatRecordDate(item.date || item.fullDate) || (typeof item.year === 'number' ? String(item.year) : ''),
                primaryNumber: item.primaryNumber,
                alternateNumbers: item.alternateNumbers,
                alternateNumberLabel: item.alternateNumberLabel,
                isOcr: item.type === 'other' && /\bocr\b/i.test(item.transcriptionMethod || ''),
            },
            matchCount: orderedHits.length,
            relevance: documentRelevance(orderedHits[0].score, orderedHits.length, titleMentions(title, titleTokens)),
            time: getRecordTime([item.fullDate, item.date], getRecordYear(item)),
            record: item,
            hits: orderedHits.slice(0, MAX_MATCHES_PER_RESULT),
        });
    }

    return results;
}

function toSearchMatch(item: ArchiveRecord, hit: SegmentHit, query: string, proximityWindow: number): SearchMatch {
    const segment = item.segments[hit.index];
    const result = findQueryMatch(hit.text, query, { proximityWindow });
    // Page/verse-based documents (books, appendices, the Qur'an) all set start: 0 on
    // every segment since there's no timestamp, so start can't disambiguate them. Page
    // (or verse number) must be checked first, or every match on the same document
    // collapses to the same id.
    return {
        id: `${item.id}-${segment.page ?? segment.start ?? hit.index}`,
        content: result.snippet || hit.text,
        start_time: hit.start,
        page: hit.page,
        score: hit.score,
        kind: result.kind,
        distance: result.distance,
        label: segment.label,
    };
}

function titleMentions(title: string, tokens: string[]): boolean {
    if (tokens.length === 0) return false;
    const normalizedTitle = normalizeSearchText(title);
    return tokens.every((token) => normalizedTitle.includes(token));
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

function sortHits(hits: SegmentHit[]): SegmentHit[] {
    return [...hits].sort((a, b) => b.score - a.score
        || (a.page ?? Number.MAX_SAFE_INTEGER) - (b.page ?? Number.MAX_SAFE_INTEGER)
        || a.start - b.start);
}

// OCR pages can be split into multiple search chunks. The reader opens at PDF-page
// granularity, so returning several near-identical excerpts from that same page adds
// noise without adding a distinct citation. Keep the strongest excerpt per page.
function collapseDocumentHits(hits: SegmentHit[]): SegmentHit[] {
    const byPage = new Map<number, SegmentHit>();
    const withoutPage: SegmentHit[] = [];
    for (const hit of sortHits(hits)) {
        if (typeof hit.page !== 'number') {
            withoutPage.push(hit);
            continue;
        }
        if (!byPage.has(hit.page)) byPage.set(hit.page, hit);
    }
    return sortHits([...byPage.values(), ...withoutPage]);
}

// Repeated X/asterisk/equal-sign runs in scanned books are decorative OCR
// separators (for example, chapter rules), not searchable prose. Strip only those
// obvious runs from search text and excerpts; the facsimile and canonical OCR remain
// untouched and the result still cites the exact PDF page.
function cleanBookOcrForSearch(text: string, label?: string) {
    let cleaned = text;
    const pageTitle = label?.replace(/^page\s*-\s*/i, '').trim();
    if (pageTitle && pageTitle.length >= 12) {
        const escapedTitle = pageTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        cleaned = cleaned.replace(new RegExp(`^(${escapedTitle})(?:\\s+\\1)+`, 'i'), '$1');
    }

    return cleaned
        .replace(/(?:x{5,}|\*{5,}|_{5,}|={5,})/gi, ' ')
        .replace(/[ \t]{2,}/g, ' ')
        .trim();
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}
