
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
    console.log("Fetching all keys...");

    const allKeys: string[] = [];
    let continuationToken;
    do {
        const cmd = new ListObjectsV2Command({
            Bucket: BUCKET,
            ContinuationToken: continuationToken
        });
        const res: ListObjectsV2CommandOutput = await client.send(cmd);
        if (res.Contents) {
            allKeys.push(...res.Contents.map((c) => c.Key!));
        }
        continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    console.log(`Total Objects: ${allKeys.length}`);

    const jsonKeys = new Set(allKeys.filter(k => k.endsWith(".json") || k.endsWith(".json.json")));
    const mediaKeys = allKeys.filter(k => k.match(/\.(mp3|mp4|m4a)$/i));

    console.log(`Media Files: ${mediaKeys.length}`);
    console.log(`JSON Files: ${jsonKeys.size}`);

    let matchCount = 0;
    let failCount = 0;

    for (const key of mediaKeys) {
        // EXACT LOGIC FROM WatchPage
        const transcriptCandidates = [
            key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "-tagged.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".json.json"),
            key + ".json"
        ];

        const match = transcriptCandidates.find(c => jsonKeys.has(c));

        if (match) {
            matchCount++;
        } else {
            failCount++;
            if (failCount <= 10) {
                console.log(`MISSING TRANSCRIPT: ${key}`);
                console.log(`  Tried:`);
                transcriptCandidates.forEach(c => console.log(`   - ${c}`));
            }
        }
    }

    console.log("\n--- Summary ---");
    console.log(`Matched: ${matchCount}`);
    console.log(`Failed:  ${failCount}`);

    // Check for orphan JSONs (JSONs that didn't match any media via this logic)
    // slightly harder to check reverse without complex logic, but looking at failures is enough.
}

main();
