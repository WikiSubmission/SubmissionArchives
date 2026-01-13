import { r2Client, R2_BUCKET_NAME } from "./r2";
import { ListObjectsV2Command, ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

export type MediaItem = {
    id: string; // We'll use the S3 Key as the ID (or a hash if needed)
    title: string;
    displayTitle: string; // Same as title for now
    type: 'sermon' | 'quran-study' | 'audio' | 'video-program';
    local_filename: string; // The S3 Key
    created_at: string; // Can be LastModified from S3
    author: string;
    description?: string;
    duration_seconds?: number; // Might be unknown unless we head object or use metadata
};

const PREFIX_MAP = {
    'media/FRIDAY SERMONS/': 'sermon',
    'media/quran-study-v2/': 'quran-study',
    'media/messenger_audios/': 'audio', // or 'messenger-audio'
    'media/VIDEO PROGRAMS/': 'video-program'
} as const;

export async function listMediaFiles(): Promise<MediaItem[]> {
    const allMedia: MediaItem[] = [];

    for (const [prefix, type] of Object.entries(PREFIX_MAP)) {
        let continuationToken: string | undefined = undefined;

        do {
            const command = new ListObjectsV2Command({
                Bucket: R2_BUCKET_NAME,
                Prefix: prefix,
                ContinuationToken: continuationToken
            });

            try {
                const response: ListObjectsV2CommandOutput = await r2Client.send(command);

                if (response.Contents) {
                    for (const item of response.Contents) {
                        if (!item.Key || item.Key.endsWith('/')) continue; // Skip folders
                        if (item.Key.endsWith('.json') || item.Key.endsWith('.vtt')) continue;
                        // User Request: Exclude "Temp 52" file as it is a duplicate/temp file
                        // Using regex to catch variants (Temp 52, Temp_52, etc) and ensuring case-insensitivity
                        if (item.Key.match(/Temp\s*52/i)) {
                            console.log('Skipping Temp 52 file:', item.Key);
                            continue;
                        }
                        // User Request: Exclude "temp_15" file as it is a misnamed/temp file
                        if (item.Key.match(/temp[_\s]*15/i)) {
                            console.log('Skipping temp_15 file:', item.Key);
                            continue;
                        }


                        if (type === 'quran-study') {
                            console.log('DEBUG: Found potential Quran Study item:', item.Key);
                        }

                        // Parse Title from Filename
                        // Key: media/rk_video_programs/1988 Conference.mp4
                        const filename = item.Key.split('/').pop() || item.Key;
                        const title = filename
                            .replace(/\.(mp4|mp3)$/i, "")
                            .replace(/_/g, " ")
                            //.replace(/^[0-9]+[)-]\s*/, "") // STOP STRIPPING NUMBERS! formatUtils needs them for sorting/lookup.
                            .trim();

                        allMedia.push({
                            id: item.Key, // Use Key as ID (since it's unique)
                            title: title,
                            displayTitle: title,
                            type: type as any,
                            local_filename: filename, // Just the name for display if needed, but Key is source
                            created_at: item.LastModified?.toISOString() || new Date().toISOString(),
                            author: "Dr. Rashad Khalifa",
                            description: `Imported from R2: ${type}`
                        });
                    }
                }

                continuationToken = response.NextContinuationToken;
            } catch (err) {
                console.error(`Error listing prefix ${prefix}:`, err);
                break;
            }
        } while (continuationToken);
    }

    return allMedia;
}
