
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || "rkmediaassets";

async function main() {
    console.log("Syncing Accurate Transcript for 5.2...");

    // Path provided by user: rk-media-platform/transcripts/messenger_transcripts
    // I found MA 5.2.json there.
    const localPath = "transcripts/messenger_transcripts/MA 5.2.json";

    try {
        const content = await fs.readFile(localPath);
        console.log(`Read ${content.length} bytes from ${localPath}`);

        // We overwrite ALL variants to be safe
        const targets = [
            "media/messenger_audios/Messenger Audio ｜ 5.2_diarized.json.json",
            "media/messenger_audios/Messenger Audio ｜ 5.2_diarized.json",
            "media/messenger_audios/Messenger Audio ｜ 5.2.json"
        ];

        for (const key of targets) {
            console.log(`Uploading to: ${key}`);
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: content,
                ContentType: "application/json",
                CacheControl: "no-cache, no-store, must-revalidate" // Try to bust cache
            }));
            console.log("  -> Done");
        }

        console.log("Sync Complete.");

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
