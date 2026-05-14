'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Clock, Copy, Check, X, LayoutTemplate, AlignLeft, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Header from '@/components/layout/Header';
import { motion, AnimatePresence } from 'framer-motion';

// Vidstack Core Imports & Primitives
import '@vidstack/react/player/styles/base.css';
import '@vidstack/react/player/styles/default/theme.css';
import { 
    MediaPlayer, 
    MediaProvider, 
    Poster, 
    Track,
    PlayButton,
    TimeSlider,
    MuteButton,
    VolumeSlider,
    Time,
    useMediaState
} from '@vidstack/react';
import type { MediaPlayerInstance } from '@vidstack/react';

const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 
        ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
        : `${m}:${s.toString().padStart(2, '0')}`;
};

// Extracted Volume Icon component for the MuteButton
const VolumeIcon = () => {
    const isMuted = useMediaState('muted');
    const volume = useMediaState('volume');
    if (isMuted || volume === 0) return <VolumeX className="w-4 h-4" />;
    return <Volume2 className="w-4 h-4" />;
};

// Extracted Play Icon component for the PlayButton
const PlayIcon = () => {
    const isPlaying = useMediaState('playing');
    return isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />;
};

export default function SharedPlayer({
    media,
    segments,
    videoUrl,
}: {
    media: any,
    segments: any[],
    videoUrl: string,
}) {
    const videoRef = useRef<MediaPlayerInstance>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [autoScroll, setAutoScroll] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'transcript' | 'theater'>('transcript');
    const [copiedId, setCopiedId] = useState<number | null>(null);

    const activeSegmentIndex = useMemo(() =>
        segments.findIndex(s => currentTime >= s.start_time && currentTime < s.end_time),
        [currentTime, segments]
    );

    const activeCaption = activeSegmentIndex !== -1 ? segments[activeSegmentIndex] : null;

    useEffect(() => {
        if (!autoScroll || activeSegmentIndex === -1) return;
        const el = document.getElementById(`seg-${activeSegmentIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [activeSegmentIndex, autoScroll]);

    const handleSegmentClick = (start: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = start;
            videoRef.current.play();
        }
    };

    const handleCopy = (e: React.MouseEvent, content: string, id: number) => {
        e.stopPropagation();
        navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredSegments = segments.filter(s => 
        s.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg font-body">
            <Header />
            
            <div className="max-w-[1800px] mx-auto px-4 md:px-8 py-8">
                
                {/* View Toggles */}
                <div className="flex justify-center mb-8">
                    <div className="flex p-1 bg-ed-surface/40 backdrop-blur-md rounded-xl border border-ed-rule">
                        <button 
                            onClick={() => setViewMode('transcript')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold font-ui uppercase tracking-widest transition-all duration-300 ${viewMode === 'transcript' ? 'bg-ed-bg text-ed-accent shadow-sm' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                        >
                            <AlignLeft className="w-4 h-4" />
                            Transcript
                        </button>
                        <button 
                            onClick={() => setViewMode('theater')}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold font-ui uppercase tracking-widest transition-all duration-300 ${viewMode === 'theater' ? 'bg-ed-bg text-ed-accent shadow-sm' : 'text-ed-fg-muted hover:text-ed-fg'}`}
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            Theater
                        </button>
                    </div>
                </div>

                <div className={`grid gap-8 transition-all duration-500 ease-in-out ${viewMode === 'transcript' ? 'lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px]' : 'grid-cols-1 max-w-5xl mx-auto'}`}>
                    
                    {/* VIDEO & TITLE COLUMN */}
                    <div className="space-y-6">
                        
                        {/* CUSTOM VIDEO PLAYER CONTAINER */}
                        <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-ed-rule group relative">
                            <MediaPlayer
                                ref={videoRef}
                                title={media.displayTitle}
                                src={videoUrl}
                                onTimeUpdate={(detail) => setCurrentTime(detail.currentTime)}
                                onDurationChange={(detail) => setDuration(detail)}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                className="w-full h-full"
                                playsInline
                            >
                                <MediaProvider>
                                    <Poster
                                        className={`vds-poster object-cover transition-opacity duration-700 z-0 ${isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                        src={media.thumbnailOverride || '/images/placeholders/rashad-khalifa.png'}
                                        alt={media.displayTitle}
                                    />
                                    <Track 
                                        src={videoUrl.replace('.mp4', '.en-US.vtt')} 
                                        label="English" 
                                        lang="en-US" 
                                        kind="subtitles" 
                                        default 
                                    />
                                </MediaProvider>

                                {/* CUSTOM FLOATING CONTROLS */}
                                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                                    <div className="bg-ed-bg/60 backdrop-blur-xl border border-ed-rule/50 rounded-2xl px-4 py-3 flex items-center gap-4 shadow-2xl">
                                        
                                        {/* Play/Pause Button */}
                                        <PlayButton className="text-ed-fg hover:text-ed-accent transition-colors flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-ed-surface/50 hover:bg-ed-surface cursor-pointer">
                                            <PlayIcon />
                                        </PlayButton>

                                        {/* Current Time */}
                                        <Time type="current" className="text-[11px] font-ui text-ed-fg font-medium tracking-wider w-12 text-center" />

                                        {/* Progress Bar */}
                                        <TimeSlider.Root className="flex-1 h-2 group/slider cursor-pointer relative flex items-center">
                                            <TimeSlider.Track className="w-full h-1.5 bg-ed-rule/60 rounded-full overflow-hidden">
                                                <TimeSlider.TrackFill className="bg-ed-accent h-full w-[var(--slider-fill)] rounded-full transition-all duration-75" />
                                            </TimeSlider.Track>
                                            <TimeSlider.Thumb className="w-3.5 h-3.5 bg-white rounded-full absolute left-[var(--slider-fill)] -translate-x-1/2 opacity-0 group-hover/slider:opacity-100 transition-opacity shadow-md border border-gray-200" />
                                        </TimeSlider.Root>

                                        {/* Duration */}
                                        <Time type="duration" className="text-[11px] font-ui text-ed-fg-muted font-medium tracking-wider w-12 text-center" />

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
                                <span>Archival Record</span>
                            </div>
                        </div>

                        {/* THEATER MODE CAPTIONS */}
                        <AnimatePresence>
                            {viewMode === 'theater' && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="bg-ed-bg border border-ed-rule rounded-2xl overflow-hidden shadow-xl mt-8"
                                >
                                    <div className="px-6 py-3 bg-ed-surface/30 border-b border-ed-rule flex items-center justify-between">
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
                                                    className="text-3xl md:text-4xl lg:text-5xl font-playfair italic text-center text-ed-fg leading-snug max-w-4xl"
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
                                className="bg-ed-bg border border-ed-rule rounded-3xl shadow-xl overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-140px)] sticky top-6"
                            >
                                {/* Header */}
                                <div className="p-5 border-b border-ed-rule bg-ed-surface/80 backdrop-blur-xl z-10 flex flex-col gap-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <h3 className="text-sm font-bold font-ui uppercase tracking-[0.1em] text-ed-fg">Interactive Record</h3>
                                            <span className="text-xs text-ed-fg-muted">Click any line to seek video</span>
                                        </div>
                                        <button 
                                            onClick={() => setAutoScroll(!autoScroll)}
                                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold font-ui uppercase tracking-widest transition-all ${autoScroll ? 'bg-ed-accent text-ed-bg' : 'bg-ed-surface text-ed-fg-muted hover:text-ed-fg'}`}
                                        >
                                            {autoScroll ? 'Auto-Scroll On' : 'Auto-Scroll Off'}
                                        </button>
                                    </div>
                                    
                                    {/* Search Bar */}
                                    <div className="relative group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ed-fg-muted group-focus-within:text-ed-accent transition-colors" />
                                        <input 
                                            type="text"
                                            placeholder="Search transcript..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-10 py-2.5 bg-ed-bg border border-ed-rule rounded-xl text-sm font-ui focus:outline-none focus:ring-1 focus:ring-ed-accent focus:border-ed-accent transition-all placeholder:text-ed-fg-muted/50"
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
                                <div className="px-5 py-2.5 bg-ed-surface/40 border-b border-ed-rule flex items-center justify-between text-[10px] font-bold font-ui uppercase tracking-widest text-ed-fg-muted">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                                    </div>
                                    <span>{filteredSegments.length} Segments</span>
                                </div>

                                {/* Segments List */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-ed-bg/50 scroll-smooth">
                                    {filteredSegments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-ed-fg-muted gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p className="text-sm font-ui">No matches found for "{searchQuery}"</p>
                                        </div>
                                    ) : (
                                        filteredSegments.map((seg, i) => {
                                            const isActive = seg.segment_index === activeSegmentIndex;
                                            return (
                                                <div 
                                                    key={seg.segment_index}
                                                    id={`seg-${seg.segment_index}`}
                                                    onClick={() => handleSegmentClick(seg.start_time)}
                                                    className={`group relative p-4 pl-5 border-l-2 rounded-r-xl transition-all duration-200 cursor-pointer 
                                                        ${isActive 
                                                            ? 'bg-ed-surface/60 border-ed-accent' 
                                                            : 'border-transparent hover:bg-ed-surface/30 hover:border-ed-rule'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <span className={`text-[10px] font-bold font-ui tracking-widest uppercase ${isActive ? 'text-ed-accent' : 'text-ed-fg-muted'}`}>
                                                            {seg.speaker}
                                                        </span>
                                                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button 
                                                                onClick={(e) => handleCopy(e, seg.content, seg.segment_index)}
                                                                className="text-ed-fg-muted hover:text-ed-fg transition-colors"
                                                                title="Copy quote"
                                                            >
                                                                {copiedId === seg.segment_index ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                            </button>
                                                            <span className="text-[10px] font-mono text-ed-fg-muted">
                                                                {formatTime(seg.start_time)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className={`text-[15px] leading-relaxed font-body ${isActive ? 'text-ed-fg' : 'text-ed-fg/80'}`}>
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
