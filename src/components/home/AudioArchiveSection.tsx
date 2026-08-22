'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, ArrowRight } from 'lucide-react';
import { Reveal } from './Reveal';
import { GlassSheen, widgetCardClass } from './WidgetAccents';
import QuranStudyThumbnail from '@/components/media/QuranStudyThumbnail';

type AudioCategory = 'quran-study' | 'messenger';

interface TranscriptLine {
    time: string;
    seconds: number;
    text: string;
    speaker: string;
}

interface AudioTrack {
    id: string;
    catalogNo: string;
    qsNumber?: number;
    category: AudioCategory;
    categoryLabel: string;
    title: string;
    speaker: string;
    date: string;
    duration: string;
    thumbnail?: string;
    summary: string;
    transcriptLines: TranscriptLine[];
    href: string;
}

const FEATURED_TRACKS: AudioTrack[] = [
    {
        id: 'qs01',
        catalogNo: 'QS-01',
        qsNumber: 1,
        category: 'quran-study',
        categoryLabel: "Qur'an Study Sequence",
        title: 'Quran Study 01 — Surah 72:19-28 & 73 — Jinns',
        speaker: 'Dr. Rashad Khalifa & Catherine',
        date: 'May 26, 1989',
        duration: '44:12',
        summary: 'Detailed verse-by-verse exposition of Chapter 72:19-28 (The Jinns) and Chapter 73 (The Enwrapped One), focusing on the message of God\'s servants, human ego vs God alone, and the night prayer.',
        transcriptLines: [
            { time: '00:00', seconds: 0, speaker: 'Dr. Khalifa', text: 'Dr. Khalifa introduces Catherine and opens the Friday evening study.' },
            { time: '00:15', seconds: 15, speaker: 'Catherine', text: 'Reading Sura Seventy-Two Verses: When God\'s servant advocated Him alone, they almost crowded around him.' },
            { time: '01:26', seconds: 86, speaker: 'Catherine', text: 'The places of worship belong to God alone; therefore, do not call on anyone else beside God.' },
            { time: '02:00', seconds: 120, speaker: 'Catherine', text: 'Overcoming the human ego and submitting totally to God alone without idols.' },
        ],
        href: '/media/quran-study/01%20Quran%20Study%20From%20Azhar%201%20Sura%2072;19%2028%20&%20Sura%2073%20By%20Kathryn%20Jinns%2005%2026%201989',
    },
    {
        id: 'qs07',
        catalogNo: 'QS-07',
        qsNumber: 7,
        category: 'quran-study',
        categoryLabel: "Qur'an Study Sequence",
        title: "Quran Study 07 — Surah 62 & 63 — God's Religion Will Dominate",
        speaker: 'Dr. Rashad Khalifa',
        date: 'March 24, 1989',
        duration: '46:30',
        summary: 'Momentous announcement regarding the authorized English translation, historical manuscript integrity, and verse-by-verse analysis of Suras 62 and 63.',
        transcriptLines: [
            { time: '00:01', seconds: 1, speaker: 'Dr. Khalifa', text: 'Momentous announcement regarding the preservation and presentation of the Quran.' },
            { time: '01:06', seconds: 66, speaker: 'Dr. Khalifa', text: 'Examining historical human alterations and proving the mathematical preservation of the pure text.' },
            { time: '02:47', seconds: 167, speaker: 'Dr. Khalifa', text: 'Announcing the completion of the new authorized English version coming in Ramadan.' },
            { time: '04:10', seconds: 250, speaker: 'Dr. Khalifa', text: 'Rejecting idolization of human intermediaries and returning to pure Quranic devotion.' },
        ],
        href: '/media/quran-study/07%20Quran%20Study%20From%20Azhar%207%20Sura%2062%20&%20Sura%2063%20By%20Kathryn%20God\'s%20Religion%20Will%20Dominate%20In%2020%20To%2050%20Yr',
    },
    {
        id: 'ma56',
        catalogNo: 'MA-56',
        category: 'messenger',
        categoryLabel: 'Messenger Audio Archive',
        title: 'Friday Sermon: Quran Multiplied by Hadith Equals Zero',
        speaker: 'Dr. Rashad Khalifa',
        date: 'October 29, 1982',
        duration: '38:15',
        thumbnail: '/content/audios/messenger-audios/default.jpg',
        summary: 'Dr. Rashad Khalifa delivers a sermon on Sura 9:120, standing firm on divine truth, and demonstrating that adding human hearsay to the Quran nullifies the message.',
        transcriptLines: [
            { time: '00:00', seconds: 0, speaker: 'Mu\'adhin', text: 'Opening Call to Prayer (Adhan) at the Mosque in Tucson.' },
            { time: '00:58', seconds: 58, speaker: 'Dr. Khalifa', text: 'Introducing the visual manuscript slides and proofs of divine composition.' },
            { time: '01:56', seconds: 116, speaker: 'Dr. Khalifa', text: 'Sura 9:120 and standing firm for God\'s truth without compromising with popular falsehood.' },
            { time: '04:55', seconds: 295, speaker: 'Dr. Khalifa', text: 'The mathematical equation: The Quran is complete (100). Multiply by Hadith and the result is zero.' },
        ],
        href: '/media/messenger-audio/56%20Friday%20Sermon%2029%20Oct%201982%20By%20Dr%20Rashad%20Khalifa',
    },
    {
        id: 'ma62',
        catalogNo: 'MA-62',
        category: 'messenger',
        categoryLabel: 'Messenger Audio Archive',
        title: 'Friday Sermon: Abraham as True Founder of Divine Worship',
        speaker: 'Dr. Rashad Khalifa',
        date: 'November 26, 1982',
        duration: '34:20',
        thumbnail: '/content/audios/messenger-audios/default.jpg',
        summary: 'Exploration of universal monotheism, the legacy of Abraham as the father of worship rites, and prioritizing personal spiritual connection over worldly pursuits.',
        transcriptLines: [
            { time: '00:01', seconds: 1, speaker: 'Dr. Khalifa', text: 'Accepting the Quran alone as fully detailed, sufficient guidance for salvation.' },
            { time: '01:14', seconds: 74, speaker: 'Dr. Khalifa', text: 'Maintaining perspective on worldly pursuits versus nourishing the eternal soul.' },
            { time: '02:02', seconds: 122, speaker: 'Dr. Khalifa', text: 'Observing the personal miracles and divine guidance God places directly in our daily lives.' },
            { time: '03:13', seconds: 193, speaker: 'Dr. Khalifa', text: 'Abraham received all the practices of Submission (Salat, Zakat, Fasting, Hajj) from God Almighty.' },
        ],
        href: '/media/messenger-audio/62%20Friday%20Sermon%2026%20Nov%201982%20By%20Dr%20Rashad%20Khalifa',
    },
];

