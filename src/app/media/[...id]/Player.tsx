'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Search, Copy, Check, X, LayoutTemplate, AlignLeft,
    ArrowLeft, ArrowRight, Download
} from 'lucide-react';
import { getPublicAssetUrl } from '@/lib/mediaAssets';

import dynamic from 'next/dynamic';
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

/* ==================== TYPES ==================== */

interface Segment {
    id: number;
    start_time: number;
    end_time: number;
    speaker: string;
    content: string;
    segment_index?: number;
}

interface Media {
    id: string;
    type: string;
    title: string;
    displayTitle: string;
    displayDate: string;
    author: string;
    local_filename?: string;
    thumbnailOverride?: string;
    folder?: string;
    audioFile?: string;
    videoFile?: string;
    vttFile?: string;
    duration_seconds?: number;
    primaryNumber?: number;
    alternateNumbers?: string[];
    alternateNumberLabel?: string;
}

export interface PlayerProps {
    media: Media;
    segments: Segment[];
    segments_ar?: Segment[];
    mediaUrl: string;
    prev?: { id: string; title: string };
    next?: { id: string; title: string };
    clipStartTime?: number;
    clipEndTime?: number;
    initialSeekTime?: number;
    transcriptDisclaimer?: string;
}

/* ==================== UTILITIES ==================== */

const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
};

function getThumbnail(media: Media): string {
    if (media.thumbnailOverride && !media.thumbnailOverride.includes('default.jpg')) {
        return getPublicAssetUrl(media.thumbnailOverride);
    }
    let src = '/images/placeholders/rashad-khalifa.png';
    if (media.type === 'messenger-audio') src = '/content/audios/messenger-audios/default.jpg';
    return getPublicAssetUrl(src);
}

/* ==================== MAIN COMPONENT ==================== */

