'use client';

import { useSyncExternalStore, useState, type ReactNode } from 'react';
import Image from 'next/image';
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
    ArrowUpRight,
} from 'lucide-react';
import { FluidTabs } from '@/components/ui/fluid-tabs';
import { CardSplitAccordion, type AccordionItemData } from '@/components/ui/card-split-accordion';

const STUDIO_ARCHITECTURE_ACCORDION: AccordionItemData[] = [
    {
        id: 'engine-1',
        title: 'Native Rust Engine & Tauri IPC Bridge',
        badge: 'Near-Zero RAM',
        icon: <Zap className="h-4 w-4 text-[#C8794A]" />,
        content:
            'Constructed on Tauri v2 and native Rust bindings, achieving instant launch in under 80ms and resting memory usage under 45MB — unlike bloated Chromium wrappers.',
    },
    {
        id: 'engine-2',
        title: 'Local-First SQLite & Vector Search Database',
        badge: 'Zero Cloud Lock-In',
        icon: <HardDrive className="h-4 w-4 text-[#C8794A]" />,
        content:
            'Your notes and transcript links are stored as open standard Markdown and SQLite on your own SSD. Full-text search and BM25 ranking execute entirely offline with zero network latency.',
    },
    {
        id: 'engine-3',
        title: 'Arabic Diacritics & Named Surah Autocomplete',
        badge: 'Academic Engine',
        icon: <BookOpen className="h-4 w-4 text-[#C8794A]" />,
        content:
            'Type fast shortcuts like "a=" for "ā" or "/quran Baqarah 255" to auto-insert rich scripture cards with calligraphy, verse numbers, and transliteration headers.',
    },
    {
        id: 'engine-4',
        title: 'Bidirectional Wiki-Links & Interactive Canvas',
        badge: 'Knowledge Graph',
        icon: <GitBranch className="h-4 w-4 text-[#C8794A]" />,
        content:
            'Connect sermon insights, historical newsletter articles, and personal commentary with [[Wiki-Links]]. Explore emergent theological themes on an infinite 2D spatial canvas.',
    },
];

type Platform = 'macos' | 'windows' | 'linux';

function getPlatformSnapshot(): Platform {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return 'macos';
    const ua = navigator.userAgent;
    if (/Mac/.test(ua)) return 'macos';
    if (/Win/.test(ua)) return 'windows';
    return 'linux';
}

