import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { listMediaFiles } from '@/lib/r2Bucket';
import { formatMedia } from '@/lib/formatUtils';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Player from './Player';

// Helper to convert stream to string
const streamToString = (stream: any) =>
    new Promise<string>((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });

function parseVttTimestamp(timestamp: string): number {
    if (!timestamp) return 0;
    const parts = timestamp.split(':');
    let seconds = 0;
    if (parts.length === 3) {
        seconds += parseInt(parts[0]) * 3600;
        seconds += parseInt(parts[1]) * 60;
        seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
        seconds += parseInt(parts[0]) * 60;
        seconds += parseFloat(parts[1]);
    }
    return seconds;
}

function parseVTT(vttContent: string) {
    const segments = [];
    const normalized = vttContent.replace(/\r\n/g, '\n');
    const blocks = normalized.split('\n\n');

    let index = 0;
    const speakerPattern = /(?:^|\s)((?:Dr\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?):/g;

    for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) continue;
        if (lines[0].startsWith('WEBVTT')) continue;
        if (lines[0].startsWith('NOTE')) continue;
        if (lines[0].startsWith('Kind:')) continue;
        if (lines[0].startsWith('Language:')) continue;

        // Find time line containing "-->"
        const timeLineIdx = lines.findIndex(l => l.includes('-->'));
        if (timeLineIdx === -1) continue;

        const timeLine = lines[timeLineIdx];
        const [startStr, endStrPart] = timeLine.split('-->').map(s => s.trim());
        const endStr = endStrPart ? endStrPart.split(' ')[0] : startStr;

        const start = parseVttTimestamp(startStr);
        const end = parseVttTimestamp(endStr);

        // Content is lines after time line
        let content = lines.slice(timeLineIdx + 1).join(' ');

        // Strip VTT tags
        content = content.replace(/<[^>]*>/g, '').trim();
        content = content.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');

        if (!content) continue;

        // --- Speaker Splitting Logic ---
        const matches = Array.from(content.matchAll(speakerPattern));

        if (matches.length === 0) {
            segments.push({
                id: index++,
                start_time: start,
                end_time: end,
                speaker: "Dr. Rashad Khalifa",
                content: content,
                segment_index: index
            });
            continue;
        }

        const totalDuration = end - start;
        const subSegments = [];

        const firstMatchStart = matches[0].index!;

        if (firstMatchStart > 0) {
            const preText = content.substring(0, firstMatchStart).trim();
            if (preText) {
                subSegments.push({
                    speaker: "Dr. Rashad Khalifa",
                    content: preText
                });
            }
        }

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            const speakerName = match[1].trim();
            const contentStart = match.index! + match[0].length;
            const contentEnd = (i < matches.length - 1) ? matches[i + 1].index! : content.length;

            const speechText = content.substring(contentStart, contentEnd).trim();
            if (speechText) {
                subSegments.push({
                    speaker: speakerName,
                    content: speechText
                });
            }
        }

        const segmentTotalLen = subSegments.reduce((acc, s) => acc + s.content.length, 0) || 1;
        let currentTimeCursor = start;

        for (const sub of subSegments) {
            const ratio = sub.content.length / segmentTotalLen;
            const subDuration = totalDuration * ratio;

            segments.push({
                id: index++,
                start_time: currentTimeCursor,
                end_time: currentTimeCursor + subDuration,
                speaker: sub.speaker,
                content: sub.content,
                segment_index: index
            });
            currentTimeCursor += subDuration;
        }
    }
    return segments;
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const key = decodeURIComponent(id);
    const filename = key.split('/').pop() || key;

    // Determine type from key prefix
    let type = 'unknown';
    if (key.includes('disorganized_sermons') || key.includes('FRIDAY SERMONS')) type = 'sermon';
    else if (key.includes('quran-study-v2') || key.includes('messenger_quran_studies')) type = 'quran-study';
    else if (key.includes('messenger_audios')) type = 'audio';
    else if (key.includes('rk_video_programs') || key.includes('VIDEO PROGRAMS')) type = 'video-program';

    const title = filename
        .replace(/\.(mp4|mp3|m4a)$/i, "")
        .replace(/_/g, " ")
        .trim();

    // GENERATE SIGNED URL
    let signedUrl = "";
    try {
        const cmd = new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key });
        signedUrl = await getSignedUrl(r2Client, cmd, { expiresIn: 3600 });
    } catch (err) {
        console.error("Failed to sign URL:", err);
    }

    // CALCULATE NEXT / PREV
    let nextItem = null;
    let prevItem = null;

    try {
        const allMedia = await listMediaFiles();

        const filtered = allMedia
            .filter(m => m.type === type)
            // Format to get sortValue
            .map(m => ({ ...m, ...formatMedia(m) }))
            // Sort (Same logic as HomePage)
            .sort((a, b) => {
                if (type === 'sermon') return b.sortValue - a.sortValue; // Desc
                return a.sortValue - b.sortValue; // Asc
            });

        const currentIndex = filtered.findIndex(m => m.id === key);
        if (currentIndex !== -1) {
            if (currentIndex > 0) prevItem = filtered[currentIndex - 1];
            if (currentIndex < filtered.length - 1) nextItem = filtered[currentIndex + 1];
        }
    } catch (e) {
        console.error("Error calculating neighbors:", e);
    }

    const prev = prevItem ? { id: prevItem.id, title: prevItem.displayTitle } : undefined;
    const next = nextItem ? { id: nextItem.id, title: nextItem.displayTitle } : undefined;

    const media = {
        id: key,
        title,
        displayTitle: title,
        type,
        local_filename: filename,
        author: "Dr. Rashad Khalifa",
        description: "Streamed from Cloudflare R2",
    };

    // Try to fetch transcript from R2
    let segments: any[] = [];
    try {
        const transcriptCandidates = [
            key.replace(/\.(mp4|mp3|m4a)$/i, ".json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".en-US.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".en.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".json.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "_diarized.json.json"),
            key.replace(/\.(mp4|mp3|m4a)$/i, "-tagged.json"),
            key + ".json",
            key.replace(/\.(mp4|mp3|m4a)$/i, ".en-US.vtt"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".en.vtt"),
            key.replace(/\.(mp4|mp3|m4a)$/i, ".vtt"),
            key + ".en-US.vtt",
            key + ".vtt"
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
            if (transcriptBody.startsWith('WEBVTT') || transcriptBody.includes('-->')) {
                segments = parseVTT(transcriptBody);
            } else {
                try {
                    const json = JSON.parse(transcriptBody);
                    if (Array.isArray(json)) {
                        segments = json;
                    } else if (json.results?.channels?.[0]?.alternatives?.[0]?.paragraphs?.paragraphs) {
                        segments = json.results.channels[0].alternatives[0].paragraphs.paragraphs.map((p: any, i: number) => ({
                            id: i,
                            start_time: p.start,
                            end_time: p.end,
                            speaker: "Speaker " + p.speaker,
                            content: p.sentences.map((s: any) => s.text).join(' '),
                            segment_index: i
                        }));
                    } else if (json.results?.utterances) {
                        segments = json.results.utterances.map((u: any, i: number) => ({
                            id: i,
                            start_time: u.start,
                            end_time: u.end,
                            speaker: u.speaker ? "Speaker " + u.speaker : "Speaker",
                            content: u.transcript,
                            segment_index: i
                        }));
                    } else if (json.segments) {
                        segments = json.segments;
                    }
                } catch (e) {
                    console.error("Failed to parse transcript JSON", e);
                }
            }
        }

    } catch (err) {
        console.error("Error fetching transcript:", err);
    }

    return <Player media={media as any} segments={segments} signedUrl={signedUrl} prev={prev} next={next} />;
}
