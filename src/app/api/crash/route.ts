import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/security';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 8_192;
const REQUESTS_PER_MINUTE = 30;

type CrashReport = {
    message: string;
    source: 'error' | 'unhandledrejection';
    stack?: string;
    url?: string;
};

function parseCrashReport(input: unknown): CrashReport | null {
    if (typeof input !== 'object' || input === null) return null;
    const raw = input as Record<string, unknown>;

    if (typeof raw.message !== 'string' || raw.message.length === 0) return null;
    if (raw.source !== 'error' && raw.source !== 'unhandledrejection') return null;

    return {
        message: raw.message.slice(0, 1_000),
        source: raw.source,
        stack: typeof raw.stack === 'string' ? raw.stack.slice(0, 4_000) : undefined,
        // Path only. A full URL can carry a search query, and there is no reason for a
        // crash report to be the thing that logs what someone was searching for.
        url: typeof raw.url === 'string' ? raw.url.slice(0, 500) : undefined,
    };
}

export async function POST(request: Request) {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return NextResponse.json({ ok: false }, { status: 413 });
    }

    const rateLimit = checkRateLimit(`crash:${getClientIp(request.headers)}`, REQUESTS_PER_MINUTE);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    try {
        const body = await request.text();
        if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
            return NextResponse.json({ ok: false }, { status: 413 });
        }

        const report = parseCrashReport(JSON.parse(body));
        if (!report) {
            return NextResponse.json({ ok: false, error: 'Invalid report.' }, { status: 400 });
        }

        logger.error({ event: 'client.crash', ...report }, 'Client error reported');
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid JSON.' }, { status: 400 });
    }

    return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
