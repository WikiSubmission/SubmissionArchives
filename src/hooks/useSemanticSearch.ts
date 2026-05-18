import { useState, useEffect, useCallback } from 'react';
import { calculateTFIDF, semanticSearch, SearchResult, TranscriptSegment } from '../utils/semanticSearch';

export function useSemanticSearch(segments: TranscriptSegment[]) {
    const [tfidf, setTfidf] = useState<Map<string, number>[] | null>(null);
    const [isIndexing, setIsIndexing] = useState(false);

    useEffect(() => {
        if (!segments || segments.length === 0) return;

        // Run in timeout to allow UI to render first
        const timer = setTimeout(() => {
            setIsIndexing(true);
            try {
                // This is a heavy operation, effectively "indexing"
                const computed = calculateTFIDF(segments);
                setTfidf(computed);
            } catch (e) {
                console.error("Indexing failed", e);
            } finally {
                setIsIndexing(false);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [segments]);

    const search = useCallback((query: string): SearchResult[] => {
        if (!tfidf || !segments) return [];
        return semanticSearch(query, segments, tfidf);
    }, [tfidf, segments]);

    return { search, isIndexing };
}
