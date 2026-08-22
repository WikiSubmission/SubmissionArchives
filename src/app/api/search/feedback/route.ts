import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/security';
import { parseSearchEvent } from '@/lib/search/analytics';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4_096;
const REQUESTS_PER_MINUTE = 120;

export async function POST(request: Request) {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json({ ok: false, error: 'Payload too large.' }, { status: 413 });
    }

    const rateLimit = checkRateLimit(`search-feedback:${getClientIp(request.headers)}`, REQUESTS_PER_MINUTE);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    try {
        const body = await request.text();
        if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
            return NextResponse.json({ ok: false, error: 'Payload too large.' }, { status: 413 });
        }

        const event = parseSearchEvent(JSON.parse(body));
        if (!event) {
            return NextResponse.json({ ok: false, error: 'Invalid event.' }, { status: 400 });
        }

        logger.info({ event: event.name, ...event }, 'search analytics');
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
    }

    return NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store' } },
    );
}
