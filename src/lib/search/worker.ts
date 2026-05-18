
import { searchOptimized, SearchResult, SearchOptions, normalizeQuery } from './core';
import type { ContentStore, OptimizedIndex } from './core';

// Define message types
export type WorkerMessage =
    | { type: 'LOAD_INDEX'; payload: { index: OptimizedIndex; content: ContentStore } }
    | { type: 'SEARCH'; payload: { query: string; options: SearchOptions } };

export type WorkerResponse =
    | { type: 'SEARCH_RESULTS'; payload: { results: SearchResult[]; duration: number } }
    | { type: 'ERROR'; payload: { error: string } }
    | { type: 'READY' };

// State
let searchIndex: OptimizedIndex | null = null;
let contentStore: ContentStore | null = null;

// Cache
const queryCache = new Map<string, SearchResult[]>();
const MAX_CACHE_SIZE = 100;

// Analytics
const analytics = {
    totalSearches: 0,
    totalTime: 0,
    slowQueries: [] as Array<{ query: string; time: number }>
};

function trackSearch(query: string, duration: number) {
    analytics.totalSearches++;
    analytics.totalTime += duration;

    if (duration > 100) {
        analytics.slowQueries.push({ query, time: duration });
        console.warn(`🐌 Slow query: "${query}" (${duration.toFixed(2)}ms)`);
    }

    // Log average every 10 searches check
    if (analytics.totalSearches % 10 === 0) {
        const avg = analytics.totalTime / analytics.totalSearches;
        console.log(`📊 Avg search time: ${avg.toFixed(1)}ms (${analytics.totalSearches} total)`);
    }
}

// Message Handler
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, payload } = e.data;

    try {
        switch (type) {
            case 'LOAD_INDEX':
                searchIndex = payload.index;
                contentStore = payload.content;
                self.postMessage({ type: 'READY' } as WorkerResponse);
                break;

            case 'SEARCH':
                if (!searchIndex || !contentStore) {
                    throw new Error('Index not loaded');
                }

                // Normalization
                const normalizedQuery = normalizeQuery(payload.query);

                // Cache Key
                const cacheKey = `${normalizedQuery}:${JSON.stringify(payload.options)}`;

                // 1. Check Cache
                if (queryCache.has(cacheKey)) {
                    // console.log('💾 Cache HIT');
                    self.postMessage({
                        type: 'SEARCH_RESULTS',
                        payload: { results: queryCache.get(cacheKey)!, duration: 0 }
                    } as WorkerResponse);
                    return;
                }

                const startTime = performance.now();
                const results = await searchOptimized(
                    searchIndex,
                    contentStore,
                    normalizedQuery, // Use normalized
                    payload.options
                );
                const duration = performance.now() - startTime;

                // 2. Track Analytics
                trackSearch(normalizedQuery, duration);

                // 3. Update Cache (LRU)
                if (queryCache.size >= MAX_CACHE_SIZE) {
                    const firstKey = queryCache.keys().next().value;
                    if (firstKey) queryCache.delete(firstKey);
                }
                queryCache.set(cacheKey, results);

                self.postMessage({
                    type: 'SEARCH_RESULTS',
                    payload: { results, duration }
                } as WorkerResponse);
                break;
        }
    } catch (err: unknown) {
        self.postMessage({
            type: 'ERROR',
            payload: { error: err instanceof Error ? err.message : 'Unknown worker error' }
        } as WorkerResponse);
    }
};
