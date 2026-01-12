
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
    console.log(`Searching ALL files in ${Bucket} for "Quran"...`);

    let continuationToken: string | undefined = undefined;
    let matches = 0;

    do {
        const command = new ListObjectsV2Command({
            Bucket,
            ContinuationToken: continuationToken,
        });

        try {
            const response = await r2Client.send(command) as ListObjectsV2CommandOutput;
            if (response.Contents) {
                for (const item of response.Contents) {
                    if (item.Key && item.Key.toLowerCase().includes("quran") && item.Key.endsWith(".mp3")) {
                        // Only print matches
                        console.log(item.Key);
                        matches++;
                        if (matches >= 200) { // Increase limit
                            console.log("Found 200 matches, stopping sample.");
                            return;
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

    console.log(`Search complete. Total matches: ${matches}`);
}

main();
