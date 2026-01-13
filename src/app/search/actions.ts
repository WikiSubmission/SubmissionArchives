'use server';

import fs from 'fs';
import path from 'path';
import newsletterData from '../../../public/data/newsletters/search_index.json';
import appendicesData from '../../../public/data/appendices/search_index.json';
import otherData from '../../../public/data/other/search_index.json';

// Helper for stream
function streamToString(stream: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}

import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

// Cache Mega JSON in memory
let megaJsonCache: any = null;
let lastFetchTime = 0;

export async function searchTranscripts(query: string, typeFilters: string[]) {
    try {
        console.log(`[Server Action] Searching for "${query}" in types: ${typeFilters.join(', ')}`);

        // Execute all searches in parallel for better performance
        const searchPromises: Promise<any[]>[] = [];

        // 1. Search Quran Studies (Mega JSON via R2)
        if (typeFilters.includes('quran-study')) {
            searchPromises.push(searchQuranStudies(query));
        }

        // 2. Search Newsletters (Local JSON)
        if (typeFilters.includes('perspective')) {
            searchPromises.push(searchNewsletters(query));
        }

        // 3. Search Appendices (Local JSON)
        if (typeFilters.includes('appendix')) {
            searchPromises.push(searchAppendices(query));
        }

        // 4. Search Sermons (Generated Local Index)
        if (typeFilters.includes('sermon')) {
            searchPromises.push(searchLocalMegaIndex('ALL_SERMONS.json', query, 'sermon'));
            searchPromises.push(searchLocalMegaIndex('ALL_FRIDAY_SERMONS.json', query, 'sermon'));
        }

        // 5. Search Video Programs (Generated Local Index)
        if (typeFilters.includes('video-program')) {
            searchPromises.push(searchLocalMegaIndex('ALL_VIDEO_PROGRAMS.json', query, 'video-program'));
        }

        // 6. Search Audio (Generated Local Index)
        if (typeFilters.includes('audio') || typeFilters.includes('messenger-audio')) {
            searchPromises.push(searchLocalMegaIndex('ALL_AUDIOS.json', query, 'messenger-audio'));
        }

        // 7. Search Other Resources (Local JSON)
        if (typeFilters.includes('other')) {
            searchPromises.push(searchOther(query));
        }

        // Wait for all searches to complete in parallel
        const results = await Promise.all(searchPromises);
        const finalResults = results.flat(); // Combine all results

        console.log(`[Server Action] Found ${finalResults.length} items total.`);
        return { success: true, data: finalResults };

    } catch (err: any) {
        console.error("[Server Action] Search Exception:", err);
        return { success: false, error: err.message };
    }
}

// ... existing helpers ...

// Helper: Search Other Resources
async function searchOther(query: string): Promise<any[]> {
    try {
        const lowerQuery = query.toLowerCase();

        // Structure: item.pages = [{ page: 1, content: "..." }, ...]

        const results: any[] = [];
        const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');

        (otherData || []).forEach((item: any) => {
            if (!item.pages) return;

            item.pages.forEach((page: any) => {
                const content = page.content;
                const lowerContent = content.toLowerCase();

                if (lowerContent.includes(lowerQuery)) {
                    // Match found on this page
                    let match;
                    let count = 0;
                    // Reset regex index
                    regex.lastIndex = 0;

                    const matchesOnPage: any[] = [];

                    while ((match = regex.exec(content)) !== null && count < 3) { // Limit matches per page
                        const start = Math.max(0, match.index - 60);
                        const end = Math.min(content.length, match.index + query.length + 60);
                        let snippet = content.substring(start, end);
                        if (start > 0) snippet = '...' + snippet;
                        if (end < content.length) snippet = snippet + '...';

                        matchesOnPage.push({
                            id: `other-${item.id}-p${page.page}-${count}`, // Unique ID per match
                            content: snippet,
                            start_time: 0 // Placeholder
                        });
                        count++;
                    }

                    if (matchesOnPage.length > 0) {
                        results.push({
                            media: {
                                id: item.id,
                                title: `${item.title} (Page ${page.page})`, // Show page in title
                                type: 'other',
                                author: item.author || 'Dr. Rashad Khalifa',
                                filename: item.filename,
                                page: page.page // Pass page info!
                            },
                            matches: matchesOnPage
                        });
                    }
                }
            });
        });

        return results;
    } catch (err) {
        console.error("Error searching Other resources:", err);
        return [];
    }
}


