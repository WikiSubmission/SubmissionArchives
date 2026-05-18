'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search, Clock, Copy, Check, X, LayoutTemplate, AlignLeft,
  Play, Pause, Volume2, VolumeX, ArrowLeft, ArrowRight,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import thumbnailMapping from '@/data/thumbnail_mapping.json';
import quranStudyThumbnails from '@/data/quran_study_thumbnails.json';
import { getPublicAssetUrl } from '@/lib/mediaAssets';

// Vidstack Core Imports & Primitives
import '@vidstack/react/player/styles/base.css';
import {
    MediaPlayer,
    MediaProvider,
    Poster,
    PlayButton,
    TimeSlider,
    MuteButton,
    VolumeSlider,
    Time,
    useMediaState
} from '@vidstack/react';
import type { MediaPlayerInstance } from '@vidstack/react';

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

interface PlayerProps {
  media: Media;
  segments: Segment[];
  mediaUrl: string;
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
  initialTime?: number;
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

function getMediaTime(detail: unknown) {
    if (typeof detail === 'object' && detail !== null && 'currentTime' in detail) {
        const currentTime = (detail as { currentTime?: unknown }).currentTime;
        return typeof currentTime === 'number' ? currentTime : 0;
    }
    return 0;
}

function getMediaDuration(detail: unknown) {
    return typeof detail === 'number' ? detail : 0;
}

function getThumbnail(media: Media): string {
  // Use override if it exists and isn't a placeholder
  if (media.thumbnailOverride && !media.thumbnailOverride.includes('default.jpg')) {
    return getPublicAssetUrl(media.thumbnailOverride);
  }

  let src = '/images/placeholders/rashad-khalifa.png';
  const { displayTitle, id, folder, type } = media;

  if (type === 'sermon' || type === 'video-program') {
    const mapped = (thumbnailMapping as Record<string, string>)[id];
    if (mapped) {
      src = type === 'sermon' ? `/images/sermons/${mapped}.jpg` : `/images/video-programs/${mapped}.jpg`;
    } else {
      const cleanId = (folder || id)
        .replace(/^media\/(FRIDAY SERMONS|VIDEO PROGRAMS|disorganized_sermons|rk_video_programs)\//, '')
        .replace(/^(video-program|sermon|audio|messenger-audio)\//, '')
        .replace(/\s+/g, '_')
        .replace(/[^\w\-_.]/g, '')
        .replace(/\.mp4$/, '');

      src = type === 'sermon' ? `/images/sermons/${cleanId}.jpg` : `/images/video-programs/${cleanId}.jpg`;
    }
  } else if (type === 'audio' || type === 'messenger-audio') {
    src = getPublicAssetUrl('/content/audio/messenger-audios/default.jpg');
  }

  if (type === 'quran-study') {
    const match = displayTitle.match(/^(\d+)\)/) || id.match(/quran-study-v2\/(\d+)/) || id.match(/quran-study\/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      src = (quranStudyThumbnails as Record<string, string>)[String(num)] || src;
    }
  }

  return src.startsWith('/content/') ? getPublicAssetUrl(src) : src;
}

// Extracted Volume Icon component for the MuteButton
const VolumeIcon = () => {
    const isMuted = useMediaState('muted');
    const volume = useMediaState('volume');
    if (isMuted || volume === 0) return <VolumeX className="w-5 h-5" />;
    return <Volume2 className="w-5 h-5" />;
};

// Extracted Play Icon component for the PlayButton
const PlayIcon = () => {
    const isPlaying = useMediaState('playing');
    return isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />;
};

/* ==================== MAIN COMPONENT ==================== */

export default function Player({
    media,
    segments,
    mediaUrl,
    prev,
    next,
    initialTime = 0
}: PlayerProps) {
    const playerRef = useRef<MediaPlayerInstance>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'transcript' | 'theater'>(
        media.type === 'sermon' || media.type === 'video-program' ? 'transcript' : 'theater'
    );
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [fontSize, setFontSize] = useState(1);
    const fontSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl'];

    const activeSegmentIndex = useMemo(() =>
        segments.findIndex(s => currentTime >= s.start_time && currentTime < s.end_time),
        [currentTime, segments]
    );

    const activeCaption = activeSegmentIndex !== -1 ? segments[activeSegmentIndex] : null;

    /* ---- Initial seek ---- */
    useEffect(() => {
        const urlInitialTime = Number(new URLSearchParams(window.location.search).get('t') || initialTime);
        if (!Number.isFinite(urlInitialTime) || urlInitialTime <= 0 || !playerRef.current) return;
        const player = playerRef.current;
        const go = () => {
            player.currentTime = urlInitialTime;
        };
        const t = setTimeout(go, 800); // Slightly longer for stability
        return () => clearTimeout(t);
    }, [initialTime]);

    /* ---- Auto-scroll transcript ---- */
    useEffect(() => {
        if (!autoScroll || activeSegmentIndex === -1) return;
        const el = document.getElementById(`seg-${activeSegmentIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeSegmentIndex, autoScroll]);

    const handleSegmentClick = (start: number) => {
        if (!playerRef.current) return;
        playerRef.current.currentTime = start;
        if (playerRef.current.state.canPlay) {
            playerRef.current.play();
        }
    };

    const handleCopy = (e: React.MouseEvent, content: string, id: number) => {
        e.stopPropagation();
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const exportTranscript = useCallback(() => {
        const text = segments.map(s => `[${formatDuration(s.start_time)}] ${s.speaker}: ${s.content}`).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${media.displayTitle}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, [segments, media.displayTitle]);

    const filteredSegments = segments.filter(s =>
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isVideo = media.type === 'sermon' || media.type === 'video-program';
    const thumbnail = getThumbnail(media);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">

            <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">

                {/* View Toggles */}
                <div className="flex justify-center mb-8">
                    <div className="soft-pill flex p-1 backdrop-blur-md">
                        <button
                            onClick={() => setViewMode('transcript')}
                            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold font-ui uppercase tracking-widest transition-all duration-300 ${viewMode === 'transcript' ? 'bg-ed-accent/10 text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                        >
                            <AlignLeft className="w-4 h-4" />
                            Transcript
                        </button>
                        <button
                            onClick={() => setViewMode('theater')}
                            className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold font-ui uppercase tracking-widest transition-all duration-300 ${viewMode === 'theater' ? 'bg-ed-accent/10 text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
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
                        <div className={`soft-shell relative overflow-hidden bg-[#0f0f0f] p-2 group ${isVideo ? 'aspect-video' : 'h-80'}`}>
                            <MediaPlayer
                                ref={playerRef}
                                title={media.displayTitle}
                                src={mediaUrl}
                                onTimeUpdate={(detail) => setCurrentTime(getMediaTime(detail))}
                                onDurationChange={(detail) => setDuration(getMediaDuration(detail))}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="w-full h-full"
                                playsInline
                            >
                                <MediaProvider />

                                {!isVideo ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-ed-surface z-0">
                                        <div className="relative h-48 w-48 overflow-hidden rounded-2xl shadow-2xl">
                                            <Image
                                                src={thumbnail}
                                                alt={media.displayTitle}
                                                fill
                                                quality={60}
                                                sizes="192px"
                                                className="object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = '/images/placeholders/rashad-khalifa.png';
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <Poster
                                        className={`vds-poster absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                        src={thumbnail}
                                        alt={media.displayTitle}
                                    />
                                )}

                                {/* CUSTOM FLOATING CONTROLS */}
                                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    <div className="soft-pill flex items-center gap-4 px-4 py-3 backdrop-blur-xl">

                                        {/* Play/Pause Button */}
                                        <PlayButton className="soft-pill flex h-10 w-10 flex-shrink-0 cursor-pointer items-center justify-center text-ed-fg transition-colors hover:text-ed-accent">
                                            <PlayIcon />
                                        </PlayButton>

                                        {/* Current Time */}
                                        <Time type="current" className="text-[11px] font-ui text-ed-fg font-medium tracking-wider w-12 text-center tabular-nums" />

                                        {/* Progress Bar */}
                                        <TimeSlider.Root className="flex-1 h-2 group/slider cursor-pointer relative flex items-center">
                                            <TimeSlider.Track className="w-full h-1.5 bg-ed-rule/60 rounded-full overflow-hidden">
                                                <TimeSlider.TrackFill className="bg-ed-accent h-full w-[var(--slider-fill)] rounded-full transition-all duration-75" />
                                            </TimeSlider.Track>
                                            <TimeSlider.Thumb className="w-3.5 h-3.5 bg-white rounded-full absolute left-[var(--slider-fill)] -translate-x-1/2 opacity-0 group-hover/slider:opacity-100 transition-opacity shadow-md border border-gray-200" />
                                        </TimeSlider.Root>

                                        {/* Duration */}
                                        <Time type="duration" className="text-[11px] font-ui text-ed-fg-muted font-medium tracking-wider w-12 text-center tabular-nums" />

                                        {/* Volume Control Group */}
                                        <div className="flex items-center gap-2 group/volume relative">
                                            <MuteButton className="text-ed-fg hover:text-ed-accent transition-colors w-8 h-8 flex items-center justify-center cursor-pointer">
                                                <VolumeIcon />
                                            </MuteButton>
                                            {/* Expandable slider */}
                                            <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-300 ease-out origin-left">
                                                <VolumeSlider.Root className="h-2 flex items-center cursor-pointer relative mr-2">
                                                    <VolumeSlider.Track className="w-full h-1.5 bg-ed-rule/60 rounded-full overflow-hidden">
                                                        <VolumeSlider.TrackFill className="bg-ed-fg h-full w-[var(--slider-fill)] rounded-full" />
                                                    </VolumeSlider.Track>
                                                    <VolumeSlider.Thumb className="w-2.5 h-2.5 bg-white rounded-full absolute left-[var(--slider-fill)] -translate-x-1/2 opacity-0 group-hover/volume:opacity-100 transition-opacity shadow-sm" />
                                                </VolumeSlider.Root>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </MediaPlayer>
                        </div>

                        {/* Title and Metadata */}
                        <div className="flex flex-col gap-3 px-2">
                            <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-ed-fg">
                                {media.displayTitle}
                            </h1>
                            <div className="flex items-center gap-3 text-xs font-ui uppercase tracking-[0.15em] text-ed-fg-muted">
                                <span className="text-ed-accent font-semibold">{media.author}</span>
                                <span className="w-1 h-1 bg-ed-rule rounded-full" />
                                <span>{media.displayDate || 'Archival Record'}</span>
                                {duration > 0 && (
                                    <>
                                        <span className="w-1 h-1 bg-ed-rule rounded-full" />
                                        <span>{formatDuration(duration)}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Navigation and Actions */}
                        <div className="flex items-center gap-3 px-2">
                            {prev && (
                                <Link href={`/media/${encodeURIComponent(prev.id)}`} className="soft-pill flex items-center gap-2 px-4 py-2 text-xs font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent">
                                    <ArrowLeft className="w-4 h-4" /> Prev
                                </Link>
                            )}
                            {next && (
                                <Link href={`/media/${encodeURIComponent(next.id)}`} className="soft-pill flex items-center gap-2 px-4 py-2 text-xs font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent">
                                    Next <ArrowRight className="w-4 h-4" />
                                </Link>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                                <button onClick={exportTranscript} className="soft-pill p-2.5 text-ed-fg-muted transition-colors hover:text-ed-accent" title="Download Transcript">
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* THEATER MODE FEED */}
                        <AnimatePresence>
                            {viewMode === 'theater' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="soft-shell mt-8 overflow-hidden"
                                >
                                    <div className="flex items-center justify-between border-b border-ed-rule px-6 py-3">
                                        <span className="text-[10px] font-bold font-ui uppercase tracking-[0.2em] text-ed-fg-muted">Synchronized Feed</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-ed-rule'}`} />
                                            <span className="text-[10px] font-bold font-ui uppercase tracking-widest text-ed-fg-muted">
                                                {isPlaying ? 'Live Signal' : 'Paused'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-8 md:p-16 flex items-center justify-center min-h-[300px] bg-gradient-to-b from-ed-surface/5 to-transparent">
                                        <AnimatePresence mode="wait">
                                            {activeCaption ? (
                                                <motion.p
                                                    key={activeCaption.content}
                                                    initial={{ opacity: 0, filter: 'blur(4px)' }}
                                                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                                                    exit={{ opacity: 0, filter: 'blur(4px)' }}
                                                    transition={{ duration: 0.4 }}
                                                    className="text-3xl md:text-4xl lg:text-5xl font-display text-center text-ed-fg leading-snug max-w-4xl"
                                                >
                                                    {activeCaption.content}
                                                </motion.p>
                                            ) : (
                                                <motion.p
                                                    key="waiting"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.4 }}
                                                    exit={{ opacity: 0 }}
                                                    className="text-sm font-bold font-ui uppercase tracking-[0.3em] text-center text-ed-fg-muted"
                                                >
                                                    {currentTime < (segments[0]?.start_time || 0) ? 'Introduction Playing...' : 'Awaiting Audio Signal...'}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Cinematic Progress Bar */}
                                    <div className="h-1 bg-ed-surface w-full overflow-hidden">
                                        {activeCaption && duration > 0 && (
                                            <motion.div
                                                className="h-full bg-ed-accent"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${((currentTime - activeCaption.start_time) / (activeCaption.end_time - activeCaption.start_time)) * 100}%`
                                                }}
                                                transition={{ ease: "linear", duration: 0.1 }}
                                            />
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* TRANSCRIPT COLUMN */}
                    <AnimatePresence>
                        {viewMode === 'transcript' && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="soft-shell sticky top-6 flex h-[600px] flex-col overflow-hidden lg:h-[calc(100vh-140px)]"
                            >
                                {/* Header */}
                                <div className="z-10 flex flex-col gap-5 border-b border-ed-rule p-5 backdrop-blur-xl">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-bold font-ui uppercase tracking-[0.1em] text-ed-fg">Interactive Record</h3>
                                            <span className="text-xs text-ed-fg-muted">Click any line to seek video</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-0.5 mr-2">
                                                <button onClick={() => setFontSize(Math.max(0, fontSize - 1))} className="soft-pill p-1.5 text-[10px] font-bold text-ed-fg-muted">A-</button>
                                                <button onClick={() => setFontSize(Math.min(3, fontSize + 1))} className="soft-pill p-1.5 text-[10px] font-bold text-ed-fg-muted">A+</button>
                                            </div>
                                            <button
                                                onClick={() => setAutoScroll(!autoScroll)}
                                                className={`soft-pill px-3 py-1.5 text-[10px] font-bold font-ui uppercase tracking-widest transition-all ${autoScroll ? 'bg-ed-accent/10 text-ed-accent' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                                            >
                                                {autoScroll ? 'Auto-Scroll On' : 'Off'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search Bar */}
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ed-fg-muted group-focus-within:text-ed-accent transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search transcript..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="soft-pill w-full py-2.5 pl-10 pr-10 text-sm font-ui transition-all placeholder:text-ed-fg-muted/50 focus:border-ed-accent focus:outline-none"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-ed-fg-muted hover:text-ed-fg"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Status Bar */}
                                <div className="flex items-center justify-between border-b border-ed-rule px-5 py-2.5 text-[10px] font-bold font-ui uppercase tracking-widest text-ed-fg-muted">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="tabular-nums">{formatDuration(currentTime)} / {formatDuration(duration)}</span>
                                    </div>
                                    <span>{filteredSegments.length} Segments</span>
                                </div>

                                {/* Segments List */}
                                <div className="flex-1 space-y-2 overflow-y-auto bg-ed-bg/35 p-4 scroll-smooth">
                                    {filteredSegments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-ed-fg-muted gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p className="text-sm font-ui text-center">No matches found for<br />&quot;{searchQuery}&quot;</p>
                                        </div>
                                    ) : (
                                        filteredSegments.map((seg, i) => {
                                            const isActive = (seg.segment_index ?? i) === activeSegmentIndex;
                                            return (
                                                <div
                                                    key={seg.id ?? i}
                                                    id={`seg-${seg.segment_index ?? i}`}
                                                    onClick={() => handleSegmentClick(seg.start_time)}
                                                    className={`group relative cursor-pointer rounded-[1.2rem] p-4 pl-5 transition-all duration-200
                                                        ${isActive
                                                            ? 'soft-panel text-ed-fg'
                                                            : 'hover:bg-ed-surface/30'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <span className={`text-[10px] font-bold font-ui tracking-widest uppercase ${isActive ? 'text-ed-accent' : 'text-ed-fg-muted'}`}>
                                                            {seg.speaker}
                                                        </span>
                                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => handleCopy(e, seg.content, seg.id ?? i)}
                                                                className="text-ed-fg-muted hover:text-ed-accent transition-colors"
                                                                title="Copy quote"
                                                            >
                                                                {copiedId === (seg.id ?? i) ? <Check className="w-3.5 h-3.5 text-ed-accent" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <span className="text-[10px] font-mono text-ed-fg-muted tabular-nums">
                                                                {formatDuration(seg.start_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className={`${fontSizes[fontSize]} leading-relaxed font-body ${isActive ? 'text-ed-fg' : 'text-ed-fg/80'}`}>
                                                        {seg.content}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
