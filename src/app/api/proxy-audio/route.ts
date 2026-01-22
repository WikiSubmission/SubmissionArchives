import { NextRequest, NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { GetObjectCommand } from '@aws-sdk/client-s3';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');

    if (!key) {
        return new NextResponse('Missing key parameter', { status: 400 });
    }

    try {
        const range = request.headers.get('range');
        const commandParams: any = {
            Bucket: R2_BUCKET_NAME,
            Key: key,
        };

        if (range) {
            commandParams.Range = range;
        }

        const command = new GetObjectCommand(commandParams);
        const response = await r2Client.send(command);

        if (!response.Body) {
            return new NextResponse('File not found', { status: 404 });
        }

        // Convert the ReadableStream from SDK to a Web ReadableStream
        // @ts-ignore
        const stream = response.Body.transformToWebStream();

        const headers = new Headers();
        headers.set('Content-Type', response.ContentType || 'audio/mpeg');
        headers.set('Cache-Control', 'public, max-age=3600');
        headers.set('Accept-Ranges', 'bytes');

        if (response.ContentLength) {
            headers.set('Content-Length', response.ContentLength.toString());
        }

        if (response.ContentRange) {
            headers.set('Content-Range', response.ContentRange);
        }

        // Return 206 if we got a partial content response (implied by presence of ContentRange or if we asked for Range)
        // Usually, if we ask for Range, S3 returns 206.
        const status = response.ContentRange ? 206 : 200;

        return new NextResponse(stream, {
            status,
            headers,
        });

    } catch (error: any) {
        console.error('Error fetching from R2:', error);
        return new NextResponse(`Error fetching file: ${error.message}`, { status: 500 });
    }
}
