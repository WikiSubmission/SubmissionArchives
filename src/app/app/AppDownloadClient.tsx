'use client';

import { useSyncExternalStore, useState, useEffect, useCallback, type ReactNode } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import {
    Apple,
    Monitor,
    Terminal,
    HardDrive,
    Zap,
    Search,
    LayoutGrid,
    GitBranch,
    Columns,
    Layers,
    Keyboard,
    Clock,
    Download,
    ChevronDown,
    Command,
    FileText,
    Volume2,
    Video,
    FileCode,
    Bookmark,
    Compass,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* Types & Constants                                                          */
/* -------------------------------------------------------------------------- */

type Platform = 'macos' | 'windows' | 'linux';

type WorkspaceTab = 'documents' | 'quran' | 'audio' | 'video' | 'written';

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
        title: 'Native Rust Engine & Tauri IPC Bridge',
        badge: 'NON-REMOTE',
        icon: <Zap className="h-3.5 w-3.5 text-[#C8794A]" />,
        content:
            'A desktop-native core engineered with native Rust and Tauri v2 for responsive indexing, file operations, and media access without pushing your working archive to a hosted cloud service.',
    },
    {
        id: 'engine-2',
        title: 'Local-First SQLite & Vector Search Database',
        badge: 'ONE COLLECTION',
        icon: <HardDrive className="h-3.5 w-3.5 text-[#C8794A]" />,
        content:
            'Structured metadata and local BM25 ranking execute entirely on your machine. Your scholarly notes and transcript indexes remain open standard Markdown and SQLite on your drive.',
    },
    {
        id: 'engine-3',
        title: 'Arabic Transliteration & Named Surah Autocomplete',
        badge: 'SEARCH LAYER',
        icon: <Search className="h-3.5 w-3.5 text-[#C8794A]" />,
        content:
            'The search layer is optimized for Arabic script, phonetic transliteration, named surahs, and academic citation formats with sub-millisecond local fuzzy matching.',
    },
    {
        id: 'engine-4',
        title: 'Bidirectional Wiki Links & Interactive Canvas',
        badge: 'KNOWLEDGE GRAPH',
        icon: <GitBranch className="h-3.5 w-3.5 text-[#C8794A]" />,
        content:
            'Move seamlessly from a verse to a note, from a speaker to a recording, or from a theological theme to every source in the archive across a 2D relational canvas.',
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
        label: 'Explore features',
        hint: 'F',
        icon: <LayoutGrid className="h-3.5 w-3.5 text-[#C8794A]" />,
        run: ({ close }) => {
            close();
            document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
        },
    },
    {
        id: 'top',
        label: 'Back to top',
        hint: 'H',
        icon: <Compass className="h-3.5 w-3.5 text-[#C8794A]" />,
        run: ({ close }) => {
            close();
            document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' });
        },
    },
    {
        id: 'download',
        label: 'Download desktop application',
        hint: 'D',
        icon: <Download className="h-3.5 w-3.5 text-[#C8794A]" />,
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
    const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>('documents');
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
        <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans antialiased selection:bg-[#C8794A]/25 selection:text-[#F5F0EB]">
            {/* Ambient background — matches archive pages */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    background:
                        'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.025) 0%, transparent 70%), ' +
                        'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.015) 0%, transparent 70%)',
                }}
            />

            {/* Page content only — site Header/Footer come from root layout */}
            <main id="top" className="relative z-10">
                {/* Hero */}
                <section className="px-5 pt-16 pb-16 text-center sm:px-7 sm:pt-20 sm:pb-20">
                    <div className="mx-auto max-w-[820px]">
                        <motion.div {...fadeUp(0)}>
                            <div className="inline-flex items-center gap-1.5 rounded border border-[rgba(200,121,74,0.15)] bg-[rgba(200,121,74,0.06)] px-2.5 py-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#C8794A]" />
                                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C8794A]">
                                    App Studio · Offline scholarly workspace
                                </span>
                            </div>

                            <h1
                                className="mx-auto mt-5 max-w-[720px] text-[clamp(2.75rem,5.5vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-[#F5F0EB]"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Your archive, <span className="text-[#C8794A]">on your own disk.</span>
                            </h1>

                            <p
                                className="mx-auto mt-7 max-w-[620px] text-[16.5px] leading-[1.6] text-[#9E9690]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                A local-first workspace for precise research, listening, reading, and citation. Keep the
                                archive private, searchable, and yours — Quran references, transcripts, audio, video, and
                                written material in one place.
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

                            <div className="mt-3.5 font-mono text-[10px] tracking-wide text-[#4A4542]">
                                Build {APP_VERSION} · Free to use · Standard sources
                            </div>

                            {/* Notice — restrained, enterprise */}
                            <div className="mx-auto mt-7 flex max-w-[560px] items-start gap-3 rounded-lg border border-[#2A2928] bg-[#161514] px-4 py-3 text-left">
                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-[#2A2928] bg-[#1C1B1A] text-[#C8794A]">
                                    <Zap className="h-3 w-3" />
                                </div>
                                <div>
                                    <strong className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9E9690]">
                                        Active development · Synchronized offline core
                                    </strong>
                                    <span className="mt-0.5 block text-[11px] leading-relaxed text-[#6B6560]">
                                        The foundation is being refined around local search, scholarly citations, media
                                        playback, and long-term archive portability.
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* App window showcase */}
                        <motion.div {...fadeUp(0.08)} className="mx-auto mt-12 max-w-[940px] text-left">
                            <div className="overflow-hidden rounded-[10px] border border-[#302E2B] bg-[#141311] shadow-[0_22px_70px_rgba(0,0,0,0.32)]">
                                {/* Titlebar */}
                                <div className="flex h-[37px] select-none items-center justify-between border-b border-[#2A2928] bg-[#181715] px-3.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#9D5B4B]" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#AA8A4B]" />
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#5E8B6E]" />
                                    </div>
                                    <div className="truncate px-2 font-mono text-[9px] text-[#4A4542]">
                                        SA Studio · Documents / Quran / Al-Baqarah 2:255
                                    </div>
                                    <div className="font-mono text-[8px] uppercase tracking-wider text-[#4A4542]">
                                        Local
                                    </div>
                                </div>

                                <div className="grid min-h-[355px] grid-cols-1 sm:grid-cols-[185px_1fr]">
                                    {/* Sidebar */}
                                    <aside className="border-r border-[#2A2928] bg-[#12110F] p-3.5">
                                        <div className="px-2 pb-2 text-[8px] font-semibold uppercase tracking-[0.13em] text-[#4A4542]">
                                            Workspace
                                        </div>
                                        <nav className="space-y-0.5">
                                            <SidebarItem
                                                active={activeWorkspaceTab === 'documents'}
                                                onClick={() => setActiveWorkspaceTab('documents')}
                                                label="Documents"
                                                count="128"
                                                icon={<FileText className="h-3 w-3" />}
                                            />
                                            <SidebarItem
                                                active={activeWorkspaceTab === 'quran'}
                                                onClick={() => setActiveWorkspaceTab('quran')}
                                                label="Quran"
                                                count="6,236"
                                                icon={<Layers className="h-3 w-3" />}
                                            />
                                            <SidebarItem
                                                active={activeWorkspaceTab === 'audio'}
                                                onClick={() => setActiveWorkspaceTab('audio')}
                                                label="Audio"
                                                count="482"
                                                icon={<Volume2 className="h-3 w-3" />}
                                            />
                                            <SidebarItem
                                                active={activeWorkspaceTab === 'video'}
                                                onClick={() => setActiveWorkspaceTab('video')}
                                                label="Video"
                                                count="96"
                                                icon={<Video className="h-3 w-3" />}
                                            />
                                            <SidebarItem
                                                active={activeWorkspaceTab === 'written'}
                                                onClick={() => setActiveWorkspaceTab('written')}
                                                label="Written"
                                                count="241"
                                                icon={<FileCode className="h-3 w-3" />}
                                            />
                                        </nav>

                                        <div className="mx-2 my-2.5 h-px bg-[#2A2928]" />

                                        <div className="px-2 pb-2 text-[8px] font-semibold uppercase tracking-[0.13em] text-[#4A4542]">
                                            Collections
                                        </div>
                                        <nav className="space-y-0.5">
                                            <div className="flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-[10px] text-[#6B6560]">
                                                <Bookmark className="h-3 w-3 text-[#C8794A]" />
                                                <span>Bookmarks</span>
                                                <span className="ml-auto font-mono text-[9px] text-[#4A4542]">24</span>
                                            </div>
                                            <div className="flex cursor-default items-center gap-2 rounded px-2 py-1.5 text-[10px] text-[#6B6560]">
                                                <Clock className="h-3 w-3" />
                                                <span>Recent</span>
                                            </div>
                                        </nav>
                                    </aside>

                                    {/* Main pane */}
                                    <div className="bg-[#141311] p-4 sm:p-5">
                                        <div className="mb-4 flex items-center justify-between gap-2.5">
                                            <div className="flex h-8 max-w-[390px] flex-1 items-center gap-2 rounded border border-[#2A2928] bg-[#191816] px-2.5 text-[10px] text-[#4A4542]">
                                                <Search className="h-3 w-3 shrink-0" />
                                                <span className="truncate">Search archive, Arabic, names, surahs…</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <span className="flex h-[30px] items-center rounded border border-[#2A2928] bg-[#181715] px-2.5 text-[9px] text-[#6B6560]">
                                                    Filter
                                                </span>
                                                <span className="flex h-[30px] items-center rounded border border-[#2A2928] bg-[#181715] px-2.5 text-[9px] text-[#6B6560]">
                                                    Import
                                                </span>
                                            </div>
                                        </div>

                                        <AnimatePresence mode="wait">
                                            {activeWorkspaceTab === 'documents' && (
                                                <motion.div
                                                    key="doc-view"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.12 }}
                                                >
                                                    <div className="flex items-start justify-between gap-3 border-b border-[#2A2928] pb-3.5">
                                                        <div>
                                                            <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#C8794A]">
                                                                Al-Baqarah · Ayat al-Kursi
                                                            </div>
                                                            <h2
                                                                className="mt-1 text-xl font-medium leading-tight text-[#F5F0EB] sm:text-2xl"
                                                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                            >
                                                                Ayat al-Kursi (Surah Al-Baqarah 2:255)
                                                            </h2>
                                                            <div className="mt-1 text-[9px] text-[#4A4542]">
                                                                Quran · Named Surah Search · Canonical text
                                                            </div>
                                                        </div>
                                                        <div className="flex shrink-0 gap-1.5">
                                                            <span className="rounded-full border border-[#2A2928] px-2 py-0.5 text-[8px] text-[#6B6560]">
                                                                Bookmark
                                                            </span>
                                                            <span className="rounded-full border border-[#2A2928] px-2 py-0.5 text-[8px] text-[#6B6560]">
                                                                Open
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="mt-4 border-l-2 border-[#C8794A] bg-[rgba(200,121,74,0.035)] px-3 py-2 text-[13.5px] leading-[1.55] text-[#9E9690]"
                                                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                                                    >
                                                        &ldquo;GOD: there is no other god besides Him, the Living, the
                                                        Eternal.&rdquo;
                                                    </div>

                                                    <div
                                                        className="mt-3.5 border border-[#2A2928] bg-[rgba(143,184,168,0.025)] p-3 text-right text-lg leading-loose text-[#F5F0EB]"
                                                        dir="rtl"
                                                        style={{ fontFamily: 'Georgia, serif' }}
                                                    >
                                                        اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ
                                                    </div>

                                                    <div className="mt-4 space-y-2">
                                                        <div className="h-1.5 w-[92%] rounded-full bg-[#24221F]" />
                                                        <div className="h-1.5 w-[78%] rounded-full bg-[#24221F]" />
                                                        <div className="h-1.5 w-[66%] rounded-full bg-[#24221F]" />
                                                    </div>
                                                </motion.div>
                                            )}

                                            {activeWorkspaceTab === 'quran' && (
                                                <motion.div
                                                    key="quran-view"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.12 }}
                                                >
                                                    <div className="flex items-start justify-between gap-3 border-b border-[#2A2928] pb-3.5">
                                                        <div>
                                                            <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#C8794A]">
                                                                Surah Index · 114 Chapters
                                                            </div>
                                                            <h2
                                                                className="mt-1 text-xl font-medium leading-tight text-[#F5F0EB] sm:text-2xl"
                                                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                            >
                                                                Browse by Surah
                                                            </h2>
                                                            <div className="mt-1 text-[9px] text-[#4A4542]">
                                                                Arabic · English · Transliteration
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3.5 space-y-1.5">
                                                        {[
                                                            { n: 1, name: 'Al-Fatihah', meaning: 'The Opening', verses: 7 },
                                                            { n: 2, name: 'Al-Baqarah', meaning: 'The Cow', verses: 286 },
                                                            { n: 36, name: 'Ya Seen', meaning: 'Ya Seen', verses: 83 },
                                                            { n: 112, name: 'Al-Ikhlas', meaning: 'Sincerity', verses: 4 },
                                                        ].map((surah) => (
                                                            <div
                                                                key={surah.n}
                                                                className="flex items-center gap-2.5 rounded border border-[#2A2928] bg-[#191816] px-2.5 py-1.5"
                                                            >
                                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#2A2928] font-mono text-[8px] text-[#6B6560]">
                                                                    {surah.n}
                                                                </span>
                                                                <span className="text-[11px] font-medium text-[#F5F0EB]">{surah.name}</span>
                                                                <span className="text-[9px] text-[#6B6560]">{surah.meaning}</span>
                                                                <span className="ml-auto font-mono text-[8px] text-[#4A4542]">
                                                                    {surah.verses} verses
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {activeWorkspaceTab === 'audio' && (
                                                <motion.div
                                                    key="audio-view"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.12 }}
                                                    className="space-y-3"
                                                >
                                                    <div className="border-b border-[#2A2928] pb-3.5">
                                                        <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#C8794A]">
                                                            Audio Session Index · Master Tapes
                                                        </div>
                                                        <h2
                                                            className="mt-1 text-xl font-medium text-[#F5F0EB]"
                                                            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                        >
                                                            QS 01 · Advocating God Alone
                                                        </h2>
                                                        <div className="mt-1 text-[9px] text-[#4A4542]">
                                                            Speaker: Dr. Rashad Khalifa · Duration: 1:19:42 · Masjid Tucson
                                                            (1987–1990)
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2 rounded-md border border-[#2A2928] bg-[#161514] p-3">
                                                        <div className="flex items-center justify-between font-mono text-[10px] text-[#4A4542]">
                                                            <span>Digitized Analog Master</span>
                                                            <span className="text-[#C8794A]">Normalized FLAC/MP3</span>
                                                        </div>
                                                        <div className="h-1 rounded-full bg-[#24221F]">
                                                            <div className="h-full w-1/3 rounded-full bg-[#C8794A]" />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {activeWorkspaceTab === 'video' && (
                                                <motion.div
                                                    key="video-view"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.12 }}
                                                    className="space-y-3"
                                                >
                                                    <div className="border-b border-[#2A2928] pb-3.5">
                                                        <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#C8794A]">
                                                            Video Archival Preservations
                                                        </div>
                                                        <h2
                                                            className="mt-1 text-xl font-medium text-[#F5F0EB]"
                                                            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                        >
                                                            Tape #04 · The Great Debate
                                                        </h2>
                                                        <div className="mt-1 text-[9px] text-[#4A4542]">
                                                            Historical recording · Complete unedited digital restoration
                                                        </div>
                                                    </div>
                                                    <div className="rounded-md border border-[#2A2928] bg-[#161514] p-3 font-mono text-[11px] text-[#6B6560]">
                                                        Chapter markers, synchronized transcript segments, and verse
                                                        citations linked.
                                                    </div>
                                                </motion.div>
                                            )}

                                            {activeWorkspaceTab === 'written' && (
                                                <motion.div
                                                    key="written-view"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.12 }}
                                                    className="space-y-3"
                                                >
                                                    <div className="border-b border-[#2A2928] pb-3.5">
                                                        <div className="text-[8px] font-bold uppercase tracking-[0.13em] text-[#C8794A]">
                                                            Written Materials · Research Notes
                                                        </div>
                                                        <h2
                                                            className="mt-1 text-xl font-medium text-[#F5F0EB]"
                                                            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                                        >
                                                            Scholarly annotations & source documents
                                                        </h2>
                                                        <div className="mt-1 text-[9px] text-[#4A4542]">
                                                            Markdown · PDF · Cross-referenced citations
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="h-1.5 w-[88%] rounded-full bg-[#24221F]" />
                                                        <div className="h-1.5 w-[72%] rounded-full bg-[#24221F]" />
                                                        <div className="h-1.5 w-[60%] rounded-full bg-[#24221F]" />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Proof strip */}
                                <div className="grid grid-cols-1 border-t border-[#2A2928] bg-[#12110F] sm:grid-cols-3">
                                    <div className="border-b border-[#2A2928] p-5 sm:border-b-0 sm:border-r">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-[#2A2928] bg-[#181715] text-[#9E9690]">
                                            <FileText className="h-3 w-3" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-[#F5F0EB]">Plain Markdown Files</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-[#4A4542]">
                                            Scholarly notes remain readable and portable outside the app.
                                        </p>
                                    </div>
                                    <div className="border-b border-[#2A2928] p-5 sm:border-b-0 sm:border-r">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-[#2A2928] bg-[#181715] text-[#9E9690]">
                                            <Search className="h-3 w-3" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-[#F5F0EB]">Instant Native Search</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-[#4A4542]">
                                            Search Arabic, English, speakers, surahs, and imported material locally.
                                        </p>
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex h-6 w-6 items-center justify-center rounded border border-[#2A2928] bg-[#181715] text-[#9E9690]">
                                            <GitBranch className="h-3 w-3" />
                                        </div>
                                        <h3 className="text-[11px] font-semibold text-[#F5F0EB]">Living Knowledge Graph</h3>
                                        <p className="mt-1 text-[10px] leading-normal text-[#4A4542]">
                                            Connect verses, people, topics, recordings, and citations as the archive grows.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Features */}
                <section id="features" className="border-t border-[rgba(255,255,255,0.055)] py-20 px-5 sm:px-7 sm:py-24">
                    <div className="mx-auto max-w-5xl">
                        <motion.div {...fadeUp(0)} className="mb-10 text-center">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4A4542]">
                                Capabilities
                            </div>
                            <h2
                                className="mt-2 text-3xl font-medium text-[#F5F0EB] sm:text-4xl"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Everything you need to study and expand the archive
                            </h2>
                            <p
                                className="mx-auto mt-2 max-w-xl text-[14px] text-[#6B6560]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Purpose-built capabilities for careful research, cross-reference, listening, annotation,
                                and preservation.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                            <motion.article
                                {...fadeUp(0.04)}
                                className="relative min-h-[200px] rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.018)] p-5 transition-colors hover:border-[#353433] hover:bg-[rgba(255,255,255,0.026)] sm:col-span-2 lg:col-span-2"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-[#2A2928] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#4A4542]">
                                    Translation + Search
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-[#2A2928] bg-[#191816] text-[#9E9690]">
                                    <Search className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Academic Arabic Translation & Named Surah Search
                                </h3>
                                <p className="mt-1.5 max-w-lg text-[11px] leading-[1.55] text-[#6B6560]">
                                    Search canonical Quran text alongside English translation, Arabic phrases, named
                                    surahs, verse references, and your own scholarly annotations.
                                </p>
                                <div className="mt-4 rounded border border-[#2A2928] bg-[#141311] p-2.5 font-mono text-[8px] text-[#4A4542]">
                                    <div className="mb-1.5 flex justify-between">
                                        <span>Live translation · 2:255</span>
                                        <span className="text-[#C8794A]">Quran</span>
                                    </div>
                                    <div className="h-1 w-full rounded-full bg-[#25221F]" />
                                    <div className="mt-1 h-1 w-[65%] rounded-full bg-[#25221F]" />
                                </div>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.08)}
                                className="relative rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.018)] p-5 transition-colors hover:border-[#353433] hover:bg-[rgba(255,255,255,0.026)]"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-[#2A2928] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#4A4542]">
                                    Visual Workspace
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-[#2A2928] bg-[#191816] text-[#9E9690]">
                                    <LayoutGrid className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Visual Whiteboard & Idea Trees
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-[#6B6560]">
                                    Connect notes, verses, people, and topics visually without losing source context.
                                </p>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.12)}
                                className="relative rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.018)] p-5 transition-colors hover:border-[#353433] hover:bg-[rgba(255,255,255,0.026)]"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-[#2A2928] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#4A4542]">
                                    Viewer
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-[#2A2928] bg-[#191816] text-[#9E9690]">
                                    <Columns className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Split View & PDF Capture
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-[#6B6560]">
                                    Compare source material with notes and capture useful passages.
                                </p>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.16)}
                                className="relative rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.018)] p-5 transition-colors hover:border-[#353433] hover:bg-[rgba(255,255,255,0.026)]"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-[#2A2928] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#4A4542]">
                                    Import
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-[#2A2928] bg-[#191816] text-[#9E9690]">
                                    <Download className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Universal Import Wizard
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-[#6B6560]">
                                    Bring in Markdown, PDFs, audio, video, and existing collections without rebuilding the
                                    archive.
                                </p>
                            </motion.article>

                            <motion.article
                                {...fadeUp(0.2)}
                                className="relative rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.018)] p-5 transition-colors hover:border-[#353433] hover:bg-[rgba(255,255,255,0.026)]"
                            >
                                <span className="absolute right-4 top-4 rounded-full border border-[#2A2928] px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-[#4A4542]">
                                    Customizable
                                </span>
                                <div className="mb-4 flex h-7 w-7 items-center justify-center rounded border border-[#2A2928] bg-[#191816] text-[#9E9690]">
                                    <Keyboard className="h-3.5 w-3.5" />
                                </div>
                                <h3
                                    className="text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Customizable Keybindings
                                </h3>
                                <p className="mt-1.5 text-[11px] leading-[1.55] text-[#6B6560]">
                                    Keep navigation fast and keyboard-first, especially during research sessions.
                                </p>
                            </motion.article>
                        </div>

                        {/* Architecture */}
                        <div className="mt-16 text-center">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4A4542]">
                                Core engine architecture
                            </div>
                            <p
                                className="mx-auto mt-1 max-w-xl text-[14px] text-[#6B6560]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                Local-first primitives keep the archive useful even when the network disappears.
                            </p>

                            <div className="mx-auto mt-7 max-w-2xl overflow-hidden rounded-lg border border-[#2A2928] text-left">
                                {ARCHITECTURE_PILLARS.map((item, idx) => {
                                    const isOpen = openAccordionId === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            className={idx !== ARCHITECTURE_PILLARS.length - 1 ? 'border-b border-[#2A2928]' : ''}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenAccordionId(isOpen ? '' : item.id)}
                                                className="flex w-full items-center gap-2.5 bg-[#151412] px-3.5 py-3 text-left transition-colors hover:bg-[#1A1816]"
                                            >
                                                <span className="flex h-5 w-5 items-center justify-center rounded border border-[#2A2928] text-[#C8794A]">
                                                    {item.icon}
                                                </span>
                                                <span className="text-[10px] font-semibold text-[#9E9690]">{item.title}</span>
                                                <span className="rounded-full border border-[#2A2928] px-1.5 py-0.5 font-mono text-[7px] text-[#4A4542]">
                                                    {item.badge}
                                                </span>
                                                <ChevronDown
                                                    className={`ml-auto h-3 w-3 text-[#4A4542] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#9E9690]' : ''
                                                        }`}
                                                />
                                            </button>
                                            {isOpen && (
                                                <div className="bg-[#151412] px-11 pb-3.5 text-[10px] leading-[1.55] text-[#6B6560]">
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
                <section className="border-t border-[rgba(255,255,255,0.055)] py-20 px-5 sm:px-7 sm:py-24">
                    <div className="mx-auto max-w-5xl">
                        <motion.div {...fadeUp(0)} className="mb-10 text-center">
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4A4542]">
                                Zero configuration onboarding
                            </div>
                            <h2
                                className="mt-2 text-3xl font-medium text-[#F5F0EB] sm:text-4xl"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Up and running in seconds
                            </h2>
                            <p
                                className="mx-auto mt-2 max-w-xl text-[14px] text-[#6B6560]"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                No accounts to create. Point the app at your archive, let it index, and start working
                                locally.
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            <article className="rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.015)] p-5">
                                <span className="inline-block rounded border border-[rgba(200,121,74,0.25)] px-1.5 py-0.5 font-mono text-[9px] text-[#C8794A]">
                                    01 · INSTALL
                                </span>
                                <h3
                                    className="mt-4 text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Download the Native App
                                </h3>
                                <p className="mt-1 text-[10px] leading-[1.55] text-[#6B6560]">
                                    Choose your platform and install the desktop client. Your archive stays where you put
                                    it.
                                </p>
                            </article>
                            <article className="rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.015)] p-5">
                                <span className="inline-block rounded border border-[rgba(200,121,74,0.25)] px-1.5 py-0.5 font-mono text-[9px] text-[#C8794A]">
                                    02 · OPEN
                                </span>
                                <h3
                                    className="mt-4 text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Choose Your Archive
                                </h3>
                                <p className="mt-1 text-[10px] leading-[1.55] text-[#6B6560]">
                                    Open an existing collection or start a new local workspace. Indexing happens on your
                                    machine.
                                </p>
                            </article>
                            <article className="rounded-lg border border-[#2A2928] bg-[rgba(255,255,255,0.015)] p-5">
                                <span className="inline-block rounded border border-[rgba(200,121,74,0.25)] px-1.5 py-0.5 font-mono text-[9px] text-[#C8794A]">
                                    03 · EXPLORE
                                </span>
                                <h3
                                    className="mt-4 text-lg font-medium text-[#F5F0EB]"
                                    style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                                >
                                    Explore & Interconnect
                                </h3>
                                <p className="mt-1 text-[10px] leading-[1.55] text-[#6B6560]">
                                    Search, read, listen, annotate, and connect the sources that matter to your research.
                                </p>
                            </article>
                        </div>

                        <div className="mt-8 flex items-center gap-2.5 rounded-lg border border-[#2A2928] bg-[#151412] px-3.5 py-2.5 font-mono text-[10px] text-[#4A4542]">
                            <Command className="h-3.5 w-3.5 text-[#C8794A]" />
                            <strong className="font-medium text-[#9E9690]">Tip:</strong>
                            <span>
                                Press / anywhere to search · Press Ctrl+K to open command palette · All data remains local.
                            </span>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section
                    className="border-t border-[rgba(255,255,255,0.055)] px-5 py-24 text-center sm:px-7 sm:py-28"
                    style={{
                        background:
                            'radial-gradient(ellipse 550px 230px at 50% 55%, rgba(200,121,74,0.035) 0%, transparent 70%)',
                    }}
                >
                    <div className="mx-auto max-w-3xl">
                        <motion.div {...fadeUp(0)}>
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[13px] border border-[#353433] bg-[#181715]">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt="Submission Archives"
                                    width={36}
                                    height={36}
                                    className="object-contain"
                                />
                            </div>
                            <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#4A4542]">
                                Public offline-ready build
                            </div>
                            <h2
                                className="mt-2 text-3xl font-medium text-[#F5F0EB] sm:text-4xl"
                                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                            >
                                Ready to explore the archive offline?
                            </h2>
                            <p
                                className="mx-auto mt-2 max-w-lg text-[14px] text-[#6B6560]"
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
                            className="w-full max-w-[560px] overflow-hidden rounded-[10px] border border-[#353433] bg-[#171614] shadow-[0_30px_90px_rgba(0,0,0,0.6)]"
                        >
                            <div className="flex h-12 items-center gap-2.5 border-b border-[#2A2928] px-4">
                                <Search className="h-4 w-4 text-[#4A4542]" />
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
                                    className="w-full bg-transparent text-[13px] text-[#F5F0EB] outline-none placeholder:text-[#4A4542]"
                                />
                            </div>
                            <div className="space-y-0.5 p-2">
                                {filteredPaletteActions.length === 0 ? (
                                    <div className="p-3 text-center text-[11px] text-[#6B6560]">
                                        No matches for &ldquo;{paletteQuery}&rdquo;
                                    </div>
                                ) : (
                                    filteredPaletteActions.map((action) => (
                                        <button
                                            key={action.id}
                                            type="button"
                                            onClick={() => action.run({ close: closePalette, showToast })}
                                            className="flex w-full items-center gap-2.5 rounded-md p-2.5 text-[11px] text-[#9E9690] hover:bg-[#211F1D] hover:text-[#F5F0EB]"
                                        >
                                            {action.icon}
                                            <span>{action.label}</span>
                                            <span className="ml-auto font-mono text-[9px] text-[#4A4542]">{action.hint}</span>
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
                        className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-md border border-[#353433] bg-[#1E1D1C] px-4 py-2.5 text-[11px] font-medium text-[#F5F0EB] shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
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

function SidebarItem({
    active,
    onClick,
    label,
    count,
    icon,
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: string;
    icon: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-[10px] transition-colors ${active
                    ? 'bg-[rgba(200,121,74,0.08)] font-medium text-[#F5F0EB]'
                    : 'text-[#6B6560] hover:bg-[#1B1917] hover:text-[#9E9690]'
                }`}
        >
            <span className={active ? 'text-[#C8794A]' : 'text-[#4A4542]'}>{icon}</span>
            <span>{label}</span>
            <span className="ml-auto font-mono text-[9px] text-[#4A4542]">{count}</span>
        </button>
    );
}

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
            className="inline-flex min-h-[38px] items-center gap-2 rounded border border-[#F5F0EB] bg-[#F5F0EB] px-4 text-[12px] font-semibold text-[#151311] transition-transform hover:-translate-y-0.5 hover:bg-white active:translate-y-0"
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{label}</span>
            <small className="border-l border-[#151311]/40 pl-2 font-mono text-[9px] opacity-75">v{APP_VERSION}</small>
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
            className="inline-flex min-h-[38px] items-center gap-2 rounded border border-[#2A2928] bg-transparent px-4 text-[12px] font-semibold text-[#9E9690] transition-all hover:-translate-y-0.5 hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#F5F0EB] active:translate-y-0"
        >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span>{PLATFORM_INFO[platform].label}</span>
        </button>
    );
}
