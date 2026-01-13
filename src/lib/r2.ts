import { S3Client } from "@aws-sdk/client-s3";

// Ensure environment variables are defined
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!accountId || !accessKeyId || !secretAccessKey) {
    // In development, we might want to warn instead of crashing, 
    // but for R2 functionality to work, these are required.
    console.warn("R2 environment variables are missing. R2 uploads will fail.");
}

export const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: accessKeyId || "",
        secretAccessKey: secretAccessKey || "",
    },
});

export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "rkmediaassets";
