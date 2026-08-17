'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Media } from '@/types/media';

export type TranscriptEntry = {
    id: string;
    speaker: 'khalifa' | 'catherine' | 'edip' | 'douglas' | 'beth' | string;
    speakerDisplay: string;
    time: string;
    seconds: number;
    text?: string;
    verseRef?: string;
    verseText?: string;
    arabicText?: string;
};

export type TocItem = {
    id: string;
    time: string;
    seconds: number;
    title: string;
};

type VideoDetailPageClientProps = {
    video: Media & {
        dateString?: string;
        description?: string;
        suras?: string;
        youtubeId?: string;
    };
    tocItems: TocItem[];
    transcript: TranscriptEntry[];
};

export default function VideoDetailPageClient({
    video,
    tocItems,
    transcript,
}: VideoDetailPageClientProps) {
    const [infoCollapsed, setInfoCollapsed] = useState(false);
    const [mobileTocOpen, setMobileTocOpen] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState<string>(tocItems[0]?.id ?? '');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = (msg: string) => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        setToastMessage(msg);
        toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 2500);
    };

    const copyLink = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(window.location.href).then(
                () => showToast('Link copied to clipboard'),
                () => showToast('Unable to copy link'),
            );
        }
    };

    const seekTo = (time: string) => {
        showToast(`Seek to ${time}`);
    };

    // Scroll-synchronized TOC highlight observer
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSectionId(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
        );

        const targets = document.querySelectorAll('.qs-entry[id]');
        targets.forEach((t) => observer.observe(t));

        return () => observer.disconnect();
    }, [transcript]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            if (e.code === 'Space' || e.key === 'k') {
                e.preventDefault();
                setIsPlaying((prev) => !prev);
            }
            if (e.key === '/' || e.key === 's') {
                e.preventDefault();
                document.getElementById('transcript-search')?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Filter and match counts
    const filteredEntries = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return transcript.map((entry) => ({ ...entry, matches: true }));

        return transcript.map((entry) => {
            const fullText = `${entry.speakerDisplay} ${entry.text ?? ''} ${entry.verseText ?? ''} ${entry.verseRef ?? ''} ${entry.arabicText ?? ''}`.toLowerCase();
            return {
                ...entry,
                matches: fullText.includes(q),
            };
        });
    }, [transcript, searchQuery]);

    const visibleCount = filteredEntries.filter((e) => e.matches).length;

    return (
        <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans selection:bg-[#C8794A]/25">
            {/* Archival Ambient Lighting */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.015) 0%, transparent 70%)',
                }}
            />

            {/* Toast Feedback */}
            <div
                className={`toast ${toastMessage ? 'show' : ''}`}
                role="status"
                aria-live="polite"
            >
                {toastMessage}
            </div>

            <div className="qs-container relative z-[1] py-8 sm:py-12">
                {/* Breadcrumb */}
                <nav className="mb-5 flex items-center gap-2 text-[12px] font-medium text-[#4A4542]" aria-label="Breadcrumb">
                    <a href="/videos" className="text-[#6B6560] transition-colors hover:text-[#C8794A]">
                        Video
                    </a>
                    <span className="text-[#353433]">/</span>
                    <a href="/videos" className="text-[#6B6560] transition-colors hover:text-[#C8794A]">
                        {video.type ?? 'Quran Study'}
                    </a>
                    <span className="text-[#353433]">/</span>
                    <span className="text-[#6B6560]">{video.id.toUpperCase()}</span>
                </nav>

                {/* Video Player Stage */}
                <section className="relative" aria-label="Video Player">
                    <div
                        className="qs-video-player group cursor-pointer"
                        onClick={() => setIsPlaying(!isPlaying)}
                        role="button"
                        tabIndex={0}
                        aria-label="Play video"
                    >
                        {video.youtubeId && isPlaying ? (
                            <iframe
                                className="h-full w-full"
                                src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1`}
                                title={video.displayTitle ?? video.title}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <>
                                <div className="qs-thumbnail-content">
                                    <div className="qs-thumbnail-label">
                                        {video.type ?? 'Quran Study'} &mdash; {video.id.toUpperCase()}
                                    </div>
                                    <h1 className="qs-thumbnail-title">
                                        {video.displayTitle ?? video.title}
                                    </h1>
                                    <div className="qs-thumbnail-meta">
                                        {video.suras ? `${video.suras} · ` : ''}
                                        {video.dateString ?? 'Masjid Tucson'}
                                    </div>
                                </div>

                                <div className="qs-play-overlay">
                                    <div className="qs-play-button" aria-hidden="true">
                                        <div className="qs-play-icon" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Program Information Bar */}
                    <div className="mt-1 pt-7">
                        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#2A2928] pb-5">
                            <div className="min-w-0 flex-1">
                                <div className="mb-3.5 flex items-baseline gap-3">
                                    <h2
                                        className="text-[clamp(22px,3vw,28px)] font-semibold leading-[1.1] tracking-[-0.01em] text-[#F5F0EB]"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        {video.displayTitle ?? video.title}
                                    </h2>
                                    <button
                                        onClick={() => setInfoCollapsed(!infoCollapsed)}
                                        className="text-[#6B6560] transition-colors hover:text-[#9E9690]"
                                        title={infoCollapsed ? 'Expand details' : 'Collapse details'}
                                        aria-expanded={!infoCollapsed}
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className={`transition-transform duration-300 ${infoCollapsed ? '-rotate-90' : ''}`}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center gap-3.5 text-[12px] font-medium text-[#6B6560]">
                                    <span className="font-semibold text-[#C8794A]">{video.type ?? 'Quran Study'}</span>
                                    <div className="h-1 w-1 rounded-full bg-[#4A4542]" />
                                    <span>{video.dateString ?? 'Preserved Recording'}</span>
                                    <div className="h-1 w-1 rounded-full bg-[#4A4542]" />
                                    <span>{video.author ?? 'Dr. Rashad Khalifa'}</span>
                                    {video.duration_seconds && (
                                        <>
                                            <div className="h-1 w-1 rounded-full bg-[#4A4542]" />
                                            <span className="tabular-nums font-mono">{formatDuration(video.duration_seconds)}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={copyLink}
                                    className="inline-flex min-h-[36px] items-center justify-center rounded-[4px] border border-[#2A2928] bg-transparent px-4 py-2 text-[13px] font-medium text-[#9E9690] transition-all hover:border-[#353433] hover:bg-[#161514] hover:text-[#F5F0EB]"
                                >
                                    Copy Link
                                </button>
                                <button
                                    onClick={() => showToast('Preparing transcript download...')}
                                    className="inline-flex min-h-[36px] items-center justify-center rounded-[4px] border border-[#C8794A] bg-[#C8794A] px-4 py-2 text-[13px] font-medium text-[#0F0E0D] transition-colors hover:bg-[#D9916A]"
                                >
                                    Download Transcript
                                </button>
                            </div>
                        </div>

                        {/* Collapsible Overview */}
                        <div
                            className={`overflow-hidden transition-all duration-400 ease-out ${infoCollapsed ? 'max-h-0 opacity-0 pt-0' : 'max-h-[300px] opacity-100 pt-5'
                                }`}
                        >
                            <p
                                className="text-[16px] leading-[1.65] text-[#9E9690]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                {video.description ??
                                    'Preserved study recording and verse commentary, exploring the Quranic mathematical structure and the foundational teachings of God alone.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 2-Column Content Grid: Table of Contents + Transcript */}
                <div className="qs-content-grid">
                    {/* Sidebar TOC */}
                    <aside className="qs-sidebar" aria-label="Table of Contents">
                        <button
                            onClick={() => setMobileTocOpen(!mobileTocOpen)}
                            className="toc-mobile-toggle"
                            aria-expanded={mobileTocOpen}
                        >
                            <span>
                                Contents <span className="font-normal text-[#4A4542]">&mdash; {tocItems.length} topics</span>
                            </span>
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transition-transform duration-300 ${mobileTocOpen ? 'rotate-180' : ''}`}
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        <div className={`toc-mobile-body ${mobileTocOpen ? 'open' : ''}`}>
                            <div className="toc-header">
                                <span className="toc-title">Contents</span>
                                <span className="toc-count">{tocItems.length} topics</span>
                            </div>

                            <ul className="toc-list space-y-0.5">
                                {tocItems.map((item) => {
                                    const isActive = activeSectionId === item.id;
                                    return (
                                        <li key={item.id} className="toc-item">
                                            <a
                                                href={`#${item.id}`}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                                                    setActiveSectionId(item.id);
                                                    setMobileTocOpen(false);
                                                }}
                                                className="qs-toc-link"
                                                data-active={isActive}
                                            >
                                                <span className="toc-time qs-toc-time">{item.time}</span>
                                                <span className="toc-text">{item.title}</span>
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </aside>

                    {/* Main Transcript Stream */}
                    <main className="min-w-0 flex-1">
                        <div className="mb-5 flex items-baseline justify-between border-b border-[#2A2928] pb-3">
                            <h2
                                className="text-[22px] font-semibold text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                Transcript
                            </h2>
                            <button
                                onClick={() => setSearchQuery('')}
                                className="text-[12px] font-medium tracking-[0.06em] text-[#4A4542] hover:text-[#C8794A] transition-colors"
                            >
                                Reset View
                            </button>
                        </div>

                        {/* Transcript Toolbar */}
                        <div className="transcript-toolbar mb-4">
                            <div className="search-box">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    id="transcript-search"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search transcript..."
                                    autoComplete="off"
                                />
                            </div>
                            <span className="entry-count text-[12px] font-mono text-[#4A4542]">
                                {visibleCount} shown
                            </span>
                        </div>

                        {/* Transcript Entries */}
                        <div className="space-y-0">
                            {filteredEntries.map((entry) => {
                                if (!entry.matches) return null;

                                return (
                                    <article
                                        key={entry.id}
                                        id={entry.id}
                                        className="qs-entry"
                                        data-speaker={entry.speaker}
                                    >
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <span className={`qs-entry-speaker ${entry.speaker}`}>
                                                {entry.speakerDisplay}
                                            </span>
                                            <span
                                                onClick={() => seekTo(entry.time)}
                                                className="qs-entry-time"
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {entry.time}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            {entry.text && (
                                                <p className="qs-entry-text">
                                                    <HighlightedText text={entry.text} query={searchQuery} />
                                                </p>
                                            )}

                                            {entry.verseRef && (
                                                <div className="qs-verse-block">
                                                    <span className="mr-2">[{entry.verseRef}]</span>
                                                    {entry.verseText && (
                                                        <HighlightedText text={entry.verseText} query={searchQuery} />
                                                    )}
                                                </div>
                                            )}

                                            {entry.arabicText && (
                                                <div className="qs-arabic-block" dir="rtl">
                                                    {entry.arabicText}
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </main>
                </div>

                <footer className="mt-20 border-t border-[#2A2928] py-9 text-center text-[12px] font-medium tracking-[0.04em] text-[#4A4542]">
                    Dedicated to preserving and sharing the message of God alone.
                </footer>
            </div>
        </div>
    );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
    if (!query.trim()) return <>{text}</>;

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <>
            {parts.map((part, index) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <mark key={index} className="qs-highlight">
                        {part}
                    </mark>
                ) : (
                    part
                ),
            )}
        </>
    );
}

function formatDuration(seconds?: number): string | null {
    if (!seconds || seconds <= 0) return null;
    const total = Math.floor(seconds);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}h ${m}m` : `${m}:${ss}`;
}