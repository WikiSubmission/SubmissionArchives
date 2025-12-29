'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Play, Pause, Volume2, VolumeX, RotateCcw, Maximize, Clock, User, Calendar, Share2, Download, Bookmark, ChevronDown, ChevronUp, Headphones } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { MEDIA_METADATA } from '@/lib/mediaMetadata';
import { useTheme } from '../../components/ThemeProvider';
import Header from '@/components/Header';

export default function Player({ media, segments }: { media: any, segments: any[] }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [showControls, setShowControls] = useState(false);
    // const { darkMode } = useTheme(); // Use this if you want to react to theme changes specifically here.
    // For now, this component uses hardcoded styles but inherits global 'dark' class for tailwind.
    const [mediaError, setMediaError] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

    const [autoScroll, setAutoScroll] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [fontSize, setFontSize] = useState(1);
    const [compactMode, setCompactMode] = useState(false);

    // Theme Constants (Forced Light/Book Style)
    // Fonts: Headers -> Cinzel, Body -> Crimson, UI -> Inter
    const fonts = {
        heading: "font-[family-name:var(--font-roboto-slab)]",
        body: "font-sans",
        ui: "font-sans"
    };

    const { displayTitle, displayDate, author } = formatMedia(media);

    // Font sizing for Transcript
    const fontSizes = ['text-base', 'text-lg', 'text-xl', 'text-2xl'];
    const lineHeights = ['leading-relaxed', 'leading-relaxed', 'leading-loose', 'leading-loose'];

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            // Fallback: if duration is 0 but we have a duration now, update it
            if (duration === 0 && videoRef.current.duration > 0) {
                setDuration(videoRef.current.duration);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setVolume(val);
            setIsMuted(val === 0);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) document.exitFullscreen();
            else videoRef.current.parentElement?.requestFullscreen();
        }
    };

    const [offset, setOffset] = useState(0); // Audio offset in seconds
    const [showSync, setShowSync] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);

    // Load saved offset from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(`media-offset-${media.id}`);
        if (saved) setOffset(parseFloat(saved));
    }, [media.id]);

    const saveOffset = (val: number) => {
        setOffset(val);
        localStorage.setItem(`media-offset-${media.id}`, val.toString());
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const newTime = percent * duration;
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    useEffect(() => {
        if (!autoScroll || isCalibrating) return; // Disable auto-scroll during calibration
        // Adjusted for offset: Highlight segment where (currentTime - offset) is within range
        const adjustedTime = currentTime - offset;
        const activeIndex = segments.findIndex(s => adjustedTime >= s.start_time && adjustedTime < s.end_time);
        if (activeIndex !== -1) {
            const el = document.getElementById(`seg-${activeIndex}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentTime, segments, autoScroll, offset, isCalibrating]);

    const handleSegmentClick = (segStart: number) => {
        if (isCalibrating) {
            // Calibration Logic: The current video time represents this segment's start
            // current = segStart + offset  =>  offset = current - segStart
            const newOffset = currentTime - segStart;
            saveOffset(newOffset);
            setIsCalibrating(false);
            setShowSync(false);
        } else {
            // Normal Seek Logic
            seekTo(segStart);
        }
    };

    const seekTo = (time: number | string) => {
        const timeVal = typeof time === 'string' ? parseFloat(time) : time;

        if (videoRef.current && Number.isFinite(timeVal)) {
            const currentDuration = videoRef.current.duration;
            let safeTime = timeVal + offset; // Apply offset

            // Allow negative seek if offset pushes it there (will clamp to 0 by browser usually)
            // But ensure we don't seek past duration if duration is known
            if (Number.isFinite(currentDuration) && currentDuration > 0) {
                safeTime = Math.min(safeTime, currentDuration);
            }
            safeTime = Math.max(0, safeTime);

            videoRef.current.currentTime = safeTime;
            setCurrentTime(safeTime);

            if (!isPlaying) {
                videoRef.current.play().catch(e => console.error("Play failed:", e));
                setIsPlaying(true);
            }
        }
    };

    const skipTime = (seconds: number) => {
        if (videoRef.current) {
            const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    const filteredSegments = segments.filter(seg =>
        searchQuery === '' || seg.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Construct Video Source URL
    // Construct Video Source URL
    const folderMap: Record<string, string> = {
        'sermon': 'disorganized_sermons',
        'quran-study': 'messenger_quran_studies',
        'audio': 'messenger_audios',
        'video-program': 'rk_video_programs'
    };

    // Use R2 Domain if available, otherwise fallback (or fail, since localhost won't have the files anymore)
    const r2Domain = process.env.NEXT_PUBLIC_R2_DOMAIN;
    const fileServerUrl = r2Domain ? `https://${r2Domain}/media` : 'http://localhost:9090';

    let filename = media.local_filename || '';
    const isVideo = media.type === 'sermon' || media.type === 'video-program';
    const extension = isVideo ? '.mp4' : '.mp3';
    if (filename.endsWith('.json')) filename = filename.replace(/_diarized\.json|\.json$/, extension);

    const folder = folderMap[media.type] || '';

    // If R2, we don't need port 9090 or 'media' repeated if included in url above
    // My upload script puts files in `media/folderName/filename`.
    // So URL should be `https://DOMAIN/media/FOLDER/FILENAME`
    // Add cache buster to prevent CORS caching issues
    const videoSrc = filename ? `${fileServerUrl}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}?t=${new Date().getTime()}` : undefined;

    // Determine Layout Mode
    const isAudioMode = !isVideo;

    return (
        <div className={`min-h-screen bg-background text-foreground ${fonts.ui}`}>
            {/* Header */}
            <Header />

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {isAudioMode ? (
                    // === AUDIO LAYOUT (SPOTIFY STYLE) ===
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Audio Player Card */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
                            <div className="flex flex-col md:flex-row">
                                {/* Left: Album Art / Visual */}
                                <div className="w-full md:w-80 h-80 bg-gradient-to-br from-zinc-800 to-black flex items-center justify-center relative shrink-0">
                                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
                                    <div className="w-40 h-40 rounded-full bg-zinc-700/50 flex items-center justify-center border border-zinc-600 shadow-inner">
                                        <Headphones className="w-20 h-20 text-zinc-400" />
                                    </div>
                                    {/* Hidden Video Element for Audio Playback */}
                                    <video
                                        ref={videoRef}
                                        className="hidden"
                                        onTimeUpdate={handleTimeUpdate}
                                        onLoadedMetadata={handleLoadedMetadata}
                                        onEnded={() => setIsPlaying(false)}
                                        src={videoSrc}
                                        onError={() => setMediaError(true)}
                                    />
                                </div>

                                {/* Right: Controls & Info */}
                                <div className="flex-1 p-8 flex flex-col justify-between bg-zinc-950">
                                    <div>
                                        <h1 style={{ fontFamily: 'var(--font-roboto-slab)' }} className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                                            {displayTitle}
                                        </h1>
                                        <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-zinc-500">
                                            <span className="flex items-center gap-2"><User className="w-3 h-3" /> {author}</span>
                                            {displayDate && <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {displayDate}</span>}
                                        </div>
                                    </div>

                                    {/* Available Visualizer Area / Info */}

                                    <div className="space-y-6 mt-8">
                                        {/* Progress Bar */}
                                        <div className="space-y-2">
                                            <div className="relative w-full h-1.5 bg-zinc-800 rounded-full cursor-pointer group" onClick={handleSeek}>
                                                <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full group-hover:bg-green-400 transition-colors" style={{ width: `${(currentTime / duration) * 100}%` }} />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(duration)}</span>
                                            </div>
                                        </div>

                                        {/* Main Controls */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors">
                                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                </button>
                                                <input
                                                    type="range" min="0" max="1" step="0.1"
                                                    value={isMuted ? 0 : volume}
                                                    onChange={handleVolumeChange}
                                                    className="w-20 accent-green-500 h-1 bg-zinc-800 rounded-lg cursor-pointer"
                                                />
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <button
                                                    onClick={() => skipTime(-5)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
                                                    title="-5 Seconds"
                                                >
                                                    <RotateCcw className="w-5 h-5" />
                                                </button>

                                                <button
                                                    onClick={togglePlay}
                                                    className="w-14 h-14 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-green-900/20"
                                                >
                                                    {isPlaying ? <Pause className="w-6 h-6 fill-black text-black" /> : <Play className="w-6 h-6 fill-black text-black ml-1" />}
                                                </button>

                                                <button
                                                    onClick={() => skipTime(5)}
                                                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-all transform scale-x-[-1]" // Flip rotate icon for forward
                                                    title="+5 Seconds"
                                                >
                                                    <RotateCcw className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <button onClick={() => setAutoScroll(!autoScroll)} className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded border ${autoScroll ? 'bg-green-500/10 text-green-500 border-green-500/50' : 'text-zinc-500 border-zinc-800'}`}>
                                                {autoScroll ? 'Auto Scroll' : 'Scroll Off'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transcript Area (Underneath) */}
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                            <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
                                <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Transcript</span>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search text..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border rounded-sm focus:outline-none focus:border-green-500"
                                        />
                                    </div>
                                    <div className="flex border border-border rounded overflow-hidden">
                                        <button onClick={() => setFontSize(Math.max(0, fontSize - 1))} disabled={fontSize === 0} className="px-2 py-1 hover:bg-muted text-xs border-r border-border">A-</button>
                                        <button onClick={() => setFontSize(Math.min(3, fontSize + 1))} disabled={fontSize === 3} className="px-2 py-1 hover:bg-muted text-xs">A+</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50">
                                {filteredSegments.map((seg, i) => {
                                    const adjustedTime = currentTime - offset;
                                    const isActive = adjustedTime >= seg.start_time && adjustedTime < seg.end_time;
                                    // const isRashad = seg.speaker && /Rashad|Khalifa|Speaker 1|Dr\. K/i.test(seg.speaker);

                                    return (
                                        <div
                                            key={seg.id || i}
                                            id={`seg-${i}`}
                                            onClick={() => handleSegmentClick(seg.start_time)}
                                            className={`p-4 rounded-lg transition-all cursor-pointer border ${isActive ? 'bg-green-50 dark:!bg-zinc-800 border-green-200 dark:!border-green-500 shadow-sm scale-[1.01]' : 'border-transparent hover:bg-muted/50'}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}`}>{seg.speaker}</span>
                                                <span className="text-[10px] font-mono text-muted-foreground opacity-50">{formatTime(seg.start_time)}</span>
                                            </div>
                                            <p className={`${fonts.body} ${fontSizes[fontSize]} ${lineHeights[fontSize]} ${isActive ? 'text-black dark:text-white font-medium' : 'text-muted-foreground'}`}>
                                                {searchQuery ? (
                                                    <span dangerouslySetInnerHTML={{ __html: seg.content.replace(new RegExp(`(${searchQuery})`, 'gi'), '<mark class="bg-yellow-200 dark:bg-yellow-500 text-black">$1</mark>') }} />
                                                ) : seg.content}
                                            </p>
                                        </div>
                                    );
                                })}
                                {filteredSegments.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No transcript found</div>}
                            </div>
                        </div>
                    </div>
                ) : (
                    // === VIDEO LAYOUT (EXISTING) ===
                    <div className="grid lg:grid-cols-[1fr_32rem] gap-8">

                        {/* LEFT COLUMN: Media Player & Info */}
                        <div className="space-y-6">
                            {/* Player Container */}
                            <div
                                className="bg-black rounded-lg overflow-hidden shadow-xl aspect-video relative group sticky top-24 z-40"
                                onMouseEnter={() => setShowControls(true)}
                                onMouseLeave={() => !isPlaying && setShowControls(true) || setShowControls(false)}
                            >
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-contain"
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onEnded={() => setIsPlaying(false)}
                                    src={videoSrc}
                                    onClick={togglePlay}
                                    onError={() => setMediaError(true)}
                                >
                                    <track kind="captions" />
                                </video>

                                {/* Error Overlay */}
                                {mediaError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                                        <div className="text-white text-lg font-bold mb-2">Media Unavailable</div>
                                        <div className="text-gray-400 text-sm max-w-sm text-center px-4 break-words">
                                            Could not load media.
                                            <div className="mt-2 text-xs font-mono text-gray-500 select-all">
                                                {videoSrc}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Centered Play Button */}
                                {!isPlaying && videoSrc && !showSync && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={togglePlay}>
                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 hover:scale-105 transition-transform">
                                            <Play className="w-10 h-10 text-white fill-white ml-2" />
                                        </div>
                                    </div>
                                )}

                                {/* Sync Controls Overlay */}
                                {showSync && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 p-8 text-center transition-all duration-300">
                                        <h3 className="text-white font-bold text-xl mb-4 text-primary">Audio Sync Calibration</h3>

                                        {!isCalibrating ? (
                                            <>
                                                <p className="text-gray-300 text-base mb-8 max-w-md mx-auto leading-relaxed">
                                                    If the transcript is not matching the audio, you can calibrate it instantly.
                                                </p>
                                                <div className="flex flex-col gap-4 items-center">
                                                    <button
                                                        onClick={() => setIsCalibrating(true)}
                                                        className="px-8 py-3 bg-foreground text-background font-bold rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                                    >
                                                        <RotateCcw className="w-4 h-4" /> Start Calibration
                                                    </button>

                                                    {offset !== 0 && (
                                                        <div className="text-gray-400 text-sm mt-4">
                                                            Current Offset: <span className="text-white font-mono">{offset.toFixed(2)}s</span>
                                                            <button
                                                                onClick={() => saveOffset(0)}
                                                                className="ml-4 text-xs underline hover:text-white"
                                                            >
                                                                Reset to 0
                                                            </button>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={() => setShowSync(false)}
                                                        className="mt-4 text-gray-500 hover:text-white text-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-6 max-w-lg animate-in fade-in zoom-in duration-300">
                                                <div className="bg-white/10 p-6 rounded-lg text-left space-y-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className="bg-white text-black font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                                                        <p className="text-gray-200 text-sm">Find a distinct phrase in the audio and <strong>Pause</strong> exactly at its start.</p>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="bg-white text-black font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                                                        <p className="text-gray-200 text-sm">Find the matching phrase in the <strong>Transcript</strong> list on the right.</p>
                                                    </div>
                                                    <div className="flex items-start gap-4">
                                                        <div className="bg-white text-black font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                                                        <p className="text-gray-200 text-sm"><strong>Click</strong> that phrase to set the synchronization point.</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setIsCalibrating(false)}
                                                    className="text-red-400 hover:text-red-300 text-sm font-bold"
                                                >
                                                    Cancel Calibration
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Custom Controls Overlay */}
                                <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="relative w-full h-1.5 bg-white/30 rounded-full mb-4 cursor-pointer group/progress" onClick={handleSeek}>
                                        <div className="absolute top-0 left-0 h-full bg-white rounded-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <button onClick={togglePlay} className="hover:text-white/80 transition-colors">
                                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                                            </button>
                                            <span className="text-xs font-mono opacity-80">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                            <div className="flex items-center gap-2 group/volume">
                                                <button onClick={toggleMute}>{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                                                <input type="range" min="0" max="1" step="0.1" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-0 overflow-hidden group-hover/volume:w-20 h-1 bg-white/50 rounded-lg cursor-pointer transition-all" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setShowSync(!showSync)}
                                                className={`text-xs border px-2 py-0.5 rounded ${offset !== 0 ? 'bg-white border-white text-black font-bold' : 'border-white/30 hover:bg-white/10'}`}
                                                title="Sync Audio Timing"
                                            >
                                                {isCalibrating ? 'Calibrating...' : (offset !== 0 ? `Sync: ${offset > 0 ? '+' : ''}${offset.toFixed(1)}s` : 'Sync')}
                                            </button>
                                            <button onClick={toggleFullscreen} className="hover:text-white transition-colors"><Maximize className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                                <h1
                                    style={{ fontFamily: 'var(--font-roboto-slab)' }}
                                    className={`text-3xl font-bold text-foreground mb-4`}
                                >
                                    {displayTitle}
                                </h1>
                                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-mono uppercase tracking-wider">
                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-foreground" /> {Math.floor(media.duration_seconds / 60)} Mins</span>
                                    <span className="flex items-center gap-2"><User className="w-4 h-4 text-foreground" /> {author}</span>
                                    {displayDate && <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-foreground" /> {displayDate}</span>}
                                </div>
                            </div>

                            {/* Interactive Description */}
                            {MEDIA_METADATA[media.id] && (
                                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                    <div className={`p-6 pb-2 ${!isDescriptionExpanded ? 'max-h-[200px] overflow-hidden' : ''} transition-all duration-300 relative`}>
                                        <div className="prose prose-sm prose-slate max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {MEDIA_METADATA[media.id].description.split('\n').map((line, lineIdx) => {
                                                // Handle Headings (###)
                                                if (line.trim().startsWith('###')) {
                                                    return (
                                                        <h3 key={lineIdx} className="text-foreground font-bold text-lg mt-4 mb-2">
                                                            {line.replace(/^###\s*/, '')}
                                                        </h3>
                                                    );
                                                }

                                                // Handle Bold (**) and Timestamps within the line
                                                const parts = line.split(/(\*\*.*?\*\*|\[(?:\d{1,2}:)?\d{1,2}:\d{2}\])/g);
                                                return (
                                                    <p key={lineIdx} className="mb-2">
                                                        {parts.map((part, i) => {
                                                            // Handle Bold
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={i} className="text-foreground font-bold">{part.slice(2, -2)}</strong>;
                                                            }

                                                            // Handle Timestamps
                                                            const tsMatch = part.match(/\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]/);
                                                            if (tsMatch) {
                                                                const h = parseInt(tsMatch[1] || '0');
                                                                const m = parseInt(tsMatch[2]);
                                                                const s = parseInt(tsMatch[3]);
                                                                const seconds = h * 3600 + m * 60 + s;
                                                                return (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => seekTo(seconds)}
                                                                        className="text-foreground font-mono font-bold hover:underline mx-1"
                                                                    >
                                                                        {part}
                                                                    </button>
                                                                );
                                                            }
                                                            return part;
                                                        })}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                        {!isDescriptionExpanded && (
                                            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                        className="w-full py-3 bg-muted/30 hover:bg-muted/50 border-t border-border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors"
                                    >
                                        {isDescriptionExpanded ? (
                                            <>Show Less <ChevronUp className="w-3 h-3" /></>
                                        ) : (
                                            <>Show More <ChevronDown className="w-3 h-3" /></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Transcript (Sidebar) */}
                        <div className="flex flex-col h-[calc(100vh-140px)] sticky top-24 bg-card border border-border rounded-lg shadow-sm">

                            {/* Toolbar */}
                            <div className="p-4 border-b border-border bg-muted/30 space-y-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Search transcript..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 bg-background border border-border rounded text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground outline-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <button onClick={() => setCompactMode(!compactMode)} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-colors ${compactMode ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-background text-muted-foreground border-border'}`}>
                                        {compactMode ? 'Compact' : 'Expanded'}
                                    </button>
                                    <button onClick={() => setAutoScroll(!autoScroll)} className={`flex-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-colors ${autoScroll ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-background text-muted-foreground border-border'}`}>
                                        {autoScroll ? 'Auto Scroll: On' : 'Auto Scroll: Off'}
                                    </button>
                                    <div className="flex border border-border rounded overflow-hidden">
                                        <button onClick={() => setFontSize(Math.max(0, fontSize - 1))} disabled={fontSize === 0} className="px-3 py-1 bg-background hover:bg-muted text-foreground border-r border-border disabled:opacity-50 text-sm">A-</button>
                                        <button onClick={() => setFontSize(Math.min(3, fontSize + 1))} disabled={fontSize === 3} className="px-3 py-1 bg-background hover:bg-muted text-foreground disabled:opacity-50 text-sm">A+</button>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                                {filteredSegments.map((seg, i) => {
                                    const adjustedTime = currentTime - offset;
                                    const isActive = adjustedTime >= seg.start_time && adjustedTime < seg.end_time;
                                    // Check if speaker is Rashad Khalifa (or variants)
                                    const isRashad = seg.speaker && /Rashad|Khalifa|Speaker 1|Dr\. K/i.test(seg.speaker);

                                    return (
                                        <div
                                            key={seg.id || i}
                                            id={`seg-${i}`}
                                            onClick={() => handleSegmentClick(seg.start_time)}
                                            className={`rounded transition-all cursor-pointer border ${isActive ? 'bg-zinc-800 border-zinc-700 border-l-4 border-l-emerald-500 shadow-md' : 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'} ${compactMode ? 'p-2 flex items-center gap-4' : 'p-4 flex flex-col gap-2'}`}
                                        >
                                            <div className={`flex items-center justify-between ${compactMode ? 'w-[180px] shrink-0' : 'mb-1 border-b border-zinc-800/50 pb-2'}`}>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isRashad ? 'text-emerald-400' : 'text-zinc-500'}`}>
                                                    {seg.speaker}
                                                </span>
                                                <span className={`text-[10px] font-mono ${isActive ? 'text-emerald-500' : 'text-zinc-600'}`}>
                                                    {formatTime(seg.start_time)}
                                                </span>
                                            </div>

                                            <div className={`${fonts.body} ${compactMode ? 'text-sm truncate text-zinc-400' : `${fontSizes[fontSize]} ${lineHeights[fontSize]} ${isActive ? 'text-white' : 'text-zinc-300'}`}`}>
                                                {/* Highlight search terms */}
                                                {searchQuery ? (
                                                    <span dangerouslySetInnerHTML={{ __html: seg.content.replace(new RegExp(`(${searchQuery})`, 'gi'), '<mark class="bg-emerald-900/50 text-emerald-200">$1</mark>') }} />
                                                ) : seg.content}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredSegments.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground italic text-sm">No transcript found</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function formatTime(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
