
import { S3Client, ListObjectsV2Command, GetObjectCommand, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
// @ts-ignore
import { R2_BUCKET_NAME } from '../src/lib/r2';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

const OUTPUT_DIR = path.join(process.cwd(), 'public/data/generated_indices');
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// --- Helper Functions from WatchPage ---

const streamToString = (stream: any) =>
    new Promise<string>((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

function parseVttTimestamp(timestamp: string): number {
    if (!timestamp) return 0;
    const parts = timestamp.split(':');
    let seconds = 0;
    if (parts.length === 3) {
        seconds += parseInt(parts[0]) * 3600;
        seconds += parseInt(parts[1]) * 60;
        seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
        seconds += parseInt(parts[0]) * 60;
        seconds += parseFloat(parts[1]);
    }
    return seconds;
}

function parseVTT(vttContent: string) {
    const segments = [];
    const normalized = vttContent.replace(/\r\n/g, '\n');
    const blocks = normalized.split('\n\n');

    // Simple speaker pattern for now
    const speakerPattern = /(?:^|\s)((?:Dr\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):/g;

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;
        if (lines[0].startsWith('WEBVTT')) continue;
        if (lines[0].startsWith('NOTE')) continue;

        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx === -1) continue;

        const timeLine = lines[timeLineIdx];
        const [startStr, endStrPart] = timeLine.split('-->').map(s => s.trim());
        const endStr = endStrPart ? endStrPart.split(' ')[0] : startStr;

        const start = parseVttTimestamp(startStr);
        const end = parseVttTimestamp(endStr);
        let content = lines.slice(timeLineIdx + 1).join(' ');

        // Strip tags
        content = content.replace(/<[^>]*>/g, '').trim();
        content = content.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

        if (!content) continue;

        segments.push({
            start,
            end,
            text: content
        });
    }
    return segments;
}

// --- Main Indexing Logic ---

async function fetchTranscript(key: string): Promise<any[] | null> {
    const transcriptCandidates = [
        key.replace(/\.(mp4|mp3|m4a)$/i, ".json"),
        key.replace(/\.(mp4|mp3|m4a)$/i, ".en-US.json"),
        key.replace(/\.(mp4|mp3|m4a)$/i, ".en.json"),
        key.replace(/\.(mp4|mp3|m4a)$/i, ".json.json"),
        key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json"),
        key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json.json"),
        key.replace(/\.(mp4|mp3|m4a)$/i, "-tagged.json"),
        key + ".json",
        key.replace(/\.(mp4|mp3|m4a)$/i, ".en-US.vtt"),
        key.replace(/\.(mp4|mp3|m4a)$/i, ".vtt"),
        key + ".vtt"
    ];

    for (const tKey of transcriptCandidates) {
        try {
            const cmd = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: tKey });
            const response = await r2Client.send(cmd);
            if (response.Body) {
                const body = await streamToString(response.Body);
                if (tKey.endsWith('.vtt')) {
                    const segs = parseVTT(body);
                    return segs.map((s, i) => ({
                        id: i,
                        start_time: s.start,
                        end_time: s.end,
                        content: s.text
                    }));
                } else {
                    const json = JSON.parse(body);
                    if (Array.isArray(json)) return json;
                    if (json.segments) return json.segments.map((s: any) => ({ start_time: s.start, end_time: s.end, content: s.text }));
                    // Deepgram handling
                    if (json.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs) {
                        return json.results.channels[0].alternatives[0].paragraphs.paragraphs.map((p: any) => ({
                            start_time: p.start,
                            end_time: p.end,
                            content: p.sentences.map((s: any) => s.text).join(' ')
                        }));
                    }
                    // Fallback Deepgram
                    if (json.results?.utterances) {
                        return json.results.utterances.map((u: any) => ({
                            start_time: u.start,
                            end_time: u.end,
                            content: u.transcript
                        }));
                    }
                }
            }
        } catch (e) {
            // ignore
        }
    }
    return null;
}

async function processPrefix(prefix: string, type: string, outputFile: string) {
    console.log(`Scanning ${prefix} for ${type}...`);
    const items: any[] = [];
    let continuationToken: string | undefined = undefined;
    let count = 0;

    do {
        const cmd = new ListObjectsV2Command({
            Bucket: process.env.R2_BUCKET_NAME,
            Prefix: prefix,
            ContinuationToken: continuationToken
        });
        const response = await r2Client.send(cmd) as ListObjectsV2CommandOutput;

        if (response.Contents) {
            for (const item of response.Contents) {
                if (!item.Key || item.Key.endsWith('/') || item.Key.includes('_temp_')) continue;
                if (!item.Key.match(/\.(mp4|mp3|m4a)$/i)) continue; // Only process media files

                // Skip transcripts themselves

                const filename = item.Key.split('/').pop() || item.Key;
                const title = filename.replace(/\.(mp4|mp3|m4a)$/i, "").replace(/_/g, " ").trim();

                console.log(`Processing [${count + 1}] ${title}...`);

                const segments = await fetchTranscript(item.Key);

                if (segments && segments.length > 0) {
                    items.push({
                        id: item.Key,
                        title,
                        type,
                        segments: segments.map(s => ({
                            start: s.start_time || s.start,
                            end: s.end_time || s.end,
                            text: s.content || s.text
                        }))
                    });
                    console.log(`  -> Found ${segments.length} segments`);
                } else {
                    console.log(`  -> No transcript found`);
                }
                count++;
            }
        }
        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log(`Finished ${type}. Total indexed: ${items.length}`);
    fs.writeFileSync(path.join(OUTPUT_DIR, outputFile), JSON.stringify(items, null, 2));
}

async function main() {
    // 1. Sermons
    await processPrefix('media/disorganized_sermons/', 'sermon', 'ALL_SERMONS.json');
    await processPrefix('media/FRIDAY SERMONS/', 'sermon', 'ALL_FRIDAY_SERMONS.json');

    // 2. Programs
    await processPrefix('media/rk_video_programs/', 'video-program', 'ALL_PROGRAMS.json');
    await processPrefix('media/VIDEO PROGRAMS/', 'video-program', 'ALL_VIDEO_PROGRAMS.json');

    // 3. Audio
    await processPrefix('media/messenger_audios/', 'messenger-audio', 'ALL_AUDIOS.json');

    console.log("Done! Check public/data/generated_indices/");
}

main().catch(console.error);
