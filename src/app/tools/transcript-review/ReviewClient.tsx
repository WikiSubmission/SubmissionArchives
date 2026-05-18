'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Pause,
    Play,
    Save,
    X,
} from 'lucide-react';

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

const KNOWN_SPEAKERS = [
    'Dr. Khalifa',
    'A woman',
    'A man',
    'Edip',
    'Catherine',
    'Abdullah',
    'Parivash',
    'Hamid',
    'Behrouz',
    'Dr. Sabahi',
    'Shakira',
    'Ismail Barakat',
    'A child',
    'Audience',
    'Martha',
    'Douglas',
    'Feroz',
    'Atif',
    'Lisa',
    'Lydia',
    'Robert',
    'Eric',
    'Apamea',
    'Naghmeh',
    'Other...',
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

export default function ReviewClient({
    studyList,
    initialStudyData,
    currentStudyNumber,
}: ReviewClientProps) {
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
    const [duration, setDuration] = useState(0);
    const [modifiedSegments, setModifiedSegments] = useState<Set<number>>(new Set());

    useEffect(() => {
        if (!initialStudyData) {
            return;
        }

        const timer = setTimeout(() => {
            setSegments(initialStudyData.segments);
            setHasChanges(false);
            setModifiedSegments(new Set());
            setSaveMessage('');
            setDuration(0);
        }, 0);

        return () => clearTimeout(timer);
    }, [initialStudyData]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) {
            return;
        }

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleLoadedMetadata = () => setDuration(audio.duration || 0);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    const navigateToStudy = (studyNumber: number) => {
        if (hasChanges && !confirm('You have unsaved changes. Navigate anyway?')) {
            return;
        }

        router.push(`/tools/transcript-review?study=${studyNumber}`);
        router.refresh();
    };

    const handlePlayPause = () => {
        if (!audioRef.current) {
            return;
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            void audioRef.current.play();
        }
    };

    const seekTo = (time: number) => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.currentTime = time;
        void audioRef.current.play();
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
        if (!editValue.trim()) {
            return;
        }

        const nextSpeaker = editValue.trim();
        const originalSpeaker = segments.find((segment) => segment.id === segmentId)?.speaker;

        setSegments((prev) =>
            prev.map((segment) =>
                segment.id === segmentId ? { ...segment, speaker: nextSpeaker } : segment,
            ),
        );

        if (originalSpeaker !== nextSpeaker) {
            setModifiedSegments((prev) => new Set(prev).add(segmentId));
            setHasChanges(true);
        }

        setEditingId(null);
        setEditValue('');
    };

    const selectSpeaker = (segmentId: number, speaker: string) => {
        if (speaker === 'Other...') {
            const customSpeaker = prompt('Enter speaker name:');
            if (!customSpeaker?.trim()) {
                return;
            }

            setSegments((prev) =>
                prev.map((segment) =>
                    segment.id === segmentId
                        ? { ...segment, speaker: customSpeaker.trim() }
                        : segment,
                ),
            );
        } else {
            setSegments((prev) =>
                prev.map((segment) =>
                    segment.id === segmentId ? { ...segment, speaker } : segment,
                ),
            );
        }

        setModifiedSegments((prev) => new Set(prev).add(segmentId));
        setHasChanges(true);
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
                    segments: segments.map((segment) => ({
                        id: segment.id,
                        segment_index: segment.segment_index,
                        start_time: segment.start_time,
                        end_time: segment.end_time,
                        content: segment.content,
                        speaker: segment.speaker,
                    })),
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                setSaveMessage(`Error: ${error.message}`);
                return;
            }

            setSaveMessage('Saved');
            setHasChanges(false);
            setModifiedSegments(new Set());
            setTimeout(() => setSaveMessage(''), 3000);
        } catch {
            setSaveMessage('Save failed');
        } finally {
            setSaving(false);
        }
    };

    const currentIndex = studyList.findIndex((study) => study.studyNumber === currentStudyNumber);
    const prevStudy = currentIndex > 0 ? studyList[currentIndex - 1] : null;
    const nextStudy = currentIndex < studyList.length - 1 ? studyList[currentIndex + 1] : null;
    const transitionCount = segments.filter((segment) => segment.isTransition).length;
    const uniqueSpeakers = [...new Set(segments.map((segment) => segment.speaker))];
    const modifiedCount = modifiedSegments.size;
    const activeSegmentId = useMemo(
        () =>
            segments.find(
                (item) => currentTime >= item.start_time && currentTime < item.end_time,
            )?.id ?? null,
        [currentTime, segments],
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#111111] text-[#f6efe4]">
            <div className="relative mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-10">
                <section className="border border-[#e9dfd3]/10 bg-[#181817]/75 px-5 py-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:px-7 lg:px-10 lg:py-8">
                    <div className="flex flex-col gap-8 border-b border-[#e9dfd3]/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl space-y-4">
                            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-[#f6ae82]/78">
                                Transcript Review
                            </p>
                            <div className="space-y-3">
                                <h1 className="max-w-2xl font-serif text-4xl leading-[0.95] text-[#f6efe4] sm:text-5xl lg:text-6xl">
                                    Tune speaker labels with a quieter, more readable review flow.
                                </h1>
                                <p className="max-w-2xl text-sm leading-7 text-[#d8ccbd]/72 sm:text-[15px]">
                                    This workspace keeps the dark atmosphere, but shifts the page toward an
                                    editorial cadence: broader margins, gentler separators, and typography that lets
                                    the transcript do the talking.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
                            <Stat label="Segments" value={segments.length.toString()} />
                            <Stat label="Transitions" value={transitionCount.toString()} />
                            <Stat label="Speakers" value={uniqueSpeakers.length.toString()} />
                            <Stat label="Pending edits" value={modifiedCount.toString()} />
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
                        <aside className="space-y-5">
                            <div className="space-y-3 border-b border-[#e9dfd3]/10 pb-5">
                                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d8ccbd]/52">
                                    Session
                                </p>
                                <div className="flex items-center gap-2">
                                    <NavButton
                                        direction="prev"
                                        disabled={!prevStudy}
                                        onClick={() =>
                                            prevStudy && navigateToStudy(prevStudy.studyNumber)
                                        }
                                    />

                                    <select
                                        value={currentStudyNumber}
                                        onChange={(e) => navigateToStudy(Number(e.target.value))}
                                        className="w-full appearance-none border border-[#e9dfd3]/12 bg-[#111111]/80 px-4 py-3 text-sm text-[#f6efe4] outline-none transition focus:border-[#f6ae82]/45"
                                    >
                                        {studyList.map((study) => (
                                            <option key={study.studyNumber} value={study.studyNumber}>
                                                Quran Study {study.studyNumber}
                                            </option>
                                        ))}
                                    </select>

                                    <NavButton
                                        direction="next"
                                        disabled={!nextStudy}
                                        onClick={() =>
                                            nextStudy && navigateToStudy(nextStudy.studyNumber)
                                        }
                                    />
                                </div>
                                <p className="text-sm leading-6 text-[#d8ccbd]/62">
                                    Study {currentStudyNumber}, {initialStudyData?.filename || 'No file selected'}
                                </p>
                            </div>

                            <div className="space-y-4 border-b border-[#e9dfd3]/10 pb-5">
                                <div className="flex items-center justify-between">
                                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d8ccbd]/52">
                                        Audio
                                    </p>
                                    <span className="text-xs uppercase tracking-[0.18em] text-[#d8ccbd]/44">
                                        {isPlaying ? 'Playing' : 'Paused'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handlePlayPause}
                                        className="flex h-14 w-14 items-center justify-center rounded-full border border-[#f6ae82]/25 bg-[#f6ae82]/12 text-[#f6efe4] transition hover:bg-[#f6ae82]/18"
                                    >
                                        {isPlaying ? (
                                            <Pause className="h-5 w-5" />
                                        ) : (
                                            <Play className="ml-0.5 h-5 w-5" />
                                        )}
                                    </button>

                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center justify-between gap-4 text-xs uppercase tracking-[0.18em] text-[#d8ccbd]/48">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={0}
                                            max={duration}
                                            value={currentTime}
                                            onChange={(e) => {
                                                if (audioRef.current) {
                                                    audioRef.current.currentTime = Number(
                                                        e.target.value,
                                                    );
                                                }
                                            }}
                                            className="transcript-range h-2 w-full cursor-pointer appearance-none bg-transparent"
                                        />
                                    </div>
                                </div>

                                <audio
                                    ref={audioRef}
                                    src={initialStudyData?.audioUrl || undefined}
                                    preload="metadata"
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d8ccbd]/52">
                                        Review state
                                    </p>
                                    {saveMessage ? (
                                        <span
                                            className={`text-xs uppercase tracking-[0.18em] ${
                                                saveMessage.startsWith('Error')
                                                    ? 'text-[#ff8b7c]'
                                                    : 'text-[#f6ae82]'
                                            }`}
                                        >
                                            {saveMessage}
                                        </span>
                                    ) : null}
                                </div>

                                <div className="space-y-3 text-sm leading-6 text-[#d8ccbd]/68">
                                    <p>
                                        Click any passage to jump playback, then correct the speaker in place without
                                        losing your reading position.
                                    </p>
                                    <p>
                                        Modified rows are softly marked so the page feels annotated, not highlighted
                                        like a dashboard alert.
                                    </p>
                                </div>

                                <button
                                    onClick={saveChanges}
                                    disabled={!hasChanges || saving}
                                    className="flex w-full items-center justify-center gap-2 border border-[#f6ae82]/20 bg-[#f6ae82]/12 px-4 py-3 text-sm uppercase tracking-[0.18em] text-[#f6efe4] transition hover:bg-[#f6ae82]/18 disabled:border-[#e9dfd3]/10 disabled:bg-[#e9dfd3]/6 disabled:text-[#d8ccbd]/32"
                                >
                                    <Save className="h-4 w-4" />
                                    {saving ? 'Saving' : hasChanges ? 'Save changes' : 'No changes'}
                                </button>
                            </div>
                        </aside>

                        <main className="min-w-0">
                            <div className="mb-6 flex items-center justify-between gap-4 border-b border-[#e9dfd3]/10 pb-4">
                                <div>
                                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d8ccbd]/52">
                                        Transcript
                                    </p>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d8ccbd]/62">
                                        A continuous reading view with just enough structure to track time, speaker
                                        changes, and active playback.
                                    </p>
                                </div>
                                <div className="hidden text-right md:block">
                                    <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d8ccbd]/44">
                                        Active window
                                    </p>
                                    <p className="mt-2 font-serif text-2xl text-[#f6efe4]">
                                        {formatTime(currentTime)}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {segments.map((segment, index) => {
                                    const isActive = activeSegmentId === segment.id;
                                    const isModified = modifiedSegments.has(segment.id);

                                    return (
                                        <div key={segment.id}>
                                            {segment.isTransition && index > 0 ? (
                                                <div className="flex items-center gap-4 py-5">
                                                    <div className="h-px flex-1 bg-[#e9dfd3]/10" />
                                                    <span className="text-[0.68rem] uppercase tracking-[0.22em] text-[#f6ae82]/72">
                                                        Speaker change
                                                    </span>
                                                    <div className="h-px flex-1 bg-[#e9dfd3]/10" />
                                                </div>
                                            ) : null}

                                            <article
                                                onClick={() => seekTo(segment.start_time)}
                                                className={`cursor-pointer border px-4 py-4 transition sm:px-5 ${
                                                    isActive
                                                        ? 'border-[#f6ae82]/24 bg-[#f6ae82]/8 shadow-[0_18px_50px_rgba(0,0,0,0.16)]'
                                                        : 'border-transparent hover:border-[#e9dfd3]/10 hover:bg-[#ffffff]/[0.025]'
                                                } ${isModified ? 'bg-[#961515]/[0.08]' : ''}`}
                                            >
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                                                    <div className="flex items-center gap-3 lg:w-[112px] lg:flex-col lg:items-start lg:gap-2">
                                                        <span className="font-mono text-xs tracking-[0.18em] text-[#d8ccbd]/42">
                                                            {formatTime(segment.start_time)}
                                                        </span>
                                                        {isModified ? (
                                                            <span className="inline-flex items-center gap-2 text-[0.63rem] uppercase tracking-[0.22em] text-[#ffb69c]">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-[#f6ae82]" />
                                                                Edited
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-3 flex flex-col gap-3 border-b border-[#e9dfd3]/8 pb-3 sm:flex-row sm:items-center sm:justify-between">
                                                            <div className="min-w-0">
                                                                {editingId === segment.id ? (
                                                                    <div
                                                                        className="flex flex-col gap-2 sm:max-w-xs"
                                                                        onClick={(event) => event.stopPropagation()}
                                                                    >
                                                                        <select
                                                                            value={editValue}
                                                                            onChange={(event) => {
                                                                                if (event.target.value === 'Other...') {
                                                                                    selectSpeaker(
                                                                                        segment.id,
                                                                                        'Other...',
                                                                                    );
                                                                                } else {
                                                                                    setEditValue(event.target.value);
                                                                                }
                                                                            }}
                                                                            className="border border-[#e9dfd3]/12 bg-[#111111]/80 px-3 py-2 text-sm text-[#f6efe4] outline-none transition focus:border-[#f6ae82]/45"
                                                                            autoFocus
                                                                        >
                                                                            {KNOWN_SPEAKERS.map((speaker) => (
                                                                                <option
                                                                                    key={speaker}
                                                                                    value={speaker}
                                                                                >
                                                                                    {speaker}
                                                                                </option>
                                                                            ))}
                                                                        </select>

                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() =>
                                                                                    confirmEdit(segment.id)
                                                                                }
                                                                                className="flex items-center gap-2 border border-[#f6ae82]/20 bg-[#f6ae82]/12 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#f6efe4] transition hover:bg-[#f6ae82]/18"
                                                                            >
                                                                                <Check className="h-3.5 w-3.5" />
                                                                                Apply
                                                                            </button>
                                                                            <button
                                                                                onClick={cancelEdit}
                                                                                className="flex items-center gap-2 border border-[#e9dfd3]/12 px-3 py-2 text-xs uppercase tracking-[0.16em] text-[#d8ccbd]/72 transition hover:bg-[#ffffff]/[0.035]"
                                                                            >
                                                                                <X className="h-3.5 w-3.5" />
                                                                                Cancel
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            startEdit(segment);
                                                                        }}
                                                                        className="group flex items-center gap-2 text-left"
                                                                    >
                                                                        <span className="font-serif text-2xl text-[#f6efe4]">
                                                                            {segment.speaker}
                                                                        </span>
                                                                        <Edit2 className="h-3.5 w-3.5 text-[#f6ae82]/0 transition group-hover:text-[#f6ae82]/80" />
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <span className="text-[0.68rem] uppercase tracking-[0.22em] text-[#d8ccbd]/44">
                                                                Segment {segment.segment_index + 1}
                                                            </span>
                                                        </div>

                                                        <p className="max-w-[72ch] font-sora text-[15px] leading-8 text-[#efe5d8]/88 sm:text-base">
                                                            {segment.content}
                                                        </p>
                                                    </div>
                                                </div>
                                            </article>
                                        </div>
                                    );
                                })}
                            </div>
                        </main>
                    </div>
                </section>
            </div>
        </div>
    );
}

function NavButton({
    direction,
    disabled,
    onClick,
}: {
    direction: 'prev' | 'next';
    disabled: boolean;
    onClick: () => void;
}) {
    const Icon = direction === 'prev' ? ChevronLeft : ChevronRight;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex h-12 w-12 items-center justify-center border border-[#e9dfd3]/12 bg-[#111111]/72 text-[#f6efe4] transition hover:border-[#f6ae82]/22 hover:bg-[#ffffff]/[0.035] disabled:text-[#d8ccbd]/28 disabled:hover:border-[#e9dfd3]/12 disabled:hover:bg-[#111111]/72"
        >
            <Icon className="h-4 w-4" />
        </button>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="border border-[#e9dfd3]/10 bg-[#111111]/56 px-4 py-4">
            <p className="text-[0.63rem] uppercase tracking-[0.2em] text-[#d8ccbd]/44">{label}</p>
            <p className="mt-3 font-serif text-3xl leading-none text-[#f6efe4]">{value}</p>
        </div>
    );
}
