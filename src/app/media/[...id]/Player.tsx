'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/app/components/ThemeProvider';
import { BookOpen, Search, Play, Pause, Volume2, VolumeX, RotateCcw, Maximize, Clock, User, Calendar, Share2, Download, Bookmark, ChevronDown, ChevronUp, Headphones, SkipBack, SkipForward, Settings, Keyboard, Gauge, Minimize, Check } from 'lucide-react';
import { formatMedia } from '@/lib/formatUtils';
import { updateTranscript } from '../actions';
import Header from '@/components/layout/Header';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import BookmarkPanel from '@/components/player/BookmarkPanel';
import ResumePrompt from '@/components/player/ResumePrompt';
import SmartSearch from '@/components/player/SmartSearch';
import thumbnailMapping from "@/data/thumbnail_mapping.json";
import quranStudyThumbnails from "@/data/quran_study_thumbnails.json";

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
    const { darkMode } = useTheme();

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

    // Video Layout State
    const [videoLayout, setVideoLayout] = useState<'split' | 'overlay'>('split');

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
    const fontSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl'];
    const lineHeights = ['leading-relaxed', 'leading-relaxed', 'leading-loose', 'leading-loose'];

    const fonts = {
        heading: "font-serif",
        body: "font-sans",
        ui: "font-sans"
    };

    // --- THUMBNAIL LOGIC (Derived from MediaCard) ---
    let thumbnailSrc = '/images/placeholders/rashad-khalifa.png';
    if (media.type === 'sermon' || media.type === 'video-program') {
        const mappedFilename = (thumbnailMapping as Record<string, string>)[media.id];
        if (mappedFilename) {
            thumbnailSrc = media.type === 'sermon'
                ? `/images/sermons/${mappedFilename}.jpg`
                : `/images/video-programs/${mappedFilename}.jpg`;
        } else {
            const cleanId = media.id
                .replace(/^media\/(FRIDAY SERMONS|VIDEO PROGRAMS|disorganized_sermons|rk_video_programs)\//, '')
                .replace(/\s+/g, '_')
                .replace(/[^\w\-_.]/g, '')
                .replace(/\.mp4$/, '');
            thumbnailSrc = media.type === 'sermon'
                ? `/images/sermons/${cleanId}.jpg`
                : `/images/video-programs/${cleanId}.jpg`;
        }
    } else if (media.type === 'audio' || media.type === 'messenger-audio') {
        // Updated to use same logic as quran-study if possible, or new logic
        // But for now sticking to the MediaCard defaults unless it's a Quran Study
        // Wait, did user say designated audio?
        // Let's assume there is a generic logic or specific logic for QS audio.
        thumbnailSrc = '/images/messenger-audios/default.jpg';
    }

    // Quran Study Logic (Checking displayTitle and ID)
    if (media.type === 'quran-study') { // Independent check as QS can be 'audio' type in some contexts? No, it's 'quran-study'
        const match = displayTitle.match(/^(\d+)\)/) || media.id.match(/quran-study-v2\/(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            thumbnailSrc = (quranStudyThumbnails as Record<string, string>)[String(num)] || thumbnailSrc;
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />

            {/* Keyboard Shortcuts Modal */}
            {showShortcuts && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
                    <div className="bg-card rounded-xl p-6 max-w-2xl w-full border border-border shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-serif font-bold flex items-center gap-2">
                                <Keyboard className="w-5 h-5 text-primary" />
                                Keyboard Shortcuts
                            </h2>
                            <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground">✕</button>
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

            <div className={`max-w-[1800px] mx-auto px-4 sm:px-6 py-6 transition-all duration-500 ${videoLayout === 'overlay' ? 'max-w-6xl' : ''}`}>

                {/* === AUDIO LAYOUT (Unchanged) === */}
                {!isVideo ? (
                    <div className="max-w-4xl mx-auto space-y-6">
                        {/* Compact Audio Player code... (keeping existing audio layout) */}
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6 relative">
                            {/* ... Audio Player UI logic from before ... */}
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-inner relative bg-black/20">
                                    <img
                                        src={thumbnailSrc}
                                        alt={displayTitle}
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.currentTarget.src = '/images/placeholders/rashad-khalifa.png'; }}
                                    />
                                </div>
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div>
                                        <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground leading-tight">{displayTitle}</h1>
                                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
                                            <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{author}</span>
                                            {displayDate && <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{displayDate}</span>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => player.skipTime(-5)} className="p-2 text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted rounded-full transition-colors"><SkipBack className="w-5 h-5" /></button>
                                        <button onClick={player.togglePlay} className="w-12 h-12 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95">
                                            {player.isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                                        </button>
                                        <button onClick={() => player.skipTime(5)} className="p-2 text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted rounded-full transition-colors"><SkipForward className="w-5 h-5" /></button>

                                        <div className="flex-1 flex items-center gap-3 px-4">
                                            <span className="text-xs font-mono text-muted-foreground">{formatTime(player.currentTime)}</span>
                                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer group relative" onClick={handleSeek}>
                                                <div className="h-full bg-primary relative" style={{ width: `${(player.currentTime / player.duration) * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-mono text-muted-foreground">{formatTime(player.duration)}</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button onClick={player.toggleMute} className="p-2 text-muted-foreground hover:text-foreground"><Volume2 className="w-5 h-5" /></button>
                                            <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-muted-foreground hover:text-foreground"><Settings className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Settings Panel Overlay */}
                            {showSettings && (
                                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-muted-foreground">Speed</label>
                                        <div className="flex gap-1">
                                            {[1, 1.25, 1.5, 2].map(r => (
                                                <button key={r} onClick={() => player.changePlaybackRate(r)} className={`px-2 py-1 text-xs rounded border ${player.playbackRate === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 border-border'}`}>{r}x</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-end justify-end gap-2">
                                        <button onClick={exportTranscript} className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded flex items-center gap-2 transition-colors"><Download className="w-3.5 h-3.5" /> Transcript</button>
                                    </div>
                                </div>
                            )}

                            {/* Hidden Audio Element */}
                            <video ref={videoRef} className="hidden" onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => player.setDuration(videoRef.current?.duration || 0)} src={videoSrc} />
                        </div>

                        {/* Transcript Component (Standard) - NO TABS */}
                        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                            <div className="flex flex-col h-full bg-card">
                                <div className="p-3 border-b border-border flex items-center gap-2 sticky top-0 bg-card/95 backdrop-blur z-10">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 py-2 text-sm bg-muted/50 border-border rounded-md focus:ring-1 focus:ring-primary" />
                                    </div>

                                    {/* Auto-Scroll & Font Controls */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setAutoScroll(!autoScroll)}
                                            className={`px-2 py-1.5 rounded flex items-center gap-1.5 transition-all border ${autoScroll ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:bg-muted'}`}
                                            title={autoScroll ? "Disable Auto Scroll" : "Enable Auto Scroll"}
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Scroll</span>
                                            <ChevronDown className={`w-3.5 h-3.5 ${autoScroll ? 'opacity-100' : 'opacity-50'}`} />
                                        </button>

                                        <div className="h-4 w-px bg-border mx-1" />

                                        <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                                            <button
                                                onClick={() => setFontSize(Math.max(0, fontSize - 1))}
                                                disabled={fontSize === 0}
                                                className="px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-30 border-r border-border transition-colors"
                                            >
                                                A-
                                            </button>
                                            <button
                                                onClick={() => setFontSize(Math.min(3, fontSize + 1))}
                                                disabled={fontSize === 3}
                                                className="px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                                            >
                                                A+
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {segments.map((seg, i) => {
                                        const isActive = i === activeSegmentIndex;
                                        return (
                                            <div key={i} id={`seg-${i}`} onClick={() => handleSegmentClick(seg.start_time)} className={`p-4 rounded-lg cursor-pointer transition-all border-l-2 ${isActive ? 'bg-primary/5 border-primary shadow-sm' : 'border-transparent hover:bg-muted/50'}`}>
                                                <div className="flex justify-between mb-1">
                                                    <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{seg.speaker}</span>
                                                    <span className="text-[10px] font-mono text-muted-foreground">{formatTime(seg.start_time)}</span>
                                                </div>
                                                <p className={`${fontSizes[fontSize]} leading-relaxed ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>{seg.content}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // === VIDEO LAYOUTS ===
                    <div className={`grid gap-6 ${videoLayout === 'split' ? 'lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_450px]' : 'grid-cols-1 max-w-5xl mx-auto'}`}>

                        {/* Video Player Column - Sticky on Mobile */}
                        <div className="space-y-4 sticky top-0 md:static z-40 bg-background/95 backdrop-blur md:bg-transparent pb-4 md:pb-0 pt-2 md:pt-0 -mx-4 px-4 md:mx-0 md:px-0 border-b md:border-b-0 border-border/40 shadow-sm md:shadow-none">
                            <div className="flex items-center justify-between mb-2">
                                <h1 className="text-xl md:text-2xl font-serif font-bold truncate">{displayTitle}</h1>
                                {/* Layout Toggle */}
                                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
                                    <button
                                        onClick={() => setVideoLayout('split')}
                                        className={`p-1.5 rounded-md transition-all ${videoLayout === 'split' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="Split View (Side-by-Side)"
                                    >
                                        <div className="w-5 h-5 flex gap-0.5">
                                            <div className="w-2/3 h-full bg-current rounded-[1px] opacity-80" />
                                            <div className="w-1/3 h-full border border-current rounded-[1px] opacity-60" />
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => setVideoLayout('overlay')}
                                        className={`p-1.5 rounded-md transition-all ${videoLayout === 'overlay' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="Overlay View (Theater)"
                                    >
                                        <div className="w-5 h-5 border border-current rounded-[1px] relative flex items-end justify-center pb-0.5">
                                            <div className="w-3/4 h-1 bg-current rounded-[1px] opacity-80" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div
                                className="bg-black rounded-xl overflow-hidden shadow-2xl relative group aspect-video"
                                onMouseEnter={() => setShowControls(true)}
                                onMouseLeave={() => !player.isPlaying && setShowControls(true) || setShowControls(false)}
                            >
                                <video
                                    ref={videoRef}
                                    className="w-full h-full object-contain"
                                    onClick={player.togglePlay}
                                    onTimeUpdate={handleTimeUpdate}
                                    onLoadedMetadata={() => player.setDuration(videoRef.current?.duration || 0)}
                                    // ... other props
                                    src={videoSrc}
                                />

                                {/* OVERLAY CAPTIONS UI */}
                                {videoLayout === 'overlay' && segments[activeSegmentIndex] && (
                                    <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none px-8">
                                        <div className="bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-lg md:text-xl font-medium text-center shadow-lg animate-in fade-in slide-in-from-bottom-2 max-w-3xl">
                                            {segments[activeSegmentIndex].content}
                                        </div>
                                    </div>
                                )}

                                {/* ... Custom Controls Overlay from previous step (Play, Progress, Fullscreen etc) ... */}
                                <div className={`absolute bottom-0 left-0 right-0 pt-16 pb-4 px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${showControls || !player.isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                                    {/* Progress Bar */}
                                    <div className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group/progress mb-4" onClick={handleSeek}>
                                        <div className="absolute h-full bg-primary rounded-full" style={{ width: `${(player.currentTime / player.duration) * 100}%` }} />
                                        <div className="absolute w-4 h-4 bg-primary rounded-full shadow top-1/2 -translate-y-1/2 opacity-0 group-hover/progress:opacity-100 transition-opacity" style={{ left: `${(player.currentTime / player.duration) * 100}%` }} />
                                    </div>

                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-4">
                                            <button onClick={player.togglePlay} className="hover:scale-110 transition-transform">
                                                {player.isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white" />}
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => player.skipTime(-10)} className="p-2 hover:bg-white/10 rounded-full"><RotateCcw className="w-5 h-5" /></button>
                                                <button onClick={() => player.skipTime(10)} className="p-2 hover:bg-white/10 rounded-full"><RotateCcw className="w-5 h-5 -scale-x-100" /></button>
                                            </div>
                                            <span className="text-sm font-mono opacity-80">{formatTime(player.currentTime)} / {formatTime(player.duration)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={player.toggleMute} className="p-2 hover:bg-white/10 rounded-full">{player.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                                            <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full"><Maximize className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Transcript Column (Hidden if Overlay) - NO TABS */}
                        {videoLayout === 'split' && (
                            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px] lg:h-[calc(100vh-140px)] sticky top-6">
                                <div className="flex flex-col h-full bg-card">
                                    <div className="p-3 border-b border-border flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="w-full px-3 py-1.5 text-sm bg-muted/50 border border-border rounded focus:ring-1 focus:ring-primary outline-none"
                                            />
                                        </div>

                                        {/* Auto-Scroll & Font Controls */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setAutoScroll(!autoScroll)}
                                                className={`px-2 py-1.5 rounded flex items-center gap-1.5 transition-all border ${autoScroll ? 'bg-primary/10 text-primary border-primary/20' : 'text-muted-foreground border-transparent hover:bg-muted'}`}
                                                title={autoScroll ? "Disable Auto Scroll" : "Enable Auto Scroll"}
                                            >
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Scroll</span>
                                                <ChevronDown className={`w-3.5 h-3.5 ${autoScroll ? 'opacity-100' : 'opacity-50'}`} />
                                            </button>

                                            <div className="h-4 w-px bg-border mx-1" />

                                            <div className="flex items-center border border-border rounded-md overflow-hidden bg-background">
                                                <button
                                                    onClick={() => setFontSize(Math.max(0, fontSize - 1))}
                                                    disabled={fontSize === 0}
                                                    className="px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-30 border-r border-border transition-colors"
                                                >
                                                    A-
                                                </button>
                                                <button
                                                    onClick={() => setFontSize(Math.min(3, fontSize + 1))}
                                                    disabled={fontSize === 3}
                                                    className="px-2 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:opacity-30 transition-colors"
                                                >
                                                    A+
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {segments.map((seg, i) => {
                                            const isActive = i === activeSegmentIndex;
                                            return (
                                                <div key={i} id={`seg-${i}`} onClick={() => handleSegmentClick(seg.start_time)} className={`p-3 rounded-lg cursor-pointer border-l-2 transition-all ${isActive ? 'bg-primary/5 border-primary' : 'border-transparent hover:bg-muted/50'}`}>
                                                    <div className="flex justify-between mb-1">
                                                        <span className={`text-[11px] font-bold uppercase ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{seg.speaker}</span>
                                                        <span className="text-[10px] font-mono text-muted-foreground">{formatTime(seg.start_time)}</span>
                                                    </div>
                                                    <p className={`text-sm leading-snug ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{seg.content}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Utility for time formatting in UI
function formatTime(seconds: number) {
    if (!Number.isFinite(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function ShortcutItem({ keys, action }: { keys: string[], action: string }) {
    return (
        <div className="flex items-center justify-between border-b border-border/50 bg-background/50 p-2 rounded">
            <span className="text-muted-foreground font-medium">{action}</span>
            <div className="flex gap-1">
                {keys.map(k => (
                    <kbd key={k} className="px-1.5 py-0.5 bg-muted rounded border border-border text-[10px] font-mono font-bold text-foreground min-w-[20px] text-center shadow-sm">
                        {k}
                    </kbd>
                ))}
            </div>
        </div>
    );
}
