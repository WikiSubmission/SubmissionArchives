// Shared between the search UI (which emits) and /api/search/feedback (which
// validates), so the event shape has a single definition. Mirrors the split in
// webVitals.ts. No identifiers are carried — query text only.

const MAX_QUERY_CHARS = 200;
const MAX_ID_CHARS = 300;

export type SearchAnalyticsEvent =
    | {
        name: 'search.query';
        query: string;
        filterCount: number;
        resultCount: number;
        latencyMs: number;
    }
    | {
        name: 'search.click';
        query: string;
        rank: number;
        mediaId: string;
        matchKind?: string;
    }
    | {
        name: 'search.suggest_select';
        query: string;
        suggestionId: string;
        position: number;
    };

const ENDPOINT = '/api/search/feedback';

// Fire-and-forget: analytics must never delay or break a search. sendBeacon is
// preferred because search.click fires as the page navigates away.
export function logSearchEvent(event: SearchAnalyticsEvent): void {
    if (typeof window === 'undefined') return;

    try {
        const body = JSON.stringify(event);
        if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: 'application/json' }))) {
            return;
        }
        void fetch(ENDPOINT, {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
        }).catch(() => undefined);
    } catch {
        // Never surface an analytics failure.
    }
}

export function parseSearchEvent(input: unknown): SearchAnalyticsEvent | null {
    if (typeof input !== 'object' || input === null) return null;
    const raw = input as Record<string, unknown>;

    const query = clampString(raw.query, MAX_QUERY_CHARS);
    if (query === null) return null;

    switch (raw.name) {
        case 'search.query': {
            const filterCount = wholeNumber(raw.filterCount);
            const resultCount = wholeNumber(raw.resultCount);
            const latencyMs = wholeNumber(raw.latencyMs);
            if (filterCount === null || resultCount === null || latencyMs === null) return null;
            return { name: 'search.query', query, filterCount, resultCount, latencyMs };
        }
        case 'search.click': {
            const rank = wholeNumber(raw.rank);
            const mediaId = clampString(raw.mediaId, MAX_ID_CHARS);
            if (rank === null || !mediaId) return null;
            const matchKind = clampString(raw.matchKind, 40);
            return { name: 'search.click', query, rank, mediaId, ...(matchKind ? { matchKind } : {}) };
        }
        case 'search.suggest_select': {
            const position = wholeNumber(raw.position);
            const suggestionId = clampString(raw.suggestionId, MAX_ID_CHARS);
            if (position === null || !suggestionId) return null;
            return { name: 'search.suggest_select', query, suggestionId, position };
        }
        default:
            return null;
    }
}

function clampString(value: unknown, max: number): string | null {
    if (typeof value !== 'string') return null;
    return value.slice(0, max);
}

function wholeNumber(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
    return Math.round(value);
}
