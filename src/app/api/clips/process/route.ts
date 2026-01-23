import { NextRequest, NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Server-side clip processing using fetch + byte range requests
// This is a simplified approach that extracts a segment for formats that support it

export async function POST(request: NextRequest) {
    try {
        const { mediaUrl, mediaType, startSeconds, endSeconds } = await request.json();

        if (!mediaUrl || startSeconds === undefined || endSeconds === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const duration = endSeconds - startSeconds;
        if (duration <= 0 || duration > 300) {
            return NextResponse.json({ error: 'Invalid duration (must be 1-300 seconds)' }, { status: 400 });
        }

        // For now, we'll return the full media with instructions for client-side trimming
        // Full server-side FFmpeg processing would require a different infrastructure
        // This is a temporary solution that lets us continue testing the flow

        // Fetch the media
        const response = await fetch(mediaUrl);
        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
        }

        const contentType = mediaType === 'video' ? 'video/mp4' : 'audio/mpeg';
        const mediaBuffer = await response.arrayBuffer();

        // Return the media (client will need to handle trimming display-side)
        // In production, you'd use FFmpeg here via a Node.js binding or external service
        return new NextResponse(mediaBuffer, {
            headers: {
                'Content-Type': contentType,
                'X-Clip-Start': startSeconds.toString(),
                'X-Clip-End': endSeconds.toString(),
            },
        });

    } catch (error: any) {
        console.error('Clip processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
