
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";

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
    console.log(`Enabling CORS for bucket: ${R2_BUCKET}...`);

    try {
        const cmd = new PutBucketCorsCommand({
            Bucket: R2_BUCKET,
            CORSConfiguration: {
                CORSRules: [
                    {
                        AllowedHeaders: ["*"],
                        AllowedMethods: ["GET", "HEAD"],
                        AllowedOrigins: ["*"], // Allow all origins for public media
                        ExposeHeaders: ["ETag", "Content-Length", "Content-Type"],
                        MaxAgeSeconds: 3600
                    }
                ]
            }
        });

        await r2Client.send(cmd);
        console.log("CORS configuration applied successfully.");

    } catch (err) {
        console.error("Error enabling CORS:", err);
    }
}

main();
