import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { clipsStore } from '@/lib/clipStore';
import ClipViewClient from './ClipViewClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

// Generate OG meta tags for Discord/social embeds
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { id } = await params;
    const clip = clipsStore.get(id);

    if (!clip) {
        return { title: 'Clip Not Found' };
    }

    const title = clip.title || `Clip from ${clip.mediaTitle}`;
    const duration = clip.endSeconds - clip.startSeconds;
    const description = `${formatTime(clip.startSeconds)} - ${formatTime(clip.endSeconds)} (${formatTime(duration)})`;

    // Direct R2 URL for the clip (Discord needs a direct file URL)
    const clipUrl = `https://pub-1f70c66e36d64e469999b82b1dfdafcb.r2.dev/${clip.r2Key}`;

    const isVideo = clip.r2Key.endsWith('.mp4');

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: isVideo ? 'video.other' : 'music.song',
            videos: isVideo ? [{ url: clipUrl, type: 'video/mp4' }] : undefined,
            audio: !isVideo ? [{ url: clipUrl, type: 'audio/mpeg' }] : undefined,
        },
        twitter: {
            card: 'player',
            title,
            description,
            players: [{
                playerUrl: clipUrl,
                streamUrl: clipUrl,
                width: 480,
                height: isVideo ? 270 : 60,
            }],
        },
        other: {
            // Discord-specific meta tags
            ...(isVideo && { 'og:video': clipUrl, 'og:video:type': 'video/mp4' }),
            ...(!isVideo && { 'og:audio': clipUrl, 'og:audio:type': 'audio/mpeg' }),
        },
    };
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default async function ClipViewPage({ params }: PageProps) {
    const { id } = await params;
    const clip = clipsStore.get(id);

    if (!clip) {
        notFound();
    }

    // Generate signed URL for playback
    const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: clip.r2Key,
    });
    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

    const isVideo = clip.r2Key.endsWith('.mp4');

    return (
        <ClipViewClient
            clip={clip}
            signedUrl={signedUrl}
            isVideo={isVideo}
        />
    );
}
