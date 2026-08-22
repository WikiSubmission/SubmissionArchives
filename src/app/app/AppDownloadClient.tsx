'use client';

import { useSyncExternalStore, useState, useEffect, useCallback, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
    Apple,
    Monitor,
    Terminal,
    Zap,
    Download,
    ChevronDown,
    Command,
    FileText,
    Compass,
    Search,
    GitBranch,
    LayoutGrid,
    Columns,
} from 'lucide-react';
import {
    FolderOpen as PhFolderOpen,
    Folder as PhFolder,
    Tag as PhTag,
    MagnifyingGlass as PhMagnifyingGlass,
    Trash as PhTrash,
    TreeStructure as PhTreeStructure,
    FilePlus as PhFilePlus,
    MagnifyingGlassPlus as PhMagnifyingGlassPlus,
    Command as PhCommand,
    ShareNetwork as PhShareNetwork,
    VideoCamera as PhVideoCamera,
    SidebarSimple as PhSidebarSimple,
    Gear as PhGear,
    Funnel as PhFunnel,
    CaretLeft as PhCaretLeft,
    CaretRight as PhCaretRight,
    FileText as PhFileText,
    Plus as PhPlus,
    Columns as PhColumns,
    Sun as PhSun,
    Sparkle as PhSparkle,
    ArrowsOut as PhArrowsOut,
    SlidersHorizontal as PhSlidersHorizontal,
    TextT as PhTextT,
    Hash as PhHash,
    TextB as PhTextB,
    TextItalic as PhTextItalic,
    TextStrikethrough as PhTextStrikethrough,
    Code as PhCode,
    TextHOne as PhTextHOne,
    TextHTwo as PhTextHTwo,
    TextHThree as PhTextHThree,
    Quotes as PhQuotes,
    Play as PhPlay,
    LinkSimple as PhLinkSimple,
    CheckCircle as PhCheckCircle,
    Info as PhInfo,
    Copy as PhCopy,
} from '@phosphor-icons/react';

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

type Platform = 'macos' | 'windows' | 'linux';

interface ArchitecturePillar {
    id: string;
    title: string;
    badge: string;
    icon: ReactNode;
    content: string;
}

const ARCHITECTURE_PILLARS: ArchitecturePillar[] = [
    {
        id: 'engine-1',
        title: 'Native Rust Core & Tauri v2 IPC Bridge',
        badge: '100% LOCAL',
        icon: <Zap className="h-3.5 w-3.5 text-ed-accent" />,
        content:
            'Engineered with a native Rust core and Tauri v2 for instant startup, local file system manipulation, and offline audio/video streaming without sending notes or telemetry to any external cloud.',
    },
    {
        id: 'engine-2',
        title: 'TipTap ProseMirror Scholarly Editor',
        badge: 'EXTENSIBLE',
        icon: <FileText className="h-3.5 w-3.5 text-ed-accent" />,
        content:
            'A rich markdown workspace featuring custom inline & block Quran embeds, bidirectional [[WikiLinks]], academic footnotes [^1], callout blocks, and slash commands (/quran, /callout).',
    },
    {
        id: 'engine-3',
        title: 'Local Fuse.js & BM25 Proximity Search',
        badge: 'SUB-MS SEARCH',
        icon: <Search className="h-3.5 w-3.5 text-ed-accent" />,
        content:
            'Instant local search across note bodies, YAML frontmatter, hierarchical #tags, named surahs, and Arabic transliterations with real-time fuzzy matching.',
    },
    {
        id: 'engine-4',
        title: '2D Visual Synthesis Canvas & Idea Trees',
        badge: 'VISUAL GRAPH',
        icon: <GitBranch className="h-3.5 w-3.5 text-ed-accent" />,
        content:
            'Freeform infinite canvas to visually map complex theological themes, connect scripture verses with debate transcripts, and construct living idea trees.',
    },
];

const PLATFORM_INFO: Record<Platform, { label: string; ext: string; icon: typeof Apple }> = {
    macos: { label: 'macOS', ext: 'Universal .dmg', icon: Apple },
    windows: { label: 'Windows', ext: 'x64 .msi', icon: Monitor },
    linux: { label: 'Linux', ext: '.AppImage / .deb', icon: Terminal },
};

const APP_VERSION = '0.9.0';

interface PaletteAction {
    id: string;
    label: string;
    hint: string;
    icon: ReactNode;
    run: (context: { close: () => void; showToast: (msg: string) => void }) => void;
}

