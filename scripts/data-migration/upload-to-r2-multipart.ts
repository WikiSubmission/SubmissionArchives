import { r2Client, R2_BUCKET_NAME } from "../src/lib/r2";
import { Upload } from "@aws-sdk/lib-storage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
];

// Use multipart upload for files larger than 50MB
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB

async function uploadLargeFile(
    filePath: string,
    r2Key: string,
    contentType: string
): Promise<void> {
    const fileStream = fs.createReadStream(filePath);

    const upload = new Upload({
        client: r2Client,
        params: {
            Bucket: R2_BUCKET_NAME,
            Key: r2Key,
            Body: fileStream,
            ContentType: contentType,
        },
        queueSize: 4, // concurrent uploads
        partSize: 10 * 1024 * 1024, // 10MB chunks
    });

    await upload.done();
}

async function uploadSmallFile(
    filePath: string,
    r2Key: string,
    contentType: string
): Promise<void> {
    const fileBuffer = await fsPromises.readFile(filePath);
    await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: contentType
    }));
}

async function main() {
    console.log("Starting R2 upload with multipart support...\n");

    let totalUploaded = 0;
    let totalFailed = 0;
    let totalFiles = 0;

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);
        const folderName = path.basename(fullDirPath);

        try {
            const files = await fsPromises.readdir(fullDirPath);
            const mp4Files = files.filter((f) => f.endsWith(".mp4"));
            totalFiles += mp4Files.length;

            console.log(`\nProcessing ${mp4Files.length} videos in ${folderName}...\n`);

            for (const file of mp4Files) {
                const videoPath = path.join(fullDirPath, file);
                const transcriptPath = path.join(
                    fullDirPath,
                    file.replace(".mp4", "_diarized.json")
                );

                console.log(`[${totalUploaded + 1}/${totalFiles}] ${file}`);

                try {
                    // Upload video
                    const videoStats = await fsPromises.stat(videoPath);
                    const videoSizeMB = (videoStats.size / (1024 * 1024)).toFixed(2);
                    const videoKey = `media/${folderName}/${file}`;

                    console.log(`  -> Video: ${videoSizeMB} MB`);

                    if (videoStats.size > MULTIPART_THRESHOLD) {
                        console.log(`  -> Using multipart upload...`);
                        await uploadLargeFile(videoPath, videoKey, "video/mp4");
                    } else {
                        await uploadSmallFile(videoPath, videoKey, "video/mp4");
                    }
                    console.log(`  -> ✓ Video uploaded`);

                    // Upload transcript
                    try {
                        await fsPromises.access(transcriptPath);
                        const transcriptStats = await fsPromises.stat(transcriptPath);
                        const transcriptSizeMB = (transcriptStats.size / (1024 * 1024)).toFixed(2);
                        const transcriptKey = `media/${folderName}/${file.replace(".mp4", "_diarized.json")}`;

                        console.log(`  -> Transcript: ${transcriptSizeMB} MB`);
                        await uploadSmallFile(transcriptPath, transcriptKey, "application/json");
                        console.log(`  -> ✓ Transcript uploaded`);
                    } catch {
                        console.log(`  -> ⚠ No transcript found`);
                    }

                    totalUploaded++;
                    console.log(`  -> SUCCESS (${totalUploaded}/${totalFiles})\n`);

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
    console.log(`Total Uploaded: ${totalUploaded}/${totalFiles}`);
    console.log(`Total Failed: ${totalFailed}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
