/**
 * Live Terminal Monitor for Gemini Vision Book OCR & Structuring Pipeline.
 *
 * Usage:
 *   node scripts/generate/monitor_ocr.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TRANSCRIPTION_DIR = path.join(ROOT, 'data', 'sources', 'books');
const CACHE_DIR = path.join(TRANSCRIPTION_DIR, '.gemini_cache');
const MANIFEST_PATH = path.join(TRANSCRIPTION_DIR, 'corpus_manifest.json');

// Terminal ANSI styling
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';

function getBookStatus(book) {
  const slugCacheDir = path.join(CACHE_DIR, book.slug);
  const completeFile = path.join(TRANSCRIPTION_DIR, book.slug, `${book.slug}_complete.json`);

  let cachedPages = 0;
  let latestPage = null;
  let latestMtime = 0;

  if (fs.existsSync(slugCacheDir)) {
    const files = fs.readdirSync(slugCacheDir).filter((f) => f.endsWith('.json'));
    cachedPages = files.length;

    for (const f of files) {
      try {
        const filePath = path.join(slugCacheDir, f);
        const stat = fs.statSync(filePath);
        if (stat.mtimeMs > latestMtime) {
          latestMtime = stat.mtimeMs;
          latestPage = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
      } catch {
        // ignore
      }
    }
  }

  const isFinalized = fs.existsSync(completeFile) && cachedPages >= book.pages;
  const isTranscribing = !isFinalized && cachedPages > 0 && Date.now() - latestMtime < 60000;

  return {
    slug: book.slug,
    title: book.title,
    totalPages: book.pages,
    cachedPages,
    pct: Math.min(100, Math.round((cachedPages / book.pages) * 100)),
    isFinalized,
    isTranscribing,
    latestPage,
    latestMtime,
  };
}

function renderProgressBar(pct, width = 30) {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  if (pct === 100) return `${GREEN}${bar}${RESET}`;
  if (pct > 50) return `${CYAN}${bar}${RESET}`;
  return `${YELLOW}${bar}${RESET}`;
}

function render() {
  if (!fs.existsSync(MANIFEST_PATH)) return;

  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return; // temporarily locked by write, skip tick
  }
  const bookStatuses = manifest.map(getBookStatus);

  const totalCatalogPages = bookStatuses.reduce((sum, b) => sum + b.totalPages, 0);
  const totalCachedPages = bookStatuses.reduce((sum, b) => sum + b.cachedPages, 0);
  const overallPct = Math.round((totalCachedPages / totalCatalogPages) * 100);

  // Clear screen and move cursor to home
  process.stdout.write('\x1b[2J\x1b[H');

  console.log(`${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║              📚 SUBMISSION ARCHIVES — LIVE GEMINI VISION OCR MONITOR          ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════════════════════════╝${RESET}\n`);

  console.log(`${BOLD}Overall Archive Progress:${RESET} ${renderProgressBar(overallPct, 36)} ${BOLD}${overallPct}%${RESET} (${totalCachedPages}/${totalCatalogPages} Pages)\n`);

  console.log(`${DIM}┌───────────────────────────────────────────┬──────────────┬─────────────┬──────────────┐${RESET}`);
  console.log(`${DIM}│${RESET} ${BOLD}${'Book / Volume Title'.padEnd(41)}${RESET} ${DIM}│${RESET} ${BOLD}${'Pages'.padEnd(12)}${RESET} ${DIM}│${RESET} ${BOLD}${'Progress'.padEnd(11)}${RESET} ${DIM}│${RESET} ${BOLD}${'Status'.padEnd(12)}${RESET} ${DIM}│${RESET}`);
  console.log(`${DIM}├───────────────────────────────────────────┼──────────────┼─────────────┼──────────────┤${RESET}`);

  let activeBook = null;

  for (const b of bookStatuses) {
    const titleTrunc = b.title.length > 41 ? b.title.slice(0, 38) + '...' : b.title.padEnd(41);
    const pagesStr = `${b.cachedPages}/${b.totalPages}`.padEnd(12);
    const pctStr = `${String(b.pct).padStart(3)}%`.padEnd(11);

    let statusBadge = `${DIM}PENDING${RESET}      `;
    if (b.isFinalized) {
      statusBadge = `${GREEN}✓ FINALIZED${RESET}  `;
    } else if (b.isTranscribing || b.cachedPages > 0) {
      statusBadge = `${YELLOW}⚡ TRANSCRIBING${RESET}`;
      activeBook = b;
    }

    console.log(`${DIM}│${RESET} ${titleTrunc} ${DIM}│${RESET} ${pagesStr} ${DIM}│${RESET} ${pctStr} ${DIM}│${RESET} ${statusBadge} ${DIM}│${RESET}`);
  }
  console.log(`${DIM}└───────────────────────────────────────────┴──────────────┴─────────────┴──────────────┘${RESET}\n`);

  if (activeBook && activeBook.latestPage) {
    const lp = activeBook.latestPage;
    console.log(`${BOLD}${YELLOW}⚡ Active Transcription Activity:${RESET}`);
    console.log(`  • Book:       ${BOLD}${activeBook.title}${RESET}`);
    console.log(`  • Progress:   ${renderProgressBar(activeBook.pct, 24)} ${activeBook.pct}% (${activeBook.cachedPages}/${activeBook.totalPages} pages)`);
    console.log(`  • Last Page:  ${CYAN}Page ${lp.page_number}${RESET} (${lp.is_blank ? 'Blank Page' : (lp.page_title || 'Transcribed')})`);
    if (lp.arabic_text) {
      const sampleArabic = lp.arabic_text.split('\n')[0].slice(0, 60);
      console.log(`  • Arabic:     ${GREEN}${sampleArabic}...${RESET}`);
    }
    if (lp.verses_cited && lp.verses_cited.length > 0) {
      console.log(`  • Verses:     ${MAGENTA}${lp.verses_cited.join(', ')}${RESET}`);
    }
    if (lp.has_tables) {
      console.log(`  • Tables:     ${BLUE}${lp.tables_markdown.length} structured Markdown table(s) parsed${RESET}`);
    }
    const ago = Math.max(0, Math.round((Date.now() - activeBook.latestMtime) / 1000));
    console.log(`  • Updated:    ${DIM}${ago}s ago${RESET}`);
  } else {
    console.log(`${DIM}All active batch jobs complete or idle. Run 'node scripts/generate/ocr_books_gemini.mjs' to start.${RESET}`);
  }

  console.log(`\n${DIM}Press Ctrl+C to exit monitor. (Refreshes automatically every 1.5s)${RESET}`);
}

// Loop refresh
render();
setInterval(render, 1500);
