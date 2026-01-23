import { NextRequest, NextResponse } from 'next/server';
import { clipsStore } from '@/lib/clipStore';

// User-Agent patterns for bots that support inline media playback
const MEDIA_BOTS = [
    'Discordbot',
    'TelegramBot',
    'Slackbot',
    'WhatsApp',
    'SkypeUriPreview',
    'FacebookExternalHit',
    'Twitterbot'
];

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const clip = clipsStore.get(id);

    // If clip doesn't exist, redirect to home or 404
    if (!clip) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    const userAgent = request.headers.get('user-agent') || '';
    const isMediaBot = MEDIA_BOTS.some(bot => userAgent.includes(bot));

    // 1. Direct Media Logic (Bots)
    // Discord needs a direct link to the file to render the player.
    if (isMediaBot) {
        // Construct the public R2 URL
        // NOTE: This assumes the bucket is public or you have a reliable public endpoint.
        // Based on previous code: https://pub-1f70c66e36d64e469999b82b1dfdafcb.r2.dev/${clip.r2Key}
        const r2PublicUrl = `https://pub-1f70c66e36d64e469999b82b1dfdafcb.r2.dev/${clip.r2Key}`;

        return NextResponse.redirect(r2PublicUrl, 302);
    }

    // 2. Rich Page Logic (Humans)
    // Redirect browser users to the full UI page
    return NextResponse.redirect(new URL(`/clips/${id}`, request.url), 302);
}
