'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Menu,
    PanelRightClose,
    PanelRightOpen,
    Search,
    X,
} from 'lucide-react';

const BIBLE_ALIASES: Record<string, string> = {
    gen: 'gen', genesis: 'gen',
    exo: 'exo', exodus: 'exo',
    lev: 'lev', leviticus: 'lev',
    num: 'num', numbers: 'num',
    deu: 'deu', deut: 'deu', deuteronomy: 'deu',
    jos: 'jos', joshua: 'jos',
    jdg: 'jdg', judg: 'jdg', judges: 'jdg',
    '1sa': '1sa', '1 sam': '1sa', '1 samuel': '1sa', '1st samuel': '1sa',
    '2sa': '2sa', '2 sam': '2sa', '2 samuel': '2sa', '2nd samuel': '2sa',
    '1ki': '1ki', '1 kings': '1ki', '1st kings': '1ki',
    '2ki': '2ki', '2 kings': '2ki', '2nd kings': '2ki',
    isa: 'isa', isaiah: 'isa',
    jer: 'jer', jeremiah: 'jer',
    ezk: 'ezk', ezek: 'ezk', ezekiel: 'ezk',
    hos: 'hos', hosea: 'hos',
    joe: 'joe', joel: 'joe',
    amo: 'amo', amos: 'amo',
    oba: 'oba', obadiah: 'oba',
    jon: 'jon', jonah: 'jon',
    mic: 'mic', micah: 'mic',
    nam: 'nam', nahum: 'nam',
    hab: 'hab', habakkuk: 'hab',
    zep: 'zep', zeph: 'zep', zephaniah: 'zep',
    hag: 'hag', haggai: 'hag',
    zec: 'zec', zech: 'zec', zechariah: 'zec',
    mal: 'mal', malachi: 'mal',
    psa: 'psa', ps: 'psa', psalm: 'psa', psalms: 'psa',
    pro: 'pro', prov: 'pro', proverbs: 'pro',
    job: 'job',
    sng: 'sng', song: 'sng', 'song of songs': 'sng', 'song of solomon': 'sng',
    rut: 'rut', ruth: 'rut',
    lam: 'lam', lamentations: 'lam',
    ecc: 'ecc', eccles: 'ecc', ecclesiastes: 'ecc',
    est: 'est', esther: 'est',
    dan: 'dan', daniel: 'dan',
    ezr: 'ezr', ezra: 'ezr',
    neh: 'neh', nehemiah: 'neh',
    '1ch': '1ch', '1 chron': '1ch', '1 chronicles': '1ch',
    '2ch': '2ch', '2 chron': '2ch', '2 chronicles': '2ch',
    mat: 'mat', matt: 'mat', matthew: 'mat',
    mar: 'mar', mark: 'mar',
    luk: 'luk', luke: 'luk',
    joh: 'joh', john: 'joh',
    act: 'act', acts: 'act',
    rom: 'rom', romans: 'rom',
    '1co': '1co', '1 cor': '1co', '1 corinthians': '1co',
    '2co': '2co', '2 cor': '2co', '2 corinthians': '2co',
    gal: 'gal', galatians: 'gal',
    eph: 'eph', ephesians: 'eph',
    phi: 'phi', phil: 'phi', philippians: 'phi',
    col: 'col', colossians: 'col',
    '1th': '1th', '1 thess': '1th', '1 thessalonians': '1th',
    '2th': '2th', '2 thess': '2th', '2 thessalonians': '2th',
    '1ti': '1ti', '1 tim': '1ti', '1 timothy': '1ti',
    '2ti': '2ti', '2 tim': '2ti', '2 timothy': '2ti',
    tit: 'tit', titus: 'tit',
    phm: 'phm', philem: 'phm', philemon: 'phm',
    heb: 'heb', hebrews: 'heb',
    jam: 'jam', james: 'jam',
    '1pe': '1pe', '1 pet': '1pe', '1 peter': '1pe',
    '2pe': '2pe', '2 pet': '2pe', '2 peter': '2pe',
    '1jo': '1jo', '1 john': '1jo',
    '2jo': '2jo', '2 john': '2jo',
    '3jo': '3jo', '3 john': '3jo',
    jde: 'jde', jude: 'jde',
    rev: 'rev', revelation: 'rev',
};

function parseVerseReference(query: string) {
    if (!query) return null;
    const clean = query.trim().replace(/\./g, '');
    const match = clean.match(/^([1-3]?\s*[A-Za-z\s]+)\s+([0-9]+)(?:[:\s]+([0-9]+))?$/);
    if (!match) return null;
    const rawBook = match[1].toLowerCase().replace(/\s+/g, ' ').trim();
    const chapter = parseInt(match[2], 10);
    const verse = match[3] ? parseInt(match[3], 10) : null;
    const code = BIBLE_ALIASES[rawBook];
    if (!code) return null;
    return { code, chapter, verse };
}

export type Verse = {
    verseNumber: number;
    text: string;
    footnote?: string;
};

