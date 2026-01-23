import { NextRequest, NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Generate a short unique ID for the clip file
function generateClipId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

// POST: Generate presigned URL for clip upload
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { fileType } = body; // 'audio' or 'video'

        // Determine file extension
        const extension = fileType === 'video' ? 'mp4' : 'mp3';
        const contentType = fileType === 'video' ? 'video/mp4' : 'audio/mpeg';

        // Generate unique key for the clip
        const clipId = generateClipId();
        const key = `clips/${clipId}.${extension}`;

        // Create presigned PUT URL
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 }); // 5 min expiry

        return NextResponse.json({
            uploadUrl,
            key,
            clipId,
        });
    } catch (error: any) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json(
            { error: `Failed to generate upload URL: ${error.message}` },
            { status: 500 }
        );
    }
}
