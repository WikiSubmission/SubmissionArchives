'use server';

import { headers } from 'next/headers';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { runSearch } from '@/lib/search/searchIndex';

const SEARCH_RATE_LIMIT = 40;
const DEFAULT_PROXIMITY_WINDOW = 18;

// Retained for the homepage search demo, which renders results inline rather
// than through the paginated /api/search route the search page uses.
export async function searchTranscripts(
    query: string,
    typeFilters: string[],
    options: { proximityWindow?: number } = {},
) {
    try {
        const requestHeaders = await headers();
        const rateLimit = checkRateLimit(`search:${getClientIp(requestHeaders)}`, SEARCH_RATE_LIMIT);
        if (rateLimit.limited) {
            return { success: false, error: 'Too many searches. Please try again shortly.' };
        }

        if (typeof query !== 'string' || query.trim().length === 0) {
            return { success: true, data: [] };
        }

        const proximityWindow = Number(options.proximityWindow) || DEFAULT_PROXIMITY_WINDOW;
        const filters = Array.isArray(typeFilters) ? typeFilters : [];

        return { success: true, data: runSearch(query, filters, proximityWindow) };
    } catch (err: unknown) {
        console.error('[Server Action] Search Exception:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Search failed' };
    }
}
