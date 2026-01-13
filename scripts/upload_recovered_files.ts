
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const PREFIX = "media/messenger_quran_studies/";
const RECOVERY_DIR = path.resolve(process.cwd(), "recovery_output");

async function main() {
    console.log(`Scanning recovery directory: ${RECOVERY_DIR}`);

    try {
        const files = await fs.readdir(RECOVERY_DIR);
        // Filter out temp files and incomplete downloads
        const validFiles = files.filter(f =>
            (f.endsWith(".mp3") || f.endsWith(".json")) &&
            !f.endsWith(".part") &&
            !f.endsWith(".ytdl")
        );

        console.log(`Found ${validFiles.length} files to upload.`);

        for (const file of validFiles) {
            const filePath = path.join(RECOVERY_DIR, file);
            const r2Key = `${PREFIX}${file}`;

            console.log(`Uploading ${file}...`);
            const fileBuffer = await fs.readFile(filePath);
            const contentType = file.endsWith(".mp3") ? "audio/mpeg" : "application/json";

            await client.send(new PutObjectCommand({
                Bucket: BUCKET,
                Key: r2Key,
                Body: fileBuffer,
                ContentType: contentType
            }));
            console.log("  ✓ Done");
        }

        console.log("Upload complete!");
    } catch (err) {
        console.error("Upload failed:", err);
    }
}

main().catch(console.error);
