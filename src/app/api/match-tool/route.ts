
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { S3Client } from '@aws-sdk/client-s3';

const CSV_PATH = path.join(process.cwd(), 'duration_match_debug.csv');
const TRANSCRIPTS_DIR = path.join(process.cwd(), 'transcripts');
const RECOVERY_OUTPUT_DIR = path.join(process.cwd(), 'recovery_output');

// R2 Config
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

// Helper to parse CSV manually to handle commas in filenames
function parseCSV() {
    const audio: { name: string; value: number }[] = [];
    const transcripts: { name: string; value: number }[] = [];

    if (!fs.existsSync(CSV_PATH)) return { audio, transcripts };

    const content = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = content.split('\n');

    for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i].trim();
        if (!line) continue;

        // Split from right to get Value
        const lastComma = line.lastIndexOf(',');
        if (lastComma === -1) continue;

        const value = line.substring(lastComma + 1);
        const rest = line.substring(0, lastComma);

        // Split from left to get Type
        const firstComma = rest.indexOf(',');
        if (firstComma === -1) continue;

        const type = rest.substring(0, firstComma);
        const name = rest.substring(firstComma + 1);

        if (type === 'AUDIO') {
            audio.push({ name, value: parseFloat(value) });
        } else {
            transcripts.push({ name, value: parseFloat(value) });
        }
    }
    return { audio, transcripts };
}

// Logic to find candidates
function findCandidates(audioSize: number, transcripts: any[]) {
    // Est duration = size / 24000 (approx)
    const estDuration = audioSize / 24000;

    // Calculate diffs
    const candidates = transcripts.map(t => ({
        filename: t.name,
        duration: t.value,
        diff: Math.abs(estDuration - t.value),
        ratio: audioSize / t.value
    }));

    // Sort by diff
    candidates.sort((a, b) => a.diff - b.diff);

    // Return ALL
    return candidates;
}

// Ensure snippets are loaded
function loadSnippets(transcripts: any[]) {
    const snippets: Record<string, string> = {};
    for (const t of transcripts) {
        const filePath = path.join(TRANSCRIPTS_DIR, t.name);
        let snippet = "Preview unavailable";
        try {
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath, 'utf-8');
                try {
                    const json = JSON.parse(fileContent);
                    if (Array.isArray(json) && json.length > 0) {
                        // Join segments up to 2 minutes (120 seconds)
                        let collected = [];
                        for (const seg of json) {
                            collected.push(seg.content);
                            if (seg.end_time > 120) break;
                        }
                        if (collected.length === 0) {
                            // Fallback if timestamps are weird or all 0
                            collected = json.slice(0, 30).map((s: any) => s.content);
                        }
                        snippet = collected.join(" ");
                    }
                } catch {
                    snippet = fileContent.substring(0, 2000); // Increased fallback length
                }
            }
        } catch (e) {
            // ignore
        }
        snippets[t.name] = snippet.substring(0, 3000) + "..."; // Increased max length
    }
    return snippets;
}

// Helper to get completed Audio IDs
function getCompletedAudioIds() {
    const ids = new Set<number>();
    if (fs.existsSync(RECOVERY_OUTPUT_DIR)) {
        const files = fs.readdirSync(RECOVERY_OUTPUT_DIR);
        for (const f of files) {
            const match = f.match(/^(\d+)\)/);
            if (match) {
                ids.add(parseInt(match[1]));
            }
        }
    }
    return ids;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('search')?.toLowerCase();

    const { audio, transcripts } = parseCSV();
    const snippets = loadSnippets(transcripts);

    // If search query is present, return search results
    if (searchQuery) {
        const results = [];
        for (const t of transcripts) {
            const filePath = path.join(TRANSCRIPTS_DIR, t.name);
            if (fs.existsSync(filePath)) {
                try {
                    const fileContent = fs.readFileSync(filePath, 'utf-8');
                    const lowerContent = fileContent.toLowerCase();
                    const matchIndex = lowerContent.indexOf(searchQuery);

                    if (matchIndex !== -1) {
                        // Extract snippet around match from ORIGINAL content (preserving case)
                        const start = Math.max(0, matchIndex - 50);
                        const end = Math.min(fileContent.length, matchIndex + searchQuery.length + 100);
                        const snippet = "..." + fileContent.substring(start, end) + "...";

                        // Clean up JSON syntax if possible for display? 
                        // It's mostly searching raw JSON string, which is fine, 
                        // but let's try to grab clean text if we parsed it properly.
                        // Actually, searching the raw file is safer/faster for "grep" style.

                        results.push({
                            filename: t.name,
                            duration: t.value,
                            snippet: snippet
                        });
                    }
                } catch (e) {
                    // ignore read errors
                }
            }
        }
        return NextResponse.json({ results });
    }

    const completedIds = getCompletedAudioIds();
    const queue = [];

    for (const a of audio) {
        // Parse ID
        const match = a.name.match(/messenger_quran_studies\/(\d+)\)/);
        if (!match) continue;
        const id = parseInt(match[1]);

        // Skip if already done
        if (completedIds.has(id)) continue;

        const candidates = findCandidates(a.value, transcripts);

        queue.push({
            audioId: id,
            audioKey: a.name,
            audioUrl: `https://pub-cb3aaebc3d2f49698a10d5a2bca9b720.r2.dev/${encodeURI(a.name).replace(/%25/g, '%').replace(/#/g, '%23')}`,
            candidates: candidates // Now just metadata
        });
    }

    // Sort queue by ID
    queue.sort((a, b) => a.audioId - b.audioId);

    return NextResponse.json({ queue, snippets });
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { audioId, transcriptFilename, targetTitle } = body;

        if (!audioId || !transcriptFilename) {
            return NextResponse.json({ error: "Missing audioId or transcriptFilename" }, { status: 400 });
        }

        const safeTitle = (targetTitle || `Quran Study ${audioId}`).replace(/[<>:"\/\\|?*]/g, '');
        const destFilename = `${audioId}) ${safeTitle}.json`;

        const srcPath = path.join(TRANSCRIPTS_DIR, transcriptFilename);
        const destPath = path.join(RECOVERY_OUTPUT_DIR, destFilename);
        const processedPath = path.join(TRANSCRIPTS_DIR, "processed", transcriptFilename);

        // Ensure output dirs
        if (!fs.existsSync(RECOVERY_OUTPUT_DIR)) {
            fs.mkdirSync(RECOVERY_OUTPUT_DIR, { recursive: true });
        }
        const processedDir = path.join(TRANSCRIPTS_DIR, "processed");
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        // Copy/Move
        if (fs.existsSync(srcPath)) {
            // 1. Copy to recovery_output (result)
            fs.copyFileSync(srcPath, destPath);

            // 2. Move original to 'processed' to remove from future candidates
            fs.renameSync(srcPath, processedPath);

        } else {
            return NextResponse.json({ error: "Source file not found (maybe already matched?)" }, { status: 404 });
        }

        return NextResponse.json({ success: true, path: destFilename });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
