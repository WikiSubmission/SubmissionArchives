import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse, sanitizeSearchQuery } from '@/lib/security';
import { getSuggestions, MAX_SUGGESTIONS } from '@/lib/search/searchIndex';
import { logger } from '@/lib/logger';

// Suggest fires far more often than a full search (one per typing pause), so it gets
// its own, looser budget.
const SUGGEST_RATE_LIMIT = 120;

export async function GET(request: NextRequest) {
    const rateLimit = checkRateLimit(`suggest:${getClientIp(request.headers)}`, SUGGEST_RATE_LIMIT);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    const { query } = sanitizeSearchQuery(request.nextUrl.searchParams.get('q'));

    try {
        return NextResponse.json(
            { suggestions: getSuggestions(query, MAX_SUGGESTIONS) },
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error: unknown) {
        logger.error({ event: 'suggest.failed', err: error }, 'Suggest failed');
        return NextResponse.json(
            { error: 'Suggestions unavailable.' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } },
        );
    }
}
