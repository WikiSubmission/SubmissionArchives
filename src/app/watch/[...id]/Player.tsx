'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Play, Pause, Volume2, VolumeX, RotateCcw, Maximize, Clock, User, Calendar, Share2, Download, Bookmark, ChevronDown, ChevronUp, Headphones, SkipBack, SkipForward, Settings, Keyboard, Gauge, Minimize } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { MEDIA_METADATA } from '@/lib/mediaMetadata';
import { updateTranscript } from '../actions';
import Header from '@/components/Header';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import BookmarkPanel from '@/components/player/BookmarkPanel';
import ResumePrompt from '@/components/player/ResumePrompt';
import SmartSearch from '@/components/player/SmartSearch';

// ==================== CUSTOM HOOKS ====================

function useMediaPlayer(videoRef: React.RefObject<HTMLVideoElement | null>) {
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isBuffering, setIsBuffering] = useState(false);

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => console.error("Play failed:", e));
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying, videoRef]);

    const toggleMute = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    }, [isMuted, videoRef]);

    const handleVolumeChange = useCallback((val: number) => {
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setVolume(val);
            setIsMuted(val === 0);
        }
    }, [videoRef]);

    const changePlaybackRate = useCallback((rate: number) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
            setPlaybackRate(rate);
        }
    }, [videoRef]);

    const skipTime = useCallback((seconds: number) => {
        if (videoRef.current) {
            const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    }, [currentTime, duration, videoRef]);

    const seekTo = useCallback((time: number | string, offset: number = 0) => {
        const timeVal = typeof time === 'string' ? parseFloat(time) : time;
        if (videoRef.current && Number.isFinite(timeVal)) {
            const currentDuration = duration || videoRef.current.duration;
            let safeTime = timeVal + offset;

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
    }, [videoRef, isPlaying, duration]);

    return {
        currentTime, setCurrentTime,
        duration, setDuration,
        isPlaying, setIsPlaying,
        isMuted, volume,
        playbackRate,
        isBuffering, setIsBuffering,
        togglePlay, toggleMute,
        handleVolumeChange,
        changePlaybackRate,
        skipTime, seekTo
    };
}

function useTranscriptSync(segments: any[], currentTime: number, offset: number) {
    const adjustedTime = useMemo(() => currentTime - offset, [currentTime, offset]);

    const activeSegmentIndex = useMemo(() =>
        segments.findIndex(s => adjustedTime >= s.start_time && adjustedTime < s.end_time),
        [adjustedTime, segments]
    );

    return { adjustedTime, activeSegmentIndex };
}

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

function useKeyboardShortcuts(handlers: Record<string, (e: KeyboardEvent) => void>) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement instanceof HTMLInputElement) return;

            const key = e.key.toLowerCase();
            if (handlers[key]) {
                e.preventDefault();
                handlers[key](e);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
}

// ==================== MAIN COMPONENT ====================

