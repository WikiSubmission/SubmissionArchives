/**
 * Check if missing Messenger Audio episodes have transcripts
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const PLAYLIST_URL = 'https://youtube.com/playlist?list=PLT3FYocEyHAwM4vjkHYNGNT0rw0NgWuzp';

async function checkMissingTranscripts() {
    console.log('Checking for transcripts on missing episodes...\n');

    // Get all videos from playlist
    const { stdout } = await execAsync(
        `python -m yt_dlp --flat-playlist --dump-json "${PLAYLIST_URL}"`
    );

    const lines = stdout.trim().split('\n');
    const videos = lines.map((line, i) => {
        const video = JSON.parse(line);
        return {
            index: i + 1,
            videoId: video.id,
            title: video.title
        };
    });

    // Filter to indices 15-59 (MA 15.1 through MA 47)
    const targetVideos = videos.filter(v => v.index >= 15 && v.index <= 59);

    console.log(`Checking ${targetVideos.length} videos...\n`);

    // Check each video for available subtitles
    for (const video of targetVideos) {
        try {
            const { stdout: subsInfo } = await execAsync(
                `python -m yt_dlp --list-subs "https://www.youtube.com/watch?v=${video.videoId}"`,
                { timeout: 10000 }
            );

            const hasAutoSubs = subsInfo.includes('en') && subsInfo.includes('auto');
            const hasManualSubs = subsInfo.includes('en') && !subsInfo.includes('auto');

            console.log(`[${video.index}] ${video.title}`);
            console.log(`  Video ID: ${video.videoId}`);

            if (hasManualSubs) {
                console.log(`  ✓ Has MANUAL English subtitles`);
            } else if (hasAutoSubs) {
                console.log(`  ✓ Has AUTO-GENERATED English subtitles`);
            } else {
                console.log(`  ✗ No English subtitles available`);
            }
            console.log();
        } catch (error: any) {
            console.log(`[${video.index}] ${video.title}`);
            console.log(`  ✗ Error checking: ${error.message}`);
            console.log();
        }
    }
}

checkMissingTranscripts().catch(console.error);
