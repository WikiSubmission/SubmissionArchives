import { NextRequest, NextResponse } from 'next/server';
import { clipsStore, generateClipId, ClipMetadata } from '@/lib/clipStore';

// POST: Create a new clip
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mediaId, mediaTitle, startSeconds, endSeconds, title, r2Key } = body;

        // Validate required fields
        if (!mediaId || startSeconds === undefined || endSeconds === undefined || !r2Key) {
            return NextResponse.json(
                { error: 'Missing required fields: mediaId, startSeconds, endSeconds, r2Key' },
                { status: 400 }
            );
        }

        // Validate time range
        if (startSeconds >= endSeconds) {
            return NextResponse.json(
                { error: 'startSeconds must be less than endSeconds' },
                { status: 400 }
            );
        }

        const id = generateClipId();
        const clip: ClipMetadata = {
            id,
            mediaId,
            mediaTitle: mediaTitle || '',
            startSeconds,
            endSeconds,
            title,
            r2Key,
            createdAt: Date.now(),
        };

        clipsStore.set(id, clip);

        return NextResponse.json({ id, url: `/c/${id}` }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating clip:', error);
        return NextResponse.json(
            { error: `Failed to create clip: ${error.message}` },
            { status: 500 }
        );
    }
}

// GET: List all clips (for debugging/admin)
export async function GET() {
    const clips = Array.from(clipsStore.values()).sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json(clips);
}
