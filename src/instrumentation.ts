// Runs once when the server starts.
//
// Parsing the 26MB master index takes 1–2s, and without this the cost lands on whichever
// visitor happens to search first after a deploy. Doing it at startup moves that off the
// request path entirely; every real search then sees the warm 12–22ms path.
export async function register() {
    // Guard the runtime: the index reads from disk, which the edge runtime cannot do.
    if (process.env.NEXT_RUNTIME !== 'nodejs') return;

    try {
        const { warmSearchIndex } = await import('@/lib/search/searchIndex');
        const started = Date.now();
        const recordCount = warmSearchIndex();
        const { logger } = await import('@/lib/logger');
        logger.info(
            { event: 'search.index_warmed', recordCount, durationMs: Date.now() - started },
            'Search index warmed at startup',
        );
    } catch (error) {
        // A failed warm-up must not stop the server booting — the index will simply be
        // parsed lazily on the first search, which is the old behaviour.
        const { logger } = await import('@/lib/logger');
        logger.warn({ event: 'search.index_warm_failed', err: error }, 'Search index warm-up failed');
    }
}
