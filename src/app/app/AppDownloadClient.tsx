'use client';

import { useSyncExternalStore, useState, useEffect, useCallback, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
    Apple,
    Monitor,
    Terminal,
    Zap,
    Search,
    LayoutGrid,
    GitBranch,
    Columns,
    Download,
    ChevronDown,
    Command,
    FileText,
    Compass,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

type Platform = 'macos' | 'windows' | 'linux';

type WorkspaceTab = 'editor' | 'quran' | 'canvas' | 'split' | 'inspector';

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
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('editor');
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

                        {/* App window showcase */}
                        <motion.div {...fadeUp(0.08)} className="mx-auto mt-12 max-w-[980px] text-left">
                            <div className="overflow-hidden rounded-[10px] border border-ed-rule-strong bg-ed-surface shadow-2xl">
                                {/* Titlebar */}
                                <div className="flex h-[38px] select-none items-center justify-between border-b border-ed-rule bg-ed-surface-strong px-3.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-[#9D5B4B]" />
                                        <span className="h-2 w-2 rounded-full bg-[#AA8A4B]" />
                                        <span className="h-2 w-2 rounded-full bg-[#5E8B6E]" />
                                    </div>
                                    <div className="truncate px-2 font-mono text-[10px] text-ed-fg-muted">
                                        SA Studio · notes / monotheism_continuity.md
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded bg-ed-accent-soft px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider text-ed-accent border border-ed-accent/20">
                                            Saved
                                        </span>
                                        <span className="font-mono text-[8px] uppercase tracking-wider text-ed-fg-muted">
                                            Local Vault
                                        </span>
                                    </div>
                                </div>

                                <div className="grid min-h-[420px] grid-cols-1 sm:grid-cols-[230px_1fr]">
                                    {/* Sidebar matching SA Studio's Golden Player layout */}
                                    <aside className="border-r border-ed-rule bg-ed-bg-secondary/60 p-2.5 flex flex-col justify-between">
                                        <div>
                                            {/* Segmented top switcher */}
                                            <div className="flex items-center p-0.5 rounded-[6px] bg-ed-surface border border-ed-rule mb-3">
                                                <button
                                                    onClick={() => setActiveWorkspaceTab('editor')}
                                                    className={`flex-1 py-1 text-[10px] font-semibold rounded-[4px] transition-all ${
                                                        activeWorkspaceTab === 'editor'
                                                            ? 'bg-ed-surface-raised text-ed-fg shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-muted hover:text-ed-fg'
                                                    }`}
                                                >
                                                    Files
                                                </button>
                                                <button
                                                    onClick={() => setActiveWorkspaceTab('quran')}
                                                    className={`flex-1 py-1 text-[10px] font-semibold rounded-[4px] transition-all ${
                                                        activeWorkspaceTab === 'quran'
                                                            ? 'bg-ed-surface-raised text-ed-fg shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-muted hover:text-ed-fg'
                                                    }`}
                                                >
                                                    Tags
                                                </button>
                                                <button
                                                    onClick={() => setActiveWorkspaceTab('canvas')}
                                                    className={`flex-1 py-1 text-[10px] font-semibold rounded-[4px] transition-all ${
                                                        activeWorkspaceTab === 'canvas'
                                                            ? 'bg-ed-surface-raised text-ed-fg shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-muted hover:text-ed-fg'
                                                    }`}
                                                >
                                                    Canvas
                                                </button>
                                                <button
                                                    onClick={() => setActiveWorkspaceTab('split')}
                                                    className={`flex-1 py-1 text-[10px] font-semibold rounded-[4px] transition-all ${
                                                        activeWorkspaceTab === 'split'
                                                            ? 'bg-ed-surface-raised text-ed-fg shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-muted hover:text-ed-fg'
                                                    }`}
                                                >
                                                    Split
                                                </button>
                                            </div>

                                            {/* Explorer Header */}
                                            <div className="flex items-center justify-between px-1.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
                                                <span>Explorer</span>
                                                <span className="font-mono text-[9px] text-ed-fg-faint">18 items</span>
                                            </div>

                                            {/* File List Items with Active Glow */}
                                            <nav className="space-y-0.5 mt-1.5">
                                                <button
                                                    onClick={() => setActiveWorkspaceTab('editor')}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-left text-xs transition-all ${
                                                        activeWorkspaceTab === 'editor'
                                                            ? 'bg-ed-surface-raised text-ed-fg font-semibold shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                        activeWorkspaceTab === 'editor'
                                                            ? 'bg-ed-accent shadow-[0_0_8px_var(--ed-accent-glow)]'
                                                            : 'bg-transparent'
                                                    }`} />
                                                    <span className="truncate flex-1">monotheism_continuity.md</span>
                                                </button>

                                                <button
                                                    onClick={() => setActiveWorkspaceTab('quran')}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-left text-xs transition-all ${
                                                        activeWorkspaceTab === 'quran'
                                                            ? 'bg-ed-surface-raised text-ed-fg font-semibold shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                        activeWorkspaceTab === 'quran'
                                                            ? 'bg-ed-accent shadow-[0_0_8px_var(--ed-accent-glow)]'
                                                            : 'bg-transparent'
                                                    }`} />
                                                    <span className="truncate flex-1">quran_2_255_exegesis.md</span>
                                                </button>

                                                <button
                                                    onClick={() => setActiveWorkspaceTab('canvas')}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-left text-xs transition-all ${
                                                        activeWorkspaceTab === 'canvas'
                                                            ? 'bg-ed-surface-raised text-ed-fg font-semibold shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                        activeWorkspaceTab === 'canvas'
                                                            ? 'bg-ed-accent shadow-[0_0_8px_var(--ed-accent-glow)]'
                                                            : 'bg-transparent'
                                                    }`} />
                                                    <span className="truncate flex-1">messengers_timeline.canvas</span>
                                                    <span className="text-[8px] font-mono uppercase px-1 rounded bg-ed-surface text-ed-accent border border-ed-rule">
                                                        2D
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={() => setActiveWorkspaceTab('split')}
                                                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-left text-xs transition-all ${
                                                        activeWorkspaceTab === 'split'
                                                            ? 'bg-ed-surface-raised text-ed-fg font-semibold shadow-xs border border-ed-rule-strong'
                                                            : 'text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface'
                                                    }`}
                                                >
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                        activeWorkspaceTab === 'split'
                                                            ? 'bg-ed-accent shadow-[0_0_8px_var(--ed-accent-glow)]'
                                                            : 'bg-transparent'
                                                    }`} />
                                                    <span className="truncate flex-1">1987_debate_transcript.pdf</span>
                                                    <span className="text-[8px] font-mono uppercase px-1 rounded bg-ed-surface text-ed-danger border border-ed-rule">
                                                        PDF
                                                    </span>
                                                </button>
                                            </nav>
                                        </div>

                                        {/* Bottom Status / Vault */}
                                        <div className="pt-2 border-t border-ed-rule/60 flex items-center justify-between text-[9px] font-mono text-ed-fg-faint px-1">
                                            <span>4,120 words</span>
                                            <span>UTF-8</span>
                                        </div>
                                    </aside>

                                    {/* Main Editor Pane */}
                                    <div className="bg-ed-surface p-4 sm:p-5 flex flex-col justify-between">
                                        <div>
                                            <div className="mb-3 flex items-center justify-between gap-2.5 border-b border-ed-rule/60 pb-2.5">
                                                <div className="flex items-center gap-2 text-xs text-ed-fg-muted font-mono">
                                                    <span className="text-ed-accent font-semibold">[[WikiLink]]</span>
                                                    <span>·</span>
                                                    <span>/quran command</span>
                                                    <span>·</span>
                                                    <span>[^1] footnotes</span>
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <span className="flex h-6 items-center rounded border border-ed-rule bg-ed-surface-strong px-2 text-[9px] text-ed-fg-muted">
                                                        Outline (5)
                                                    </span>
                                                    <span className="flex h-6 items-center rounded border border-ed-rule bg-ed-surface-strong px-2 text-[9px] text-ed-accent font-mono">
                                                        Ctrl+\ Split
                                                    </span>
                                                </div>
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {activeWorkspaceTab === 'editor' && (
                                                    <motion.div
                                                        key="editor-view"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.12 }}
                                                    >
                                                        <h2
                                                            className="text-xl font-semibold leading-tight text-ed-fg sm:text-2xl"
                                                            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                        >
                                                            The Continuum of Absolute Monotheism
                                                        </h2>
                                                        <p className="mt-1 text-[11px] text-ed-fg-muted">
                                                            Cross-referencing [[Quran Study Sessions]] and historical debate notes.
                                                        </p>

                                                        {/* Quran Embed Card inside Note */}
                                                        <div className="mt-4 rounded-lg border border-ed-accent/30 bg-ed-accent-soft p-3.5 space-y-2">
                                                            <div className="flex items-center justify-between text-[10px] font-mono">
                                                                <span className="font-bold text-ed-accent uppercase tracking-wider">Quran Embed · 2:255</span>
                                                                <span className="text-ed-fg-muted">Ayat al-Kursi</span>
                                                            </div>
                                                            <div
                                                                className="text-right text-base leading-loose text-ed-fg"
                                                                dir="rtl"
                                                                style={{ fontFamily: 'Amiri, Georgia, serif' }}
                                                            >
                                                                اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
                                                            </div>
                                                            <p
                                                                className="text-xs leading-relaxed text-ed-fg-secondary italic"
                                                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                            >
                                                                &ldquo;GOD: there is no other god besides Him, the Living, the Eternal.&rdquo;
                                                            </p>
                                                        </div>

                                                        <p
                                                            className="mt-3.5 text-[13px] leading-relaxed text-ed-fg-secondary"
                                                            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                        >
                                                            As established in [[One Message From All Messengers]], scripture confirms that the
                                                            unifying criteria of all divine revelations remains the uncompromised worship of God alone[^1].
                                                        </p>
                                                    </motion.div>
                                                )}

                                                {activeWorkspaceTab === 'quran' && (
                                                    <motion.div
                                                        key="quran-tab"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.12 }}
                                                        className="space-y-3"
                                                    >
                                                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ed-accent">
                                                            Hierarchical #Tags & Taxonomy
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {[
                                                                { tag: '#theology/monotheism', count: 42 },
                                                                { tag: '#scripture/quran-embeds', count: 128 },
                                                                { tag: '#debates/1987-sunni-scholars', count: 19 },
                                                                { tag: '#historical/newsletters', count: 86 },
                                                            ].map((t) => (
                                                                <div key={t.tag} className="flex items-center justify-between p-2.5 rounded-[6px] bg-ed-surface-strong border border-ed-rule text-xs">
                                                                    <span className="font-mono text-ed-accent font-medium">{t.tag}</span>
                                                                    <span className="font-mono text-[10px] text-ed-fg-muted">{t.count} notes</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {activeWorkspaceTab === 'canvas' && (
                                                    <motion.div
                                                        key="canvas-tab"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.12 }}
                                                        className="space-y-3"
                                                    >
                                                        <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-ed-accent">
                                                            2D Visual Synthesis Canvas
                                                        </div>
                                                        <div className="rounded-lg border border-dashed border-ed-rule-strong bg-ed-bg/50 p-6 text-center space-y-2">
                                                            <GitBranch className="h-8 w-8 text-ed-accent mx-auto" />
                                                            <div className="text-xs font-semibold text-ed-fg">Relational Concept Graph</div>
                                                            <p className="text-[11px] text-ed-fg-muted max-w-sm mx-auto">
                                                                Freely arrange notes, verse nodes, media clips, and citation arrows on an infinite spatial plane.
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {activeWorkspaceTab === 'split' && (
                                                    <motion.div
                                                        key="split-tab"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.12 }}
                                                        className="grid grid-cols-2 gap-3"
                                                    >
                                                        <div className="p-3 rounded border border-ed-rule bg-ed-bg/60 text-xs space-y-1">
                                                            <div className="font-mono text-[9px] text-ed-accent font-bold">PANE 1 · MARKDOWN NOTE</div>
                                                            <div className="font-semibold text-ed-fg">monotheism_continuity.md</div>
                                                            <p className="text-[10px] text-ed-fg-secondary">Active writing buffer...</p>
                                                        </div>
                                                        <div className="p-3 rounded border border-ed-rule bg-ed-bg/60 text-xs space-y-1">
                                                            <div className="font-mono text-[9px] text-ed-danger font-bold">PANE 2 · PDF VIEWER</div>
                                                            <div className="font-semibold text-ed-fg">1987_debate_transcript.pdf</div>
                                                            <p className="text-[10px] text-ed-fg-secondary">Page 14 of 48 · Excerpt capture active</p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Bottom Slash Hint */}
                                        <div className="mt-4 pt-2.5 border-t border-ed-rule/60 flex items-center justify-between text-[10px] text-ed-fg-muted">
                                            <span>Type <code className="text-ed-accent font-mono">/quran</code> to insert verse or <code className="text-ed-accent font-mono">[[</code> to link notes</span>
                                            <span className="font-mono text-[9px]">Ctrl+P Commands</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Proof strip */}
                                <div className="grid grid-cols-1 border-t border-ed-rule bg-ed-bg/50 sm:grid-cols-3">
                                    <div className="border-b border-ed-rule p-5 sm:border-b-0 sm:border-r">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-ed-rule bg-ed-surface text-ed-accent">
                                            <FileText className="h-3 w-3" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-ed-fg">Plain Markdown & Frontmatter</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-ed-fg-muted">
                                            Your notes remain open standard Markdown on your disk. No proprietary databases or vendor lock-in.
                                        </p>
                                    </div>
                                    <div className="border-b border-ed-rule p-5 sm:border-b-0 sm:border-r">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-ed-rule bg-ed-surface text-ed-accent">
                                            <Search className="h-3 w-3" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-ed-fg">Sub-Millisecond Local Search</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-ed-fg-muted">
                                            Instant offline query across note bodies, tags, surah names, and Arabic transliterations.
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-ed-rule bg-ed-surface text-ed-accent">
                                            <GitBranch className="h-3 w-3" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-ed-fg">Bidirectional [[WikiLinks]] & Canvas</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-ed-fg-muted">
                                            Interconnect concepts across scripture, debates, and periodicals on a spatial visual graph.
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
            className="inline-flex min-h-[38px] items-center gap-2 rounded border border-ed-fg bg-ed-fg px-4 text-[12px] font-semibold text-ed-bg transition-transform hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0"
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
            <small className="border-l border-ed-bg/40 pl-2 font-mono text-[9px] opacity-75">v{APP_VERSION}</small>
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
            className="inline-flex min-h-[38px] items-center gap-2 rounded border border-ed-rule bg-ed-surface px-4 text-[12px] font-semibold text-ed-fg-muted transition-all hover:-translate-y-0.5 hover:border-ed-rule-strong hover:bg-ed-surface-strong hover:text-ed-fg active:translate-y-0"
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{PLATFORM_INFO[platform].label}</span>
        </button>
    );
}
