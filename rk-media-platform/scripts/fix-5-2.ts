
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
    console.log("Fixing Messenger Audio 5.2...");

    // Path to the good local file
    const localPath = "public/messenger_transcripts/MA 5.2.json";

    try {
        const content = await fs.readFile(localPath);
        console.log(`Read ${content.length} bytes from local file.`);

        const targets = [
            "media/messenger_audios/Messenger Audio ｜ 5.2_diarized.json.json", // The likely culprit from migration
            "media/messenger_audios/Messenger Audio ｜ 5.2_diarized.json",      // The clean name
            "media/messenger_audios/Messenger Audio ｜ 5.2.json"               // The simple fallback
        ];

        for (const key of targets) {
            console.log(`Uploading to: ${key}`);
            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: content,
                ContentType: "application/json"
            }));
            console.log("  -> Done");
        }

        console.log("Fix Complete.");

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