export type Chapter = {
    chapterNumber: number;
    verseCount: number;
    subheading?: string;
    verses: Verse[];
};

export type BibleBookDetail = {
    bookCode: string;
    bookName: string;
    testament: 'Old Testament' | 'New Testament';
    category: string;
    order: number;
    chapterCount: number;
    verseCount: number;
    chapters: Chapter[];
};

export type HebrewBookData = {
    id: string;
    name: string;
    hebrewTitle: string;
    category: string;
    chapterCount: number;
    chapters: Array<{
        chapterNumber: number;
        verseCount: number;
        verses: Array<{ verseNumber: number; hebrew: string; english: string }>;
    }>;
};

/* ---------------- Subheading Map for ESV Chapter Section Titles ---------------- */

const SECTION_TITLES: Record<string, Record<number, string>> = {
    GEN: {
        1: 'The Creation of the World',
        2: 'The Seventh Day, God Rests',
        3: 'The Fall',
        4: 'Cain and Abel',
        6: 'Noah and the Flood',
        11: 'The Tower of Babel',
        12: 'The Call of Abram',
        22: 'The Sacrifice of Isaac',
        37: 'Joseph and His Brothers',
    },
    EXO: {
        1: 'Israel’s Suffering in Egypt',
        3: 'The Burning Bush',
        14: 'Crossing the Red Sea',
        20: 'The Ten Commandments',
    },
    MAT: {
        1: 'The Genealogy of Jesus Christ',
        2: 'The Visit of the Wise Men',
        3: 'The Baptism of Jesus',
        5: 'The Sermon on the Mount',
        6: 'The Lord’s Prayer',
        28: 'The Great Commission',
    },
    JOH: {
        1: 'The Word Became Flesh',
        3: 'Jesus and Nicodemus',
        14: 'I Am the Way, the Truth, and the Life',
    },
    REV: {
        1: 'The Revelation of Jesus Christ',
        21: 'The New Heaven and the New Earth',
        22: 'The River of Life',
    },
};

/* ---------------- Book Illustration Art Map ---------------- */

const BOOK_ILLUSTRATIONS: Record<string, { src: string; alt: string }> = {
    gen: { src: '/images/bible/gen.jpg', alt: 'Genesis Illustration - Garden of Eden' },
    exo: { src: '/images/bible/exo.jpg', alt: 'Exodus Illustration - Parting of the Red Sea' },
    lev: { src: '/images/bible/lev.jpg', alt: 'Leviticus Illustration - High Priest in the Holy of Holies' },
    num: { src: '/images/bible/num.jpg', alt: 'Numbers Illustration - The Twelve Spies with Grapes of Eshcol' },
    deu: { src: '/images/bible/deu.jpg', alt: 'Deuteronomy Illustration - Moses on Mount Nebo Overlooking the Promised Land' },
};

/* ---------------- All Books metadata for Bible Navigation Menu ---------------- */

const ALL_OT_BOOKS = [
    { code: 'gen', name: 'Genesis', chapters: 50 },
    { code: 'exo', name: 'Exodus', chapters: 40 },
    { code: 'lev', name: 'Leviticus', chapters: 27 },
    { code: 'num', name: 'Numbers', chapters: 36 },
    { code: 'deu', name: 'Deuteronomy', chapters: 34 },
    { code: 'jos', name: 'Joshua', chapters: 24 },
    { code: 'jdg', name: 'Judges', chapters: 21 },
    { code: 'rut', name: 'Ruth', chapters: 4 },
    { code: '1sa', name: '1 Samuel', chapters: 31 },
    { code: '2sa', name: '2 Samuel', chapters: 24 },
    { code: '1ki', name: '1 Kings', chapters: 22 },
    { code: '2ki', name: '2 Kings', chapters: 25 },
    { code: '1ch', name: '1 Chronicles', chapters: 29 },
    { code: '2ch', name: '2 Chronicles', chapters: 36 },
    { code: 'ezr', name: 'Ezra', chapters: 10 },
    { code: 'neh', name: 'Nehemiah', chapters: 13 },
    { code: 'est', name: 'Esther', chapters: 10 },
    { code: 'job', name: 'Job', chapters: 42 },
    { code: 'psa', name: 'Psalms', chapters: 150 },
    { code: 'pro', name: 'Proverbs', chapters: 31 },
    { code: 'ecc', name: 'Ecclesiastes', chapters: 12 },
    { code: 'sol', name: 'Song of Solomon', chapters: 8 },
    { code: 'isa', name: 'Isaiah', chapters: 66 },
    { code: 'jer', name: 'Jeremiah', chapters: 52 },
    { code: 'lam', name: 'Lamentations', chapters: 5 },
    { code: 'eze', name: 'Ezekiel', chapters: 48 },
    { code: 'dan', name: 'Daniel', chapters: 12 },
    { code: 'hos', name: 'Hosea', chapters: 14 },
    { code: 'joe', name: 'Joel', chapters: 3 },
    { code: 'amo', name: 'Amos', chapters: 9 },
    { code: 'oba', name: 'Obadiah', chapters: 1 },
    { code: 'jon', name: 'Jonah', chapters: 4 },
    { code: 'mic', name: 'Micah', chapters: 7 },
    { code: 'nah', name: 'Nahum', chapters: 3 },
    { code: 'hab', name: 'Habakkuk', chapters: 3 },
    { code: 'zep', name: 'Zephaniah', chapters: 3 },
    { code: 'hag', name: 'Haggai', chapters: 2 },
    { code: 'zec', name: 'Zechariah', chapters: 14 },
    { code: 'mal', name: 'Malachi', chapters: 4 },
];

