import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

const client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

async function main() {
    console.log("Fetching Quran Study JSON files from R2...\n");

    const allKeys: string[] = [];
    let continuationToken;

    do {
        const cmd = new ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: "media/messenger_quran_studies/",
            ContinuationToken: continuationToken
        });
        const res: ListObjectsV2CommandOutput = await client.send(cmd);
        if (res.Contents) {
            allKeys.push(...res.Contents.map((c) => c.Key!));
        }
        continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    const jsonFiles = allKeys
        .filter(k => k.endsWith('.json'))
        .sort();

    console.log(`Found ${jsonFiles.length} JSON files:\n`);

    jsonFiles.forEach((file, index) => {
        const filename = file.split('/').pop();
        console.log(`${index + 1}. ${filename}`);
    });
}

main().catch(console.error);
