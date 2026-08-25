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
const METADATA_SOURCE = path.join(ROOT, 'data', 'sources', 'quran', 'metadata', 'quran-metadata.txt')
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

/* ── the Quranic Initials ──────────────────────────────────────────────
 *
 * The 29 initialed suras and the letters that prefix them, transcribed from
 * Table 1 of Appendix 1. This is a *list*, not a derivation: the initials are
 * the opening verse of the sura and could in principle be read off the text,
 * but sura 42 carries its initials across two verses and sura 68 spells its
 * single letter out as نون, so a reader that tried to infer the set would need
 * both exceptions hardcoded anyway. A table with its invariants asserted is
 * more honest than an inference with two special cases.
 *
 * Four facts fall out of it and are checked below, because the table is only
 * worth having if it is the same table the published arguments used: 29 suras,
 * 14 distinct sets, 14 distinct letters, and sura numbers summing to 822.
 */
const INITIALS = {
  2: 'الم',
  3: 'الم',
  7: 'المص',
  10: 'الر',
  11: 'الر',
  12: 'الر',
  13: 'المر',
  14: 'الر',
  15: 'الر',
  19: 'كهيعص',
  20: 'طه',
  26: 'طسم',
  27: 'طس',
  28: 'طسم',
  29: 'الم',
  30: 'الم',
  31: 'الم',
  32: 'الم',
  36: 'يس',
  38: 'ص',
  40: 'حم',
  41: 'حم',
  42: 'حمعسق',
  43: 'حم',
  44: 'حم',
  45: 'حم',
  46: 'حم',
  50: 'ق',
  68: 'ن',
}

/* The divine name as Appendix 1 counts it. The root on its own also covers the
 * generic noun and the form on its own also covers unrelated words, so the
 * selector is the intersection; `allah_root_only_2844` and
 * `allah_form_only_2726` pin both halves so a change to either data source
 * shows up as a failure rather than as a quietly different total. */