const ALL_NT_BOOKS = [
    { code: 'mat', name: 'Matthew', chapters: 28 },
    { code: 'mar', name: 'Mark', chapters: 16 },
    { code: 'luk', name: 'Luke', chapters: 24 },
    { code: 'joh', name: 'John', chapters: 21 },
    { code: 'act', name: 'Acts', chapters: 28 },
    { code: 'rom', name: 'Romans', chapters: 16 },
    { code: '1co', name: '1 Corinthians', chapters: 16 },
    { code: '2co', name: '2 Corinthians', chapters: 13 },
    { code: 'gal', name: 'Galatians', chapters: 6 },
    { code: 'eph', name: 'Ephesians', chapters: 6 },
    { code: 'phi', name: 'Philippians', chapters: 4 },
    { code: 'col', name: 'Colossians', chapters: 4 },
    { code: '1th', name: '1 Thessalonians', chapters: 5 },
    { code: '2th', name: '2 Thessalonians', chapters: 3 },
    { code: '1ti', name: '1 Timothy', chapters: 6 },
    { code: '2ti', name: '2 Timothy', chapters: 4 },
    { code: 'tit', name: 'Titus', chapters: 3 },
    { code: 'phm', name: 'Philemon', chapters: 1 },
    { code: 'heb', name: 'Hebrews', chapters: 13 },
    { code: 'jam', name: 'James', chapters: 5 },
    { code: '1pe', name: '1 Peter', chapters: 5 },
    { code: '2pe', name: '2 Peter', chapters: 3 },
    { code: '1jo', name: '1 John', chapters: 5 },
    { code: '2jo', name: '2 John', chapters: 1 },
    { code: '3jo', name: '3 John', chapters: 1 },
    { code: 'jde', name: 'Jude', chapters: 1 },
    { code: 'rev', name: 'Revelation', chapters: 22 },
];

/* ---------------- Helper: Render Verse Text with Red Letters for Words of Jesus ---------------- */

