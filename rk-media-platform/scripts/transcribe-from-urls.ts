import { transcribeUrl } from "../src/lib/deepgram";
import fs from "fs/promises";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
];

// Extract YouTube ID from filename like "Video Title [abc123xyz].mp4"
function extractYouTubeId(filename: string): string | null {
    const match = filename.match(/\[([^\]]+)\]/);
    return match ? match[1] : null;
}

async function main() {
    console.log("Starting URL-based batch transcription...\n");

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);

        try {
            const files = await fs.readdir(fullDirPath);
            const mp4Files = files.filter((f) => f.endsWith(".mp4"));

            console.log(`Found ${mp4Files.length} MP4 files in ${dir}\n`);

            for (const file of mp4Files) {
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

                // Extract YouTube ID
                const youtubeId = extractYouTubeId(file);
                if (!youtubeId) {
                    console.log(`[ERROR] No YouTube ID found in: ${file}`);
                    continue;
                }

                const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
                console.log(`[PROCESSING] ${file}`);
                console.log(`  -> YouTube URL: ${youtubeUrl}`);

                try {
                    const response = await transcribeUrl(youtubeUrl);

                    await fs.writeFile(
                        transcriptPath,
                        JSON.stringify(response, null, 2)
                    );
                    console.log(`  -> ✓ SUCCESS\n`);
                } catch (error: any) {
                    console.error(`  -> ✗ ERROR: ${error.message}\n`);
                }
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }

    console.log("\nBatch transcription complete!");
}

main().catch(console.error);
