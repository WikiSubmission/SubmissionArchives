import { transcribeFile } from "../src/lib/deepgram";
import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
];

async function main() {
    console.log("Starting audio file transcription...\n");

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);

        try {
            const files = await fs.readdir(fullDirPath);
            const audioFiles = files.filter((f) => f.endsWith("_temp.m4a"));

            console.log(`Found ${audioFiles.length} audio files in ${dir}\n`);

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

                    const response = await transcribeFile(audioBuffer, "audio/m4a");

                    await fs.writeFile(
                        transcriptPath,
                        JSON.stringify(response, null, 2)
                    );

                    // Delete temporary audio file after successful transcription
                    await fs.unlink(audioPath);

                    totalSuccess++;
                    console.log(`  -> ✓ SUCCESS (${totalSuccess}/${totalProcessed})`);
                    console.log(`  -> Cleaned up temp audio file\n`);
                } catch (error: any) {
                    totalFailed++;
                    console.error(`  -> ✗ FAILED: ${error.message}`);
                    console.error(`  -> Failed files: ${totalFailed}\n`);
                }
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Audio transcription complete!");
    console.log(`Total Processed: ${totalProcessed}`);
    console.log(`Successful: ${totalSuccess}`);
    console.log(`Failed: ${totalFailed}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
