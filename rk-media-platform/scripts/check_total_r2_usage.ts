
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
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

async function checkSize() {
    const Bucket = process.env.R2_BUCKET_NAME!;
    const PREFIXES = [
        "media/messenger_quran_studies/",
        "media/rk_video_programs/",
        "media/disorganized_sermons/",
        "media/messenger_audios/"
    ];

    console.log("Calculating total size...");

    let grandTotal = 0;

    for (const prefix of PREFIXES) {
        let totalSize = 0;
        let fileCount = 0;
        let continuationToken: string | undefined = undefined;

        console.log(`Scanning ${prefix}...`);

        do {
            const cmd = new ListObjectsV2Command({
                Bucket,
                Prefix: prefix,
                ContinuationToken: continuationToken
            });
            const res = await r2Client.send(cmd);

            if (res.Contents) {
                for (const item of res.Contents) {
                    if (item.Size) {
                        totalSize += item.Size;
                        fileCount++;
                    }
                }
            }
            continuationToken = res.NextContinuationToken;
        } while (continuationToken);

        const gb = (totalSize / (1024 * 1024 * 1024)).toFixed(2);
        console.log(`   -> ${prefix}: ${gb} GB (${fileCount} files)`);
        grandTotal += totalSize;
    }

    const totalGb = (grandTotal / (1024 * 1024 * 1024)).toFixed(2);
    console.log(`\nTOTAL ESTIMATED BACKUP SIZE: ${totalGb} GB`);
}

checkSize();