export default function Player({
    media,
    segments,
    segments_ar,
    mediaUrl,
    prev,
    next,
    clipStartTime,
    clipEndTime,
    initialSeekTime,
    transcriptDisclaimer
}: PlayerProps) {

    const [captionLanguage, setCaptionLanguage] = useState<'en' | 'ar'>('en');
    const activeSegments = captionLanguage === 'ar' && segments_ar && segments_ar.length > 0 ? segments_ar : segments;

    // Absolute time (unclipped) for transcript syncing
    const [absoluteTime, setAbsoluteTime] = useState(initialSeekTime ?? 0);
    const hasSeekedToInitialTime = useRef(false);

    // UI State
    const [viewMode, setViewMode] = useState<'transcript' | 'theater'>('transcript');
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [autoScroll, setAutoScroll] = useState(true);
    const [isPlaying, setIsPlaying] = useState(Boolean(initialSeekTime));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const playerRef = useRef<any>(null);

    const activeSegmentIndex = useMemo(() => {
        if (activeSegments.length === 0) return -1;
        for (let i = 0; i < activeSegments.length; i++) {
            if (absoluteTime >= activeSegments[i].start_time && absoluteTime < activeSegments[i].end_time) {
                return i;
            }
        }
        return -1;
    }, [absoluteTime, activeSegments]);
    const [fontSize, setFontSize] = useState<number>(1);
    const fontSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl'];

    const isVideo = media.type === 'sermon' || media.type === 'video-program';
    const thumbnail = getThumbnail(media);

    // Sanitize clip times
    const effectiveClipStartTime = Number.isFinite(clipStartTime) && clipStartTime! > 0 ? clipStartTime : undefined;
    const effectiveClipEndTime = Number.isFinite(clipEndTime) && clipEndTime! > (effectiveClipStartTime || 0) ? clipEndTime : undefined;
    const effectiveInitialSeekTime = Number.isFinite(initialSeekTime) && initialSeekTime! > 0 ? initialSeekTime : undefined;

    const filteredSegments = useMemo(() => {
        if (!searchQuery) return activeSegments;
        const q = searchQuery.toLowerCase();
        return activeSegments.filter(s => s.content.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q));
    }, [activeSegments, searchQuery]);



    useEffect(() => {
        if (!autoScroll || activeSegmentIndex === -1 || searchQuery) return;
        const el = document.getElementById(`seg-${activeSegments[activeSegmentIndex].segment_index ?? activeSegmentIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeSegmentIndex, autoScroll, searchQuery, activeSegments]);

    const handleSegmentClick = (startTime: number) => {
        if (playerRef.current) {
            playerRef.current.seekTo(startTime, 'seconds');
            setIsPlaying(true);
        }
    };

    const handleCopy = async (e: React.MouseEvent, text: string, id: number) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const exportTranscript = () => {
        const text = activeSegments.map(s => `[${formatDuration(s.start_time)}] ${s.speaker}: ${s.content}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${media.displayTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const activeSegment = activeSegmentIndex >= 0 ? activeSegments[activeSegmentIndex] : null;



    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body pb-20">
            <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-10">

                {/* View Mode Toggle */}
                <div className="mb-6 flex justify-end gap-4">
                    {segments_ar && segments_ar.length > 0 && (
                        <div className="inline-flex rounded-lg border border-ed-rule bg-ed-surface p-1">
                            <button
                                type="button"
                                onClick={() => setCaptionLanguage('en')}
                                aria-pressed={captionLanguage === 'en'}
                                className={`flex min-h-11 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${captionLanguage === 'en' ? 'bg-ed-bg text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => setCaptionLanguage('ar')}
                                aria-pressed={captionLanguage === 'ar'}
                                className={`flex min-h-11 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${captionLanguage === 'ar' ? 'bg-ed-bg text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                            >
                                Arabic
                            </button>
                        </div>
                    )}
                    <div className="inline-flex rounded-lg border border-ed-rule bg-ed-surface p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode('transcript')}
                            aria-pressed={viewMode === 'transcript'}
                            className={`flex min-h-11 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${viewMode === 'transcript' ? 'bg-ed-bg text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                        >
                            <AlignLeft className="w-4 h-4" />
                            Transcript
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('theater')}
                            aria-pressed={viewMode === 'theater'}
                            className={`flex min-h-11 items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${viewMode === 'theater' ? 'bg-ed-bg text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Theater
                        </button>
                    </div>
                </div>

                <div className={`grid gap-8 transition-all duration-500 ease-in-out ${viewMode === 'transcript' ? 'lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px]' : 'grid-cols-1 max-w-5xl mx-auto'}`}>

                    {/* MEDIA & TITLE COLUMN */}
                    <div className="space-y-6">

                        {/* CUSTOM MEDIA PLAYER CONTAINER */}
                        <div className={`relative overflow-hidden rounded-xl border border-ed-rule bg-[#0f0f0f] p-2 group ${isVideo ? 'aspect-video' : 'h-80'}`}>
                            <div className="w-full h-full relative z-10 rounded-xl overflow-hidden">
                                <ReactPlayer
                                    ref={playerRef}
                                    url={mediaUrl}
                                    controls={true}
                                    width="100%"
                                    height="100%"
                                    playsinline={true}
                                    playing={isPlaying}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                    onProgress={(state: { playedSeconds: number }) => setAbsoluteTime(state.playedSeconds)}
                                    onReady={() => {
                                        if (effectiveInitialSeekTime !== undefined && !hasSeekedToInitialTime.current) {
                                            hasSeekedToInitialTime.current = true;
                                            playerRef.current?.seekTo(effectiveInitialSeekTime, 'seconds');
                                        }
                                    }}
                                    config={{
                                        youtube: {
                                            playerVars: {
                                                start: effectiveInitialSeekTime
                                                    ? Math.floor(effectiveInitialSeekTime)
                                                    : (effectiveClipStartTime ? Math.floor(effectiveClipStartTime) : undefined),
                                                end: effectiveClipEndTime ? Math.floor(effectiveClipEndTime) : undefined,
                                                modestbranding: 1
                                            }
                                        } as Record<string, unknown>
                                    }}
                                />
                            </div>

                            {!isVideo && (
                                <div className="absolute inset-0 flex items-center justify-center bg-ed-surface z-0 pointer-events-none">
                                    <div className="relative h-48 w-48 overflow-hidden rounded-2xl shadow-2xl">
                                        <Image src={thumbnail} alt={media.displayTitle} fill sizes="192px" priority className="object-cover" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Title and Metadata */}
                        <div className="flex flex-col gap-3 px-2">
                            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-ed-fg">
                                {media.displayTitle}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-ui uppercase tracking-[0.15em] text-ed-fg-muted">
                                <span className="text-ed-accent font-semibold">{media.author}</span>
                                <span className="w-1 h-1 bg-ed-rule rounded-full" />
                                <span>{media.displayDate || 'Archival Record'}</span>
                                {effectiveClipStartTime !== undefined && (
                                    <>
                                        <span className="w-1 h-1 bg-ed-rule rounded-full" />
                                        <span className="text-red-400">Clipped Selection</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Navigation and Actions */}
                        <div className="flex items-center gap-3 px-2">
                            {prev && (
                                <Link href={`/media/${encodeURIComponent(prev.id)}`} className="soft-pill flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">
                                    <ArrowLeft className="w-4 h-4" /> Prev
                                </Link>
                            )}
                            {next && (
                                <Link href={`/media/${encodeURIComponent(next.id)}`} className="soft-pill flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">
                                    Next <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                                <button type="button" onClick={exportTranscript} aria-label="Download transcript" className="soft-pill flex min-h-11 min-w-11 items-center justify-center p-2.5 text-ed-fg-muted transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent" title="Download Transcript">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* THEATER MODE FEED */}
                        {viewMode === 'theater' && (
                            <div className="player-fade-up soft-shell mt-8 overflow-hidden">
                                <div className="flex items-center justify-between border-b border-ed-rule px-6 py-3">
                                    <span className="text-[10px] font-bold font-ui uppercase tracking-[0.2em] text-ed-fg-muted">Synchronized Feed</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold font-ui uppercase tracking-widest text-ed-fg-muted">
                                            Active Transcript
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 md:p-16 flex items-center justify-center min-h-[300px] bg-gradient-to-b from-ed-surface/5 to-transparent">
                                    {activeSegment ? (
                                        <p
                                            key={activeSegment.content}
                                            className="player-caption-rise text-2xl md:text-3xl text-center leading-relaxed font-body text-ed-fg"
                                        >
                                            {activeSegment.content}
                                        </p>
                                    ) : (
                                        <p
                                            key="no-caption"
                                            className="text-ed-fg-muted/50 text-xl text-center font-ui uppercase tracking-widest"
                                        >
                                            Waiting for signal...
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>

                    {/* TRANSCRIPT COLUMN */}
                    {viewMode === 'transcript' && (
                            <div
                                className="player-fade-in soft-shell flex h-[min(70vh,560px)] min-h-[320px] flex-col overflow-hidden lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)]"
                            >
                                {/* Header */}
                                <div className="border-b border-ed-rule p-5 space-y-4">
                                    {transcriptDisclaimer ? (
                                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                                            {transcriptDisclaimer}
                                        </div>
                                    ) : null}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <h2 className="text-sm font-bold font-ui uppercase tracking-[0.1em] text-ed-fg">Interactive Record</h2>
                                            <span className="text-xs text-ed-fg-muted">Select any line to seek</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 mr-2">
                                                <button type="button" onClick={() => setFontSize(Math.max(0, fontSize - 1))} aria-label="Decrease text size" className="flex h-11 w-11 items-center justify-center rounded-lg border border-ed-rule text-sm font-semibold text-ed-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">A−</button>
                                                <button type="button" onClick={() => setFontSize(Math.min(3, fontSize + 1))} aria-label="Increase text size" className="flex h-11 w-11 items-center justify-center rounded-lg border border-ed-rule text-sm font-semibold text-ed-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent">A+</button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAutoScroll(!autoScroll)}
                                                aria-pressed={autoScroll}
                                                className={`inline-flex min-h-11 items-center rounded-lg border border-ed-rule px-3 py-1.5 text-xs font-semibold font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${autoScroll ? 'bg-ed-accent/10 text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                                            >
                                                Auto-Scroll {autoScroll ? 'On' : 'Off'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ed-fg-muted group-focus-within:text-ed-accent transition-colors" />
                                        <label htmlFor="transcript-search-input" className="sr-only">
                                            Search transcript
                                        </label>
                                        <input
                                            id="transcript-search-input"
                                            name="transcriptSearch"
                                            type="text"
                                            placeholder="Search transcript..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="archive-input w-full py-2.5 pl-10 pr-12 text-sm font-ui"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery('')}
                                                aria-label="Clear search"
                                                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-ed-fg-muted hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Segments List */}
                                <div className="flex-1 min-h-0 overflow-y-auto bg-ed-bg/35 p-4 scroll-smooth">
                                    {filteredSegments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-ed-fg-muted gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p className="text-sm font-ui text-center">No matches found for<br />&quot;{searchQuery}&quot;</p>
                                        </div>
                                    ) : (
                                        <ol aria-label="Transcript" className="space-y-2">
                                            {filteredSegments.map((seg, i) => {
                                                const isActive = seg === activeSegment;
                                                return (
                                                    <li
                                                        key={seg.id ?? i}
                                                        id={`seg-${seg.segment_index ?? i}`}
                                                        aria-current={isActive ? 'true' : undefined}
                                                        className={`group relative rounded-[1.2rem] transition-all duration-200
                                                            ${isActive
                                                                ? 'soft-panel text-ed-fg'
                                                                : 'hover:bg-ed-surface/30'
                                                            }`}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSegmentClick(seg.start_time)}
                                                            className="w-full cursor-pointer rounded-[1.2rem] p-4 pl-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                                        >
                                                            <span className="sr-only">Play from {formatDuration(seg.start_time)}. </span>
                                                            <span className="mb-1.5 flex items-start justify-between">
                                                                {seg.speaker ? (
                                                                    <span className={`text-[10px] font-bold font-ui tracking-widest uppercase ${isActive ? 'text-ed-accent' : 'text-ed-fg-muted'}`}>
                                                                        {seg.speaker}
                                                                    </span>
                                                                ) : <span />}
                                                            </span>
                                                            <span className={`block ${fontSizes[fontSize]} leading-relaxed font-body ${isActive ? 'text-ed-fg' : 'text-ed-fg/80'}`}>
                                                                {seg.content}
                                                            </span>
                                                        </button>
                                                        <div className="absolute right-4 top-2.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleCopy(e, seg.content, seg.id ?? i)}
                                                                aria-label={copiedId === (seg.id ?? i) ? 'Copied' : 'Copy quote'}
                                                                className="-my-2 -mx-2 flex h-11 w-11 items-center justify-center text-ed-fg-muted hover:text-ed-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                                                title="Copy quote"
                                                            >
                                                                {copiedId === (seg.id ?? i) ? <Check className="w-3.5 h-3.5 text-ed-accent" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <span className="text-[10px] font-mono text-ed-fg-muted tabular-nums">
                                                                {formatDuration(seg.start_time)}
                                                            </span>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    )}
                                </div>
                            </div>
                        )}
                </div>
            </main>
        </div>
    );
}
