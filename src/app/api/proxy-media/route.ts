import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/security';

const DEFAULT_ALLOWED_MEDIA_HOSTS = new Set([
    'pub-cb3aaebc3d2f49698a10d5a2bca9b720.r2.dev',
]);

const MAX_RANGE_BYTES = 25 * 1024 * 1024;
const MAX_FULL_RESPONSE_BYTES = 50 * 1024 * 1024;
const PROXY_TIMEOUT_MS = 15_000;

export async function GET(request: NextRequest) {
    const rateLimit = checkRateLimit(`proxy-media:${getClientIp(request.headers)}`, 120);
    if (rateLimit.limited) {
        return rateLimitResponse(rateLimit);
    }

    const searchParams = request.nextUrl.searchParams;
    const rawUrl = searchParams.get('url');

    if (!rawUrl) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    const url = parseAllowedMediaUrl(rawUrl);
    if (!url) {
        return new NextResponse('URL is not an allowed media origin', { status: 400 });
    }

    const range = request.headers.get('range');
    const normalizedRange = range ? normalizeRangeHeader(range) : null;
    if (range && !normalizedRange) {
        return new NextResponse('Invalid Range header', { status: 416 });
    }

    try {
        const headers = new Headers();
        headers.set('Accept-Encoding', 'identity');

        if (normalizedRange) {
            headers.set('Range', normalizedRange);
        }

        const response = await fetch(url.toString(), {
            headers,
            redirect: 'manual',
            signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
        });

        if (response.status >= 300 && response.status < 400) {
            return new NextResponse('Redirecting media URLs are not allowed', { status: 502 });
        }

        const contentType = response.headers.get('Content-Type') || 'application/octet-stream';
        if (!isAllowedMediaType(contentType)) {
            return new NextResponse('Unsupported media type', { status: 415 });
        }

        const contentLength = Number(response.headers.get('Content-Length') || 0);
        if (!normalizedRange && contentLength > MAX_FULL_RESPONSE_BYTES) {
            return new NextResponse('Media response is too large without a Range header', { status: 413 });
        }

        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', contentType);

        if (response.headers.has('Content-Length')) {
            responseHeaders.set('Content-Length', response.headers.get('Content-Length')!);
        }
        if (response.headers.has('Content-Range')) {
            responseHeaders.set('Content-Range', response.headers.get('Content-Range')!);
        }
        if (response.headers.has('Accept-Ranges')) {
            responseHeaders.set('Accept-Ranges', response.headers.get('Accept-Ranges')!);
        }

        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('X-Content-Type-Options', 'nosniff');
        responseHeaders.set('Cache-Control', 'public, max-age=3600');

        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new NextResponse('Proxy error', { status: 502 });
    }
}

function parseAllowedMediaUrl(rawUrl: string) {
    try {
        const url = new URL(rawUrl);
        const allowedHosts = getAllowedMediaHosts();
        const hostname = url.hostname.toLowerCase();

        if (url.protocol !== 'https:') return null;
        if (url.username || url.password) return null;
        if (url.port && url.port !== '443') return null;
        if (!allowedHosts.has(hostname)) return null;

        return url;
    } catch {
        return null;
    }
}

function getAllowedMediaHosts() {
    const hosts = new Set(DEFAULT_ALLOWED_MEDIA_HOSTS);
    const configuredHosts = process.env.MEDIA_PROXY_ALLOWED_HOSTS?.split(',') || [];

    for (const host of configuredHosts) {
        const normalized = host.trim().toLowerCase();
        if (normalized) {
            hosts.add(normalized);
        }
    }

    return hosts;
}

function normalizeRangeHeader(range: string) {
    const match = range.match(/^bytes=(\d*)-(\d*)$/);
    if (!match) return null;

    const rawStart = match[1];
    const rawEnd = match[2];
    if (!rawStart && !rawEnd) return null;

    const start = rawStart ? Number(rawStart) : null;
    const end = rawEnd ? Number(rawEnd) : null;

    if (start !== null && !Number.isSafeInteger(start)) return null;
    if (end !== null && !Number.isSafeInteger(end)) return null;
    if (start !== null && end !== null && end < start) return null;

    if (start === null) {
        const suffixLength = Math.min(end || MAX_RANGE_BYTES, MAX_RANGE_BYTES);
        return `bytes=-${suffixLength}`;
    }

    const cappedEnd = Math.min(end ?? start + MAX_RANGE_BYTES - 1, start + MAX_RANGE_BYTES - 1);
    return `bytes=${start}-${cappedEnd}`;
}

function isAllowedMediaType(contentType: string) {
    const type = contentType.toLowerCase();
    return (
        type.startsWith('audio/') ||
        type.startsWith('video/') ||
        type.startsWith('application/octet-stream')
    );
}
