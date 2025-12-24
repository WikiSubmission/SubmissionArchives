'use server';

import fs from 'fs';
import path from 'path';

const INDEX_PATH = path.join(process.cwd(), 'public/data/newsletters/search_index.json');

export type SearchResult = {
    id: string;
    title: string;
    date: string;
    filename: string;
    matches: string[]; // Snippets
};

export async function searchNewsletters(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) return [];

    if (!fs.existsSync(INDEX_PATH)) return [];

    const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
    const results: SearchResult[] = [];

    const term = query.toLowerCase();

    for (const item of index) {
        const content = (item.content || "").toLowerCase();
        // Check title match
        const titleMatch = item.title.toLowerCase().includes(term);
        // Check content match
        const contentIndices = [];
        let pos = content.indexOf(term);
        while (pos !== -1) {
            contentIndices.push(pos);
            pos = content.indexOf(term, pos + 1);
        }

        if (titleMatch || contentIndices.length > 0) {
            // Generate snippets
            const uniqueSnippets = new Set<string>();

            // Limit snippets to first 3 matches to avoid huge payload
            contentIndices.slice(0, 3).forEach(idx => {
                const start = Math.max(0, idx - 60);
                const end = Math.min(content.length, idx + term.length + 60);
                let snippet = item.content.substring(start, end);
                if (start > 0) snippet = "..." + snippet;
                if (end < content.length) snippet = snippet + "...";
                uniqueSnippets.add(snippet);
            });

            results.push({
                id: item.id,
                title: item.title,
                date: item.displayDate,
                filename: item.filename,
                matches: Array.from(uniqueSnippets)
            });
        }
    }

    return results;
}
