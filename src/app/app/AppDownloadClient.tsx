'use client';

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
    Search,
    Sparkles,
    Terminal,
    Zap,
    Columns,
    LayoutGrid,
    BookOpen,
    Layers,
    Keyboard,
    Check,
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
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function AppDownloadClient() {
    const platform = useSyncExternalStore<Platform>(subscribePlatform, getPlatformSnapshot, () => 'macos');
    const [activeTab, setActiveTab] = useState<'editor' | 'canvas' | 'graph' | 'split' | 'search'>('editor');

    const otherPlatforms: Platform[] = (['macos', 'windows', 'linux'] as Platform[]).filter((p) => p !== platform);

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg">
            <main id="main-content">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
                    {/* Background Gradients */}
                    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-b from-ed-accent/15 via-ed-accent/5 to-transparent blur-3xl" />
                        <div className="absolute top-1/3 -left-40 h-[400px] w-[500px] rounded-full bg-ed-surface-strong/40 blur-3xl" />
                        <div className="absolute top-1/4 -right-40 h-[400px] w-[500px] rounded-full bg-ed-surface-strong/30 blur-3xl" />
                    </div>

                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div {...fadeUp(0)}>
                            {/* App Identity Tag */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/80 px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                                </span>
                                <span className="text-[0.72rem] font-mono font-semibold uppercase tracking-[0.14em] text-ed-fg">
                                    SA Studio · Offline Scholarly Workspace
                                </span>
                            </div>

                            {/* Main Title */}
                            <h1 className="mt-7 font-display text-4xl font-bold tracking-tight text-ed-fg sm:text-5xl lg:text-6xl">
                                Your archive, on your own disk.
                            </h1>

                            {/* Lead paragraph */}
                            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-ed-fg-muted sm:mt-10 sm:text-lg sm:leading-8">
                                SubmissionArchives Studio is a high-performance desktop workspace for reading, tagging,
                                cross-referencing, and expanding the archive. Engineered with native Rust and Tauri for complete offline privacy, academic transliteration, and visual knowledge synthesis.
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

                                {/* Coming Soon Disclaimer Card (High-Contrast Clean Style) */}
                                <div className="mt-4 mx-auto max-w-lg rounded-xl border border-ed-rule-strong bg-ed-surface/90 p-4 text-xs leading-relaxed text-ed-fg-muted backdrop-blur-md shadow-sm">
                                    <div className="flex items-center justify-center gap-2 font-mono text-[0.72rem] font-bold uppercase tracking-wider text-ed-fg mb-1">
                                        <Clock className="h-3.5 w-3.5 text-ed-fg-muted" />
                                        <span>Active Development · Standalone Binaries Coming Soon</span>
                                    </div>
                                    <p className="text-center">
                                        SA Studio is currently in active development. Official standalone installers for macOS, Windows, and Linux will be downloadable directly from this page.
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
                            {/* Window container */}
                            <div className="overflow-hidden rounded-xl border border-ed-rule-strong bg-ed-surface/95 shadow-2xl backdrop-blur-2xl">
                                {/* Titlebar */}
                                <div className="flex h-11 items-center justify-between border-b border-ed-rule px-4 bg-ed-surface-strong/40 select-none">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-red-500/80 border border-red-600/40" />
                                        <div className="h-3 w-3 rounded-full bg-yellow-500/80 border border-yellow-600/40" />
                                        <div className="h-3 w-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                                    </div>
                                    <div className="flex items-center gap-2 text-[0.75rem] font-mono text-ed-fg-muted">
                                        <HardDrive className="h-3.5 w-3.5 opacity-70" />
                                        <span>~/Documents/SubmissionArchives-Vault</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded px-2 py-0.5 font-mono text-[0.68rem] bg-ed-surface border border-ed-rule text-ed-fg-muted">
                                            ⌘K Palette
                                        </span>
                                    </div>
                                </div>

                                {/* Showcase navigation tabs */}
                                <div className="flex border-b border-ed-rule bg-ed-surface/50 px-3 py-2 gap-1 overflow-x-auto text-xs no-scrollbar">
                                    <TabButton
                                        active={activeTab === 'editor'}
                                        onClick={() => setActiveTab('editor')}
                                        icon={<PenLine className="h-3.5 w-3.5" />}
                                        label="Precision Editor"
                                    />
                                    <TabButton
                                        active={activeTab === 'canvas'}
                                        onClick={() => setActiveTab('canvas')}
                                        icon={<LayoutGrid className="h-3.5 w-3.5" />}
                                        label="Synthesis Canvas"
                                    />
                                    <TabButton
                                        active={activeTab === 'graph'}
                                        onClick={() => setActiveTab('graph')}
                                        icon={<GitBranch className="h-3.5 w-3.5" />}
                                        label="Knowledge Graph"
                                    />
                                    <TabButton
                                        active={activeTab === 'split'}
                                        onClick={() => setActiveTab('split')}
                                        icon={<Columns className="h-3.5 w-3.5" />}
                                        label="Multi-Pane Split"
                                    />
                                    <TabButton
                                        active={activeTab === 'search'}
                                        onClick={() => setActiveTab('search')}
                                        icon={<Search className="h-3.5 w-3.5" />}
                                        label="Fuzzy Search"
                                    />
                                </div>

                                {/* Window Content Body */}
                                <div className="p-6 sm:p-8 min-h-[320px]">
                                    <AnimatePresence mode="wait">
                                        {activeTab === 'editor' && (
                                            <motion.div
                                                key="editor"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-4 font-sans"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ed-rule pb-3">
                                                    <div className="flex items-center gap-2 font-mono text-xs text-ed-fg-muted">
                                                        <span>📁 01-Scripture-Studies</span>
                                                        <span>/</span>
                                                        <span className="font-semibold text-ed-fg">Ayat-al-Kursi-Exegesis.md</span>
                                                    </div>
                                                    <div className="flex gap-1.5 font-mono text-[0.7rem]">
                                                        <span className="rounded bg-ed-surface-strong px-2 py-0.5 text-ed-fg-muted border border-ed-rule">#theology</span>
                                                        <span className="rounded bg-ed-surface-strong px-2 py-0.5 text-ed-fg-muted border border-ed-rule">#tawhid</span>
                                                    </div>
                                                </div>

                                                <h3 className="font-display text-2xl font-bold text-ed-fg">
                                                    Ayat al-Kursī Exegesis (Sūrah Al-Baqarah 2:255)
                                                </h3>

                                                <p className="text-sm leading-relaxed text-ed-fg-muted">
                                                    The Verse of the Throne represents the theological pinnacle of absolute monotheism (*Tawḥīd*) in the Quranic corpus. Academic transliteration expands terms like <code className="px-1.5 py-0.5 rounded bg-ed-surface-strong font-mono text-xs text-ed-fg border border-ed-rule">Qur&apos;ān</code> and <code className="px-1.5 py-0.5 rounded bg-ed-surface-strong font-mono text-xs text-ed-fg border border-ed-rule">Ḥadīth</code> automatically.
                                                </p>

                                                {/* Quran Embed Box */}
                                                <div className="rounded-lg border border-ed-rule bg-ed-surface/70 p-4 font-mono text-xs space-y-2">
                                                    <div className="flex items-center justify-between text-ed-fg-muted text-[0.72rem]">
                                                        <span className="font-semibold text-ed-fg flex items-center gap-1.5">
                                                            <BookOpen className="h-3.5 w-3.5" />
                                                            Sūrah Al-Baqarah (2:255)
                                                        </span>
                                                        <span>Verse 255</span>
                                                    </div>
                                                    <p className="font-serif text-right text-lg text-ed-fg leading-loose pt-1 font-arabic" dir="rtl">
                                                        اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
                                                    </p>
                                                    <p className="text-xs text-ed-fg-muted font-sans italic pt-1 border-t border-ed-rule/60">
                                                        &ldquo;GOD: there is no god except He, the Living, the Eternal.&rdquo;
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'canvas' && (
                                            <motion.div
                                                key="canvas"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-3"
                                            >
                                                <div className="flex items-center justify-between border-b border-ed-rule pb-2 text-xs font-mono text-ed-fg-muted">
                                                    <span>Visual Synthesis Canvas · Infinite 2D Workspace</span>
                                                    <span className="rounded bg-ed-surface px-2 py-0.5 text-[0.68rem] text-ed-fg">Zoom 100%</span>
                                                </div>
                                                <div className="relative h-52 w-full rounded-lg border border-ed-rule bg-ed-bg/80 p-4 overflow-hidden flex items-center justify-center gap-4">
                                                    {/* Concept Card 1 */}
                                                    <div className="w-48 p-3 rounded-lg border border-ed-rule bg-ed-surface/90 shadow-md text-xs space-y-1">
                                                        <div className="font-bold text-ed-fg flex items-center justify-between">
                                                            <span>Surah Al-Kahf (18:1-10)</span>
                                                        </div>
                                                        <p className="text-[11px] text-ed-fg-muted">Core theme of faith & preservation.</p>
                                                    </div>
                                                    <span className="text-ed-fg-muted font-mono">──▶</span>
                                                    {/* I'rab Syntax Diagram Card */}
                                                    <div className="w-56 p-3 rounded-lg border border-ed-rule bg-ed-surface/90 shadow-md text-xs space-y-1.5">
                                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ed-fg-muted">
                                                            I‘rāb Syntax Tree
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded bg-ed-surface-strong border border-ed-rule font-mono text-[10px] text-ed-fg">Allāhu</span>
                                                            <span className="text-[10px] text-ed-fg-muted">Mubtada&apos; (Subject)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-mono text-ed-fg-muted text-center">
                                                    Spatial note arrangement, verse cards, and Arabic grammar diagramming.
                                                </p>
                                            </motion.div>
                                        )}

                                        {activeTab === 'graph' && (
                                            <motion.div
                                                key="graph"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex flex-col items-center justify-center py-4 text-center"
                                            >
                                                <div className="relative flex h-48 w-full items-center justify-center rounded-lg border border-ed-rule bg-ed-surface/40 overflow-hidden">
                                                    <div className="relative h-32 w-72">
                                                        <div className="absolute left-1/2 top-1/2 h-[1px] w-24 -translate-x-12 -translate-y-6 rotate-45 bg-ed-rule-strong" />
                                                        <div className="absolute left-1/2 top-1/2 h-[1px] w-28 -translate-x-14 translate-y-4 -rotate-30 bg-ed-rule-strong" />
                                                        <div className="absolute left-1/2 top-1/2 h-[1px] w-20 -translate-x-4 -translate-y-8 -rotate-60 bg-ed-rule-strong" />

                                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-md border border-ed-rule-strong bg-ed-surface-strong px-3 py-1 text-xs font-bold text-ed-fg shadow-md">
                                                            <GitBranch className="h-3 w-3" />
                                                            <span>Quran 2:255</span>
                                                        </div>
                                                        <div className="absolute left-4 top-4 rounded-md border border-ed-rule bg-ed-surface px-2.5 py-1 text-[0.7rem] font-mono text-ed-fg">
                                                            Tawḥīd Study
                                                        </div>
                                                        <div className="absolute right-6 top-6 rounded-md border border-ed-rule bg-ed-surface px-2.5 py-1 text-[0.7rem] font-mono text-ed-fg">
                                                            Appendix 1
                                                        </div>
                                                        <div className="absolute left-10 bottom-3 rounded-md border border-ed-rule bg-ed-surface px-2.5 py-1 text-[0.7rem] font-mono text-ed-fg">
                                                            Audio #44
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs font-mono text-ed-fg-muted">
                                                    Interactive 2D Force-Directed Graph · Trace connections between any verse, audio, or note
                                                </p>
                                            </motion.div>
                                        )}

                                        {activeTab === 'split' && (
                                            <motion.div
                                                key="split"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-3"
                                            >
                                                <div className="flex items-center justify-between border-b border-ed-rule pb-2 text-xs font-mono text-ed-fg-muted">
                                                    <span>Multi-Pane Workspace · Side-by-Side Comparison</span>
                                                    <kbd className="rounded bg-ed-surface px-1.5 py-0.5 text-[0.65rem] border border-ed-rule text-ed-fg">Ctrl+\</kbd>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 h-48">
                                                    <div className="p-3.5 rounded-lg border border-ed-rule bg-ed-bg/80 space-y-2">
                                                        <span className="text-xs font-semibold text-ed-fg block">Note: Surah Kahf Analysis</span>
                                                        <p className="text-xs text-ed-fg-muted">Primary commentary and cross-references...</p>
                                                    </div>
                                                    <div className="p-3.5 rounded-lg border border-ed-rule bg-ed-bg/80 space-y-2">
                                                        <span className="text-xs font-semibold text-ed-fg block">Reference: Historical Print</span>
                                                        <p className="text-xs text-ed-fg-muted">Integrated PDF viewer & quote capture drawer...</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        {activeTab === 'search' && (
                                            <motion.div
                                                key="search"
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -8 }}
                                                transition={{ duration: 0.2 }}
                                                className="space-y-3"
                                            >
                                                <div className="relative flex items-center rounded-lg border border-ed-rule bg-ed-bg px-3.5 py-2.5 shadow-inner">
                                                    <Search className="h-4 w-4 text-ed-fg-muted mr-2.5" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value="> Kahf 1-10"
                                                        className="w-full bg-transparent font-mono text-xs text-ed-fg outline-none"
                                                    />
                                                    <span className="rounded bg-ed-surface-strong px-2 py-0.5 text-[0.65rem] font-mono text-ed-fg-muted border border-ed-rule">
                                                        Instant 1ms
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 font-mono text-xs">
                                                    <div className="flex items-center justify-between rounded-lg bg-ed-surface-strong p-2.5 text-ed-fg font-medium border border-ed-rule">
                                                        <span>📖 Sūrah Al-Kahf (18:1-10)</span>
                                                        <span className="text-[0.7rem] text-ed-fg-muted">Insert Verse ↵</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-lg p-2.5 text-ed-fg-muted hover:bg-ed-surface">
                                                        <span>📄 Notes/Surah-Kahf-Study.md</span>
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

                {/* Local-First Architecture Strip */}
                <section className="border-y border-ed-rule bg-ed-surface/40 backdrop-blur-sm">
                    <motion.div {...fadeUp()} className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-16 sm:grid-cols-3 sm:px-6">
                        <StripItem
                            icon={<HardDrive className="h-5 w-5" />}
                            title="Plain Markdown Files"
                            body="Your archive lives in a folder on your drive. Open it in Obsidian, VS Code, or any text editor anytime — zero proprietary lock-in."
                        />
                        <StripItem
                            icon={<Zap className="h-5 w-5" />}
                            title="Instant Native Speed"
                            body="Engineered with Rust and Tauri for near-zero startup time, tiny memory footprint, and complete offline independence."
                        />
                        <StripItem
                            icon={<GitBranch className="h-5 w-5" />}
                            title="Living Knowledge Graph"
                            body="Explore connections between verses, historical audios, transcripts, and notes as a navigable visual network."
                        />
                    </motion.div>
                </section>

                {/* Bento Features Grid */}
                <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
                    <motion.div {...fadeUp()} className="text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/70 px-3.5 py-1 text-[0.72rem] font-mono font-medium uppercase tracking-[0.14em] text-ed-fg-muted shadow-sm">
                            <Sparkles className="h-3 w-3 text-ed-fg-muted" />
                            <span>Built for Scholarly Depth & Research Speed</span>
                        </div>
                        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ed-fg sm:text-4xl lg:text-5xl">
                            Everything you need to study and expand the archive
                        </h2>
                        <p className="mx-auto mt-4 max-w-2xl text-base text-ed-fg-muted sm:text-lg">
                            Purpose-built capabilities designed specifically for precision research, cross-referencing, and visual synthesis.
                        </p>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Bento 1: Academic Transliteration & Quran Engine */}
                        <motion.div {...fadeUp(0.05)} className="md:col-span-2">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-ed-rule bg-ed-surface/70 p-7 shadow-sm transition-all duration-300 hover:border-ed-rule-strong">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Transliteration & Exegesis
                                        </span>
                                    </div>
                                    <h3 className="font-display text-2xl font-bold text-ed-fg">
                                        Academic Arabic Transliteration & Named Surah Search
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted max-w-xl">
                                        Automatic academic transliteration expands terms like <code className="rounded bg-ed-surface-strong px-1.5 py-0.5 font-mono text-xs text-ed-fg border border-ed-rule">Quran</code> to <code className="font-mono text-xs text-ed-fg">Qur&apos;ān</code> and supports fast diacritics (<code className="font-mono text-xs text-ed-fg">a=</code> $\rightarrow$ <code className="font-mono text-xs text-ed-fg">ā</code>, <code className="font-mono text-xs text-ed-fg">h.</code> $\rightarrow$ <code className="font-mono text-xs text-ed-fg">ḥ</code>). Type <code className="rounded bg-ed-surface-strong px-1.5 py-0.5 font-mono text-xs text-ed-fg border border-ed-rule">/quran Baqarah 255</code> to insert rich calligraphy cards.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-lg border border-ed-rule bg-ed-bg/80 p-4 font-mono text-xs">
                                    <div className="flex items-center justify-between border-b border-ed-rule pb-2 mb-2 text-[0.7rem] text-ed-fg-muted">
                                        <span>Live Transliteration & Diacritics Active</span>
                                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Auto-Formatted
                                        </span>
                                    </div>
                                    <p className="font-sans text-sm text-ed-fg leading-relaxed">
                                        Studying the theological significance of <span className="underline decoration-ed-rule-strong font-medium">Tawḥīd</span> and <span className="underline decoration-ed-rule-strong font-medium">Sharīʿah</span> principles across the Meccan revelations.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 2: Visual Synthesis Canvas */}
                        <motion.div {...fadeUp(0.1)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-ed-rule bg-ed-surface/70 p-7 shadow-sm transition-all duration-300 hover:border-ed-rule-strong">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Spatial Canvas
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Visual Whiteboard & I‘rāb Trees
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        Brainstorm ideas on an infinite 2D canvas with Quran verse cards, note embeds, and Arabic grammar sentence trees.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-lg border border-ed-rule bg-ed-bg/60 p-3 text-xs font-mono text-ed-fg-muted">
                                    <div className="flex items-center justify-between">
                                        <span>Curved Relational Connectors</span>
                                        <span className="text-ed-fg font-semibold">2D Infinite</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 3: Multi-Pane & PDF Research */}
                        <motion.div {...fadeUp(0.15)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-ed-rule bg-ed-surface/70 p-7 shadow-sm transition-all duration-300 hover:border-ed-rule-strong">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <Columns className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Multi-Pane
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Split View & PDF Capture
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        Compare notes side-by-side or open attached research PDFs to highlight passages and capture citations directly into your notes.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-lg border border-ed-rule bg-ed-bg/60 p-3 font-mono text-xs">
                                    <div className="flex items-center justify-between text-ed-fg">
                                        <span>Quote-to-Note Drawer</span>
                                        <kbd className="text-[10px] bg-ed-surface px-1.5 py-0.5 rounded border border-ed-rule">Ctrl+\</kbd>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 4: Universal Multi-Source Importer */}
                        <motion.div {...fadeUp(0.2)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-ed-rule bg-ed-surface/70 p-7 shadow-sm transition-all duration-300 hover:border-ed-rule-strong">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <Layers className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Interoperability
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Universal Import Wizard
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        Import Word/Google Docs (<code className="font-mono text-xs">.docx</code>), Notion exports with UUID hash cleanup, Obsidian vaults, or distributable <code className="font-mono text-xs">.sanote</code> packages.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-lg border border-ed-rule bg-ed-bg/60 p-3 font-mono text-[0.72rem] text-ed-fg-muted space-y-1">
                                    <div>✓ Word (.docx) native XML parser</div>
                                    <div>✓ Notion 32-char UUID cleaner</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 5: Raycast Keyboard-First Design */}
                        <motion.div {...fadeUp(0.25)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-ed-rule bg-ed-surface/70 p-7 shadow-sm transition-all duration-300 hover:border-ed-rule-strong">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ed-surface-strong border border-ed-rule text-ed-fg shadow-sm">
                                            <Keyboard className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-ed-fg-muted">
                                            Raycast Engine
                                        </span>
                                    </div>
                                    <h3 className="font-display text-xl font-bold text-ed-fg">
                                        Customizable Keybindings
                                    </h3>
                                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                                        Full keybinding customization with conflict detection, quick switcher, and command palette navigation.
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-around rounded-lg border border-ed-rule bg-ed-bg/60 p-3 font-mono text-xs">
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-ed-rule bg-ed-surface px-2 py-1 font-bold text-ed-fg shadow-sm">⌘P</kbd>
                                        <span className="text-[0.65rem] text-ed-fg-muted">Palette</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-ed-rule bg-ed-surface px-2 py-1 font-bold text-ed-fg shadow-sm">⌘O</kbd>
                                        <span className="text-[0.65rem] text-ed-fg-muted">Quick Open</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-ed-rule bg-ed-surface px-2 py-1 font-bold text-ed-fg shadow-sm">⌘,</kbd>
                                        <span className="text-[0.65rem] text-ed-fg-muted">Settings</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Setup Steps Section */}
                <section className="border-t border-ed-rule bg-ed-surface/20 py-24 sm:py-32">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <motion.div {...fadeUp()} className="text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface/70 px-3.5 py-1 text-[0.72rem] font-mono font-medium uppercase tracking-[0.14em] text-ed-fg-muted shadow-sm">
                                <span>Zero-Configuration Onboarding</span>
                            </div>
                            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-ed-fg sm:text-4xl lg:text-5xl">
                                Up and running in seconds
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-base text-ed-fg-muted sm:text-lg">
                                No accounts to create, no cloud telemetry. Three simple steps to a complete local workspace.
                            </p>
                        </motion.div>

                        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <StepCard
                                number="01"
                                badge="Install Binary"
                                title="Download the Native App"
                                body="Grab the lightweight standalone executable for macOS, Windows, or Linux. Starts up instantly with near-zero memory footprint."
                                visual={
                                    <div className="flex items-center justify-between text-ed-fg">
                                        <span className="font-semibold font-mono text-xs">SA-Studio-v1.0{PLATFORM_EXT[platform].split(' ')[0]}</span>
                                        <span className="text-[0.65rem] font-mono text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">Standalone</span>
                                    </div>
                                }
                            />
                            <StepCard
                                number="02"
                                badge="Workspace Selection"
                                title="Choose Your Archive"
                                body="Point the app at any directory on your computer, or 1-click launch a pre-populated study archive with complete scriptures and notes."
                                visual={
                                    <div className="flex items-center gap-2 text-ed-fg font-mono text-xs truncate">
                                        <FolderOpen className="h-4 w-4 shrink-0 text-ed-fg-muted" />
                                        <span className="truncate">~/Documents/Archive-Vault/</span>
                                    </div>
                                }
                            />
                            <StepCard
                                number="03"
                                badge="Research & Write"
                                title="Study, Link & Synthesize"
                                body="Take notes with live transliteration, search verses in sub-milliseconds, and synthesize ideas on the visual whiteboard canvas."
                                visual={
                                    <div className="flex items-center justify-between font-mono text-xs text-ed-fg">
                                        <span>Graph & Canvas Live</span>
                                        <kbd className="rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 text-[0.65rem] font-bold">⌘P</kbd>
                                    </div>
                                }
                            />
                        </div>

                        {/* Bottom CTA Banner */}
                        <motion.div
                            {...fadeUp(0.2)}
                            className="relative mt-16 overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/80 p-8 sm:p-12 shadow-xl backdrop-blur-xl text-center"
                        >
                            <div className="relative mx-auto max-w-2xl space-y-6">
                                <div className="inline-flex items-center gap-2 rounded-full border border-ed-rule bg-ed-surface px-3.5 py-1 text-[0.7rem] font-mono font-bold uppercase tracking-wider text-ed-fg shadow-sm">
                                    <Clock className="h-3 w-3 text-ed-fg-muted" />
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
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 font-medium transition-all select-none text-xs shrink-0 ${
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
                className="group relative inline-flex h-12 shrink-0 select-none items-center justify-center gap-3 whitespace-nowrap rounded-xl bg-ed-fg px-6 text-sm font-semibold text-ed-bg shadow-md transition-all hover:bg-ed-fg/90 active:scale-[0.98] outline-none cursor-default"
            >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                <span className="rounded bg-ed-surface/90 text-ed-fg border border-ed-rule-strong px-2 py-0.5 text-[0.68rem] font-mono font-bold tracking-wider uppercase">
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
            className="inline-flex h-12 shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-xl border border-ed-rule bg-ed-surface/80 px-5 text-sm font-medium text-ed-fg-muted transition-all hover:border-ed-rule-strong hover:text-ed-fg hover:bg-ed-surface active:scale-[0.98] outline-none cursor-default"
        >
            <Icon className="h-4 w-4" />
            <span>{PLATFORM_LABEL[platform]}</span>
            <span className="text-[0.68rem] font-mono text-ed-fg-muted/80">(Soon)</span>
        </a>
    );
}

function StepCard({
    number,
    badge,
    title,
    body,
    visual,
}: {
    number: string;
    badge: string;
    title: string;
    body: string;
    visual: ReactNode;
}) {
    return (
        <motion.div {...fadeUp(0.05)} className="relative">
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-ed-rule bg-ed-surface/70 p-7 shadow-sm transition-all duration-300 hover:border-ed-rule-strong">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ed-surface-strong border border-ed-rule font-mono text-xs font-bold text-ed-fg shadow-sm">
                            {number}
                        </span>
                        <span className="rounded-full border border-ed-rule bg-ed-surface-strong px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-ed-fg-muted">
                            {badge}
                        </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-ed-fg">
                        {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ed-fg-muted">
                        {body}
                    </p>
                </div>

                <div className="mt-6 rounded-lg border border-ed-rule bg-ed-bg/70 p-3.5 shadow-inner">
                    {visual}
                </div>
            </div>
        </motion.div>
    );
}

function StripItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
    return (
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ed-surface border border-ed-rule text-ed-fg shadow-sm">
                {icon}
            </div>
            <h3 className="font-semibold text-base text-ed-fg">{title}</h3>
            <p className="text-sm leading-relaxed text-ed-fg-muted">{body}</p>
        </div>
    );
}
