import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/security';
import { parseWebVitalMetric } from '@/lib/webVitals';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 16_384;
const REQUESTS_PER_MINUTE = 120;

export async function POST(request: Request) {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json({ ok: false, error: 'Payload too large.' }, { status: 413 });
    }

    const rateLimit = checkRateLimit(`web-vitals:${getClientIp(request.headers)}`, REQUESTS_PER_MINUTE);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    try {
        const body = await request.text();
        if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
            return NextResponse.json({ ok: false, error: 'Payload too large.' }, { status: 413 });
        }

        const metric = parseWebVitalMetric(JSON.parse(body));
        if (!metric) {
            return NextResponse.json({ ok: false, error: 'Invalid metric.' }, { status: 400 });
        }

        if (process.env.NODE_ENV === 'production') {
            console.info('[web-vitals]', metric);
        }
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
    }

    return NextResponse.json(
        { ok: true },
        { headers: { 'Cache-Control': 'no-store' } },
    );
}