const ALLAH_ROOT = 'ا ل ه'
const ALLAH_FORM = 'لله'

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

    /* Alif was the open problem and is now a characterised residual. The mode
     * folds every written form of alef, hamza included, and does not count the
     * superscript alef; see the fold in `qurancode-text.mjs`. What is left per
     * sura is +2, -10, -3, -2, +6, +7 against deficits that used to be 587,
     * 317, 103, 61, 33 and 28. Mixed signs and single digits, so it is an
     * orthographic difference between our source and the text Appendix 1 was
     * counted from, not a rule still missing. */
    const alif = countIn(words, c, CP.ALEF)
    add(`alif_${c}`, 'khalifa_appendix1', `ا in sura ${c}, every written form of alef`,
      published.alif, alif, published.alif === alif ? 'verified' : 'known_gap')
  }
  /* Measured, not restated. This used to add up the *published* column and
   * assert the published total, which is arithmetic on a table rather than a
   * check on the corpus: it passed throughout the period when our own alif
   * counts were short by 1,129. It now counts the letters. */
  const almComputed = [2, 3, 29, 30, 31, 32].reduce((a, c) => a + countIn(words, c, 'الم'), 0)
  add('alm_published_table_sums_to_19874', 'khalifa_appendix1',
    'the published الم table is internally consistent', 19874, almAlif + almLam + almMim)
  add('alm_total_19874', 'khalifa_appendix1',
    'الم counted across the six suras (19x1046)', 19874, almComputed,
    almComputed === 19874 ? 'verified' : 'known_gap')

  /* The other four initial groups, now that alif is in range. Sura 15 lands
   * exactly; the rest carry the same single-digit residual as the alif counts,
   * and each is recorded with its own computed value. */
  const GROUPS = [
    ['alr_10', 10, 'الر', 2489], ['alr_11', 11, 'الر', 2489], ['alr_12', 12, 'الر', 2375],
    ['alr_14', 14, 'الر', 1197], ['alr_15', 15, 'الر', 912],
    ['almr_13', 13, 'المر', 1482], ['alms_7', 7, 'المص', 5320],
  ]
  for (const [id, chapter, letters, published] of GROUPS) {
    const got = countIn(words, chapter, letters)
    add(id, 'khalifa_appendix1', `${letters} in sura ${chapter}`, published, got,
      published === got ? 'verified' : 'known_gap')
  }

  /* ── aggregation: the arguments Appendix 1 is actually built from ──
   *
   * Everything above counts letters inside one contiguous scope. These count a
   * set of word instances scattered across the corpus and then total something
   * about them, which is the move nearly every published argument makes. They
   * live here rather than only in the Rust tests so that `verify:qurancode`
   * fails on drift in the words table or the roots table, not just on drift in
   * the fold.
   *
   * The divine name is root 56 intersected with the definite form. Neither
   * filter alone gives the published figure: the root also catches إله and
   * آلهة, the generic noun, at 2,844, and the string also catches ٱللَّهُمَّ,
   * which carries a different root, along with ضَلَـٰلَة and كَلَـٰلَة, at 2,726.
   */
  const divineName = canonical.filter(
    (w) => w.roots.includes(ALLAH_ROOT) && foldWord(w.uthmani, 'simplified29').includes(ALLAH_FORM)
  )
  const divineVerses = [...new Set(divineName.map((w) => `${w.chapter}:${w.verse}`))]
  const inSpan = (w, [fc, fv], [tc, tv]) =>
    (w.chapter > fc || (w.chapter === fc && w.verse >= fv)) &&
    (w.chapter < tc || (w.chapter === tc && w.verse <= tv))

  add('allah_2698', 'simplified29', 'occurrences of the divine name (19x142)', 2698, divineName.length)
  add('allah_root_only_2844', 'simplified29',
    'root 56 alone, which also catches the generic noun', 2844,
    canonical.filter((w) => w.roots.includes(ALLAH_ROOT)).length)
  add('allah_form_only_2726', 'simplified29',
    'the definite form alone, which also catches ضلالة and اللهم', 2726,
    canonical.filter((w) => foldWord(w.uthmani, 'simplified29').includes(ALLAH_FORM)).length)
  add('allah_verses_1820', 'simplified29',
    'distinct verses carrying the divine name', 1820, divineVerses.length)
  add('allah_verse_number_sum_118123', 'simplified29',
    'sum of those verse numbers, each verse once (19x6217)', 118123,
    divineVerses.reduce((a, ref) => a + Number(ref.split(':')[1]), 0))
  add('allah_verse_number_sum_per_occurrence', 'simplified29',
    'the same sum counted once per occurrence, which is not a multiple of 19', 182034,
    divineName.reduce((a, w) => a + w.verse, 0))
  add('allah_in_initial_span_2641', 'simplified29',
    'the divine name from the first initial (2:1) to the last (68:1) (19x139)', 2641,
    divineName.filter((w) => inSpan(w, [2, 1], [68, 1])).length)
  add('allah_outside_initial_span_57', 'simplified29',
    'and outside that span (19x3)', 57,
    divineName.filter((w) => !inSpan(w, [2, 1], [68, 1])).length)
  add('verses_in_initial_span_5263', 'simplified29',
    'verses from the first initial to the last (19x277)', 5263,
    [...new Set(canonical.filter((w) => inSpan(w, [2, 1], [68, 1])).map((w) => `${w.chapter}:${w.verse}`))].length)

  /* A cross-cutting selection: one verse number, every chapter at once. */
  const qafInVerse19 = words
    .filter((w) => w.verse === 19)
    .map((w) => foldWord(w.uthmani, 'khalifa_appendix1')).join('')
  add('qaf_in_verse_19s_76', 'khalifa_appendix1',
    'ق in every verse numbered 19 (19x4)', 76,
    [...qafInVerse19].filter((c) => c === 'ق').length)

  /* The two remaining initial groups. Every letter but alif reproduces to the
   * unit; the alif deficit is the entire distance to the published total, which
   * is the same single defect recorded above for the six الم suras. */
  /* The non-alif half of the two four-letter groups, kept as its own fixture
   * because it reproduced exactly even while alif was short by 1,129, and it is
   * what localised the gap to a single letter class. */
  add('almr_13_without_alif_877', 'khalifa_appendix1',
    'ل + م + ر in sura 13, the published figures minus alif', 877, countIn(words, 13, 'لمر'))
  add('alms_7_without_alif_2791', 'khalifa_appendix1',
    'ل + م + ص in sura 7, the published figures minus alif', 2791, countIn(words, 7, 'لمص'))

  /* ── the Quranic Initials, and the Simple Facts that follow from them ──
   *
   * These are arithmetic over the initials table rather than counts over the
   * text, which is exactly why the table has to be data with its invariants
   * asserted: an argument built on a miscounted list of 29 suras would be
   * wrong in a way no letter fold could catch.
   */
  const initialed = Object.keys(INITIALS).map(Number).sort((a, b) => a - b)
  const sets = new Set(Object.values(INITIALS))
  const initialLetters = new Set(Object.values(INITIALS).join(''))
  add('initialed_suras_29', 'simplified29', 'suras carrying Quranic Initials', 29, initialed.length)
  add('initial_sets_14', 'simplified29', 'distinct sets of initials', 14, sets.size)
  add('initial_letters_14', 'simplified29', 'distinct letters used as initials', 14, initialLetters.size)
  add('initial_sura_numbers_822', 'simplified29',
    'sum of the 29 initialed sura numbers', 822, initialed.reduce((a, c) => a + c, 0))
  add('initial_sura_numbers_plus_sets_836', 'simplified29',
    'that sum plus the 14 sets (19x44)', 836, initialed.reduce((a, c) => a + c, 0) + sets.size)
  add('initials_metadata_57', 'simplified29',
    '14 letters + 14 sets + 29 suras (19x3)', 57, initialLetters.size + sets.size + initialed.length)
  add('uninitialed_between_2_and_68_38', 'simplified29',
    'un-initialed suras strictly between 2 and 68 (19x2)', 38,
    Array.from({ length: 65 }, (_, i) => i + 3).filter((c) => !(c in INITIALS)).length)

  /* Sura numbers 9 to 27 inclusive: from the missing Basmalah to the extra
   * one. Arithmetic over sura numbers themselves, which is why the aggregate
   * reports a per-sura number sum as well as a per-verse one. */
  add('sura_numbers_9_to_27_342', 'simplified29',
    'sum of the sura numbers from 9 to 27 (19x18)', 342,
    Array.from({ length: 19 }, (_, i) => i + 9).reduce((a, c) => a + c, 0))
  add('suras_9_to_27_span_19', 'simplified29',
    'suras from 9 to 27 inclusive', 19, 27 - 9 + 1)

  /* The corpus total that includes the unnumbered Basmalahs, which is the basis
   * Appendix 1 quotes rather than the 6,234 every other figure here uses. */
  const numbered = new Set(canonical.map((w) => `${w.chapter}:${w.verse}`)).size
  const unnumbered = new Set(
    words.filter((w) => w.verse === 0).map((w) => `${w.chapter}:0`)
  ).size
  add('unnumbered_basmalahs_112', 'simplified29', 'suras opening with an unnumbered Basmalah', 112, unnumbered)
  add('verses_with_basmalahs_6346', 'simplified29',
    'numbered verses plus unnumbered Basmalahs (19x334)', 6346, numbered + unnumbered)
  /* Measured, not asserted. The 112 unnumbered groups are rows in the word
   * table; the other two are the phrase appearing inside a numbered verse, at
   * 1:1 and inside 27:30, and those are found by matching the folded four-word
   * sequence rather than by adding two to a total. */
  const BASMALAH = ['بسم', 'الله', 'الرحمن', 'الرحيم']
  const verseWords = new Map()
  for (const w of canonical) {
    const key = `${w.chapter}:${w.verse}`
    if (!verseWords.has(key)) verseWords.set(key, [])
    verseWords.get(key).push(foldWord(w.uthmani, 'simplified29'))
  }
  let numberedBasmalahs = 0
  for (const forms of verseWords.values()) {
    for (let i = 0; i + BASMALAH.length <= forms.length; i++) {
      if (BASMALAH.every((f, k) => forms[i + k] === f)) numberedBasmalahs++
    }
  }
  add('basmalah_in_numbered_verses_2', 'simplified29',
    'the Basmalah inside a numbered verse: 1:1 and 27:30', 2, numberedBasmalahs)
  add('basmalah_occurrences_114', 'simplified29',
    'the Basmalah in full: the 112 unnumbered plus 1:1 and 27:30 (19x6)', 114,
    unnumbered + numberedBasmalahs)

  /* The first and last revelations, by word and letter count. Verse ranges
   * rather than whole suras, which the aggregate expresses as address bounds. */
  const inRange = (w, ch, from, to) => w.chapter === ch && w.verse >= from && w.verse <= to
  const firstRevelation = canonical.filter((w) => inRange(w, 96, 1, 5))
  /* Two of the Simple Facts do not reproduce, and both are convention
   * differences rather than arithmetic. The first revelation is 20 words under
   * our tokenization against a published 19, so the published count joins a
   * pair our word table keeps apart. Sura 96 is 285 letters against a published
   * 304, and no combination of the four mark toggles reaches it: the closest is
   * 300 with the superscript alef counted. Both are recorded with their
   * computed value rather than dropped, which is the same treatment the alif
   * deficits get.
   *
   * Both are filed under the published mode rather than under Simplified 29,
   * because that is what they are: claims from Appendix 1. Simplified 29 is
   * defined by its own basis and reproduces it exactly, and an invariant below
   * holds it to zero known gaps so that a future Appendix-1 figure cannot be
   * filed against it by accident. */
  add('first_revelation_words_19', 'khalifa_appendix1', 'words in 96:1-5, published tokenization joins one pair', 19, firstRevelation.length, 'known_gap')
  add('first_revelation_letters_76', 'simplified29', 'letters in 96:1-5 (19x4)', 76,
    firstRevelation.map((w) => foldWord(w.uthmani, 'simplified29')).join('').length)
  add('sura_96_verses_19', 'simplified29', 'verses in sura 96', 19,
    new Set(canonical.filter((w) => w.chapter === 96).map((w) => w.verse)).size)
  add('sura_96_letters_304', 'khalifa_appendix1', 'letters in sura 96 (19x16), no toggle set reaches it', 304,
    canonical.filter((w) => w.chapter === 96).map((w) => foldWord(w.uthmani, 'simplified29')).join('').length,
    'known_gap')
  const lastRevelation = canonical.filter((w) => w.chapter === 110)
  add('sura_110_words_19', 'simplified29', 'words in sura 110', 19, lastRevelation.length)
  add('verse_110_1_letters_19', 'simplified29', 'letters in 110:1', 19,
    lastRevelation.filter((w) => w.verse === 1).map((w) => foldWord(w.uthmani, 'simplified29')).join('').length)

  return fixtures
}

