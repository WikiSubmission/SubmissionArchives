import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/security';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const REQUESTS_PER_MINUTE = 10;

// The statically generated surfaces that go stale when the catalog is regenerated.
const REVALIDATED_PATHS = [
    '/',
    '/search',
    '/written',
    '/videos',
    '/audios',
    '/scripture/quran',
];

export async function POST(request: Request) {
    const rateLimit = checkRateLimit(`revalidate:${getClientIp(request.headers)}`, REQUESTS_PER_MINUTE);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    const expected = process.env.REVALIDATE_TOKEN;
    if (!expected) {
        logger.error({ event: 'revalidate.misconfigured' }, 'REVALIDATE_TOKEN is not configured');
        return NextResponse.json(
            { revalidated: false, error: 'Revalidation is not configured.' },
            { status: 503, headers: { 'Cache-Control': 'no-store' } },
        );
    }

    const provided = request.headers.get('x-revalidate-token') ?? '';
    if (!timingSafeEqual(provided, expected)) {
        return NextResponse.json(
            { revalidated: false, error: 'Unauthorized.' },
            { status: 401, headers: { 'Cache-Control': 'no-store' } },
        );
    }

    for (const path of REVALIDATED_PATHS) {
        revalidatePath(path);
    }

    return NextResponse.json(
        { revalidated: true, paths: REVALIDATED_PATHS },
        { headers: { 'Cache-Control': 'no-store' } },
    );
}

// Compares in constant time so a wrong token cannot be recovered byte by byte from
// response timing. Length is compared first because it is not itself a secret.
function timingSafeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;

    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}
