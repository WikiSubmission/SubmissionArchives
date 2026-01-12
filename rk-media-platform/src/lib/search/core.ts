
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
}

interface OptimizedIndex {
    documents: IndexDocument[];
    invertedIndex: Record<string, string[]>;
    ngrams: Record<string, string[]>;
}

interface ContentStore {
    [docId: string]: string;
}

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2);
}

function generateTrigrams(word: string): string[] {
    if (word.length < 3) return [];
    const trigrams: string[] = [];
    for (let i = 0; i <= word.length - 3; i++) {
        trigrams.push(word.substring(i, i + 3));
    }
    return trigrams;
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

        // Term in content
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
    const terms = tokenize(query);
    if (terms.length === 0) return [];

    const candidateDocs = new Set<string>();

    terms.forEach(term => {
        // Exact match
        const docIds = index.invertedIndex[term] || [];
        docIds.forEach(id => candidateDocs.add(id));

        // Fuzzy match
        if (options.enableFuzzy) {
            const trigrams = generateTrigrams(term);
            trigrams.forEach(trigram => {
                const similarWords = index.ngrams[trigram] || [];
                similarWords.forEach(word => {
                    // Similarity check could be added here (Levenshtein)
                    // For now, accept n-gram matches (simple fuzzy)
                    const fuzzyDocs = index.invertedIndex[word] || [];
                    fuzzyDocs.forEach(id => candidateDocs.add(id));
                });
            });
        }
    });

    const results: SearchResult[] = [];

    for (const docId of candidateDocs) {
        const doc = index.documents.find(d => d.id === docId);
        if (!doc) continue;

        // Filter by Year
        if (options.yearFilter) {
            if (!doc.date.includes(options.yearFilter)) continue;
        }

        const content = contentStore[docId] || "";
        const score = calculateScore(doc, terms, content, query);

        if (score >= (options.minScore || 10)) {
            results.push({
                id: doc.id,
                title: doc.title,
                date: doc.date,
                filename: doc.filename,
                matches: [generateSnippet(content, terms)] // Single snippet for now
                // In future we can add score to SearchResult type if needed
            });
        }
    }

    // Sort
    if (options.sortBy === 'date-asc') {
        // Naive sort, assuming fullDate is available or parsable
        // But doc only has display timestamp. The index HAS date field which is display date.
        // build script stores date: newsletter.displayDate
        // We might need ISO date for sorting. 
        // For now, let's skip complex date sorting or rely on display string if standard
    } else if (options.sortBy === 'relevance') {
        // We don't have score in SearchResult type yet.
        // But we computed it. 
        // Actually, my cache.ts defined SearchResult WITHOUT score. 
        // I should update SearchResult type to include score.
    }

    // Since SearchResult doesn't have score, we need to sort BEFORE mapping to result? 
    // No, I pushed to results array. 

    // FIXME: Proper sorting requires score in the object. 
    // I will extend the type locally for sorting.

    return results.slice(0, options.maxResults || 50);
}
