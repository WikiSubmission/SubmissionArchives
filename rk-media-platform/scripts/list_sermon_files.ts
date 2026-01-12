import 'dotenv/config';
import { r2Client, R2_BUCKET_NAME } from '../src/lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function listSermonFiles() {
    const cmd = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: 'media/FRIDAY SERMONS/',
    });

    const response = await r2Client.send(cmd);
    const files = response.Contents || [];

    console.log(`\n📁 Files in media/FRIDAY SERMONS/ (${files.length} total):\n`);

    files.forEach(file => {
        const filename = file.Key?.split('/').pop() || file.Key;
        if (filename?.includes('temp')) {
            console.log(`⚠️  ${filename} (${file.Size} bytes)`);
        } else {
            console.log(`   ${filename}`);
        }
    });
}

listSermonFiles().catch(console.error);
