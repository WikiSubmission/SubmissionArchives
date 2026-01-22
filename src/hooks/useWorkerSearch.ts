
import { useState, useEffect, useRef, useCallback } from 'react';
import type { SearchResult, SearchOptions } from '../lib/search/core';
import type { WorkerMessage, WorkerResponse } from '../lib/search/worker';

export function useWorkerSearch() {
    const [isReady, setIsReady] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [searchTime, setSearchTime] = useState(0);

    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker
        workerRef.current = new Worker(new URL('../lib/search/worker.ts', import.meta.url));

        workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const msg = e.data;

            switch (msg.type) {
                case 'READY':
                    setIsReady(true);
                    break;
                case 'SEARCH_RESULTS':
                    setResults(msg.payload.results);
                    setSearchTime(msg.payload.duration);
                    setIsSearching(false);
                    break;
                case 'ERROR':
                    setError(msg.payload.error);
                    setIsSearching(false);
                    break;
            }
        };

        // Load index (Simulated fetching for now)
        // In a real app, you might fetch JSONs here and send to worker
        // For this demo, we assume the worker or this hook loads the data
        // But since data is in src/data, we might need to import it here or fetch it.
        // Let's trying importing the JSON directly if Next.js allows, or fetch it.

        async function loadData() {
            try {
                // Dynamically import data to avoid bloating main bundle
                // Note: In Next.js, large JSONs should ideally be fetched from public/
                // but since the original implementation used local imports, we stick to that for now.
                const [indexModule, contentModule] = await Promise.all([
                    import('../data/newsletters/search-index-optimized.json'),
                    import('../data/newsletters/search-content.json')
                ]);

                workerRef.current?.postMessage({
                    type: 'LOAD_INDEX',
                    payload: {
                        index: indexModule.default,
                        content: contentModule.default
                    }
                } as WorkerMessage);

            } catch (err) {
                console.error("Failed to load search index", err);
                setError("Failed to load search index");
            }
        }

        loadData();

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const search = useCallback((query: string, options: SearchOptions = {}) => {
        if (!workerRef.current || !isReady) return;

        setIsSearching(true);
        setError(null);

        workerRef.current.postMessage({
            type: 'SEARCH',
            payload: { query, options }
        } as WorkerMessage);
    }, [isReady]);

    return {
        search,
        results,
        isSearching,
        isReady,
        error,
        searchTime
    };
}
