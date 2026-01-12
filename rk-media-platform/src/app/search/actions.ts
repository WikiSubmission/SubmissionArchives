'use server';

import { supabase } from '@/lib/supabaseClient';
import newsletterData from '../../../public/data/newsletters/search_index.json';
import appendicesData from '../../../public/data/appendices/search_index.json';

// Helper for stream
const streamToString = (stream: any) =>
    new Promise<string>((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// Cache Mega JSON in memory if possible? 
// Next.js server actions might be stateless, but global vars sometimes persist in warm lambdas.
let megaJsonCache: any = null;
let lastFetchTime = 0;

export async function searchTranscripts(query: string, typeFilters: string[]) {
    try {
        console.log(`[Server Action] Searching for "${query}" in types: ${typeFilters.join(', ')}`);

        // 1. Search Segments (Supabase) - EXCLUDING quran-study
        let dbResults: any[] = [];

        // Only query Supabase if we are looking for non-perspective types AND not quran-study
        const dbTypes = typeFilters.filter(t => t !== 'perspective' && t !== 'quran-study' && t !== 'appendix');

        if (dbTypes.length > 0) {
            try {
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
                    // Don't throw, just log.
                } else {
                    dbResults = segments || [];
                }
            } catch (sbError) {
                console.error("[Server Action] Supabase Connection Error:", sbError);
                // Continue execution with empty dbResults
            }
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

        // 3. Search Quran Studies (Mega JSON via R2)
        if (typeFilters.includes('quran-study')) {
            try {
                // Fetch Mega JSON if not cached or old (cache for 5 mins)
                const now = Date.now();
                if (!megaJsonCache || (now - lastFetchTime > 1000 * 60 * 5)) {
                    console.log("Fetching Mega JSON from R2...");
                    const cmd = new GetObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: "media/data/ALL_QURAN_STUDIES_TRANSCRIPTS_MEGA.json"
                    });
                    const response = await r2Client.send(cmd);
                    if (response.Body) {
                        const str = await streamToString(response.Body);
                        megaJsonCache = JSON.parse(str);
                        lastFetchTime = now;
                    }
                }

                if (megaJsonCache) {
                    const lowerQuery = query.toLowerCase();
                    const quranResults = megaJsonCache
                        .map((item: any) => {
                            // item: { index, title, transcript: [{id, content, start_time, ...}] }
                            // Filter segments that match
                            const matches = item.transcript
                                .filter((seg: any) => seg.content && seg.content.toLowerCase().includes(lowerQuery))
                                .map((seg: any) => ({
                                    id: `qs-${item.index}-${seg.id}`,
                                    content: seg.content,
                                    start_time: seg.start_time
                                }));

                            if (matches.length === 0) return null;

                            // Map to result format
                            // We need to match the 'media' object structure expected by page.tsx
                            // Need R2 key (id) for the link. 
                            // The Mega JSON has 'filename' -> "1) Quran Study... .json"
                            // The ID expected by WatchPage is "media/quran-study-v2/..." + filename WITHOUT .json but WITH .mp3?
                            // No, WatchPage ID is the R2 key. 
                            // My files are stored as .mp3 in R2 for audio listing, but transcripts are .json.
                            // The 'filename' in Mega is "1) ... .json".
                            // I should convert it to the MP3 key for the ID.
                            const mp3Filename = item.filename.replace('.json', '.mp3');
                            const r2Key = `media/quran-study-v2/${mp3Filename}`;

                            return {
                                media: {
                                    id: r2Key,
                                    title: item.title, // "1) Quran Study..."
                                    type: 'quran-study',
                                    displayTitle: item.title,
                                    filename: mp3Filename,
                                    author: 'Dr. Rashad Khalifa'
                                },
                                matches: matches.slice(0, 50) // Limit matches per file
                            };
                        })
                        .filter((r: any) => r !== null);

                    finalResults = [...finalResults, ...quranResults];
                }

            } catch (err) {
                console.error("Error searching Mega JSON:", err);
            }
        }

        // 4. Search Newsletters (Local JSON)
        if (typeFilters.includes('perspective')) {
            const lowerQuery = query.toLowerCase();

            // Load metadata to get PDF links
            const metadata = require('../../../public/data/newsletters/metadata.json');
            const metadataMap = new Map(metadata.map((m: any) => [m.id, m]));

            const newsletterMatches = newsletterData
                .filter((item: any) => item.content.toLowerCase().includes(lowerQuery))
                .map((item: any) => {
                    // Find matches in content
                    const content = item.content;
                    const matches = [];
                    const lastIndex = 0;

                    // Simple regex to find all occurrences (case-insensitive)
                    // We'll just grab a snippet around the first few matches
                    const regex = new RegExp(query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'), 'gi');
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

                    // Get PDF link from metadata
                    const meta = metadataMap.get(item.id) as { pdfLink?: string } | undefined;

                    return {
                        media: {
                            id: item.filename, // Use filename for ID to link correctly
                            title: item.title,
                            type: 'perspective',
                            displayDate: item.displayDate,
                            author: 'Rashad Khalifa', // Default/Assumed
                            filename: item.filename,
                            pdfLink: meta?.pdfLink // Add PDF link
                        },
                        matches
                    };
                });

            finalResults = [...finalResults, ...newsletterMatches];
        }

        // 5. Search Appendices (Local JSON)
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
