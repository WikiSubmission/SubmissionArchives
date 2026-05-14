/**
 * Upload corrected Quran Study JSON transcripts to R2
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;

// Mapping from study number to R2 key
// Based on existing structure in R2
function getR2Key(studyNumber: number): string {
    // Format: quran-study-v2/Quran Study {N}.json
    return `quran-study-v2/Quran Study ${studyNumber}.json`;
}

async function uploadFile(localPath: string, r2Key: string): Promise<boolean> {
    try {
        const content = fs.readFileSync(localPath, 'utf-8');

        const cmd = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: r2Key,
            Body: content,
            ContentType: 'application/json',
        });

        await r2Client.send(cmd);
        return true;
    } catch (err) {
        console.error(`Failed to upload ${r2Key}:`, err);
        return false;
    }
}

async function main() {
    const inputDir = path.join(process.cwd(), 'temp_json');

    // Get all JSON files
    const jsonFiles = fs.readdirSync(inputDir)
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.match(/\d+/)?.[0] || '0');
            return numA - numB;
        });

    console.log(`Found ${jsonFiles.length} JSON files to upload\n`);

    let successCount = 0;
    let failCount = 0;

    for (const jsonFile of jsonFiles) {
        const localPath = path.join(inputDir, jsonFile);
        const studyNumber = parseInt(jsonFile.match(/\d+/)?.[0] || '0');
        const r2Key = getR2Key(studyNumber);

        process.stdout.write(`Uploading ${jsonFile} → ${r2Key}... `);

        const success = await uploadFile(localPath, r2Key);

        if (success) {
            console.log('✓');
            successCount++;
        } else {
            console.log('✗');
            failCount++;
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Uploaded: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

main().catch(console.error);
