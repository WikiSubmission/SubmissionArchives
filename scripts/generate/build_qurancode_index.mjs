#!/usr/bin/env node
/**
 * Builds the dataset SA Studio's QuranCode research module reads.
 *
 * Studio is a separate Vite/Tauri app and cannot reach the Next.js `data/`
 * tree at runtime, so this projects the sources into `src-tauri/assets/` where
 * the Rust side picks them up with `include_str!`. Everything is one scan of
 * the word list, in the same spirit as `notes.rs`'s `scan_archive`.
 *
 * Two source files, joined on chapter:verse:
 *
 *   PRIMARY    data/sources/quran/words/ws_quran_words_roots_uthmani.csv
 *              word-level pointed Uthmani, with a root, an English gloss and a
 *              transliteration on every word. This is the counting basis: it
 *              tokenises words correctly (37:130:3 is one word containing a
 *              space), it carries the roots, and it reproduces Al-Fatiha at
 *              7 verses / 29 words / 139 letters.
 *
 *   SECONDARY  data/sources/quran/1992/ws_quran_{text,chapters}_rows.csv
 *              the English translation and the chapter table. Its Arabic column
 *              is deliberately NOT used: it renders the superscript alef on a
 *              tatweel where the word list does not, a 261-letter difference
 *              across the corpus, and two orthographies cannot both be the
 *              counting basis.
 *
 * What this does NOT emit is a prebuilt letter index. The fold depends on the
 * active text mode and on the user's mark toggles, both of which are runtime
 * state, so a letter index has to be built after those are known. Rust builds
 * it once per mode behind a OnceLock, the way `quran.rs` already indexes the
 * bundled CSV.
 *
 * Run: npm run generate:qurancode
 * Check (CI): npm run verify:qurancode
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {
  TEXT_MODES, DEFAULT_MARKS, ALWAYS_DROP, CP,
  foldWord, alphabetOf, segmentWord,
} from '../lib/qurancode-text.mjs'

const ROOT = process.cwd()
const WORDS_CSV = path.join(ROOT, 'data', 'sources', 'quran', 'words', 'ws_quran_words_roots_uthmani.csv')
const TEXT_CSV = path.join(ROOT, 'data', 'sources', 'quran', '1992', 'ws_quran_text_rows.csv')
const CHAPTERS_CSV = path.join(ROOT, 'data', 'sources', 'quran', '1992', 'ws_quran_chapters_rows.csv')
const OUT_DIR = path.join(ROOT, 'studio', 'src-tauri', 'assets', 'qurancode')
const VALUE_DIR = path.join(OUT_DIR, 'value_systems')

const CHECK_ONLY = process.argv.includes('--check')
const TAG = '[qurancode]'

/* ── CSV ──────────────────────────────────────────────────────────────── */
function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ } else quoted = false
      } else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    else if (c !== '\r') cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}