/* ── the traditional divisions ─────────────────────────────────────────
 *
 * Tanzil's `quran-metadata.txt`, CC-BY, which is the only part of this corpus
 * that arrives as a boundary list rather than as text. Each record is the
 * *start* of a division; the end is the verse before the next one starts, and
 * the last division of each kind ends at 114:6.
 *
 * The numbering question turned out to be smaller than expected. Tanzil is on
 * the 6,236-verse Hafs numbering and we are on 6,234, and sura 9 is the only
 * chapter where the two disagree: 129 verses there against our 127. No boundary
 * of any kind lands past 9:127, so nothing needs remapping and the assertion
 * below holds every boundary to a verse that exists in our numbering. What does
 * differ is the *content* of whichever page, bowing and quarter spans 9:127 to
 * 10:1: it holds two fewer verses here than in a Hafs mushaf. That is inherent
 * to the two numberings rather than a defect in the import, and the affected
 * divisions are reported at generation so the difference is on the record.
 */
const DIVISION_KINDS = ['part', 'group', 'quarter', 'station', 'bowing', 'page']

/** How many of each kind there must be. A short read is a truncated file, not a
 * smaller Quran, so these are invariants rather than statistics. */
const DIVISION_COUNTS = {
  part: 30,
  group: 60,
  quarter: 240,
  station: 7,
  bowing: 556,
  page: 604,
}

