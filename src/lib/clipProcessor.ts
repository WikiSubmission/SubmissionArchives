'use client';

// This file loads FFmpeg dynamically at runtime to avoid Turbopack bundling issues
// It fetches the FFmpeg library from CDN and creates a worker-based processing pipeline

export interface ClipProcessorOptions {
    mediaUrl: string;
    mediaType: 'audio' | 'video';
    startSeconds: number;
    endSeconds: number;
    onProgress?: (progress: number) => void;
}

export interface ClipProcessorResult {
    blob: Blob;
    filename: string;
}

// Process clip using server-side API instead of client-side FFmpeg
// This avoids the Turbopack/WASM issues entirely
export async function processClip(options: ClipProcessorOptions): Promise<ClipProcessorResult> {
    const { mediaUrl, mediaType, startSeconds, endSeconds, onProgress } = options;

    onProgress?.(10);

    // Call server-side processing API
    const response = await fetch('/api/clips/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mediaUrl,
            mediaType,
            startSeconds,
            endSeconds,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Clip processing failed: ${error}`);
    }

    onProgress?.(90);

    const blob = await response.blob();
    const filename = mediaType === 'video' ? 'clip.mp4' : 'clip.mp3';

    onProgress?.(100);

    return { blob, filename };
}
