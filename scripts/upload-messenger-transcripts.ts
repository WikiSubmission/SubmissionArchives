/**
 * Upload Messenger Audio transcripts to R2
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';

// Helper to get client after ensuring env vars are loaded
async function getR2() {
    return import('../src/lib/r2');
}

async function uploadTranscripts() {
    console.log('='.repeat(60));
    console.log('Uploading Messenger Audio Transcripts to R2');
    console.log('='.repeat(60));
    console.log();

    // Dynamic import to ensure env vars are loaded
    const { r2Client, R2_BUCKET_NAME } = await getR2();

    // Check if client is properly initialized
    if (!process.env.R2_ACCOUNT_ID) {
        console.error('FATAL: R2_ACCOUNT_ID not found in environment.');
        console.error('Make sure .env.local exists with R2 credentials.');
        process.exit(1);
    }

    const transcriptsDir = path.join(__dirname, '../messenger_audio_transcripts');

    // Get all JSON files
    const files = await fs.readdir(transcriptsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('temp_'));

    console.log(`Found ${jsonFiles.length} transcript files to upload\n`);

    let successCount = 0;
    let failCount = 0;

    for (const file of jsonFiles) {
        const filePath = path.join(transcriptsDir, file);

        try {
            // Read file content
            const fileBuffer = await fs.readFile(filePath);

            // Upload to R2
            const r2Key = `media/messenger_audios/${file}`;

            await r2Client.send(new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileBuffer,
                ContentType: 'application/json'
            }));

            console.log(`✓ Uploaded: ${file}`);
            successCount++;
        } catch (error: any) {
            console.error(`✗ Failed to upload ${file}:`, error.message);
            failCount++;
        }
    }

    console.log();
    console.log('='.repeat(60));
    console.log('UPLOAD SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Successfully uploaded: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log();

    if (successCount > 0) {
        console.log('Transcripts are now available at:');
        console.log('media/messenger_audios/*.json');
    }
}

uploadTranscripts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
