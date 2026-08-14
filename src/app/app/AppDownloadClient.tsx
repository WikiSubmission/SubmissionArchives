'use client';

import Image from 'next/image';
import { useSyncExternalStore, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Apple,
    Clock,
    FolderOpen,
    GitBranch,
    HardDrive,
    MonitorSmartphone,
    PenLine,
    Quote,
    Search,
    Sparkles,
    Terminal,
    Zap,
} from 'lucide-react';

type Platform = 'macos' | 'windows' | 'linux';

function getPlatformSnapshot(): Platform {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'macos';
    const ua = navigator.userAgent;
    if (/Mac/.test(ua)) return 'macos';
    if (/Win/.test(ua)) return 'windows';
    return 'linux';
}

function subscribePlatform() {
    return () => {};
}

const PLATFORM_LABEL: Record<Platform, string> = {
    macos: 'macOS',
    windows: 'Windows',
    linux: 'Linux',
};

const PLATFORM_EXT: Record<Platform, string> = {
    macos: '.dmg / Apple Silicon & Intel',
    windows: '.msi / .exe (x64)',
    linux: '.AppImage / .deb',
};

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
});

type TabKey = 'editor' | 'graph' | 'search' | 'citations';

export default function AppDownloadClient() {
    const platform = useSyncExternalStore(subscribePlatform, getPlatformSnapshot, () => 'macos' as Platform);
    const [activeTab, setActiveTab] = useState<TabKey>('editor');

    const otherPlatforms = (['macos', 'windows', 'linux'] as const).filter((p) => p !== platform);

    return (
        <div className="min-h-screen bg-ed-bg text-ed-fg selection:bg-ed-accent selection:text-ed-bg">
            <main id="main-content">
                {/* Hero */}
                <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-ed-accent/15 via-ed-bg to-ed-bg pt-12 pb-24 sm:pt-20 sm:pb-32">
                    {/* Subtle grid background accent */}
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(120,120,120,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,120,120,0.04)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

                    <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
                        <motion.div
                            initial={{ opacity: 0, y: 36 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                            {/* App Icon */}
                            <div className="mb-8 flex flex-col items-center justify-center">
                                <motion.div
                                    whileHover={{ scale: 1.04, rotate: 1 }}
                                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                                    className="group relative flex cursor-pointer items-center justify-center"
                                >
                                    {/* Ambient colorful glow */}
                                    <div className="absolute -inset-3 rounded-[32%] bg-gradient-to-tr from-amber-500/20 via-ed-accent/25 to-blue-500/20 opacity-70 blur-2xl transition-all duration-700 group-hover:opacity-100 group-hover:blur-3xl" />

                                    {/* App Icon Tile */}
                                    <div className="relative flex h-24 w-24 items-center justify-center rounded-[24%] border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface via-ed-surface/95 to-ed-surface/80 p-4 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.08)_inset] backdrop-blur-xl sm:h-28 sm:w-28">
                                        <Image
                                            src="/assets/brand/submission-archives-mark.png"
                                            alt="SA Studio Logo"
                                            width={100}
                                            height={100}
                                            className="h-16 w-16 object-contain drop-shadow-md sm:h-20 sm:w-20"
                                            priority
                                        />
                                    </div>
                                </motion.div>
                            </div>

                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/70 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                <span className="text-[0.72rem] font-mono font-semibold uppercase tracking-[0.14em] text-ed-fg">
                                    SA Studio · Local-First Desktop App
                                </span>
                            </div>

                            {/* Main Title */}
                            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight text-ed-fg sm:text-5xl lg:text-6xl">
                                Your archive, on your own disk.
                            </h1>

                            {/* Lead paragraph */}
                            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-ed-fg-muted sm:mt-10 sm:text-lg sm:leading-8">
                                SubmissionArchives Studio is a high-performance desktop workspace for reading, tagging,
                                cross-referencing, and expanding the archive. Stored as plain Markdown on your machine,
                                completely offline, with an interactive knowledge graph.
                            </p>

                            {/* Download & Platform CTA */}
                            <div className="mt-10 flex flex-col items-center gap-4">
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <DownloadButton platform={platform} primary />
                                    {otherPlatforms.map((p) => (
                                        <DownloadButton key={p} platform={p} />
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 text-xs font-mono text-ed-fg-muted">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-ed-fg-muted/60" />
                                    <span>Tauri & Rust Native</span>
                                    <span>·</span>
                                    <span>Zero Cloud Lock-in</span>
                                    <span>·</span>
                                    <span className="rounded bg-ed-surface px-1.5 py-0.5 font-semibold text-ed-fg">Standalone Executable</span>
                                </div>

                                {/* Coming Soon Disclaimer Card */}
                                <div className="mt-4 mx-auto max-w-lg rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs leading-relaxed text-ed-fg-muted backdrop-blur-md shadow-sm">
                                    <div className="flex items-center justify-center gap-2 font-mono text-[0.72rem] font-semibold uppercase tracking-wider text-amber-500 mb-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Active Development · Coming Soon</span>
                                    </div>
                                    <p className="text-center">
                                        SA Studio is currently in active development. Official standalone installers for macOS, Windows, and Linux will be downloadable here soon.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Interactive App Window Showcase */}
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="relative mx-auto mt-16 max-w-4xl text-left sm:mt-20"
                        >
                            {/* Glow accent beneath window */}
                            <div className="absolute -inset-1 bg-gradient-to-b from-ed-accent/20 to-transparent opacity-60 blur-2xl -z-10" />

                            {/* Window container */}
                            <div className="overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-ed-surface/90 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-2xl">
                                {/* Titlebar */}
                                <div className="flex h-11 items-center justify-between border-b border-ed-rule px-4 bg-ed-surface-strong/50 select-none">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
                                        <div className="h-3 w-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
                                        <div className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                                    </div>
                                    <div className="flex items-center gap-2 text-[0.75rem] font-mono text-ed-fg-muted">
                                        <HardDrive className="h-3.5 w-3.5 opacity-70" />
                                        <span>~/Documents/SubmissionArchives-Vault</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded px-1.5 py-0.5 font-mono text-[0.65rem] bg-ed-surface border border-ed-rule text-ed-fg-muted">
                                            ⌘K Search
                                        </span>
                                    </div>
                                </div>

                                {/* Showcase navigation tabs */}
                                <div className="flex border-b border-ed-rule bg-ed-surface/40 px-3 py-2 gap-1 overflow-x-auto text-xs">
                                    <TabButton
                                        active={activeTab === 'editor'}
                                        onClick={() => setActiveTab('editor')}
                                        icon={<PenLine className="h-3.5 w-3.5" />}
                                        label="Note Editor"
                                    />
                                    <TabButton
                                        active={activeTab === 'graph'}
                                        onClick={() => setActiveTab('graph')}
                                        icon={<GitBranch className="h-3.5 w-3.5" />}
                                        label="Knowledge Graph"
                                    />
                                    <TabButton
                                        active={activeTab === 'citations'}
                                        onClick={() => setActiveTab('citations')}
                                        icon={<Quote className="h-3.5 w-3.5" />}
                                        label="Citations & Backlinks"
                                    />
                                    <TabButton
                                        active={activeTab === 'search'}
                                        onClick={() => setActiveTab('search')}
                                        icon={<Search className="h-3.5 w-3.5" />}
                                        label="Command Palette"
                                    />
                                </div>

                                {/* Window Content Body */}
                                <div className="p-5 sm:p-7 min-h-[300px]">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'editor' && (
                                            <motion.div
                                                key="editor"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-4"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ed-rule pb-3">
                                                    <div className="flex items-center gap-2 font-mono text-xs text-ed-fg-muted">
                                                        <span>📁 02-Audio-Transcripts</span>
                                                        <span>/</span>
                                                        <span className="font-semibold text-ed-fg">1988-tucson-conference.md</span>
                                                    </div>
                                                    <div className="flex gap-1.5">
                                                        <span className="rounded bg-ed-surface-strong px-2 py-0.5 font-mono text-[0.7rem] text-ed-fg-muted">#appendix-1</span>
                                                        <span className="rounded bg-ed-surface-strong px-2 py-0.5 font-mono text-[0.7rem] text-ed-fg-muted">#mathematical-miracle</span>
                                                    </div>
                                                </div>

                                                <h3 className="font-display text-xl font-bold text-ed-fg">
                                                    The Mathematical Structure of the Final Testament
                                                </h3>

                                                <p className="text-sm leading-relaxed text-ed-fg-muted">
                                                    The mathematical composition of the scripture is detailed throughout the archives.
                                                    Every verse, letter, and surah is indexed with bidirectional linkages into audio recordings
                                                    and historical facsimile prints.
                                                </p>

                                                <div className="rounded-lg border border-ed-rule bg-ed-surface/60 p-3.5 font-mono text-xs text-ed-fg">
                                                    <div className="flex items-center gap-2 text-ed-fg-muted mb-1 text-[0.7rem]">
                                                        <Quote className="h-3 w-3" />
                                                        <span>Cross-referenced citation:</span>
                                                    </div>
                                                    <p className="text-ed-fg font-sans italic text-sm">
                                                        “He has counted the numbers of all things.” — <span className="font-mono text-xs text-ed-fg font-semibold bg-ed-surface-strong px-1.5 py-0.5 rounded">[[Quran 72:28]]</span> · <span className="font-mono text-xs text-ed-fg-muted">Sermon #44 (1989)</span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'graph' && (
                                            <motion.div
                                                key="graph"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex flex-col items-center justify-center py-6 text-center"
                                            >
                                                <div className="relative flex h-44 w-full items-center justify-center rounded-xl border border-ed-rule bg-ed-surface/40 overflow-hidden">
                                                    {/* Simulated graph nodes */}
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="relative h-32 w-72">
                                                            {/* Lines */}
                                                            <div className="absolute left-1/2 top-1/2 h-[1px] w-24 -translate-x-12 -translate-y-6 rotate-45 bg-ed-rule-strong" />
                                                            <div className="absolute left-1/2 top-1/2 h-[1px] w-28 -translate-x-14 translate-y-4 -rotate-30 bg-ed-rule-strong" />
                                                            <div className="absolute left-1/2 top-1/2 h-[1px] w-20 -translate-x-4 -translate-y-8 -rotate-60 bg-ed-rule-strong" />

                                                            {/* Nodes */}
                                                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-full border border-ed-fg bg-ed-fg px-3 py-1 text-xs font-semibold text-ed-bg shadow-md">
                                                                <GitBranch className="h-3 w-3" />
                                                                <span>Quran 72:28</span>
                                                            </div>
                                                            <div className="absolute left-4 top-4 rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-1 text-[0.7rem] font-mono text-ed-fg">
                                                                Audio #44
                                                            </div>
                                                            <div className="absolute right-6 top-6 rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-1 text-[0.7rem] font-mono text-ed-fg">
                                                                Appendix 1
                                                            </div>
                                                            <div className="absolute left-10 bottom-3 rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-1 text-[0.7rem] font-mono text-ed-fg">
                                                                Sermons 1988
                                                            </div>
                                                            <div className="absolute right-12 bottom-4 rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-1 text-[0.7rem] font-mono text-ed-fg">
                                                                Newsletter #38
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs font-mono text-ed-fg-muted">
                                                    Interactive 2D/3D Force-Directed Graph · Trace connections between any verse, audio, or note
                                                </p>
                                            </motion.div>
                                        )}

                                        {activeTab === 'citations' && (
                                            <motion.div
                                                key="citations"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-3 font-mono text-xs"
                                            >
                                                <div className="text-ed-fg-muted text-[0.7rem] uppercase tracking-wider">
                                                    Backlinks Inspector (12 Connected References)
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between rounded-lg border border-ed-rule bg-ed-surface/60 p-3">
                                                        <div className="flex items-center gap-2">
                                                            <Quote className="h-4 w-4 text-ed-fg-muted" />
                                                            <span className="font-semibold text-ed-fg">Appendix 1: One of the Great Miracles</span>
                                                        </div>
                                                        <span className="text-ed-fg-muted text-[0.7rem]">Line 42</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg border border-ed-rule bg-ed-surface/60 p-3">
                                                        <div className="flex items-center gap-2">
                                                            <Quote className="h-4 w-4 text-ed-fg-muted" />
                                                            <span className="font-semibold text-ed-fg">1989 Tucson Conference Transcript</span>
                                                        </div>
                                                        <span className="text-ed-fg-muted text-[0.7rem]">Timestamp 14:32</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'search' && (
                                            <motion.div
                                                key="search"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-3"
                                            >
                                                <div className="relative flex items-center rounded-xl border border-ed-rule-strong bg-ed-bg px-3.5 py-2.5 shadow-inner">
                                                    <Search className="h-4 w-4 text-ed-fg-muted mr-2.5" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value="> Appendices 19 mathematical proof"
                                                        className="w-full bg-transparent font-mono text-xs text-ed-fg outline-none"
                                                    />
                                                    <span className="rounded bg-ed-surface-strong px-2 py-0.5 text-[0.65rem] font-mono text-ed-fg-muted">
                                                        12 results in 1ms
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 font-mono text-xs">
                                                    <div className="flex items-center justify-between rounded-lg bg-ed-fg/5 p-2.5 text-ed-fg font-medium">
                                                        <span>📄 Appendix 1 · The Mathematical Miracle</span>
                                                        <span className="text-[0.7rem] text-ed-fg-muted">Open ↵</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg p-2.5 text-ed-fg-muted hover:bg-ed-surface">
                                                        <span>🔊 Friday Sermon #314 (Audio & Transcript)</span>
                                                        <span className="text-[0.7rem]">Open</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Local-first architecture strip */}
                <section className="border-y border-ed-rule bg-ed-surface/40 backdrop-blur-sm">
                    <motion.div {...fadeUp()} className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
                        <StripItem
                            icon={<HardDrive className="h-5 w-5" />}
                            title="Plain Markdown Files"
                            body="Your archive lives in a folder on your drive. Open it in Obsidian, VS Code, or any text editor anytime — zero proprietary lock-in."
                        />
                        <StripItem
                            icon={<Zap className="h-5 w-5" />}
                            title="Instant Offline Speed"
                            body="Engineered with Rust and Tauri for near-zero startup time, tiny memory footprint, and complete offline independence."
                        />
                        <StripItem
                            icon={<GitBranch className="h-5 w-5" />}
                            title="Living Knowledge Graph"
                            body="Explore links between verses, sermons, transcripts, and personal notes as a navigable visual network."
                        />
                    </motion.div>
                </section>

                {/* Bento Features Grid */}
                <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
                    <motion.div {...fadeUp()} className="text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/70 px-3.5 py-1 text-[0.72rem] font-mono font-medium uppercase tracking-[0.14em] text-ed-fg-muted shadow-sm">
                            <Sparkles className="h-3 w-3 text-amber-500" />
                            <span>Built for Research & Archival Depth</span>
                        </div>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ed-fg sm:text-4xl lg:text-5xl">
                            Everything you need to explore and study the archive
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-ed-fg-muted sm:text-lg">
                            Purpose-built tools designed specifically for deep study, cross-referencing, and offline note-taking.
                        </p>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Bento 1: Large Span 2 - Block Note Editor & Citations */}
                        <motion.div {...fadeUp(0.05)} className="md:col-span-2">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ed-fg text-ed-bg shadow-md">
                                            <PenLine className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Block Editor · Citations
                                        </span>
                                    </div>
                                    <h3 className="font-display text-2xl font-bold text-ed-fg">
                                        Rich Editor with Live Verse Citations
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted max-w-xl">
                                        Write notes with rich typography, mathematical expressions, and bidirectional links. Type <code className="rounded bg-ed-surface-strong px-1.5 py-0.5 font-mono text-xs text-ed-fg font-semibold">[[Quran 72:28]]</code> or link to any sermon timestamp to instantly embed contextual references.
                                    </p>
                                </div>

                                {/* Mini UI Mockup */}
                                <div className="mt-6 rounded-xl border border-ed-rule bg-ed-bg/80 p-4 font-mono text-xs shadow-inner">
                                    <div className="flex items-center justify-between border-b border-ed-rule pb-2 mb-3 text-[0.7rem] text-ed-fg-muted">
                                        <span>📝 Notes/1988-tucson-notes.md</span>
                                        <span className="text-emerald-500 font-semibold">● Live Sync</span>
                                    </div>
                                    <p className="font-sans text-sm text-ed-fg leading-relaxed">
                                        Examining the preservation of the 114 surahs and the numerical pattern revealed in Tucson.
                                    </p>
                                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-1 rounded-md border border-ed-rule-strong bg-ed-surface-strong px-2 py-1 text-xs font-semibold text-ed-fg">
                                            <Quote className="h-3 w-3 text-amber-500" />
                                            [[Quran 72:28]]
                                        </span>
                                        <span className="inline-flex items-center gap-1 rounded-md border border-ed-rule bg-ed-surface px-2 py-1 text-[0.7rem] text-ed-fg-muted">
                                            🔗 12 Backlinks
                                        </span>
                                        <span className="rounded bg-ed-surface px-2 py-1 text-[0.7rem] text-ed-fg-muted">
                                            #historical-record
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 2: Interactive Knowledge Graph */}
                        <motion.div {...fadeUp(0.1)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <GitBranch className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Graph Engine
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Interactive Knowledge Graph
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        See how surahs, sermons, audios, and personal annotations link together into an interconnected web of knowledge.
                                    </p>
                                </div>

                                {/* Mini Graph Node Visual */}
                                <div className="mt-6 flex h-32 w-full items-center justify-center rounded-xl border border-ed-rule bg-ed-bg/60 relative overflow-hidden">
                                    <div className="absolute h-16 w-16 rounded-full bg-ed-accent/15 blur-xl" />
                                    <div className="relative flex flex-col items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-ed-surface-strong border border-ed-rule px-2 py-0.5 text-[0.65rem] font-mono text-ed-fg">
                                                Sermon #44
                                            </span>
                                            <span className="text-ed-rule-strong">───</span>
                                            <span className="rounded-full bg-ed-fg text-ed-bg px-2.5 py-0.5 text-[0.7rem] font-mono font-bold shadow-md">
                                                Surah 72:28
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-ed-surface border border-ed-rule px-2 py-0.5 text-[0.65rem] font-mono text-ed-fg-muted">
                                                Appendix 1
                                            </span>
                                            <span className="text-ed-rule-strong">───</span>
                                            <span className="rounded-full bg-ed-surface border border-ed-rule px-2 py-0.5 text-[0.65rem] font-mono text-ed-fg-muted">
                                                Audio Index
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 3: Sub-millisecond Vault Search */}
                        <motion.div {...fadeUp(0.15)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <Search className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Instant Index
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Sub-millisecond Search
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        Instant fuzzy matching across all 114 surahs, 600+ audio transcripts, 38 appendices, and your notes.
                                    </p>
                                </div>

                                <div className="mt-6 space-y-2 rounded-xl border border-ed-rule bg-ed-bg/60 p-3 font-mono text-xs">
                                    <div className="flex items-center gap-2 rounded-lg bg-ed-surface px-2.5 py-1.5 text-ed-fg">
                                        <Search className="h-3.5 w-3.5 text-ed-fg-muted" />
                                        <span className="text-[0.75rem]">&ldquo;miracle of nineteen&rdquo;</span>
                                    </div>
                                    <div className="text-[0.7rem] text-ed-fg-muted px-1 flex justify-between">
                                        <span>48 matches</span>
                                        <span>0.4ms</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 4: Plain Markdown Vault */}
                        <motion.div {...fadeUp(0.2)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <HardDrive className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Open Format
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Plain Markdown Vault
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        No proprietary database or cloud lock-in. Your files live as standard Markdown on your disk forever.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-xl border border-ed-rule bg-ed-bg/60 p-3 font-mono text-[0.72rem] text-ed-fg-muted space-y-1">
                                    <div className="flex items-center gap-1.5 text-ed-fg">
                                        <FolderOpen className="h-3.5 w-3.5" />
                                        <span>/Archive-Vault/</span>
                                    </div>
                                    <div className="pl-4">├── 📄 01-quran-study.md</div>
                                    <div className="pl-4">└── 📄 02-audio-index.md</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 5: Command Palette ⌘K */}
                        <motion.div {...fadeUp(0.25)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-6 sm:p-8 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <Terminal className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Keyboard-First
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Command Palette (⌘K)
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        Open files, navigate surahs, toggle split panes, and run vault commands without touching the mouse.
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-around rounded-xl border border-ed-rule bg-ed-bg/60 p-3 font-mono text-xs">
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-ed-rule bg-ed-surface px-2 py-1 font-bold text-ed-fg shadow-sm">⌘K</kbd>
                                        <span className="text-[0.65rem] text-ed-fg-muted">Palette</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-ed-rule bg-ed-surface px-2 py-1 font-bold text-ed-fg shadow-sm">⌘E</kbd>
                                        <span className="text-[0.65rem] text-ed-fg-muted">Graph</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-ed-rule bg-ed-surface px-2 py-1 font-bold text-ed-fg shadow-sm">⌘O</kbd>
                                        <span className="text-[0.65rem] text-ed-fg-muted">Quick Open</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Upgraded Simple Setup Section */}
                <section className="relative overflow-hidden border-t border-ed-rule bg-gradient-to-b from-ed-surface/40 via-ed-surface/20 to-ed-bg py-24 sm:py-32">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <motion.div {...fadeUp()} className="text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/70 px-3.5 py-1 text-[0.72rem] font-mono font-medium uppercase tracking-[0.14em] text-ed-fg-muted shadow-sm">
                                <span>Zero-Configuration Onboarding</span>
                            </div>
                            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ed-fg sm:text-4xl lg:text-5xl">
                                Up and running in seconds
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-base text-ed-fg-muted sm:text-lg">
                                No accounts to create, no servers to configure. Three simple steps to a complete local workspace.
                            </p>
                        </motion.div>

                        {/* Connected Step Cards */}
                        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Step 1 */}
                            <motion.div {...fadeUp(0.05)} className="relative">
                                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-7 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl hover:-translate-y-1">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ed-fg font-mono text-sm font-bold text-ed-bg shadow-md">
                                                01
                                            </span>
                                            <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-ed-fg-muted">
                                                Install Binary
                                            </span>
                                        </div>
                                        <h3 className="font-display text-xl font-bold text-ed-fg">
                                            Download the Native App
                                        </h3>
                                        <p className="text-sm leading-relaxed text-ed-fg-muted">
                                            Grab the lightweight standalone executable for macOS, Windows, or Linux. Starts up instantly with near-zero memory usage.
                                        </p>
                                    </div>

                                    {/* Mini Visual */}
                                    <div className="mt-6 rounded-xl border border-ed-rule bg-ed-bg/70 p-3.5 font-mono text-xs shadow-inner">
                                        <div className="flex items-center justify-between text-ed-fg">
                                            <div className="flex items-center gap-2">
                                                <HardDrive className="h-4 w-4 text-emerald-500" />
                                                <span className="font-semibold">SA-Studio-v1.0{PLATFORM_EXT[platform].split(' ')[0]}</span>
                                            </div>
                                            <span className="text-[0.65rem] text-emerald-500 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready</span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between text-[0.7rem] text-ed-fg-muted">
                                            <span>Size: ~12 MB</span>
                                            <span>Standalone Binary</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Step 2 */}
                            <motion.div {...fadeUp(0.1)} className="relative">
                                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-7 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl hover:-translate-y-1">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ed-fg font-mono text-sm font-bold text-ed-bg shadow-md">
                                                02
                                            </span>
                                            <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-ed-fg-muted">
                                                Vault Selection
                                            </span>
                                        </div>
                                        <h3 className="font-display text-xl font-bold text-ed-fg">
                                            Choose Your Vault
                                        </h3>
                                        <p className="text-sm leading-relaxed text-ed-fg-muted">
                                            Point the app at any directory on your computer, or initialize a clean archive bundle with complete scriptures and transcripts.
                                        </p>
                                    </div>

                                    {/* Mini Visual */}
                                    <div className="mt-6 rounded-xl border border-ed-rule bg-ed-bg/70 p-3.5 font-mono text-xs shadow-inner">
                                        <div className="flex items-center gap-2 text-ed-fg">
                                            <FolderOpen className="h-4 w-4 text-amber-500" />
                                            <span className="font-semibold truncate">~/Documents/Archive-Vault/</span>
                                        </div>
                                        <div className="mt-2 text-[0.7rem] text-ed-fg-muted flex items-center justify-between">
                                            <span>✓ 114 Surahs</span>
                                            <span>✓ 600+ Audios</span>
                                            <span>✓ Notes</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Step 3 */}
                            <motion.div {...fadeUp(0.15)} className="relative">
                                <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-ed-rule-strong/80 bg-gradient-to-b from-ed-surface/90 via-ed-surface/70 to-ed-surface/50 p-7 shadow-[0_16px_36px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur-xl transition-all duration-300 hover:border-ed-fg/40 hover:shadow-2xl hover:-translate-y-1">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ed-fg font-mono text-sm font-bold text-ed-bg shadow-md">
                                                03
                                            </span>
                                            <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-ed-fg-muted">
                                                Explore & Connect
                                            </span>
                                        </div>
                                        <h3 className="font-display text-xl font-bold text-ed-fg">
                                            Read, Write & Connect
                                        </h3>
                                        <p className="text-sm leading-relaxed text-ed-fg-muted">
                                            Take notes with bidirectional verse references, search everything instantly, and explore the living visual knowledge graph.
                                        </p>
                                    </div>

                                    {/* Mini Visual */}
                                    <div className="mt-6 rounded-xl border border-ed-rule bg-ed-bg/70 p-3.5 font-mono text-xs shadow-inner">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-ed-fg font-semibold">
                                                <GitBranch className="h-3.5 w-3.5 text-blue-500" />
                                                Graph Connected
                                            </span>
                                            <kbd className="rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 text-[0.65rem] text-ed-fg font-bold">
                                                ⌘K
                                            </kbd>
                                        </div>
                                        <div className="mt-2 text-[0.7rem] text-ed-fg-muted">
                                            Cross-referenced & fully indexed offline
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Bottom CTA Banner */}
                        <motion.div
                            {...fadeUp(0.2)}
                            className="relative mt-16 overflow-hidden rounded-3xl border border-ed-rule-strong/90 bg-gradient-to-r from-ed-surface via-ed-surface/90 to-ed-surface/70 p-8 sm:p-12 shadow-2xl backdrop-blur-xl text-center"
                        >
                            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-ed-accent/10 blur-3xl" />
                            <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

                            <div className="relative mx-auto max-w-2xl space-y-6">
                                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-[0.7rem] font-mono font-semibold uppercase tracking-wider text-amber-500 shadow-sm">
                                    <Clock className="h-3 w-3" />
                                    <span>Public Release Coming Soon</span>
                                </div>
                                <h3 className="font-display text-2xl font-bold text-ed-fg sm:text-3xl">
                                    Ready to explore the archive offline?
                                </h3>
                                <p className="text-sm leading-relaxed text-ed-fg-muted sm:text-base">
                                    We are putting the final polish on SA Studio desktop binaries. Standalone installers will be available to download right here once ready.
                                </p>
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <DownloadButton platform={platform} primary />
                                    {otherPlatforms.map((p) => (
                                        <DownloadButton key={p} platform={p} />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>
        </div>
    );
}

function TabButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-medium transition-all select-none ${
                active
                    ? 'bg-ed-fg text-ed-bg shadow-sm'
                    : 'text-ed-fg-muted hover:bg-ed-surface hover:text-ed-fg'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

function DownloadButton({ platform, primary }: { platform: Platform; primary?: boolean }) {
    const Icon = platform === 'macos' ? Apple : platform === 'windows' ? MonitorSmartphone : Terminal;
    const label = `Download for ${PLATFORM_LABEL[platform]}`;

    if (primary) {
        return (
            <a
                href="#"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                className="group relative inline-flex h-12 shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-xl bg-ed-fg px-7 text-sm font-semibold text-ed-bg shadow-lg shadow-black/10 transition-all hover:bg-ed-fg/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ed-accent outline-none cursor-default"
            >
                <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                <span>{label}</span>
                <span className="rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 text-[0.65rem] font-mono font-medium">
                    Coming Soon
                </span>
            </a>
        );
    }

    return (
        <a
            href="#"
            aria-disabled="true"
            onClick={(e) => e.preventDefault()}
            className="inline-flex h-12 shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-ed-rule-strong bg-ed-surface/80 px-5 text-sm font-medium text-ed-fg-muted transition-all hover:border-ed-fg hover:text-ed-fg hover:bg-ed-surface active:scale-[0.98] outline-none cursor-default"
        >
            <Icon className="h-4 w-4" />
            <span>{PLATFORM_LABEL[platform]}</span>
            <span className="text-[0.65rem] font-mono text-ed-fg-muted/80">(Soon)</span>
        </a>
    );
}

function StripItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
    return (
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ed-surface border border-ed-rule text-ed-fg shadow-sm">
                {icon}
            </div>
            <h3 className="font-semibold text-base text-ed-fg">{title}</h3>
            <p className="text-sm leading-relaxed text-ed-fg-muted">{body}</p>
        </div>
    );
}
