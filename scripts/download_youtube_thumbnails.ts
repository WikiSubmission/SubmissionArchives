import fs from 'fs';
import path from 'path';
import https from 'https';

const VIDEO_PROGRAMS_INDEX = path.join(process.cwd(), 'public/data/generated_indices/ALL_VIDEO_PROGRAMS.json');
const SERMONS_INDEX = path.join(process.cwd(), 'public/data/generated_indices/ALL_SERMONS.json');
const VIDEO_PROGRAMS_OUTPUT = path.join(process.cwd(), 'public/images/video-programs');
const SERMONS_OUTPUT = path.join(process.cwd(), 'public/images/sermons');

// Create output directories
if (!fs.existsSync(VIDEO_PROGRAMS_OUTPUT)) {
    fs.mkdirSync(VIDEO_PROGRAMS_OUTPUT, { recursive: true });
}
if (!fs.existsSync(SERMONS_OUTPUT)) {
    fs.mkdirSync(SERMONS_OUTPUT, { recursive: true });
}

// Extract YouTube ID from filename
function extractYouTubeId(filename: string): string | null {
    const match = filename.match(/\[([a-zA-Z0-9_-]{11})\]/);
    return match ? match[1] : null;
}

// Download image from URL
function downloadImage(url: string, outputPath: string): Promise<boolean> {
    return new Promise((resolve) => {
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(outputPath);
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve(true);
                });
                fileStream.on('error', () => {
                    resolve(false);
                });
            } else {
                resolve(false);
            }
        }).on('error', () => {
            resolve(false);
        });
    });
}

// Download thumbnail for a video
async function downloadThumbnail(youtubeId: string, outputPath: string): Promise<boolean> {
    // Try maxresdefault first (1920x1080)
    const maxResUrl = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    console.log(`Trying maxresdefault for ${youtubeId}...`);

    const maxResSuccess = await downloadImage(maxResUrl, outputPath);
    if (maxResSuccess) {
        // Verify it's not a placeholder (YouTube returns a small placeholder if maxres doesn't exist)
        const stats = fs.statSync(outputPath);
        if (stats.size > 10000) { // Real thumbnails are much larger than 10KB
            console.log(`✓ Downloaded maxresdefault for ${youtubeId}`);
            return true;
        }
        fs.unlinkSync(outputPath); // Delete the placeholder
    }

    // Fall back to hqdefault (480x360)
    const hqUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    console.log(`Falling back to hqdefault for ${youtubeId}...`);

    const hqSuccess = await downloadImage(hqUrl, outputPath);
    if (hqSuccess) {
        console.log(`✓ Downloaded hqdefault for ${youtubeId}`);
        return true;
    }

    console.log(`✗ Failed to download thumbnail for ${youtubeId}`);
    return false;
}

// Process videos from a JSON file
async function processVideos(indexPath: string, outputDir: string, typeName: string) {
    if (!fs.existsSync(indexPath)) {
        console.log(`Index file not found: ${indexPath}`);
        return;
    }

    const videos = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    console.log(`\nProcessing ${videos.length} ${typeName}...`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const video of videos) {
        const youtubeId = extractYouTubeId(video.id);

        if (!youtubeId) {
            console.log(`No YouTube ID found in: ${video.id}`);
            failCount++;
            continue;
        }

        // Create a clean filename from the video ID
        const cleanId = video.id
            .replace(/^media\/(disorganized_sermons|VIDEO PROGRAMS)\//, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w\-_.]/g, '')
            .replace(/\.mp4$/, '');

        const outputPath = path.join(outputDir, `${cleanId}.jpg`);

        if (fs.existsSync(outputPath)) {
            console.log(`Thumbnail already exists: ${cleanId}.jpg`);
            skipCount++;
            continue;
        }

        const success = await downloadThumbnail(youtubeId, outputPath);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n${typeName} Summary:`);
    console.log(`  ✓ Downloaded: ${successCount}`);
    console.log(`  ⊘ Skipped (already exists): ${skipCount}`);
    console.log(`  ✗ Failed: ${failCount}`);
}

async function main() {
    console.log('Starting YouTube thumbnail download...\n');

    await processVideos(VIDEO_PROGRAMS_INDEX, VIDEO_PROGRAMS_OUTPUT, 'Video Programs');
    await processVideos(SERMONS_INDEX, SERMONS_OUTPUT, 'Sermons');

    console.log('\nDone!');
}

main().catch(console.error);
