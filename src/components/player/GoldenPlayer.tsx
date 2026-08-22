"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search, X, Download, SkipBack, SkipForward,
  Play, Pause, Volume2, VolumeX, Share2, ChevronDown,
  Locate, LocateFixed, ArrowLeft, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useGlobalPlayer } from "@/components/player/GlobalMediaPlayer";
import { getMediaHref } from "@/lib/utils";
import { QURAN_STUDY_SLIDES } from "@/data/quran-study-thumbnail-data";
import { type ChapterMarker } from "@/lib/transcriptParagraphs";
import dynamic from "next/dynamic";
import "./golden-player.css";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

/* ==================== TYPES ==================== */

export interface Segment {
  id: number;
  start_time: number;
  end_time: number;
  speaker: string;
  content: string;
  segment_index?: number;
}

export interface MediaItem {
  id: string;
  type: string;
  title: string;
  displayTitle: string;
  displayDate: string;
  author: string;
  description?: string;
  local_filename?: string;
  thumbnailOverride?: string;
  folder?: string;
  videoFile?: string;
  vttFile?: string;
  duration_seconds?: number;
  primaryNumber?: number | string;
  alternateNumbers?: string[];
  chapters?: ChapterMarker[];
}

export interface GoldenPlayerProps {
  media: MediaItem;
  segments: Segment[];
  segments_ar?: Segment[];
  mediaUrl: string;
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
  clipStartTime?: number;
  clipEndTime?: number;
  initialSeekTime?: number;
  initialTranscriptLang?: TranscriptLang;
  transcriptDisclaimer?: string;
}

