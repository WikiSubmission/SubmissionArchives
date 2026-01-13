import fs from 'fs';
import path from 'path';
import https from 'https';

const VIDEO_PROGRAMS_INDEX = path.join(process.cwd(), 'public/data/generated_indices/ALL_VIDEO_PROGRAMS.json');
const OUTPUT_DIR = path.join(process.cwd(), 'public/images/video-programs');

// YouTube IDs extracted from playlist_info.txt
// Video programs are items 1-11, 34, 45-50
const VIDEO_PROGRAM_YOUTUBE_IDS: Record<string, string> = {
    "What Life is All About & Who is GOD": "Yyw1EpexvVQ",
    "Witness a Miracle & World News Bulletin": "3Hn1zD5z6Cg",
    "Mathematical Miracle of Quran": "NWUt_bESl0c",
    "Essentials of Submission Islam": "U31-USHFRZM",
    "Principles of Contact Prayers Salat": "tbxOH3KNOvA",
    "Principles of Friday Prayer": "K7suTQM7fno",
    "Old Message, New Messenger": "f7doI2Z4o4M",
    "The Great Debate Dr. Rashad Khalifa vs Dr. Abdel Rahman": "GQE2xUWudR4",
    "In Defence of the Bible": "4GWZfsL97cU",
    "Evolution or Creation, The Final Argument by Dr Rashad Khalifa": "yXOlRXDdbbo",
    "King of Chaos": "cAvmtN9gUU4",
    "Explaining the Fulfillment of the Covenant": "NaMA9rybg5Y",
    "Final Speech by Dr. Rashad Khalifa (1989 Conference)": "oLFyMIlEPRM",
    "City Council Al-Fateha Recitation": "OSLo75uochY",
    "Excerpts From a Radio Debate With dr Rashad Khalifa": "8RMX5y_ekEU",
    "World News Bulletin": "olqh4qUiLMU",
    "The Creators Signature": "utI1q7zHKD0",
    "Arabic Language Lessons": "2Z7j7dqe6gQ"
};

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
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
        const stats = fs.statSync(outputPath);
        if (stats.size > 10000) {
            console.log(`✓ Downloaded maxresdefault for ${youtubeId}`);
            return true;
        }
        fs.unlinkSync(outputPath);
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

// Normalize title for comparison
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

async function main() {
    console.log('Starting video program thumbnail download...\n');

    const videoPrograms = JSON.parse(fs.readFileSync(VIDEO_PROGRAMS_INDEX, 'utf-8'));
    console.log(`Processing ${videoPrograms.length} video programs...\n`);

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const video of videoPrograms) {
        const normalizedTitle = normalizeTitle(video.title);

        // Find matching YouTube ID
        let youtubeId: string | null = null;
        for (const [title, id] of Object.entries(VIDEO_PROGRAM_YOUTUBE_IDS)) {
            if (normalizeTitle(title) === normalizedTitle) {
                youtubeId = id;
                break;
            }
        }

        if (!youtubeId) {
            console.log(`✗ No YouTube ID found for: ${video.title}`);
            failCount++;
            continue;
        }

        // Create a clean filename from the video ID
        const cleanId = video.id
            .replace(/^media\/(disorganized_sermons|VIDEO PROGRAMS)\//, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w\-_.]/g, '')
            .replace(/\.mp4$/, '');

        const outputPath = path.join(OUTPUT_DIR, `${cleanId}.jpg`);

        if (fs.existsSync(outputPath)) {
            console.log(`⊘ Thumbnail already exists: ${cleanId}.jpg`);
            skipCount++;
            continue;
        }

        console.log(`Matched: ${video.title} -> ${youtubeId}`);
        const success = await downloadThumbnail(youtubeId, outputPath);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\nVideo Programs Summary:`);
    console.log(`  ✓ Downloaded: ${successCount}`);
    console.log(`  ⊘ Skipped (already exists): ${skipCount}`);
    console.log(`  ✗ Failed: ${failCount}`);
}

main().catch(console.error);
