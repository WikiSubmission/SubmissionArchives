import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing URL parameter', { status: 400 });
    }

    try {
        const headers = new Headers();

        // Forward Range header if present (crucial for seeking)
        const range = request.headers.get('range');
        if (range) {
            headers.set('Range', range);
        }

        // Fetch the external media with the Range header
        const response = await fetch(url, { headers });

        // Prepare response headers
        const responseHeaders = new Headers();
        responseHeaders.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');

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
        responseHeaders.set('Cache-Control', 'public, max-age=3600');

        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error: any) {
        console.error('Proxy error:', error);
        return new NextResponse(`Proxy error: ${error.message}`, { status: 500 });
    }
}
