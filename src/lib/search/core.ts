
import { SearchResult } from './cache';

export type { SearchResult };

export interface SearchOptions {
    yearFilter?: string;
    sortBy?: 'relevance' | 'date-asc' | 'date-desc';
    minScore?: number;
    maxResults?: number;
    enableFuzzy?: boolean;
}

interface IndexDocument {
    id: string;
    title: string;
    titleLower: string;
    date: string;
    filename: string;
    dateTimestamp?: number; // Pre-parsed for fast sorting
}


import { getPhoneticCode } from './phonetic';

interface OptimizedIndex {
    documents: IndexDocument[];
    invertedIndex: Record<string, string[]>;
    phonetic: Record<string, string[]>; // CHANGED: ngrams -> phonetic
}

interface ContentStore {
    [docId: string]: string;
}

// Common English stopwords to filter out
const STOPWORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
    'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who',
    'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very'
]);


export function normalizeQuery(query: string): string {
    return query
        .toLowerCase()
        .replace(/[^\w\s"]/g, '') // Keep quotes for phrase detection
        .replace(/\s+/g, ' ')
        .trim();
}

export function splitQuery(query: string): string[] {
    // Handle "exact phrases"
    const phraseMatches = query.match(/"([^"]+)"/g);

    if (phraseMatches) {
        const phrases = phraseMatches.map(p => p.replace(/"/g, ''));
        const words = query
            .replace(/"[^"]+"/g, '') // Remove phrases
            .split(/\s+/)
            .filter(w => w.length > 0 && !STOPWORDS.has(w));

        return [...phrases, ...words];
    }

    return query.split(/\s+/).filter(w => w.length > 0 && !STOPWORDS.has(w));
}

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOPWORDS.has(w)); // Filter stopwords
}

function generateTrigrams(word: string): string[] {
    if (word.length < 3) return [];
    const trigrams: string[] = [];
    for (let i = 0; i <= word.length - 3; i++) {
        trigrams.push(word.substring(i, i + 3));
    }
    return trigrams;
}

// Parse date string to timestamp for sorting
function parseDateToTimestamp(dateStr: string): number {
    try {
        // Try parsing common formats
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? 0 : date.getTime();
    } catch {
        return 0;
    }
}

// Calculate relevance score
function calculateScore(
    doc: IndexDocument,
    queryTerms: string[],
    content: string,
    fullQuery: string
): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Exact phrase match in title (Highest weight)
    if (doc.titleLower.includes(fullQuery.toLowerCase())) {
        score += 50;
    }

    // Exact phrase match in content
    if (contentLower.includes(fullQuery.toLowerCase())) {
        score += 30;
    }

    queryTerms.forEach(term => {
        // Term in title
        if (doc.titleLower.includes(term)) {
            score += 20;
        }

        // Term in content with word boundaries
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = (contentLower.match(regex) || []).length;
        score += Math.min(matches * 5, 20); // Cap term frequency bonus
    });

    return Math.min(score, 100); // Normalize to 100
}

// Extract updated snippets with highlighting
function generateSnippet(content: string, terms: string[]): string {
    const contentLower = content.toLowerCase();
    let bestPos = -1;
    let maxTermCount = 0;

    // Find best window
    const windowSize = 150;

    // Try to find a window with multiple terms
    for (const term of terms) {
        let pos = contentLower.indexOf(term);
        while (pos !== -1) {
            // Count terms in this window
            let count = 0;
            const windowEnd = Math.min(content.length, pos + windowSize);
            const windowText = contentLower.substring(pos, windowEnd);

            terms.forEach(t => {
                if (windowText.includes(t)) count++;
            });

            if (count > maxTermCount) {
                maxTermCount = count;
                bestPos = pos;
            }

            pos = contentLower.indexOf(term, pos + 1);
        }
    }

    if (bestPos === -1) {
        // If no terms found (fuzzy match?), just take start
        bestPos = 0;
    }

    // Formatting
    const start = Math.max(0, bestPos - 40);
    const end = Math.min(content.length, bestPos + windowSize);

    let snippet = content.substring(start, end);
    if (start > 0) snippet = "..." + snippet;
    if (end < content.length) snippet = snippet + "...";

    return snippet;
}

export async function searchOptimized(
    index: OptimizedIndex,
    contentStore: ContentStore,
    query: string,
    options: SearchOptions
): Promise<SearchResult[]> {
    // Preprocess query
    const terms = splitQuery(query);
    if (terms.length === 0) return [];

    const candidateDocs = new Set<string>();

    terms.forEach(term => {
        // Exact match
        const docIds = index.invertedIndex[term] || [];
        docIds.forEach(id => candidateDocs.add(id));

        // Fuzzy match (Phonetic) - Apply only to single words, not phrases
        if (options.enableFuzzy && !term.includes(' ')) {
            const code = getPhoneticCode(term);
            if (code) {
                const similarWords = index.phonetic[code] || [];
                similarWords.forEach(word => {
                    if (word === term) return;
                    const fuzzyDocs = index.invertedIndex[word] || [];
                    fuzzyDocs.forEach(id => candidateDocs.add(id));
                });
            }
        }
    });

    // Results with scores
    const resultsWithScores: Array<SearchResult & { score: number; dateTimestamp: number }> = [];
    let topScore = 0;
    const maxResults = options.maxResults || 50;

    // Convert Set to Array for iteration
    const docIds = Array.from(candidateDocs);

    for (const docId of docIds) {
        const doc = index.documents.find(d => d.id === docId);
        if (!doc) continue;

        // Filter by Year
        if (options.yearFilter) {
            if (!doc.date.includes(options.yearFilter)) continue;
        }

        const content = contentStore[docId] || "";
        const score = calculateScore(doc, terms, content, query);

        if (score >= (options.minScore || 10)) {
            if (score > topScore) {
                topScore = score;
            }

            const dateTimestamp = doc.dateTimestamp || parseDateToTimestamp(doc.date);

            resultsWithScores.push({
                id: doc.id,
                title: doc.title,
                date: doc.date,
                filename: doc.filename,
                matches: [generateSnippet(content, terms)],
                score,
                dateTimestamp
            });

            // Early termination check
            // Only if we found enough results and the current one is significantly worse than the best
            // Note: Since we are iterating candidateDocs (which are unsorted), this heuristic 
            // works best if we assume high relevance docs share many terms and appear early or 
            // if we are processing many docs. 
            // Actually, since candidateDocs is arbitrary order, early termination is risky UNLESS
            // we have processed a large number.
            // The heuristic "scoredResults.length >= maxResults * 2" is safer.

            if (resultsWithScores.length >= maxResults * 2) {
                if (score < topScore * 0.3) {
                    // console.log(`⏩ Early termination: score ${score} too low vs ${topScore}`);
                    break;
                }
            }
        }
    }

    // Sort results based on option
    if (options.sortBy === 'relevance' || !options.sortBy) {
        resultsWithScores.sort((a, b) => b.score - a.score);
    } else if (options.sortBy === 'date-desc') {
        resultsWithScores.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
    } else if (options.sortBy === 'date-asc') {
        resultsWithScores.sort((a, b) => a.dateTimestamp - b.dateTimestamp);
    }

    // Return limited results
    return resultsWithScores.slice(0, maxResults);
}
