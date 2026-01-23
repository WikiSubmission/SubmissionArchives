
import { NextRequest, NextResponse } from 'next/server';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';

// Helper to generate unique ID
function generateClipId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mediaUrl, startTime, endTime, title } = body;

        if (!mediaUrl || startTime === undefined || endTime === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const duration = endTime - startTime;
        if (duration <= 0 || duration > 300) { // Max 5 mins
            return NextResponse.json({ error: 'Invalid duration (max 5 mins)' }, { status: 400 });
        }

        console.log(`Processing clip: ${mediaUrl} [${startTime}-${endTime}]`);

        // Determine file type from URL or default to mp4
        const isAudio = mediaUrl.endsWith('.mp3') || mediaUrl.includes('audio');
        const extension = isAudio ? 'mp3' : 'mp4';
        const contentType = isAudio ? 'audio/mpeg' : 'video/mp4';

        // Temp file paths
        const tempDir = os.tmpdir();
        const clipId = generateClipId();
        const outputPath = path.join(tempDir, `${clipId}.${extension}`);

        // Process with FFmpeg
        await new Promise<void>((resolve, reject) => {
            ffmpeg(mediaUrl)
                .setStartTime(startTime)
                .setDuration(duration)
                .output(outputPath)
                .on('end', () => {
                    console.log('FFmpeg processing finished');
                    resolve();
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(err);
                })
                .run();
        });

        // Read the processed file
        const fileBuffer = await fs.promises.readFile(outputPath);

        // Upload to R2
        const key = `clips/${clipId}.${extension}`;
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
        });

        await r2Client.send(command);

        // Cleanup temp file
        await fs.promises.unlink(outputPath).catch(console.error);

        // Return the key for the metadata step
        return NextResponse.json({
            success: true,
            key,
            clipId
        });

    } catch (error: any) {
        console.error('Server-side processing error:', error);
        return NextResponse.json(
            { error: `Processing failed: ${error.message}` },
            { status: 500 }
        );
    }
}
