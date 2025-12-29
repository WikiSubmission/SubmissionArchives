import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// We need the service role key to bypass RLS or ensure we can write
// Check if SUPABASE_SERVICE_ROLE_KEY exists, else try anon key (might fail if RLS blocks inserts)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VIDEO_DIR = "../Messenger Video Programs";

async function main() {
    console.log("Starting Sync for Video Programs...\n");

    const fullPath = path.resolve(process.cwd(), VIDEO_DIR);
    console.log(`Scanning: ${fullPath}`);

    try {
        const files = await fs.readdir(fullPath);
        const videoFiles = files.filter(f => f.endsWith(".mp4"));

        console.log(`Found ${videoFiles.length} video files locally.`);

        // Fetch existing video programs from DB
        const { data: existing, error } = await supabase
            .from("media")
            .select("local_filename")
            .eq("type", "video-program");

        if (error) {
            console.error("Error fetching from Supabase:", error);
            return;
        }

        const existingFilenames = new Set(existing?.map(e => e.local_filename));
        console.log(`Found ${existingFilenames.size} existing video programs in DB.`);

        let insertedCount = 0;

        for (const file of videoFiles) {
            if (existingFilenames.has(file)) {
                console.log(`[Skipped] ${file} (Already exists)`);
                continue;
            }

            // Create Title from Filename
            const title = file
                .replace(/\.mp4$/i, "")
                .replace(/_/g, " ")
                .trim();

            const slug = title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");

            const record = {
                title: title,
                slug: slug,
                type: "video-program",
                local_filename: file,
                // author: "Dr. Rashad Khalifa", // Column doesn't exist
                created_at: new Date().toISOString(),
                // description: "Messenger Video Program", // Column doesn't exist
            };

            const { error: insertError } = await supabase
                .from("media")
                .insert([record]);

            if (insertError) {
                console.error(`[Error] Failed to insert ${file}:`, insertError);
            } else {
                console.log(`[Inserted] ${file}`);
                insertedCount++;
            }
        }

        console.log("\nSync Complete!");
        console.log(`Added ${insertedCount} new records.`);

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