function renderVerseText(text: string) {
    if (!text.includes('<red>')) {
        return <span>{text}</span>;
    }

    const parts = text.split(/(<red>.*?<\/red>)/g);
    return (
        <span>
            {parts.map((part, index) => {
                if (part.startsWith('<red>') && part.endsWith('</red>')) {
                    const cleanText = part.slice(5, -6);
                    return (
                        <span key={index} className="font-medium text-[#e0483e] dark:text-[#ff6b5f]">
                            {cleanText}
                        </span>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </span>
    );
}

/* ---------------- Small decorative chapter-opener ornament ---------------- */

function ChapterOrnament() {
    return (
        <div aria-hidden className="mx-auto flex w-full max-w-[220px] items-center gap-3 text-ed-rule-strong">
            <span className="h-px flex-1 bg-current opacity-60" />
            <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 text-ed-accent">
                <path d="M6 0L7.4 4.6L12 6L7.4 7.4L6 12L4.6 7.4L0 6L4.6 4.6Z" fill="currentColor" />
            </svg>
            <span className="h-px flex-1 bg-current opacity-60" />
        </div>
    );
}

export default function BibleBookClient({
    book,
    hebrewData,
}: {
    book: BibleBookDetail;
    hebrewData?: HebrewBookData | null;
}) {
    const router = useRouter();
    const [selectedChapterNum, setSelectedChapterNum] = useState<number>(1);
    const [navOpen, setNavOpen] = useState(false);
    const [showHebrew, setShowHebrew] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [sidebarFilter, setSidebarFilter] = useState('');
    const [jumpInput, setJumpInput] = useState('');
    const [selectedTestament, setSelectedTestament] = useState<'old' | 'new'>(
        book.testament === 'Old Testament' ? 'old' : 'new'
    );
    const [expandedBookCode, setExpandedBookCode] = useState<string | null>(book.bookCode.toLowerCase());

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const chParam = params.get('ch');
        if (chParam) {
            const num = parseInt(chParam, 10);
            if (num >= 1 && num <= book.chapterCount) {
                requestAnimationFrame(() => setSelectedChapterNum(num));
            }
        }
        const hash = window.location.hash;
        if (hash && hash.startsWith('#v')) {
            setTimeout(() => {
                const el = document.getElementById(hash.slice(1));
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }
    }, [book.chapterCount]);

    // Lock body scroll while the mobile nav drawer is open
    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.style.overflow = navOpen ? 'hidden' : '';
        return () => {
            document.body.style.overflow = '';
        };
    }, [navOpen]);

    const handleVerseSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sidebarFilter.trim()) return;

        const parsed = parseVerseReference(sidebarFilter);
        if (!parsed) return;

        if (parsed.code === book.bookCode.toLowerCase()) {
            if (parsed.chapter >= 1 && parsed.chapter <= book.chapterCount) {
                setSelectedChapterNum(parsed.chapter);
                if (parsed.verse) {
                    setTimeout(() => {
                        const el = document.getElementById(`v${parsed.verse}`) || document.getElementById(`verse-${parsed.verse}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 200);
                } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }
        } else {
            const hash = parsed.verse ? `#v${parsed.verse}` : '';
            router.push(`/quran/bible/${parsed.code}?ch=${parsed.chapter}${hash}`);
        }
    };

    const hebrewVerseMap = useMemo(() => {
        if (!hebrewData) return {};
        const ch = hebrewData.chapters.find((c) => c.chapterNumber === selectedChapterNum);
        if (!ch) return {};
        const map: Record<number, string> = {};
        for (const v of ch.verses) {
            map[v.verseNumber] = v.hebrew;
        }
        return map;
    }, [hebrewData, selectedChapterNum]);

    // Current Chapter
    const currentChapter = useMemo(() => {
        return book.chapters.find((ch) => ch.chapterNumber === selectedChapterNum) || book.chapters[0];
    }, [book.chapters, selectedChapterNum]);

    // Section title
    const sectionTitle = useMemo(() => {
        return SECTION_TITLES[book.bookCode]?.[selectedChapterNum] || currentChapter?.subheading || null;
    }, [book.bookCode, selectedChapterNum, currentChapter]);

    // All Books & Prev/Next Chapter Navigation targets
    const ALL_BIBLE_BOOKS = useMemo(() => [...ALL_OT_BOOKS, ...ALL_NT_BOOKS], []);
    const currentBookIdx = useMemo(
        () => ALL_BIBLE_BOOKS.findIndex((b) => b.code === book.bookCode.toLowerCase()),
        [ALL_BIBLE_BOOKS, book.bookCode]
    );

    const prevTarget = useMemo(() => {
        if (selectedChapterNum > 1) {
            return {
                bookCode: book.bookCode.toLowerCase(),
                chapter: selectedChapterNum - 1,
                label: `${book.bookName} ${selectedChapterNum - 1}`,
            };
        }
        if (currentBookIdx > 0) {
            const prevBook = ALL_BIBLE_BOOKS[currentBookIdx - 1];
            return {
                bookCode: prevBook.code,
                chapter: prevBook.chapters,
                label: `${prevBook.name} ${prevBook.chapters}`,
            };
        }
        return null; // Genesis 1 has no previous chapter
    }, [selectedChapterNum, currentBookIdx, book.bookCode, book.bookName, ALL_BIBLE_BOOKS]);

    const nextTarget = useMemo(() => {
        if (selectedChapterNum < book.chapterCount) {
            return {
                bookCode: book.bookCode.toLowerCase(),
                chapter: selectedChapterNum + 1,
                label: `${book.bookName} ${selectedChapterNum + 1}`,
            };
        }
        if (currentBookIdx < ALL_BIBLE_BOOKS.length - 1) {
            const nextBook = ALL_BIBLE_BOOKS[currentBookIdx + 1];
            return {
                bookCode: nextBook.code,
                chapter: 1,
                label: `${nextBook.name} 1`,
            };
        }
        return null;
    }, [selectedChapterNum, book.chapterCount, currentBookIdx, book.bookCode, book.bookName, ALL_BIBLE_BOOKS]);

    /* ---------------- Shared: Book & Chapter list (reused in drawer + sidebar) ---------------- */

    const bookList = (selectedTestament === 'old' ? ALL_OT_BOOKS : ALL_NT_BOOKS).filter((b) =>
        b.name.toLowerCase().includes(sidebarFilter.toLowerCase())
    );

    const renderHebrewToggle = (compact = false) =>
        hebrewData ? (
            <button
                type="button"
                onClick={() => setShowHebrew(!showHebrew)}
                className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full border px-3 font-mono text-[0.7rem] font-bold tracking-wide transition-all ${
                    showHebrew
                        ? 'border-ed-accent bg-ed-accent text-ed-bg'
                        : 'border-ed-rule bg-ed-surface text-ed-fg-muted hover:text-ed-fg'
                } ${compact ? 'px-2.5' : ''}`}
                title="Toggle vocalized Hebrew text"
            >
                עב {showHebrew ? 'ON' : 'OFF'}
            </button>
        ) : null;

    const renderTestamentSwitcher = () => (
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-ed-rule bg-ed-surface p-1 text-xs font-semibold">
            <button
                type="button"
                onClick={() => setSelectedTestament('old')}
                className={`rounded-md py-2 transition-colors ${
                    selectedTestament === 'old' ? 'bg-ed-accent text-ed-bg' : 'text-ed-fg-muted hover:text-ed-fg'
                }`}
            >
                Old Testament
            </button>
            <button
                type="button"
                onClick={() => setSelectedTestament('new')}
                className={`rounded-md py-2 transition-colors ${
                    selectedTestament === 'new' ? 'bg-ed-accent text-ed-bg' : 'text-ed-fg-muted hover:text-ed-fg'
                }`}
            >
                New Testament
            </button>
        </div>
    );

    const renderBookAccordion = (closeOnNavigate: boolean) => (
        <div>
            {bookList.map((b) => {
                const isExpanded = expandedBookCode === b.code;
                const isCurrentBook = b.code === book.bookCode.toLowerCase();

                return (
                    <div key={b.code} className="mb-0.5">
                        <button
                            type="button"
                            onClick={() => setExpandedBookCode(isExpanded ? null : b.code)}
                            className={`flex min-h-[44px] w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                isCurrentBook
                                    ? 'bg-ed-surface-strong font-semibold text-ed-accent'
                                    : 'text-ed-fg hover:bg-ed-surface/70'
                            }`}
                        >
                            <span className="truncate">{b.name}</span>
                            <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] font-normal text-ed-fg-muted">
                                {b.chapters}
                                <ChevronDown
                                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                />
                            </span>
                        </button>

                        {isExpanded && (
                            <div className="grid grid-cols-6 gap-1.5 py-2 pl-2 pr-1 sm:grid-cols-7">
                                {Array.from({ length: b.chapters }, (_, i) => i + 1).map((chNum) => {
                                    const isSelectedCh = isCurrentBook && chNum === selectedChapterNum;
                                    return (
                                        <Link
                                            key={chNum}
                                            href={`/quran/bible/${b.code}`}
                                            onClick={() => {
                                                if (isCurrentBook) setSelectedChapterNum(chNum);
                                                if (closeOnNavigate) setNavOpen(false);
                                            }}
                                            className={`flex h-11 min-w-[44px] items-center justify-center rounded-lg font-mono text-xs font-medium transition-colors ${
                                                isSelectedCh
                                                    ? 'bg-ed-accent text-ed-bg shadow-sm'
                                                    : 'bg-ed-surface text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-fg'
                                            }`}
                                        >
                                            {chNum}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="min-h-screen bg-ed-bg font-sans text-ed-fg antialiased selection:bg-ed-accent/30">
            {/* ----------------- Sticky glass header ----------------- */}
            <div className="sticky top-[80px] z-20 border-b border-ed-rule bg-ed-bg/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        onClick={() => setNavOpen(true)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ed-fg-muted transition-colors hover:bg-ed-surface hover:text-ed-fg lg:hidden"
                        aria-label="Open book navigator"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <button
                        type="button"
                        onClick={() => setNavOpen(true)}
                        className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-2 font-slab text-base font-semibold text-ed-fg transition-colors hover:bg-ed-surface lg:hidden"
                    >
                        <span className="truncate">{book.bookName} {currentChapter?.chapterNumber}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 text-ed-fg-muted" />
                    </button>

                    <div className="hidden min-w-0 items-baseline gap-2 font-slab lg:flex">
                        <span className="truncate text-lg font-semibold text-ed-fg">{book.bookName}</span>
                        <span className="font-mono text-sm text-ed-fg-muted">chapter {currentChapter?.chapterNumber}</span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {renderHebrewToggle()}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((open) => !open)}
                            className="hidden h-11 w-11 items-center justify-center rounded-full border border-ed-rule bg-ed-surface text-ed-fg-muted transition-colors hover:border-ed-accent/40 hover:text-ed-accent lg:inline-flex"
                            title={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
                            aria-label={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
                        >
                            {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                        </button>
                        <div className="h-11 w-11 shrink-0 lg:hidden" />
                    </div>
                </div>
            </div>

            {/* ----------------- Mobile / tablet off-canvas drawer ----------------- */}
            {navOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        aria-label="Close navigator"
                        onClick={() => setNavOpen(false)}
                        className="absolute inset-0 bg-ed-bg/70 backdrop-blur-sm animate-fade-in"
                    />
                    <div className="absolute inset-y-0 right-0 flex w-[88vw] max-w-[400px] animate-slide-in-right flex-col border-l border-ed-rule bg-ed-bg shadow-2xl">
                        <div className="flex items-center justify-between border-b border-ed-rule px-5 py-4">
                            <span className="font-slab text-base font-semibold text-ed-fg">Book Navigator</span>
                            <button
                                type="button"
                                onClick={() => setNavOpen(false)}
                                className="flex h-11 w-11 items-center justify-center rounded-full text-ed-fg-muted transition-colors hover:bg-ed-surface hover:text-ed-fg"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-5 py-5">
                            <form onSubmit={(e) => { handleVerseSearchSubmit(e); setNavOpen(false); }} className="relative mb-4">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                                <input
                                    type="text"
                                    value={sidebarFilter}
                                    onChange={(e) => setSidebarFilter(e.target.value)}
                                    placeholder="Search verse or book (e.g. Gen 2:3)…"
                                    className="w-full rounded-lg border border-ed-rule bg-ed-surface py-3 pl-10 pr-3 text-sm text-ed-fg placeholder:text-ed-fg-muted/60 focus:border-ed-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/40"
                                />
                            </form>

                            <div className="mb-4">
                                {renderTestamentSwitcher()}
                            </div>

                            {renderBookAccordion(true)}
                        </div>
                    </div>
                </div>
            )}

            {/* ----------------- Main column (reflows into the space the fixed sidebar frees up) ----------------- */}
            <div
                className={`transition-[padding] duration-300 ease-in-out ${
                    sidebarOpen ? 'lg:pr-[380px]' : 'lg:pr-0'
                }`}
            >
                <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
                    <main className="mx-auto w-full max-w-[720px] py-8 sm:py-12">
                        <article className="space-y-8">
                            {/* Top Book Illustration */}
                            <div className="flex justify-center">
                                {BOOK_ILLUSTRATIONS[book.bookCode.toLowerCase()] ? (
                                    <div className="group relative w-full overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface shadow-xl">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={BOOK_ILLUSTRATIONS[book.bookCode.toLowerCase()].src}
                                            alt={BOOK_ILLUSTRATIONS[book.bookCode.toLowerCase()].alt}
                                            className="h-auto w-full animate-ken-burns object-cover opacity-90 transition-opacity duration-700"
                                        />
                                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                            <div className="absolute -left-[50%] -top-[50%] h-[200%] w-[200%] animate-ray-sweep bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        </div>
                                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ed-bg via-transparent to-ed-bg/50" />
                                        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-ed-rule/60" />

                                        <style dangerouslySetInnerHTML={{__html: `
                                            @keyframes kenburns {
                                                0% { transform: scale(1) translate(0%, 0%); }
                                                50% { transform: scale(1.07) translate(-1.2%, -1%); }
                                                100% { transform: scale(1) translate(0%, 0%); }
                                            }
                                            @keyframes raySweep {
                                                0% { transform: translateX(-120%) rotate(25deg); opacity: 0; }
                                                25% { opacity: 0.35; }
                                                75% { opacity: 0.35; }
                                                100% { transform: translateX(120%) rotate(25deg); opacity: 0; }
                                            }
                                            .animate-ken-burns { animation: kenburns 22s ease-in-out infinite alternate; }
                                            .animate-ray-sweep { animation: raySweep 9s ease-in-out infinite; }
                                        `}} />
                                    </div>
                                ) : (
                                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-ed-rule bg-ed-surface text-ed-fg-muted shadow-sm">
                                        <BookOpen className="h-10 w-10" strokeWidth={1.2} />
                                    </div>
                                )}
                            </div>

                            {/* Title block */}
                            <div key={`title-${selectedChapterNum}`} className="animate-fade-in-up">
                                <h2 className="text-center font-slab text-3xl font-semibold uppercase tracking-[0.18em] text-ed-fg sm:text-4xl">
                                    {book.bookName}
                                </h2>

                                <div className="mt-5">
                                    <ChapterOrnament />
                                </div>

                                {sectionTitle && (
                                    <h3 className="mt-5 text-center font-serif text-lg italic tracking-wide text-ed-fg-muted sm:text-xl">
                                        {sectionTitle}
                                    </h3>
                                )}
                            </div>

                            {/* ESV Text Body */}
                            {showHebrew ? (
                                <div key={`hebrew-${selectedChapterNum}`} className="animate-fade-in-up">
                                    {currentChapter?.verses.map((v, index) => {
                                        const isLastVerse = index === currentChapter.verses.length - 1;
                                        return (
                                            <div
                                                key={v.verseNumber}
                                                id={`v${v.verseNumber}`}
                                                className={`group flex scroll-mt-28 items-start gap-4 rounded-xl px-3 py-8 transition-colors hover:bg-ed-surface/60 sm:gap-8 sm:px-4 sm:py-10 ${
                                                    isLastVerse ? '' : 'border-b border-ed-rule'
                                                }`}
                                            >
                                                <div className="relative mt-1 flex h-11 w-11 shrink-0 items-center justify-center sm:h-12 sm:w-12">
                                                    <svg
                                                        className="absolute inset-0 h-full w-full text-ed-rule-strong transition-colors group-hover:text-ed-accent/50"
                                                        viewBox="0 0 54 54"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                        <path
                                                            d="M27 1L33 8.5L42 7.5L45 16L53 20L49 27L53 34L45 38L42 46.5L33 45.5L27 53L21 45.5L12 46.5L9 38L1 34L5 27L1 20L9 16L12 7.5L21 8.5L27 1Z"
                                                            stroke="currentColor"
                                                            strokeWidth="1.5"
                                                            strokeLinejoin="round"
                                                        />
                                                        <circle cx="27" cy="27" r="18" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
                                                    </svg>
                                                    <span className="relative z-10 font-mono text-[0.7rem] font-medium tracking-tight text-ed-fg-muted">
                                                        {currentChapter.chapterNumber}:{v.verseNumber}
                                                    </span>
                                                </div>

                                                <div className="flex flex-1 flex-col space-y-5">
                                                    {hebrewVerseMap[v.verseNumber] && (
                                                        <p
                                                            dir="rtl"
                                                            lang="he"
                                                            className="text-right font-serif text-[1.7rem] leading-[2.2] tracking-wide text-ed-fg antialiased sm:text-[2rem]"
                                                        >
                                                            {hebrewVerseMap[v.verseNumber]}
                                                        </p>
                                                    )}

                                                    <p className="max-w-[75ch] text-left font-serif text-[1.1rem] leading-8 text-ed-fg">
                                                        {renderVerseText(v.text)}
                                                    </p>

                                                    {v.footnote && (
                                                        <div className="flex justify-start pt-2">
                                                            <aside className="w-full max-w-[75ch] rounded-lg border-l-2 border-ed-accent bg-ed-surface p-4 text-left">
                                                                <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-ed-accent">
                                                                    Footnote {currentChapter.chapterNumber}:{v.verseNumber}
                                                                </p>
                                                                <p className="text-sm leading-6 text-ed-fg-muted">{v.footnote}</p>
                                                            </aside>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div
                                    key={`classic-${selectedChapterNum}`}
                                    className="animate-fade-in-up space-y-1 font-serif text-[1.125rem] leading-[1.9] text-ed-fg"
                                >
                                    {currentChapter?.verses.map((v) => {
                                        const isFirstVerse = v.verseNumber === 1;

                                        return (
                                            <div
                                                key={v.verseNumber}
                                                id={`v${v.verseNumber}`}
                                                className="scroll-mt-28 rounded-lg px-3 py-1.5 transition-colors hover:bg-ed-surface/60 sm:px-4"
                                            >
                                                <p className="text-left leading-[1.9]">
                                                    {isFirstVerse ? (
                                                        <b className="float-left mr-3 mt-1 select-none font-slab text-6xl font-bold leading-[0.85] text-ed-accent">
                                                            {currentChapter.chapterNumber}
                                                        </b>
                                                    ) : (
                                                        <>
                                                            <sup className="mr-[0.4em] select-none align-super font-mono text-[0.7rem] font-bold tracking-wide text-ed-fg-muted/70">
                                                                {currentChapter.chapterNumber}:{v.verseNumber}
                                                                {v.footnote && <span className="ml-0.5 text-ed-accent">*</span>}
                                                            </sup>
                                                            {'\u2004'}
                                                        </>
                                                    )}
                                                    {renderVerseText(v.text)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Bottom Footnotes Section for English Mode */}
                            {!showHebrew && currentChapter?.verses.some((v) => v.footnote) && (
                                <div className="mt-16 border-t border-ed-rule pt-8">
                                    <h4 className="mb-6 font-mono text-xs font-semibold uppercase tracking-wider text-ed-accent sm:mb-7">
                                        Footnotes
                                    </h4>
                                    <div className="space-y-3">
                                        {currentChapter?.verses.filter((v) => v.footnote).map((v) => (
                                            <div
                                                key={v.verseNumber}
                                                className="flex items-start gap-3 rounded-lg border border-ed-rule bg-ed-surface/60 p-4 text-xs"
                                            >
                                                <span className="mt-0.5 shrink-0 font-mono text-[0.75rem] font-bold text-ed-accent">
                                                    {currentChapter.chapterNumber}:{v.verseNumber}
                                                </span>
                                                <p className="leading-relaxed text-ed-fg-muted">{v.footnote}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Bottom Chapter Forward / Back Navigation Bar */}
                            <div className="mt-16 flex items-center justify-between gap-4 border-t border-ed-rule pt-8 text-xs sm:text-sm">
                                {prevTarget ? (
                                    prevTarget.bookCode === book.bookCode.toLowerCase() ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedChapterNum(prevTarget.chapter);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="group inline-flex h-11 items-center gap-2 rounded-full border border-ed-rule bg-ed-surface px-4 font-semibold text-ed-fg shadow-sm transition-colors hover:border-ed-accent/40 hover:text-ed-accent"
                                        >
                                            <ChevronLeft className="h-4 w-4 text-ed-fg-muted transition-colors group-hover:text-ed-accent" />
                                            <span>{prevTarget.label}</span>
                                        </button>
                                    ) : (
                                        <Link
                                            href={`/quran/bible/${prevTarget.bookCode}`}
                                            className="group inline-flex h-11 items-center gap-2 rounded-full border border-ed-rule bg-ed-surface px-4 font-semibold text-ed-fg shadow-sm transition-colors hover:border-ed-accent/40 hover:text-ed-accent"
                                        >
                                            <ChevronLeft className="h-4 w-4 text-ed-fg-muted transition-colors group-hover:text-ed-accent" />
                                            <span>{prevTarget.label}</span>
                                        </Link>
                                    )
                                ) : (
                                    <div />
                                )}

                                {nextTarget && (
                                    nextTarget.bookCode === book.bookCode.toLowerCase() ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedChapterNum(nextTarget.chapter);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="group ml-auto inline-flex h-11 items-center gap-2 rounded-full border border-ed-rule bg-ed-surface px-4 font-semibold text-ed-fg shadow-sm transition-colors hover:border-ed-accent/40 hover:text-ed-accent"
                                        >
                                            <span>{nextTarget.label}</span>
                                            <ChevronRight className="h-4 w-4 text-ed-fg-muted transition-colors group-hover:text-ed-accent" />
                                        </button>
                                    ) : (
                                        <Link
                                            href={`/quran/bible/${nextTarget.bookCode}`}
                                            className="group ml-auto inline-flex h-11 items-center gap-2 rounded-full border border-ed-rule bg-ed-surface px-4 font-semibold text-ed-fg shadow-sm transition-colors hover:border-ed-accent/40 hover:text-ed-accent"
                                        >
                                            <span>{nextTarget.label}</span>
                                            <ChevronRight className="h-4 w-4 text-ed-fg-muted transition-colors group-hover:text-ed-accent" />
                                        </Link>
                                    )
                                )}
                            </div>
                        </article>
                    </main>
                </div>
            </div>

            {/* ----------------- Persistent desktop sidebar — fixed to the right edge, like the Quran navigator ----------------- */}
            <aside
                className={`fixed right-0 top-[80px] z-20 hidden h-[calc(100vh-80px)] w-[380px] flex-col border-l border-ed-rule bg-ed-bg/95 backdrop-blur-md transition-transform duration-300 ease-in-out lg:flex ${
                    sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="space-y-4 border-b border-ed-rule p-5">
                    <div>
                        <h3 className="font-slab text-sm font-semibold text-ed-fg">Book Navigator</h3>
                        <p className="mt-1 text-xs text-ed-fg-muted">Jump to a book or chapter</p>
                    </div>

                    <form onSubmit={handleVerseSearchSubmit} className="relative">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ed-fg-muted" />
                        <input
                            type="text"
                            value={sidebarFilter}
                            onChange={(e) => setSidebarFilter(e.target.value)}
                            placeholder="Search verse (e.g. Gen 2:3)…"
                            className="w-full rounded-lg border border-ed-rule bg-ed-surface py-2.5 pl-10 pr-3 text-sm text-ed-fg placeholder:text-ed-fg-muted/60 focus:border-ed-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent/40"
                        />
                    </form>

                    {renderTestamentSwitcher()}

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const num = parseInt(jumpInput, 10);
                            if (num >= 1 && num <= book.chapterCount) {
                                setSelectedChapterNum(num);
                                setJumpInput('');
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        className="flex gap-2"
                    >
                        <input
                            type="number"
                            min="1"
                            max={book.chapterCount}
                            value={jumpInput}
                            onChange={(e) => setJumpInput(e.target.value)}
                            placeholder="Chapter number"
                            className="h-11 flex-1 rounded-lg border border-ed-rule bg-ed-surface px-3 text-sm text-ed-fg placeholder:text-ed-fg-muted/60 focus:border-ed-accent focus:outline-none"
                        />
                        <button
                            type="submit"
                            className="h-11 rounded-lg bg-ed-accent px-4 text-sm font-semibold text-ed-bg transition-opacity hover:opacity-90"
                        >
                            Go
                        </button>
                    </form>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    {renderBookAccordion(false)}
                </div>
            </aside>

            {/* Persistent edge tab — always mounted, slides with the sidebar, so it can never get "lost" */}
            <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                className={`fixed top-1/2 z-30 hidden h-16 w-7 -translate-y-1/2 items-center justify-center rounded-l-lg border border-r-0 border-ed-rule bg-ed-surface text-ed-fg-muted shadow-lg transition-[right] duration-300 ease-in-out hover:text-ed-accent lg:flex ${
                    sidebarOpen ? 'right-[380px]' : 'right-3'
                }`}
                title={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
                aria-label={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
            >
                {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {/* Floating action button to open the book navigator drawer on mobile / tablet */}
            <button
                type="button"
                onClick={() => setNavOpen(true)}
                className="fixed bottom-6 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-ed-accent text-ed-bg shadow-2xl transition-transform hover:scale-105 lg:hidden"
                title="Open book navigator"
                aria-label="Open book navigator"
            >
                <Menu className="h-5 w-5" />
            </button>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fadeIn 0.2s ease-out; }
                .animate-slide-in-right { animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-fade-in-up { animation: fadeInUp 0.35s ease-out; }
                @media (prefers-reduced-motion: reduce) {
                    .animate-fade-in, .animate-slide-in-right, .animate-fade-in-up, .animate-ken-burns, .animate-ray-sweep {
                        animation: none !important;
                    }
                }
            `}} />
        </div>
    );
}
