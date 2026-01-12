import 'dotenv/config';
import { r2Client, R2_BUCKET_NAME } from '../src/lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

async function countTranscripts() {
    const categories = {
        'Messenger Audios': 'media/messenger_audios/',
        'Quran Studies': 'media/quran-study-v2/',
        'Friday Sermons': 'media/FRIDAY SERMONS/',
        'Video Programs': 'media/VIDEO PROGRAMS/'
    };

    console.log('📊 Transcript Count Summary\n');

    for (const [name, prefix] of Object.entries(categories)) {
        const cmd = new ListObjectsV2Command({
            Bucket: R2_BUCKET_NAME,
            Prefix: prefix,
        });

        const response = await r2Client.send(cmd);
        const files = response.Contents || [];

        const vttFiles = files.filter(f => f.Key?.endsWith('.vtt'));
        const jsonFiles = files.filter(f => f.Key?.endsWith('.json') && !f.Key?.endsWith('.json.json'));
        const mediaFiles = files.filter(f =>
            f.Key?.match(/\.(mp4|mp3|m4a)$/i) &&
            !f.Key?.endsWith('/')
        );

        console.log(`\n${name}:`);
        console.log(`  Media files: ${mediaFiles.length}`);
        console.log(`  VTT transcripts: ${vttFiles.length}`);
        console.log(`  JSON transcripts: ${jsonFiles.length}`);
        console.log(`  Total transcripts: ${vttFiles.length + jsonFiles.length}`);

        const missing = mediaFiles.length - (vttFiles.length + jsonFiles.length);
        if (missing > 0) {
            console.log(`  ⚠️  Missing transcripts: ${missing}`);
        } else if (missing < 0) {
            console.log(`  ℹ️  Extra transcripts: ${Math.abs(missing)}`);
        } else {
            console.log(`  ✅ All media files have transcripts`);
        }
    }
}

countTranscripts().catch(console.error);
