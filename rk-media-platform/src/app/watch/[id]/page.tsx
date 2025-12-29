import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import Player from './Player';

// Helper to convert stream to string
const streamToString = (stream: any) =>
    new Promise<string>((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const key = decodeURIComponent(id);
    const filename = key.split('/').pop() || key;

    // Determine type from key prefix
    let type = 'unknown';
    if (key.includes('disorganized_sermons')) type = 'sermon';
    else if (key.includes('messenger_quran_studies')) type = 'quran-study';
    else if (key.includes('messenger_audios')) type = 'audio';
    else if (key.includes('rk_video_programs')) type = 'video-program';

    const title = filename
        .replace(/\.(mp4|mp3)$/i, "")
        .replace(/_/g, " ")
        .replace(/^\d+\)\s*/, "")
        .trim();

    // Reconstruct Media Object
    const media = {
        id: key,
        title,
        displayTitle: title,
        type,
        local_filename: filename,
        author: "Dr. Rashad Khalifa",
        description: "Streamed from Cloudflare R2",
        // Helper property for Player to know the folder if needed, 
        // though Player usually reconstructs it. 
        // We might need to adjust Player if it expects specific DB fields.
    };

    // Try to fetch transcript from R2
    let segments: any[] = [];
    try {
        // Best practice: Prefer clean .json (from migration), then legacy variants
        const transcriptCandidates = [
            key.replace(/\.(mp4|mp3|m4a)$/i, ".json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".json.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "-tagged.json"),
            key + ".json"
        ];

        let transcriptBody = "";

        for (const tKey of transcriptCandidates) {
            try {
                const cmd = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: tKey });
                const response = await r2Client.send(cmd);
                if (response.Body) {
                    transcriptBody = await streamToString(response.Body);
                    break;
                }
            } catch (e) {
                // ignore 404
            }
        }

        if (transcriptBody) {
            const json = JSON.parse(transcriptBody);

            // 1. Standard Array Format (Clean Migration)
            if (Array.isArray(json)) {
                segments = json;
            }
            // 2. Deepgram with Paragraphs (Best Legacy Option)
            else if (json.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs) {
                segments = json.results.channels[0].alternatives[0].paragraphs.paragraphs.map((p: any, i: number) => ({
                    id: i,
                    start_time: p.start,
                    end_time: p.end,
                    speaker: "Speaker " + p.speaker,
                    content: p.sentences.map((s: any) => s.text).join(' '),
                    segment_index: i
                }));
            }
            // 3. Deepgram Utterances (Older Legacy)
            else if (json.results?.utterances) {
                segments = json.results.utterances.map((u: any, i: number) => ({
                    id: i,
                    start_time: u.start,
                    end_time: u.end,
                    speaker: u.speaker ? "Speaker " + u.speaker : "Speaker",
                    content: u.transcript,
                    segment_index: i
                }));
            }
            // 4. Other formats (segments key)
            else if (json.segments) {
                segments = json.segments;
            }
        }

    } catch (err) {
        console.error("Error fetching transcript:", err);
    }

    return <Player media={media as any} segments={segments} />;
}
