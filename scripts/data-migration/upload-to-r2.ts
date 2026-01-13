import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
    "../Messenger Quran Studies",
    "../messenger_audios",
];

// Helper to get client after ensuring env vars are loaded
async function getR2() {
    // Dynamic import to ensure process.env is populated before r2Client is instantiated
    return import("../src/lib/r2");
}

async function uploadToR2(
    r2Client: any,
    bucketName: string,
    filePath: string,
    r2Key: string,
    contentType: string
): Promise<void> {
    const fileBuffer = await fs.readFile(filePath);
    await r2Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType
    }));
}

async function main() {
    console.log("Starting R2 upload...\n");

    // Dynamic import
    const { r2Client, R2_BUCKET_NAME } = await getR2();

    // Check if client is properly initialized
    if (!process.env.R2_ACCOUNT_ID) {
        console.error("FATAL: R2_ACCOUNT_ID not found in environment.");
        process.exit(1);
    }

    let totalUploaded = 0;
    const totalSkipped = 0;
    let totalFailed = 0;

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);
        const folderName = path.basename(fullDirPath);

        // Map directory structure
        // Clean folder names for R2 keys
        let r2Folder = folderName;
        if (folderName === 'Messenger Quran Studies') r2Folder = 'messenger_quran_studies';
        // messenger_audios is already snake_case

        try {
            const files = await fs.readdir(fullDirPath);

            // Support both MP4 and MP3
            const mediaFiles = files.filter((f) => f.endsWith(".mp4") || f.endsWith(".mp3"));

            console.log(`\nProcessing ${mediaFiles.length} files in ${folderName} (Target: ${r2Folder})...\n`);

            for (const file of mediaFiles) {
                const filePath = path.join(fullDirPath, file);
                const isVideo = file.endsWith('.mp4');
                const contentType = isVideo ? "video/mp4" : "audio/mpeg";

                // Construct transcript path (same name but .json or _diarized.json)
                const transcriptPathDiarized = path.join(fullDirPath, file.replace(/\.(mp4|mp3)$/, "_diarized.json"));
                const transcriptPathSimple = path.join(fullDirPath, file.replace(/\.(mp4|mp3)$/, ".json"));
                const transcriptPathTagged = path.join(fullDirPath, file.replace(/\.(mp4|mp3)$/, "-tagged.json"));

                // Upload media
                const mediaKey = `media/${r2Folder}/${file}`;

                console.log(`[${totalUploaded + 1}] Uploading: ${file}`);

                try {
                    const stats = await fs.stat(filePath);
                    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    console.log(`  -> Media: ${sizeMB} MB (${contentType})`);

                    await uploadToR2(r2Client, R2_BUCKET_NAME, filePath, mediaKey, contentType);
                    console.log(`  -> ✓ Uploaded`);

                    // Upload transcript if it exists
                    let foundTranscript = false;
                    const transcriptCandidates = [transcriptPathDiarized, transcriptPathSimple, transcriptPathTagged];

                    for (const tPath of transcriptCandidates) {
                        try {
                            await fs.access(tPath);
                            const tName = path.basename(tPath);
                            const tKey = `media/${r2Folder}/${tName}`;

                            const tStats = await fs.stat(tPath);
                            const tSizeMB = (tStats.size / (1024 * 1024)).toFixed(2);
                            console.log(`  -> Transcript found: ${tName} (${tSizeMB} MB)`);

                            await uploadToR2(r2Client, R2_BUCKET_NAME, tPath, tKey, "application/json");
                            console.log(`  -> ✓ Transcript uploaded`);
                            foundTranscript = true;
                            break; // Upload the first matching transcript found
                        } catch {
                            // continue
                        }
                    }

                    if (!foundTranscript) {
                        console.log(`  -> ⚠ No transcript found`);
                    }

                    totalUploaded++;
                } catch (error: any) {
                    totalFailed++;
                    console.error(`  -> ✗ FAILED: ${error.message}`);
                }
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("R2 upload complete!");
    console.log(`Total Uploaded: ${totalUploaded}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
