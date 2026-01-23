'use client';

import { useState, useRef, useEffect } from 'react';
import { Scissors, Play, Pause, Loader2, Check, Copy, ExternalLink } from 'lucide-react';

interface ClipCreatorProps {
    mediaId: string;
    mediaTitle: string;
    mediaUrl: string;
    mediaType: 'audio' | 'video';
    initialStart?: number;
    initialEnd?: number;
}

// Parse timestamp string (MM:SS or H:MM:SS) to seconds
function parseTimestamp(ts: string): number | null {
    const parts = ts.split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return null;

    if (parts.length === 2) {
        // MM:SS
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        // H:MM:SS
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
}

// Format seconds to timestamp string
function formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ClipCreator({
    mediaId,
    mediaTitle,
    mediaUrl,
    mediaType,
    initialStart = 0,
    initialEnd = 30,
}: ClipCreatorProps) {
    const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);

    // Form state
    const [startTime, setStartTime] = useState(formatTimestamp(initialStart));
    const [endTime, setEndTime] = useState(formatTimestamp(initialEnd));
    const [clipTitle, setClipTitle] = useState('');

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);

    // Processing state
    const [status, setStatus] = useState<'idle' | 'processing' | 'uploading' | 'done' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [clipUrl, setClipUrl] = useState<string | null>(null);

    // Validation
    const startSeconds = parseTimestamp(startTime);
    const endSeconds = parseTimestamp(endTime);
    const isValid = startSeconds !== null && endSeconds !== null && startSeconds < endSeconds;
    const duration = isValid ? endSeconds - startSeconds : 0;

    // Preview playback
    const handlePreview = () => {
        if (!mediaRef.current || !isValid) return;

        const media = mediaRef.current;
        media.currentTime = startSeconds!;
        media.play();
        setIsPlaying(true);
        setIsPreviewing(true);
    };

    // Stop preview when reaching end time
    useEffect(() => {
        if (!isPreviewing || !mediaRef.current) return;

        const media = mediaRef.current;
        const checkTime = () => {
            if (media.currentTime >= endSeconds!) {
                media.pause();
                setIsPlaying(false);
                setIsPreviewing(false);
            }
        };

        media.addEventListener('timeupdate', checkTime);
        return () => media.removeEventListener('timeupdate', checkTime);
    }, [isPreviewing, endSeconds]);

    // Handle clip creation
    const handleCreateClip = async () => {
        if (!isValid) return;

        setStatus('processing');
        setProgress(0);
        setError(null);

        try {
            // Dynamically import FFmpeg
            setProgress(5);
            const { FFmpeg } = await import('@ffmpeg/ffmpeg');
            const { fetchFile, toBlobURL } = await import('@ffmpeg/util');

            setProgress(10);
            const ffmpeg = new FFmpeg();

            // Load FFmpeg
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });

            setProgress(30);

            // Fetch source media
            const inputName = mediaType === 'video' ? 'input.mp4' : 'input.mp3';
            const outputName = mediaType === 'video' ? 'output.mp4' : 'output.mp3';

            const response = await fetch(mediaUrl);
            const mediaData = await response.arrayBuffer();
            await ffmpeg.writeFile(inputName, new Uint8Array(mediaData));

            setProgress(50);

            // Cut the clip
            const durationSec = endSeconds! - startSeconds!;
            await ffmpeg.exec([
                '-ss', startSeconds!.toString(),
                '-i', inputName,
                '-t', durationSec.toString(),
                '-c', 'copy',
                outputName
            ]);

            setProgress(70);

            // Read output
            const data = await ffmpeg.readFile(outputName);
            const blob = new Blob([new Uint8Array(data as Uint8Array)], {
                type: mediaType === 'video' ? 'video/mp4' : 'audio/mpeg'
            });

            setStatus('uploading');
            setProgress(80);

            // Get presigned upload URL
            const signRes = await fetch('/api/clips/sign-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileType: mediaType }),
            });
            const { uploadUrl, key } = await signRes.json();

            // Upload to R2
            await fetch(uploadUrl, {
                method: 'PUT',
                body: blob,
                headers: { 'Content-Type': mediaType === 'video' ? 'video/mp4' : 'audio/mpeg' },
            });

            setProgress(90);

            // Save metadata
            const metaRes = await fetch('/api/clips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mediaId,
                    mediaTitle,
                    startSeconds: startSeconds!,
                    endSeconds: endSeconds!,
                    title: clipTitle || undefined,
                    r2Key: key,
                }),
            });
            const { url } = await metaRes.json();

            setProgress(100);
            setClipUrl(window.location.origin + url);
            setStatus('done');

        } catch (err: any) {
            console.error('Clip creation error:', err);
            setError(err.message || 'Failed to create clip');
            setStatus('error');
        }
    };

    const copyToClipboard = () => {
        if (clipUrl) {
            navigator.clipboard.writeText(clipUrl);
        }
    };

    return (
        <div className="space-y-6">
            {/* Media Preview */}
            <div className="rounded-lg overflow-hidden bg-black/50">
                {mediaType === 'video' ? (
                    <video
                        ref={mediaRef as React.RefObject<HTMLVideoElement>}
                        src={mediaUrl}
                        className="w-full aspect-video"
                        controls={false}
                    />
                ) : (
                    <div className="p-8 flex items-center justify-center">
                        <audio
                            ref={mediaRef as React.RefObject<HTMLAudioElement>}
                            src={mediaUrl}
                            controls
                            className="w-full"
                        />
                    </div>
                )}
            </div>

            {/* Timestamp Inputs */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Start Time
                    </label>
                    <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="0:00"
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg 
                                   text-white text-lg font-mono focus:outline-none focus:ring-2 
                                   focus:ring-amber-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                        End Time
                    </label>
                    <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="0:30"
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg 
                                   text-white text-lg font-mono focus:outline-none focus:ring-2 
                                   focus:ring-amber-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Duration Display */}
            {isValid && (
                <div className="text-center text-neutral-400">
                    Clip duration: <span className="text-white font-mono">{formatTimestamp(duration)}</span>
                </div>
            )}

            {/* Optional Title */}
            <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Clip Title <span className="text-neutral-500">(optional)</span>
                </label>
                <input
                    type="text"
                    value={clipTitle}
                    onChange={(e) => setClipTitle(e.target.value)}
                    placeholder="Enter a title for your clip..."
                    className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg 
                               text-white focus:outline-none focus:ring-2 focus:ring-amber-500 
                               focus:border-transparent"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handlePreview}
                    disabled={!isValid || status === 'processing' || status === 'uploading'}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 
                               bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 
                               disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    Preview
                </button>

                <button
                    onClick={handleCreateClip}
                    disabled={!isValid || status === 'processing' || status === 'uploading'}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 
                               bg-amber-600 hover:bg-amber-500 disabled:opacity-50 
                               disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
                >
                    {status === 'processing' || status === 'uploading' ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {status === 'processing' ? 'Processing...' : 'Uploading...'}
                        </>
                    ) : (
                        <>
                            <Scissors className="w-5 h-5" />
                            Create Clip
                        </>
                    )}
                </button>
            </div>

            {/* Progress Bar */}
            {(status === 'processing' || status === 'uploading') && (
                <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-amber-500 h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {/* Error Display */}
            {status === 'error' && error && (
                <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                    {error}
                </div>
            )}

            {/* Success Display */}
            {status === 'done' && clipUrl && (
                <div className="p-6 bg-green-900/30 border border-green-700 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-green-400">
                        <Check className="w-5 h-5" />
                        <span className="font-semibold">Clip created successfully!</span>
                    </div>

                    <div className="flex items-center gap-2 bg-neutral-800 rounded-lg p-3">
                        <input
                            type="text"
                            value={clipUrl}
                            readOnly
                            className="flex-1 bg-transparent text-white font-mono text-sm"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="p-2 hover:bg-neutral-700 rounded transition-colors"
                            title="Copy to clipboard"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <a
                            href={clipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-neutral-700 rounded transition-colors"
                            title="Open clip"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    </div>

                    <p className="text-sm text-neutral-400">
                        Share this link on Discord and it will play inline!
                    </p>
                </div>
            )}
        </div>
    );
}
