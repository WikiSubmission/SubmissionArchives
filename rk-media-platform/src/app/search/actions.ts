
'use server';

import { supabase } from '@/lib/supabaseClient';
import newsletterData from '../../../public/data/newsletters/search_index.json';
import appendicesData from '../../../public/data/appendices/search_index.json';

export async function searchTranscripts(query: string, typeFilters: string[]) {
    try {
        console.log(`[Server Action] Searching for "${query}" in types: ${typeFilters.join(', ')}`);

        // 1. Search Segments (Supabase)
        let dbResults: any[] = [];

        // Only query Supabase if we are looking for non-perspective types
        const dbTypes = typeFilters.filter(t => t !== 'perspective');

        if (dbTypes.length > 0) {
            const { data: segments, error } = await supabase
                .from('transcript_segments')
                .select(`
                    id,
                    content,
                    start_time,
                    media!inner (
                        id,
                        title,
                        type,
                        created_at,
                        local_filename,
                        duration_seconds
                    )
                `)
                .ilike('content', `%${query}%`)
                .in('media.type', dbTypes)
                .limit(100);

            if (error) {
                console.error("[Server Action] Supabase Error:", error);
                throw new Error(error.message);
            }
            dbResults = segments || [];
        }

        // 2. Group Supabase Results
        const grouped = new Map();
        dbResults.forEach(seg => {
            const mId = seg.media.id;
            if (!grouped.has(mId)) {
                grouped.set(mId, {
                    media: seg.media,
                    matches: []
                });
            }
            grouped.get(mId).matches.push({
                id: seg.id,
                content: seg.content,
                start_time: seg.start_time
            });
        });

        let finalResults = Array.from(grouped.values());

        // 3. Search Newsletters (Local JSON)
        if (typeFilters.includes('perspective')) {
            const lowerQuery = query.toLowerCase();
            const newsletterMatches = newsletterData
                .filter((item: any) => item.content.toLowerCase().includes(lowerQuery))
                .map((item: any) => {
                    // Find matches in content
                    const content = item.content;
                    const matches = [];
                    let lastIndex = 0;

                    // Simple regex to find all occurrences (case-insensitive)
                    // We'll just grab a snippet around the first few matches
                    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    let match;
                    let count = 0;

                    while ((match = regex.exec(content)) !== null && count < 5) {
                        // Extract a snippet ~100 chars around match
                        const start = Math.max(0, match.index - 60);
                        const end = Math.min(content.length, match.index + query.length + 60);
                        let snippet = content.substring(start, end);
                        if (start > 0) snippet = '...' + snippet;
                        if (end < content.length) snippet = snippet + '...';

                        matches.push({
                            id: `nl-${item.id}-${count}`,
                            content: snippet,
                            start_time: 0 // Newsletters don't have timestamps
                        });
                        count++;
                    }

                    return {
                        media: {
                            id: item.filename, // Use filename for ID to link correctly
                            title: item.title,
                            type: 'perspective',
                            displayDate: item.displayDate,
                            author: 'Rashad Khalifa', // Default/Assumed
                            filename: item.filename
                        },
                        matches
                    };
                });

            finalResults = [...finalResults, ...newsletterMatches];
        }

        // 4. Search Appendices (Local JSON)
        if (typeFilters.includes('appendix')) {
            const lowerQuery = query.toLowerCase();
            const appendixMatches = appendicesData
                .filter((item: any) => item.content.toLowerCase().includes(lowerQuery))
                .map((item: any) => {
                    const content = item.content;
                    const matches = [];
                    const regex = new RegExp(query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'gi');
                    let match;
                    let count = 0;

                    while ((match = regex.exec(content)) !== null && count < 5) {
                        const start = Math.max(0, match.index - 60);
                        const end = Math.min(content.length, match.index + query.length + 60);
                        let snippet = content.substring(start, end);
                        if (start > 0) snippet = '...' + snippet;
                        if (end < content.length) snippet = snippet + '...';

                        matches.push({
                            id: `ap-${item.id}-${count}`,
                            content: snippet,
                            start_time: 0
                        });
                        count++;
                    }

                    return {
                        media: {
                            id: item.filename,
                            title: item.title,
                            type: 'appendix',
                            author: 'Rashad Khalifa',
                            filename: item.filename
                        },
                        matches
                    };
                });

            finalResults = [...finalResults, ...appendixMatches];
        }

        console.log(`[Server Action] Found ${finalResults.length} items total.`);
        return { success: true, data: finalResults };

    } catch (err: any) {
        console.error("[Server Action] Search Exception:", err);
        return { success: false, error: err.message };
    }
}
