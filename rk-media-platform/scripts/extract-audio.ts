import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const TARGET_DIRS = [
    "../data/disorganized_sermons",
    "../data/rk_video_programs",
];

const FFMPEG_PATH = "C:\\\\Users\\\\Jonathan\\\\AppData\\\\Local\\\\Microsoft\\\\WinGet\\\\Packages\\\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\\\ffmpeg-8.0.1-full_build\\\\bin\\\\ffmpeg.exe";

async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
    const command = `"${FFMPEG_PATH}" -i "${videoPath}" -vn -acodec copy "${audioPath}" -y`;
    await execAsync(command);
}

async function main() {
    console.log("Starting audio extraction...\n");

    let totalExtracted = 0;
    let totalSkipped = 0;

    for (const dir of TARGET_DIRS) {
        const fullDirPath = path.resolve(process.cwd(), dir);

        try {
            const files = await fs.readdir(fullDirPath);
            const mp4Files = files.filter((f) => f.endsWith(".mp4"));

            console.log(`Found ${mp4Files.length} MP4 files in ${dir}\n`);

            for (const file of mp4Files) {
                const videoPath = path.join(fullDirPath, file);
                const transcriptPath = path.join(
                    fullDirPath,
                    file.replace(".mp4", "_diarized.json")
                );
                const audioPath = path.join(
                    fullDirPath,
                    file.replace(".mp4", "_temp.m4a")
                );

                // Skip if transcript already exists
                try {
                    await fs.access(transcriptPath);
                    totalSkipped++;
                    console.log(`[SKIP] ${file} (transcript exists)`);
                    continue;
                } catch {
                    // Transcript doesn't exist, check if audio already extracted
                }

                // Skip if audio already extracted
                try {
                    await fs.access(audioPath);
                    totalSkipped++;
                    console.log(`[SKIP] ${file} (audio exists)`);
                    continue;
                } catch {
                    // Audio doesn't exist, proceed with extraction
                }

                console.log(`[EXTRACTING] ${file}...`);

                try {
                    await extractAudio(videoPath, audioPath);
                    totalExtracted++;
                    console.log(`  -> ✓ SUCCESS (${totalExtracted} extracted)\n`);
                } catch (error: any) {
                    console.error(`  -> ✗ ERROR: ${error.message}\n`);
                }
            }
        } catch (err) {
            console.error(`Error processing directory ${dir}:`, err);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Audio extraction complete!");
    console.log(`Total Extracted: ${totalExtracted}`);
    console.log(`Total Skipped: ${totalSkipped}`);
    console.log("=".repeat(50));
}

main().catch(console.error);
