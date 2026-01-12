
// Simple in-memory cache for search results

export type SearchResult = {
    id: string;
    title: string;
    date: string;
    filename: string;
    matches: string[];
};

export interface SearchOptions {
    yearFilter?: string;
    sortBy?: 'relevance' | 'date-asc' | 'date-desc';
    minScore?: number;
    maxResults?: number;
}

interface CacheEntry {
    results: SearchResult[];
    timestamp: number;
    options: SearchOptions;
}

export class SearchCache {
    private cache = new Map<string, CacheEntry>();
    private maxAge: number;
    private maxSize: number;

    constructor(maxAge: number = 5 * 60 * 1000, maxSize: number = 50) {
        this.maxAge = maxAge; // Default: 5 minutes
        this.maxSize = maxSize; // Default: 50 queries
    }

    /**
     * Generate cache key from query and options
     */
    private getCacheKey(query: string, options: SearchOptions = {}): string {
        const normalized = query.toLowerCase().trim();
        const optionsKey = JSON.stringify({
            year: options.yearFilter || '',
            sort: options.sortBy || 'relevance',
            min: options.minScore || 10
        });
        return `${normalized}:${optionsKey}`;
    }

    /**
     * Get cached results if available and not expired
     */
    get(query: string, options: SearchOptions = {}): SearchResult[] | null {
        const key = this.getCacheKey(query, options);
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        // Check if expired
        const age = Date.now() - entry.timestamp;
        if (age > this.maxAge) {
            this.cache.delete(key);
            return null;
        }

        return entry.results;
    }

    /**
     * Cache search results
     */
    set(query: string, options: SearchOptions = {}, results: SearchResult[]): void {
        const key = this.getCacheKey(query, options);

        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.findOldest();
            if (oldestKey) {
                this.cache.delete(oldestKey);
            }
        }

        this.cache.set(key, {
            results,
            timestamp: Date.now(),
            options
        });
    }

    /**
     * Find the oldest cache entry
     */
    private findOldest(): string | null {
        let oldestKey: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        return oldestKey;
    }

    /**
     * Clear all cached results
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * Remove expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.maxAge) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): {
        size: number;
        maxSize: number;
        hitRate: number;
        oldestEntry: number;
    } {
        let hits = 0;
        let misses = 0;
        let oldestTime = Date.now();

        for (const entry of this.cache.values()) {
            if (Date.now() - entry.timestamp < this.maxAge) {
                hits++;
            } else {
                misses++;
            }

            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
            }
        }

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: hits / (hits + misses || 1),
            oldestEntry: Date.now() - oldestTime
        };
    }
}

// Export singleton instance
export const searchCache = new SearchCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
    setInterval(() => {
        searchCache.cleanup();
    }, 5 * 60 * 1000);
}