/* ==================== UTILS ==================== */

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatDurationHuman(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSpeakerSlug(speaker: string): string {
  const s = speaker.toLowerCase();
  if (s.includes("khalifa") || s.includes("rashad")) return "khalifa";
  // The 1987 debate attributes by side rather than by individual, so the opposing
  // party needs its own colour for the exchange to be readable as an exchange.
  if (s.includes("sunni scholar")) return "scholars";
  if (s.includes("catherine") || s.includes("robinson")) return "catherine";
  if (s.includes("edip") || s.includes("yuksel")) return "edip";
  if (s.includes("douglas")) return "douglas";
  if (s.includes("beth")) return "beth";
  return "default";
}

function getSpeakerDisplayName(speaker: string): string {
  const slug = getSpeakerSlug(speaker);
  if (slug === "khalifa") return "Dr. Khalifa";
  if (slug === "catherine") return "Catherine Robinson";
  if (slug === "edip") return "Edip Yuksel";
  if (slug === "douglas") return "Douglas";
  if (slug === "beth") return "Beth";
  return speaker || "Speaker";
}

type TranscriptLang = "en" | "ar";

const TRANSCRIPT_LANG_LABELS: Record<TranscriptLang, string> = {
  en: "English",
  ar: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
};

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const VERSE_CITATION_REGEX = /^\[\d+:\d+(?:-\d+)?\]/;

/* ==================== TYPE-AWARE HELPERS ==================== */

function getMediaTypeLabel(type: string): string {
  switch (type) {
    case "quran-study": return "Quran Study";
    case "messenger-audio": return "Messenger Audio";
    case "video-program": return "Video Program";
    default: return type.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
}

function getMediaCatalogLink(type: string): { href: string; label: string } {
  switch (type) {
    case "quran-study": return { href: "/audios", label: "Quran Study" };
    case "messenger-audio": return { href: "/audios", label: "Messenger Audio" };
    case "video-program": return { href: "/videos", label: "Videos" };
    default: return { href: "/archive", label: "Archive" };
  }
}

function getMediaShortId(media: MediaItem): string {
  const type = media.type;
  const num = typeof media.primaryNumber === "number"
    ? media.primaryNumber
    : Number(media.primaryNumber) || 0;

  if (type === "quran-study" && num > 0) return `QS ${String(num).padStart(2, "0")}`;
  if (type === "messenger-audio" && num > 0) return `MA ${String(num).padStart(2, "0")}`;
  // For videos, use a truncated title
  const title = media.displayTitle || media.title;
  return title.length > 40 ? title.slice(0, 37) + "…" : title;
}

function isVideoType(type: string): boolean {
  return type === "video-program";
}

/* ==================== COMPONENT ==================== */

export default function GoldenPlayer({
  media,
  segments: englishSegments,
  segments_ar: arabicSegments,
  mediaUrl,
  prev,
  next,
  initialSeekTime,
  initialTranscriptLang,
}: GoldenPlayerProps) {
  /* ---------- State ---------- */
  // A record carries a second segment list only when the source playlist has an
  // "<title> - Arabic.csv" companion transcript, as the 1987 Sunni Scholars debate
  // does: one recording, captioned twice. The toggle below picks which of the two
  // the transcript panel reads from, so the pair stays a single catalog entry.
  const [transcriptLang, setTranscriptLang] = useState<TranscriptLang>(initialTranscriptLang ?? "en");
  const [isPlaying, setIsPlaying] = useState(Boolean(initialSeekTime));
  const [hasStartedPlayback, setHasStartedPlayback] = useState(true);
  const [absoluteTime, setAbsoluteTime] = useState(initialSeekTime ?? 0);
  const [duration, setDuration] = useState(media.duration_seconds || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [autoTrack, setAutoTrack] = useState(true);

  /* ---------- Transcript Language ---------- */
  const hasArabicTranscript = (arabicSegments?.length ?? 0) > 0;
  const isArabicTranscript = hasArabicTranscript && transcriptLang === "ar";
  const segments = isArabicTranscript ? (arabicSegments as Segment[]) : englishSegments;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastProgrammaticScrollRef = useRef(0);
  const hasSeekedToInitial = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  /* ---------- Type-Aware Derived Data ---------- */
  const mediaType = media.type;
  const isVideo = isVideoType(mediaType);
  const typeLabel = getMediaTypeLabel(mediaType);
  const catalogLink = getMediaCatalogLink(mediaType);
  const shortId = getMediaShortId(media);

  // QS-specific slide data (only for quran-study)
  const qsNum = typeof media.primaryNumber === "number" ? media.primaryNumber : Number(media.primaryNumber) || 1;
  const slideData = mediaType === "quran-study" ? QURAN_STUDY_SLIDES[qsNum] : null;

  const chapters = useMemo(() => {
    if (media.chapters && media.chapters.length > 0) return media.chapters;
    return [];
  }, [media.chapters]);

  const hasChapters = chapters.length > 0;

  /* ---------- Search Debounce ---------- */
  useEffect(() => {
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 150);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchQuery]);

  /* ---------- Toast helper ---------- */
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  /* ---------- Active Segment & Chapter ---------- */
  const activeSegmentIndex = useMemo(() => {
    if (segments.length === 0) return -1;
    for (let i = 0; i < segments.length; i++) {
      if (absoluteTime >= segments[i].start_time && absoluteTime < segments[i].end_time) {
        return i;
      }
    }
    return -1;
  }, [absoluteTime, segments]);

  const activeChapterIndex = useMemo(() => {
    if (chapters.length === 0) return -1;
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (absoluteTime >= chapters[i].startTime) {
        return i;
      }
    }
    return 0;
  }, [absoluteTime, chapters]);

  /* ---------- Filtered Segments ---------- */
  const { filteredSegments, matchCount } = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return { filteredSegments: segments, matchCount: 0 };
    }
    const q = debouncedSearch.toLowerCase().trim();
    let count = 0;
    const filtered = segments.filter((seg) => {
      const match = seg.content.toLowerCase().includes(q) || seg.speaker.toLowerCase().includes(q);
      if (match) {
        const matches = seg.content.toLowerCase().split(q).length - 1;
        count += Math.max(1, matches);
      }
      return match;
    });
    return { filteredSegments: filtered, matchCount: count };
  }, [segments, debouncedSearch]);

  /* ---------- Seek Action ---------- */
  const seekToTime = useCallback((timeInSeconds: number, label?: string) => {
    if (playerRef.current) {
      playerRef.current.seekTo(timeInSeconds, "seconds");
    }
    setAbsoluteTime(timeInSeconds);
    setIsPlaying(true);
    setHasStartedPlayback(true);
    if (label) {
      showToast(`Seek to ${label}`);
    } else {
      showToast(`Seek to ${formatTime(timeInSeconds)}`);
    }

    const segKey = `seg-${Math.floor(timeInSeconds)}`;
    const el = document.getElementById(segKey);
    if (el) {
      lastProgrammaticScrollRef.current = Date.now();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showToast]);

  /* ---------- Auto-scroll tracking ---------- */
  useEffect(() => {
    if (!autoTrack || activeSegmentIndex === -1 || debouncedSearch) return;
    const seg = segments[activeSegmentIndex];
    if (!seg) return;
    const el = document.getElementById(`entry-${seg.id ?? activeSegmentIndex}`);
    if (el) {
      lastProgrammaticScrollRef.current = Date.now();
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSegmentIndex, autoTrack, debouncedSearch, segments]);

  /* ---------- User Scroll Detection (disengages auto-track) ---------- */
  useEffect(() => {
    const handleUserScroll = () => {
      // Ignore programmatic smooth scrolling
      if (Date.now() - lastProgrammaticScrollRef.current < 850) return;
      setAutoTrack(false);
    };

    window.addEventListener("wheel", handleUserScroll, { passive: true });
    window.addEventListener("touchmove", handleUserScroll, { passive: true });
    window.addEventListener("scroll", handleUserScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleUserScroll);
      window.removeEventListener("touchmove", handleUserScroll);
      window.removeEventListener("scroll", handleUserScroll);
    };
  }, []);

  /* ---------- Sync To Active Cue ---------- */
  const syncToActive = useCallback(() => {
    setAutoTrack(true);
    if (activeSegmentIndex !== -1) {
      const seg = segments[activeSegmentIndex];
      if (seg) {
        const el = document.getElementById(`entry-${seg.id ?? activeSegmentIndex}`);
        if (el) {
          lastProgrammaticScrollRef.current = Date.now();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
    showToast("Transcript synced to playback");
  }, [activeSegmentIndex, segments, showToast]);

  /* ---------- URL Timestamp Sync ---------- */
  const lastSyncedTimeRef = useRef(-1);
  useEffect(() => {
    const seconds = Math.floor(absoluteTime);
    if (seconds <= 0) return;
    if (Math.abs(seconds - lastSyncedTimeRef.current) < 2) return;
    lastSyncedTimeRef.current = seconds;
    const params = new URLSearchParams(window.location.search);
    params.set("t", String(seconds));
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [absoluteTime]);

  /* ---------- Global Player Handoff ---------- */
  const { playTrack } = useGlobalPlayer();
  const handoffRef = useRef({
    isPlaying: false,
    time: 0,
    url: mediaUrl,
    title: media.displayTitle,
    id: media.id,
  });
  useEffect(() => {
    handoffRef.current = {
      isPlaying,
      time: absoluteTime,
      url: mediaUrl,
      title: media.displayTitle,
      id: media.id,
    };
  }, [isPlaying, absoluteTime, mediaUrl, media.displayTitle, media.id]);

  useEffect(
    () => () => {
      const { isPlaying: wasPlaying, time, url, title, id } = handoffRef.current;
      if (wasPlaying && url) {
        playTrack({ id, title, url, href: getMediaHref(id) }, time);
      }
    },
    [playTrack]
  );

  /* ---------- Actions ---------- */
  const copyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Link copied to clipboard");
    }).catch(() => {
      showToast("Unable to copy link");
    });
  };

  // Search matches and the "N shown" count are language-specific, so a query typed
  // against one transcript is meaningless against the other and is cleared on switch.
  //
  // The choice is mirrored into `?lang=` so a reader can link someone to the Arabic
  // side of a bilingual record. replaceState rather than push: switching language is
  // not a navigation, and the back button should still leave the page.
  const switchTranscriptLang = useCallback((lang: TranscriptLang) => {
    setTranscriptLang(lang);
    setSearchQuery("");
    setDebouncedSearch("");
    const url = new URL(window.location.href);
    if (lang === "en") {
      url.searchParams.delete("lang");
    } else {
      url.searchParams.set("lang", lang);
    }
    window.history.replaceState(null, "", url.toString());
    showToast(`${TRANSCRIPT_LANG_LABELS[lang]} transcript`);
  }, [showToast]);

  const downloadTranscript = () => {
    const text = segments
      .map((s) => `[${formatTime(s.start_time)}] ${getSpeakerDisplayName(s.speaker)}: ${s.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = media.displayTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const langSuffix = hasArabicTranscript ? `_${transcriptLang}` : "";
    a.download = `${filename}_transcript${langSuffix}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Transcript downloaded");
  };

  const expandAll = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    showToast("Transcript reset");
  };

  /* ---------- Keyboard Shortcuts ---------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === "Escape") {
          setSearchQuery("");
          setDebouncedSearch("");
          (e.target as HTMLElement).blur();
        }
        return;
      }
      if (e.code === "Space" || e.key === "k" || e.key === "K") {
        e.preventDefault();
        setIsPlaying((p) => !p);
        setHasStartedPlayback(true);
      } else if (e.key === "j" || e.key === "J" || e.key === "ArrowLeft") {
        e.preventDefault();
        const nextTime = Math.max(0, absoluteTime - 10);
        seekToTime(nextTime);
      } else if (e.key === "l" || e.key === "L" || e.key === "ArrowRight") {
        e.preventDefault();
        const nextTime = absoluteTime + 10;
        seekToTime(nextTime);
      } else if (e.key === "/" || e.key === "s") {
        e.preventDefault();
        const input = document.getElementById("qsSearchInput");
        input?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [absoluteTime, seekToTime]);

  /* ---------- Highlight Text Renderer ---------- */
  const renderHighlightedContent = (content: string) => {
    if (!debouncedSearch.trim()) return content;
    const escaped = escapeRegex(debouncedSearch.trim());
    const parts = content.split(new RegExp(`(${escaped})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === debouncedSearch.toLowerCase().trim() ? (
        <mark key={i} className="qs-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  /* ---------- Derived Display Data ---------- */
  const stageTitle = slideData?.lines?.[1] || media.displayTitle;
  const stageMeta = slideData?.lines?.[0] || media.displayDate;
  const totalDurationDisplay = formatDurationHuman(duration || media.duration_seconds || 0);

  /* ---------- Thumbnail Label ---------- */
  const thumbnailLabel = mediaType === "quran-study"
    ? `Quran Study — QS ${String(qsNum).padStart(2, "0")}`
    : mediaType === "messenger-audio"
    ? `Messenger Audio — MA ${String(qsNum).padStart(2, "0")}`
    : typeLabel;

  return (
    <div className="qs-golden-player min-h-screen">
      {/* Page Background Ambient Glow */}
      <div className="qs-page-bg" />

      {/* Toast Notification */}
      <div className={`qs-toast ${toastMessage ? "show" : ""}`}>
        {toastMessage}
      </div>

      {/* Main Container */}
      <div className="qs-container py-6">
        {/* Top Navigation & Breadcrumbs */}
        <div className="qs-top-nav">
          <div className="flex items-center gap-3 flex-wrap">
            <Link href={catalogLink.href} className="qs-back-btn" title={`Back to ${catalogLink.label}`}>
              <ArrowLeft className="w-4 h-4" />
              <span>Back to {catalogLink.label}</span>
            </Link>

            <nav className="qs-breadcrumb" aria-label="Breadcrumb">
              <Link href="/">Home</Link>
              <span className="qs-breadcrumb-separator">/</span>
              <Link href={catalogLink.href}>{catalogLink.label}</Link>
              <span className="qs-breadcrumb-separator">/</span>
              <span style={{ color: "var(--qs-text-muted)" }}>{shortId}</span>
            </nav>
          </div>

          {(prev || next) && (
            <div className="qs-prev-next-nav">
              {prev ? (
                <Link
                  href={getMediaHref(prev.id)}
                  className="qs-nav-arrow-btn"
                  title={`Previous: ${prev.title}`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </Link>
              ) : (
                <span className="qs-nav-arrow-btn disabled" aria-disabled="true">
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Prev</span>
                </span>
              )}
              {next ? (
                <Link
                  href={getMediaHref(next.id)}
                  className="qs-nav-arrow-btn"
                  title={`Next: ${next.title}`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="qs-nav-arrow-btn disabled" aria-disabled="true">
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          )}
        </div>

        {/* ==================== HERO STAGE ==================== */}
        <div className="qs-video-stage">
          <div className="qs-video-player">
            {hasStartedPlayback ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black z-10">
                {isVideo ? (
                  /* ===== VIDEO PLAYER (YouTube / MP4) ===== */
                  <ReactPlayer
                    ref={playerRef}
                    url={mediaUrl}
                    playing={isPlaying}
                    controls={true}
                    width="100%"
                    height="100%"
                    playbackRate={playbackSpeed}
                    muted={isMuted}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onDuration={(d: number) => setDuration(d)}
                    onProgress={({ playedSeconds }: { playedSeconds: number }) => {
                      setAbsoluteTime(playedSeconds);
                    }}
                    onReady={() => {
                      if (initialSeekTime && !hasSeekedToInitial.current && playerRef.current) {
                        playerRef.current.seekTo(initialSeekTime, "seconds");
                        hasSeekedToInitial.current = true;
                      }
                    }}
                  />
                ) : mediaUrl.includes("youtube.com") || mediaUrl.includes("youtu.be") ? (
                  /* ===== AUDIO VIA YOUTUBE (rare but possible) ===== */
                  <ReactPlayer
                    ref={playerRef}
                    url={mediaUrl}
                    playing={isPlaying}
                    controls={true}
                    width="100%"
                    height="100%"
                    playbackRate={playbackSpeed}
                    muted={isMuted}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onDuration={(d: number) => setDuration(d)}
                    onProgress={({ playedSeconds }: { playedSeconds: number }) => {
                      setAbsoluteTime(playedSeconds);
                    }}
                    onReady={() => {
                      if (initialSeekTime && !hasSeekedToInitial.current && playerRef.current) {
                        playerRef.current.seekTo(initialSeekTime, "seconds");
                        hasSeekedToInitial.current = true;
                      }
                    }}
                  />
                ) : (
                  /* ===== AUDIO-ONLY PLAYER WITH VISUALIZER ===== */
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#14231d] to-[#0d1612]">
                    <ReactPlayer
                      ref={playerRef}
                      url={mediaUrl}
                      playing={isPlaying}
                      controls={false}
                      width="0"
                      height="0"
                      playbackRate={playbackSpeed}
                      muted={isMuted}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onDuration={(d: number) => setDuration(d)}
                      onProgress={({ playedSeconds }: { playedSeconds: number }) => {
                        setAbsoluteTime(playedSeconds);
                      }}
                      onReady={() => {
                        if (initialSeekTime && !hasSeekedToInitial.current && playerRef.current) {
                          playerRef.current.seekTo(initialSeekTime, "seconds");
                          hasSeekedToInitial.current = true;
                        }
                      }}
                    />
                    {/* Audio Player Visualizer & Controls */}
                    <div className="qs-audio-visualizer">
                      <div className="text-center space-y-2">
                        <div className="qs-thumbnail-label">{thumbnailLabel}</div>
                        <h2 className="text-2xl sm:text-3xl font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
                          {media.displayTitle}
                        </h2>
                        <p className="text-xs sm:text-sm text-[var(--qs-text-secondary)]">
                          {media.displayDate} · {getSpeakerDisplayName(media.author)}
                        </p>
                      </div>

                      {/* Progress Timeline */}
                      <div className="w-full space-y-2">
                        <input
                          type="range"
                          min={0}
                          max={duration || 100}
                          value={absoluteTime}
                          onChange={(e) => seekToTime(Number(e.target.value))}
                          aria-label="Playback progress"
                        />
                        <div className="flex justify-between text-xs font-mono text-[var(--qs-text-muted)] tabular-nums">
                          <span>{formatTime(absoluteTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Audio Controls Bar */}
                      <div className="qs-audio-controls">
                        <button
                          type="button"
                          onClick={() => seekToTime(Math.max(0, absoluteTime - 10))}
                          title="Rewind 10s"
                          className="p-2 text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)] transition-colors"
                        >
                          <SkipBack className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsPlaying(!isPlaying)}
                          title={isPlaying ? "Pause" : "Play"}
                          className="w-14 h-14 rounded-full bg-[var(--qs-accent)] hover:bg-[var(--qs-accent-hover)] text-[var(--qs-bg-primary)] flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                        >
                          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => seekToTime(absoluteTime + 10)}
                          title="Forward 10s"
                          className="p-2 text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)] transition-colors"
                        >
                          <SkipForward className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 border-l border-[var(--qs-border-subtle)] pl-4">
                          <button
                            type="button"
                            onClick={() => {
                              const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
                              const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                              setPlaybackSpeed(speeds[nextIdx]);
                              showToast(`${speeds[nextIdx]}x speed`);
                            }}
                            className="qs-speed-btn"
                          >
                            {playbackSpeed}x
                          </button>

                          <button
                            type="button"
                            onClick={() => setIsMuted(!isMuted)}
                            title={isMuted ? "Unmute" : "Mute"}
                            className="p-1.5 text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)]"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ===== GOLDEN THUMBNAIL SLIDE OVERLAY (pre-play) ===== */
              <div
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none"
                onClick={() => {
                  setHasStartedPlayback(true);
                  setIsPlaying(true);
                }}
              >
                <div className="qs-thumbnail-content">
                  <div className="qs-thumbnail-label">{thumbnailLabel}</div>
                  <div className="qs-thumbnail-title">{stageTitle}</div>
                  <div className="qs-thumbnail-meta">{stageMeta}</div>
                </div>

                <div className="qs-play-overlay">
                  <div className="qs-play-button" aria-hidden="true">
                    <div className="qs-play-icon" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Video / Audio Info Section */}
          <div className="qs-video-info">
            <div className="qs-info-header">
              {/* Title & Metadata */}
              <div className="qs-title-block">
                <div className="qs-title-row">
                  <h1>{media.displayTitle}</h1>
                  <button
                    type="button"
                    onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
                    className={`qs-collapse-btn ${isInfoCollapsed ? "collapsed" : ""}`}
                    title={isInfoCollapsed ? "Expand details" : "Collapse details"}
                    aria-expanded={!isInfoCollapsed}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                <div className="qs-meta-row">
                  <span className="qs-meta-item accent">{typeLabel}</span>
                  <span className="qs-meta-divider" />
                  <span className="qs-meta-item">{media.displayDate}</span>
                  <span className="qs-meta-divider" />
                  <span className="qs-meta-item">{getSpeakerDisplayName(media.author)}</span>
                  {totalDurationDisplay && (
                    <>
                      <span className="qs-meta-divider" />
                      <span className="qs-meta-item">{totalDurationDisplay}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="qs-action-group">
                <button type="button" onClick={copyLink} className="qs-btn">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>

                <button type="button" onClick={downloadTranscript} className="qs-btn qs-btn-primary">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Transcript</span>
                </button>
              </div>
            </div>

            {/* Collapsible Session Description */}
            <div className={`qs-info-body ${isInfoCollapsed ? "collapsed" : ""}`}>
              <p className="qs-description">
                {media.description ||
                  `${typeLabel} session featuring ${getSpeakerDisplayName(media.author)}. Recorded ${media.displayDate || "date unknown"}.`}
              </p>
            </div>
          </div>
        </div>

        {/* ==================== PLAYBACK CONTROLS (video-only, below stage) ==================== */}
        {isVideo && hasStartedPlayback && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 mt-4 mb-6">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => seekToTime(Math.max(0, absoluteTime - 10))}
                title="Back 10s (J)"
                className="qs-btn"
                style={{ padding: "8px", minHeight: "36px", minWidth: "36px" }}
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                className="w-11 h-11 rounded-full bg-[var(--qs-accent)] hover:bg-[var(--qs-accent-hover)] text-[var(--qs-bg-primary)] flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => seekToTime(absoluteTime + 10)}
                title="Forward 10s (L)"
                className="qs-btn"
                style={{ padding: "8px", minHeight: "36px", minWidth: "36px" }}
              >
                <SkipForward className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute" : "Mute"}
                className="qs-btn"
                style={{ padding: "8px", minHeight: "36px", minWidth: "36px" }}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[var(--qs-text-muted)] tabular-nums">
                {formatTime(absoluteTime)} / {formatTime(duration)}
              </span>
              <button
                type="button"
                onClick={() => {
                  const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
                  const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
                  setPlaybackSpeed(speeds[nextIdx]);
                  showToast(`${speeds[nextIdx]}x speed`);
                }}
                className="qs-speed-btn"
              >
                {playbackSpeed}x
              </button>
            </div>
          </div>
        )}

        {/* ==================== 2-COLUMN CONTENT GRID ==================== */}
        <div className={`qs-content-grid ${!hasChapters ? "qs-content-grid--no-sidebar" : ""}`}>
          {/* ========== LEFT SIDEBAR: TABLE OF CONTENTS (only when chapters exist) ========== */}
          {hasChapters && (
            <aside className="qs-sidebar" aria-label="Table of contents">
              {/* Mobile TOC Accordion Toggle */}
              <button
                type="button"
                onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
                className={`qs-toc-mobile-toggle ${isMobileTocOpen ? "open" : ""}`}
                aria-expanded={isMobileTocOpen}
              >
                <span>
                  Contents <span style={{ color: "var(--qs-text-faint)", fontWeight: 500 }}>— {chapters.length} topics</span>
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* TOC Body */}
              <div className={`qs-toc-mobile-body ${isMobileTocOpen ? "open" : ""}`}>
                <div className="qs-toc-header">
                  <span className="qs-toc-title">Contents</span>
                  <span className="qs-toc-count">{chapters.length} topics</span>
                </div>

                <ul className="qs-toc-list">
                  {chapters.map((ch, idx) => {
                    const isActive = activeChapterIndex === idx;
                    return (
                      <li key={ch.id ?? idx} className="qs-toc-item">
                        <button
                          type="button"
                          onClick={() => {
                            seekToTime(ch.startTime, ch.title);
                            setIsMobileTocOpen(false);
                          }}
                          data-active={isActive}
                          className="qs-toc-link"
                        >
                          <span className="qs-toc-time">{formatTime(ch.startTime)}</span>
                          <span className="qs-toc-text">{ch.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>
          )}

          {/* ========== RIGHT MAIN: TRANSCRIPT ========== */}
          <main className="qs-main-content">
            <section className="qs-section" aria-label="Transcript">
              {/* Section Header */}
              <div className="qs-section-header">
                <div className="flex items-center gap-3">
                  <h2 className="qs-section-title">Transcript</h2>
                  <div className="flex items-center gap-1 rounded border border-[var(--qs-border-subtle)] bg-[var(--qs-bg-surface)] p-0.5" role="group" aria-label="Viewing mode">
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-[var(--qs-accent)] text-[var(--qs-bg-primary)] transition-colors"
                    >
                      Transcript
                    </button>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-semibold rounded text-[var(--qs-text-secondary)] hover:text-[var(--qs-text-primary)] transition-colors"
                    >
                      Theater
                    </button>
                  </div>
                </div>
                <button type="button" onClick={expandAll} className="qs-section-action">
                  Expand All
                </button>
              </div>

              {/* Transcript Toolbar & Search */}
              <div className="qs-transcript-toolbar">
                <div className="qs-search-box">
                  <Search className="w-3.5 h-3.5" />
                  <input
                    id="qsSearchInput"
                    type="text"
                    aria-label="Search transcript"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transcript..."
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setDebouncedSearch("");
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--qs-text-faint)] hover:text-[var(--qs-text-primary)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {hasArabicTranscript && (
                    <div className="qs-lang-toggle" role="group" aria-label="Transcript language">
                      {(["en", "ar"] as const).map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          lang={lang}
                          onClick={() => switchTranscriptLang(lang)}
                          aria-pressed={transcriptLang === lang}
                          className="qs-lang-btn"
                        >
                          {TRANSCRIPT_LANG_LABELS[lang]}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (autoTrack) {
                        setAutoTrack(false);
                        showToast("Auto-track paused");
                      } else {
                        syncToActive();
                      }
                    }}
                    className={`qs-autotrack-btn ${autoTrack ? "active" : ""}`}
                    title={
                      autoTrack
                        ? "Auto-track active (scrolling manually pauses tracking)"
                        : "Auto-track paused — click to sync"
                    }
                  >
                    {autoTrack ? <LocateFixed className="w-3.5 h-3.5" /> : <Locate className="w-3.5 h-3.5" />}
                    <span>{autoTrack ? "Tracking" : "Sync"}</span>
                  </button>

                  <span className="qs-entry-count">{filteredSegments.length} shown</span>
                  {debouncedSearch.trim() && (
                    <span className="qs-search-results visible">{matchCount} {matchCount === 1 ? "match" : "matches"}</span>
                  )}
                </div>
              </div>

              {/* Transcript Entries List */}
              <div
                ref={transcriptRef}
                lang={isArabicTranscript ? "ar" : undefined}
                dir={isArabicTranscript ? "rtl" : undefined}
              >
                {filteredSegments.map((seg, idx) => {
                  const isSegActive = activeSegmentIndex === (seg.id ?? idx);
                  const speakerSlug = getSpeakerSlug(seg.speaker);
                  const speakerDisplay = getSpeakerDisplayName(seg.speaker);
                  // `qs-arabic-block` is a centred, tinted quotation frame, right for a
                  // short Arabic citation sitting inside English prose. In an all-Arabic
                  // transcript every row would match, turning the whole panel into a
                  // column of boxes, so there it renders as ordinary RTL body text.
                  const isArabicContent = !isArabicTranscript && ARABIC_REGEX.test(seg.content);
                  const isVerseQuote = VERSE_CITATION_REGEX.test(seg.content.trim());

                  return (
                    <article
                      key={seg.id ?? idx}
                      id={`entry-${seg.id ?? idx}`}
                      data-speaker={speakerSlug}
                      data-active={isSegActive}
                      onClick={() => {
                        seekToTime(seg.start_time);
                        setAutoTrack(true);
                      }}
                      className="qs-entry"
                    >
                      {/* Entry Header: Speaker + Timestamp */}
                      <div className="qs-entry-header">
                        <span className={`qs-entry-speaker ${speakerSlug}`}>
                          {speakerDisplay}
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            seekToTime(seg.start_time);
                            setAutoTrack(true);
                          }}
                          className="qs-entry-time"
                          title={`Seek to ${formatTime(seg.start_time)}`}
                        >
                          {formatTime(seg.start_time)}
                        </button>
                      </div>

                      {/* Entry Body */}
                      <div className="qs-entry-body">
                        {isArabicContent ? (
                          <div className="qs-arabic-block">
                            {renderHighlightedContent(seg.content)}
                          </div>
                        ) : isVerseQuote ? (
                          <div className="qs-verse-block">
                            {renderHighlightedContent(seg.content)}
                          </div>
                        ) : (
                          <p className={`qs-entry-text ${isArabicTranscript ? "qs-entry-text-ar" : ""}`}>
                            {renderHighlightedContent(seg.content)}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}

                {filteredSegments.length === 0 && (
                  <div className="text-center py-16 text-[var(--qs-text-muted)] text-sm">
                    No transcript entries matched &ldquo;{debouncedSearch}&rdquo;
                  </div>
                )}
              </div>

              {/* Floating Sync Button when user scrolls away and playback is active */}
              {!autoTrack && hasStartedPlayback && activeSegmentIndex !== -1 && (
                <div className="qs-floating-sync-wrap">
                  <button
                    type="button"
                    onClick={syncToActive}
                    className="qs-floating-sync-btn"
                    title="Sync transcript with current playback position"
                  >
                    <LocateFixed className="w-4 h-4" />
                    <span>Sync to playback ({formatTime(absoluteTime)})</span>
                  </button>
                </div>
              )}
            </section>
          </main>
        </div>

        {/* Bottom Adjacent Media Browser */}
        {(prev || next) && (
          <div className="qs-adjacent-media-grid">
            {prev ? (
              <Link href={getMediaHref(prev.id)} className="qs-adjacent-card prev">
                <div className="qs-adjacent-direction">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </div>
                <div className="qs-adjacent-title">{prev.title}</div>
              </Link>
            ) : (
              <div className="qs-adjacent-card-placeholder" />
            )}

            <Link href={catalogLink.href} className="qs-adjacent-card center">
              <div className="qs-adjacent-direction">
                <span>Browse All</span>
              </div>
              <div className="qs-adjacent-title">{catalogLink.label}</div>
            </Link>

            {next ? (
              <Link href={getMediaHref(next.id)} className="qs-adjacent-card next">
                <div className="qs-adjacent-direction">
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
                <div className="qs-adjacent-title">{next.title}</div>
              </Link>
            ) : (
              <div className="qs-adjacent-card-placeholder" />
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="qs-page-footer">
          Dedicated to preserving and sharing the message of God alone.
        </footer>
      </div>
    </div>
  );
}