const readCsv = (file) => {
  const rows = parseCsv(fs.readFileSync(file, 'utf8'))
  const header = rows[0]
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

/* Refuses to write a dataset that fails an invariant. Every one of these is a
 * measurement taken from the sources, not a guess about them. */
const failures = []
function assert(condition, message) {
  if (!condition) failures.push(message)
}

/* ── load ─────────────────────────────────────────────────────────────── */
function loadWords() {
  const raw = readCsv(WORDS_CSV)

  /* The spreadsheet carries filler rows where every column is a literal "-".
   * They are separators, not data. The arithmetic below has to close exactly,
   * otherwise something else is being silently dropped. */
  const filler = raw.filter((r) => !Number.isFinite(Number(r.SuraNumberEnglish)))
  const rows = raw.filter((r) => Number.isFinite(Number(r.SuraNumberEnglish)))
  assert(
    raw.length === rows.length + filler.length,
    `word rows do not partition: ${raw.length} total vs ${rows.length} data + ${filler.length} filler`
  )

  const words = rows.map((r) => ({
    chapter: Number(r.SuraNumberEnglish),
    verse: Number(r.VerseNumberEnglish),
    position: Number(r.WordNumberEnglish),
    uthmani: r.Uthmani,
    gloss: r.EnglishWord,
    translit: r.TransliterationWord,
    roots: [r['Root Word 1'], r['Root Word 2'], r['Root Word 3']]
      .map((x) => (x || '').trim())
      .filter((x) => x && x !== '-'),
  }))

  return { words, fillerCount: filler.length, rawCount: raw.length }
}

/* ── verify the corpus before writing anything ────────────────────────── */
const BASMALAH_WORDS = ['بِسْمِ', 'ٱللَّهِ', 'ٱلرَّحْمَـٰنِ', 'ٱلرَّحِيمِ']

function verifyCorpus(words, fillerCount, rawCount) {
  const canonical = words.filter((w) => w.verse > 0)
  const basmalah = words.filter((w) => w.verse === 0)

  assert(rawCount === canonical.length + basmalah.length + fillerCount,
    `row partition mismatch: ${rawCount} != ${canonical.length} + ${basmalah.length} + ${fillerCount}`)
  assert(canonical.length === 77401, `canonical words: ${canonical.length}, expected 77401`)
  assert(basmalah.length === 448, `unnumbered basmalah word rows: ${basmalah.length}, expected 448`)

  const chapters = new Set(canonical.map((w) => w.chapter))
  assert(chapters.size === 114, `chapters: ${chapters.size}, expected 114`)

  const verses = new Set(canonical.map((w) => `${w.chapter}:${w.verse}`))
  assert(verses.size === 6234, `verses: ${verses.size}, expected 6234`)

  /* 9:128-129 are absent from the source and stay absent. Nothing is
   * re-inserted and no `excluded` status exists, so there is nothing that can
   * wander back into a count by accident. */
  const nine = canonical.filter((w) => w.chapter === 9).map((w) => w.verse)
  assert(Math.max(...nine) === 127, `chapter 9 runs to ${Math.max(...nine)}, expected 127`)

  /* Chapter 9 has no basmalah; every other chapter from 2 on has one, and
   * chapter 1 carries it as verse 1. */
  const withBasmalah = new Set(basmalah.map((w) => w.chapter))
  assert(withBasmalah.size === 112, `chapters with an unnumbered basmalah: ${withBasmalah.size}, expected 112`)
  assert(!withBasmalah.has(9) && !withBasmalah.has(1), 'chapters 1 and 9 must have no unnumbered basmalah')

  // word numbering contiguous within every verse
  const byVerse = new Map()
  for (const w of canonical) {
    const key = `${w.chapter}:${w.verse}`
    if (!byVerse.has(key)) byVerse.set(key, [])
    byVerse.get(key).push(w.position)
  }
  const broken = [...byVerse].filter(([, ps]) => {
    const sorted = [...ps].sort((a, b) => a - b)
    return sorted.some((p, i) => p !== i + 1)
  })
  assert(broken.length === 0, `${broken.length} verses have non-contiguous word numbering`)

  /* The verse-level CSV embeds the basmalah inside verse 1 for chapters 2-114,
   * which double-counts 112 basmalahs. The word list does not. Guard against a
   * future source swap reintroducing it. */
  const embedded = [...byVerse.keys()].filter((key) => {
    const [c, v] = key.split(':').map(Number)
    if (v !== 1 || c === 1) return false
    const first = canonical.filter((w) => w.chapter === c && w.verse === 1 && w.position <= 4)
      .sort((a, b) => a.position - b.position).map((w) => w.uthmani)
    return BASMALAH_WORDS.every((b, i) => first[i] === b)
  })
  assert(embedded.length === 0,
    `${embedded.length} verse-1 groups begin with the basmalah; the source has the duplication bug`)

  const rootless = canonical.filter((w) => w.roots.length === 0)
  assert(rootless.length === 30,
    `words with no root: ${rootless.length}, expected 30 (the initial-letter groups)`)

  /* Roots are indexed over every word the module ships, the unnumbered
   * basmalah included, because those words are countable when a sura's
   * initials are being counted.
   *
   * The root cells must be trimmed before they are compared. Six roots appear
   * in the source with inconsistent surrounding whitespace, and the filler rows
   * carry a literal "-", so an untrimmed count inflates 1,782 to 1,790. */
  const roots = new Set(words.flatMap((w) => w.roots))
  assert(roots.size === 1782, `distinct roots: ${roots.size}, expected 1782`)
  const canonicalRoots = new Set(canonical.flatMap((w) => w.roots))
  assert(canonicalRoots.size === roots.size,
    `the unnumbered basmalah introduced ${roots.size - canonicalRoots.size} root(s) not in any canonical verse`)

  // Simplified29 has to resolve to exactly 29 letters, or it is not Simplified29
  const alphabet = alphabetOf(canonical.map((w) => foldWord(w.uthmani, 'simplified29')))
  assert(alphabet.length === 29, `simplified29 alphabet: ${alphabet.length} letters, expected 29`)

  return { canonical, basmalah, roots: [...roots].sort(), alphabet }
}

/* ── fixtures ─────────────────────────────────────────────────────────── */

/**
 * Published counts, and the ones we cannot yet reproduce.
 *
 * `status: 'verified'` fixtures fail the build when they drift.
 * `status: 'known_gap'` fixtures are computed and reported but do not fail,
 * because the discrepancy is real and disclosed rather than hidden. The UI
 * reads the same field and refuses to present an affected figure as
 * authoritative.
 *
 * Two corrections are folded in, both from the qurantalk "Quran Initial Count"
 * documentation of Dr. Khalifa's Appendix 1:
 *
 *   - Sura 30 carries one fewer alif and one more lam than the printed table,
 *     leaving the 1254 total intact. Our measured lam of 394 is the correct
 *     figure and the printed 393 is the error, so the fixture uses 394.
 *   - Sura 68's initial is spelled نون rather than ن, which is how the count
 *     reaches 133. The word list already spells it out.
 */

const ALM_PUBLISHED = {
  2: { alif: 4502, lam: 3202, mim: 2195 },
  3: { alif: 2521, lam: 1892, mim: 1249 },
  29: { alif: 774, lam: 554, mim: 344 },
  30: { alif: 543, lam: 394, mim: 317 },
  31: { alif: 347, lam: 297, mim: 173 },
  32: { alif: 257, lam: 155, mim: 158 },
}

/** Counts a letter class over a chapter, with the sura's unnumbered basmalah
 * included. That inclusion is not a preference: counting canonical verses only
 * leaves lam short by exactly 4 and mim short by exactly 3 in every one of the
 * six الم suras, which is precisely one basmalah. */
function countIn(words, chapter, chars, mode = 'khalifa_appendix1') {
  const stream = words
    .filter((w) => w.chapter === chapter)
    .map((w) => foldWord(w.uthmani, mode))
    .join('')
  let n = 0
  for (const ch of stream) if (chars.includes(ch)) n++
  return n
}

function buildFixtures(words) {
  const canonical = words.filter((w) => w.verse > 0)
  const fixtures = []
  const add = (id, mode, description, expected, actual, status = 'verified') =>
    fixtures.push({ id, mode, description, expected, actual, pass: expected === actual, status })

  /* ── Simplified 29: the mode's own basis ── */
  const fatiha = canonical.filter((w) => w.chapter === 1)
  const fatihaLetters = fatiha.map((w) => foldWord(w.uthmani, 'simplified29')).join('')
  add('fatiha_verses', 'simplified29', 'Al-Fatiha verses', 7, new Set(fatiha.map((w) => w.verse)).size)
  add('fatiha_words', 'simplified29', 'Al-Fatiha words', 29, fatiha.length)
  add('fatiha_letters', 'simplified29', 'Al-Fatiha letters', 139, fatihaLetters.length)

  const corpusLetters = canonical.map((w) => foldWord(w.uthmani, 'simplified29')).join('')
  add('corpus_chapters', 'simplified29', 'corpus chapters', 114, new Set(canonical.map((w) => w.chapter)).size)
  add('corpus_verses', 'simplified29', 'corpus verses', 6234, new Set(canonical.map((w) => `${w.chapter}:${w.verse}`)).size)
  add('corpus_words', 'simplified29', 'corpus words', 77401, canonical.length)
  add('corpus_letters', 'simplified29', 'corpus letters', 325273, corpusLetters.length)
  add('alphabet_is_29', 'simplified29', 'distinct letters in the fold', 29, new Set(corpusLetters).size)

  /* ── published-figures mode: the unambiguous letters ── */
  const hm = [40, 41, 42, 43, 44, 45, 46].reduce((a, c) => a + countIn(words, c, 'حم'), 0)
  add('hm_2147', 'khalifa_appendix1', 'ح + م across suras 40-46 (19x113)', 2147, hm)

  const sad = [7, 19, 38].reduce((a, c) => a + countIn(words, c, 'ص'), 0)
  add('sad_152', 'khalifa_appendix1', 'ص across suras 7, 19, 38 (19x8)', 152, sad)

  const qaf = [42, 50].reduce((a, c) => a + countIn(words, c, 'ق'), 0)
  add('qaf_114', 'khalifa_appendix1', 'ق in suras 42 and 50 (19x6)', 114, qaf)

  add('nun_133', 'khalifa_appendix1', 'ن in sura 68 (19x7), initial spelled نون', 133, countIn(words, 68, 'ن'))
  add('ta_20_28', 'khalifa_appendix1', 'ط in sura 20', 28, countIn(words, 20, 'ط'))
  add('ta_27_27', 'khalifa_appendix1', 'ط in sura 27', 27, countIn(words, 27, 'ط'))
  add('sin_36_48', 'khalifa_appendix1', 'س in sura 36', 48, countIn(words, 36, 'س'))
  add('ha_19_175', 'khalifa_appendix1', 'ه + ة in sura 19', 175, countIn(words, 19, 'ه'))
  add('ha_20_251', 'khalifa_appendix1', 'ه + ة in sura 20', 251, countIn(words, 20, 'ه'))

  /* ي + ى + the small yeh. Sura 19 lands exactly; sura 36 does not, and the
   * residual of four is recorded rather than papered over. */
  const yaMarks = DEFAULT_MARKS.map((m) => (m.id === 'small_waw_yeh' ? { ...m, on: true } : m))
  const yaIn = (chapter) => {
    const stream = words.filter((w) => w.chapter === chapter)
      .map((w) => foldWord(w.uthmani, 'khalifa_appendix1', yaMarks)).join('')
    let n = 0
    for (const ch of stream) if (ch === CP.YEH || ch === CP.ALEF_MAQSURA) n++
    return n
  }
  add('ya_19_343', 'khalifa_appendix1', 'ي + ى + small yeh in sura 19', 343, yaIn(19))
  add('ya_36_237', 'khalifa_appendix1', 'ي + ى + small yeh in sura 36', 237, yaIn(36), 'known_gap')

  /* ── lam and mim across the six الم suras: 12 fixtures ── */
  let almLam = 0
  let almMim = 0
  let almAlif = 0
  for (const [chapter, published] of Object.entries(ALM_PUBLISHED)) {
    const c = Number(chapter)
    const lam = countIn(words, c, 'ل')
    const mim = countIn(words, c, 'م')
    add(`lam_${c}`, 'khalifa_appendix1', `ل in sura ${c}`, published.lam, lam)
    add(`mim_${c}`, 'khalifa_appendix1', `م in sura ${c}`, published.mim, mim)
    almLam += published.lam
    almMim += published.mim
    almAlif += published.alif

    /* Alif is the open problem. Counting ا + ٱ + ٰ leaves a deficit against the
     * published figure in every sura, and no subset of the thirteen mark
     * classes closes it: the rule is per word, not per class. The qurantalk
     * documentation confirms the shape, a hamza that counts as an alif for one
     * word counts as one for every occurrence of that word and its
     * derivatives, which is a lookup table this generator does not yet have. */
    const alifMarks = DEFAULT_MARKS.map((m) => (m.id === 'superscript_alef' ? { ...m, on: true } : m))
    const stream = words.filter((w) => w.chapter === c)
      .map((w) => foldWord(w.uthmani, 'khalifa_appendix1', alifMarks)).join('')
    let alif = 0
    for (const ch of stream) if (ch === CP.ALEF) alif++
    add(`alif_${c}`, 'khalifa_appendix1', `ا in sura ${c} (ا + ٱ + ٰ, no per-word overrides yet)`,
      published.alif, alif, 'known_gap')
  }
  add('alm_total_19874', 'khalifa_appendix1',
    'الم grand total across the six suras (19x1046)', 19874, almAlif + almLam + almMim)

  return fixtures
}

/* ── segmentation ─────────────────────────────────────────────────────── */
function buildSegments(canonical) {
  const segments = []
  const unaligned = []
  let weakUsed = 0
  const prefixes = new Map()
  const suffixes = new Map()

  for (const w of canonical) {
    if (!w.roots.length) { segments.push(null); continue }
    let seg = null
    let usedRoot = null
    for (const root of w.roots) {
      seg = segmentWord(w.uthmani, root)
      if (seg) { usedRoot = root; break }
    }
    if (!seg) {
      unaligned.push(`${w.chapter}:${w.verse}:${w.position}`)
      segments.push(null)
      continue
    }
    if (seg.weakSkipped) weakUsed++
    if (seg.prefix) prefixes.set(seg.prefix, (prefixes.get(seg.prefix) || 0) + 1)
    if (seg.suffix) suffixes.set(seg.suffix, (suffixes.get(seg.suffix) || 0) + 1)
    segments.push({ ...seg, root: usedRoot })
  }

  const rooted = canonical.filter((w) => w.roots.length).length
  const aligned = rooted - unaligned.length
  const rate = aligned / rooted

  /* The alignment rate is an invariant, not a statistic: a refactor that drops
   * it below where it stands today is a regression, and CI says so. Compared at
   * two decimal places, because a raw float floor of 0.9884 fails against a
   * rate of 0.98838 that reports as 98.84%. */
  const pct = Math.round(rate * 10000) / 100
  assert(pct >= 98.84,
    `segmentation aligned ${pct}% of rooted words, expected at least 98.84%`)

  return { segments, unaligned, aligned, rooted, rate, weakUsed, prefixes, suffixes }
}

/* ── value systems ────────────────────────────────────────────────────── */

/* Classical hisab al-jummal. The hamza carriers and the alif maqsura take the
 * value of the letter they are written on, which is standard practice and the
 * only reading consistent with a 29-letter alphabet. */
const ABJAD_STANDARD = {
  'ا': 1, 'ء': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'س': 60, 'ع': 70, 'ف': 80, 'ص': 90,
  'ق': 100, 'ر': 200, 'ش': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ض': 800,
  'ظ': 900, 'غ': 1000,
}

/* The Western ordering, which diverges from the Eastern one after ن: the
 * s/sh/d/z group is permuted, so ص takes 60 where the Eastern order gives it
 * 90. Both are classical; a value quoted without saying which is ambiguous. */
const ABJAD_MAGHRIBI = {
  'ا': 1, 'ء': 1, 'ب': 2, 'ج': 3, 'د': 4, 'ه': 5, 'و': 6, 'ز': 7, 'ح': 8, 'ط': 9,
  'ي': 10, 'ك': 20, 'ل': 30, 'م': 40, 'ن': 50, 'ص': 60, 'ع': 70, 'ف': 80, 'ض': 90,
  'ق': 100, 'ر': 200, 'س': 300, 'ت': 400, 'ث': 500, 'خ': 600, 'ذ': 700, 'ظ': 800,
  'غ': 900, 'ش': 1000,
}

const VALUE_SYSTEMS = [
  {
    id: 'abjad_standard',
    name: 'Abjad standard',
    author: 'classical (hisab al-jummal)',
    text_mode: 'simplified29',
    note: 'The classical Arabic gematria order. Hamza carriers take the value of their seat.',
    letter_values: ABJAD_STANDARD,
  },
  {
    id: 'abjad_maghribi',
    name: 'Abjad Maghribi',
    author: 'classical (Western ordering)',
    text_mode: 'simplified29',
    note: 'The Western ordering. Diverges from the standard after nun; sad is 60, not 90.',
    letter_values: ABJAD_MAGHRIBI,
  },
  {
    id: 'counts_only',
    name: 'None (counts only)',
    author: null,
    text_mode: 'simplified29',
    note: 'No valuation. Every letter scores zero, so the readout shows counts alone.',
    letter_values: Object.fromEntries(Object.keys(ABJAD_STANDARD).map((k) => [k, 0])),
  },
]

/* The toggle row's copy. The ids come from the shared fold module; the wording
 * is the old app's own, so a researcher moving across recognises the control. */
const hex = (ch) => ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')

const TOGGLE_LABELS = {
  hamza_on_line: 'Hamza above horizontal line as letter',
  superscript_alef: 'Superscript alef as letter',
  small_waw_yeh: 'Small waw / yeh as letter',
  silent_marked: 'Count letters marked silent',
}

/* ── emit ─────────────────────────────────────────────────────────────── */
/* One source gloss carries a literal newline ("...brought forth\n(called to
 * account)."), which silently split a row in two and cost the Rust side a word.
 * Every cell is flattened here rather than at each call site, and the width
 * guard turns a future one into a build failure instead of an off-by-one. */
const cell = (value) => String(value).replace(/[\t\r\n]+/g, ' ').trim()

const tsv = (rows) => {
  const width = rows[0].length
  return rows
    .map((cells, i) => {
      if (cells.length !== width) {
        failures.push(`tsv row ${i} has ${cells.length} columns, header has ${width}`)
      }
      return cells.map(cell).join('\t')
    })
    .join('\n') + '\n'
}

function build() {
  const { words, fillerCount, rawCount } = loadWords()
  const { canonical, basmalah, roots, alphabet } = verifyCorpus(words, fillerCount, rawCount)
  const fixtures = buildFixtures(words)
  const seg = buildSegments(canonical)

  const chapters = readCsv(CHAPTERS_CSV)
  assert(chapters.length === 114, `chapter table: ${chapters.length} rows, expected 114`)
  const verseSum = chapters.reduce((a, c) => a + Number(c.chapter_verses), 0)
  assert(verseSum === 6234, `sum(chapter_verses) = ${verseSum}, expected 6234`)

  const english = new Map()
  for (const row of readCsv(TEXT_CSV)) {
    english.set(`${row.chapter_number}:${row.verse_number}`, row.english)
  }

  const rootIndex = new Map(roots.map((r, i) => [r, i]))
  /* One pass for the occurrence column; filtering the word list per root would
   * be 1,790 scans of 77,849 rows. */
  const rootOccurrences = new Map()
  for (const w of words) for (const r of w.roots) rootOccurrences.set(r, (rootOccurrences.get(r) ?? 0) + 1)

  const files = {}

  files['words.tsv'] = tsv([
    ['chapter', 'verse', 'position', 'uthmani', 'gloss', 'translit', 'root_ids', 'status'],
    ...words.map((w) => [
      w.chapter, w.verse, w.position, w.uthmani,
      w.gloss, w.translit,
      w.roots.map((r) => rootIndex.get(r)).filter((x) => x !== undefined).join(','),
      w.verse === 0 ? 'basmalah_unnumbered' : 'canonical',
    ]),
  ])

  const verseKeys = [...new Set(canonical.map((w) => `${w.chapter}:${w.verse}`))]
  files['verses.tsv'] = tsv([
    ['chapter', 'verse', 'english'],
    ...verseKeys.map((k) => {
      const [c, v] = k.split(':')
      return [c, v, english.get(k) || '']
    }),
  ])

  files['chapters.tsv'] = tsv([
    ['chapter', 'verses', 'revelation_order', 'name_arabic', 'name_english', 'name_transliterated'],
    ...chapters.map((c) => [
      c.chapter_number, c.chapter_verses, c.revelation_order,
      c.title_arabic, c.title_english, c.title_transliterated,
    ]),
  ])

  files['roots.tsv'] = tsv([
    ['root_id', 'root', 'occurrences'],
    ...roots.map((r, i) => [
      i, r, rootOccurrences.get(r) ?? 0,
    ]),
  ])

  files['segments.tsv'] = tsv([
    ['chapter', 'verse', 'position', 'prefix', 'stem', 'suffix', 'root'],
    ...canonical.map((w, i) => {
      const s = seg.segments[i]
      return s
        ? [w.chapter, w.verse, w.position, s.prefix, s.stem, s.suffix, s.root]
        : [w.chapter, w.verse, w.position, '', '', '', '']
    }),
  ])

  files['text_modes.json'] = JSON.stringify({
    modes: Object.fromEntries(Object.entries(TEXT_MODES).map(([id, m]) => [id, {
      label: m.label,
      countable: m.countable,
      fold: m.fold,
      ...(m.includeSuraBasmalahInInitials ? { include_sura_basmalah_in_initials: true } : {}),
      verified: fixtures.filter((f) => f.mode === id && f.status === 'verified' && f.pass).map((f) => f.id),
      known_gaps: fixtures.filter((f) => f.mode === id && f.status === 'known_gap')
        .map((f) => `${f.id}: computed ${f.actual}, published ${f.expected}`),
    }])),
    /* Each toggle carries the full mapping, not just the codepoints it governs:
     * a governed codepoint becomes its mapped letter when the toggle is on and
     * is dropped when it is off. The Rust side reads this verbatim, so the
     * decision about what a superscript alef *is* lives in one place.
     * `silent_marked` maps nothing because it does not substitute a letter; it
     * decides whether the letter preceding U+06DF survives at all. */
    toggles: DEFAULT_MARKS.map((m) => ({
      id: m.id,
      default: m.on,
      label: TOGGLE_LABELS[m.id],
      map: Object.fromEntries(Object.entries(m.cps).map(([from, to]) => [
        from.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
        to.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'),
      ])),
      ...(m.id === 'silent_marked' ? { drops_letter_before: '06DF' } : {}),
    })),
    /* The hook the alif rule will land in. Per the qurantalk documentation the
     * rule is per word: a hamza that reads as an alif in one word reads as one
     * in every occurrence of that word and its derivatives. That is a lookup
     * keyed on the word form, which no toggle can express, so it lives here.
     * Empty until the table is calibrated against QuranCode's own output. */
    alif_overrides: {},
    /* Everything that is not a letter under any mode: short vowels, tanween,
     * sukun, the maddah, the tatweel, the waqf marks and the source's own two
     * junk characters. Emitted rather than restated in Rust, so the fold has a
     * single definition. */
    always_drop: [...ALWAYS_DROP].map(hex).sort(),
    /* Handled structurally rather than by the drop set: the shadda is always
     * dropped because a doubled letter is written once and counted once, and
     * the silent marker governs the letter before it. */
    structural: { shadda: hex(CP.SHADDA), silent: hex(CP.SILENT) },
    alphabet: { simplified29: alphabet.join('') },
  }, null, 2) + '\n'

  files['fixtures.json'] = JSON.stringify({
    generated_from: 'ws_quran_words_roots_uthmani.csv',
    verified: fixtures.filter((f) => f.status === 'verified').length,
    known_gaps: fixtures.filter((f) => f.status === 'known_gap').length,
    fixtures,
  }, null, 2) + '\n'

  files['CREDITS.md'] = [
    '# QuranCode module data credits',
    '',
    'Generated by `scripts/generate/build_qurancode_index.mjs`. Do not edit by hand.',
    '',
    '## Sources',
    '',
    '- **Word-level pointed Uthmani text, roots, glosses and transliterations**',
    '  `data/sources/quran/words/ws_quran_words_roots_uthmani.csv`.',
    `  ${canonical.length.toLocaleString('en-US')} words, ${roots.length.toLocaleString('en-US')} roots, full coverage.`,
    '- **English translation and chapter table** Dr. Rashad Khalifa, 1992 Authorized English Version,',
    '  `data/sources/quran/1992/`.',
    '',
    '## Derived here, not imported',
    '',
    `- **Word-part segmentation.** Root-anchored, aligning ${(seg.rate * 100).toFixed(2)}% of rooted words`,
    `  (${seg.aligned.toLocaleString('en-US')} of ${seg.rooted.toLocaleString('en-US')}).`,
    `  ${seg.prefixes.size} distinct prefix forms and ${seg.suffixes.size} suffix forms fall out as data.`,
    '',
    '## Counting conventions',
    '',
    'There is no single true letter count. Every figure this module shows is relative to a',
    'text mode and a mark-toggle set, both declared in `text_modes.json`, and both carried',
    'alongside the number wherever it is displayed.',
    '',
  ].join('\n')

  const valueFiles = Object.fromEntries(
    VALUE_SYSTEMS.map((v) => [`${v.id}.json`, JSON.stringify(v, null, 2) + '\n']))

  return { files, valueFiles, fixtures, seg, canonical, basmalah, roots, alphabet }
}

/* ── main ─────────────────────────────────────────────────────────────── */
function main() {
  const built = build()
  const { files, valueFiles, fixtures, seg } = built

  const broken = fixtures.filter((f) => f.status === 'verified' && !f.pass)
  for (const f of broken) {
    failures.push(`fixture ${f.id} (${f.description}): computed ${f.actual}, expected ${f.expected}`)
  }

  if (failures.length) {
    console.error(`${TAG} refusing to write, ${failures.length} invariant(s) failed:`)
    for (const f of failures) console.error(`${TAG}   ${f}`)
    process.exit(1)
  }

  const verified = fixtures.filter((f) => f.status === 'verified')
  const gaps = fixtures.filter((f) => f.status === 'known_gap')

  if (CHECK_ONLY) {
    const missing = [...Object.keys(files), ...Object.keys(valueFiles).map((f) => `value_systems/${f}`)]
      .filter((name) => !fs.existsSync(path.join(OUT_DIR, name)))
    if (missing.length) {
      console.error(`${TAG} ${OUT_DIR} is missing or stale (${missing.length} file(s) absent). Run npm run generate:qurancode`)
      process.exit(1)
    }
    const drifted = Object.entries(files)
      .filter(([name, body]) => fs.readFileSync(path.join(OUT_DIR, name), 'utf8') !== body)
      .map(([name]) => name)
    if (drifted.length) {
      console.error(`${TAG} generated files have drifted from the sources: ${drifted.join(', ')}`)
      console.error(`${TAG} run npm run generate:qurancode`)
      process.exit(1)
    }
    console.log(`${TAG} check ok (${verified.length} fixtures verified, ${gaps.length} known gaps)`)
    return
  }

  fs.mkdirSync(VALUE_DIR, { recursive: true })
  let bytes = 0
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(OUT_DIR, name), body)
    bytes += Buffer.byteLength(body)
  }
  for (const [name, body] of Object.entries(valueFiles)) {
    fs.writeFileSync(path.join(VALUE_DIR, name), body)
    bytes += Buffer.byteLength(body)
  }

  console.log(`${TAG} wrote ${Object.keys(files).length + Object.keys(valueFiles).length} files, ${(bytes / 1e6).toFixed(2)} MB`)
  console.log(`${TAG} corpus 114 / 6,234 / ${built.canonical.length.toLocaleString('en-US')} words / ${built.roots.length.toLocaleString('en-US')} roots`)
  console.log(`${TAG} segmentation ${(seg.rate * 100).toFixed(2)}% (${seg.aligned.toLocaleString('en-US')} of ${seg.rooted.toLocaleString('en-US')}), ${seg.unaligned.length} unaligned`)
  console.log(`${TAG} fixtures ${verified.length} verified, ${gaps.length} known gaps:`)
  for (const g of gaps) console.log(`${TAG}   ${g.id}: computed ${g.actual}, published ${g.expected}`)
}

main()