// Helper: Search Local Mega Index (Generated by script)
async function searchLocalMegaIndex(filename: string, query: string, type: string): Promise<any[]> {
    try {
        // Look in public/data/generated_indices/
        const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
        if (!fs.existsSync(filePath)) {
            // console.warn(`Index file not found: ${filename}`); // Optional: mute warning to avoid log spam if incomplete
            return [];
        }

        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        const lowerQuery = query.toLowerCase();

        return data.map((item: any) => {
            // Check matches in segments
            // Note: Script output uses 'text', 'start', 'end'
            // If generation script used 'content', adjust here. My script uses 'text'.
            const matches = (item.segments || [])
                .filter((seg: any) => (seg.text || seg.content) && (seg.text || seg.content).toLowerCase().includes(lowerQuery))
                .map((seg: any) => ({
                    id: `${type}-${item.index || item.id}-${seg.start || seg.start_time}`,
                    content: seg.text || seg.content,
                    start_time: seg.start || seg.start_time || 0
                }));

            if (matches.length === 0) return null;

            return {
                media: {
                    id: item.id, // R2 Key
                    title: item.title,
                    type: type,
                    displayTitle: item.title,
                    filename: item.id.split('/').pop(), // Helper for potential links
                    author: 'Dr. Rashad Khalifa'
                },
                matches: matches.slice(0, 50)
            };
        }).filter((r: any) => r !== null);

    } catch (err) {
        console.error(`Error searching local index ${filename}:`, err);
        return [];
    }
}

// Helper: Search Quran Studies
async function searchQuranStudies(query: string): Promise<any[]> {
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

        if (!megaJsonCache) return [];

        const lowerQuery = query.toLowerCase();
        const quranResults = megaJsonCache
            .map((item: any) => {
                // Filter segments that match
                const matches = item.transcript
                    .filter((seg: any) => seg.content && seg.content.toLowerCase().includes(lowerQuery))
                    .map((seg: any) => ({
                        id: `qs-${item.index}-${seg.id}`,
                        content: seg.content,
                        start_time: seg.start_time
                    }));

                if (matches.length === 0) return null;

                const mp3Filename = item.filename.replace('.json', '.mp3');
                const r2Key = `media/quran-study-v2/${mp3Filename}`;

                return {
                    media: {
                        id: r2Key,
                        title: item.title,
                        type: 'quran-study',
                        displayTitle: item.title,
                        filename: mp3Filename,
                        author: 'Dr. Rashad Khalifa'
                    },
                    matches: matches.slice(0, 50)
                };
            })
            .filter((r: any) => r !== null);

        return quranResults;
    } catch (err) {
        console.error("Error searching Quran Studies:", err);
        return [];
    }
}

// Helper: Search Newsletters
async function searchNewsletters(query: string): Promise<any[]> {
    try {
        const lowerQuery = query.toLowerCase();

        // Load metadata to get PDF links
        const metadata = require('../../../public/data/newsletters/metadata.json');
        const metadataMap = new Map(metadata.map((m: any) => [m.id, m]));

        const newsletterMatches = newsletterData
            .filter((item: any) => item.content.toLowerCase().includes(lowerQuery))
            .map((item: any) => {
                const content = item.content;
                const matches = [];
                const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                let match;
                let count = 0;

                while ((match = regex.exec(content)) !== null && count < 5) {
                    const start = Math.max(0, match.index - 60);
                    const end = Math.min(content.length, match.index + query.length + 60);
                    let snippet = content.substring(start, end);
                    if (start > 0) snippet = '...' + snippet;
                    if (end < content.length) snippet = snippet + '...';

                    matches.push({
                        id: `nl-${item.id}-${count}`,
                        content: snippet,
                        start_time: 0
                    });
                    count++;
                }

                const meta = metadataMap.get(item.id) as { pdfLink?: string } | undefined;

                return {
                    media: {
                        id: item.filename,
                        title: item.title,
                        type: 'perspective',
                        displayDate: item.displayDate,
                        author: 'Rashad Khalifa',
                        filename: item.filename,
                        pdfLink: meta?.pdfLink
                    },
                    matches
                };
            });

        return newsletterMatches;
    } catch (err) {
        console.error("Error searching newsletters:", err);
        return [];
    }
}

// Helper: Search Appendices
async function searchAppendices(query: string): Promise<any[]> {
    try {
        const lowerQuery = query.toLowerCase();
        const appendixMatches = appendicesData
            .filter((item: any) => item.content.toLowerCase().includes(lowerQuery))
            .map((item: any) => {
                const content = item.content;
                const matches = [];
                const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
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

        return appendixMatches;
    } catch (err) {
        console.error("Error searching appendices:", err);
        return [];
    }
}
