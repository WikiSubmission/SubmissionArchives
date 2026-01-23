'use client';

import { useState } from 'react';
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

    const duration = clip.endSeconds - clip.startSeconds;
    const clipUrl = typeof window !== 'undefined' ? window.location.href : '';

    const handleCopy = async () => {
        await navigator.clipboard.writeText(clipUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Create the "Watch Full Episode" link with timestamp
    const fullEpisodeUrl = `/media/${encodeURIComponent(clip.mediaId)}?t=${clip.startSeconds}`;

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-16">
                {/* Header */}
                <div className="mb-8 animate-fade-in">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 text-sm font-medium mb-3 uppercase tracking-wider font-mono">
                        <Scissors className="w-4 h-4" />
                        <span>Clip</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4 font-serif leading-tight text-foreground">
                        {clip.title || `Clip from ${clip.mediaTitle}`}
                    </h1>
                    <div className="flex items-center gap-6 text-muted-foreground text-sm font-mono border-l-2 border-emerald-500/50 pl-4">
                        <span className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatTime(duration)}
                        </span>
                        <span className="flex items-center gap-2">
                            Range: {formatTime(clip.startSeconds)} – {formatTime(clip.endSeconds)}
                        </span>
                    </div>
                </div>

                {/* Media Player */}
                <div className="rounded-2xl overflow-hidden bg-black shadow-2xl mb-8 border border-border/50 ring-1 ring-white/10">
                    {isVideo ? (
                        <video
                            src={signedUrl}
                            controls
                            autoPlay={true}
                            className="w-full aspect-video"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                        />
                    ) : (
                        <div className="p-10 md:p-16 bg-gradient-to-br from-emerald-950/50 to-background flex flex-col items-center justify-center gap-8 min-h-[300px]">
                            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse-slow">
                                <Music className="w-10 h-10 text-emerald-500" />
                            </div>
                            <audio
                                src={signedUrl}
                                controls
                                autoPlay={true}
                                className="w-full max-w-lg"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            />
                        </div>
                    )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Share Section */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Copy className="w-5 h-5 text-emerald-500" />
                            Share this clip
                        </h2>
                        <div className="flex items-center gap-2 bg-muted rounded-lg p-2 border border-border">
                            <input
                                type="text"
                                value={clipUrl}
                                readOnly
                                className="flex-1 bg-transparent text-muted-foreground font-mono text-sm px-2 py-1 outline-none w-full min-w-0"
                            />
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white
                                           rounded-md transition-all whitespace-nowrap font-medium text-sm shadow-sm active:scale-95"
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4" />
                                        Copy
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 pl-1">
                            Paste this link in Discord and the clip will play inline!
                        </p>
                    </div>

                    {/* Context Link */}
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                        <div>
                            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                <ExternalLink className="w-5 h-5 text-emerald-500" />
                                Context
                            </h2>
                            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                                From: <span className="font-medium text-foreground">{clip.mediaTitle}</span>
                            </p>
                        </div>
                        <Link
                            href={fullEpisodeUrl}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground
                                       rounded-lg transition-colors font-medium text-sm group w-full"
                        >
                            Watch Full Episode
                            <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
