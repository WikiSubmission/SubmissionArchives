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
        categoryLabel: 'Qur\'an Study Sequence',
        title: 'Sura 72–73: Jinns and the Night Prayer',
        speaker: 'Dr. Rashad Khalifa',
        date: 'May 26, 1989',
        duration: '18:42',
        summary: 'Detailed verse-by-verse exposition of Chapter 72 (The Jinns) and Chapter 73 (The Enwrapped One), focusing on the nature of unseen entities, God alone worship, and the institution of nightly prayer.',
        transcriptLines: [
            { time: '00:15', seconds: 15, speaker: 'Dr. Khalifa', text: 'When God\'s servant advocated Him alone, they almost crowded around him in solid groups.' },
            { time: '04:22', seconds: 262, speaker: 'Dr. Khalifa', text: 'The places of worship belong to God alone; do not call on anyone else beside God.' },
            { time: '09:40', seconds: 580, speaker: 'Dr. Khalifa', text: 'Sura 73 tells us to meditate during the night, except a little. It gives the soul its nourishment.' },
            { time: '14:10', seconds: 850, speaker: 'Dr. Khalifa', text: 'Your Lord knows that you stand up during two-thirds of the night, or half of it, or one-third.' },
        ],
        href: '/audios/quran-studies/01-quran-study',
    },
    {
        id: 'qs07',
        catalogNo: 'QS-07',
        qsNumber: 7,
        category: 'quran-study',
        categoryLabel: 'Qur\'an Study Sequence',
        title: 'Sura 62–63: Friday Prayer & Hypocrites',
        speaker: 'Dr. Rashad Khalifa',
        date: 'March 24, 1989',
        duration: '22:15',
        summary: 'Exposition of Friday congregational obligations, avoiding commercial distraction, and recognizing the psychological markers of hypocrisy described in Sura 63.',
        transcriptLines: [
            { time: '01:05', seconds: 65, speaker: 'Dr. Khalifa', text: 'O you who believe, when the call to prayer is announced on Friday, you shall hasten to the commemoration of God.' },
            { time: '06:30', seconds: 390, speaker: 'Dr. Khalifa', text: 'Drop all business; this is better for you if you only knew.' },
            { time: '12:18', seconds: 738, speaker: 'Dr. Khalifa', text: 'When the hypocrites come to you, they say: "We bear witness that you are God\'s messenger." But God knows.' },
            { time: '18:05', seconds: 1085, speaker: 'Dr. Khalifa', text: 'Do not let your wealth or your children distract you from commemorating God.' },
        ],
        href: '/audios/quran-studies/07-quran-study',
    },
    {
        id: 'ma-1988-unity',
        catalogNo: 'MA-88-04',
        category: 'messenger',
        categoryLabel: 'Messenger Audio Archive',
        title: 'Devotion to God Alone — The Great Commandment',
        speaker: 'Dr. Rashad Khalifa',
        date: 'October 1988',
        duration: '31:40',
        thumbnail: '/content/audios/messenger-audio/thumbnails/26-08-31-89-submission-the-religion-of-abraham-purification-and-salat.webp',
        summary: 'A definitive theological talk delivered in Tucson, Arizona examining the unity of the First Commandment across the Torah, the Gospel of Jesus, and the Holy Qur\'an.',
        transcriptLines: [
            { time: '00:45', seconds: 45, speaker: 'Dr. Khalifa', text: 'Hear O Israel, the Lord our God, the Lord is One. This is Deuteronomy 6:4.' },
            { time: '08:12', seconds: 492, speaker: 'Dr. Khalifa', text: 'And Jesus answered in Mark 12:29: The first of all commandments is: Hear O Israel, the Lord our God is One.' },
            { time: '15:35', seconds: 935, speaker: 'Dr. Khalifa', text: 'And in the Qur\'an, Sura 3:18: God bears witness that there is no god except He, and so do the angels and those who possess knowledge.' },
            { time: '24:50', seconds: 1490, speaker: 'Dr. Khalifa', text: 'Submission to God is not a name of a club; it is the universal religion of Abraham.' },
        ],
        href: '/audios/messenger-audio/submission-the-religion-of-abraham',
    },
    {
        id: 'ma-1989-azhar',
        catalogNo: 'MA-89-11',
        category: 'messenger',
        categoryLabel: 'Messenger Audio Archive',
        title: 'Historical Debate with Azhar Scholars (Cairo)',
        speaker: 'Dr. Rashad Khalifa',
        date: 'March 1989',
        duration: '45:10',
        thumbnail: '/content/audios/quran-studies/thumbnails/14-quran-study-from-azhar-14-sura-84-and-sura-85-by-kathryn-quran-is-all-we-need.jpg',
        summary: 'Direct dialogue with scholars regarding the sufficiency of the Qur\'an, the rejection of fabricated traditions, and physical mathematical evidence.',
        transcriptLines: [
            { time: '01:20', seconds: 80, speaker: 'Dr. Khalifa', text: 'The Qur\'an tells us in Sura 6:114: Shall I seek other than God as a source of law, when He revealed this book fully detailed?' },
            { time: '11:05', seconds: 665, speaker: 'Dr. Khalifa', text: 'God\'s word is complete in truth and justice; nothing can abrogate His words.' },
            { time: '22:40', seconds: 1360, speaker: 'Dr. Khalifa', text: 'We present the physical manuscript counts so that anyone can count for themselves.' },
            { time: '36:15', seconds: 2175, speaker: 'Dr. Khalifa', text: 'Truth stands clear from falsehood. We invite everyone to verify.' },
        ],
        href: '/audios/messenger-audio/quran-is-all-we-need',
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
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                <Reveal>
                    <div>
                        <h2 className="font-serif text-[clamp(1.85rem,3.6vw,2.5rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F5F0EB]">
                            Audio Archives
                        </h2>
                        <div className="mt-2 h-[2px] w-20 bg-[#C8794A]" />
                    </div>
                </Reveal>
                <Reveal delay={80}>
                    <p
                        className="text-base leading-[1.65] text-[#9E9690] sm:text-lg"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        Digitized original cassette masters, verse-by-verse Qur&apos;an study sessions, and spoken messenger archives with real-time synchronized teleprompter transcripts.
                    </p>
                </Reveal>
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
                            ? 'border border-[#C8794A] bg-[#C8794A]/15 text-[#F5F0EB] shadow-sm'
                            : 'border border-[#2A2928] bg-[#161514] text-[#9E9690] hover:border-[#353433] hover:text-[#F5F0EB]'
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
                            ? 'border border-[#C8794A] bg-[#C8794A]/15 text-[#F5F0EB] shadow-sm'
                            : 'border border-[#2A2928] bg-[#161514] text-[#9E9690] hover:border-[#353433] hover:text-[#F5F0EB]'
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
                    <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-[#2A2928] bg-[#161514] px-4 py-3 sm:px-6 select-none">
                        <div className="flex items-center gap-3">
                            <span className="flex h-6 items-center rounded bg-[#C8794A]/20 px-2 font-mono text-xs font-bold text-[#C8794A] border border-[#C8794A]/30">
                                {activeTrack.catalogNo}
                            </span>
                            <span className="font-sans text-xs font-medium text-[#9E9690]">
                                {activeTrack.categoryLabel}
                            </span>
                            <span className="text-[#6B6560]" aria-hidden="true">·</span>
                            <span className="font-sans text-xs text-[#6B6560]">
                                Masjid Tucson Master Vault
                            </span>
                        </div>

                        <div className="flex items-center gap-3 font-sans text-xs text-[#6B6560]">
                            <span>Speaker: <strong className="text-[#F5F0EB]">{activeTrack.speaker}</strong></span>
                            <span aria-hidden="true">·</span>
                            <span>{activeTrack.date}</span>
                        </div>
                    </div>

                    {/* Console Body: Left Player Deck & Right Teleprompter Transcript */}
                    <div className="grid gap-0 lg:grid-cols-[1.1fr_1.3fr]">
                        {/* Player Deck (Left) - Enhanced Room Utilization */}
                        <div className="p-6 sm:p-8 bg-[#121110] border-b border-[#2A2928] lg:border-b-0 lg:border-r flex flex-col justify-between">
                            <div>
                                {/* High-Impact CSS/Image Thumbnail */}
                                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-[#2A2928] bg-[#090909] shadow-xl">
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
                                        <div className="flex h-full w-full items-center justify-center bg-[#161514] text-[#9E9690] font-sans text-xs">
                                            Audio Master Archive
                                        </div>
                                    )}
                                </div>

                                <div className="mt-5">
                                    <h3 className="font-serif text-lg font-semibold leading-snug text-[#F5F0EB] sm:text-xl">
                                        {activeTrack.title}
                                    </h3>
                                    <p className="mt-1 font-sans text-xs text-[#9E9690]">
                                        Analog Tape Remaster · {activeTrack.duration} · Speaker: {activeTrack.speaker}
                                    </p>
                                </div>

                                {/* Simulated Tactile Waveform Bars */}
                                <div className="mt-5 rounded-xl border border-[#2A2928] bg-[#0F0E0D] p-4">
                                    <div className="flex items-center justify-between pb-2 text-xs font-sans text-[#6B6560]">
                                        <span>Current Cue: <strong className="text-[#C8794A] font-mono">{currentLine.time}</strong></span>
                                        <span>Total: <strong className="font-mono text-[#9E9690]">{activeTrack.duration}</strong></span>
                                    </div>

                                    {/* Waveform graphic */}
                                    <div className="flex h-12 items-center gap-[3px] py-1">
                                        {Array.from({ length: 44 }).map((_, i) => {
                                            const heightPercent = 20 + Math.sin(i * 0.45) * 35 + ((i * 17) % 45);
                                            const isPast = i < 18;
                                            return (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        height: `${Math.max(15, Math.min(100, heightPercent))}%`,
                                                        backgroundColor: isPast ? '#C8794A' : '#2A2928',
                                                        opacity: isPast ? 0.95 : 0.45,
                                                    }}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Playback Control Bar */}
                                    <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#1C1B1A]">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsPlaying(!isPlaying)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8794A] text-[#0F0E0D] shadow-md transition-all hover:bg-[#D9916A] hover:scale-105 active:scale-95"
                                                aria-label={isPlaying ? 'Pause audio preview' : 'Play audio preview'}
                                            >
                                                {isPlaying ? (
                                                    <Pause className="h-3.5 w-3.5 fill-current" />
                                                ) : (
                                                    <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
                                                )}
                                            </button>
                                            <span className="font-sans text-xs text-[#F5F0EB]">
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
                                                            ? 'border border-[#C8794A]/60 bg-[#C8794A]/20 text-[#F5F0EB]'
                                                            : 'text-[#6B6560] hover:text-[#9E9690]'
                                                    }`}
                                                >
                                                    {spd}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Rich Track Summary Description Below Waveform */}
                                <div className="mt-4 rounded-xl border border-[#2A2928]/60 bg-[#161514]/40 p-3.5">
                                    <p
                                        className="text-xs leading-relaxed text-[#9E9690]"
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
                                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#C8794A] bg-[#C8794A] px-5 py-2.5 font-sans text-xs font-semibold text-[#0F0E0D] shadow-lg transition-all hover:bg-[#D9916A] hover:scale-[1.01]"
                                >
                                    <span>Launch Dedicated Audio Suite</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                        </div>

                        {/* Synchronized Teleprompter Transcript (Right) */}
                        <div className="flex flex-col justify-between bg-[#161514] p-6 sm:p-8">
                            <div>
                                <div className="flex items-center justify-between pb-3 border-b border-[#2A2928]">
                                    <span className="font-sans text-xs font-semibold text-[#F5F0EB]">
                                        Synchronized Transcript
                                    </span>
                                    <span className="font-sans text-xs text-[#6B6560]">
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
                                                        ? 'border-[#C8794A]/60 bg-[#C8794A]/10 text-[#F5F0EB] shadow-md'
                                                        : 'border-[#2A2928]/60 bg-[#121110]/50 text-[#9E9690] hover:border-[#353433] hover:bg-[#121110] hover:text-[#F5F0EB]'
                                                }`}
                                            >
                                                <span className={`inline-flex h-6 min-w-12 items-center justify-center rounded font-mono text-xs font-semibold shrink-0 ${
                                                    isLineActive
                                                        ? 'bg-[#C8794A] text-[#0F0E0D]'
                                                        : 'border border-[#2A2928] bg-[#161514] text-[#C8794A]'
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
                                                    <span className="mt-1 block font-sans text-[0.7rem] text-[#6B6560]">
                                                        Speaker: {line.speaker}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Other Tracks in Category */}
                            <div className="mt-6 pt-4 border-t border-[#2A2928]">
                                <span className="block font-sans text-[0.7rem] font-semibold text-[#6B6560] mb-2">
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
                                                    ? 'border border-[#C8794A] bg-[#C8794A]/20 text-[#F5F0EB] font-bold'
                                                    : 'border border-[#2A2928] bg-[#121110] text-[#9E9690] hover:text-[#F5F0EB]'
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
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2928] bg-[#161514] px-4 py-3 sm:px-6">
                        <Link
                            href="/audios"
                            className="inline-flex items-center gap-2 font-sans text-xs font-semibold text-[#F5F0EB] hover:text-[#C8794A] transition-colors"
                        >
                            <span>Explore all 600+ master tapes and studies</span>
                            <ArrowRight className="h-3.5 w-3.5 text-[#C8794A]" />
                        </Link>
                        <span className="font-sans text-xs text-[#6B6560]">
                            Line-by-Line Timestamp Matching System
                        </span>
                    </div>
                </div>
            </Reveal>

            {/* Direct Spoken Evidence Quotes Shelf */}
            <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
                {NOTABLE_EXCERPTS.map((item, idx) => (
                    <Reveal key={item.source} delay={160 + idx * 80}>
                        <div className="group flex h-full flex-col justify-between rounded-xl border border-[#2A2928] bg-[#161514] p-5 shadow-sm transition-all duration-200 hover:border-[#353433] hover:bg-[#1C1B1A]">
                            <div>
                                <p
                                    className="text-xs sm:text-sm leading-relaxed text-[#F5F0EB] italic"
                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                >
                                    &ldquo;{item.quote}&rdquo;
                                </p>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[#2A2928] flex items-center justify-between font-sans text-xs text-[#9E9690]">
                                <span>{item.source}</span>
                                <span className="text-[#C8794A] font-mono font-semibold">{item.timestamp}</span>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </article>
    );
}