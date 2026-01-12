// Simple TF-IDF based semantic search (no API needed)

export interface SearchResult {
    index: number;
    score: number;
    segment: any;
}

export function buildVocabulary(segments: any[]) {
    const vocab = new Map<string, number[]>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'it', 'this', 'that']);

    segments.forEach((seg, docId) => {
        const words = seg.content.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((w: string) => w.length > 2 && !stopWords.has(w));

        words.forEach((word: string) => {
            if (!vocab.has(word)) {
                vocab.set(word, []);
            }
            vocab.get(word)!.push(docId);
        });
    });

    return vocab;
}

export function calculateTFIDF(segments: any[]) {
    const vocab = buildVocabulary(segments);
    const tfidf: Map<string, number>[] = [];

    segments.forEach((seg, docId) => {
        const words = seg.content.toLowerCase().split(/\s+/);
        const termFreq = new Map<string, number>();

        // Calculate TF
        words.forEach((word: string) => {
            termFreq.set(word, (termFreq.get(word) || 0) + 1);
        });

        // Calculate TF-IDF
        const scores = new Map<string, number>();
        termFreq.forEach((tf, term) => {
            const df = vocab.get(term)?.length || 1;
            const idf = Math.log(segments.length / df);
            scores.set(term, (tf / words.length) * idf);
        });

        tfidf[docId] = scores;
    });

    return tfidf;
}

export function semanticSearch(query: string, segments: any[], tfidf: Map<string, number>[]) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const scores: SearchResult[] = [];

    segments.forEach((seg, i) => {
        let score = 0;
        const segmentScores = tfidf[i];

        queryTerms.forEach(term => {
            // Exact match
            if (segmentScores.has(term)) {
                score += segmentScores.get(term)! * 2;
            }

            // Fuzzy match (Levenshtein distance) via crude scan if not exact
            // Note: Full fuzzy scan on every term against every segment term is slow. 
            // Optimizing to only check if not exact match, and maybe limiting vocab scan.
            // For now, let's trust the user's implementation but optimize by iterating segmentScores keys.
            segmentScores.forEach((tfidfScore, segTerm) => {
                if (term === segTerm) return; // Already handled
                const similarity = calculateSimilarity(term, segTerm);
                if (similarity > 0.7) {
                    score += tfidfScore * similarity;
                }
            });
        });

        if (score > 0) {
            scores.push({ index: i, score, segment: seg });
        }
    });

    return scores.sort((a, b) => b.score - a.score);
}

// Levenshtein distance for fuzzy matching
function calculateSimilarity(a: string, b: string) {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    const distance = matrix[b.length][a.length];
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    return 1 - (distance / maxLen);
}