const NOTABLE_EXCERPTS = [
    {
        quote: 'The places of worship belong to God alone; therefore, do not call on anyone else beside God.',
        source: 'Sura 72:18 · QS-01 Master Tape',
        timestamp: '04:22',
    },
    {
        quote: 'Hear, O Israel, the Lord our God, the Lord is One. And you shall love the Lord your God with all your heart.',
        source: 'Deut 6:4 / Mark 12:29 · MA-88-04 Lecture',
        timestamp: '08:12',
    },
    {
        quote: 'Shall I seek other than God as a lawmaker, when He has revealed to you this book fully detailed?',
        source: 'Sura 6:114 · Azhar Dialogue 1989',
        timestamp: '01:20',
    },
];

export function AudioArchiveSection() {
    const [activeTab, setActiveTab] = useState<AudioCategory>('quran-study');
    const [selectedTrackId, setSelectedTrackId] = useState<string>(FEATURED_TRACKS[0].id);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [activeLineIndex, setActiveLineIndex] = useState<number>(0);
    const [playbackSpeed, setPlaybackSpeed] = useState<string>('1.0x');
    const [isHovered, setIsHovered] = useState<boolean>(false);

    const filteredTracks = FEATURED_TRACKS.filter((t) => t.category === activeTab);
    const activeTrack = FEATURED_TRACKS.find((t) => t.id === selectedTrackId) ?? filteredTracks[0];
    const currentLine = activeTrack.transcriptLines[activeLineIndex] ?? activeTrack.transcriptLines[0];

    // Automatic cycling through audio tracks every 7 seconds
    useEffect(() => {
        if (isHovered || isPlaying || filteredTracks.length <= 1) return;

        const interval = setInterval(() => {
            setSelectedTrackId((prevId) => {
                const currentIndex = filteredTracks.findIndex((t) => t.id === prevId);
                const nextIndex = (currentIndex + 1) % filteredTracks.length;
                return filteredTracks[nextIndex].id;
            });
            setActiveLineIndex(0);
        }, 7000);

        return () => clearInterval(interval);
    }, [isHovered, isPlaying, filteredTracks]);

    return (
        <article
            className="space-y-8"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Header & Description */}
            <div>
                <Reveal>
                    <h2 className="font-serif text-[clamp(1.85rem,3.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-ed-fg">
                        Audio Archives
                    </h2>
                </Reveal>
                <Reveal delay={80}>
                    <p
                        className="mt-3 max-w-3xl text-base leading-[1.65] text-ed-fg-secondary sm:text-lg"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Digitized original cassette masters, verse-by-verse Qur&apos;an study sessions, and spoken messenger archives with real-time synchronized teleprompter transcripts.
                    </p>
                </Reveal>
                <div className="mt-4 h-[2px] w-20 bg-ed-accent" />
            </div>

            {/* Collection Category Switcher */}
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('quran-study');
                        setSelectedTrackId('qs01');
                        setActiveLineIndex(0);
                    }}
                    className={`rounded-lg px-4 py-1.5 font-sans text-xs font-semibold transition-all duration-200 ${
                        activeTab === 'quran-study'
                            ? 'border border-ed-accent bg-ed-accent-soft text-ed-accent dark:text-ed-fg shadow-sm'
                            : 'border border-ed-rule bg-ed-surface text-ed-fg-secondary hover:border-ed-rule-strong hover:text-ed-fg'
                    }`}
                >
                    Qur&apos;an Study Sequences (QS-01–20)
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setActiveTab('messenger');
                        setSelectedTrackId('ma-1988-unity');
                        setActiveLineIndex(0);
                    }}
                    className={`rounded-lg px-4 py-1.5 font-sans text-xs font-semibold transition-all duration-200 ${
                        activeTab === 'messenger'
                            ? 'border border-ed-accent bg-ed-accent-soft text-ed-accent dark:text-ed-fg shadow-sm'
                            : 'border border-ed-rule bg-ed-surface text-ed-fg-secondary hover:border-ed-rule-strong hover:text-ed-fg'
                    }`}
                >
                    Messenger Audio Archives (1980–1990)
                </button>
            </div>

            {/* Master Tape Listening Console */}
            <Reveal delay={120}>
                <div className={widgetCardClass}>
                    <GlassSheen />

                    {/* Console Header Bar */}
                    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-ed-rule bg-ed-surface px-4 py-3 sm:px-6 select-none">
                        <div className="flex items-center gap-3">
                            <span className="flex h-6 items-center rounded bg-ed-accent/15 px-2 font-mono text-xs font-bold text-ed-accent border border-ed-accent/30">
                                {activeTrack.catalogNo}
                            </span>
                            <span className="font-sans text-xs font-medium text-ed-fg-secondary">
                                {activeTrack.categoryLabel}
                            </span>
                            <span className="text-ed-fg-faint" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-ed-fg-muted">
                                Masjid Tucson Master Vault
                            </span>
                        </div>

                        <div className="flex items-center gap-3 font-sans text-xs text-ed-fg-muted">
                            <span>Speaker: <strong className="text-ed-fg">{activeTrack.speaker}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>{activeTrack.date}</span>
                        </div>
                    </div>

                    {/* Console Body: Left Player Deck & Right Teleprompter Transcript */}
                    <div className="grid gap-0 lg:grid-cols-[1.1fr_1.3fr]">
                        {/* Player Deck (Left) - Enhanced Room Utilization */}
                        <div className="p-6 sm:p-8 bg-ed-bg border-b border-ed-rule lg:border-b-0 lg:border-r flex flex-col justify-between">
                            <div>
                                {/* High-Impact CSS/Image Thumbnail */}
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-ed-rule bg-ed-surface shadow-md">
                                    {activeTrack.qsNumber ? (
                                        <QuranStudyThumbnail qsNumber={activeTrack.qsNumber} />
                                    ) : activeTrack.thumbnail ? (
                                        <Image
                                            src={activeTrack.thumbnail}
                                            alt={activeTrack.title}
                                            fill
                                            quality={80}
                                            sizes="(min-width: 1024px) 50vw, 100vw"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-ed-surface text-ed-fg-muted font-sans text-xs">
                                            Audio Master Archive
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5">
                                    <h3 className="font-serif text-lg font-semibold leading-snug text-ed-fg sm:text-xl">
                                        {activeTrack.title}
                                    </h3>
                                    <p className="mt-1 font-sans text-xs text-ed-fg-secondary">
                                        Analog Tape Remaster · {activeTrack.duration} · Speaker: {activeTrack.speaker}
                                    </p>
                                </div>

                                {/* Simulated Tactile Waveform Bars */}
                                <div className="mt-5 rounded-xl border border-ed-rule bg-ed-surface p-4">
                                    <div className="flex items-center justify-between pb-2 text-xs font-sans text-ed-fg-muted">
                                        <span>Current Cue: <strong className="text-ed-accent font-mono">{currentLine.time}</strong></span>
                                        <span>Total: <strong className="font-mono text-ed-fg-secondary">{activeTrack.duration}</strong></span>
                                    </div>

                                    {/* Waveform graphic */}
                                    <div className="flex h-12 items-center gap-[3px] py-1">
                                        {Array.from({ length: 44 }).map((_, i) => {
                                            const heightPercent = Math.round(Math.max(15, Math.min(100, 20 + Math.sin(i * 0.45) * 35 + ((i * 17) % 45))));
                                            const isPast = i < 18;
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        height: `${heightPercent}%`,
                                                        backgroundColor: isPast ? 'var(--ed-accent)' : 'var(--ed-rule-strong)',
                                                        opacity: isPast ? 0.95 : 0.5,
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Playback Control Bar */}
                                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-ed-rule">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-ed-accent text-white dark:text-[#0F0E0D] shadow-md transition-all hover:opacity-90 hover:scale-105 active:scale-95"
                                                aria-label={isPlaying ? 'Pause audio preview' : 'Play audio preview'}
                                            >
                                                {isPlaying ? (
                                                    <Pause className="h-3.5 w-3.5 fill-current" />
                                                ) : (
                                                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                                                )}
                                            </button>
                                            <span className="font-sans text-xs text-ed-fg font-medium">
                                                {isPlaying ? 'Auditioning Stream' : 'Ready to Audition'}
                                            </span>
                                        </div>

                                        {/* Speed Controls */}
                                        <div className="flex items-center gap-1">
                                            {['1.0x', '1.25x', '1.5x'].map((spd) => (
                                                <button
                                                    key={spd}
                                                    type="button"
                                                    onClick={() => setPlaybackSpeed(spd)}
                                                    className={`rounded px-2 py-0.5 font-mono text-[0.65rem] font-semibold transition-colors ${
                                                        playbackSpeed === spd
                                                            ? 'border border-ed-accent/60 bg-ed-accent/20 text-ed-accent dark:text-ed-fg'
                                                            : 'text-ed-fg-muted hover:text-ed-fg'
                                                    }`}
                                                >
                                                    {spd}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Rich Track Summary Description Below Waveform */}
                                <div className="mt-4 rounded-xl border border-ed-rule bg-ed-surface/50 p-3.5">
                                    <p
                                        className="text-xs leading-relaxed text-ed-fg-secondary"
                                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                    >
                                        {activeTrack.summary}
                                    </p>
                                </div>
                            </div>

                            {/* Launch Player Button */}
                            <div className="mt-6">
                                <Link
                                    href={activeTrack.href}
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-ed-accent bg-ed-accent px-5 py-2.5 font-sans text-xs font-semibold text-white dark:text-[#0F0E0D] shadow-md transition-all hover:opacity-90 hover:scale-[1.01]"
                                >
                                    <span>Launch Dedicated Audio Suite</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Synchronized Teleprompter Transcript (Right) */}
                        <div className="flex flex-col justify-between bg-ed-surface p-6 sm:p-8">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-ed-rule">
                                    <span className="font-sans text-xs font-semibold text-ed-fg">
                                        Synchronized Transcript
                                    </span>
                                    <span className="font-sans text-xs text-ed-fg-muted">
                                        Click line to seek
                                    </span>
                                </div>

                                {/* Interactive Transcript Lines */}
                                <div className="mt-4 space-y-3">
                                    {activeTrack.transcriptLines.map((line, lIdx) => {
                                        const isLineActive = lIdx === activeLineIndex;
                                        return (
                                            <button
                                                key={line.text}
                                                type="button"
                                                onClick={() => setActiveLineIndex(lIdx)}
                                                className={`group flex w-full items-start gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-200 ${
                                                    isLineActive
                                                        ? 'border-ed-accent/60 bg-ed-accent/10 text-ed-fg shadow-sm'
                                                        : 'border-ed-rule bg-ed-bg/60 text-ed-fg-secondary hover:border-ed-rule-strong hover:bg-ed-bg hover:text-ed-fg'
                                                }`}
                                            >
                                                <span className={`inline-flex h-6 min-w-12 items-center justify-center rounded font-mono text-xs font-semibold shrink-0 ${
                                                    isLineActive
                                                        ? 'bg-ed-accent text-white dark:text-[#0F0E0D]'
                                                        : 'border border-ed-rule bg-ed-surface text-ed-accent'
                                                }`}>
                                                    {line.time}
                                                </span>
                                                <div className="min-w-0">
                                                    <p
                                                        className="text-xs leading-relaxed sm:text-sm italic"
                                                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                    >
                                                        &ldquo;{line.text}&rdquo;
                                                    </p>
                                                    <span className="mt-1 block font-sans text-[0.7rem] text-ed-fg-muted">
                                                        Speaker: {line.speaker}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Other Tracks in Category */}
                            <div className="mt-6 pt-4 border-t border-ed-rule">
                                <span className="block font-sans text-[0.7rem] font-semibold text-ed-fg-muted mb-2">
                                    More Tapes in this Collection
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {filteredTracks.map((trk) => (
                                        <button
                                            key={trk.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTrackId(trk.id);
                                                setActiveLineIndex(0);
                                            }}
                                            className={`rounded-md px-3 py-1 font-sans text-xs transition-all ${
                                                trk.id === activeTrack.id
                                                    ? 'border border-ed-accent bg-ed-accent/20 text-ed-accent dark:text-ed-fg font-bold'
                                                    : 'border border-ed-rule bg-ed-bg text-ed-fg-secondary hover:text-ed-fg'
                                            }`}
                                        >
                                            {trk.catalogNo} · {trk.title.split(':')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Console Footer Callout */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule bg-ed-surface px-4 py-3 sm:px-6">
                        <Link
                            href="/audios"
                            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-ed-fg hover:text-ed-accent transition-colors"
                        >
                            <span>Explore all 600+ master tapes and studies</span>
                            <ArrowRight className="h-3.5 w-3.5 text-ed-accent" />
                        </Link>
                        <span className="font-sans text-xs text-ed-fg-muted">
                            Line-by-Line Timestamp Matching System
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* Direct Spoken Evidence Quotes Shelf */}
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {NOTABLE_EXCERPTS.map((item, idx) => (
                    <Reveal key={item.source} delay={160 + idx * 80}>
                        <div className="group flex h-full flex-col justify-between rounded-xl border border-ed-rule bg-ed-surface p-5 shadow-sm transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface-strong">
                            <div>
                                <p
                                    className="text-xs sm:text-sm leading-relaxed text-ed-fg italic"
                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                >
                                    &ldquo;{item.quote}&rdquo;
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-ed-rule flex items-center justify-between font-sans text-xs text-ed-fg-muted">
                                <span>{item.source}</span>
                                <span className="text-ed-accent font-mono font-semibold">{item.timestamp}</span>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </article>
    );
}