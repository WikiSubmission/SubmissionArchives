import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs/promises";
import path from "path";

async function getR2() {
    return import("../../src/lib/r2");
}

async function main() {
    const { r2Client, R2_BUCKET_NAME } = await getR2();

    const transcriptPath = path.resolve(process.cwd(), "transcripts/messenger_transcripts/MA 3.2.json");
    const r2Key = "media/messenger_audios/Messenger Audio ｜ 3.2.json";

    console.log(`Uploading transcript to R2...`);
    console.log(`Local: ${transcriptPath}`);
    console.log(`R2 Key: ${r2Key}`);

    const fileBuffer = await fs.readFile(transcriptPath);

    await r2Client.send(new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: fileBuffer,
        ContentType: "application/json"
    }));

    console.log("✓ Upload complete!");
}

main().catch(console.error);
