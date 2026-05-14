'use server';

import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';
import { getMediaHref } from '@/lib/utils';

export async function updateTranscript(mediaId: string, segments: unknown[]) {
    try {
        console.log(`[Server Action] Updating transcript for ${mediaId}`);

        // Construct the key. The mediaId passed from WatchPage is often the R2 key.
        // We need to assume the transcript key follows the convention.
        // For the Great Debate, let's assume it's the same key but with .json
        // NOTE: WatchPage tries multiple candidates. We should probably try to standardise.
        // If the original file was "folder/file.mp3", the transcript is likely "folder/file.json"

        // Simple heuristic: Remove extension, add .json
        let targetKey = mediaId.replace(/\.(mp4|mp3|m4a)$/i, "") + ".json";

        // If the mediaId itself doesn't have an extension, just append .json
        if (!targetKey.endsWith('.json')) {
            targetKey = mediaId + ".json";
        }

        // Upload to R2
        const body = JSON.stringify(segments, null, 2);

        const cmd = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: targetKey,
            Body: body,
            ContentType: 'application/json'
        });

        await r2Client.send(cmd);

        console.log(`[Server Action] Successfully uploaded to ${targetKey}`);

        revalidatePath(getMediaHref(mediaId));
        return { success: true };
    } catch (error: unknown) {
        console.error("[Server Action] Error updating transcript:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown transcript update error',
        };
    }
}
