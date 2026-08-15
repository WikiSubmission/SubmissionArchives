"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Search, Copy, Check, X, BookOpen,
  ArrowLeft, ArrowRight, Download, SkipBack, SkipForward,
  Play, Pause, Gauge, Volume2, VolumeX, Share2, Link as LinkIcon,
  ChevronUp, ChevronDown, ChevronLeft, HelpCircle, Maximize2, Columns
} from "lucide-react";
import CiteButton from "@/components/ui/CiteButton";
import { useGlobalPlayer } from "@/components/player/GlobalMediaPlayer";
import { getMediaHref } from "@/lib/utils";

import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

/* ==================== TYPES ==================== */

interface Segment {
  id: number;
  start_time: number;
  end_time: number;
  speaker: string;
  content: string;
  segment_index?: number;
}

interface Media {
  id: string;
  type: string;
  title: string;
  displayTitle: string;
  displayDate: string;
  author: string;
  local_filename?: string;
  thumbnailOverride?: string;
  folder?: string;
  videoFile?: string;
  vttFile?: string;
  duration_seconds?: number;
  primaryNumber?: number | string;
  alternateNumbers?: string[];
  alternateNumberLabel?: string;
}

export interface PlayerProps {
  media: Media;
  segments: Segment[];
  segments_ar?: Segment[];
  mediaUrl: string;
  prev?: { id: string; title: string };
  next?: { id: string; title: string };
  clipStartTime?: number;
  clipEndTime?: number;
  initialSeekTime?: number;
  transcriptDisclaimer?: string;
}

/* ==================== UTILS ==================== */