function parseMetadata(text) {
  const kinds = new Set([...DIVISION_KINDS, 'chapter', 'prostration'])
  const rows = {}
  for (const k of kinds) rows[k] = []
  let current = null
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^﻿/, '')
    if (line.startsWith('//')) {
      const head = line.slice(2).trim().split(/\s+/)[0]
      if (kinds.has(head)) current = head
      continue
    }
    if (!line.trim() || !current) continue
    rows[current].push(line.split('\t').map((c) => c.trim()))
  }
  return rows
}

/** Turns a list of start addresses into inclusive ranges over our verse order.
 * `order` is every `chapter:verse` in reading order, so an end is found by index
 * rather than by arithmetic on verse numbers, which would be wrong at a chapter
 * boundary. */
function toRanges(kind, starts, order, index) {
  const ranges = []
  for (let i = 0; i < starts.length; i++) {
    const [, ch, v] = starts[i].map(Number)
    const key = `${ch}:${v}`
    const at = index.get(key)
    assert(at !== undefined,
      `${kind} ${i + 1} starts at ${key}, which is not a verse in this numbering`)
    let endAt = order.length - 1
    if (i + 1 < starts.length) {
      const [, nc, nv] = starts[i + 1].map(Number)
      const next = index.get(`${nc}:${nv}`)
      assert(next !== undefined,
        `${kind} ${i + 2} starts at ${nc}:${nv}, which is not a verse in this numbering`)
      assert(next > at, `${kind} ${i + 2} starts at or before ${kind} ${i + 1}`)
      endAt = next - 1
    }
    const [ec, ev] = order[endAt].split(':').map(Number)
    ranges.push({
      kind,
      number: i + 1,
      start_chapter: ch,
      start_verse: v,
      end_chapter: ec,
      end_verse: ev,
      verses: endAt - at + 1,
    })
  }
  return ranges
}

