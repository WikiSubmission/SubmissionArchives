
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars from .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import { PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadFiles() {
    // Dynamic import to ensure env vars are loaded
    const { r2Client, R2_BUCKET_NAME } = await import('../src/lib/r2');

    const localBasePath = path.join(process.cwd(), 'reprocess_ready');
    const filename = '5) Quran Study - Q.56 -75 & Q.57 (02-17-1989)';

    const files = [
        { ext: '.json', contentType: 'application/json' },
        { ext: '.mp3', contentType: 'audio/mpeg' }
    ];

    const targetFolder = 'media/quran-study-v2';

    for (const file of files) {
        const localPath = path.join(localBasePath, filename + file.ext);
        const r2Key = `${targetFolder}/${filename}${file.ext}`;

        console.log(`Uploading ${localPath} to ${r2Key}...`);

        try {
            const fileStream = fs.createReadStream(localPath);
            const command = new PutObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: r2Key,
                Body: fileStream,
                ContentType: file.contentType
            });

            await r2Client.send(command);
            console.log(`Successfully uploaded ${r2Key}`);
        } catch (e) {
            console.error(`Failed to upload ${r2Key}:`, e);
        }
    }
}

uploadFiles();
