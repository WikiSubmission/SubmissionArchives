/**
 * Download YouTube Transcripts for Messenger Audio 15.1 - 47
 * 
 * This script:
 * 1. Extracts video IDs from the YouTube playlist
 * 2. Downloads auto-generated transcripts using yt-dlp
 * 3. Converts them to the project's transcript format
 * 4. Saves them locally for review before uploading to R2
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

const PLAYLIST_URL = 'https://youtube.com/playlist?list=PLT3FYocEyHAwM4vjkHYNGNT0rw0NgWuzp';
const START_INDEX = 15; // MA 15.1 is at index 15
const END_INDEX = 59;   // MA 47 is at index 59

interface PlaylistVideo {
    index: number;
    videoId: string;
    title: string;
}

interface YouTubeTranscriptEvent {
    tStartMs: number;
    dDurationMs: number;
    segs?: Array<{ utf8: string }>;
}

interface ProjectTranscriptSegment {
    id: number;
    speaker: string;
    start_time: number;
    end_time: number;
    content: string;
}

/**
 * Extract video IDs from YouTube playlist
 */
async function extractPlaylistVideos(): Promise<PlaylistVideo[]> {
    console.log('Extracting video IDs from playlist...\n');

    try {
        // Use yt-dlp to get playlist info in JSON format
        const { stdout } = await execAsync(
            `python -m yt_dlp --flat-playlist --dump-json "${PLAYLIST_URL}"`
        );

        const lines = stdout.trim().split('\n');
        const videos: PlaylistVideo[] = [];

        for (let i = 0; i < lines.length; i++) {
            const video = JSON.parse(lines[i]);
            videos.push({
                index: i + 1,
                videoId: video.id,
                title: video.title
            });
        }

        console.log(`Found ${videos.length} videos in playlist\n`);
        return videos;
    } catch (error) {
        console.error('Error extracting playlist:', error);
        throw error;
    }
}

/**
 * Download transcript for a single video using yt-dlp
 */
async function downloadTranscript(videoId: string, outputDir: string): Promise<string | null> {
    const tempFile = path.join(outputDir, `temp_${videoId}`);

    try {
        // Download auto-generated English subtitles in json3 format
        await execAsync(
            `python -m yt_dlp --write-auto-sub --sub-lang en --sub-format json3 --skip-download --output "${tempFile}" "https://www.youtube.com/watch?v=${videoId}"`,
            { cwd: outputDir }
        );

        // Find the generated subtitle file
        const files = await fs.readdir(outputDir);
        const subtitleFile = files.find(f => f.startsWith(`temp_${videoId}`) && f.endsWith('.en.json3'));

        if (!subtitleFile) {
            console.log('  ⚠️  No auto-generated subtitles available');
            return null;
        }

        const subtitlePath = path.join(outputDir, subtitleFile);
        const content = await fs.readFile(subtitlePath, 'utf-8');

        // Clean up temp file
        await fs.unlink(subtitlePath);

        return content;
    } catch (error: any) {
        if (error.message?.includes('No subtitles')) {
            console.log('  ⚠️  No subtitles available for this video');
            return null;
        }
        throw error;
    }
}

/**
 * Convert YouTube JSON3 transcript to project format
 */
function convertTranscript(json3Content: string): ProjectTranscriptSegment[] {
    const data = JSON.parse(json3Content);
    const segments: ProjectTranscriptSegment[] = [];
    let segmentId = 0;

    // Extract events that have text segments
    const events: YouTubeTranscriptEvent[] = data.events || [];

    for (const event of events) {
        if (!event.segs || event.segs.length === 0) continue;

        // Combine all text segments in this event
        const text = event.segs
            .map(seg => seg.utf8)
            .join('')
            .trim();

        if (!text) continue;

        const startTime = event.tStartMs / 1000;
        const duration = event.dDurationMs / 1000;

        segments.push({
            id: segmentId++,
            speaker: 'Dr. Rashad Khalifa', // Default speaker (no diarization)
            start_time: startTime,
            end_time: startTime + duration,
            content: text
        });
    }

    return segments;
}

/**
 * Extract Messenger Audio number from video title
 */
function extractMANumber(title: string, index: number): string | null {
    // Try to extract MA number from title
    // Examples: "Messenger Audio 15.1", "MA 15.1", etc.
    const match = title.match(/(?:Messenger Audio|MA)\s*[｜|]?\s*(\d+(?:\.\d+)?)/i);
    if (match) {
        return match[1];
    }

    // Fallback: calculate based on index
    // Index 15 = MA 15.1, Index 16 = MA 15.2, etc.
    const maNumber = Math.floor((index - 15) / 2) + 15;
    const subNumber = ((index - 15) % 2) + 1;
    return `${maNumber}.${subNumber}`;
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('YouTube Transcript Downloader for Messenger Audio 15.1-47');
    console.log('='.repeat(60));
    console.log();

    // Create output directory
    const outputDir = path.join(__dirname, '../messenger_audio_transcripts');
    await fs.mkdir(outputDir, { recursive: true });
    console.log(`Output directory: ${outputDir}\n`);

    // Step 1: Extract playlist videos
    const allVideos = await extractPlaylistVideos();

    // Step 2: Filter to MA 15.1 through 47 (indices 15-59)
    const targetVideos = allVideos.filter(v => v.index >= START_INDEX && v.index <= END_INDEX);
    console.log(`Processing ${targetVideos.length} videos (index ${START_INDEX} to ${END_INDEX})\n`);
    console.log('='.repeat(60));
    console.log();

    // Step 3: Download and convert each transcript
    const results: Array<{ maNumber: string; success: boolean; error?: string }> = [];

    for (const video of targetVideos) {
        const maNumber = extractMANumber(video.title, video.index);
        if (!maNumber) {
            console.log(`[${video.index}] Skipping - couldn't extract MA number from: ${video.title}`);
            continue;
        }

        console.log(`[${video.index}] MA ${maNumber}: ${video.title}`);
        console.log(`  Video ID: ${video.videoId}`);

        try {
            // Download transcript
            console.log('  Downloading transcript...');
            const json3Content = await downloadTranscript(video.videoId, outputDir);

            if (!json3Content) {
                results.push({ maNumber, success: false, error: 'No subtitles available' });
                console.log();
                continue;
            }

            // Convert to project format
            console.log('  Converting to project format...');
            const segments = convertTranscript(json3Content);
            console.log(`  Converted ${segments.length} segments`);

            // Save to file
            const filename = `Messenger Audio ｜ ${maNumber}.json`;
            const outputPath = path.join(outputDir, filename);
            await fs.writeFile(
                outputPath,
                JSON.stringify(segments, null, 2),
                'utf-8'
            );

            console.log(`  ✓ Saved to ${filename}`);
            results.push({ maNumber, success: true });
        } catch (error: any) {
            console.error(`  ✗ Error: ${error.message}`);
            results.push({ maNumber, success: false, error: error.message });
        }

        console.log();
    }

    // Summary
    console.log('='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log();

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✓ Successfully downloaded: ${successful.length}`);
    console.log(`✗ Failed: ${failed.length}`);

    if (failed.length > 0) {
        console.log('\nFailed transcripts:');
        failed.forEach(r => {
            console.log(`  - MA ${r.maNumber}: ${r.error}`);
        });
    }

    console.log(`\nTranscripts saved to: ${outputDir}`);
    console.log('\nNext steps:');
    console.log('1. Review the downloaded transcripts');
    console.log('2. If they look good, upload to R2 using the upload script');
}

// Run
if (require.main === module) {
    main().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

export { extractPlaylistVideos, downloadTranscript, convertTranscript };
