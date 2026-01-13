
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function listFiles() {
    // Dynamic import to ensure env vars are loaded
    const { r2Client, R2_BUCKET_NAME } = await import('../src/lib/r2');

    // Remove prefix to search whole bucket, but limit results
    const command = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        MaxKeys: 1000
    });

    try {
        const response = await r2Client.send(command);
        if (response.Contents) {
            console.log("Searching for Quran Study files...");
            // Filter locally
            const matches = response.Contents.filter(c => c.Key?.includes('Quran Study') && c.Key?.includes('56'));

            if (matches.length > 0) {
                matches.forEach(c => console.log(`- ${c.Key} (${c.Size} bytes)`));
            } else {
                console.log("No 'Quran Study' + '56' files found in first 1000 results.");
                // Print some sample keys to understand structure
                console.log("Sample keys:");
                response.Contents.slice(0, 10).forEach(c => console.log(`- ${c.Key}`));
            }

        } else {
            console.log("Bucket appears empty.");
        }
    } catch (e) {
        console.error("Error listing files:", e);
    }
}

listFiles();
