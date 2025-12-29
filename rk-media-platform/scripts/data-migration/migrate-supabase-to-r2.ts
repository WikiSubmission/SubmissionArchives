
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize Supabase (Public Access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize R2
const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || "rkmediaassets";

const FOLDER_MAP: Record<string, string> = {
    'sermon': 'disorganized_sermons',
    'quran-study': 'messenger_quran_studies',
    'audio': 'messenger_audios',
    'video-program': 'rk_video_programs'
};

async function main() {
    console.log("Starting Full Supabase -> R2 Transcript Migration...\n");

    // 1. Fetch ALL Media
    const { data: allMedia, error: mediaError } = await supabase
        .from('media')
        .select('id, title, type, local_filename');

    if (mediaError || !allMedia) {
        console.error("Error fetching media:", mediaError);
        return;
    }

    console.log(`Found ${allMedia.length} media records in Supabase.`);

    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 2. Iterate and Fetch Segments
    for (const media of allMedia) {
        // Fetch Dictionary/Segments
        const { data: segments, error: segError } = await supabase
            .from('transcript_segments')
            .select('start_time, end_time, content, speaker')
            .eq('media_id', media.id)
            .order('segment_index', { ascending: true });

        if (segError) {
            console.error(`Error fetching segments for ${media.title}:`, segError);
            errorCount++;
            continue;
        }

        if (!segments || segments.length === 0) {
            // console.log(`No segments for: ${media.title} (Skipping)`);
            skippedCount++;
            continue;
        }

        // 3. Construct JSON
        // Clean segments to minimal format
        const cleanSegments = segments.map((s, i) => ({
            id: i,
            start_time: s.start_time,
            end_time: s.end_time,
            speaker: s.speaker,
            content: s.content
        }));

        const jsonContent = JSON.stringify(cleanSegments, null, 2);

        // 4. Determine R2 Key
        const folder = FOLDER_MAP[media.type] || 'unknown';
        let filename = media.local_filename;

        // Ensure we target the .json file
        if (filename.match(/\.(mp4|mp3|m4a)$/i)) {
            filename = filename.replace(/\.(mp4|mp3|m4a)$/i, ".json");
        } else {
            filename = filename + ".json";
        }

        const r2Key = `media/${folder}/${filename}`;

        process.stdout.write(`Migrating: ${media.title.substring(0, 40).padEnd(40)} -> ${r2Key} ... `);

        try {
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: r2Key,
                Body: jsonContent,
                ContentType: "application/json"
            }));
            console.log("Refreshed in R2");
            successCount++;
        } catch (err: any) {
            console.log("FAILED");
            console.error(err.message);
            errorCount++;
        }
    }

    console.log("\nMigration Summary:");
    console.log(`Total Media Scanned: ${allMedia.length}`);
    console.log(`Transcripts Migrated: ${successCount}`);
    console.log(`Skipped (No segments): ${skippedCount}`);
    console.log(`Errors: ${errorCount}`);
}

main();
