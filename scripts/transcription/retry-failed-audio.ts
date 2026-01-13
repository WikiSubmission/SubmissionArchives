import { transcribeFile } from "../src/lib/deepgram";
import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
];

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 10000; // 10 seconds

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function transcribeWithRetry(
    audioBuffer: Buffer,
    filename: string,
    retries = MAX_RETRIES
): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`  -> Attempt ${attempt}/${retries}...`);
            const response = await transcribeFile(audioBuffer, "audio/m4a");
            return response;
        } catch (error: any) {
            if (attempt === retries) {
                throw error;
            }

            const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
            console.log(`  -> Failed: ${error.message}`);
            console.log(`  -> Retrying in ${delay / 1000}s...`);
            await sleep(delay);
        }
    }
}

async function main() {
    console.log("Retrying failed audio transcriptions...\n");

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);

        try {
            const files = await fs.readdir(fullDirPath);
            const audioFiles = files.filter((f) => f.endsWith("_temp.m4a"));

            if (audioFiles.length === 0) {
                console.log(`No remaining audio files in ${dir}\n`);
                continue;
            }

            console.log(`Found ${audioFiles.length} remaining audio files in ${dir}\n`);

            for (const file of audioFiles) {
                const audioPath = path.join(fullDirPath, file);
                const originalName = file.replace("_temp.m4a", ".mp4");
                const transcriptPath = path.join(
                    fullDirPath,
                    file.replace("_temp.m4a", "_diarized.json")
                );

                totalProcessed++;
                console.log(`[${totalProcessed}] Processing: ${originalName}`);

                try {
                    const audioBuffer = await fs.readFile(audioPath);
                    const fileSizeMB = (audioBuffer.length / (1024 * 1024)).toFixed(2);
                    console.log(`  -> Audio size: ${fileSizeMB} MB`);

                    const response = await transcribeWithRetry(audioBuffer, file);

                    await fs.writeFile(
                        transcriptPath,
                        JSON.stringify(response, null, 2)
                    );

                    // Delete temporary audio file after successful transcription
                    await fs.unlink(audioPath);

                    totalSuccess++;
                    console.log(`  -> ✓ SUCCESS (${totalSuccess}/${totalProcessed})`);
                    console.log(`  -> Cleaned up temp audio file\n`);

                    // Longer delay between successful transcriptions
                    await sleep(5000);
                } catch (error: any) {
                    totalFailed++;
                    console.error(`  -> ✗ FAILED after ${MAX_RETRIES} attempts: ${error.message}`);
                    console.error(`  -> Failed files: ${totalFailed}\n`);
                }
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Retry transcription complete!");
    console.log(`Total Processed: ${totalProcessed}`);
    console.log(`Successful: ${totalSuccess}`);
    console.log(`Failed: ${totalFailed}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