function buildDivisions(canonical, chapters) {
  const text = fs.readFileSync(METADATA_SOURCE, 'utf8')
  const rows = parseMetadata(text)

  /* Reading order, taken from the words table rather than rebuilt from the
   * chapter table, so the divisions are indexed against the same verse list
   * every other figure in this module counts over. */
  const order = []
  const index = new Map()
  for (const w of canonical) {
    const key = `${w.chapter}:${w.verse}`
    if (!index.has(key)) {
      index.set(key, order.length)
      order.push(key)
    }
  }
  assert(order.length === 6234, `reading order has ${order.length} verses, expected 6234`)

  /* Tanzil and our numbering must differ in exactly one place. If a second
   * chapter ever disagrees, the boundaries can no longer be trusted unmapped
   * and this import needs rewriting rather than patching. */
  const disagree = rows.chapter
    .map((r) => [Number(r[0]), Number(r[1])])
    .filter(([n, verses]) => {
      /* The chapter CSV yields strings, so both sides are coerced. Comparing a
       * string to a number here silently reported zero disagreements, which is
       * the failure mode this whole assertion exists to catch. */
      const ours = chapters.find((c) => Number(c.chapter_number) === n)
      assert(ours, `Tanzil has sura ${n} but our chapter table does not`)
      return Number(ours.chapter_verses) !== verses
    })
  assert(disagree.length === 1 && disagree[0][0] === 9,
    `Tanzil disagrees with our verse counts on ${disagree.map(([n]) => n).join(', ')}, expected only sura 9`)

  const divisions = []
  for (const kind of DIVISION_KINDS) {
    const ranges = toRanges(kind, rows[kind], order, index)
    assert(ranges.length === DIVISION_COUNTS[kind],
      `${kind}: ${ranges.length} rows, expected ${DIVISION_COUNTS[kind]}`)
    /* Each kind has to tile the corpus exactly. A gap would silently drop
     * verses from a scoped count and an overlap would double them, and neither
     * shows up as a wrong-looking number. */
    const covered = ranges.reduce((a, r) => a + r.verses, 0)
    assert(covered === order.length,
      `${kind} ranges cover ${covered} verses, expected ${order.length}`)
    divisions.push(...ranges)
  }

  /* The chapter table carries its own bowing count, so the two sources can be
   * checked against each other rather than trusted separately. */
  const bowingsPerChapter = new Map()
  for (const r of rows.bowing) {
    const ch = Number(r[1])
    bowingsPerChapter.set(ch, (bowingsPerChapter.get(ch) ?? 0) + 1)
  }
  for (const r of rows.chapter) {
    const n = Number(r[0])
    const declared = Number(r[8])
    const counted = bowingsPerChapter.get(n) ?? 0
    assert(declared === counted,
      `sura ${n} declares ${declared} bowings, ${counted} rows start in it`)
  }

  /* Revelation place, the one chapter-level field this file has that our own
   * chapter table does not. Makkah or Medina, never blank. */
  const place = new Map()
  for (const r of rows.chapter) {
    const p = r[6]
    assert(p === 'Makkah' || p === 'Medina', `sura ${r[0]} has revelation place '${p}'`)
    place.set(Number(r[0]), p)
  }
  assert(place.size === 114, `revelation place for ${place.size} suras, expected 114`)

  const prostrations = rows.prostration.map((r) => ({
    chapter: Number(r[1]),
    verse: Number(r[2]),
    type: r[3],
  }))
  assert(prostrations.length === 15, `${prostrations.length} prostrations, expected 15`)
  for (const p of prostrations) {
    assert(index.has(`${p.chapter}:${p.verse}`),
      `prostration at ${p.chapter}:${p.verse} is not a verse in this numbering`)
    assert(p.type === 'Recommended' || p.type === 'Obligatory',
      `prostration at ${p.chapter}:${p.verse} has type '${p.type}'`)
  }

  /* Which divisions hold fewer verses than a Hafs mushaf would give them,
   * because 9:128 and 9:129 are absent here. Reported rather than corrected:
   * the two verses are not in either dataset (§2.4) and inventing them to make
   * a page count match would be worse than saying which page differs. */
  const straddling = divisions.filter(
    (d) =>
      (d.start_chapter < 9 || (d.start_chapter === 9 && d.start_verse <= 127)) &&
      (d.end_chapter > 9 || (d.end_chapter === 9 && d.end_verse === 127)) &&
      !(d.start_chapter === 9 && d.end_chapter === 9 && d.end_verse < 127)
  )

  return { divisions, place, prostrations, straddling }
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
const cell = (value) => {
  /* `undefined` and `null` stringify to text that looks like data and parses as
   * a value, so a Map keyed by number and read with a string key emitted a whole
   * column of the literal word "undefined" and nothing complained. Twice. The
   * guard belongs at the writer, which every cell passes through. */
  if (value === undefined || value === null) {
    failures.push('a cell was undefined or null; a lookup returned nothing')
    return ''
  }
  return String(value).replace(/[\t\r\n]+/g, ' ').trim()
}

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

  /* Simplified 29 is the default mode precisely because nothing about it is
   * unverified, and the UI leans on that: it is the mode a figure is offered
   * under when the researcher has expressed no preference. A published figure
   * filed against it by accident would quietly make the default mode
   * unauthoritative, so the property is an invariant rather than a habit. */
  const s29Gaps = fixtures.filter((f) => f.mode === 'simplified29' && f.status === 'known_gap')
  assert(s29Gaps.length === 0,
    `simplified29 must have no known gaps, found: ${s29Gaps.map((f) => f.id).join(', ')}`)
  const seg = buildSegments(canonical)

  const chapters = readCsv(CHAPTERS_CSV)
  assert(chapters.length === 114, `chapter table: ${chapters.length} rows, expected 114`)
  const verseSum = chapters.reduce((a, c) => a + Number(c.chapter_verses), 0)
  assert(verseSum === 6234, `sum(chapter_verses) = ${verseSum}, expected 6234`)

  /* After the chapter table, because the import checks its boundaries against
   * our own verse counts rather than trusting Tanzil's. */
  const div = buildDivisions(canonical, chapters)

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

  /* `initials` is empty for the 85 suras that carry none, which is a fact about
   * them rather than missing data, so the column is present on every row. */
  files['chapters.tsv'] = tsv([
    ['chapter', 'verses', 'revelation_order', 'revelation_place', 'name_arabic', 'name_english', 'name_transliterated', 'initials'],
    ...chapters.map((c) => [
      c.chapter_number, c.chapter_verses, c.revelation_order,
      div.place.get(Number(c.chapter_number)),
      c.title_arabic, c.title_english, c.title_transliterated,
      INITIALS[c.chapter_number] ?? '',
    ]),
  ])

  files['divisions.tsv'] = tsv([
    ['kind', 'number', 'start_chapter', 'start_verse', 'end_chapter', 'end_verse', 'verses'],
    ...div.divisions.map((d) => [
      d.kind, d.number, d.start_chapter, d.start_verse, d.end_chapter, d.end_verse, d.verses,
    ]),
  ])

  files['prostrations.tsv'] = tsv([
    ['chapter', 'verse', 'type'],
    ...div.prostrations.map((p) => [p.chapter, p.verse, p.type]),
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
    '- **Traditional divisions, revelation place and prostration verses**',
    '  Tanzil.net Quran metadata v1.0.2, (C) 2008-2011, licensed CC-BY.',
    '  `data/sources/quran/metadata/quran-metadata.txt`.',
    `  ${DIVISION_COUNTS.part} parts, ${DIVISION_COUNTS.group} groups, ${DIVISION_COUNTS.quarter} quarters,`,
    `  ${DIVISION_COUNTS.station} stations, ${DIVISION_COUNTS.bowing} bowings, ${DIVISION_COUNTS.page} pages,`,
    `  ${div.prostrations.length} prostration verses.`,
    '  Tanzil numbers 6,236 verses where this corpus numbers 6,234, and sura 9 is the only',
    '  chapter where the two disagree. No division boundary lands past 9:127, so nothing is',
    `  remapped; ${div.straddling.length} divisions, one of each kind, simply hold two fewer verses here than a`,
    '  Hafs mushaf gives them.',
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

  return { files, valueFiles, fixtures, seg, div, canonical, basmalah, roots, alphabet }
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
  console.log(
    `${TAG} divisions ${built.div.divisions.length} across ${DIVISION_KINDS.length} kinds, ` +
    `${built.div.prostrations.length} prostrations, ` +
    `${built.div.straddling.length} spanning the absent 9:128-129`
  )
  console.log(`${TAG} segmentation ${(seg.rate * 100).toFixed(2)}% (${seg.aligned.toLocaleString('en-US')} of ${seg.rooted.toLocaleString('en-US')}), ${seg.unaligned.length} unaligned`)
  /* The count of gaps is a poor measure on its own, because adding a fixture
   * that nearly reproduces raises it. The total absolute distance between what
   * we compute and what was published is the number that has to go down. */
  const distance = gaps.reduce((a, g) => a + Math.abs(Number(g.actual) - Number(g.expected)), 0)
  console.log(`${TAG} fixtures ${verified.length} verified, ${gaps.length} known gaps, distance ${distance}`)
  for (const g of gaps) {
    const d = Number(g.actual) - Number(g.expected)
    console.log(`${TAG}   ${g.id}: computed ${g.actual}, published ${g.expected} (${d > 0 ? '+' : ''}${d})`)
  }
}

main()
