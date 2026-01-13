
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import { pipeline } from "stream/promises";
import { execSync } from "child_process";

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || "rkmediaassets";
const KEY = "media/disorganized_sermons/Friday Sermons by Dr. Rashad Khalifa, Dated March 4th 1988 [x4Q1ysVx8_0].mp4";

async function main() {
    console.log("Fixing Sermon Video Format (MPEG-TS -> MP4)...");

    try {
        // 1. Download
        console.log("Downloading metadata...");
        const getCmd = new GetObjectCommand({ Bucket: R2_BUCKET, Key: KEY });
        const response = await r2Client.send(getCmd);

        console.log("Streaming to temp file (temp.ts)...");
        await pipeline(response.Body as any, fs.createWriteStream("temp.ts"));
        console.log("Download complete.");

        // 2. Transcode (Re-mux Video, Re-encode Audio)
        console.log("Re-muxing with ffmpeg (copy video, re-encode audio)...");
        // -c:v copy: keep video as is (it's valid h264)
        // -c:a aac: re-encode audio to ensure valid standard AAC (fixes ADTS/ASC issues)
        // -movflags +faststart: optimize for web
        execSync("ffmpeg -y -i temp.ts -c:v copy -c:a aac -movflags +faststart temp_fixed.mp4", { stdio: 'inherit' });

        // 3. Upload
        console.log("Uploading fixed file...");
        const fileBuffer = fs.readFileSync("temp_fixed.mp4");
        await r2Client.send(new PutObjectCommand({
            Bucket: R2_BUCKET,
            Key: KEY,
            Body: fileBuffer,
            ContentType: "video/mp4",
            CacheControl: "no-cache" // Force refresh
        }));
        console.log("Upload complete.");

        // Cleanup
        fs.unlinkSync("temp.ts");
        fs.unlinkSync("temp_fixed.mp4");

    } catch (err) {
        console.error("Error:", err);
    }
}

main();