const PALETTE_ACTIONS: PaletteAction[] = [
    {
        id: 'features',
        label: 'Explore studio features',
        hint: 'F',
        icon: <LayoutGrid className="h-3.5 w-3.5 text-ed-accent" />,
        run: ({ close }) => {
            close();
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        },
    },
    {
        id: 'top',
        label: 'Back to top',
        hint: 'H',
        icon: <Compass className="h-3.5 w-3.5 text-ed-accent" />,
        run: ({ close }) => {
            close();
            document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
        },
    },
    {
        id: 'download',
        label: 'Download SA Studio desktop',
        hint: 'D',
        icon: <Download className="h-3.5 w-3.5 text-ed-accent" />,
        run: ({ close, showToast }) => {
            close();
            showToast('Desktop builds are in active development — coming soon.');
        },
    },
];

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

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' },
    transition: { duration: 0.32, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function AppDownloadClient() {
    const platform = useSyncExternalStore<Platform>(subscribePlatform, getPlatformSnapshot, () => 'macos');
    const [showInspector, setShowInspector] = useState(true);
    const [mobileStudioTab, setMobileStudioTab] = useState<'editor' | 'explorer' | 'inspector'>('editor');
    const [openAccordionId, setOpenAccordionId] = useState<string>('engine-1');
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [paletteQuery, setPaletteQuery] = useState('');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
    }, []);

    const closePalette = useCallback(() => {
        setPaletteOpen(false);
        setPaletteQuery('');
    }, []);

    useEffect(() => {
        if (!toastMessage) return;
        const timer = setTimeout(() => setToastMessage(null), 2400);
        return () => clearTimeout(timer);
    }, [toastMessage]);

    useEffect(() => {
        const isTypingTarget = (target: EventTarget | null) =>
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            (target instanceof HTMLElement && target.isContentEditable);

        const handleKeyDown = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;
            if ((isMeta && e.key.toLowerCase() === 'k') || (e.key === '/' && !isTypingTarget(e.target))) {
                e.preventDefault();
                setPaletteOpen((prev) => !prev);
                setPaletteQuery('');
            }
            if (e.key === 'Escape') {
                closePalette();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [closePalette]);

    const otherPlatforms: Platform[] = (['macos', 'windows', 'linux'] as Platform[]).filter((p) => p !== platform);

    const trimmedPaletteQuery = paletteQuery.trim().toLowerCase();
    const filteredPaletteActions = trimmedPaletteQuery
        ? PALETTE_ACTIONS.filter((action) => action.label.toLowerCase().includes(trimmedPaletteQuery))
        : PALETTE_ACTIONS;

    return (
        <div className="relative min-h-screen bg-ed-bg text-ed-fg font-sans antialiased selection:bg-ed-accent-soft selection:text-ed-fg">
            {/* Ambient background */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(184,98,51,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(184,98,51,0.015) 0%, transparent 70%)',
                }}
            />

            {/* Page content */}
            <main id="top" className="relative z-10">
                {/* Hero */}
                <section className="px-5 pt-16 pb-16 text-center sm:px-7 sm:pt-20 sm:pb-20">
                    <div className="mx-auto max-w-[840px]">
                        <motion.div {...fadeUp(0)} className="flex flex-col items-center text-center">
                            {/* Stylized App Icon Button */}
                            <motion.button
                                type="button"
                                whileHover={{ scale: 1.06, y: -3 }}
                                whileTap={{ scale: 0.96 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="group relative mb-6 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
                                onClick={() => {
                                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                aria-label="Explore SA Studio Features"
                            >
                                {/* Ambient Glow Aura */}
                                <div
                                    aria-hidden="true"
                                    className="absolute -inset-2 rounded-[28px] bg-gradient-to-br from-ed-accent/40 via-ed-accent/15 to-transparent blur-xl opacity-70 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110"
                                />

                                {/* Glassmorphic Squircle App Icon Shell */}
                                <div className="relative flex h-[72px] w-[72px] sm:h-20 sm:w-20 items-center justify-center rounded-[22px] border border-ed-accent/35 bg-gradient-to-b from-ed-surface via-ed-surface/90 to-ed-bg p-3.5 shadow-[0_12px_32px_-4px_rgba(184,98,51,0.28)] ring-1 ring-white/15 backdrop-blur-xl transition-all duration-300 group-hover:border-ed-accent/60 group-hover:shadow-[0_16px_40px_-4px_rgba(184,98,51,0.45)]">
                                    {/* Top Specular Sheen Line */}
                                    <div className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/50 dark:via-white/20 to-transparent" />

                                    <Image
                                        src="/assets/brand/submission-archives-mark.png"
                                        alt="WikiSubmission Studio App Logo"
                                        width={64}
                                        height={64}
                                        priority
                                        className="h-11 w-11 sm:h-12 sm:w-12 object-contain drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            </motion.button>

                            <h1
                                className="mx-auto max-w-[760px] text-[clamp(2.75rem,5.5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-ed-fg"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Your entire archive, <span className="text-ed-accent">on your own machine.</span>
                            </h1>

                            <p
                                className="mx-auto mt-7 max-w-[660px] text-[16.5px] leading-[1.6] text-ed-fg-secondary"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                A local-first research studio engineered for scholarly writing, Quran scripture embedding,
                                bidirectional knowledge links, synchronized audio/video study, and visual idea synthesis.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                                <PrimaryDownloadButton
                                    platform={platform}
                                    onClick={() =>
                                        showToast(
                                            'Desktop builds are in active development — standalone installers coming soon.',
                                        )
                                    }
                                />
                                {otherPlatforms.map((p) => (
                                    <SecondaryDownloadButton
                                        key={p}
                                        platform={p}
                                        onClick={() => showToast(`${PLATFORM_INFO[p].label} standalone binary coming soon.`)}
                                    />
                                ))}
                            </div>

                            <div className="mt-3.5 font-mono text-[10px] tracking-wide text-ed-fg-muted">
                                Build {APP_VERSION} · Local SQLite & Markdown · 100% Offline Capable
                            </div>

                            {/* Notice */}
                            <div className="mx-auto mt-7 flex max-w-[580px] items-start gap-3 rounded-lg border border-ed-rule bg-ed-surface px-4 py-3 text-left shadow-sm">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-ed-rule bg-ed-surface-strong text-ed-accent">
                                    <Zap className="h-3 w-3" />
                                </div>
                                <div>
                                    <strong className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-ed-fg">
                                        Editorial UI · Native Rust Desktop Engine
                                    </strong>
                                    <span className="mt-0.5 block text-[11px] leading-relaxed text-ed-fg-muted">
                                        Featuring the Golden Player-inspired sidebar, interactive Quran verse cards, visual canvas,
                                        split view, and full local search indexing.
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* App window showcase — Widescreen SA Studio UI (Expansive 4-Column Layout) */}
                    <div className="mx-auto mt-12 w-full max-w-[1400px] px-2 sm:px-4 lg:px-6">
                        <motion.div {...fadeUp(0.08)} className="text-left">
                            <div className="overflow-hidden rounded-[14px] border border-[#2e2620] bg-[#0c0a09] shadow-[0_28px_72px_-12px_rgba(0,0,0,0.8)] ring-1 ring-white/5">
                                {/* Native App Titlebar */}
                                <div className="flex h-[40px] select-none items-center justify-between border-b border-[#241f1b] bg-[#120f0d] px-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1.5">
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#9D5B4B]/80 hover:bg-[#9D5B4B] transition-colors cursor-pointer" />
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#AA8A4B]/80 hover:bg-[#AA8A4B] transition-colors cursor-pointer" />
                                            <span className="h-2.5 w-2.5 rounded-full bg-[#5E8B6E]/80 hover:bg-[#5E8B6E] transition-colors cursor-pointer" />
                                        </div>
                                        <span className="font-mono text-[11.5px] font-medium text-[#c5beb5] tracking-wide">
                                            SubmissionArchives Studio
                                        </span>
                                    </div>

                                    {/* Interactive Window Utility Controls */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setShowInspector((prev) => !prev)}
                                            title={showInspector ? 'Hide Video Inspector' : 'Show Video Inspector'}
                                            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[10.5px] transition-colors shadow-xs ${
                                                showInspector
                                                    ? 'bg-[#2a1d15] text-[#d87c46] border border-[#b86233]/40'
                                                    : 'text-[#8f857d] hover:text-[#e4ded9] hover:bg-white/5 border border-transparent'
                                            }`}
                                        >
                                            <PhColumns size={13} weight={showInspector ? 'fill' : 'regular'} />
                                            <span className="hidden sm:inline">{showInspector ? 'Split Inspector Active' : 'Toggle Inspector'}</span>
                                        </button>
                                        <span className="h-3.5 w-px bg-[#241f1b]" />
                                        <button type="button" className="p-1.5 text-[#8f857d] hover:text-[#e4ded9] hover:bg-white/5 rounded transition-colors" title="Theme">
                                            <PhSun size={14} weight="regular" />
                                        </button>
                                        <button type="button" className="p-1.5 text-[#8f857d] hover:text-[#e4ded9] hover:bg-white/5 rounded transition-colors" title="Assistant">
                                            <PhSparkle size={14} weight="regular" />
                                        </button>
                                        <button type="button" className="p-1.5 text-[#8f857d] hover:text-[#e4ded9] hover:bg-white/5 rounded transition-colors" title="Settings">
                                            <PhGear size={14} weight="regular" />
                                        </button>
                                        <button type="button" className="p-1.5 text-[#8f857d] hover:text-[#e4ded9] hover:bg-white/5 rounded transition-colors" title="Fullscreen">
                                            <PhArrowsOut size={14} weight="regular" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mobile Navigation Tabs Bar (Visible on < lg screens) */}
                                <div className="flex lg:hidden items-center border-b border-[#241f1b] bg-[#16120f] p-1.5 gap-1 select-none">
                                    <button
                                        type="button"
                                        onClick={() => setMobileStudioTab('editor')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                                            mobileStudioTab === 'editor'
                                                ? 'bg-[#2a1d15] text-[#d87c46] border border-[#b86233]/40 shadow-xs font-semibold'
                                                : 'text-[#8f857d] hover:text-[#e4ded9]'
                                        }`}
                                    >
                                        <PhFileText size={13} weight={mobileStudioTab === 'editor' ? 'fill' : 'regular'} />
                                        <span>Document Editor</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMobileStudioTab('explorer')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                                            mobileStudioTab === 'explorer'
                                                ? 'bg-[#2a1d15] text-[#d87c46] border border-[#b86233]/40 shadow-xs font-semibold'
                                                : 'text-[#8f857d] hover:text-[#e4ded9]'
                                        }`}
                                    >
                                        <PhFolder size={13} weight={mobileStudioTab === 'explorer' ? 'fill' : 'regular'} />
                                        <span>Vault Explorer</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMobileStudioTab('inspector')}
                                        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium transition-all ${
                                            mobileStudioTab === 'inspector'
                                                ? 'bg-[#2a1d15] text-[#d87c46] border border-[#b86233]/40 shadow-xs font-semibold'
                                                : 'text-[#8f857d] hover:text-[#e4ded9]'
                                        }`}
                                    >
                                        <PhVideoCamera size={13} weight={mobileStudioTab === 'inspector' ? 'fill' : 'regular'} />
                                        <span>Media Study</span>
                                    </button>
                                </div>

                                {/* Main Application Shell Layout — Full 4-Column Studio Architecture */}
                                <div className={`grid min-h-[580px] sm:min-h-[640px] grid-cols-1 overflow-x-auto ${
                                    showInspector
                                        ? 'lg:grid-cols-[48px_210px_1fr_390px] xl:grid-cols-[48px_230px_1fr_420px]'
                                        : 'lg:grid-cols-[48px_230px_1fr]'
                                }`}>
                                    {/* 1. Left Ribbon (Icon Bar) matching studio/src/components/LeftRibbon.tsx */}
                                    <aside
                                        aria-label="Ribbon"
                                        className={`border-r border-[#241f1b] bg-[#0c0a09] py-3 flex-col justify-between items-center select-none ${
                                            mobileStudioTab === 'explorer' ? 'flex w-[48px] shrink-0' : 'hidden lg:flex'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center gap-1.5 w-full px-1.5">
                                            <button
                                                type="button"
                                                title="Vault Explorer (Ctrl+B)"
                                                className="p-2 rounded-[7px] bg-[#b86233]/20 text-[#d87c46] border border-[#b86233]/35 shadow-xs transition-all"
                                            >
                                                <PhFolderOpen size={18} weight="fill" />
                                            </button>
                                            <button type="button" title="Visual Synthesis Canvas" className="p-2 rounded-lg text-[#786f66] hover:text-[#d87c46] hover:bg-[#b86233]/15 transition-colors">
                                                <PhTreeStructure size={18} weight="regular" />
                                            </button>
                                            <button type="button" title="New Note (Ctrl+N)" className="p-2 rounded-lg text-[#786f66] hover:text-[#d87c46] hover:bg-[#b86233]/15 transition-colors">
                                                <PhFilePlus size={18} weight="bold" />
                                            </button>
                                            <button type="button" title="Quick Switcher (Ctrl+O)" className="p-2 rounded-lg text-[#786f66] hover:text-[#e4ded9] hover:bg-white/5 transition-colors">
                                                <PhMagnifyingGlassPlus size={18} weight="regular" />
                                            </button>
                                            <button type="button" title="Search Vault" className="p-2 rounded-lg text-[#786f66] hover:text-[#e4ded9] hover:bg-white/5 transition-colors">
                                                <PhMagnifyingGlass size={18} weight="regular" />
                                            </button>
                                            <button type="button" title="Command Palette (Ctrl+P)" className="p-2 rounded-lg text-[#786f66] hover:text-[#e4ded9] hover:bg-white/5 transition-colors">
                                                <PhCommand size={18} weight="regular" />
                                            </button>
                                            <button type="button" title="Graph View" className="p-2 rounded-lg text-[#786f66] hover:text-[#d87c46] hover:bg-[#b86233]/15 transition-colors">
                                                <PhShareNetwork size={18} weight="regular" />
                                            </button>
                                            <button
                                                type="button"
                                                title="Media Notes: Watch & Cite Lectures (Ctrl+Shift+M)"
                                                className="p-2 rounded-lg text-[#d87c46] bg-[#2a1d15] border border-[#b86233]/35 shadow-xs transition-colors"
                                            >
                                                <PhVideoCamera size={18} weight="fill" />
                                            </button>
                                        </div>
                                        <div className="flex flex-col items-center gap-1.5 w-full px-1">
                                            <button type="button" title="Toggle Inspector" className="p-2 rounded-lg text-[#786f66] hover:text-[#e4ded9] hover:bg-white/5 transition-colors">
                                                <PhSidebarSimple size={18} weight="regular" className="rotate-180" />
                                            </button>
                                            <button type="button" title="Vault Settings" className="p-2 rounded-lg text-[#786f66] hover:text-[#e4ded9] hover:bg-white/5 transition-colors">
                                                <PhGear size={18} weight="regular" />
                                            </button>
                                        </div>
                                    </aside>

                                    {/* 2. Explorer Sidebar matching studio/src/components/workspace/ExplorerPanel.tsx & ArchiveExplorer.tsx */}
                                    <aside
                                        aria-label="Explorer"
                                        className={`border-r border-[#241f1b] bg-[#12100e] p-2.5 flex-col justify-between select-none ${
                                            mobileStudioTab === 'explorer' ? 'flex flex-1 min-w-0' : 'hidden sm:flex'
                                        }`}
                                    >
                                        <div>
                                            {/* Segmented Top Switcher: Files | Tags | Search | Trash */}
                                            <div className="flex items-center p-0.5 rounded-[7px] bg-[#181411] border border-[#26201b] mb-3">
                                                <button
                                                    type="button"
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold rounded-[5px] bg-[#241a14] text-[#d87c46] border border-[#b86233]/30 shadow-xs transition-all"
                                                >
                                                    <PhFolder size={13} weight="fill" className="text-[#d87c46]" />
                                                    <span>Files</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-[#786f66] hover:text-[#d5cec7] rounded-[5px] transition-all"
                                                >
                                                    <PhTag size={13} weight="regular" />
                                                    <span>Tags</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-[#786f66] hover:text-[#d5cec7] rounded-[5px] transition-all"
                                                >
                                                    <PhMagnifyingGlass size={13} weight="regular" />
                                                    <span>Search</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1 text-[11px] font-medium text-[#786f66] hover:text-[#d5cec7] rounded-[5px] transition-all"
                                                >
                                                    <PhTrash size={13} weight="regular" />
                                                    <span>Trash</span>
                                                </button>
                                            </div>

                                            {/* Explorer Header matching Golden TOC header */}
                                            <div className="flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#786f66]">
                                                <div className="flex items-center gap-1.5">
                                                    <span>Explorer</span>
                                                    <span className="font-mono text-[9px] text-[#5e564e] lowercase font-normal">3 items</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[#786f66]">
                                                    <button type="button" title="Filter Files" className="p-1 hover:text-[#e4ded9] rounded hover:bg-white/5 transition-colors">
                                                        <PhFunnel size={14} weight="regular" />
                                                    </button>
                                                    <button type="button" title="New Note" className="p-1 hover:text-[#e4ded9] rounded hover:bg-white/5 transition-colors">
                                                        <PhFilePlus size={14} weight="bold" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Faithful Tree Items */}
                                            <nav className="space-y-1 mt-2">
                                                <button
                                                    type="button"
                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-left text-xs text-[#8f857d] hover:text-[#e4ded9] hover:bg-white/5 transition-all"
                                                >
                                                    <PhFileText size={14} weight="regular" className="opacity-60 shrink-0" />
                                                    <span className="truncate flex-1 font-mono text-[11.5px]">welcome</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-left text-xs bg-[#261d17] text-[#f5efe8] font-medium border border-[#b86233]/30 shadow-xs transition-all"
                                                >
                                                    <PhFileText size={14} weight="fill" className="text-[#d87c46] shrink-0" />
                                                    <span className="truncate flex-1 text-[12px] text-[#f2ede7]">Ayat al-Kursi Exegesis</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-left text-xs text-[#8f857d] hover:text-[#e4ded9] hover:bg-white/5 transition-all"
                                                >
                                                    <PhFileText size={14} weight="regular" className="opacity-60 shrink-0" />
                                                    <span className="truncate flex-1 font-mono text-[11.5px]">Surah Al-Kahf Study</span>
                                                </button>
                                            </nav>
                                        </div>

                                        {/* Bottom Sidebar Status */}
                                        <div className="pt-2 border-t border-[#241f1b] flex items-center justify-between text-[9.5px] font-mono text-[#5e564e] px-1">
                                            <span>vault / notes</span>
                                            <span>3 files</span>
                                        </div>
                                    </aside>

                                    {/* 3. Center Editor Canvas matching studio/src/components/TabHeader.tsx & FrontmatterPanel.tsx */}
                                    <div className={`flex-col justify-between bg-[#0f0d0b] border-r border-[#241f1b] ${
                                        mobileStudioTab === 'editor' ? 'flex w-full' : 'hidden lg:flex'
                                    }`}>
                                        <div>
                                            {/* Tabs Bar */}
                                            <div className="flex items-center justify-between border-b border-[#241f1b] bg-[#120f0d] px-2 pt-1.5">
                                                <div className="flex items-center gap-1 overflow-x-auto">
                                                    <div className="flex items-center text-[#786f66] mr-1">
                                                        <button type="button" title="Navigate Back" className="p-1 hover:text-[#e4ded9] cursor-pointer">
                                                            <PhCaretLeft size={14} weight="bold" />
                                                        </button>
                                                        <button type="button" title="Navigate Forward" className="p-1 hover:text-[#e4ded9] cursor-pointer">
                                                            <PhCaretRight size={14} weight="bold" />
                                                        </button>
                                                    </div>

                                                    {/* Tab: welcome.md */}
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-[#786f66] hover:text-[#e4ded9] cursor-pointer">
                                                        <PhFileText size={13} weight="regular" className="opacity-60" />
                                                        <span>welcome.md</span>
                                                    </div>

                                                    {/* Tab: Ayat al-Kursi Exegesis (Active) */}
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-t-[4px] bg-[#1c1815] text-[#f2ede7] border-t-2 border-[#b86233] text-[11.5px] font-medium shadow-xs">
                                                        <PhFileText size={13} weight="fill" className="text-[#d87c46]" />
                                                        <span>Ayat al-Kursi Exege...</span>
                                                    </div>

                                                    {/* Tab: Surah Al-Kahf Study */}
                                                    <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono text-[#786f66] hover:text-[#e4ded9] cursor-pointer">
                                                        <PhFileText size={13} weight="regular" className="opacity-60" />
                                                        <span>Surah Al-Kahf Stud...</span>
                                                    </div>

                                                    <div className="px-2 py-1 text-[#786f66] hover:text-[#e4ded9] cursor-pointer" title="New Note (Ctrl+N)">
                                                        <PhPlus size={13} weight="bold" />
                                                    </div>
                                                </div>

                                                {/* Top Right Editor Modes */}
                                                <div className="flex items-center p-0.5 rounded-[4px] bg-[#181411] border border-[#26201b]">
                                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#241a14] text-[#d87c46]">
                                                        Write
                                                    </span>
                                                    <span className="px-2 py-0.5 text-[10px] font-medium text-[#786f66]">
                                                        Blocks
                                                    </span>
                                                    <span className="px-2 py-0.5 text-[10px] font-medium text-[#786f66]">
                                                        Page
                                                    </span>
                                                </div>
                                            </div>

                                            {/* File Breadcrumb */}
                                            <div className="flex items-center justify-between px-5 py-2 border-b border-[#241f1b]/50 text-[10.5px] font-mono text-[#786f66]">
                                                <div className="flex items-center gap-1.5">
                                                    <span>c:</span>
                                                    <span>/</span>
                                                    <span>vault</span>
                                                    <span>/</span>
                                                    <span className="text-[#d5cec7] font-semibold">Ayat al-Kursi Exegesis.md</span>
                                                </div>
                                            </div>

                                            {/* Properties Collapsible Header matching FrontmatterPanel.tsx */}
                                            <div className="px-5 pt-3.5 pb-2">
                                                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-[#786f66] pb-1.5 border-b border-[#241f1b]/40">
                                                    <div className="flex items-center gap-1.5">
                                                        <PhSlidersHorizontal size={14} weight="regular" />
                                                        <span>PROPERTIES</span>
                                                    </div>
                                                    <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 font-mono text-[8.5px] font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                                                        <PhCheckCircle size={10} weight="fill" className="text-emerald-400" />
                                                        Saved
                                                    </span>
                                                </div>

                                                <div className="mt-2 space-y-1 font-mono text-[10.5px]">
                                                    <div className="flex items-center gap-3 text-[#8f857d]">
                                                        <span className="w-20 text-[9.5px] text-[#786f66] uppercase flex items-center gap-1">
                                                            <PhTextT size={13} weight="regular" className="text-ed-fg-muted" />
                                                            media
                                                        </span>
                                                        <span className="text-[#d87c46] bg-[#241a14] px-1.5 py-0.5 rounded border border-[#b86233]/25 truncate">
                                                            video-program/what-is-life-all-about
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-[#8f857d]">
                                                        <span className="w-20 text-[9.5px] text-[#786f66] uppercase flex items-center gap-1">
                                                            <PhHash size={13} weight="bold" className="text-emerald-400" />
                                                            timestamp
                                                        </span>
                                                        <span className="text-[#e4ded9] font-semibold">240</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Note Content Body */}
                                            <div className="px-5 py-3 max-w-xl">
                                                {/* Document Title */}
                                                <h2
                                                    className="text-xl sm:text-2xl font-bold leading-tight text-[#f7f2eb] tracking-[-0.01em]"
                                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                >
                                                    Ayat al-Kursi Exegesis (2:255)
                                                </h2>

                                                <p
                                                    className="mt-2 text-[13px] leading-relaxed text-[#c5beb5]"
                                                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                >
                                                    The Verse of the Throne represents the pinnacle of theological monotheism (<em className="text-[#e4ded9]">Tawhid</em>) in the Quranic corpus.
                                                </p>

                                                {/* Quote Callout Box */}
                                                <div className="mt-3 rounded-r-[6px] border-l-2 border-[#b86233] bg-[#181411] px-3.5 py-2 text-[12.5px] italic text-[#ded7ce]">
                                                    &ldquo;GOD: there is no god except He, the Living, the Eternal.&rdquo; — <span className="underline decoration-dotted decoration-[#b86233] underline-offset-2 not-italic text-[#d87c46]">Surah Al-Baqarah</span>, Verse 255
                                                </div>

                                                {/* Syntactic Breakdown */}
                                                <h3
                                                    className="mt-4 text-[14px] font-semibold text-[#f2ede7]"
                                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                >
                                                    Syntactic Breakdown
                                                </h3>

                                                <div className="mt-1.5 space-y-1 text-[12px] text-[#c5beb5] leading-relaxed">
                                                    <p><strong className="text-[#f5efe8]">Allāhu:</strong> <em>Mubtada&apos;</em> (Subject) in the nominative case.</p>
                                                    <p><strong className="text-[#f5efe8]">Lā ilāha illā Huwa:</strong> Negative particle of absolute category (<em>Lā an-Nāfiyah lil-Jins</em>) followed by the exception particle (<em>Illā</em>).</p>
                                                </div>

                                                {/* Floating Bubble Formatting Toolbar matching studio/src/components/EditorBubbleMenu.tsx */}
                                                <div className="mt-3 inline-flex items-center gap-1 max-w-full overflow-x-auto no-scrollbar rounded-xl border border-[#3b3129] bg-[#1a1614]/95 p-1 shadow-xl text-[10.5px] font-mono text-[#d5cec7] backdrop-blur-md">
                                                    <button type="button" title="Bold (Ctrl+B)" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhTextB size={13} weight="bold" />
                                                    </button>
                                                    <button type="button" title="Italic (Ctrl+I)" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhTextItalic size={13} weight="bold" />
                                                    </button>
                                                    <button type="button" title="Strikethrough" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhTextStrikethrough size={13} weight="bold" />
                                                    </button>
                                                    <button type="button" title="Inline Code" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhCode size={13} weight="bold" />
                                                    </button>
                                                    <span className="h-3.5 w-px bg-[#3b3129] shrink-0" />
                                                    <button type="button" title="Heading 1" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhTextHOne size={13} weight="bold" />
                                                    </button>
                                                    <button type="button" title="Heading 2" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhTextHTwo size={13} weight="bold" />
                                                    </button>
                                                    <button type="button" title="Heading 3" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhTextHThree size={13} weight="bold" />
                                                    </button>
                                                    <button type="button" title="Blockquote" className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors shrink-0">
                                                        <PhQuotes size={13} weight="bold" />
                                                    </button>
                                                </div>

                                                {/* Interactive Quran Embed Card Component */}
                                                <div className="mt-4 rounded-xl border border-[#e5dfd5] bg-[#fbfaf6] p-3.5 sm:p-4 text-[#1c1917] shadow-xl overflow-hidden">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="rounded bg-[#f5ecdf] px-2 py-0.5 font-mono text-[10px] font-bold text-[#9b4e1e] shrink-0">
                                                            1:1
                                                        </span>
                                                        <div
                                                            className="text-right text-[17px] sm:text-[20px] leading-relaxed font-semibold text-[#1c1917]"
                                                            dir="rtl"
                                                            style={{ fontFamily: 'Amiri, Georgia, serif' }}
                                                        >
                                                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                                                        </div>
                                                    </div>
                                                    <p
                                                        className="mt-2 text-[13.5px] leading-relaxed text-[#292524]"
                                                        style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                    >
                                                        In the name of GOD, Most Gracious, Most Merciful.
                                                    </p>
                                                    <div className="mt-3 flex items-center justify-between border-t border-[#ede7dc] pt-2 font-mono text-[8.5px] text-[#78716c] tracking-wider">
                                                        <span>REFERENCE: 1:1</span>
                                                        <span className="uppercase tracking-widest">SUBMISSIONARCHIVES</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Status Bar matching studio/src/components/StatusBar.tsx */}
                                        <div className="flex items-center justify-between border-t border-[#241f1b] bg-[#0c0a09] px-4 py-1.5 font-mono text-[10px] text-[#786f66] select-none">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 text-[#8f857d]">
                                                    <PhFileText size={12} weight="regular" className="text-[#786f66]" />
                                                    <span>72 words</span>
                                                    <span className="text-[#403831]">•</span>
                                                    <span>487 chars</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[#8f857d]">
                                                    <PhLinkSimple size={12} weight="bold" className="text-[#d87c46]" />
                                                    <span>0 backlinks</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center bg-[#181411] p-0.5 rounded border border-[#241f1b] text-[9.5px]">
                                                    <span className="px-1.5 py-0.5 rounded bg-[#241a14] text-[#d87c46] font-semibold">Write</span>
                                                    <span className="px-1.5 py-0.5 text-[#786f66]">Blocks</span>
                                                    <span className="px-1.5 py-0.5 text-[#786f66]">Page</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                                                    <PhCheckCircle size={12} weight="fill" className="text-emerald-400" />
                                                    <span>Saved</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4. Right-Side Bar: Video Player & Synchronized Transcript Inspector matching studio/src/components/media/ */}
                                    {showInspector && (
                                        <aside
                                            aria-label="Media Study Inspector"
                                            className={`flex-col justify-between bg-[#120f0d] p-3 text-xs select-none ${
                                                mobileStudioTab === 'inspector' ? 'flex w-full' : 'hidden lg:flex'
                                            }`}
                                        >
                                            <div>
                                                {/* Video Header & Controls Strip matching MediaNotesPanel.tsx */}
                                                <div className="mb-2 flex items-center justify-between border-b border-[#241f1b] pb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <PhCaretLeft size={13} weight="bold" className="text-[#786f66] hover:text-[#e4ded9] cursor-pointer" />
                                                        <PhCaretRight size={13} weight="bold" className="text-[#786f66] hover:text-[#e4ded9] cursor-pointer" />
                                                        <div className="ml-1">
                                                            <div className="font-semibold text-[#f5efe8] text-[12px] truncate max-w-[150px]">What Is Life All About?</div>
                                                            <div className="font-mono text-[9.5px] text-[#786f66]">Video Program · 23:26</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[#786f66]">
                                                        <button type="button" title="Quote active cue" className="p-1 hover:text-[#e4ded9] transition-colors">
                                                            <PhQuotes size={13} weight="regular" />
                                                        </button>
                                                        <button type="button" title="Media notes" className="p-1 text-[#d87c46] bg-[#2a1d15] rounded border border-[#b86233]/30">
                                                            <PhVideoCamera size={13} weight="fill" />
                                                        </button>
                                                        <button type="button" title="Inspector info" className="p-1 hover:text-[#e4ded9] transition-colors">
                                                            <PhInfo size={13} weight="regular" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Video Player Frame matching GoldenVideoPlayer.tsx */}
                                                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-[#2e2620] bg-black shadow-md">
                                                    <Image
                                                        src="/content/videos/thumbnails/what-is-life-all-about.png"
                                                        alt="Dr. Rashad Khalifa - What Is Life All About"
                                                        fill
                                                        className="object-cover"
                                                        sizes="380px"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 flex flex-col justify-between p-2 text-[10px] font-mono text-white">
                                                        <div className="flex items-center justify-between text-[9px] text-white/80">
                                                            <span>Dr. Rashad Khalifa</span>
                                                            <span className="rounded bg-black/60 px-1 py-0.5 border border-white/10 font-bold">1080p</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1.5">
                                                                <PhPlay size={12} weight="fill" className="text-[#d87c46] cursor-pointer" />
                                                                <span className="text-[10px]">04:16 / 23:26</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="rounded bg-black/70 px-1 py-0.5 text-[9px] border border-white/10">1x</span>
                                                                <span className="rounded bg-[#2a1d15] text-[#d87c46] px-1.5 py-0.5 text-[9px] font-bold border border-[#b86233]/40 cursor-pointer">Stamp</span>
                                                                <span className="rounded bg-white/10 text-white px-1.5 py-0.5 text-[9px] cursor-pointer">Attach</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Chapters Carousel Strip matching ChapterTimelineStrip.tsx */}
                                                <div className="mt-2.5">
                                                    <div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-[#786f66] mb-1">
                                                        <span>Chapters</span>
                                                        <span className="font-mono text-[#5e564e]">23</span>
                                                    </div>
                                                    <div className="flex gap-1.5 overflow-x-auto text-[9px] font-mono text-[#8f857d] pb-1">
                                                        <span className="shrink-0 rounded bg-[#1c1815] px-2 py-0.5 border border-[#b86233]/30 text-[#d87c46]">
                                                            07:45 A Dot Against Infinity
                                                        </span>
                                                        <span className="shrink-0 rounded bg-[#1c1815] px-2 py-0.5 border border-[#241f1b]">
                                                            09:23 Not Vague Talk
                                                        </span>
                                                        <span className="shrink-0 rounded bg-[#1c1815] px-2 py-0.5 border border-[#241f1b]">
                                                            18:18 Five Daily Prayers
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Transcript Search Bar matching TranscriptTeleprompter.tsx */}
                                                <div className="mt-2.5 flex items-center justify-between rounded bg-[#181411] border border-[#241f1b] px-2.5 py-1 text-[10.5px]">
                                                    <div className="flex items-center gap-1.5 text-[#786f66]">
                                                        <PhMagnifyingGlass size={13} weight="regular" />
                                                        <span className="text-[11px]">Find in transcript</span>
                                                    </div>
                                                    <span className="font-mono text-[8.5px] text-[#d87c46] bg-[#241a14] px-1.5 py-0.5 rounded border border-[#b86233]/20">
                                                        Tracking 219 cues
                                                    </span>
                                                </div>

                                                {/* Synchronized Transcript Cues Stream matching TranscriptTeleprompter.tsx */}
                                                <div className="mt-2 space-y-1 max-h-[190px] overflow-y-auto pr-1 text-[11px] font-sans">
                                                    <div className="p-1.5 text-[#786f66] rounded hover:bg-white/5 cursor-pointer">
                                                        <span className="font-mono text-[9px] text-[#5e564e] block">04:00 · DR. RASHAD KHALIFA</span>
                                                        average person and ask him or her &quot;what did you feed your self today? What did you
                                                    </div>

                                                    <div className="p-1.5 text-[#786f66] rounded hover:bg-white/5 cursor-pointer">
                                                        <span className="font-mono text-[9px] text-[#5e564e] block">04:10 · DR. RASHAD KHALIFA</span>
                                                        feed your body today?&quot; And they will tell you &quot;I gave my body breakfast,
                                                    </div>

                                                    {/* Active Highlighted Cue (Screenshot 2 & TranscriptTeleprompter.tsx) */}
                                                    <div className="p-2 rounded bg-[#2a1d15] border-l-2 border-[#d87c46] text-[#f5efe8] shadow-xs">
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-mono text-[9px] text-[#d87c46] font-bold block">04:15 · DR. RASHAD KHALIFA</span>
                                                            <div className="flex items-center gap-1 text-[#786f66]">
                                                                <span className="p-0.5 hover:text-[#d87c46] cursor-pointer" title="Insert citation">
                                                                    <PhQuotes size={11} weight="regular" />
                                                                </span>
                                                                <span className="p-0.5 hover:text-[#e4ded9] cursor-pointer" title="Copy text">
                                                                    <PhCopy size={11} weight="regular" />
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <p className="mt-1 text-[11px] leading-relaxed text-[#f5efe8]">
                                                            lunch, dinner, numerous snacks.&quot; But they gave nothing to the real person,
                                                        </p>
                                                    </div>

                                                    <div className="p-1.5 text-[#786f66] rounded hover:bg-white/5 cursor-pointer">
                                                        <span className="font-mono text-[9px] text-[#5e564e] block">04:22 · DR. RASHAD KHALIFA</span>
                                                        to themselves. What did they feed themselves? We nourish the babies. When we are born,
                                                    </div>

                                                    <div className="p-1.5 text-[#786f66] rounded hover:bg-white/5 cursor-pointer">
                                                        <span className="font-mono text-[9px] text-[#5e564e] block">04:31 · DR. RASHAD KHALIFA</span>
                                                        we give the baby milk and so on. And then, the baby grows,
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Inspector Actions */}
                                            <div className="pt-2 border-t border-[#241f1b] flex items-center justify-between text-[10px] font-mono text-[#8f857d]">
                                                <div className="flex items-center gap-1 text-[#d87c46] cursor-pointer hover:underline">
                                                    <PhQuotes size={13} weight="regular" />
                                                    <span>Quote Cue</span>
                                                </div>
                                                <span className="text-[#5e564e]">219 cues tracked</span>
                                            </div>
                                        </aside>
                                    )}
                                </div>

                                {/* Proof strip */}
                                <div className="grid grid-cols-1 border-t border-[#241f1b] bg-[#0c0a09] sm:grid-cols-3">
                                    <div className="border-b border-[#241f1b] p-5 sm:border-b-0 sm:border-r">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-[#2e2620] bg-[#181411] text-[#d87c46]">
                                            <PhFileText size={14} weight="bold" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-[#f5efe8]">Plain Markdown & Frontmatter</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-[#8f857d]">
                                            Your notes remain open standard Markdown on your disk with YAML frontmatter. No proprietary databases or vendor lock-in.
                                        </p>
                                    </div>
                                    <div className="border-b border-[#241f1b] p-5 sm:border-b-0 sm:border-r">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-[#2e2620] bg-[#181411] text-[#d87c46]">
                                            <PhMagnifyingGlass size={14} weight="bold" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-[#f5efe8]">Sub-Millisecond Local Search</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-[#8f857d]">
                                            Instant offline query across note bodies, tags, surah names, and Arabic transliterations.
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-[#2e2620] bg-[#181411] text-[#d87c46]">
                                            <PhTreeStructure size={14} weight="bold" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-[#f5efe8]">Bidirectional [[WikiLinks]] & Split Study</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-[#8f857d]">
                                            Interconnect concepts across scripture, debates, and video lectures with synchronized transcript tracking.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="border-t border-ed-rule py-20 px-5 sm:px-7 sm:py-24">
                    <div className="mx-auto max-w-5xl">
                        <motion.div {...fadeUp(0)} className="mb-10 text-center">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                Capabilities
                            </div>
                            <h2
                                className="mt-2 text-3xl font-medium text-ed-fg sm:text-4xl"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Everything you need to study, write, and synthesize
                            </h2>
                            <p
                                className="mx-auto mt-2 max-w-xl text-[14px] text-ed-fg-secondary"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Purpose-built tools for scripture exegesis, bidirectional research, audio/video synchronization, and spatial concept mapping.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            <motion.article
                                {...fadeUp(0.04)}
                                className="relative min-h-[200px] rounded-lg border border-ed-rule bg-ed-surface p-5 transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong shadow-sm sm:col-span-2 lg:col-span-2"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-ed-rule px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-ed-accent">
                                    Scripture Embeds
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-ed-rule bg-ed-surface-strong text-ed-accent">
                                    <FileText className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Rich TipTap Editor & Custom Quran Embeds
                                </h3>
                                <p className="mt-1.5 max-w-lg text-[11px] leading-[1.55] text-ed-fg-secondary">
                                    Insert canonical Quran verses with Arabic text, authorized English translation, and footnotes
                                    via slash command <code className="text-ed-accent font-mono">/quran</code> or direct citation <code className="text-ed-accent font-mono">[2:255]</code>.
                                </p>
                                <div className="mt-4 rounded border border-ed-rule bg-ed-bg p-2.5 font-mono text-[8px] text-ed-fg-muted">
                                    <div className="mb-1.5 flex justify-between">
                                        <span>Inline Verse Card · Surah Al-Baqarah 2:255</span>
                                        <span className="text-ed-accent">TipTap Node</span>
                                    </div>
                                    <div className="h-1 w-full rounded-full bg-ed-surface-strong" />
                                    <div className="mt-1 h-1 w-[65%] rounded-full bg-ed-surface-strong" />
                                </div>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.08)}
                                className="relative rounded-lg border border-ed-rule bg-ed-surface p-5 transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong shadow-sm"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-ed-rule px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-ed-fg-muted">
                                    Graph
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-ed-rule bg-ed-surface-strong text-ed-accent">
                                    <GitBranch className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Bidirectional [[WikiLinks]]
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-ed-fg-secondary">
                                    Interlink research notes with auto-completing bracket syntax and browse automatic backlink references.
                                </p>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.12)}
                                className="relative rounded-lg border border-ed-rule bg-ed-surface p-5 transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong shadow-sm"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-ed-rule px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-ed-fg-muted">
                                    Spatial
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-ed-rule bg-ed-surface-strong text-ed-accent">
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Visual Synthesis Canvas
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-ed-fg-secondary">
                                    Map scripture themes, historical timelines, and concept nodes across an infinite 2D canvas.
                                </p>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.16)}
                                className="relative rounded-lg border border-ed-rule bg-ed-surface p-5 transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong shadow-sm"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-ed-rule px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-ed-fg-muted">
                                    Multi-View
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-ed-rule bg-ed-surface-strong text-ed-accent">
                                    <Columns className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Split View Research
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-ed-fg-secondary">
                                    Read historical PDFs or debate transcripts side-by-side with your active markdown document.
                                </p>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.2)}
                                className="relative rounded-lg border border-ed-rule bg-ed-surface p-5 transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-strong shadow-sm"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-ed-rule px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-ed-fg-muted">
                                    Portability
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-ed-rule bg-ed-surface-strong text-ed-accent">
                                    <Download className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Import Wizard & Version History
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-ed-fg-secondary">
                                    Migrate markdown vaults from Obsidian or Logseq, import PDFs, and restore point-in-time note snapshots.
                                </p>
                            </motion.article>
                        </div>

                        {/* Architecture */}
                        <div className="mt-16 text-center">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                Core engine architecture
                            </div>
                            <p
                                className="mx-auto mt-1 max-w-xl text-[14px] text-ed-fg-secondary"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Local-first primitives keep the archive useful even when the network disappears.
                            </p>

                            <div className="mx-auto mt-7 max-w-2xl overflow-hidden rounded-lg border border-ed-rule text-left shadow-sm">
                                {ARCHITECTURE_PILLARS.map((item, idx) => {
                                    const isOpen = openAccordionId === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            className={idx !== ARCHITECTURE_PILLARS.length - 1 ? 'border-b border-ed-rule' : ''}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordionId(isOpen ? '' : item.id)}
                                                className="flex w-full items-center gap-2.5 bg-ed-surface px-3.5 py-3 text-left transition-colors hover:bg-ed-surface-strong"
                                            >
                                                <span className="flex h-5 w-5 items-center justify-center rounded border border-ed-rule text-ed-accent">
                                                    {item.icon}
                                                </span>
                                                <span className="text-[10px] font-semibold text-ed-fg">{item.title}</span>
                                                <span className="rounded-full border border-ed-rule px-1.5 py-0.5 font-mono text-[7px] text-ed-fg-muted">
                                                    {item.badge}
                                                </span>
                                                <ChevronDown
                                                    className={`ml-auto h-3 w-3 text-ed-fg-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-ed-fg' : ''
                                                        }`}
                                                />
                                            </button>
                                            {isOpen && (
                                                <div className="bg-ed-surface px-11 pb-3.5 text-[10px] leading-[1.55] text-ed-fg-secondary">
                                                    {item.content}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Workflow */}
                <section className="border-t border-ed-rule py-20 px-5 sm:px-7 sm:py-24">
                    <div className="mx-auto max-w-5xl">
                        <motion.div {...fadeUp(0)} className="mb-10 text-center">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                Zero configuration onboarding
                            </div>
                            <h2
                                className="mt-2 text-3xl font-medium text-ed-fg sm:text-4xl"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Up and running in seconds
                            </h2>
                            <p
                                className="mx-auto mt-2 max-w-xl text-[14px] text-ed-fg-secondary"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                No accounts to create. Point the app at your archive, let it index, and start working
                                locally.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            <article className="rounded-lg border border-ed-rule bg-ed-surface p-5 shadow-sm">
                                <span className="inline-block rounded border border-ed-accent/25 bg-ed-accent-soft px-1.5 py-0.5 font-mono text-[9px] text-ed-accent">
                                    01 · INSTALL
                                </span>
                                <h3
                                    className="mt-4 text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Download the Native App
                                </h3>
                                <p className="mt-1 text-[10px] leading-[1.55] text-ed-fg-secondary">
                                    Choose your platform and install the desktop client. Your archive stays where you put
                                    it.
                                </p>
                            </article>
                            <article className="rounded-lg border border-ed-rule bg-ed-surface p-5 shadow-sm">
                                <span className="inline-block rounded border border-ed-accent/25 bg-ed-accent-soft px-1.5 py-0.5 font-mono text-[9px] text-ed-accent">
                                    02 · OPEN
                                </span>
                                <h3
                                    className="mt-4 text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Choose Your Archive
                                </h3>
                                <p className="mt-1 text-[10px] leading-[1.55] text-ed-fg-secondary">
                                    Open an existing collection or start a new local workspace. Indexing happens on your
                                    machine.
                                </p>
                            </article>
                            <article className="rounded-lg border border-ed-rule bg-ed-surface p-5 shadow-sm">
                                <span className="inline-block rounded border border-ed-accent/25 bg-ed-accent-soft px-1.5 py-0.5 font-mono text-[9px] text-ed-accent">
                                    03 · EXPLORE
                                </span>
                                <h3
                                    className="mt-4 text-lg font-medium text-ed-fg"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Explore & Interconnect
                                </h3>
                                <p className="mt-1 text-[10px] leading-[1.55] text-ed-fg-secondary">
                                    Search, read, listen, annotate, and connect the sources that matter to your research.
                                </p>
                            </article>
                        </div>

                        <div className="mt-8 flex items-center gap-2.5 rounded-lg border border-ed-rule bg-ed-surface px-3.5 py-2.5 font-mono text-[10px] text-ed-fg-muted shadow-sm">
                            <Command className="h-3.5 w-3.5 text-ed-accent" />
                            <strong className="font-medium text-ed-fg">Tip:</strong>
                            <span>
                                Press / anywhere to search · Press Ctrl+K to open command palette · All data remains local.
                            </span>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section
                    className="border-t border-ed-rule px-5 py-24 text-center sm:px-7 sm:py-28"
                    style={{
                        background:
                            'radial-gradient(ellipse 550px 230px at 50% 55%, rgba(184,98,51,0.035) 0%, transparent 70%)',
                    }}
                >
                    <div className="mx-auto max-w-3xl">
                        <motion.div {...fadeUp(0)}>
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[13px] border border-ed-rule-strong bg-ed-surface shadow-sm">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt="Submission Archives"
                                    width={36}
                                    height={36}
                                    className="object-contain"
                                />
                            </div>
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                Public offline-ready build
                            </div>
                            <h2
                                className="mt-2 text-3xl font-medium text-ed-fg sm:text-4xl"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Ready to explore the archive offline?
                            </h2>
                            <p
                                className="mx-auto mt-2 max-w-lg text-[14px] text-ed-fg-secondary"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                We are preparing the final polished release. The desktop app will download, index, search,
                                and study the archive entirely locally.
                            </p>
                            <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                                <PrimaryDownloadButton
                                    platform={platform}
                                    onClick={() =>
                                        showToast(
                                            'Desktop builds are in active development — standalone installers coming soon.',
                                        )
                                    }
                                />
                                {otherPlatforms.map((p) => (
                                    <SecondaryDownloadButton
                                        key={p}
                                        platform={p}
                                        onClick={() => showToast(`${PLATFORM_INFO[p].label} standalone binary coming soon.`)}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            {/* Command palette */}
            <AnimatePresence>
                {paletteOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closePalette}
                        className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[13vh] backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Command palette"
                    >
                        <motion.div
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.98, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-[560px] overflow-hidden rounded-[10px] border border-ed-rule-strong bg-ed-surface shadow-2xl"
                        >
                            <div className="flex h-12 items-center gap-2.5 border-b border-ed-rule px-4">
                                <Search className="h-4 w-4 text-ed-fg-muted" />
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Search archive or jump to a section…"
                                    value={paletteQuery}
                                    onChange={(e) => setPaletteQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && filteredPaletteActions.length > 0) {
                                            filteredPaletteActions[0].run({ close: closePalette, showToast });
                                        }
                                    }}
                                    className="w-full bg-transparent text-[13px] text-ed-fg outline-none placeholder:text-ed-fg-muted"
                                />
                            </div>
                            <div className="space-y-0.5 p-2">
                                {filteredPaletteActions.length === 0 ? (
                                    <div className="p-3 text-center text-[11px] text-ed-fg-muted">
                                        No matches for &ldquo;{paletteQuery}&rdquo;
                                    </div>
                                ) : (
                                    filteredPaletteActions.map((action) => (
                                        <button
                                            key={action.id}
                                            type="button"
                                            onClick={() => action.run({ close: closePalette, showToast })}
                                            className="flex w-full items-center gap-2.5 rounded-md p-2.5 text-[11px] text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-fg"
                                        >
                                            {action.icon}
                                            <span>{action.label}</span>
                                            <span className="ml-auto font-mono text-[9px] text-ed-fg-muted">{action.hint}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-ed-rule-strong bg-ed-surface-strong px-4 py-2.5 text-[11px] font-medium text-ed-fg shadow-2xl"
                    >
                        {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* -------------------------------------------------------------------------- */
/* Subcomponents                                                              */
/* -------------------------------------------------------------------------- */


function PrimaryDownloadButton({
    platform,
    onClick,
}: {
    platform: Platform;
    onClick: () => void;
}) {
    const Icon = PLATFORM_INFO[platform].icon;
    const label = `Download for ${PLATFORM_INFO[platform].label}`;

    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded border border-ed-fg bg-ed-fg px-5 py-2 text-[12px] font-semibold text-ed-bg transition-transform hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 shadow-sm"
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
            <small className="border-l border-ed-bg/40 pl-2 font-mono text-[9.5px] opacity-75">v{APP_VERSION}</small>
        </button>
    );
}

function SecondaryDownloadButton({
    platform,
    onClick,
}: {
    platform: Platform;
    onClick: () => void;
}) {
    const Icon = PLATFORM_INFO[platform].icon;

    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 rounded border border-ed-rule bg-ed-surface px-4 py-2 text-[12px] font-semibold text-ed-fg-muted transition-all hover:-translate-y-0.5 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:translate-y-0 shadow-sm"
        >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{PLATFORM_INFO[platform].label}</span>
        </button>
    );
}
