'use client';

import { useState, useEffect, useRef } from 'react';
import { Scissors, Loader2, Check, Copy, ExternalLink, X, Play, Square, AlertCircle } from 'lucide-react';

interface ClipModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaId: string;
    mediaTitle: string;
    mediaUrl: string;
    mediaType: 'audio' | 'video';
    currentTime: number;
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

// Parse timestamp string to seconds
function parseTimestamp(ts: string): number | null {
    const parts = ts.split(':').map(p => parseInt(p, 10));
    if (parts.some(isNaN)) return null;

    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
}

export default function ClipModal({
    isOpen,
    onClose,
    mediaId,
    mediaTitle,
    mediaUrl,
    mediaType,
    currentTime,
}: ClipModalProps) {
    // Form state - timestamp range
    const [startTime, setStartTime] = useState(formatTimestamp(Math.max(0, currentTime - 15)));
    const [endTime, setEndTime] = useState(formatTimestamp(currentTime + 15));
    const [clipTitle, setClipTitle] = useState('');
    const [copied, setCopied] = useState(false);

    // Processing state
    const [status, setStatus] = useState<'idle' | 'processing' | 'uploading' | 'done' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [clipUrl, setClipUrl] = useState<string | null>(null);

    // Check for browser support and determine mode
    const [isClientSideSupported, setIsClientSideSupported] = useState(true);

    useEffect(() => {
        const supported = typeof document !== 'undefined' &&
            (('captureStream' in HTMLMediaElement.prototype) ||
                ('mozCaptureStream' in HTMLMediaElement.prototype));
        setIsClientSideSupported(supported);
    }, []);

    // Hidden media element for recording
    const hiddenMediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Reset when modal opens
    useEffect(() => {
        if (isOpen) {
            setStartTime(formatTimestamp(Math.max(0, currentTime - 15)));
            setEndTime(formatTimestamp(currentTime + 15));
            setClipTitle('');
            setStatus('idle');
            setProgress(0);
            setError(null);
            setClipUrl(null);
            setCopied(false);
        }
    }, [isOpen, currentTime]);

    // Validation
    const startSeconds = parseTimestamp(startTime);
    const endSeconds = parseTimestamp(endTime);
    const isValid = startSeconds !== null && endSeconds !== null && startSeconds < endSeconds;
    const duration = isValid ? endSeconds - startSeconds : 0;

    // Create clip handler
    const handleCreateClip = async () => {
        if (!isValid || startSeconds === null || endSeconds === null) return;

        setStatus('processing');
        setProgress(0);
        setError(null);

        // STRATEGY: Client-side (Desktop) vs Server-side (Mobile)
        if (isClientSideSupported) {
            await createClipClientSide();
        } else {
            await createClipServerSide();
        }
    };

    // SERVER-SIDE PROCESSING (Mobile/Fallback)
    const createClipServerSide = async () => {
        try {
            // Fake progress since we can't track real server progress easily yet
            const progressInterval = setInterval(() => {
                setProgress(p => Math.min(90, p + 5));
            }, 1000);

            const res = await fetch('/api/clips/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mediaUrl, // We send the original URL
                    startTime: startSeconds,
                    endTime: endSeconds,
                    title: clipTitle
                })
            });

            clearInterval(progressInterval);

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Server processing failed');
            }

            const { key } = await res.json();

            // Metadata Save Step
            await saveClipMetadata(key);

        } catch (err: any) {
            console.error('Server clip error:', err);
            setError(err.message || 'Failed to create clip on server');
            setStatus('error');
        }
    };

    // CLIENT-SIDE PROCESSING (Desktop)
    const createClipClientSide = async () => {
        chunksRef.current = [];

        try {
            setProgress(5);

            // Create hidden media element
            const element = document.createElement(mediaType === 'video' ? 'video' : 'audio') as HTMLVideoElement;
            // Use proxy to avoid CORS issues
            element.src = `/api/proxy-media?url=${encodeURIComponent(mediaUrl)}`;
            element.crossOrigin = 'anonymous';
            element.preload = 'auto';
            hiddenMediaRef.current = element;

            // Wait for metadata to load
            await new Promise<void>((resolve, reject) => {
                element.onloadedmetadata = () => resolve();
                element.onerror = () => reject(new Error('Failed to load media'));
                setTimeout(() => reject(new Error('Media load timeout')), 30000);
            });

            setProgress(15);

            // Seek to start time
            element.currentTime = startSeconds!;
            await new Promise<void>((resolve) => {
                element.onseeked = () => resolve();
            });

            setProgress(25);

            // Get media stream from the element
            let stream: MediaStream;
            const mediaElement = element as any;

            if (mediaElement.captureStream) {
                stream = mediaElement.captureStream();
            } else if (mediaElement.mozCaptureStream) {
                stream = mediaElement.mozCaptureStream();
            } else {
                throw new Error('Capture stream not supported');
            }

            // Determine MIME type
            const mimeType = mediaType === 'video'
                ? (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm')
                : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm');

            // Create MediaRecorder
            const recorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            // Set up completion handler
            const recordingComplete = new Promise<Blob>((resolve) => {
                recorder.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: mimeType });
                    resolve(blob);
                };
            });

            // Start recording
            recorder.start(100);
            element.play();

            // Monitor playback and stop at end time
            const clipDuration = endSeconds! - startSeconds!;
            let progressInterval = setInterval(() => {
                const elapsed = element.currentTime - startSeconds!;
                const pct = Math.min(90, 25 + (elapsed / clipDuration) * 65);
                setProgress(pct);
            }, 200);

            // Wait for clip duration then stop
            await new Promise<void>((resolve) => {
                const checkTime = () => {
                    if (element.currentTime >= endSeconds!) {
                        resolve();
                    } else {
                        requestAnimationFrame(checkTime);
                    }
                };
                checkTime();
                setTimeout(resolve, (clipDuration + 1) * 1000);
            });

            clearInterval(progressInterval);
            recorder.stop();
            element.pause();

            setProgress(90);

            // Get recorded blob
            const blob = await recordingComplete;

            // Upload via proxy to avoid CORS
            setStatus('uploading');

            const signRes = await fetch('/api/clips/sign-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileType: mediaType }),
            });
            const { key } = await signRes.json();

            const formData = new FormData();
            formData.append('file', blob);
            formData.append('key', key);
            formData.append('contentType', mimeType.includes('video') ? 'video/webm' : 'audio/webm');

            await fetch('/api/clips/upload-proxy', {
                method: 'POST',
                body: formData,
            });

            setProgress(95);

            // Metadata Save
            await saveClipMetadata(key);

        } catch (err: any) {
            console.error('Client clip error:', err);
            setError(err.message || 'Failed to create clip');
            setStatus('error');
        }
    };

    // Shared Metadata Save
    const saveClipMetadata = async (key: string) => {
        const metaRes = await fetch('/api/clips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mediaId,
                mediaTitle,
                startSeconds,
                endSeconds,
                title: clipTitle || undefined,
                r2Key: key,
            }),
        });
        const { url } = await metaRes.json();

        setProgress(100);
        setClipUrl(window.location.origin + url);
        setStatus('done');
    }

    const copyToClipboard = async () => {
        if (clipUrl) {
            await navigator.clipboard.writeText(clipUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-card rounded-xl p-6 max-w-lg w-full border border-border shadow-2xl animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                        <Scissors className="w-5 h-5 text-emerald-500" />
                        Create Clip
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Content - No longer checking isSupported to block UI */}
                {status === 'done' && clipUrl ? (
                    /* Success State */
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg">
                            <div className="flex items-center gap-2 text-emerald-400 mb-3">
                                <Check className="w-5 h-5" />
                                <span className="font-semibold">Clip created!</span>
                            </div>

                            <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                                <input
                                    type="text"
                                    value={clipUrl}
                                    readOnly
                                    className="flex-1 bg-transparent text-foreground font-mono text-sm truncate"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-border rounded transition-colors text-muted-foreground hover:text-foreground"
                                    title="Copy"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <a
                                    href={clipUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-border rounded transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>

                            <p className="text-sm text-muted-foreground mt-3">
                                Share this link on Discord for inline playback!
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-muted hover:bg-border rounded-lg transition-colors text-foreground"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    /* Input State */
                    <div className="space-y-4">
                        {/* Mobile Warning/Info Badge */}
                        {!isClientSideSupported && (
                            <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg text-xs text-blue-200 flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>Using Cloud Processing (Mobile Mode)</span>
                            </div>
                        )}

                        {/* ... existing form content ... */}
                        <p className="text-sm text-muted-foreground">
                            From: <span className="text-foreground">{mediaTitle}</span>
                        </p>

                        {/* Timestamp Range Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="text"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    placeholder="0:00"
                                    disabled={status !== 'idle'}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg 
                                               text-foreground text-lg font-mono focus:outline-none focus:ring-2 
                                               focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    End Time
                                </label>
                                <input
                                    type="text"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    placeholder="0:30"
                                    disabled={status !== 'idle'}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg 
                                               text-foreground text-lg font-mono focus:outline-none focus:ring-2 
                                               focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Duration */}
                        {isValid && (
                            <div className="text-center text-muted-foreground text-sm">
                                Duration: <span className="text-emerald-400 font-mono">{formatTimestamp(duration)}</span>
                            </div>
                        )}

                        {/* Optional Title */}
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                                Title <span className="text-muted-foreground/50">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={clipTitle}
                                onChange={(e) => setClipTitle(e.target.value)}
                                placeholder="Give your clip a name..."
                                disabled={status !== 'idle'}
                                className="w-full px-4 py-3 bg-muted border border-border rounded-lg 
                                           text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 
                                           focus:border-transparent disabled:opacity-50"
                            />
                        </div>

                        {/* Progress Bar */}
                        {(status === 'processing' || status === 'uploading') && (
                            <div className="space-y-2">
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <p className="text-sm text-muted-foreground text-center animate-pulse">
                                    {status === 'processing'
                                        ? (isClientSideSupported ? 'Recording clip locally...' : 'Processing on server (this may take a moment)...')
                                        : 'Finalizing upload...'}
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {status === 'error' && error && (
                            <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Create Button */}
                        <button
                            onClick={handleCreateClip}
                            disabled={!isValid || status === 'processing' || status === 'uploading'}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 
                                       bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 
                                       disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-white"
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

                        {/* Help Text */}
                        {status === 'idle' && (
                            <p className="text-xs text-muted-foreground text-center">
                                Enter timestamps in MM:SS or H:MM:SS format
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
