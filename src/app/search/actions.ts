'use server';

import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';
import { findQueryMatch } from '@/lib/search/queryMatch';
import { checkRateLimit, getClientIp } from '@/lib/security';

const MAX_QUERY_LENGTH = 120;
const SEARCH_RATE_LIMIT = 40;
const ALLOWED_FILTERS = new Set([
    'video',
    'sermon',
    'quran-study',
    'video-program',
    'audio',
    'messenger-audio',
    'perspective',
    'appendix',
    'other',
]);

type SearchMatch = {
    id: string;
    content: string;
    start_time: number;
    page?: number;
    score?: number;
    kind?: string;
    distance?: number;
};

type SearchMedia = {
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

type SearchResult = {
    media: SearchMedia;
    matches: SearchMatch[];
    bestScore?: number;
    matchCount?: number;
};

type SearchOptions = {
    proximityWindow?: number;
};

type MasterSegment = {
    start?: number;
    end?: number;
    text?: string;
    page?: number;
    sectionIndex?: number;
};

type MasterIndexItem = {
    id: string;
    title?: string;
    displayTitle?: string;
    type: string;
    category?: string;
    author?: string;
    date?: string;
    fullDate?: string;
    pdfLink?: string;
    thumbnailOverride?: string;
    primaryNumber?: number;
    alternateNumbers?: string[];
    alternateNumberLabel?: string;
    segments?: MasterSegment[];
};

function readGeneratedIndex<T>(filename: string): T[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T[];
}

function getSearchIndex() {
    const master = readGeneratedIndex<MasterIndexItem>('MASTER_INDEX.json');
    if (master.length > 0) return master;

    const videos = readGeneratedIndex<MasterIndexItem>('ALL_VIDEO_PROGRAMS.json')
        .map((item) => ({ ...item, category: 'Videos' }));
    const audios = readGeneratedIndex<MasterIndexItem>('ALL_AUDIOS.json')
        .map((item) => ({
            ...item,
            category: item.type === 'quran-study' ? 'Quran Studies' : 'Messenger Audios',
        }));

    return [...videos, ...audios];
}

export async function searchTranscripts(query: string, typeFilters: string[], options: SearchOptions = {}) {
    try {
        const requestHeaders = await headers();
        const rateLimit = checkRateLimit(`search:${getClientIp(requestHeaders)}`, SEARCH_RATE_LIMIT);
        if (rateLimit.limited) {
            return { success: false, error: 'Too many searches. Please try again shortly.' };
        }

        if (typeof query !== 'string' || query.trim().length === 0) {
            return { success: true, data: [] };
        }

        const cleanQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
        const cleanOptions: Required<SearchOptions> = {
            proximityWindow: clamp(Number(options.proximityWindow) || 18, 2, 40),
        };
        const cleanFilters = Array.isArray(typeFilters)
            ? [...new Set(typeFilters.filter((filter) => ALLOWED_FILTERS.has(filter)))]
            : [];

        const finalResults = searchMasterIndex(cleanQuery, cleanFilters, cleanOptions)
            .map(rankResult)
            .sort((a, b) => (b.bestScore ?? 0) - (a.bestScore ?? 0));

        return { success: true, data: finalResults };

    } catch (err: unknown) {
        console.error('[Server Action] Search Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Search failed' };
    }
}

function searchMasterIndex(
    query: string,
    filters: string[],
    options: Required<SearchOptions>,
): SearchResult[] {
    const results: SearchResult[] = [];
    const items = getSearchIndex();

    for (const item of items) {
        if (!isMasterItemAllowed(item, filters)) continue;

        const matches: SearchMatch[] = [];
        item.segments?.forEach((segment, index) => {
            const result = findQueryMatch(segment.text || '', query, options);
            if (!result.matched) return;

            matches.push({
                id: `${item.id}-${segment.start ?? segment.page ?? index}`,
                content: result.snippet || segment.text || '',
                start_time: segment.start ?? 0,
                page: segment.page,
                score: result.score,
                kind: result.kind,
                distance: result.distance,
            });
        });

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

function isMasterItemAllowed(item: MasterIndexItem, filters: string[]) {
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

function sortMatches(matches: SearchMatch[]) {
    return matches.sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.start_time - b.start_time);
}

function rankResult(result: SearchResult): SearchResult {
    const matches = sortMatches(result.matches);
    const bestScore = matches[0]?.score ?? 0;
    return {
        ...result,
        matches,
        bestScore,
        matchCount: matches.length,
    };
}

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}
