import { r2Client, R2_BUCKET_NAME } from "../src/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
];

async function uploadToR2(
    filePath: string,
    r2Key: string,
    contentType: string
): Promise<void> {
    const fileBuffer = await fs.readFile(filePath);
    await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType
    }));
}

async function main() {
    console.log("Starting R2 upload...\n");

    let totalUploaded = 0;
    let totalSkipped = 0;
    let totalFailed = 0;

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);
        const folderName = path.basename(fullDirPath);

        try {
            const files = await fs.readdir(fullDirPath);
            const mp4Files = files.filter((f) => f.endsWith(".mp4"));

            console.log(`\nProcessing ${mp4Files.length} videos in ${folderName}...\n`);

            for (const file of mp4Files) {
                const videoPath = path.join(fullDirPath, file);
                const transcriptPath = path.join(
                    fullDirPath,
                    file.replace(".mp4", "_diarized.json")
                );

                // Upload video
                const videoKey = `media/${folderName}/${file}`;
                console.log(`[${totalUploaded + 1}] Uploading: ${file}`);

                try {
                    const videoStats = await fs.stat(videoPath);
                    const videoSizeMB = (videoStats.size / (1024 * 1024)).toFixed(2);
                    console.log(`  -> Video: ${videoSizeMB} MB`);

                    await uploadToR2(videoPath, videoKey, "video/mp4");
                    console.log(`  -> ✓ Video uploaded`);

                    // Upload transcript if it exists
                    try {
                        await fs.access(transcriptPath);
                        const transcriptKey = `media/${folderName}/${file.replace(".mp4", "_diarized.json")}`;

                        const transcriptStats = await fs.stat(transcriptPath);
                        const transcriptSizeMB = (transcriptStats.size / (1024 * 1024)).toFixed(2);
                        console.log(`  -> Transcript: ${transcriptSizeMB} MB`);

                        await uploadToR2(transcriptPath, transcriptKey, "application/json");
                        console.log(`  -> ✓ Transcript uploaded`);
                    } catch {
                        console.log(`  -> ⚠ No transcript found`);
                    }

                    totalUploaded++;
                    console.log(`  -> SUCCESS (${totalUploaded}/${mp4Files.length})\n`);

                } catch (error: any) {
                    totalFailed++;
                    console.error(`  -> ✗ FAILED: ${error.message}\n`);
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
