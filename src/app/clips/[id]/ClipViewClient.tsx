'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Pause, Copy, Check, ExternalLink, Clock, Film, Music, Scissors } from 'lucide-react';
import type { ClipMetadata } from '@/lib/clipStore';

interface ClipViewClientProps {
    clip: ClipMetadata;
    signedUrl: string;
    isVideo: boolean;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ClipViewClient({ clip, signedUrl, isVideo }: ClipViewClientProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [copied, setCopied] = useState(false);
    const [clipUrl, setClipUrl] = useState('');

    useEffect(() => {
        setClipUrl(typeof window !== 'undefined' ? window.location.href : '');
    }, []);

    const duration = clip.endSeconds - clip.startSeconds;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(clipUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Create the "Watch Full Episode" link with timestamp
    const fullEpisodeUrl = `/media/${encodeURIComponent(clip.mediaId)}?t=${clip.startSeconds}`;

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-violet-500/30">
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
                {/* Header */}
                <div className="mb-8 animate-fade-in text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-6">
                        <Scissors className="w-3 h-3" />
                        <span>Clipped Media</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold mb-6 font-serif leading-tight text-foreground">
                        {clip.title ? (
                            clip.title
                        ) : (
                            <>
                                <span className="block text-lg md:text-xl text-violet-500/80 font-sans font-medium mb-2 tracking-wide">
                                    Clip from
                                </span>
                                {clip.mediaTitle}
                            </>
                        )}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground text-sm font-mono">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatTime(duration)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="flex items-center gap-1.5 opacity-80">
                            {formatTime(clip.startSeconds)} – {formatTime(clip.endSeconds)}
                        </span>
                    </div>
                </div>

                {/* Media Player */}
                <div className="relative rounded-xl overflow-hidden bg-zinc-900 shadow-xl mb-10 ring-1 ring-border/50 group">
                    {isVideo ? (
                        <video
                            src={signedUrl}
                            controls
                            autoPlay={true}
                            className="w-full aspect-video outline-none"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                    ) : (
                        <div className="p-12 md:p-20 bg-gradient-to-b from-zinc-900 to-black flex flex-col items-center justify-center gap-6 min-h-[320px]">
                            <div className="w-20 h-20 rounded-2xl bg-violet-600/20 text-violet-500 flex items-center justify-center ring-1 ring-violet-500/20">
                                <Music className="w-8 h-8" />
                            </div>
                            <audio
                                src={signedUrl}
                                controls
                                autoPlay={true}
                                className="w-full max-w-sm mt-4 invert dark:invert-0 accent-violet-500"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            />
                        </div>
                    )}
                </div>

                {/* Actions Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                    {/* Share Button */}
                    <div className="bg-card border border-border p-5 rounded-xl transition-all hover:border-violet-500/50 hover:shadow-sm">
                        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-foreground">
                            <Copy className="w-4 h-4 text-violet-500" />
                            Share Link
                        </h2>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-muted px-3 py-2 rounded-lg text-xs font-mono text-muted-foreground truncate border border-transparent select-all">
                                {clipUrl}
                            </div>
                            <button
                                onClick={handleCopy}
                                className="flex-shrink-0 p-2 bg-foreground text-background rounded-lg hover:opacity-90 transition-opacity"
                                title="Copy to clipboard"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 text-center sm:text-left opacity-70">
                            Plays inline on Discord & Twitter
                        </p>
                    </div>

                    {/* Context Button */}
                    <Link
                        href={fullEpisodeUrl}
                        className="bg-card border border-border p-5 rounded-xl transition-all hover:border-violet-500/50 hover:shadow-sm flex flex-col justify-between group"
                    >
                        <h2 className="text-sm font-semibold mb-1 flex items-center gap-2 text-foreground">
                            <ExternalLink className="w-4 h-4 text-violet-500" />
                            Open Context
                        </h2>
                        <div className="mt-2 text-xs text-muted-foreground">
                            Continue watching from <span className="font-mono text-violet-600 dark:text-violet-400">{formatTime(clip.startSeconds)}</span>
                        </div>
                        <div className="mt-3 text-xs font-medium text-foreground group-hover:underline decoration-violet-500/30 underline-offset-4">
                            View full episode &rarr;
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
