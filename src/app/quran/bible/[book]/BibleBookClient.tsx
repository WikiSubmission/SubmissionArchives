'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '@/components/ui/Toast';
import {
  BookOpen,
  CaretDown,
  CaretLeft,
  CaretRight,
  List,
  SidebarSimple,
  MagnifyingGlass,
  X,
  Copy,
  ShareNetwork,
  ChatTeardropText,
  Check,
  TextT,
  Columns,
  Translate,
} from '@phosphor-icons/react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

type ViewMode = 'reading' | 'parallel' | 'hebrew' | 'greek';

type Props = {
  book: BibleBookDetail;
  hebrewData?: HebrewBookData | null;
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BIBLE_ALIASES: Record<string, string> = {
  gen: 'gen', genesis: 'gen', exo: 'exo', exodus: 'exo', lev: 'lev', leviticus: 'lev',
  num: 'num', numbers: 'num', deu: 'deu', deut: 'deu', deuteronomy: 'deu',
  jos: 'jos', joshua: 'jos', jdg: 'jdg', judg: 'jdg', judges: 'jdg',
  '1sa': '1sa', '1 sam': '1sa', '1 samuel': '1sa', '1st samuel': '1sa',
  '2sa': '2sa', '2 sam': '2sa', '2 samuel': '2sa', '2nd samuel': '2sa',
  '1ki': '1ki', '1 kings': '1ki', '1st kings': '1ki',
  '2ki': '2ki', '2 kings': '2ki', '2nd kings': '2ki',
  isa: 'isa', isaiah: 'isa', jer: 'jer', jeremiah: 'jer',
  ezk: 'ezk', ezek: 'ezk', ezekiel: 'ezk', hos: 'hos', hosea: 'hos',
  joe: 'joe', joel: 'joe', amo: 'amo', amos: 'amo', oba: 'oba', obadiah: 'oba',
  jon: 'jon', jonah: 'jon', mic: 'mic', micah: 'mic', nam: 'nam', nahum: 'nam',
  hab: 'hab', habakkuk: 'hab', zep: 'zep', zeph: 'zep', zephaniah: 'zep',
  hag: 'hag', haggai: 'hag', zec: 'zec', zech: 'zec', zechariah: 'zec',
  mal: 'mal', malachi: 'mal', psa: 'psa', ps: 'psa', psalm: 'psa', psalms: 'psa',
  pro: 'pro', prov: 'pro', proverbs: 'pro', job: 'job',
  sng: 'sng', song: 'sng', 'song of songs': 'sng', 'song of solomon': 'sng',
  rut: 'rut', ruth: 'rut', lam: 'lam', lamentations: 'lam',
  ecc: 'ecc', eccles: 'ecc', ecclesiastes: 'ecc', est: 'est', esther: 'est',
  dan: 'dan', daniel: 'dan', ezr: 'ezr', ezra: 'ezr', neh: 'neh', nehemiah: 'neh',
  '1ch': '1ch', '1 chron': '1ch', '1 chronicles': '1ch',
  '2ch': '2ch', '2 chron': '2ch', '2 chronicles': '2ch',
  mat: 'mat', matt: 'mat', matthew: 'mat', mar: 'mar', mark: 'mar',
  luk: 'luk', luke: 'luk', joh: 'joh', john: 'joh', act: 'act', acts: 'act',
  rom: 'rom', romans: 'rom', '1co': '1co', '1 cor': '1co', '1 corinthians': '1co',
  '2co': '2co', '2 cor': '2co', '2 corinthians': '2co', gal: 'gal', galatians: 'gal',
  eph: 'eph', ephesians: 'eph', phi: 'phi', phil: 'phi', philippians: 'phi',
  col: 'col', colossians: 'col', '1th': '1th', '1 thess': '1th', '1 thessalonians': '1th',
  '2th': '2th', '2 thess': '2th', '2 thessalonians': '2th', '1ti': '1ti', '1 tim': '1ti',
  '1 timothy': '1ti', '2ti': '2ti', '2 tim': '2ti', '2 timothy': '2ti',
  tit: 'tit', titus: 'tit', phm: 'phm', philem: 'phm', philemon: 'phm',
  heb: 'heb', hebrews: 'heb', jam: 'jam', james: 'jam',
  '1pe': '1pe', '1 pet': '1pe', '1 peter': '1pe', '2pe': '2pe', '2 pet': '2pe', '2 peter': '2pe',
  '1jo': '1jo', '1 john': '1jo', '2jo': '2jo', '2 john': '2jo',
  '3jo': '3jo', '3 john': '3jo', jde: 'jde', jude: 'jde',
  rev: 'rev', revelation: 'rev',
};

const ALL_OT_BOOKS = [
  { code: 'gen', name: 'Genesis', chapters: 50 }, { code: 'exo', name: 'Exodus', chapters: 40 },
  { code: 'lev', name: 'Leviticus', chapters: 27 }, { code: 'num', name: 'Numbers', chapters: 36 },
  { code: 'deu', name: 'Deuteronomy', chapters: 34 }, { code: 'jos', name: 'Joshua', chapters: 24 },
  { code: 'jdg', name: 'Judges', chapters: 21 }, { code: 'rut', name: 'Ruth', chapters: 4 },
  { code: '1sa', name: '1 Samuel', chapters: 31 }, { code: '2sa', name: '2 Samuel', chapters: 24 },
  { code: '1ki', name: '1 Kings', chapters: 22 }, { code: '2ki', name: '2 Kings', chapters: 25 },
  { code: '1ch', name: '1 Chronicles', chapters: 29 }, { code: '2ch', name: '2 Chronicles', chapters: 36 },
  { code: 'ezr', name: 'Ezra', chapters: 10 }, { code: 'neh', name: 'Nehemiah', chapters: 13 },
  { code: 'est', name: 'Esther', chapters: 10 }, { code: 'job', name: 'Job', chapters: 42 },
  { code: 'psa', name: 'Psalms', chapters: 150 }, { code: 'pro', name: 'Proverbs', chapters: 31 },
  { code: 'ecc', name: 'Ecclesiastes', chapters: 12 }, { code: 'sol', name: 'Song of Solomon', chapters: 8 },
  { code: 'isa', name: 'Isaiah', chapters: 66 }, { code: 'jer', name: 'Jeremiah', chapters: 52 },
  { code: 'lam', name: 'Lamentations', chapters: 5 }, { code: 'eze', name: 'Ezekiel', chapters: 48 },
  { code: 'dan', name: 'Daniel', chapters: 12 }, { code: 'hos', name: 'Hosea', chapters: 14 },
  { code: 'joe', name: 'Joel', chapters: 3 }, { code: 'amo', name: 'Amos', chapters: 9 },
  { code: 'oba', name: 'Obadiah', chapters: 1 }, { code: 'jon', name: 'Jonah', chapters: 4 },
  { code: 'mic', name: 'Micah', chapters: 7 }, { code: 'nah', name: 'Nahum', chapters: 3 },
  { code: 'hab', name: 'Habakkuk', chapters: 3 }, { code: 'zep', name: 'Zephaniah', chapters: 3 },
  { code: 'hag', name: 'Haggai', chapters: 2 }, { code: 'zec', name: 'Zechariah', chapters: 14 },
  { code: 'mal', name: 'Malachi', chapters: 4 },
];

const ALL_NT_BOOKS = [
  { code: 'mat', name: 'Matthew', chapters: 28 }, { code: 'mar', name: 'Mark', chapters: 16 },
  { code: 'luk', name: 'Luke', chapters: 24 }, { code: 'joh', name: 'John', chapters: 21 },
  { code: 'act', name: 'Acts', chapters: 28 }, { code: 'rom', name: 'Romans', chapters: 16 },
  { code: '1co', name: '1 Corinthians', chapters: 16 }, { code: '2co', name: '2 Corinthians', chapters: 13 },
  { code: 'gal', name: 'Galatians', chapters: 6 }, { code: 'eph', name: 'Ephesians', chapters: 6 },
  { code: 'phi', name: 'Philippians', chapters: 4 }, { code: 'col', name: 'Colossians', chapters: 4 },
  { code: '1th', name: '1 Thessalonians', chapters: 5 }, { code: '2th', name: '2 Thessalonians', chapters: 3 },
  { code: '1ti', name: '1 Timothy', chapters: 6 }, { code: '2ti', name: '2 Timothy', chapters: 4 },
  { code: 'tit', name: 'Titus', chapters: 3 }, { code: 'phm', name: 'Philemon', chapters: 1 },
  { code: 'heb', name: 'Hebrews', chapters: 13 }, { code: 'jam', name: 'James', chapters: 5 },
  { code: '1pe', name: '1 Peter', chapters: 5 }, { code: '2pe', name: '2 Peter', chapters: 3 },
  { code: '1jo', name: '1 John', chapters: 5 }, { code: '2jo', name: '2 John', chapters: 1 },
  { code: '3jo', name: '3 John', chapters: 1 }, { code: 'jde', name: 'Jude', chapters: 1 },
  { code: 'rev', name: 'Revelation', chapters: 22 },
];

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

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

function renderVerseText(text: string) {
  if (!text.includes('<red>')) return <span>{text}</span>;
  const parts = text.split(/(<red>.*?<\/red>)/g);
  return (
    <span>
      {parts.map((part, index) => {
        if (part.startsWith('<red>') && part.endsWith('</red>')) {
          const cleanText = part.slice(5, -6);
          return (
            <span key={index} className="font-medium text-[#ff6b5f]">
              {cleanText}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Hooks                                                              */
/* ------------------------------------------------------------------ */

function useKeyPress(targetKey: string, callback: () => void) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === targetKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [targetKey, callback]);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function BibleBookClient({ book, hebrewData }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [selectedChapterNum, setSelectedChapterNum] = useState(1);
  const [navOpen, setNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('reading');
  const [fontScale, setFontScale] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [jumpInput, setJumpInput] = useState('');
  const [selectedTestament, setSelectedTestament] = useState<'old' | 'new'>(
    book.testament === 'Old Testament' ? 'old' : 'new',
  );
  const [expandedBookCode, setExpandedBookCode] = useState<string | null>(book.bookCode.toLowerCase());
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFootnote, setShowFootnote] = useState<Record<number, boolean>>({});

  /* -- Current chapter -- */
  const currentChapter = useMemo(
    () => book.chapters.find((ch) => ch.chapterNumber === selectedChapterNum) || book.chapters[0],
    [book.chapters, selectedChapterNum],
  );

  /* -- URL params -- */
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
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [book.chapterCount]);

  /* -- Body scroll lock -- */
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  /* -- Keyboard shortcuts -- */
  useKeyPress('j', () => {
    const current = activeVerse || 1;
    const nextV = Math.min(current + 1, currentChapter?.verses.length || 1);
    setActiveVerse(nextV);
    document.getElementById(`v${nextV}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  useKeyPress('k', () => {
    const current = activeVerse || 1;
    const nextV = Math.max(current - 1, 1);
    setActiveVerse(nextV);
    document.getElementById(`v${nextV}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* -- Verse search -- */
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
            const el = document.getElementById(`v${parsed.verse}`);
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 200);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      const hash = parsed.verse ? `#v${parsed.verse}` : '';
      router.push(`/scripture/bible/${parsed.code}?ch=${parsed.chapter}${hash}`);
    }
  };

  /* -- Hebrew map -- */
  const hebrewVerseMap = useMemo(() => {
    if (!hebrewData) return {};
    const ch = hebrewData.chapters.find((c) => c.chapterNumber === selectedChapterNum);
    if (!ch) return {};
    const map: Record<number, string> = {};
    for (const v of ch.verses) map[v.verseNumber] = v.hebrew;
    return map;
  }, [hebrewData, selectedChapterNum]);

  /* -- Navigation targets -- */
  const ALL_BIBLE_BOOKS = useMemo(() => [...ALL_OT_BOOKS, ...ALL_NT_BOOKS], []);
  const currentBookIdx = useMemo(
    () => ALL_BIBLE_BOOKS.findIndex((b) => b.code === book.bookCode.toLowerCase()),
    [ALL_BIBLE_BOOKS, book.bookCode],
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
    return null;
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
      return { bookCode: nextBook.code, chapter: 1, label: `${nextBook.name} 1` };
    }
    return null;
  }, [selectedChapterNum, book.chapterCount, currentBookIdx, book.bookCode, book.bookName, ALL_BIBLE_BOOKS]);

  useKeyPress('n', () => {
    if (nextTarget) {
      if (nextTarget.bookCode === book.bookCode.toLowerCase()) {
        setSelectedChapterNum(nextTarget.chapter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push(`/scripture/bible/${nextTarget.bookCode}`);
      }
    }
  });

  useKeyPress('p', () => {
    if (prevTarget) {
      if (prevTarget.bookCode === book.bookCode.toLowerCase()) {
        setSelectedChapterNum(prevTarget.chapter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push(`/scripture/bible/${prevTarget.bookCode}`);
      }
    }
  });

  /* -- Book list -- */
  const bookList = (selectedTestament === 'old' ? ALL_OT_BOOKS : ALL_NT_BOOKS).filter((b) =>
    b.name.toLowerCase().includes(sidebarFilter.toLowerCase()),
  );

  const isOT = book.testament === 'Old Testament';
  const canParallel = isOT && hebrewData;

  /* -- Copy handler -- */
  const handleCopy = useCallback(
    (verse: Verse) => {
      const text = `${book.bookName} ${selectedChapterNum}:${verse.verseNumber}\n\n${verse.text}`;
      navigator.clipboard?.writeText(text);
      setCopiedId(`${selectedChapterNum}-${verse.verseNumber}`);
      toast.success(`Copied ${book.bookName} ${selectedChapterNum}:${verse.verseNumber}`);
      setTimeout(() => setCopiedId(null), 2000);
    },
    [book.bookName, selectedChapterNum, toast],
  );

  const handleShare = useCallback(
    (verseNum: number) => {
      const url = `${window.location.origin}/scripture/bible/${book.bookCode.toLowerCase()}?ch=${selectedChapterNum}#v${verseNum}`;
      navigator.clipboard?.writeText(url);
      toast.success(`Link to ${book.bookName} ${selectedChapterNum}:${verseNum} copied`);
    },
    [book.bookCode, book.bookName, selectedChapterNum, toast],
  );

  return (
    <div className="relative min-h-screen bg-[#0F0E0D] text-[#F5F0EB] font-sans antialiased selection:bg-[#C8794A]/25 selection:text-[#F5F0EB]">
      {/* Ambient page glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 85% 10%, rgba(200,121,74,0.025) 0%, transparent 70%), ' +
            'radial-gradient(ellipse 400px 300px at 15% 90%, rgba(200,121,74,0.015) 0%, transparent 70%)',
        }}
      />

      {/* ==================== Sticky Header ==================== */}
      <div className="sticky top-16 z-30 border-b border-[#2A2928] bg-[#0F0E0D]/95 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-8">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] border border-[#2A2928] text-[#6B6560] transition-all hover:border-[#353433] hover:text-[#9E9690] active:scale-[0.95] lg:hidden"
              aria-label="Open book navigator"
            >
              <List className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="inline-flex min-w-0 items-center gap-1.5 rounded-[4px] border border-[#2A2928] px-4 py-2 text-sm font-semibold text-[#F5F0EB] transition-colors hover:bg-[#1C1B1A] lg:hidden"
            >
              <span className="truncate">
                {book.bookName} {currentChapter?.chapterNumber}
              </span>
              <CaretDown className="h-4 w-4 shrink-0 text-[#6B6560]" />
            </button>

            <div className="hidden min-w-0 items-baseline gap-3 lg:flex">
              <span
                className="truncate text-lg font-semibold text-[#F5F0EB]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              >
                {book.bookName}
              </span>
              <span className="font-mono text-sm text-[#6B6560]">
                chapter {currentChapter?.chapterNumber}
              </span>
            </div>

            <div className="ml-4 hidden h-6 w-px bg-[#2A2928] md:block" />

            {/* Prev/Next Chapter */}
            <div className="hidden items-center gap-2 md:flex">
              {prevTarget && (
                <button
                  type="button"
                  onClick={() => {
                    if (prevTarget.bookCode === book.bookCode.toLowerCase()) {
                      setSelectedChapterNum(prevTarget.chapter);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      router.push(`/scripture/bible/${prevTarget.bookCode}`);
                    }
                  }}
                  className="flex h-9 items-center gap-1 rounded-[4px] border border-[#2A2928] px-3 text-xs font-medium text-[#6B6560] transition-all hover:border-[#353433] hover:text-[#9E9690] active:scale-[0.97]"
                  title="Previous chapter (p)"
                >
                  <CaretLeft className="h-3.5 w-3.5" />
                  <span className="max-w-[80px] truncate">{prevTarget.label}</span>
                </button>
              )}
              {nextTarget && (
                <button
                  type="button"
                  onClick={() => {
                    if (nextTarget.bookCode === book.bookCode.toLowerCase()) {
                      setSelectedChapterNum(nextTarget.chapter);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                      router.push(`/scripture/bible/${nextTarget.bookCode}`);
                    }
                  }}
                  className="flex h-9 items-center gap-1 rounded-[4px] border border-[#2A2928] px-3 text-xs font-medium text-[#6B6560] transition-all hover:border-[#353433] hover:text-[#9E9690] active:scale-[0.97]"
                  title="Next chapter (n)"
                >
                  <span className="max-w-[80px] truncate">{nextTarget.label}</span>
                  <CaretRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex shrink-0 items-center gap-2">
            {/* View Mode */}
            <div className="hidden items-center rounded-[4px] border border-[#2A2928] bg-[#161514]/80 p-0.5 md:flex">
              {([
                { key: 'reading', icon: BookOpen, label: 'Reading' },
                ...(canParallel ? [{ key: 'parallel' as const, icon: Columns, label: 'Parallel' }] : []),
                ...(canParallel ? [{ key: 'hebrew' as const, icon: Translate, label: 'Hebrew' }] : []),
              ] as const).map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setViewMode(key)}
                  aria-pressed={viewMode === key}
                  aria-label={label}
                  title={label}
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-[4px] transition-colors active:scale-[0.95]',
                    viewMode === key
                      ? 'text-[#C8794A] font-semibold'
                      : 'text-[#6B6560] hover:text-[#9E9690]',
                  )}
                >
                  {viewMode === key && (
                    <motion.div
                      layoutId="active-bible-viewmode-pill"
                      className="absolute inset-0 rounded-[4px] border border-[#C8794A]/40 bg-[#C8794A]/10 shadow-sm"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" weight={viewMode === key ? 'fill' : 'regular'} />
                </button>
              ))}
            </div>

            {/* Font Size */}
            <div className="hidden items-center gap-2 rounded-[4px] border border-[#2A2928] bg-[#161514]/60 px-3 py-1.5 lg:flex">
              <TextT className="h-4 w-4 text-[#6B6560]" />
              <input
                type="range"
                min="0.85"
                max="1.35"
                step="0.05"
                value={fontScale}
                onChange={(e) => setFontScale(parseFloat(e.target.value))}
                aria-label="Font size"
                className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-[#2A2928] accent-[#C8794A]"
              />
            </div>

            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className={cn(
                'hidden h-10 w-10 items-center justify-center rounded-[4px] border transition-all active:scale-[0.95] lg:inline-flex',
                sidebarOpen
                  ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A]'
                  : 'border-[#2A2928] text-[#6B6560] hover:border-[#353433] hover:text-[#9E9690]',
              )}
              title={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
              aria-label={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
            >
              <SidebarSimple className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== Mobile Drawer ==================== */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigator"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <div className="absolute inset-y-0 right-0 flex w-[88vw] max-w-[420px] animate-slide-in-right flex-col border-l border-[#2A2928] bg-[#0F0E0D] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#2A2928] px-5 py-4">
              <span
                className="text-base font-semibold text-[#F5F0EB]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              >
                Book Navigator
              </span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[#6B6560] transition-colors hover:bg-[#1C1B1A] hover:text-[#F5F0EB]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <form
                onSubmit={(e) => {
                  handleVerseSearchSubmit(e);
                  setNavOpen(false);
                }}
                className="relative mb-4"
              >
                <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A4542]" />
                <input
                  type="text"
                  value={sidebarFilter}
                  onChange={(e) => setSidebarFilter(e.target.value)}
                  placeholder="Search verse or book (e.g. Gen 2:3)..."
                  className="h-12 w-full rounded-[4px] border border-[#2A2928] bg-[#161514]/70 pl-10 pr-3 text-sm text-[#F5F0EB] placeholder:text-[#6B6560] focus:border-[#353433] focus:bg-[#1C1B1A] focus:outline-none"
                />
              </form>

              <div className="mb-4">
                <div className="grid grid-cols-2 gap-1 rounded-[4px] border border-[#2A2928] bg-[#161514] p-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setSelectedTestament('old')}
                    className={cn(
                      'rounded-[4px] border py-2.5 transition-colors',
                      selectedTestament === 'old'
                        ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold'
                        : 'border-transparent text-[#6B6560] hover:text-[#9E9690]',
                    )}
                  >
                    Old Testament
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTestament('new')}
                    className={cn(
                      'rounded-[4px] border py-2.5 transition-colors',
                      selectedTestament === 'new'
                        ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold'
                        : 'border-transparent text-[#6B6560] hover:text-[#9E9690]',
                    )}
                  >
                    New Testament
                  </button>
                </div>
              </div>

              {renderBookAccordion(true)}
            </div>
          </div>
        </div>
      )}

      {/* ==================== Main Content ==================== */}
      <div
        className={cn(
          'transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          sidebarOpen ? 'lg:pr-[400px]' : 'lg:pr-0',
        )}
      >
        <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
          <main className="mx-auto w-full max-w-[780px] py-10 sm:py-14">
            <AnimatePresence mode="wait">
              <motion.article
                key={`${book.bookCode}-${currentChapter?.chapterNumber}-${viewMode}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
              {/* Title Block */}
              <div className="animate-fade-in-up text-center">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[#6B6560]">
                  {book.testament} &middot; {book.category}
                </p>
                <h2
                  className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.12] tracking-[-0.025em] text-[#F5F0EB]"
                  style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                >
                  {book.bookName}
                </h2>

                <div className="mx-auto mt-6 flex w-full max-w-[240px] items-center gap-4 text-[#2A2928]">
                  <span className="h-px flex-1 bg-current" />
                  <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0 text-[#6B6560]">
                    <path d="M7 0L8.5 5.5L14 7L8.5 8.5L7 14L5.5 8.5L0 7L5.5 5.5Z" fill="currentColor" />
                  </svg>
                  <span className="h-px flex-1 bg-current" />
                </div>

                {currentChapter?.subheading && (
                  <h3
                    className="mt-5 text-lg italic tracking-wide text-[#9E9690] sm:text-xl"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                  >
                    {currentChapter.subheading}
                  </h3>
                )}
              </div>

              {/* Verses */}
              <div
                className={cn(
                  'space-y-1',
                  viewMode === 'parallel' && 'space-y-8',
                  viewMode === 'hebrew' && 'space-y-8',
                )}
              >
                {currentChapter?.verses.map((verse) => (
                  <BibleVerseBlock
                    key={verse.verseNumber}
                    verse={verse}
                    chapterNum={currentChapter.chapterNumber}
                    viewMode={viewMode}
                    fontScale={fontScale}
                    hebrewText={hebrewVerseMap[verse.verseNumber]}
                    isActive={activeVerse === verse.verseNumber}
                    copiedId={copiedId}
                    showFootnote={showFootnote[verse.verseNumber]}
                    onCopy={handleCopy}
                    onShare={handleShare}
                    onToggleFootnote={(n) =>
                      setShowFootnote((prev) => ({ ...prev, [n]: !prev[n] }))
                    }
                    onSetActive={setActiveVerse}
                  />
                ))}
              </div>

              {/* Bottom Footnotes */}
              {viewMode === 'reading' && currentChapter?.verses.some((v) => v.footnote) && (
                <div className="mt-16 border-t border-[#2A2928] pt-10">
                  <h4 className="mb-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-[#6B6560]">
                    Footnotes
                  </h4>
                  <div className="space-y-3">
                    {currentChapter.verses
                      .filter((v) => v.footnote)
                      .map((v) => (
                        <div
                          key={v.verseNumber}
                          className="flex items-start gap-3 rounded-[8px] border border-[#2A2928] bg-[#161514]/50 p-4 text-xs"
                        >
                          <span className="mt-0.5 shrink-0 font-mono text-[11px] font-bold text-[#F5F0EB]">
                            {currentChapter.chapterNumber}:{v.verseNumber}
                          </span>
                          <p className="leading-relaxed text-[#6B6560]">{v.footnote}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Chapter Nav */}
              <div className="mt-16 flex items-center justify-between gap-4 border-t border-[#2A2928] pt-10 text-sm">
                {prevTarget ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (prevTarget.bookCode === book.bookCode.toLowerCase()) {
                        setSelectedChapterNum(prevTarget.chapter);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        router.push(`/scripture/bible/${prevTarget.bookCode}`);
                      }
                    }}
                    className="group inline-flex h-12 items-center gap-2 rounded-[8px] border border-[#2A2928] bg-[#161514]/70 px-5 font-semibold text-[#F5F0EB] shadow-sm transition-all hover:border-[#353433] hover:bg-[#1C1B1A] active:scale-[0.98]"
                  >
                    <CaretLeft className="h-4 w-4 text-[#6B6560] transition-colors group-hover:text-[#F5F0EB]" />
                    <span>{prevTarget.label}</span>
                  </button>
                ) : (
                  <div />
                )}

                {nextTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      if (nextTarget.bookCode === book.bookCode.toLowerCase()) {
                        setSelectedChapterNum(nextTarget.chapter);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        router.push(`/scripture/bible/${nextTarget.bookCode}`);
                      }
                    }}
                    className="group ml-auto inline-flex h-12 items-center gap-2 rounded-[8px] border border-[#2A2928] bg-[#161514]/70 px-5 font-semibold text-[#F5F0EB] shadow-sm transition-all hover:border-[#353433] hover:bg-[#1C1B1A] active:scale-[0.98]"
                  >
                    <span>{nextTarget.label}</span>
                    <CaretRight className="h-4 w-4 text-[#6B6560] transition-colors group-hover:text-[#F5F0EB]" />
                  </button>
                )}
              </div>
            </motion.article>
          </AnimatePresence>
        </main>
        </div>
      </div>

      {/* ==================== Desktop Sidebar ==================== */}
      <aside
        className={cn(
          'fixed right-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-[400px] flex-col border-l border-[#2A2928] bg-[#0F0E0D]/95 backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:flex',
          sidebarOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="space-y-4 border-b border-[#2A2928] p-5">
            <div>
              <h3
                className="text-sm font-semibold text-[#F5F0EB]"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
              >
                Book Navigator
              </h3>
              <p className="mt-1 text-xs text-[#6B6560]">Jump to a book or chapter</p>
            </div>

            <form onSubmit={handleVerseSearchSubmit} className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#4A4542]" />
              <input
                type="text"
                value={sidebarFilter}
                onChange={(e) => setSidebarFilter(e.target.value)}
                placeholder="Search verse (e.g. Gen 2:3)..."
                className="h-11 w-full rounded-[4px] border border-[#2A2928] bg-[#161514]/70 py-2.5 pl-10 pr-3 text-sm text-[#F5F0EB] placeholder:text-[#6B6560] focus:border-[#353433] focus:bg-[#1C1B1A] focus:outline-none"
              />
            </form>

            <div className="grid grid-cols-2 gap-1 rounded-[4px] border border-[#2A2928] bg-[#161514] p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedTestament('old')}
                className={cn(
                  'rounded-[4px] border py-2 transition-colors',
                  selectedTestament === 'old'
                    ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold'
                    : 'border-transparent text-[#6B6560] hover:text-[#9E9690]',
                )}
              >
                Old Testament
              </button>
              <button
                type="button"
                onClick={() => setSelectedTestament('new')}
                className={cn(
                  'rounded-[4px] border py-2 transition-colors',
                  selectedTestament === 'new'
                    ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] font-semibold'
                    : 'border-transparent text-[#6B6560] hover:text-[#9E9690]',
                )}
              >
                New Testament
              </button>
            </div>

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
                placeholder="Chapter #"
                className="h-11 flex-1 rounded-[4px] border border-[#2A2928] bg-[#161514]/70 px-3 text-sm text-[#F5F0EB] placeholder:text-[#6B6560] focus:border-[#353433] focus:bg-[#1C1B1A] focus:outline-none"
              />
              <button
                type="submit"
                className="h-11 rounded-[4px] border border-[#C8794A] bg-[#C8794A]/10 px-5 text-sm font-semibold text-[#C8794A] transition-colors hover:bg-[#C8794A]/20 active:scale-[0.96]"
              >
                Go
              </button>
            </form>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-[#2A2928] scrollbar-track-transparent">
            {renderBookAccordion(false)}
          </div>
        </div>
      </aside>

      {/* Persistent edge tab */}
      <button
        type="button"
        onClick={() => setSidebarOpen((o) => !o)}
        className={cn(
          'fixed top-1/2 z-40 hidden h-16 w-7 -translate-y-1/2 items-center justify-center rounded-l-[8px] border border-r-0 border-[#2A2928] bg-[#161514] text-[#6B6560] shadow-xl transition-[right] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:text-[#9E9690] lg:flex',
          sidebarOpen ? 'right-[400px]' : 'right-0',
        )}
        title={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
        aria-label={sidebarOpen ? 'Collapse navigator' : 'Open navigator'}
      >
        {sidebarOpen ? <CaretRight className="h-4 w-4" /> : <CaretLeft className="h-4 w-4" />}
      </button>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#C8794A] text-[#0F0E0D] shadow-2xl transition-transform hover:scale-105 hover:bg-[#D9916A] active:scale-95 lg:hidden"
        title="Open book navigator"
        aria-label="Open book navigator"
      >
        <List className="h-5 w-5" />
      </button>

      {/* Keyboard Hints */}
      <div className="fixed bottom-6 left-6 z-40 hidden items-center gap-3 rounded-full border border-[#2A2928] bg-[#0F0E0D]/90 px-4 py-2 text-[11px] text-[#6B6560] backdrop-blur-md lg:flex">
        <span>
          <kbd className="rounded border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 font-mono text-[#F5F0EB]">j</kbd>{' '}
          <kbd className="rounded border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 font-mono text-[#F5F0EB]">k</kbd> verses
        </span>
        <span className="h-3 w-px bg-[#2A2928]" />
        <span>
          <kbd className="rounded border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 font-mono text-[#F5F0EB]">n</kbd>{' '}
          <kbd className="rounded border border-[#2A2928] bg-[#161514] px-1.5 py-0.5 font-mono text-[#F5F0EB]">p</kbd> chapters
        </span>
      </div>
    </div>
  );

  /* ==================== Sub-Components ==================== */

  function renderBookAccordion(closeOnNavigate: boolean) {
    return (
      <div>
        {bookList.map((b) => {
          const isExpanded = expandedBookCode === b.code;
          const isCurrentBook = b.code === book.bookCode.toLowerCase();

          return (
            <div key={b.code} className="mb-0.5">
              <button
                type="button"
                onClick={() => setExpandedBookCode(isExpanded ? null : b.code)}
                className={cn(
                  'flex min-h-[44px] w-full items-center justify-between gap-2 rounded-[4px] px-3 py-2.5 text-left text-sm transition-colors active:scale-[0.99]',
                  isCurrentBook
                    ? 'bg-[#1C1B1A] font-semibold text-[#F5F0EB]'
                    : 'text-[#6B6560] hover:bg-[#1C1B1A]/60 hover:text-[#F5F0EB]',
                )}
              >
                <span className="truncate">{b.name}</span>
                <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] font-normal text-[#6B6560]">
                  {b.chapters}
                  <CaretDown
                    className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')}
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
                        href={`/scripture/bible/${b.code}`}
                        onClick={() => {
                          if (isCurrentBook) setSelectedChapterNum(chNum);
                          if (closeOnNavigate) setNavOpen(false);
                        }}
                        className={cn(
                          'flex h-11 min-w-[44px] items-center justify-center rounded-[4px] border font-mono text-xs font-medium transition-all active:scale-[0.95]',
                          isSelectedCh
                            ? 'border-[#C8794A]/40 bg-[#C8794A]/10 text-[#C8794A] shadow-sm font-semibold'
                            : 'border-[#2A2928] bg-[#161514]/60 text-[#6B6560] hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#9E9690]',
                        )}
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
  }
}

/* ------------------------------------------------------------------ */
/*  BibleVerseBlock                                                    */
/* ------------------------------------------------------------------ */

function BibleVerseBlock({
  verse,
  chapterNum,
  viewMode,
  fontScale,
  hebrewText,
  isActive,
  copiedId,
  showFootnote,
  onCopy,
  onShare,
  onToggleFootnote,
  onSetActive,
}: {
  verse: Verse;
  chapterNum: number;
  viewMode: ViewMode;
  fontScale: number;
  hebrewText?: string;
  isActive: boolean;
  copiedId: string | null;
  showFootnote?: boolean;
  onCopy: (v: Verse) => void;
  onShare: (n: number) => void;
  onToggleFootnote: (n: number) => void;
  onSetActive: (n: number | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isFirst = verse.verseNumber === 1;

  const englishSize = `calc(1.05rem * ${fontScale})`;
  const hebrewSize = `calc(1.5rem * ${fontScale})`;

  return (
    <div
      id={`v${verse.verseNumber}`}
      onMouseEnter={() => {
        setHovered(true);
        onSetActive(verse.verseNumber);
      }}
      onMouseLeave={() => {
        setHovered(false);
        onSetActive(null);
      }}
      className={cn(
        'group relative scroll-mt-32 rounded-[12px] border border-transparent py-6 transition-all duration-300 sm:px-4',
        isActive && 'bg-[#1C1B1A]/50',
        hovered && 'bg-[#1C1B1A]/50',
      )}
    >
      {/* Floating Toolbar */}
      <div
        className={cn(
          'absolute -top-3 right-4 z-10 flex items-center gap-1 rounded-[8px] border border-[#2A2928] bg-[#161514]/95 p-1 shadow-xl backdrop-blur-2xl transition-all duration-200',
          hovered || isActive ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0 pointer-events-none',
        )}
      >
        <ToolbarBtn
          icon={copiedId === `${chapterNum}-${verse.verseNumber}` ? Check : Copy}
          label="Copy verse"
          active={copiedId === `${chapterNum}-${verse.verseNumber}`}
          onClick={() => onCopy(verse)}
        />
        <ToolbarBtn icon={ShareNetwork} label="Copy link" onClick={() => onShare(verse.verseNumber)} />
        {verse.footnote && (
          <ToolbarBtn
            icon={ChatTeardropText}
            label="Toggle footnote"
            active={showFootnote}
            onClick={() => onToggleFootnote(verse.verseNumber)}
          />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex gap-4 sm:gap-6',
          viewMode === 'parallel' && 'grid gap-6 md:grid-cols-2 md:gap-10',
          viewMode === 'hebrew' && 'grid gap-6 md:grid-cols-2 md:gap-10',
        )}
      >
        {/* Hebrew / Original */}
        {viewMode === 'hebrew' && hebrewText && (
          <div>
            <p
              dir="rtl"
              lang="he"
              className="text-right font-serif leading-[2.2] text-[#F5F0EB]"
              style={{ fontSize: hebrewSize }}
            >
              {hebrewText}
            </p>
          </div>
        )}

        {/* English */}
        <div className="flex-1">
          <p
            className="leading-[1.9] text-[#F5F0EB]"
            style={{ fontFamily: 'var(--font-newsreader), Georgia, serif', fontSize: englishSize }}
          >
            {isFirst && viewMode === 'reading' ? (
              <>
                <b className="float-left mr-4 mt-1 select-none font-sans text-5xl font-bold leading-[0.85] text-[#F5F0EB] sm:text-6xl">
                  {chapterNum}
                </b>
                {renderVerseText(verse.text)}
              </>
            ) : (
              <>
                <sup className="mr-[0.35em] select-none align-super font-mono text-[0.65rem] font-bold tracking-wide text-[#6B6560]">
                  {chapterNum}:{verse.verseNumber}
                  {verse.footnote && <span className="ml-0.5 text-[#F5F0EB]">*</span>}
                </sup>
                {' '}
                {renderVerseText(verse.text)}
              </>
            )}
          </p>

          {/* Inline footnote */}
          {verse.footnote && showFootnote && viewMode !== 'reading' && (
            <aside className="mt-4 rounded-[8px] border-l-2 border-[#C8794A] bg-[#161514]/70 p-4">
              <p className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#F5F0EB]">
                <ChatTeardropText className="h-3.5 w-3.5" />
                Footnote {chapterNum}:{verse.verseNumber}
              </p>
              <p className="text-sm leading-6 text-[#6B6560]">{verse.footnote}</p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone' }>;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-[4px] transition-all active:scale-[0.95]',
        active
          ? 'bg-[#C8794A]/10 text-[#C8794A]'
          : 'text-[#6B6560] hover:bg-[#1C1B1A] hover:text-[#F5F0EB]',
      )}
    >
      <Icon className="h-3.5 w-3.5" weight={active ? 'fill' : 'regular'} />
    </button>
  );
}
