
'use server';

import { supabase } from '@/lib/supabaseClient';

export async function searchTranscripts(query: string, typeFilters: string[]) {
    try {
        console.log(`[Server Action] Searching for "${query}" in types: ${typeFilters.join(', ')}`);

        // 1. Search Segments
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
            .in('media.type', typeFilters)
            .limit(100);

        if (error) {
            console.error("[Server Action] Supabase Error:", error);
            throw new Error(error.message);
        }

        // 2. Group by Media (Logic moved to server for efficiency)
        const grouped = new Map();
        segments?.forEach(seg => {
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

        const results = Array.from(grouped.values());
        console.log(`[Server Action] Found ${segments?.length || 0} segments in ${results.length} media items.`);
        return { success: true, data: results };

    } catch (err: any) {
        console.error("[Server Action] Search Exception:", err);
        return { success: false, error: err.message };
    }
}