const formatDuration = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m}:${s.toString().padStart(2, "0")}`;
};

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSegmentKey(seg: Segment, fallbackIndex: number): string | number {
  if (seg.segment_index !== undefined) return seg.segment_index;
  if (seg.id !== undefined) return seg.id;
  return fallbackIndex;
}

/* ==================== SUB-COMPONENTS ==================== */

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = escapeRegExp(query);
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="transcript-match-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ==================== MAIN COMPONENT ==================== */

export default function Player({
  media,
  segments,
  segments_ar,
  mediaUrl,
  prev,
  next,
  clipStartTime,
  clipEndTime,
  initialSeekTime,
  transcriptDisclaimer,
}: PlayerProps) {

  /* ---------- Core State ---------- */
  const [captionLanguage, setCaptionLanguage] = useState<"en" | "ar">("en");
  const activeSegments = captionLanguage === "ar" && segments_ar && segments_ar.length > 0 ? segments_ar : segments;

  const [absoluteTime, setAbsoluteTime] = useState(initialSeekTime ?? 0);
  const hasSeekedToInitialTime = useRef(false);

  const [viewMode, setViewMode] = useState<"split" | "theater" | "focus">("split");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [shareToastId, setShareToastId] = useState<number | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPlaying, setIsPlaying] = useState(Boolean(initialSeekTime));
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedPopover, setShowSpeedPopover] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [mobileTab, setMobileTab] = useState<"player" | "transcript">("player");
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [fontSize, setFontSize] = useState<number>(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const playerRef = useRef<any>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const speedPopoverRef = useRef<HTMLDivElement>(null);
  const miniSpeedPopoverRef = useRef<HTMLDivElement>(null);

  const fontSizes = ["text-sm", "text-base", "text-lg", "text-xl"];
  const hasTranscript = activeSegments.length > 0;
  const hasArabic = Boolean(segments_ar && segments_ar.length > 0);

  /* ---------- Sanitized Clip Times ---------- */
  const effectiveClipStartTime = Number.isFinite(clipStartTime) && clipStartTime! > 0 ? clipStartTime : undefined;
  const effectiveClipEndTime = Number.isFinite(clipEndTime) && clipEndTime! > (effectiveClipStartTime || 0) ? clipEndTime : undefined;
  const effectiveInitialSeekTime = Number.isFinite(initialSeekTime) && initialSeekTime! > 0 ? initialSeekTime : undefined;

  /* ---------- Active Segment ---------- */
  const activeSegmentIndex = useMemo(() => {
    if (activeSegments.length === 0) return -1;
    for (let i = 0; i < activeSegments.length; i++) {
      if (absoluteTime >= activeSegments[i].start_time && absoluteTime < activeSegments[i].end_time) {
        return i;
      }
    }
    return -1;
  }, [absoluteTime, activeSegments]);

  const activeSegment = activeSegmentIndex >= 0 ? activeSegments[activeSegmentIndex] : null;

  /* ---------- Search Matches ---------- */
  const searchMatches = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    const matches: { segmentIndex: number; segmentId: number }[] = [];
    activeSegments.forEach((seg, idx) => {
      if (seg.content.toLowerCase().includes(q) || seg.speaker.toLowerCase().includes(q)) {
        matches.push({ segmentIndex: idx, segmentId: seg.id ?? idx });
      }
    });
    return matches;
  }, [activeSegments, searchQuery]);

  const filteredSegments = useMemo(() => {
    if (!searchQuery) return activeSegments;
    const q = searchQuery.toLowerCase();
    return activeSegments.filter(
      (s) => s.content.toLowerCase().includes(q) || s.speaker.toLowerCase().includes(q)
    );
  }, [activeSegments, searchQuery]);

  /* ---------- Auto-scroll with User Interruption ---------- */
  useEffect(() => {
    if (!autoScroll || isUserScrolling || activeSegmentIndex === -1 || searchQuery) return;
    const segKey = getSegmentKey(activeSegments[activeSegmentIndex], activeSegmentIndex);
    const el = document.getElementById(`seg-${segKey}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [activeSegmentIndex, autoScroll, isUserScrolling, searchQuery, activeSegments]);

  /* ---------- User Scroll Detection ---------- */
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    const onScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(userScrollTimeoutRef.current);
      userScrollTimeoutRef.current = setTimeout(() => setIsUserScrolling(false), 2500);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

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

  const handleCopyText = useCallback(async (text: string, id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }, []);

  const handleSegmentClick = useCallback((startTime: number) => {
    if (playerRef.current) {
      playerRef.current.seekTo(startTime, "seconds");
      setIsPlaying(true);
    }
  }, []);

  const stateRef = useRef({
    absoluteTime,
    activeSegment,
    activeSegmentIndex,
    activeSegments,
    searchQuery,
    showSpeedPopover,
    showShortcutsHelp,
    viewMode,
  });

  useEffect(() => {
    stateRef.current = {
      absoluteTime,
      activeSegment,
      activeSegmentIndex,
      activeSegments,
      searchQuery,
      showSpeedPopover,
      showShortcutsHelp,
      viewMode,
    };
  });

  /* ---------- Keyboard Shortcuts ---------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const {
        absoluteTime: currentAbsTime,
        activeSegment: currentActiveSeg,
        activeSegmentIndex: currentActiveIdx,
        activeSegments: currentSegs,
        searchQuery: currentQuery,
        showSpeedPopover: currentSpeedPop,
        showShortcutsHelp: currentShortHelp,
        viewMode: currentViewMode,
      } = stateRef.current;

      const target = e.target as HTMLElement;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      // Search focus: / or Cmd+K / Ctrl+K
      if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Escape: clear search or close popovers
      if (e.key === "Escape") {
        if (currentSpeedPop) {
          setShowSpeedPopover(false);
          return;
        }
        if (currentShortHelp) {
          setShowShortcutsHelp(false);
          return;
        }
        if (currentQuery) {
          setSearchQuery("");
          return;
        }
      }

      if (isTyping) return;

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          setIsPlaying((p) => !p);
          break;
        case "j":
        case "arrowleft":
          e.preventDefault();
          if (playerRef.current) {
            const newTime = Math.max(0, currentAbsTime - 10);
            playerRef.current.seekTo(newTime, "seconds");
          }
          break;
        case "l":
        case "arrowright":
          e.preventDefault();
          if (playerRef.current) {
            const newTime = currentAbsTime + 10;
            playerRef.current.seekTo(newTime, "seconds");
          }
          break;
        case "arrowup": {
          e.preventDefault();
          if (currentActiveIdx > 0) {
            const seg = currentSegs[currentActiveIdx - 1];
            handleSegmentClick(seg.start_time);
          }
          break;
        }
        case "arrowdown": {
          e.preventDefault();
          if (currentActiveIdx >= 0 && currentActiveIdx < currentSegs.length - 1) {
            const seg = currentSegs[currentActiveIdx + 1];
            handleSegmentClick(seg.start_time);
          }
          break;
        }
        case "f":
          e.preventDefault();
          setViewMode((v) => (v === "focus" ? "split" : "focus"));
          break;
        case "t":
          e.preventDefault();
          setViewMode((v) => (v === "theater" ? "split" : "theater"));
          break;
        case "escape":
          if (currentViewMode !== "split") {
            e.preventDefault();
            setViewMode("split");
          }
          break;
        case "m":
          e.preventDefault();
          setIsMuted((m) => !m);
          break;
        case "c": {
          e.preventDefault();
          if (currentActiveSeg) {
            handleCopyText(currentActiveSeg.content, currentActiveSeg.id ?? currentActiveIdx);
          }
          break;
        }
        case "?":
          e.preventDefault();
          setShowShortcutsHelp((s) => !s);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleCopyText, handleSegmentClick]);

  /* ---------- Click Outside Speed Popovers ---------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedMain = speedPopoverRef.current?.contains(target);
      const clickedMini = miniSpeedPopoverRef.current?.contains(target);
      if (!clickedMain && !clickedMini) {
        setShowSpeedPopover(false);
      }
    };
    if (showSpeedPopover) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [showSpeedPopover]);

  /* ---------- Actions ---------- */
  const handleCopy = async (e: React.MouseEvent, text: string, id: number) => {
    e.stopPropagation();
    await handleCopyText(text, id);
  };

  const handleShareAtTime = async (e: React.MouseEvent, startTime: number, id: number) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}?t=${Math.floor(startTime)}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareToastId(id);
      setTimeout(() => setShareToastId(null), 2000);
    } catch (err) {
      console.error("Failed to share", err);
    }
  };

  const jumpToMatch = (direction: "prev" | "next") => {
    if (searchMatches.length === 0) return;
    const newIndex =
      direction === "next"
        ? (searchMatchIndex + 1) % searchMatches.length
        : (searchMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setSearchMatchIndex(newIndex);
    const match = searchMatches[newIndex];
    const seg = activeSegments[match.segmentIndex];
    const segKey = getSegmentKey(seg, match.segmentIndex);
    const el = document.getElementById(`seg-${segKey}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      handleSegmentClick(seg.start_time);
    }
  };

  const exportTranscript = () => {
    const text = activeSegments
      .map((s) => `[${formatDuration(s.start_time)}] ${s.speaker}: ${s.content}`)
      .join("\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${media.displayTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

  /* ---------- Render ---------- */
  return (
    <div className="min-h-screen bg-ed-bg text-ed-fg">
      {/* Top Banner Navigation */}
      <nav aria-label="Breadcrumbs" className="border-b border-ed-rule bg-ed-bg/95 backdrop-blur-md sticky top-16 z-30">
        <div className="mx-auto max-w-[1440px] px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/archive"
              className="flex items-center gap-1.5 text-xs font-semibold font-ui uppercase tracking-wider text-ed-fg-muted hover:text-ed-fg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent rounded-md px-1.5 py-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </Link>
            <span className="text-ed-rule">/</span>
            <span className="text-xs font-semibold font-ui uppercase tracking-wider text-ed-accent">
              {media.type?.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl border border-ed-rule bg-ed-surface p-0.5" role="group" aria-label="Layout view mode">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                aria-pressed={viewMode === "split"}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold font-ui transition-all ${
                  viewMode === "split"
                    ? "bg-ed-bg text-ed-fg shadow-sm"
                    : "text-ed-fg-muted hover:text-ed-fg"
                }`}
                title="Split View (S)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("theater")}
                aria-pressed={viewMode === "theater"}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold font-ui transition-all ${
                  viewMode === "theater"
                    ? "bg-ed-bg text-ed-fg shadow-sm"
                    : "text-ed-fg-muted hover:text-ed-fg"
                }`}
                title="Theater View (T)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Theater</span>
              </button>

              {hasTranscript && (
                <button
                  type="button"
                  onClick={() => setViewMode("focus")}
                  aria-pressed={viewMode === "focus"}
                  className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold font-ui transition-all ${
                    viewMode === "focus"
                      ? "bg-ed-bg text-ed-fg shadow-sm"
                      : "text-ed-fg-muted hover:text-ed-fg"
                  }`}
                  title="Focus View (F)"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Focus</span>
                </button>
              )}
            </div>

            {/* Arabic / English Toggle */}
            {hasArabic && (
              <div className="flex items-center rounded-xl border border-ed-rule bg-ed-surface p-0.5" role="group" aria-label="Transcript language">
                <button
                  type="button"
                  onClick={() => setCaptionLanguage("en")}
                  aria-pressed={captionLanguage === "en"}
                  className={`flex h-8 items-center rounded-lg px-2.5 text-xs font-bold font-ui uppercase transition-all ${
                    captionLanguage === "en"
                      ? "bg-ed-bg text-ed-fg shadow-sm"
                      : "text-ed-fg-muted hover:text-ed-fg"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setCaptionLanguage("ar")}
                  aria-pressed={captionLanguage === "ar"}
                  className={`flex h-8 items-center rounded-lg px-2.5 text-xs font-bold font-ui uppercase transition-all ${
                    captionLanguage === "ar"
                      ? "bg-ed-bg text-ed-fg shadow-sm"
                      : "text-ed-fg-muted hover:text-ed-fg"
                  }`}
                >
                  AR
                </button>
              </div>
            )}

            {/* Shortcuts Help Button */}
            <button
              type="button"
              onClick={() => setShowShortcutsHelp(true)}
              aria-label="Keyboard shortcuts"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ed-rule text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
              title="Shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace */}
      <main id="main-content" className="mx-auto max-w-[1440px] px-4 py-6">
        {/* Mobile Tab Bar (When in Split view on mobile) */}
        {viewMode === "split" && hasTranscript && (
          <div className="lg:hidden mb-6 flex rounded-xl border border-ed-rule bg-ed-surface p-1">
            <button
              type="button"
              onClick={() => setMobileTab("player")}
              className={`flex-1 py-2 text-xs font-bold font-ui uppercase tracking-wider rounded-lg transition-all ${
                mobileTab === "player"
                  ? "bg-ed-bg text-ed-fg shadow-sm"
                  : "text-ed-fg-muted"
              }`}
            >
              Media Player
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("transcript")}
              className={`flex-1 py-2 text-xs font-bold font-ui uppercase tracking-wider rounded-lg transition-all ${
                mobileTab === "transcript"
                  ? "bg-ed-bg text-ed-fg shadow-sm"
                  : "text-ed-fg-muted"
              }`}
            >
              Transcript ({activeSegments.length})
            </button>
          </div>
        )}

        {/* ========== SHORTCUTS HELP MODAL ========== */}
        {showShortcutsHelp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowShortcutsHelp(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div
              className="soft-shell w-full max-w-sm p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-ui uppercase tracking-widest text-ed-fg">Keyboard Shortcuts</h3>
                <button
                  type="button"
                  onClick={() => setShowShortcutsHelp(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-ed-fg-muted hover:text-ed-fg"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 text-sm">
                {[
                  { keys: ["Space", "K"], desc: "Play / Pause" },
                  { keys: ["J", "←"], desc: "Seek back 10s" },
                  { keys: ["L", "→"], desc: "Seek forward 10s" },
                  { keys: ["↑", "↓"], desc: "Previous / Next segment" },
                  { keys: ["F"], desc: "Toggle Focus mode" },
                  { keys: ["T"], desc: "Toggle Theater mode" },
                  { keys: ["M"], desc: "Mute / Unmute" },
                  { keys: ["/", "⌘K"], desc: "Focus search" },
                  { keys: ["C"], desc: "Copy active quote" },
                  { keys: ["?"], desc: "Toggle this help" },
                  { keys: ["Esc"], desc: "Clear search / exit mode" },
                ].map((item) => (
                  <div key={item.desc} className="flex items-center justify-between py-1.5 border-b border-ed-rule/50 last:border-0">
                    <span className="text-ed-fg-muted font-ui">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <span key={k} className="kbd-hint">{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== MAIN LAYOUT ========== */}
        <div
          className={`grid gap-6 transition-all duration-500 ease-in-out ${
            viewMode === "focus"
              ? "grid-cols-1"
              : viewMode === "theater" || !hasTranscript
              ? "grid-cols-1 max-w-5xl mx-auto"
              : "lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px]"
          }`}
        >
          {/* ---------- MEDIA COLUMN ---------- */}
          <div
            className={
              viewMode === "focus"
                ? "sr-only pointer-events-none absolute -left-[9999px] w-1 h-1 overflow-hidden"
                : `space-y-5 ${mobileTab !== "player" && viewMode !== "theater" ? "hidden lg:block" : ""}`
            }
            aria-hidden={viewMode === "focus" ? "true" : undefined}
          >
            {/* Title and Metadata (Shown ABOVE player in Theater mode) */}
            {viewMode === "theater" && (
              <div className="flex flex-col gap-3 px-1 pb-1">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold leading-[1.15] tracking-[-0.025em] text-ed-fg">
                      {media.displayTitle}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-ui uppercase tracking-[0.12em] text-ed-fg-muted">
                      <span className="text-ed-accent font-semibold">{media.author}</span>
                      <span className="w-1 h-1 bg-ed-rule rounded-full" />
                      <span>{media.displayDate || "Archival Record"}</span>
                      {effectiveClipStartTime !== undefined && (
                        <>
                          <span className="w-1 h-1 bg-ed-rule rounded-full" />
                          <span className="text-red-400 font-semibold">Clipped Selection</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Navigation in Header for Theater mode */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {prev && (
                      <Link
                        href={`/media/${encodeURIComponent(prev.id)}`}
                        prefetch
                        className="soft-pill flex min-h-10 items-center gap-2 px-4 py-2 text-[11px] font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Prev
                      </Link>
                    )}
                    {next && (
                      <Link
                        href={`/media/${encodeURIComponent(next.id)}`}
                        prefetch
                        className="soft-pill flex min-h-10 items-center gap-2 px-4 py-2 text-[11px] font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                      >
                        Next <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    <CiteButton
                      source={{
                        title: media.displayTitle,
                        author: media.author,
                        year: media.displayDate?.match(/\b(1[89]\d{2}|20\d{2})\b/)?.[1],
                        locator: absoluteTime > 0 ? formatDuration(absoluteTime) : undefined,
                      }}
                    />
                    {hasTranscript && (
                      <button
                        type="button"
                        onClick={exportTranscript}
                        aria-label="Download transcript"
                        className="soft-pill flex min-h-10 min-w-10 items-center justify-center p-2.5 text-ed-fg-muted transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Download Transcript"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Media Player Container */}
            <div className="relative overflow-hidden rounded-xl border border-ed-rule bg-[#0f0f0f] p-2 group aspect-video">
              <div className="w-full h-full relative z-10 rounded-xl overflow-hidden">
                <ReactPlayer
                  ref={playerRef}
                  url={mediaUrl}
                  controls={true}
                  width="100%"
                  height="100%"
                  playsinline={true}
                  playing={isPlaying}
                  playbackRate={playbackSpeed}
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onProgress={(state: { playedSeconds: number }) => setAbsoluteTime(state.playedSeconds)}
                  onReady={() => {
                    if (effectiveInitialSeekTime !== undefined && !hasSeekedToInitialTime.current) {
                      hasSeekedToInitialTime.current = true;
                      playerRef.current?.seekTo(effectiveInitialSeekTime, "seconds");
                    }
                  }}
                  config={{
                    youtube: {
                      playerVars: {
                        start: effectiveInitialSeekTime
                          ? Math.floor(effectiveInitialSeekTime)
                          : effectiveClipStartTime
                          ? Math.floor(effectiveClipStartTime)
                          : undefined,
                        end: effectiveClipEndTime ? Math.floor(effectiveClipEndTime) : undefined,
                        modestbranding: 1,
                      },
                    } as Record<string, unknown>,
                  }}
                />
              </div>
            </div>

            {/* Playback Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-1.5">
                {/* Jump Back */}
                <button
                  type="button"
                  onClick={() => {
                    if (playerRef.current) {
                      playerRef.current.seekTo(Math.max(0, absoluteTime - 10), "seconds");
                    }
                  }}
                  aria-label="Jump back 10 seconds"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ed-rule text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                  title="Back 10s (J)"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={() => setIsPlaying((p) => !p)}
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-ed-fg text-ed-bg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-[1px]" />}
                </button>

                {/* Jump Forward */}
                <button
                  type="button"
                  onClick={() => {
                    if (playerRef.current) {
                      playerRef.current.seekTo(absoluteTime + 10, "seconds");
                    }
                  }}
                  aria-label="Jump forward 10 seconds"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ed-rule text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                  title="Forward 10s (L)"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Mute */}
                <button
                  type="button"
                  onClick={() => setIsMuted((m) => !m)}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-ed-rule text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                  title="Mute (M)"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Time Display */}
                <span className="text-xs font-mono text-ed-fg-muted tabular-nums hidden sm:inline">
                  {formatDuration(absoluteTime)}
                  {media.duration_seconds ? ` / ${formatDuration(media.duration_seconds)}` : ""}
                </span>

                {/* Speed Selector */}
                <div className="relative" ref={speedPopoverRef}>
                  <button
                    type="button"
                    onClick={() => setShowSpeedPopover((s) => !s)}
                    aria-label="Playback speed"
                    aria-expanded={showSpeedPopover}
                    className="flex h-10 items-center gap-1.5 rounded-xl border border-ed-rule px-3 text-xs font-bold font-ui text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                    title="Playback speed"
                  >
                    <Gauge className="w-3.5 h-3.5" />
                    {playbackSpeed}x
                  </button>
                  {showSpeedPopover && (
                    <div className="speed-popover">
                      {speedOptions.map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          data-active={playbackSpeed === speed}
                          onClick={() => {
                            setPlaybackSpeed(speed);
                            setShowSpeedPopover(false);
                          }}
                          className="speed-popover-item"
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Title and Metadata (Shown BELOW player in Split mode) */}
            {viewMode !== "theater" && (
              <>
                <div className="flex flex-col gap-2 px-1">
                  <h1 className="text-2xl md:text-3xl font-display font-bold leading-[1.15] tracking-[-0.025em] text-ed-fg">
                    {media.displayTitle}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2.5 text-[11px] font-ui uppercase tracking-[0.12em] text-ed-fg-muted">
                    <span className="text-ed-accent font-semibold">{media.author}</span>
                    <span className="w-1 h-1 bg-ed-rule rounded-full" />
                    <span>{media.displayDate || "Archival Record"}</span>
                    {effectiveClipStartTime !== undefined && (
                      <>
                        <span className="w-1 h-1 bg-ed-rule rounded-full" />
                        <span className="text-red-400 font-semibold">Clipped Selection</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Navigation and Actions */}
                <div className="flex items-center gap-2 px-1 flex-wrap">
                  {prev && (
                    <Link
                      href={`/media/${encodeURIComponent(prev.id)}`}
                      prefetch
                      className="soft-pill flex min-h-10 items-center gap-2 px-4 py-2 text-[11px] font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Prev
                    </Link>
                  )}
                  {next && (
                    <Link
                      href={`/media/${encodeURIComponent(next.id)}`}
                      prefetch
                      className="soft-pill flex min-h-10 items-center gap-2 px-4 py-2 text-[11px] font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                    >
                      Next <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <CiteButton
                      source={{
                        title: media.displayTitle,
                        author: media.author,
                        year: media.displayDate?.match(/\b(1[89]\d{2}|20\d{2})\b/)?.[1],
                        locator: absoluteTime > 0 ? formatDuration(absoluteTime) : undefined,
                      }}
                    />
                  </div>
                  {hasTranscript && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={exportTranscript}
                        aria-label="Download transcript"
                        className="soft-pill flex min-h-10 min-w-10 items-center justify-center p-2.5 text-ed-fg-muted transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Download Transcript"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* THEATER MODE FEED */}
            {viewMode === "theater" && hasTranscript && (
              <div className="player-fade-up soft-shell mt-4 overflow-hidden">
                <div className="flex items-center justify-between border-b border-ed-rule px-5 py-3">
                  <span className="text-[10px] font-bold font-ui uppercase tracking-[0.2em] text-ed-fg-muted">
                    Synchronized Feed
                  </span>
                  <span className="text-[10px] font-bold font-ui uppercase tracking-widest text-ed-fg-muted">
                    Active Transcript
                  </span>
                </div>
                <div className="theater-caption-stream">
                  {activeSegment ? (
                    <div className="text-center space-y-3" key={activeSegment.content}>
                      {activeSegment.speaker && (
                        <span className="inline-block text-[10px] font-bold font-ui tracking-widest uppercase text-ed-accent bg-ed-accent/10 px-3 py-1 rounded-full">
                          {activeSegment.speaker}
                        </span>
                      )}
                      <p className="player-caption-rise text-xl md:text-2xl text-center leading-relaxed font-body text-ed-fg max-w-3xl">
                        {activeSegment.content}
                      </p>
                      <span className="text-xs font-mono text-ed-fg-muted tabular-nums">
                        {formatDuration(activeSegment.start_time)}
                      </span>
                    </div>
                  ) : (
                    <p
                      key="no-caption"
                      className="text-ed-fg-muted/50 text-lg text-center font-ui uppercase tracking-widest"
                    >
                      Waiting for signal…
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ---------- TRANSCRIPT COLUMN ---------- */}
          {hasTranscript && viewMode !== "theater" && (
            <div
              className={
                viewMode === "focus"
                  ? "focus-document w-full"
                  : `soft-shell flex flex-col overflow-hidden transition-all duration-500 h-[min(70vh,560px)] min-h-[320px] lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)] ${
                      mobileTab !== "transcript" ? "hidden lg:flex" : ""
                    }`
              }
            >
              {/* Focus Mode Editorial Header */}
              {viewMode === "focus" && (
                <div className="border-b border-ed-rule pb-6 mb-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2 max-w-xl">
                      <span className="inline-block text-[10px] font-bold font-ui uppercase tracking-widest text-ed-accent bg-ed-accent/10 px-2.5 py-1 rounded-md">
                        Focus Reading View
                      </span>
                      <h1 className="text-3xl md:text-4xl font-display font-bold leading-[1.12] tracking-[-0.025em] text-ed-fg">
                        {media.displayTitle}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2.5 text-xs font-ui uppercase tracking-wider text-ed-fg-muted">
                        <span className="text-ed-accent font-semibold">{media.author}</span>
                        <span className="w-1 h-1 bg-ed-rule rounded-full" />
                        <span>{media.displayDate || "Archival Record"}</span>
                        {effectiveClipStartTime !== undefined && (
                          <>
                            <span className="w-1 h-1 bg-ed-rule rounded-full" />
                            <span className="text-red-400 font-semibold">Clipped Selection</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CiteButton
                        source={{
                          title: media.displayTitle,
                          author: media.author,
                          year: media.displayDate?.match(/\b(1[89]\d{2}|20\d{2})\b/)?.[1],
                          locator: absoluteTime > 0 ? formatDuration(absoluteTime) : undefined,
                        }}
                      />
                      <button
                        type="button"
                        onClick={exportTranscript}
                        aria-label="Download transcript"
                        className="soft-pill flex min-h-9 min-w-9 items-center justify-center p-2 text-ed-fg-muted transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                        title="Download Transcript"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Toolbar Header */}
              <div className={`p-4 space-y-3 ${viewMode === "focus" ? "border-b border-ed-rule px-0" : "border-b border-ed-rule"}`}>
                {transcriptDisclaimer ? (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                    {transcriptDisclaimer}
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h2 className="text-sm font-bold font-ui uppercase tracking-[0.1em] text-ed-fg">
                      Interactive Record
                    </h2>
                    <span className="text-xs text-ed-fg-muted">Select any sentence to seek</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFontSize(Math.max(0, fontSize - 1))}
                      aria-label="Decrease text size"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ed-rule text-sm font-semibold text-ed-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent hover:bg-ed-surface transition-colors"
                    >
                      A−
                    </button>
                    <button
                      type="button"
                      onClick={() => setFontSize(Math.min(3, fontSize + 1))}
                      aria-label="Increase text size"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-ed-rule text-sm font-semibold text-ed-fg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent hover:bg-ed-surface transition-colors"
                    >
                      A+
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoScroll(!autoScroll)}
                      aria-pressed={autoScroll}
                      className={`inline-flex min-h-9 items-center rounded-lg border border-ed-rule px-3 py-1.5 text-[11px] font-semibold font-ui transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                        autoScroll ? "bg-ed-accent/10 text-ed-accent" : "text-ed-fg-muted hover:text-ed-fg"
                      }`}
                    >
                      Auto-Scroll {autoScroll ? "On" : "Off"}
                    </button>
                  </div>
                </div>

                {/* Search Bar with Match Navigation */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ed-fg-muted group-focus-within:text-ed-accent transition-colors" />
                  <label htmlFor="transcript-search-input" className="sr-only">
                    Search transcript
                  </label>
                  <input
                    id="transcript-search-input"
                    ref={searchInputRef}
                    name="transcriptSearch"
                    type="text"
                    placeholder="Search transcript…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchMatchIndex(0);
                    }}
                    className="archive-input w-full py-2.5 pl-10 pr-24 text-sm font-ui"
                  />
                  {searchQuery && (
                    <>
                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {searchMatches.length > 0 && (
                          <div className="match-badge">
                            <button
                              type="button"
                              onClick={() => jumpToMatch("prev")}
                              aria-label="Previous match"
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-ed-rule transition-colors"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <span className="tabular-nums">
                              {searchMatchIndex + 1} / {searchMatches.length}
                            </span>
                            <button
                              type="button"
                              onClick={() => jumpToMatch("next")}
                              aria-label="Next match"
                              className="flex h-5 w-5 items-center justify-center rounded hover:bg-ed-rule transition-colors"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSearchMatchIndex(0);
                          }}
                          aria-label="Clear search"
                          className="flex h-9 w-9 items-center justify-center text-ed-fg-muted hover:text-ed-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Segments List */}
              <div
                ref={transcriptRef}
                className={
                  viewMode === "focus"
                    ? "py-6 space-y-3"
                    : "transcript-scroll flex-1 min-h-0 overflow-y-auto bg-ed-bg/35 p-3 scroll-smooth"
                }
              >
                {filteredSegments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-ed-fg-muted gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-ui text-center">
                      No matches found for<br />&quot;{searchQuery}&quot;
                    </p>
                  </div>
                ) : (
                  <ol aria-label="Transcript" className={viewMode === "focus" ? "space-y-3" : "space-y-1.5"}>
                    {filteredSegments.map((seg, i) => {
                      const isActive = seg === activeSegment;
                      const segKey = getSegmentKey(seg, i);
                      return (
                        <li
                          key={seg.id ?? i}
                          id={`seg-${segKey}`}
                          aria-current={isActive ? "true" : undefined}
                          className={`group relative rounded-[1rem] transition-all duration-200 ${
                            isActive
                              ? "soft-panel text-ed-fg"
                              : "hover:bg-ed-surface/30"
                          } ${viewMode === "focus" ? "p-1" : ""}`}
                        >
                          {/* Active indicator bar */}
                          {isActive && <div className="active-segment-bar" />}

                          <button
                            type="button"
                            onClick={() => handleSegmentClick(seg.start_time)}
                            className={`w-full cursor-pointer rounded-[1rem] p-4 pl-5 pr-20 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                              viewMode === "focus" ? "py-4 md:py-5" : ""
                            }`}
                          >
                            <span className="sr-only">
                              Play from {formatDuration(seg.start_time)}.{" "}
                            </span>

                            {/* Speaker */}
                            {seg.speaker ? (
                              <span className="mb-1.5 block">
                                <span
                                  className={`text-[10px] font-bold font-ui tracking-widest uppercase ${
                                    isActive ? "text-ed-accent" : "text-ed-fg-muted"
                                  }`}
                                >
                                  {seg.speaker}
                                </span>
                              </span>
                            ) : null}

                            {/* Content */}
                            <span
                              className={`block ${fontSizes[fontSize]} ${
                                viewMode === "focus" ? "leading-loose" : "leading-relaxed"
                              } font-body ${
                                isActive ? "text-ed-fg font-medium" : "text-ed-fg/80"
                              } ${captionLanguage === "ar" ? "font-arabic text-right" : ""}`}
                              dir={captionLanguage === "ar" ? "rtl" : "ltr"}
                            >
                              <HighlightedText text={seg.content} query={searchQuery} />
                            </span>
                          </button>

                          {/* Hover Actions (Top-Right) */}
                          <div className="segment-actions absolute right-3 top-3">
                            <button
                              type="button"
                              onClick={(e) => handleCopy(e, seg.content, seg.id ?? i)}
                              aria-label={copiedId === (seg.id ?? i) ? "Copied" : "Copy quote"}
                              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ed-fg-muted hover:text-ed-accent hover:bg-ed-accent/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                              title="Copy quote (C)"
                            >
                              {copiedId === (seg.id ?? i) ? (
                                <Check className="w-3.5 h-3.5 text-ed-accent" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleShareAtTime(e, seg.start_time, seg.id ?? i)}
                              aria-label={shareToastId === (seg.id ?? i) ? "Link copied" : "Share link at timestamp"}
                              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-ed-fg-muted hover:text-ed-accent hover:bg-ed-accent/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                              title="Share at timestamp"
                            >
                              {shareToastId === (seg.id ?? i) ? (
                                <Check className="w-3.5 h-3.5 text-ed-accent" />
                              ) : (
                                <Share2 className="w-3.5 h-3.5" />
                              )}
                              {shareToastId === (seg.id ?? i) && (
                                <span className="share-tooltip">Link copied!</span>
                              )}
                            </button>
                          </div>

                          {/* Timestamp Pill (Bottom-Right) */}
                          <div className="absolute right-4 bottom-2.5">
                            <button
                              type="button"
                              onClick={() => handleSegmentClick(seg.start_time)}
                              className="timestamp-pill"
                              title="Play from here"
                            >
                              <LinkIcon className="w-2.5 h-2.5" />
                              {formatDuration(seg.start_time)}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========== FOCUS MODE MINI PLAYER ========== */}
      {viewMode === "focus" && (
        <div className="mini-player-bar">
          <div className="mx-auto max-w-[1440px] px-4 py-2.5 flex items-center justify-between gap-3 md:gap-4">
            {/* Playback Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsPlaying((p) => !p)}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ed-fg text-ed-bg hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent shadow-sm"
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-[1px]" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (playerRef.current) {
                    playerRef.current.seekTo(Math.max(0, absoluteTime - 10), "seconds");
                  }
                }}
                aria-label="Jump back 10 seconds"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
                title="Back 10s (J)"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (playerRef.current) {
                    playerRef.current.seekTo(absoluteTime + 10, "seconds");
                  }
                }}
                aria-label="Jump forward 10 seconds"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
                title="Forward 10s (L)"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
                title="Mute (M)"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Title + Interactive Scrubber */}
            <div className="min-w-0 flex-1 max-w-2xl flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-ed-fg truncate">{media.displayTitle}</p>
                <span className="text-[10px] font-mono text-ed-fg-muted tabular-nums shrink-0">
                  {formatDuration(absoluteTime)}
                  {media.duration_seconds ? ` / ${formatDuration(media.duration_seconds)}` : ""}
                </span>
              </div>
              <div className="flex items-center w-full">
                <input
                  type="range"
                  min={0}
                  max={media.duration_seconds || 100}
                  step={1}
                  value={Math.min(Math.floor(absoluteTime), media.duration_seconds || 100)}
                  onChange={(e) => {
                    const newTime = Number(e.target.value);
                    setAbsoluteTime(newTime);
                    playerRef.current?.seekTo(newTime, "seconds");
                  }}
                  className="w-full h-1.5 bg-ed-rule hover:bg-ed-rule-strong rounded-full appearance-none cursor-pointer accent-ed-accent transition-all focus:outline-none"
                  aria-label="Seek playback"
                />
              </div>
            </div>

            {/* Speed & Exit Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative" ref={miniSpeedPopoverRef}>
                <button
                  type="button"
                  onClick={() => setShowSpeedPopover((s) => !s)}
                  className="flex h-9 items-center gap-1 rounded-lg border border-ed-rule px-2.5 text-xs font-bold font-ui text-ed-fg-muted hover:text-ed-fg transition-colors"
                  title="Playback speed"
                >
                  <Gauge className="w-3.5 h-3.5" />
                  {playbackSpeed}x
                </button>
                {showSpeedPopover && (
                  <div className="speed-popover bottom-full mb-2">
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        data-active={playbackSpeed === speed}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          setShowSpeedPopover(false);
                        }}
                        className="speed-popover-item"
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewMode("split")}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-ed-rule bg-ed-surface px-3 text-xs font-bold font-ui text-ed-fg hover:bg-ed-bg transition-colors shadow-sm"
                aria-label="Exit focus mode"
                title="Exit Focus Mode (Esc or F)"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exit Focus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
