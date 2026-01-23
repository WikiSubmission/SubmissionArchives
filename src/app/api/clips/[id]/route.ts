import { NextRequest, NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { clipsStore } from '@/lib/clipStore';

// GET: Fetch clip by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const clip = clipsStore.get(id);

        if (!clip) {
            return NextResponse.json(
                { error: 'Clip not found' },
                { status: 404 }
            );
        }

        // Generate a signed URL for the clip file
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: clip.r2Key,
        });
        const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });

        return NextResponse.json({
            ...clip,
            signedUrl,
        });
    } catch (error: any) {
        console.error('Error fetching clip:', error);
        return NextResponse.json(
            { error: `Failed to fetch clip: ${error.message}` },
            { status: 500 }
        );
    }
}
