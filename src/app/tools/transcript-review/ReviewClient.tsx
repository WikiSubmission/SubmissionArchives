'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Save, Play, Pause, Volume2, Check, X, Edit2 } from 'lucide-react';

interface Segment {
    id: number;
    segment_index: number;
    start_time: number;
    end_time: number;
    content: string;
    speaker: string;
    isTransition: boolean;
}

interface StudyData {
    studyNumber: number;
    filename: string;
    segments: Segment[];
    audioUrl: string;
}

interface ReviewClientProps {
    studyList: { studyNumber: number; filename: string }[];
    initialStudyData: StudyData | null;
    currentStudyNumber: number;
}

// Known speakers for quick selection
const KNOWN_SPEAKERS = [
    "Dr. Khalifa",
    "A woman",
    "A man",
    "Edip",
    "Catherine",
    "Abdullah",
    "Parivash",
    "Hamid",
    "Behrouz",
    "Dr. Sabahi",
    "Shakira",
    "Ismail Barakat",
    "A child",
    "Audience",
    "Martha",
    "Douglas",
    "Feroz",
    "Atif",
    "Lisa",
    "Lydia",
    "Robert",
    "Eric",
    "Apamea",
    "Naghmeh",
    "Other..."
];

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ReviewClient({ studyList, initialStudyData, currentStudyNumber }: ReviewClientProps) {
    const router = useRouter();
    const audioRef = useRef<HTMLAudioElement>(null);

    const [segments, setSegments] = useState<Segment[]>(initialStudyData?.segments || []);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);

    // Track which segments have been modified
    const [modifiedSegments, setModifiedSegments] = useState<Set<number>>(new Set());

    // Update active segment based on audio time
    useEffect(() => {
        const segment = segments.find(
            s => currentTime >= s.start_time && currentTime < s.end_time
        );
        if (segment) {
            setActiveSegmentId(segment.id);
        }
    }, [currentTime, segments]);

    // Update state when study data changes (navigation)
    useEffect(() => {
        if (initialStudyData) {
            setSegments(initialStudyData.segments);
            setHasChanges(false);
            setModifiedSegments(new Set());
            setSaveMessage('');
            // Reset audio if needed, though the src prop change handles the player source
        }
    }, [initialStudyData]);

    // Audio time update
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
        };
    }, []);

    const navigateToStudy = (studyNumber: number) => {
        if (hasChanges) {
            if (!confirm('You have unsaved changes. Navigate anyway?')) return;
        }
        router.push(`/review-transcripts?study=${studyNumber}`);
        router.refresh();
    };

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
        }
    };

    const seekTo = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            audioRef.current.play();
        }
    };

    const startEdit = (segment: Segment) => {
        setEditingId(segment.id);
        setEditValue(segment.speaker);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const confirmEdit = (segmentId: number) => {
        if (!editValue.trim()) return;

        const originalSpeaker = segments.find(s => s.id === segmentId)?.speaker;

        setSegments(prev => prev.map(s =>
            s.id === segmentId ? { ...s, speaker: editValue.trim() } : s
        ));

        if (originalSpeaker !== editValue.trim()) {
            setModifiedSegments(prev => new Set(prev).add(segmentId));
            setHasChanges(true);
        }

        setEditingId(null);
        setEditValue('');
    };

    const selectSpeaker = (segmentId: number, speaker: string) => {
        if (speaker === 'Other...') {
            const custom = prompt('Enter speaker name:');
            if (custom) {
                setSegments(prev => prev.map(s =>
                    s.id === segmentId ? { ...s, speaker: custom.trim() } : s
                ));
                setModifiedSegments(prev => new Set(prev).add(segmentId));
                setHasChanges(true);
            }
        } else {
            setSegments(prev => prev.map(s =>
                s.id === segmentId ? { ...s, speaker } : s
            ));
            setModifiedSegments(prev => new Set(prev).add(segmentId));
            setHasChanges(true);
        }
        setEditingId(null);
    };

    const saveChanges = async () => {
        setSaving(true);
        setSaveMessage('');

        try {
            const response = await fetch('/api/review-transcripts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studyNumber: currentStudyNumber,
                    segments: segments.map(({ isTransition, ...rest }) => rest)
                })
            });

            if (response.ok) {
                setSaveMessage('Saved!');
                setHasChanges(false);
                setModifiedSegments(new Set());
                setTimeout(() => setSaveMessage(''), 3000);
            } else {
                const error = await response.json();
                setSaveMessage(`Error: ${error.message}`);
            }
        } catch (e) {
            setSaveMessage('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const currentIndex = studyList.findIndex(s => s.studyNumber === currentStudyNumber);
    const prevStudy = currentIndex > 0 ? studyList[currentIndex - 1] : null;
    const nextStudy = currentIndex < studyList.length - 1 ? studyList[currentIndex + 1] : null;

    // Count transitions
    const transitionCount = segments.filter(s => s.isTransition).length;
    const uniqueSpeakers = [...new Set(segments.map(s => s.speaker))];

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => prevStudy && navigateToStudy(prevStudy.studyNumber)}
                            disabled={!prevStudy}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <select
                            value={currentStudyNumber}
                            onChange={(e) => navigateToStudy(parseInt(e.target.value))}
                            className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm font-medium"
                        >
                            {studyList.map(study => (
                                <option key={study.studyNumber} value={study.studyNumber}>
                                    Quran Study {study.studyNumber}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => nextStudy && navigateToStudy(nextStudy.studyNumber)}
                            disabled={!nextStudy}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-sm text-white/60">
                            {segments.length} segments • {transitionCount} transitions • {uniqueSpeakers.length} speakers
                        </span>

                        {saveMessage && (
                            <span className={`text-sm ${saveMessage.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
                                {saveMessage}
                            </span>
                        )}

                        <button
                            onClick={saveChanges}
                            disabled={!hasChanges || saving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-white/10 disabled:text-white/40 rounded-lg font-medium text-sm transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </header>

            {/* Audio Player */}
            <div className="sticky top-[60px] z-40 bg-[#111]/95 backdrop-blur border-b border-white/10 px-4 py-3">
                <div className="max-w-6xl mx-auto flex items-center gap-4">
                    <button
                        onClick={handlePlayPause}
                        className="p-3 bg-green-600 hover:bg-green-700 rounded-full"
                    >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>

                    <div className="flex-1">
                        <input
                            type="range"
                            min={0}
                            max={audioRef.current?.duration || 0}
                            value={currentTime}
                            onChange={(e) => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = parseFloat(e.target.value);
                                }
                            }}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <span className="text-sm font-mono text-white/60 w-24 text-right">
                        {formatTime(currentTime)} / {formatTime(audioRef.current?.duration || 0)}
                    </span>

                    <audio
                        ref={audioRef}
                        src={initialStudyData?.audioUrl || undefined}
                        preload="metadata"
                    />
                </div>
            </div>

            {/* Transcript */}
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="space-y-1">
                    {segments.map((segment, idx) => (
                        <div key={segment.id}>
                            {/* Transition marker */}
                            {segment.isTransition && idx > 0 && (
                                <div className="flex items-center gap-2 py-2 text-xs text-yellow-500/70">
                                    <div className="flex-1 h-px bg-yellow-500/30" />
                                    <span>SPEAKER CHANGE</span>
                                    <div className="flex-1 h-px bg-yellow-500/30" />
                                </div>
                            )}

                            <div
                                className={`
                  group flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer
                  ${activeSegmentId === segment.id ? 'bg-green-500/20 border border-green-500/30' : 'hover:bg-white/5'}
                  ${modifiedSegments.has(segment.id) ? 'border-l-2 border-l-yellow-500' : ''}
                `}
                                onClick={() => seekTo(segment.start_time)}
                            >
                                {/* Timestamp */}
                                <span className="text-xs font-mono text-white/40 w-16 flex-shrink-0 pt-0.5">
                                    {formatTime(segment.start_time)}
                                </span>

                                {/* Speaker */}
                                <div className="w-60 flex-shrink-0">
                                    {editingId === segment.id ? (
                                        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                                            <select
                                                value={editValue}
                                                onChange={e => {
                                                    if (e.target.value === 'Other...') {
                                                        selectSpeaker(segment.id, 'Other...');
                                                    } else {
                                                        setEditValue(e.target.value);
                                                    }
                                                }}
                                                className="bg-[#222] border border-white/20 rounded px-2 py-1 text-sm"
                                                autoFocus
                                            >
                                                {KNOWN_SPEAKERS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => confirmEdit(segment.id)}
                                                    className="flex-1 p-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                                                >
                                                    <Check className="w-3 h-3 mx-auto" />
                                                </button>
                                                <button
                                                    onClick={cancelEdit}
                                                    className="flex-1 p-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                                                >
                                                    <X className="w-3 h-3 mx-auto" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); startEdit(segment); }}
                                            className="text-left text-sm font-medium text-green-400 hover:text-green-300 flex items-center gap-1 group/edit w-full"
                                        >
                                            <span>{segment.speaker}</span>
                                            <Edit2 className="w-3 h-3 opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
                                        </button>
                                    )}
                                </div>

                                {/* Content */}
                                <p className="text-sm text-white/80 flex-1">
                                    {segment.content}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
