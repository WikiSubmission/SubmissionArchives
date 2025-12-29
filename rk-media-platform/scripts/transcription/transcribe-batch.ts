import { transcribeFile } from "../src/lib/deepgram";
import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
];

// ... imports
import { r2Client, R2_BUCKET_NAME } from "../src/lib/r2";
import { deepgram } from "../src/lib/deepgram";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// ... existing code ...

async function main() {
    console.log("Starting batch transcription (R2 Upload Strategy)...");

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);

        try {
            const files = await fs.readdir(fullDirPath);
            const mp4Files = files.filter((f) => f.endsWith(".mp4"));

            console.log(`\nFound ${mp4Files.length} MP4 files in ${dir}`);

            for (const file of mp4Files) {
                const filePath = path.join(fullDirPath, file);
                const transcriptPath = path.join(
                    fullDirPath,
                    file.replace(".mp4", "_diarized.json")
                );

                // Check if transcript already exists
                try {
                    await fs.access(transcriptPath);
                    console.log(`[SKIP] Transcript exists for: ${file}`);
                    continue;
                } catch {
                    // File doesn't exist, proceed
                }

                console.log(`[PROCESSING] ${file}`);

                // 1. Upload to R2
                console.log(`  -> Uploading to R2...`);
                const fileBuffer = await fs.readFile(filePath);
                const r2Key = `transcripts/${file}`; // Use a prefix to keep bucket organized

                try {
                    await r2Client.send(new PutObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: r2Key,
                        Body: fileBuffer,
                        ContentType: "video/mp4"
                    }));
                    console.log(`  -> Upload Complete.`);

                    // 2. Transcribe from R2 URL
                    const r2Url = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${r2Key}`;
                    // Note: Deepgram needs a publicly accessible URL or a signed URL. 
                    // R2 worker public URL is best. If not public, we might need a signed URL.
                    // For now, let's try assuming we can generate a signed URL or use the R2 endpoint if configured.

                    // Actually, for private buckets, we need a pre-signed URL.
                    // Let's generate one.
                    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
                    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
                    const signedUrl = await getSignedUrl(r2Client, new GetObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: r2Key
                    }), { expiresIn: 3600 });

                    console.log(`  -> Transcribing via Signed URL...`);

                    const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
                        { url: signedUrl },
                        {
                            model: "nova-2",
                            smart_format: true,
                            punctuate: true,
                            diarize: true,
                        }
                    );

                    if (error) throw error;

                    await fs.writeFile(
                        transcriptPath,
                        JSON.stringify(result, null, 2)
                    );
                    console.log(`  -> [SUCCESS] Saved transcript.`);

                } catch (error: any) {
                    console.error(`  -> [ERROR] Failed:`, error.message);
                }
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }

    console.log("\nBatch transcription complete!");
}

main().catch(console.error);