export default function Player({
    media,
    segments: initialSegments,
    signedUrl,
    prev,
    next,
    initialTime = 0
}: {
    media: any,
    segments: any[],
    signedUrl?: string,
    prev?: { id: string, title: string },
    next?: { id: string, title: string },
    initialTime?: number
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Media Player State
    const player = useMediaPlayer(videoRef);

    // Premium Features Hooks
    const { bookmarks, addBookmark, deleteBookmark, exportBookmarks: exportBookmarksList } = useBookmarks(media.id);
    const { progress, lastWatched, saveProgress } = useWatchHistory(media.id, player.duration, media.title);

    // Handle initial time seek once video handles match
    useEffect(() => {
        if (initialTime > 0 && videoRef.current) {
            // We set it immediately, but might need to wait for metadata
            player.setCurrentTime(initialTime);
            if (videoRef.current.readyState >= 1) { // metadata loaded
                player.seekTo(initialTime);
            } else {
                const onLoaded = () => player.seekTo(initialTime);
                videoRef.current.addEventListener('loadedmetadata', onLoaded);
                return () => videoRef.current?.removeEventListener('loadedmetadata', onLoaded);
            }
        }
    }, [initialTime]); // Run once when initialTime is provided

    // Common UI State for Premium Features
    const [activeTab, setActiveTab] = useState<'transcript' | 'bookmarks'>('transcript');
    const [useSmartSearch, setUseSmartSearch] = useState(false);

    // Wrapped Time Update
    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            const t = videoRef.current.currentTime;
            player.setCurrentTime(t);
            saveProgress(t);
        }
    }, [player, saveProgress]);

    // Segments & Editing
    const [segments, setSegments] = useState(initialSegments);
    const [isSaving, setIsSaving] = useState(false);
    const pendingSaveTimeout = useRef<NodeJS.Timeout | null>(null);

    // Sync state if props change
    useEffect(() => {
        setSegments(initialSegments);
    }, [initialSegments]);

    // UI State
    const [showControls, setShowControls] = useState(false);
    const [mediaError, setMediaError] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Transcript State
    const [autoScroll, setAutoScroll] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [fontSize, setFontSize] = useState(1);
    const [compactMode, setCompactMode] = useState(false);

    // Sync State
    const [offset, setOffset] = useState(0);
    const [showSync, setShowSync] = useState(false);
    const [isCalibrating, setIsCalibrating] = useState(false);

    // Search with debounce
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [searchMatches, setSearchMatches] = useState<number[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    // Memoized calculations
    const { adjustedTime, activeSegmentIndex } = useTranscriptSync(segments, player.currentTime, offset);

    // Load offset from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(`media-offset-${media.id}`);
        if (saved) setOffset(parseFloat(saved));
    }, [media.id]);

    const saveOffset = useCallback((val: number) => {
        setOffset(val);
        localStorage.setItem(`media-offset-${media.id}`, val.toString());
    }, [media.id]);

    // Autosave with debounce
    const handleSegmentUpdate = useCallback((newSegments: any[]) => {
        setSegments(newSegments);
        if (pendingSaveTimeout.current) clearTimeout(pendingSaveTimeout.current);

        setIsSaving(true);
        pendingSaveTimeout.current = setTimeout(async () => {
            const res = await updateTranscript(media.id, newSegments);
            if (res.success) {
                // Success
            }
            setIsSaving(false);
        }, 2000);
    }, [media.id]);

    const toggleSpeaker = useCallback((segmentId: number, overrideName?: string) => {
        const newSegments = [...segments];
        const idx = newSegments.findIndex(s => s.id === segmentId);
        if (idx === -1) return;

        const currentSpeaker = newSegments[idx].speaker;
        let nextSpeaker = "Dr. Abdel Rahman";

        if (overrideName) {
            nextSpeaker = overrideName;
        } else {
            if (currentSpeaker.includes("Rashad")) nextSpeaker = "Dr. Abdel Rahman";
            else nextSpeaker = "Dr. Rashad Khalifa";
        }

        newSegments[idx].speaker = nextSpeaker;
        handleSegmentUpdate(newSegments);
    }, [segments, handleSegmentUpdate]);

    // Search logic with debounce
    useEffect(() => {
        if (!debouncedSearchQuery) {
            setSearchMatches([]);
            setCurrentMatchIndex(-1);
            return;
        }

        const matches: number[] = [];
        segments.forEach((seg, idx) => {
            if (seg.content.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
                matches.push(idx);
            }
        });

        setSearchMatches(matches);
        if (matches.length > 0) {
            setCurrentMatchIndex(0);
            scrollToMatch(matches[0]);
        } else {
            setCurrentMatchIndex(-1);
        }
    }, [debouncedSearchQuery, segments]);

    const scrollToMatch = useCallback((index: number) => {
        const el = document.getElementById(`seg-${index}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    const handleNextMatch = useCallback(() => {
        if (searchMatches.length === 0) return;
        const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
        setCurrentMatchIndex(nextIndex);
        scrollToMatch(searchMatches[nextIndex]);
    }, [searchMatches, currentMatchIndex, scrollToMatch]);

    const handlePrevMatch = useCallback(() => {
        if (searchMatches.length === 0) return;
        const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
        setCurrentMatchIndex(prevIndex);
        scrollToMatch(searchMatches[prevIndex]);
    }, [searchMatches, currentMatchIndex, scrollToMatch]);

    // Auto-scroll to active segment
    useEffect(() => {
        if (!autoScroll || isCalibrating || activeSegmentIndex === -1) return;
        // Don't auto-scroll if user is interacting with search, unless it's just following playback
        const el = document.getElementById(`seg-${activeSegmentIndex}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [activeSegmentIndex, autoScroll, isCalibrating]);

    // Picture-in-Picture
    const togglePiP = useCallback(async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (videoRef.current && document.pictureInPictureEnabled) {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (err) {
            console.error('PiP failed:', err);
        }
    }, []);

    // Fullscreen
    const toggleFullscreen = useCallback(() => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.parentElement?.requestFullscreen();
            }
        }
    }, []);

    // Export transcript
    const exportTranscript = useCallback(() => {
        const text = segments.map(s =>
            `[${formatTime(s.start_time)}] ${s.speaker}: ${s.content}`
        ).join('\n\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${media.title || 'transcript'}-transcript.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }, [segments, media.title]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        ' ': player.togglePlay,
        'k': player.togglePlay,
        'arrowleft': () => player.skipTime(-5),
        'j': () => player.skipTime(-10),
        'arrowright': () => player.skipTime(5),
        'l': () => player.skipTime(10),
        'm': player.toggleMute,
        'f': toggleFullscreen,
        'p': togglePiP,
        '/': (e: KeyboardEvent) => {
            // e.preventDefault(); // Handled in hook
            searchInputRef.current?.focus();
        },
        '?': () => setShowShortcuts(!showShortcuts),
        'r': () => {
            const activeSeg = segments[activeSegmentIndex];
            if (activeSeg) toggleSpeaker(activeSeg.id, "Dr. Rashad Khalifa");
        },
        'a': () => {
            const activeSeg = segments[activeSegmentIndex];
            if (activeSeg) toggleSpeaker(activeSeg.id, "Dr. Abdel Rahman");
        },
        '<': () => player.changePlaybackRate(Math.max(0.25, player.playbackRate - 0.25)),
        '>': () => player.changePlaybackRate(Math.min(2, player.playbackRate + 0.25)),
        'b': () => addBookmark(player.currentTime, '', 'yellow', segments[activeSegmentIndex]?.content || ''),
    });

    // Cleanup on unmount
    useEffect(() => {
        const video = videoRef.current;
        return () => {
            if (pendingSaveTimeout.current) clearTimeout(pendingSaveTimeout.current);
            if (video) {
                video.pause();
                video.src = '';
                video.load();
            }
        };
    }, []);

    const handleSegmentClick = useCallback((segStart: number) => {
        if (isCalibrating) {
            const newOffset = player.currentTime - segStart;
            saveOffset(newOffset);
            setIsCalibrating(false);
            setShowSync(false);
        } else {
            player.seekTo(segStart, offset);
        }
    }, [isCalibrating, player, offset, saveOffset]);

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            const newTime = percent * player.duration;
            videoRef.current.currentTime = newTime;
            player.setCurrentTime(newTime);
        }
    }, [player]);

    // Construct Video Source URL (EXISTING LOGIC)
    const folderMap: Record<string, string> = {
        'sermon': 'FRIDAY SERMONS',
        'quran-study': 'messenger_quran_studies',
        'audio': 'messenger_audios',
        'video-program': 'VIDEO PROGRAMS'
    };

    const r2Domain = process.env.NEXT_PUBLIC_R2_DOMAIN;
    const fileServerUrl = r2Domain ? `https://${r2Domain}/media` : 'http://localhost:9090';

    let filename = media.local_filename || '';
    const isVideo = media.type === 'sermon' || media.type === 'video-program';
    const extension = isVideo ? '.mp4' : '.mp3';
    if (filename.endsWith('.json')) filename = filename.replace(/_diarized\.json|\.json$/, extension);

    const folder = folderMap[media.type] || '';
    const videoSrc = signedUrl || (filename ? `${fileServerUrl}/${encodeURIComponent(folder)}/${encodeURIComponent(filename)}` : undefined);

    // Derived state for display
    const { displayTitle, displayDate, author } = formatMedia(media);
    const fontSizes = ['text-base', 'text-lg', 'text-xl', 'text-2xl'];
    const lineHeights = ['leading-relaxed', 'leading-relaxed', 'leading-loose', 'leading-loose'];

    const fonts = {
        heading: "font-[family-name:var(--font-roboto-slab)]",
        body: "font-sans",
        ui: "font-sans"
    };

    return (
        <div className={`min-h-screen bg-zinc-950 text-white`}>
            <Header />
            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-zinc-900 rounded-xl p-6 max-w-2xl w-full border border-zinc-800 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Keyboard className="w-6 h-6" />
                                Keyboard Shortcuts
                            </h2>
                            <button onClick={() => setShowShortcuts(false)} className="text-zinc-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <ShortcutItem keys={['Space', 'K']} action="Play/Pause" />
                            <ShortcutItem keys={['←', 'J']} action="-5s / -10s" />
                            <ShortcutItem keys={['→', 'L']} action="+5s / +10s" />
                            <ShortcutItem keys={['M']} action="Mute/Unmute" />
                            <ShortcutItem keys={['F']} action="Fullscreen" />
                            <ShortcutItem keys={['P']} action="Picture-in-Picture" />
                            <ShortcutItem keys={['/']} action="Focus Search" />
                            <ShortcutItem keys={['R']} action="Set Speaker to Rashad" />
                            <ShortcutItem keys={['A']} action="Set Speaker to Abdel Rahman" />
                            <ShortcutItem keys={['<', '>']} action="Playback Speed" />
                            <ShortcutItem keys={['?']} action="Show Shortcuts" />
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto px-6 py-8">
                {!isVideo ? (
                    // === AUDIO LAYOUT (Compact Horizontal Player) ===
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Compact Audio Player */}
                        <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-4">
                                <div className="flex items-center gap-4">
                                    {/* Album Art */}
                                    <div className="w-16 h-16 bg-gradient-to-br from-zinc-800 to-black rounded flex items-center justify-center shrink-0">
                                        <Headphones className="w-8 h-8 text-zinc-600" />
                                    </div>

                                    {/* Title & Metadata */}
                                    <div className="flex-1 min-w-0">
                                        <h1 style={{ fontFamily: 'var(--font-playfair)' }} className="text-base md:text-lg font-semibold text-white mb-1 truncate leading-tight">{displayTitle}</h1>
                                        <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                                            <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{author}</span>
                                            {displayDate && <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{displayDate}</span>}
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="hidden md:flex items-center gap-2">
                                        <button onClick={() => player.skipTime(-5)} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors" title="Back 5s">
                                            <SkipBack className="w-4 h-4" />
                                        </button>
                                        <button onClick={player.togglePlay} className="w-10 h-10 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all shadow-lg">
                                            {player.isPlaying ? <Pause className="w-5 h-5 fill-white text-white" /> : <Play className="w-5 h-5 fill-white text-white ml-0.5" />}
                                        </button>
                                        <button onClick={() => player.skipTime(5)} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors" title="Forward 5s">
                                            <SkipForward className="w-4 h-4" />
                                        </button>
                                        <span className="text-xs font-mono text-zinc-500 min-w-[80px] text-center">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>
                                        <button onClick={player.toggleMute} className="p-1.5 text-zinc-400 hover:text-white transition-colors">
                                            {player.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                        <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 transition-colors ${showSettings ? 'text-green-500' : 'text-zinc-400 hover:text-white'}`}>
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3">
                                    <div className="relative w-full h-1 bg-zinc-800 rounded-full cursor-pointer group" onClick={handleSeek}>
                                        <div className="absolute h-full bg-green-500 rounded-full group-hover:bg-green-400 transition-all" style={{ width: `${(player.currentTime / player.duration) * 100}%` }} />
                                    </div>
                                </div>

                                {/* Mobile Controls */}
                                <div className="md:hidden flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => player.skipTime(-5)} className="p-2 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors">
                                            <SkipBack className="w-5 h-5" />
                                        </button>
                                        <button onClick={player.togglePlay} className="w-12 h-12 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center transition-all shadow-lg">
                                            {player.isPlaying ? <Pause className="w-6 h-6 fill-white text-white" /> : <Play className="w-6 h-6 fill-white text-white ml-0.5" />}
                                        </button>
                                        <button onClick={() => player.skipTime(5)} className="p-2 text-zinc-400 hover:text-white rounded hover:bg-zinc-800 transition-colors">
                                            <SkipForward className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-zinc-500">{formatTime(player.currentTime)}</span>
                                        <button onClick={player.toggleMute} className="p-2 text-zinc-400 hover:text-white transition-colors">
                                            {player.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 transition-colors ${showSettings ? 'text-green-500' : 'text-zinc-400 hover:text-white'}`}>
                                            <Settings className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Settings Panel */}
                                {showSettings && (
                                    <div className="mt-4 bg-zinc-800/50 p-4 rounded-lg space-y-4 border border-zinc-700/50">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-zinc-400 flex items-center gap-2"><Gauge className="w-4 h-4" /> Speed</span>
                                            <div className="flex gap-1 bg-zinc-900 p-1 rounded border border-zinc-800">
                                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => player.changePlaybackRate(rate)}
                                                        className={`px-2 py-1 text-xs rounded font-mono transition-colors ${player.playbackRate === rate ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                                                    >
                                                        {rate}x
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <button onClick={exportTranscript} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm flex items-center justify-center gap-2 transition-colors text-zinc-300 hover:text-white">
                                            <Download className="w-4 h-4" /> Export Transcript
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Hidden Video Element */}
                            <video
                                ref={videoRef}
                                className="hidden"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={() => player.setDuration(videoRef.current?.duration || 0)}
                                onEnded={() => player.setIsPlaying(false)}
                                onWaiting={() => player.setIsBuffering(true)}
                                onCanPlay={() => player.setIsBuffering(false)}
                                src={videoSrc}
                                onError={() => setMediaError(true)}
                            />

                            <ResumePrompt
                                lastPosition={lastWatched}
                                onResume={() => player.seekTo(lastWatched || 0)}
                                onStartOver={() => {
                                    player.seekTo(0);
                                    saveProgress(0);
                                }}
                            />
                        </div>

                        {/* Audio Transcript / Bookmarks Tabs */}
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[500px]">
                            {/* Tabs Header */}
                            <div className="flex border-b border-border bg-muted/20">
                                <button
                                    onClick={() => setActiveTab('transcript')}
                                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'transcript' ? 'bg-muted/50 text-foreground border-b-2 border-green-500' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                >
                                    Transcript
                                </button>
                                <button
                                    onClick={() => setActiveTab('bookmarks')}
                                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'bookmarks' ? 'bg-muted/50 text-foreground border-b-2 border-green-500' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                >
                                    Bookmarks
                                </button>
                            </div>

                            {activeTab === 'bookmarks' ? (
                                <div className="p-4 bg-zinc-950/50 flex-1 overflow-auto">
                                    <BookmarkPanel
                                        bookmarks={bookmarks}
                                        onSeek={player.seekTo}
                                        onDelete={deleteBookmark}
                                        onAdd={(t, n, c) => addBookmark(t, n, c, segments[activeSegmentIndex]?.content || '')}
                                        onExport={() => exportBookmarksList(media.title)}
                                        currentTime={player.currentTime}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col h-full">
                                    <div className="p-4 border-b border-border bg-muted/30 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Transcript</span>
                                            <button
                                                onClick={() => setUseSmartSearch(!useSmartSearch)}
                                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded transition-colors ${useSmartSearch ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                {useSmartSearch ? 'Smart' : 'Search'}
                                            </button>
                                        </div>

                                        {useSmartSearch ? (
                                            <SmartSearch segments={segments} onSeek={player.seekTo} />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1">
                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                                                    <input
                                                        ref={searchInputRef}
                                                        type="text"
                                                        placeholder="Search text..."
                                                        value={searchQuery}
                                                        onChange={e => setSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleNextMatch();
                                                        }}
                                                        className="w-full pl-8 pr-16 py-1.5 text-xs bg-background border border-border rounded-sm focus:outline-none focus:border-green-500"
                                                    />
                                                    {searchQuery && (
                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                            <span className="text-[10px] text-muted-foreground font-mono mr-1">
                                                                {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0/0'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center border border-border rounded overflow-hidden shadow-sm">
                                                    <button onClick={handlePrevMatch} disabled={searchMatches.length === 0} className="px-2 py-1.5 hover:bg-muted text-muted-foreground disabled:opacity-30 border-r border-border"><ChevronUp className="w-3.5 h-3.5" /></button>
                                                    <button onClick={handleNextMatch} disabled={searchMatches.length === 0} className="px-2 py-1.5 hover:bg-muted text-muted-foreground disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                                                </div>
                                                <div className="flex border border-border rounded overflow-hidden shadow-sm">
                                                    <button onClick={() => setFontSize(Math.max(0, fontSize - 1))} disabled={fontSize === 0} className="px-2 py-1 hover:bg-muted text-xs border-r border-border text-muted-foreground">A-</button>
                                                    <button onClick={() => setFontSize(Math.min(3, fontSize + 1))} disabled={fontSize === 3} className="px-2 py-1 hover:bg-muted text-xs text-muted-foreground">A+</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background/50">
                                        {segments.map((seg, i) => {
                                            const isActive = i === activeSegmentIndex;
                                            const isMatch = searchMatches.includes(i);
                                            const isCurrentMatch = isMatch && searchMatches[currentMatchIndex] === i;
                                            const isRashad = seg.speaker && /Rashad|Khalifa|Speaker 1|Dr\. K/i.test(seg.speaker);

                                            return (
                                                <div
                                                    key={seg.id || i}
                                                    id={`seg-${i}`}
                                                    onClick={() => handleSegmentClick(seg.start_time)}
                                                    className={`p-4 rounded-lg transition-all cursor-pointer border ${isCurrentMatch ? 'bg-yellow-500/20 border-yellow-500 ring-1 ring-yellow-500' :
                                                        isActive ? 'bg-green-50 dark:!bg-zinc-800 border-green-200 dark:!border-green-500 shadow-sm scale-[1.01]' :
                                                            'border-transparent hover:bg-muted/50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleSpeaker(seg.id);
                                                            }}
                                                            className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer hover:underline ${isActive ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'} ${isRashad ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}
                                                        >
                                                            {seg.speaker}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-muted-foreground opacity-50">{formatTime(seg.start_time)}</span>
                                                    </div>
                                                    <p className={`${fonts.body} ${fontSizes[fontSize]} ${lineHeights[fontSize]} ${isActive ? 'text-black dark:text-white font-medium' : 'text-muted-foreground'}`}>
                                                        {searchQuery && isMatch ? (
                                                            <span dangerouslySetInnerHTML={{
                                                                __html: seg.content.replace(
                                                                    new RegExp(`(${searchQuery})`, 'gi'),
                                                                    isCurrentMatch
                                                                        ? '<mark class="bg-amber-400 text-black font-bold">$1</mark>'
                                                                        : '<mark class="bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">$1</mark>'
                                                                )
                                                            }} />
                                                        ) : seg.content}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        {segments.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No transcript found</div>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // === VIDEO LAYOUT (Adapted with new logic) ===
                    <div className="grid lg:grid-cols-[1fr_32rem] gap-8">
                        {/* LEFT COLUMN: Media Player & Info */}
                        <div className="space-y-6">
                            {/* Player Container */}
                            <div
                                className="bg-black rounded-lg overflow-hidden shadow-xl aspect-video relative group sticky top-24 z-40"
                                onMouseEnter={() => setShowControls(true)}
                                onMouseLeave={() => !player.isPlaying && setShowControls(true) || setShowControls(false)}
                            >
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-contain"
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={() => player.setDuration(videoRef.current?.duration || 0)}
                                    onEnded={() => player.setIsPlaying(false)}
                                    onWaiting={() => player.setIsBuffering(true)}
                                    onCanPlay={() => player.setIsBuffering(false)}
                                    src={videoSrc}
                                    onClick={player.togglePlay}
                                    onError={(e: any) => {
                                        const err = e.currentTarget.error;
                                        if (err && (err.code === 3 || err.code === 4)) {
                                            setMediaError(true);
                                        }
                                    }}
                                >
                                    <track kind="captions" />
                                </video>
                                <ResumePrompt
                                    lastPosition={lastWatched}
                                    onResume={() => player.seekTo(lastWatched || 0)}
                                    onStartOver={() => {
                                        player.seekTo(0);
                                        saveProgress(0);
                                    }}
                                />

                                {/* Buffering Indicator */}
                                {player.isBuffering && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
                                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    </div>
                                )}

                                {/* Error Overlay */}
                                {mediaError && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
                                        <div className="text-white text-lg font-bold mb-2">Media Unavailable</div>
                                        <div className="text-gray-400 text-sm max-w-sm text-center px-4 break-words">Could not load media.</div>
                                    </div>
                                )}

                                {/* Centered Play Button */}
                                {!player.isPlaying && !player.isBuffering && videoSrc && !showSync && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={player.togglePlay}>
                                        <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/30 hover:scale-105 transition-transform">
                                            <Play className="w-10 h-10 text-white fill-white ml-2" />
                                        </div>
                                    </div>
                                )}

                                {/* Controls Overlay */}
                                <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls || !player.isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                    <div className="relative w-full h-1.5 bg-white/30 rounded-full mb-4 cursor-pointer group/progress" onClick={handleSeek}>
                                        <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all" style={{ width: `${(player.currentTime / player.duration) * 100}%` }} />
                                    </div>
                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <button onClick={player.togglePlay} className="hover:text-white/80 transition-colors">
                                                {player.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                                            </button>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => player.skipTime(-5)}><RotateCcw className="w-4 h-4 text-white hover:text-white/80" /></button>
                                                <button onClick={() => player.skipTime(5)}><RotateCcw className="w-4 h-4 text-white hover:text-white/80 transform scale-x-[-1]" /></button>
                                            </div>
                                            <span className="text-xs font-mono opacity-80">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>
                                            <div className="flex items-center gap-2 group/volume">
                                                <button onClick={player.toggleMute}>{player.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                                                <input type="range" min="0" max="1" step="0.1" value={player.isMuted ? 0 : player.volume} onChange={e => player.handleVolumeChange(parseFloat(e.target.value))} className="w-0 overflow-hidden group-hover/volume:w-20 h-1 bg-white/50 rounded-lg cursor-pointer transition-all" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Speed Popover */}
                                            <div className="relative group/speed">
                                                <button className="text-xs font-bold border border-white/30 px-2 py-0.5 rounded hover:bg-white/10">{player.playbackRate}x</button>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black/90 rounded border border-white/10 hidden group-hover/speed:flex flex-col p-1 gap-1">
                                                    {[0.5, 1, 1.25, 1.5, 2].map(rate => (
                                                        <button
                                                            key={rate}
                                                            onClick={() => player.changePlaybackRate(rate)}
                                                            className={`px-3 py-1 text-xs hover:bg-white/20 rounded ${player.playbackRate === rate ? 'text-green-400 font-bold' : 'text-white'}`}
                                                        >
                                                            {rate}x
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <button onClick={togglePiP} className="hover:text-white transition-colors" title="Picture-in-Picture"><Minimize className="w-5 h-5" /></button>
                                            <button onClick={toggleFullscreen} className="hover:text-white transition-colors" title="Fullscreen"><Maximize className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Metadata */}
                            <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
                                <h1 style={{ fontFamily: 'var(--font-roboto-slab)' }} className={`text-3xl font-bold text-foreground mb-4`}>{displayTitle}</h1>
                                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground font-mono uppercase tracking-wider">
                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-foreground" /> {Math.floor(media.duration_seconds / 60)} Mins</span>
                                    <span className="flex items-center gap-2"><User className="w-4 h-4 text-foreground" /> {author}</span>
                                    {displayDate && <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-foreground" /> {displayDate}</span>}
                                </div>
                                <div className="mt-6 flex items-center gap-4 border-t border-border pt-4">
                                    <button onClick={exportTranscript} className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-2">
                                        <Download className="w-3 h-3" /> Export Transcript
                                    </button>
                                </div>
                            </div>

                            {/* Interactive Description */}
                            {MEDIA_METADATA[media.id] && (
                                <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                                    <div className={`p-6 pb-2 ${!isDescriptionExpanded ? 'max-h-[200px] overflow-hidden' : ''} transition-all duration-300 relative`}>
                                        <div className="prose prose-sm prose-slate max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {MEDIA_METADATA[media.id].description.split('\n').map((line, lineIdx) => {
                                                if (line.trim().startsWith('###')) {
                                                    return <h3 key={lineIdx} className="text-foreground font-bold text-lg mt-4 mb-2">{line.replace(/^###\s*/, '')}</h3>;
                                                }
                                                const parts = line.split(/(\*\*.*?\*\*|\[(?:\d{1,2}:)?\d{1,2}:\d{2}\])/g);
                                                return (
                                                    <p key={lineIdx} className="mb-2">
                                                        {parts.map((part, i) => {
                                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                                return <strong key={i} className="text-foreground font-bold">{part.slice(2, -2)}</strong>;
                                                            }
                                                            const tsMatch = part.match(/\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]/);
                                                            if (tsMatch) {
                                                                const h = parseInt(tsMatch[1] || '0');
                                                                const m = parseInt(tsMatch[2]);
                                                                const s = parseInt(tsMatch[3]);
                                                                const seconds = h * 3600 + m * 60 + s;
                                                                return <button key={i} onClick={() => player.seekTo(seconds)} className="text-foreground font-mono font-bold hover:underline mx-1">{part}</button>;
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
                                        {isDescriptionExpanded ? <>Show Less <ChevronUp className="w-3 h-3" /></> : <>Show More <ChevronDown className="w-3 h-3" /></>}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: Sidebar (Tabs: Transcript / Bookmarks) */}
                        <div className="flex flex-col h-[calc(100vh-140px)] sticky top-24 bg-card border border-border rounded-lg shadow-sm overflow-hidden">
                            {/* Tabs Header */}
                            <div className="flex border-b border-border">
                                <button
                                    onClick={() => setActiveTab('transcript')}
                                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'transcript' ? 'bg-muted/50 text-foreground border-b-2 border-green-500' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                >
                                    Transcript
                                </button>
                                <button
                                    onClick={() => setActiveTab('bookmarks')}
                                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'bookmarks' ? 'bg-muted/50 text-foreground border-b-2 border-green-500' : 'text-muted-foreground hover:bg-muted/20 hover:text-foreground'}`}
                                >
                                    Bookmarks
                                </button>
                            </div>

                            {/* Content */}
                            {activeTab === 'bookmarks' ? (
                                <div className="p-4 bg-zinc-950/50 flex-1 overflow-auto">
                                    <BookmarkPanel
                                        bookmarks={bookmarks}
                                        onSeek={player.seekTo}
                                        onDelete={deleteBookmark}
                                        onAdd={(t, n, c) => addBookmark(t, n, c, segments[activeSegmentIndex]?.content || '')}
                                        onExport={() => exportBookmarksList(media.title)}
                                        currentTime={player.currentTime}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-border bg-muted/30 space-y-3">
                                        {/* Search Type Toggle */}
                                        <div className="flex justify-end mb-2">
                                            <button
                                                onClick={() => setUseSmartSearch(!useSmartSearch)}
                                                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded transition-colors ${useSmartSearch ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                                            >
                                                {useSmartSearch ? 'Smart Search Active' : 'Switch to Smart Search'}
                                            </button>
                                        </div>

                                        {useSmartSearch ? (
                                            <SmartSearch segments={segments} onSeek={player.seekTo} />
                                        ) : (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                <input
                                                    type="text"
                                                    placeholder="Search transcript..."
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleNextMatch();
                                                    }}
                                                    className="w-full pl-10 pr-24 py-2 bg-background border border-border rounded text-sm placeholder:text-muted-foreground focus:border-foreground focus:ring-1 focus:ring-foreground outline-none"
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                                    {searchQuery && (
                                                        <span className="text-xs text-muted-foreground font-mono">
                                                            {searchMatches.length > 0 ? `${currentMatchIndex + 1}/${searchMatches.length}` : '0/0'}
                                                        </span>
                                                    )}
                                                    <div className="flex border border-border rounded overflow-hidden bg-muted/50">
                                                        <button onClick={handlePrevMatch} disabled={searchMatches.length === 0} className="p-1 hover:bg-muted disabled:opacity-30 border-r border-border"><ChevronUp className="w-3 h-3" /></button>
                                                        <button onClick={handleNextMatch} disabled={searchMatches.length === 0} className="p-1 hover:bg-muted disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!useSmartSearch && (
                                            <div className="flex items-center justify-between gap-2">
                                                <button onClick={() => setCompactMode(!compactMode)} className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-colors ${compactMode ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-background text-muted-foreground border-border'}`}>
                                                    {compactMode ? 'Compact' : 'Expanded'}
                                                </button>
                                                <button onClick={() => setAutoScroll(!autoScroll)} className={`flex-1 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded border transition-colors ${autoScroll ? 'bg-zinc-800 text-white border-zinc-700' : 'bg-background text-muted-foreground border-border'}`}>
                                                    {autoScroll ? 'Auto Scroll: On' : 'Auto Scroll: Off'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                                        {segments.map((seg, i) => {
                                            const isActive = i === activeSegmentIndex;
                                            const isMatch = searchMatches.includes(i);
                                            const isCurrentMatch = isMatch && searchMatches[currentMatchIndex] === i;
                                            const isRashad = seg.speaker && /Rashad|Khalifa|Speaker 1|Dr\. K/i.test(seg.speaker);

                                            return (
                                                <div
                                                    key={seg.id || i}
                                                    id={`seg-${i}`}
                                                    onClick={() => handleSegmentClick(seg.start_time)}
                                                    className={`rounded transition-all cursor-pointer border ${isCurrentMatch ? 'bg-yellow-500/20 border-yellow-500 ring-1 ring-yellow-500' :
                                                        isActive ? 'bg-green-100 dark:bg-zinc-800 border-green-300 dark:border-zinc-700 border-l-4 border-l-green-600 dark:border-l-emerald-500 shadow-md' :
                                                            'bg-card dark:bg-zinc-900/40 border-border dark:border-zinc-800 hover:bg-muted dark:hover:bg-zinc-800/80'
                                                        } ${compactMode ? 'p-2 flex items-center gap-4' : 'p-4 flex flex-col gap-2'}`}
                                                >
                                                    <div className={`flex items-center justify-between ${compactMode ? 'w-[180px] shrink-0' : 'mb-1 border-b border-border dark:border-zinc-800/50 pb-2'}`}>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider truncate cursor-pointer hover:underline ${isRashad ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`} onClick={(e) => { e.stopPropagation(); toggleSpeaker(seg.id); }}>{seg.speaker}</span>
                                                        <span className={`text-[10px] font-mono ${isActive ? 'text-green-700 dark:text-emerald-500' : 'text-muted-foreground/70'}`}>{formatTime(seg.start_time)}</span>
                                                    </div>
                                                    <div className={`${fonts.body} ${compactMode ? 'text-sm truncate text-muted-foreground' : `${fontSizes[fontSize]} ${lineHeights[fontSize]} ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}`}>
                                                        {searchQuery && isMatch ? (
                                                            <span dangerouslySetInnerHTML={{
                                                                __html: seg.content.replace(
                                                                    new RegExp(`(${searchQuery})`, 'gi'),
                                                                    isCurrentMatch
                                                                        ? '<mark class="bg-amber-400 text-black font-bold">$1</mark>'
                                                                        : '<mark class="bg-emerald-900/50 text-emerald-200">$1</mark>'
                                                                )
                                                            }} />
                                                        ) : seg.content}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {segments.length === 0 && <div className="text-center py-10 text-muted-foreground text-sm">No transcript found</div>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
function ShortcutItem({ keys, action }: { keys: string[], action: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex gap-2">
                {keys.map(k => <kbd key={k} className="px-2 py-1 bg-zinc-800 rounded font-mono text-zinc-300 border border-zinc-700 min-w-[24px] text-center">{k}</kbd>)}
            </div>
            <span className="text-zinc-400">{action}</span>
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
