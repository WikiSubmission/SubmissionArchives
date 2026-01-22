import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { promisify } from "util";

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const execAsync = promisify(exec);

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rkmediaassets";

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.error("Missing R2 environment variables");
    process.exit(1);
}

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

const PREFIXES = [
    'media/FRIDAY SERMONS/',
    'media/quran-study-v2/',
    'media/messenger_audios/',
    'media/VIDEO PROGRAMS/'
];

interface DurationMap {
    [key: string]: number;
}

// Helper to get duration using ffprobe
async function getDuration(url: string, key: string, maxRetries = 3): Promise<number | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Check usage of local VTT first for Quran Studies as it's faster
            // BUT user said "look at all mp3s/mp4s". So we prioritize ffprobe for accuracy 
            // unless we want speed. Let's try ffprobe first.

            // NOTE: Using -v error to suppress output, -show_entries format=duration
            // Adding user-agent to avoid blocks if any (though R2 is usually fine)
            // Timeout to prevent hanging
            const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${url}"`;

            // console.log(`Fetching duration for: ${key} (Attempt ${attempt})`);
            const { stdout, stderr } = await execAsync(cmd, { timeout: 15000 });

            const duration = parseFloat(stdout.trim());
            if (!isNaN(duration)) {
                return duration;
            }
        } catch (error: any) {
            // console.warn(`Error on attempt ${attempt} for ${key}:`, error.message?.slice(0, 100));
            if (attempt === maxRetries) return null;
            await new Promise(r => setTimeout(r, 1000 * attempt)); // Backoff
        }
    }
    return null;
}

// Try to load existing map to skip already processed items
let existingMap: DurationMap = {};
const outputPath = path.join(process.cwd(), 'src', 'data', 'mediaDurations.json');
if (fs.existsSync(outputPath)) {
    try {
        existingMap = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        console.log(`Loaded ${Object.keys(existingMap).length} existing durations.`);
    } catch (e) {
        console.warn("Could not read existing durations file.");
    }
}

async function main() {
    const durationMap: DurationMap = { ...existingMap };
    let totalSeconds = 0;
    let count = 0;

    console.log("Starting duration fetch...");

    for (const prefix of PREFIXES) {
        console.log(`Scanning prefix: ${prefix}`);
        let continuationToken: string | undefined = undefined;

        do {
            const command = new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME,
                Prefix: prefix,
                ContinuationToken: continuationToken
            });

            try {
                const response: any = await s3Client.send(command);

                if (response.Contents) {
                    // Process in batches to speed up
                    const batchSize = 5;
                    const items = response.Contents.filter((item: any) => {
                        if (!item.Key || item.Key.endsWith('/')) return false;
                        if (item.Key.endsWith('.json') || item.Key.endsWith('.vtt')) return false;
                        if (item.Key.match(/Temp\s*52/i) || item.Key.match(/temp[_\s]*15/i)) return false;
                        return true;
                    });

                    for (let i = 0; i < items.length; i += batchSize) {
                        const batch = items.slice(i, i + batchSize);
                        await Promise.all(batch.map(async (item: any) => {
                            if (!item.Key) return;

                            // Skip if already exists
                            if (durationMap[item.Key]) {
                                // console.log(`Skipping cached: ${item.Key}`);
                                totalSeconds += durationMap[item.Key];
                                count++;
                                return;
                            }

                            // Generate Signed URL
                            const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
                                Bucket: R2_BUCKET_NAME,
                                Key: item.Key
                            }), { expiresIn: 3600 });

                            const duration = await getDuration(signedUrl, item.Key);
                            if (duration !== null) {
                                durationMap[item.Key] = duration;
                                totalSeconds += duration;
                                count++;
                                process.stdout.write(`\rProcessed: ${count} items | Latest: ${duration.toFixed(0)}s`);
                            } else {
                                console.error(`\nFailed to get duration for: ${item.Key}`);
                            }
                        }));
                    }
                }

                continuationToken = response.NextContinuationToken;
            } catch (err) {
                console.error(`Error listing prefix ${prefix}:`, err);
                break;
            }
        } while (continuationToken);
    }

    console.log(`\n\nDone! Successfully processed ${count} files.`);

    // Recalculate total from map to be sure
    const finalTotal = Object.values(durationMap).reduce((a, b) => a + b, 0);
    console.log(`Total Duration: ${finalTotal} seconds`);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(durationMap, null, 2));
    console.log(`Saved duration map to ${outputPath}`);
}

main().catch(console.error);
