import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const r2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

async function main() {
    const Bucket = process.env.R2_BUCKET_NAME;
    const Prefix = "media/messenger_quran_studies/";

    console.log(`Scanning R2 bucket: ${Bucket}/${Prefix} ...`);

    let continuationToken: string | undefined = undefined;
    const foundIndices = new Set<number>();
    const filesFound: string[] = [];

    do {
        const command = new ListObjectsV2Command({
            Bucket,
            Prefix,
            ContinuationToken: continuationToken,
        });

        try {
            const response = await r2Client.send(command) as ListObjectsV2CommandOutput;
            if (response.Contents) {
                for (const item of response.Contents) {
                    if (item.Key && item.Key.endsWith(".mp3")) {
                        // Extract filename from Key
                        const filename = item.Key.replace(Prefix, "");
                        filesFound.push(filename);

                        // Regex for "01-...", "1-...", "1) ..."
                        // Try multiple formats
                        let match = filename.match(/^(\d+)\)/);
                        if (!match) match = filename.match(/^(\d+)-/);
                        if (!match) match = filename.match(/^(\d+)_/);

                        if (match) {
                            foundIndices.add(parseInt(match[1], 10));
                        } else {
                            console.log(`[Unmatched] ${filename}`);
                        }
                    }
                }
            }
            continuationToken = response.NextContinuationToken;
        } catch (error) {
            console.error("Error listing R2:", error);
            process.exit(1);
        }
    } while (continuationToken);

    console.log(`Total MP3 files found: ${filesFound.length}`);

    const missing: number[] = [];
    // Range 1 to 52
    for (let i = 1; i <= 52; i++) {
        if (!foundIndices.has(i)) {
            missing.push(i);
        }
    }

    if (missing.length === 0) {
        console.log("✅ All files 1-52 are present!");
    } else {
        console.log("❌ Missing Indices:");
        missing.forEach(id => console.log(`- #${id}`));
    }
}

main();