function subscribePlatform() {
    return () => { };
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
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.26, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export default function AppDownloadClient() {
    const platform = useSyncExternalStore<Platform>(subscribePlatform, getPlatformSnapshot, () => 'macos');
    const [activeTab, setActiveTab] = useState<'editor' | 'canvas' | 'graph' | 'split' | 'search'>('editor');

    const otherPlatforms: Platform[] = (['macos', 'windows', 'linux'] as Platform[]).filter((p) => p !== platform);

    return (
        <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans antialiased selection:bg-[#C8794A]/25 selection:text-[#F5F0EB]">
            {/* Ambient page glow */}
            <div
                aria-hidden
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.035) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.02) 0%, transparent 70%)',
                }}
            />

            <main id="main-content" className="relative z-[1]">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
                    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
                        <motion.div {...fadeUp(0)}>
                            {/* App Icon Vessel */}
                            <div className="relative mb-8 flex flex-col items-center justify-center">
                                <motion.div
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                                    className="group relative cursor-pointer select-none"
                                >
                                    {/* Ambient Glow */}
                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute -inset-8 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(200,121,74,0.35)_0%,rgba(200,121,74,0.18)_40%,transparent_75%)] opacity-85 blur-3xl transition-all duration-700 group-hover:scale-115 group-hover:opacity-100"
                                    />

                                    {/* Pulse Ring */}
                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute -inset-2 rounded-[34px] border border-[#C8794A]/30 opacity-50 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90 group-hover:border-[#C8794A]/60 sm:rounded-[38px]"
                                    />

                                    {/* 3D App Icon Tile */}
                                    <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-[26px] border border-[#2A2928] bg-gradient-to-b from-[#1E1D1C] via-[#161514] to-[#121110] p-5 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)_inset,0_0_24px_rgba(200,121,74,0.1)_inset] backdrop-blur-2xl transition-all duration-300 group-hover:border-[#C8794A]/50 group-hover:shadow-[0_30px_70px_-12px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.15)_inset] sm:h-32 sm:w-32 sm:rounded-[30px] sm:p-6">
                                        {/* Specular Bevel */}
                                        <div
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-[26px] bg-gradient-to-b from-white/15 via-white/5 to-transparent sm:rounded-t-[30px]"
                                        />

                                        {/* Official Brand Emblem */}
                                        <div className="relative h-full w-full">
                                            <Image
                                                src="/assets/brand/submission-archives-mark.png"
                                                alt="Submission Archives Studio App Icon"
                                                fill
                                                sizes="(max-width: 640px) 112px, 128px"
                                                className="object-contain filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.5)] transition-transform duration-500 ease-out group-hover:scale-105"
                                                priority
                                                loading="eager"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* App Identity Tag */}
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8794A]/20 bg-[#161514] px-3.5 py-1.5 backdrop-blur-md shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C8794A] opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8794A] shadow-[0_0_8px_rgba(200,121,74,0.8)]" />
                                </span>
                                <span className="text-[0.72rem] font-mono font-semibold uppercase tracking-[0.14em] text-[#C8794A]">
                                    SA Studio · Offline Scholarly Workspace
                                </span>
                            </div>

                            {/* Main Title */}
                            <h1
                                className="mt-7 text-[clamp(2.5rem,5.5vw,4.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                Your archive, on your own disk.
                            </h1>

                            {/* Lead paragraph */}
                            <p
                                className="mx-auto mt-6 max-w-2xl text-[17px] leading-[1.65] text-[#9E9690]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                SubmissionArchives Studio is a high-performance desktop workspace for reading, tagging,
                                cross-referencing, and expanding the archive. Engineered with native Rust and Tauri for
                                complete offline privacy, academic transliteration, and visual knowledge synthesis.
                            </p>

                            {/* Download & Platform CTA */}
                            <div className="mt-10 flex flex-col items-center gap-4">
                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <DownloadButton platform={platform} primary />
                                    {otherPlatforms.map((p) => (
                                        <DownloadButton key={p} platform={p} />
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-[#6B6560]">
                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#C8794A]" />
                                    <span>Tauri & Rust Native</span>
                                    <span className="hidden sm:inline">·</span>
                                    <span>Zero Cloud Lock-in</span>
                                    <span className="hidden sm:inline">·</span>
                                    <span className="rounded bg-[#1C1B1A] border border-[#2A2928] px-2 py-0.5 font-semibold text-[#F5F0EB]">
                                        Standalone Executable
                                    </span>
                                </div>

                                {/* Active Development Notice Card */}
                                <div className="mt-4 mx-auto max-w-lg rounded-[8px] border border-[#2A2928] bg-[#161514] p-4 text-xs leading-relaxed text-[#9E9690] shadow-sm">
                                    <div className="flex items-center justify-center gap-2 font-mono text-[0.72rem] font-bold uppercase tracking-wider text-[#F5F0EB] mb-1">
                                        <Clock className="h-3.5 w-3.5 text-[#C8794A]" />
                                        <span>Active Development · Standalone Binaries Coming Soon</span>
                                    </div>
                                    <p className="text-center text-[#6B6560]">
                                        SA Studio is currently in active development. Official standalone installers for
                                        macOS, Windows, and Linux will be downloadable directly from this page.
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
                            <div className="overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] shadow-2xl backdrop-blur-2xl">
                                {/* Titlebar */}
                                <div className="flex h-11 items-center justify-between border-b border-[#2A2928] px-3 sm:px-4 bg-[#1C1B1A] select-none">
                                    <div className="flex items-center gap-2 shrink-0">
                                        <div className="h-3 w-3 rounded-full bg-[#E06C75]/80 border border-[#E06C75]/40" />
                                        <div className="h-3 w-3 rounded-full bg-[#E5C07B]/80 border border-[#E5C07B]/40" />
                                        <div className="h-3 w-3 rounded-full bg-[#98C379]/80 border border-[#98C379]/40" />
                                    </div>
                                    <div className="flex items-center gap-2 text-[0.75rem] font-mono text-[#6B6560] truncate px-2">
                                        <Image
                                            src="/assets/brand/submission-archives-mark.png"
                                            alt=""
                                            width={16}
                                            height={16}
                                            className="h-4 w-4 object-contain rounded-sm shrink-0"
                                        />
                                        <span className="font-bold text-[#F5F0EB]">SA Studio</span>
                                        <span className="opacity-30 hidden sm:inline">/</span>
                                        <span className="hidden sm:inline truncate">~/Documents/SubmissionArchives-Vault</span>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        <span className="rounded-[4px] px-2 py-0.5 font-mono text-[0.68rem] bg-[#161514] border border-[#2A2928] text-[#9E9690]">
                                            ⌘K Palette
                                        </span>
                                    </div>
                                </div>

                                {/* Showcase navigation tabs with FluidTabs */}
                                <div className="border-b border-[#2A2928] bg-[#161514] p-2 overflow-x-auto no-scrollbar">
                                    <FluidTabs
                                        size="sm"
                                        activeId={activeTab}
                                        onChange={(id) => setActiveTab(id as 'editor' | 'canvas' | 'graph' | 'split' | 'search')}
                                        tabs={[
                                            { id: 'editor', label: 'Precision Editor', icon: <PenLine className="h-3.5 w-3.5" /> },
                                            { id: 'canvas', label: 'Synthesis Canvas', icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                                            { id: 'graph', label: 'Knowledge Graph', icon: <GitBranch className="h-3.5 w-3.5" /> },
                                            { id: 'split', label: 'Multi-Pane Split', icon: <Columns className="h-3.5 w-3.5" /> },
                                            { id: 'search', label: 'Fuzzy Search', icon: <Search className="h-3.5 w-3.5" /> },
                                        ]}
                                    />
                                </div>

                                {/* Window Content Body */}
                                <div className="p-6 sm:p-8 min-h-[320px] bg-[#0F0E0D]">
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
                                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2928] pb-3">
                                                    <div className="flex items-center gap-2 font-mono text-xs text-[#6B6560]">
                                                        <span>📁 01-Scripture-Studies</span>
                                                        <span>/</span>
                                                        <span className="font-semibold text-[#F5F0EB]">Ayat-al-Kursi-Exegesis.md</span>
                                                    </div>
                                                    <div className="flex gap-1.5 font-mono text-[0.7rem]">
                                                        <span className="rounded-[4px] bg-[#161514] px-2 py-0.5 text-[#9E9690] border border-[#2A2928]">#theology</span>
                                                        <span className="rounded-[4px] bg-[#161514] px-2 py-0.5 text-[#9E9690] border border-[#2A2928]">#tawhid</span>
                                                    </div>
                                                </div>

                                                <h3
                                                    className="text-2xl font-bold text-[#F5F0EB]"
                                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                                >
                                                    Ayat al-Kursī Exegesis (Sūrah Al-Baqarah 2:255)
                                                </h3>

                                                <p
                                                    className="text-sm leading-relaxed text-[#9E9690]"
                                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                >
                                                    The Verse of the Throne represents the theological pinnacle of absolute monotheism (*Tawḥīd*) in the Quranic corpus. Academic transliteration expands terms like{' '}
                                                    <code className="px-1.5 py-0.5 rounded bg-[#161514] font-mono text-xs text-[#C8794A] border border-[#2A2928]">
                                                        Qur&apos;ān
                                                    </code>{' '}
                                                    and{' '}
                                                    <code className="px-1.5 py-0.5 rounded bg-[#161514] font-mono text-xs text-[#C8794A] border border-[#2A2928]">
                                                        Ḥadīth
                                                    </code>{' '}
                                                    automatically.
                                                </p>

                                                {/* Quran Embed Box */}
                                                <div className="rounded-[8px] border-l-2 border-l-[#C8794A] border border-[#2A2928] bg-[rgba(200,121,74,0.04)] p-4 font-mono text-xs space-y-2">
                                                    <div className="flex items-center justify-between text-[#6B6560] text-[0.72rem]">
                                                        <span className="font-semibold text-[#C8794A] flex items-center gap-1.5">
                                                            <BookOpen className="h-3.5 w-3.5" />
                                                            Sūrah Al-Baqarah (2:255)
                                                        </span>
                                                        <span>Verse 255</span>
                                                    </div>
                                                    <p className="font-arabic text-right text-xl text-[#F5F0EB] leading-loose pt-1" dir="rtl">
                                                        اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
                                                    </p>
                                                    <p
                                                        className="text-xs text-[#9E9690] italic pt-1 border-t border-[#2A2928]"
                                                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                    >
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
                                                <div className="flex items-center justify-between border-b border-[#2A2928] pb-2 text-xs font-mono text-[#6B6560]">
                                                    <span>Visual Synthesis Canvas · Infinite 2D Workspace</span>
                                                    <span className="rounded bg-[#161514] border border-[#2A2928] px-2 py-0.5 text-[0.68rem] text-[#F5F0EB]">Zoom 100%</span>
                                                </div>
                                                <div className="relative h-52 w-full rounded-[8px] border border-[#2A2928] bg-[#0F0E0D] p-4 overflow-hidden flex items-center justify-center gap-4">
                                                    {/* Concept Card 1 */}
                                                    <div className="w-48 p-3 rounded-[8px] border border-[#2A2928] bg-[#161514] shadow-md text-xs space-y-1">
                                                        <div className="font-bold text-[#F5F0EB] flex items-center justify-between">
                                                            <span>Surah Al-Kahf (18:1-10)</span>
                                                        </div>
                                                        <p className="text-[11px] text-[#6B6560]">Core theme of faith & preservation.</p>
                                                    </div>
                                                    <span className="text-[#C8794A] font-mono">──▶</span>
                                                    {/* I'rab Syntax Diagram Card */}
                                                    <div className="w-56 p-3 rounded-[8px] border border-[#2A2928] bg-[#161514] shadow-md text-xs space-y-1.5">
                                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#C8794A]">
                                                            I‘rāb Syntax Tree
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="px-1.5 py-0.5 rounded bg-[#1C1B1A] border border-[#2A2928] font-mono text-[10px] text-[#F5F0EB]">Allāhu</span>
                                                            <span className="text-[10px] text-[#9E9690]">Mubtada&apos; (Subject)</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-mono text-[#6B6560] text-center">
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
                                                <div className="relative flex h-48 w-full items-center justify-center rounded-[8px] border border-[#2A2928] bg-[#161514] overflow-hidden">
                                                    <div className="relative h-32 w-72">
                                                        <div className="absolute left-1/2 top-1/2 h-[1px] w-24 -translate-x-12 -translate-y-6 rotate-45 bg-[#353433]" />
                                                        <div className="absolute left-1/2 top-1/2 h-[1px] w-28 -translate-x-14 translate-y-4 -rotate-30 bg-[#353433]" />
                                                        <div className="absolute left-1/2 top-1/2 h-[1px] w-20 -translate-x-4 -translate-y-8 -rotate-60 bg-[#353433]" />

                                                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 rounded-[4px] border border-[#C8794A]/40 bg-[#C8794A]/10 px-3 py-1 text-xs font-bold text-[#C8794A] shadow-md">
                                                            <GitBranch className="h-3 w-3" />
                                                            <span>Quran 2:255</span>
                                                        </div>
                                                        <div className="absolute left-4 top-4 rounded-[4px] border border-[#2A2928] bg-[#1C1B1A] px-2.5 py-1 text-[0.7rem] font-mono text-[#F5F0EB]">
                                                            Tawḥīd Study
                                                        </div>
                                                        <div className="absolute right-6 top-6 rounded-[4px] border border-[#2A2928] bg-[#1C1B1A] px-2.5 py-1 text-[0.7rem] font-mono text-[#F5F0EB]">
                                                            Appendix 1
                                                        </div>
                                                        <div className="absolute left-10 bottom-3 rounded-[4px] border border-[#2A2928] bg-[#1C1B1A] px-2.5 py-1 text-[0.7rem] font-mono text-[#F5F0EB]">
                                                            Audio #44
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs font-mono text-[#6B6560]">
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
                                                <div className="flex items-center justify-between border-b border-[#2A2928] pb-2 text-xs font-mono text-[#6B6560]">
                                                    <span>Multi-Pane Workspace · Side-by-Side Comparison</span>
                                                    <kbd className="rounded bg-[#161514] px-1.5 py-0.5 text-[0.65rem] border border-[#2A2928] text-[#F5F0EB]">Ctrl+\</kbd>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 h-48">
                                                    <div className="p-3.5 rounded-[8px] border border-[#2A2928] bg-[#161514] space-y-2">
                                                        <span className="text-xs font-semibold text-[#F5F0EB] block">Note: Surah Kahf Analysis</span>
                                                        <p className="text-xs text-[#6B6560]">Primary commentary and cross-references...</p>
                                                    </div>
                                                    <div className="p-3.5 rounded-[8px] border border-[#2A2928] bg-[#161514] space-y-2">
                                                        <span className="text-xs font-semibold text-[#F5F0EB] block">Reference: Historical Print</span>
                                                        <p className="text-xs text-[#6B6560]">Integrated PDF viewer & quote capture drawer...</p>
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
                                                <div className="relative flex items-center rounded-[8px] border border-[#2A2928] bg-[#161514] px-3.5 py-2.5 shadow-inner">
                                                    <Search className="h-4 w-4 text-[#6B6560] mr-2.5" />
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value="> Kahf 1-10"
                                                        className="w-full bg-transparent font-mono text-xs text-[#F5F0EB] outline-none"
                                                    />
                                                    <span className="rounded bg-[#1C1B1A] px-2 py-0.5 text-[0.65rem] font-mono text-[#C8794A] border border-[#2A2928]">
                                                        Instant 1ms
                                                    </span>
                                                </div>
                                                <div className="space-y-1.5 font-mono text-xs">
                                                    <div className="flex items-center justify-between rounded-[6px] bg-[#1C1B1A] p-2.5 text-[#F5F0EB] font-medium border border-[#2A2928]">
                                                        <span>📖 Sūrah Al-Kahf (18:1-10)</span>
                                                        <span className="text-[0.7rem] text-[#6B6560]">Insert Verse ↵</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-[6px] p-2.5 text-[#6B6560] hover:bg-[#161514]">
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
                <section className="border-y border-[#2A2928] bg-[#161514] backdrop-blur-sm">
                    <motion.div {...fadeUp()} className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-14 sm:grid-cols-3 sm:px-6">
                        <StripItem
                            icon={<HardDrive className="h-5 w-5 text-[#C8794A]" />}
                            title="Plain Markdown Files"
                            body="Your archive lives in a folder on your drive. Open it in Obsidian, VS Code, or any text editor anytime — zero proprietary lock-in."
                        />
                        <StripItem
                            icon={<Zap className="h-5 w-5 text-[#C8794A]" />}
                            title="Instant Native Speed"
                            body="Engineered with Rust and Tauri for near-zero startup time, tiny memory footprint, and complete offline independence."
                        />
                        <StripItem
                            icon={<GitBranch className="h-5 w-5 text-[#C8794A]" />}
                            title="Living Knowledge Graph"
                            body="Explore connections between verses, historical audios, transcripts, and notes as a navigable visual network."
                        />
                    </motion.div>
                </section>

                {/* Bento Features Grid */}
                <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
                    <motion.div {...fadeUp()} className="text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2928] bg-[#161514] px-3.5 py-1 text-[0.72rem] font-mono font-medium uppercase tracking-[0.14em] text-[#9E9690] shadow-sm">
                            <Sparkles className="h-3 w-3 text-[#C8794A]" />
                            <span>Built for Scholarly Depth & Research Speed</span>
                        </div>
                        <h2
                            className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-[#F5F0EB]"
                            style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                        >
                            Everything you need to study and expand the archive
                        </h2>
                        <p
                            className="mx-auto mt-4 max-w-2xl text-[16.5px] leading-[1.65] text-[#9E9690]"
                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                        >
                            Purpose-built capabilities designed specifically for precision research, cross-referencing, and visual synthesis.
                        </p>
                    </motion.div>

                    {/* Bento Grid */}
                    <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {/* Bento 1: Academic Transliteration & Quran Engine */}
                        <motion.div {...fadeUp(0.05)} className="md:col-span-2">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] p-7 shadow-sm transition-all duration-300 hover:border-[#353433] hover:bg-[#1C1B1A]">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#1C1B1A] border border-[#2A2928] text-[#C8794A] shadow-sm">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-[#2A2928] bg-[#1C1B1A] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-[#6B6560]">
                                            Transliteration & Exegesis
                                        </span>
                                    </div>
                                    <h3
                                        className="text-xl sm:text-2xl font-bold leading-[1.25] text-[#F5F0EB]"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        Academic Arabic Transliteration & Named Surah Search
                                    </h3>
                                    <p className="text-sm leading-[1.6] text-[#9E9690] max-w-xl">
                                        Automatic academic transliteration expands terms like{' '}
                                        <code className="rounded bg-[#1C1B1A] px-1.5 py-0.5 font-mono text-xs text-[#C8794A] border border-[#2A2928]">Quran</code> to{' '}
                                        <code className="font-mono text-xs text-[#F5F0EB]">Qur&apos;ān</code> and supports fast diacritics (
                                        <code className="font-mono text-xs text-[#F5F0EB]">a=</code> &rarr;{' '}
                                        <code className="font-mono text-xs text-[#F5F0EB]">ā</code>,{' '}
                                        <code className="font-mono text-xs text-[#F5F0EB]">h.</code> &rarr;{' '}
                                        <code className="font-mono text-xs text-[#F5F0EB]">ḥ</code>). Type{' '}
                                        <code className="rounded bg-[#1C1B1A] px-1.5 py-0.5 font-mono text-xs text-[#C8794A] border border-[#2A2928]">/quran Baqarah 255</code> to insert rich calligraphy cards.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-[8px] border border-[#2A2928] bg-[#0F0E0D] p-4 font-mono text-xs">
                                    <div className="flex items-center justify-between border-b border-[#2A2928] pb-2 mb-2 text-[0.7rem] text-[#6B6560]">
                                        <span>Live Transliteration & Diacritics Active</span>
                                        <span className="text-[#C8794A] font-semibold flex items-center gap-1">
                                            <Check className="h-3 w-3" /> Auto-Formatted
                                        </span>
                                    </div>
                                    <p className="font-sans text-sm text-[#F5F0EB] leading-relaxed">
                                        Studying the theological significance of <span className="underline decoration-[#C8794A]/50 font-medium">Tawḥīd</span> and <span className="underline decoration-[#C8794A]/50 font-medium">Sharīʿah</span> principles across the Meccan revelations.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 2: Visual Synthesis Canvas */}
                        <motion.div {...fadeUp(0.1)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] p-7 shadow-sm transition-all duration-300 hover:border-[#353433] hover:bg-[#1C1B1A]">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#1C1B1A] border border-[#2A2928] text-[#C8794A] shadow-sm">
                                            <LayoutGrid className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-[#2A2928] bg-[#1C1B1A] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-[#6B6560]">
                                            Spatial Canvas
                                        </span>
                                    </div>
                                    <h3
                                        className="text-lg sm:text-xl font-bold leading-[1.25] text-[#F5F0EB]"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        Visual Whiteboard & I‘rāb Trees
                                    </h3>
                                    <p className="text-sm leading-[1.6] text-[#9E9690]">
                                        Brainstorm ideas on an infinite 2D canvas with Quran verse cards, note embeds, and Arabic grammar sentence trees.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-[8px] border border-[#2A2928] bg-[#0F0E0D] p-3 text-xs font-mono text-[#6B6560]">
                                    <div className="flex items-center justify-between">
                                        <span>Curved Relational Connectors</span>
                                        <span className="text-[#C8794A] font-semibold">2D Infinite</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 3: Multi-Pane & PDF Research */}
                        <motion.div {...fadeUp(0.15)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] p-7 shadow-sm transition-all duration-300 hover:border-[#353433] hover:bg-[#1C1B1A]">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#1C1B1A] border border-[#2A2928] text-[#C8794A] shadow-sm">
                                            <Columns className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-[#2A2928] bg-[#1C1B1A] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-[#6B6560]">
                                            Multi-Pane
                                        </span>
                                    </div>
                                    <h3
                                        className="text-lg sm:text-xl font-bold leading-[1.25] text-[#F5F0EB]"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        Split View & PDF Capture
                                    </h3>
                                    <p className="text-sm leading-[1.6] text-[#9E9690]">
                                        Compare notes side-by-side or open attached research PDFs to highlight passages and capture citations directly into your notes.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-[8px] border border-[#2A2928] bg-[#0F0E0D] p-3 font-mono text-xs">
                                    <div className="flex items-center justify-between text-[#F5F0EB]">
                                        <span>Quote-to-Note Drawer</span>
                                        <kbd className="text-[10px] bg-[#1C1B1A] px-1.5 py-0.5 rounded border border-[#2A2928]">Ctrl+\</kbd>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 4: Universal Multi-Source Importer */}
                        <motion.div {...fadeUp(0.2)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] p-7 shadow-sm transition-all duration-300 hover:border-[#353433] hover:bg-[#1C1B1A]">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#1C1B1A] border border-[#2A2928] text-[#C8794A] shadow-sm">
                                            <Layers className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-[#2A2928] bg-[#1C1B1A] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-[#6B6560]">
                                            Interoperability
                                        </span>
                                    </div>
                                    <h3
                                        className="text-lg sm:text-xl font-bold leading-[1.25] text-[#F5F0EB]"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        Universal Import Wizard
                                    </h3>
                                    <p className="text-sm leading-[1.6] text-[#9E9690]">
                                        Import Word/Google Docs (<code className="font-mono text-xs text-[#C8794A]">.docx</code>), Notion exports with UUID hash cleanup, Obsidian vaults, or distributable <code className="font-mono text-xs text-[#C8794A]">.sanote</code> packages.
                                    </p>
                                </div>

                                <div className="mt-6 rounded-[8px] border border-[#2A2928] bg-[#0F0E0D] p-3 font-mono text-[0.72rem] text-[#6B6560] space-y-1">
                                    <div>✓ Word (.docx) native XML parser</div>
                                    <div>✓ Notion 32-char UUID cleaner</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Bento 5: Raycast Keyboard-First Design */}
                        <motion.div {...fadeUp(0.25)} className="md:col-span-1">
                            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] p-7 shadow-sm transition-all duration-300 hover:border-[#353433] hover:bg-[#1C1B1A]">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#1C1B1A] border border-[#2A2928] text-[#C8794A] shadow-sm">
                                            <Keyboard className="h-5 w-5" />
                                        </div>
                                        <span className="rounded-full border border-[#2A2928] bg-[#1C1B1A] px-3 py-1 font-mono text-[0.7rem] uppercase tracking-wider text-[#6B6560]">
                                            Raycast Engine
                                        </span>
                                    </div>
                                    <h3
                                        className="text-lg sm:text-xl font-bold leading-[1.25] text-[#F5F0EB]"
                                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                    >
                                        Customizable Keybindings
                                    </h3>
                                    <p className="text-sm leading-[1.6] text-[#9E9690]">
                                        Full keybinding customization with conflict detection, quick switcher, and command palette navigation.
                                    </p>
                                </div>

                                <div className="mt-6 flex items-center justify-around rounded-[8px] border border-[#2A2928] bg-[#0F0E0D] p-3 font-mono text-xs">
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-[#2A2928] bg-[#161514] px-2 py-1 font-bold text-[#F5F0EB] shadow-sm">⌘P</kbd>
                                        <span className="text-[0.65rem] text-[#6B6560]">Palette</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-[#2A2928] bg-[#161514] px-2 py-1 font-bold text-[#F5F0EB] shadow-sm">⌘O</kbd>
                                        <span className="text-[0.65rem] text-[#6B6560]">Quick Open</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <kbd className="rounded border border-[#2A2928] bg-[#161514] px-2 py-1 font-bold text-[#F5F0EB] shadow-sm">⌘,</kbd>
                                        <span className="text-[0.65rem] text-[#6B6560]">Settings</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Architecture Deep Dive with CardSplitAccordion */}
                    <div className="mt-16 mx-auto max-w-4xl">
                        <div className="mb-6 text-center">
                            <h3
                                className="text-xl font-bold text-[#F5F0EB] sm:text-2xl"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                Core Engine Architecture
                            </h3>
                            <p className="mt-2 text-sm text-[#9E9690]">
                                Click any architectural pillar to inspect its technical implementation
                            </p>
                        </div>
                        <CardSplitAccordion items={STUDIO_ARCHITECTURE_ACCORDION} defaultOpenId="engine-1" />
                    </div>
                </section>

                {/* Setup Steps Section */}
                <section className="border-t border-[#2A2928] bg-[#161514] py-20 sm:py-28">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <motion.div {...fadeUp()} className="text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2928] bg-[#1C1B1A] px-3.5 py-1 text-[0.72rem] font-mono font-medium uppercase tracking-[0.14em] text-[#9E9690] shadow-sm">
                                <span>Zero-Configuration Onboarding</span>
                            </div>
                            <h2
                                className="mt-4 text-[clamp(1.75rem,3.5vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                            >
                                Up and running in seconds
                            </h2>
                            <p
                                className="mx-auto mt-4 max-w-2xl text-[16.5px] leading-[1.65] text-[#9E9690]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                No accounts to create, no cloud telemetry. Three simple steps to a complete local workspace.
                            </p>
                        </motion.div>

                        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <StepCard
                                number="01"
                                badge="Install Binary"
                                title="Download the Native App"
                                body="Grab the lightweight standalone executable for macOS, Windows, or Linux. Starts up instantly with near-zero memory footprint."
                                visual={
                                    <div className="flex items-center justify-between text-[#F5F0EB]">
                                        <span className="font-semibold font-mono text-xs">SA-Studio-v1.0{PLATFORM_EXT[platform].split(' ')[0]}</span>
                                        <span className="text-[0.65rem] font-mono text-[#C8794A] font-bold bg-[#C8794A]/10 border border-[#C8794A]/20 px-1.5 py-0.5 rounded">Standalone</span>
                                    </div>
                                }
                            />
                            <StepCard
                                number="02"
                                badge="Workspace Selection"
                                title="Choose Your Archive"
                                body="Point the app at any directory on your computer, or 1-click launch a pre-populated study archive with complete scriptures and notes."
                                visual={
                                    <div className="flex items-center gap-2 font-mono text-xs text-[#6B6560]">
                                        <FolderOpen className="h-4 w-4 text-[#C8794A]" />
                                        <span>~/Documents/SubmissionArchives-Vault</span>
                                    </div>
                                }
                            />
                            <StepCard
                                number="03"
                                badge="Ready to Research"
                                title="Explore & Interconnect"
                                body="Use keyboard shortcuts to create wiki-links, inspect scripture cross-references, or expand the infinite visual knowledge canvas."
                                visual={
                                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#6B6560]">
                                        <kbd className="rounded border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 text-[10px] text-[#F5F0EB]">⌘K</kbd>
                                        <span>Command Palette & Live Search</span>
                                    </div>
                                }
                            />
                        </div>
                    </div>
                </section>

                {/* Bottom CTA Banner */}
                <section className="border-t border-[#2A2928] bg-[#0F0E0D] py-16 sm:py-20">
                    <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
                        <motion.div {...fadeUp()}>
                            <div className="space-y-4">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2A2928] bg-[#161514] shadow-md">
                                    <Image
                                        src="/assets/brand/submission-archives-mark.png"
                                        alt="SA Studio Mark"
                                        width={28}
                                        height={28}
                                        className="object-contain"
                                    />
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-[#2A2928] bg-[#161514] px-3.5 py-1 text-[0.7rem] font-mono font-bold uppercase tracking-wider text-[#C8794A] shadow-sm">
                                    <Clock className="h-3 w-3 text-[#C8794A]" />
                                    <span>Public Release Coming Soon</span>
                                </div>
                                <h3
                                    className="text-2xl font-bold leading-[1.25] text-[#F5F0EB] sm:text-3xl"
                                    style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                                >
                                    Ready to explore the archive offline?
                                </h3>
                                <p
                                    className="text-sm leading-[1.6] text-[#9E9690] sm:text-base"
                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                >
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

function DownloadButton({ platform, primary }: { platform: Platform; primary?: boolean }) {
    const Icon = platform === 'macos' ? Apple : platform === 'windows' ? MonitorSmartphone : Terminal;
    const label = `Download for ${PLATFORM_LABEL[platform]}`;

    if (primary) {
        return (
            <a
                href="#"
                aria-disabled="true"
                onClick={(e) => e.preventDefault()}
                className="group relative inline-flex h-12 shrink-0 select-none items-center justify-center gap-3 whitespace-nowrap rounded-[8px] bg-[#C8794A] px-6 text-sm font-semibold text-[#0F0E0D] shadow-md transition-all hover:bg-[#D9916A] active:scale-[0.98] outline-none cursor-default"
            >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                <span className="rounded bg-[#0F0E0D]/20 text-[#0F0E0D] border border-black/15 px-2 py-0.5 text-[0.68rem] font-mono font-bold tracking-wider uppercase">
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
            className="inline-flex h-12 shrink-0 select-none items-center justify-center gap-2.5 whitespace-nowrap rounded-[8px] border border-[#2A2928] bg-[#161514] px-5 text-sm font-medium text-[#9E9690] transition-all hover:border-[#353433] hover:text-[#F5F0EB] hover:bg-[#1C1B1A] active:scale-[0.98] outline-none cursor-default"
        >
            <Icon className="h-4 w-4" />
            <span>{PLATFORM_LABEL[platform]}</span>
            <span className="text-[0.68rem] font-mono text-[#6B6560]">(Soon)</span>
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
            <div className="group relative flex h-full flex-col justify-between overflow-hidden rounded-[12px] border border-[#2A2928] bg-[#161514] p-7 shadow-sm transition-all duration-300 hover:border-[#353433] hover:bg-[#1C1B1A]">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#1C1B1A] border border-[#2A2928] font-mono text-xs font-bold text-[#C8794A] shadow-sm">
                            {number}
                        </span>
                        <span className="rounded-full border border-[#2A2928] bg-[#1C1B1A] px-2.5 py-0.5 font-mono text-[0.68rem] uppercase tracking-wider text-[#6B6560]">
                            {badge}
                        </span>
                    </div>
                    <h3
                        className="text-xl font-bold text-[#F5F0EB]"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                    >
                        {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#9E9690]">
                        {body}
                    </p>
                </div>

                <div className="mt-6 rounded-[8px] border border-[#2A2928] bg-[#0F0E0D] p-3.5 shadow-inner">
                    {visual}
                </div>
            </div>
        </motion.div>
    );
}

function StripItem({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
    return (
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#1C1B1A] border border-[#2A2928] text-[#C8794A] shadow-sm">
                {icon}
            </div>
            <h3
                className="text-base font-semibold text-[#F5F0EB]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
            >
                {title}
            </h3>
            <p className="text-sm leading-relaxed text-[#9E9690]">{body}</p>
        </div>
    );
}