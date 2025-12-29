
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initializing Clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const TRANSCRIPTS_DIR = "transcripts"; // Local folder with UUID json files
const R2_BUCKET = process.env.R2_BUCKET_NAME || "rkmediaassets";

const FOLDER_MAP: Record<string, string> = {
    'sermon': 'disorganized_sermons',
    'quran-study': 'messenger_quran_studies',
    'audio': 'messenger_audios',
    'video-program': 'rk_video_programs'
};

async function main() {
    console.log("Starting Transcript Migration...");

    // 1. Get all local UUID json files
    const files = await fs.readdir(TRANSCRIPTS_DIR);
    const uuidFiles = files.filter(f => f.endsWith(".json"));

    console.log(`Found ${uuidFiles.length} transcript files locally.`);

    // 2. Query Supabase for metadata
    // Extract UUIDs from filenames (remove .json)
    const uuids = uuidFiles.map(f => f.replace(".json", ""));

    // Fetch in batches if necessary, but 52 is small enough
    const { data: mediaList, error } = await supabase
        .from('media')
        .select('id, local_filename, type')
        .in('id', uuids);

    if (error) {
        console.error("Supabase Error:", error);
        return;
    }

    if (!mediaList || mediaList.length === 0) {
        console.error("No matching media found in Supabase.");
        return;
    }

    console.log(`Matched ${mediaList.length} records in DB.`);

    // 3. Upload loop
    for (const media of mediaList) {
        const uuidFilename = `${media.id}.json`;
        const localPath = path.join(TRANSCRIPTS_DIR, uuidFilename);

        // Determine R2 Key
        // media.local_filename is "1) Quran Study...mp3"
        // We want "media/folder/[filename].json"

        const folder = FOLDER_MAP[media.type];
        if (!folder) {
            console.warn(`Unknown type ${media.type} for ${media.id}`);
            continue;
        }

        // Replace extension with .json
        // WatchPage checks: .json, _diarized.json, -tagged.json
        // We'll use .json for simplicity as it's one of the checks.
        // Actually, let's use the EXACT replacement logic WatchPage uses to be safe.
        // WatchPage logic: key.replace(/\.(mp4|mp3)$/, ".json")

        let targetFilename = media.local_filename;
        if (targetFilename.match(/\.(mp4|mp3)$/i)) {
            targetFilename = targetFilename.replace(/\.(mp4|mp3)$/i, ".json");
        } else {
            targetFilename = targetFilename + ".json";
        }

        const r2Key = `media/${folder}/${targetFilename}`;

        console.log(`Uploading ${uuidFilename} -> ${r2Key}`);

        try {
            const content = await fs.readFile(localPath);
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: r2Key,
                Body: content,
                ContentType: "application/json"
            }));
            console.log(`  -> Success`);
        } catch (err) {
            console.error(`  -> Failed:`, err);
        }
    }
}

main();
