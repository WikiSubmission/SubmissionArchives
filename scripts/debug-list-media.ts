
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { S3Client, ListObjectsV2Command, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
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
    console.log(`Sampling candidate folders for ${Bucket}...`);

    const prefixes = [
        'media/quran-studies/',
        'media/messenger_audios/',
        'media/'
    ];

    for (const Prefix of prefixes) {
        console.log(`\n--- Sampling ${Prefix} (Max 20) ---`);
        const command = new ListObjectsV2Command({
            Bucket,
            Prefix,
            MaxKeys: 20,
            Delimiter: '/'
        });

        // We want files, not subfolders, so we look at Contents
        // but Delimiter might hide files in sub-sub folders.
        // Let's remove Delimiter to just see flat keys for the first 20.
        const flatCommand = new ListObjectsV2Command({
            Bucket,
            Prefix,
            MaxKeys: 20
        });

        try {
            const response = await r2Client.send(flatCommand) as ListObjectsV2CommandOutput;
            if (response.Contents) {
                response.Contents.forEach(item => console.log(item.Key));
            } else {
                console.log("(Empty or no files)");
            }
        } catch (e) { console.error(e); }
    }
}

main().catch(console.error);
