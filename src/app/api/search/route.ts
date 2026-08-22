import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse, sanitizeSearchQuery } from '@/lib/security';
import { runSearch } from '@/lib/search/searchIndex';
import { logger } from '@/lib/logger';

// Keyed on client IP, which means everyone behind one NAT — an office, a university, a
// mosque — shares this budget. 40/min was low enough that a handful of simultaneous
// readers on one connection could throttle each other, so it is raised to 120 (matching
// suggest) while still stopping a scripted crawl. Overridable for test runs, which issue a
// whole suite's worth of searches from a single IP inside one window.
const SEARCH_RATE_LIMIT = Number(process.env.SEARCH_RATE_LIMIT) || 120;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const DEFAULT_PROXIMITY_WINDOW = 18;

export async function GET(request: NextRequest) {
    const rateLimit = checkRateLimit(`search:${getClientIp(request.headers)}`, SEARCH_RATE_LIMIT);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    const params = request.nextUrl.searchParams;
    const { query, suspicious } = sanitizeSearchQuery(params.get('q'));
    if (suspicious) {
        logger.warn({ event: 'search.suspicious_query', query }, 'Suspicious query pattern');
    }
    const filters = (params.get('filters') ?? '').split(',').filter(Boolean);
    const limit = clampInt(params.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT);
    const offset = clampInt(params.get('offset'), 0, 0, Number.MAX_SAFE_INTEGER);

    try {
        const ranked = runSearch(query, filters, DEFAULT_PROXIMITY_WINDOW);

        return NextResponse.json(
            {
                results: ranked.slice(offset, offset + limit),
                total: ranked.length,
                totalMatches: ranked.reduce((sum, result) => sum + (result.matchCount ?? result.matches.length), 0),
                limit,
                offset,
            },
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error: unknown) {
        logger.error({ event: 'search.failed', err: error }, 'Search failed');
        return NextResponse.json(
            { error: 'Search failed. Please try again shortly.' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } },
        );
    }
}

function clampInt(raw: string | null, fallback: number, min: number, max: number) {
    const parsed = Number.parseInt(raw ?? '', 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, parsed));
}
