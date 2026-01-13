import 'dotenv/config';
import { r2Client, R2_BUCKET_NAME } from '../src/lib/r2';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

async function deleteFile(key: string): Promise<boolean> {
    try {
        // Check if file exists first
        const headCmd = new HeadObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key
        });
        await r2Client.send(headCmd);
        console.log(`✓ Found file: ${key}`);

        // Delete the file
        const deleteCmd = new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key
        });
        await r2Client.send(deleteCmd);
        console.log(`✓ Deleted: ${key}`);
        return true;
    } catch (error: any) {
        if (error.name === 'NotFound') {
            console.log(`✗ File not found: ${key}`);
            return false;
        }
        console.error(`✗ Error with ${key}:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🗑️  Deleting temporary sermon file from R2...\n');

    const fileToDelete = 'media/FRIDAY SERMONS/temp_15_15 Friday Sermon by dr Rashad Khalifa Universal Unity Through Devotion to GOD Alone GOD is Close to.mp4';

    // Delete the main video file
    const deleted = await deleteFile(fileToDelete);

    if (deleted) {
        // Check for associated transcript files
        const transcriptCandidates = [
            fileToDelete.replace('.mp4', '.json'),
            fileToDelete.replace('.mp4', '_diarized.json'),
            fileToDelete.replace('.mp4', '.en-US.json'),
            fileToDelete.replace('.mp4', '.vtt'),
            fileToDelete.replace('.mp4', '.en-US.vtt'),
        ];

        console.log('\n📄 Checking for associated transcript files...');
        for (const transcriptKey of transcriptCandidates) {
            await deleteFile(transcriptKey);
        }
    }

    console.log('\n✅ Deletion process complete!');
    console.log('💡 Refresh your browser at http://localhost:3000 to see the changes.');
}

main().catch(console.error);
