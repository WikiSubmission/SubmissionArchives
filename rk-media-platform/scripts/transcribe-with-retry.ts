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

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 5000; // 5 seconds

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function transcribeWithRetry(
    fileBuffer: Buffer,
    filename: string,
    retries = MAX_RETRIES
): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`  -> Attempt ${attempt}/${retries}...`);
            const response = await transcribeFile(fileBuffer, "video/mp4");
            return response;
        } catch (error: any) {
            if (attempt === retries) {
                throw error; // Final attempt failed
            }

            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
            console.log(`  -> Failed: ${error.message}`);
            console.log(`  -> Retrying in ${delay / 1000}s...`);
            await sleep(delay);
        }
    }
}

async function main() {
    console.log("Starting batch transcription with retry logic...\n");

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);

        try {
            const files = await fs.readdir(fullDirPath);
            const mp4Files = files.filter((f) => f.endsWith(".mp4"));

            console.log(`Found ${mp4Files.length} MP4 files in ${dir}\n`);

            for (const file of mp4Files) {
                const filePath = path.join(fullDirPath, file);
                const transcriptPath = path.join(
                    fullDirPath,
                    file.replace(".mp4", "_diarized.json")
                );

                // Check if transcript already exists
                try {
                    await fs.access(transcriptPath);
                    console.log(`[SKIP] ${file}`);
                    continue;
                } catch {
                    // File doesn't exist, proceed
                }

                totalProcessed++;
                console.log(`\n[${totalProcessed}] Processing: ${file}`);

                try {
                    const fileBuffer = await fs.readFile(filePath);
                    const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);
                    console.log(`  -> Size: ${fileSizeMB} MB`);

                    const response = await transcribeWithRetry(fileBuffer, file);

                    await fs.writeFile(
                        transcriptPath,
                        JSON.stringify(response, null, 2)
                    );

                    totalSuccess++;
                    console.log(`  -> ✓ SUCCESS (${totalSuccess}/${totalProcessed})`);
                } catch (error: any) {
                    totalFailed++;
                    console.error(`  -> ✗ FAILED after ${MAX_RETRIES} attempts: ${error.message}`);
                    console.error(`  -> Failed files: ${totalFailed}`);
                }

                // Small delay between files to avoid rate limiting
                await sleep(2000);
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Batch transcription complete!");
    console.log(`Total Processed: ${totalProcessed}`);
    console.log(`Successful: ${totalSuccess}`);
    console.log(`Failed: ${totalFailed}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
