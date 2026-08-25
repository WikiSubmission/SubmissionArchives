/**
 * Text-mode folds and the derived-segmentation algorithm for the QuranCode
 * module. Kept in `scripts/lib/` because the generator and its `--check` pass
 * both need them, and because the Rust side reimplements the same rules: if
 * these change, `src-tauri/src/qurancode.rs` has to change with them.
 *
 * Two things here are not obvious and are load-bearing:
 *
 * 1. The folds are per text mode, not global. There is no single true letter
 *    count. Simplified29 collapses the script to a 29-letter alphabet and
 *    reproduces Al-Fatiha at 7/29/139. The published-figures
 *    mode folds only alef wasla and teh marbuta, which is what Dr. Khalifa's
 *    Appendix 1 counts turn out to require.
 *
 * 2. The mark toggles are data, not code. Whether a hamza on the line counts
 *    as a letter is a checkbox in the UI, so nothing below decides it.
 */

/* ── codepoints ───────────────────────────────────────────────────────── */
export const CP = {
  HAMZA: 'ء',        // ء   hamza on the line
  ALEF_MADDA: 'آ',   // آ
  ALEF_HAMZA: 'أ',   // أ
  WAW_HAMZA: 'ؤ',    // ؤ
  ALEF_HAMZA_LOW: 'إ', // إ
  YEH_HAMZA: 'ئ',    // ئ
  ALEF: 'ا',         // ا
  TEH_MARBUTA: 'ة',  // ة
  ALEF_MAQSURA: 'ى', // ى
  YEH: 'ي',          // ي
  WAW: 'و',          // و
  SHADDA: 'ّ',       // ّ
  TATWEEL: 'ـ',      // ـ
  SUP_ALEF: 'ٰ',     // ٰ   superscript (dagger) alef
  ALEF_WASLA: 'ٱ',   // ٱ
  SMALL_WAW: 'ۥ',    // ۥ
  SMALL_YEH: 'ۦ',    // ۦ
  SILENT: '۟',       // ۟   small high rounded zero: marks a silent letter
  HAMZA_ABOVE: 'ٔ',  // ٔ
}

/** Anything that is unambiguously not a letter under any mode: short vowels,
 * tanween, sukun, the maddah, the tatweel, the waqf marks, and the two junk
 * characters the source spreadsheet carries. Deliberately excludes the shadda,
 * the superscript alef, the small waw/yeh and the silent marker, each of which
 * is handled explicitly below. */
export const ALWAYS_DROP = new Set([
  'ً', 'ٌ', 'ٍ', 'َ', 'ُ', 'ِ', 'ْ',
  'ٓ', 'ٕ', 'ـ', '-', ' ',
  ...Array.from({ length: 0x06DE - 0x06D6 + 1 }, (_, i) => String.fromCodePoint(0x06D6 + i)),
  ...Array.from({ length: 0x06E4 - 0x06E0 + 1 }, (_, i) => String.fromCodePoint(0x06E0 + i)),
  ...Array.from({ length: 0x06ED - 0x06E7 + 1 }, (_, i) => String.fromCodePoint(0x06E7 + i)),
])

/** The 28 letters plus the standalone hamza. Anything outside this set never
 * reaches a count, whatever the folds produce. */
const LETTER = /[ء-غف-ي]/

/* ── text modes ───────────────────────────────────────────────────────── */
export const TEXT_MODES = {
  simplified29: {
    label: 'Simplified 29',
    countable: true,
    fold: {
      [CP.ALEF_MADDA]: CP.ALEF, [CP.ALEF_HAMZA]: CP.ALEF, [CP.ALEF_HAMZA_LOW]: CP.ALEF,
      [CP.ALEF_WASLA]: CP.ALEF, [CP.WAW_HAMZA]: CP.WAW, [CP.YEH_HAMZA]: CP.YEH,
      [CP.ALEF_MAQSURA]: CP.YEH, [CP.TEH_MARBUTA]: 'ه',
    },
  },
  khalifa_appendix1: {
    label: 'Appendix 1 (published)',
    countable: true,
    /* Every fold here is forced by a fixture rather than chosen.
     *
     * ه + ة reproduces the published ha counts for suras 19 and 20 exactly.
     *
     * The alif class is every written form of alef, hamza included. This was
     * the whole of the alif gap, and it was not the per-word rule §8 Q4
     * assumed: the mode simply was not folding the hamza-carrying alifs, and
     * it was counting the superscript alef, which the published figures do not.
     * Fold أ إ آ ٱ and the two bare hamzas to alef, leave the superscript alef
     * to its toggle (off by default), and the الم grand total goes from 18,745
     * to 19,875 against a published 19,874. Sura 15's alif-lam-ra lands exactly.
     * The residuals that remain are single-digit and mixed-sign, which is what
     * an orthographic difference between two source texts looks like rather
     * than a rule still missing.
     *
     * Turning the superscript alef toggle on over-counts alif under this mode.
     * The toggle stays available because it is a question a researcher may want
     * to ask, but its default is the reproducing setting. */
    fold: {
      [CP.ALEF_WASLA]: CP.ALEF,
      [CP.ALEF_HAMZA]: CP.ALEF,
      [CP.ALEF_HAMZA_LOW]: CP.ALEF,
      [CP.ALEF_MADDA]: CP.ALEF,
      [CP.HAMZA]: CP.ALEF,
      [CP.HAMZA_ABOVE]: CP.ALEF,
      [CP.TEH_MARBUTA]: 'ه',
    },
    includeSuraBasmalahInInitials: true,
  },
  original: {
    label: 'Original (Uthmani)',
    countable: false,
    fold: {},
  },
}

/** Default toggle state. `on` is what the UI ships with; each entry maps the
 * codepoints it governs to what they become when the toggle is on. A governed
 * codepoint is dropped when its toggle is off, whatever the mode's fold says. */
export const DEFAULT_MARKS = [
  { id: 'hamza_on_line', on: true, cps: { [CP.HAMZA]: CP.HAMZA } },
  { id: 'superscript_alef', on: false, cps: { [CP.SUP_ALEF]: CP.ALEF } },
  { id: 'small_waw_yeh', on: false, cps: { [CP.SMALL_WAW]: CP.WAW, [CP.SMALL_YEH]: CP.YEH } },
  { id: 'silent_marked', on: true, cps: {} },
]

/**
 * Folds one word into a bare letter stream under a mode and a toggle set.
 * The shadda is always dropped: a doubled letter is written once and counted
 * once, which is what every published figure assumes.
 */
export function foldWord(uthmani, modeId, marks = DEFAULT_MARKS) {
  const mode = TEXT_MODES[modeId]
  if (!mode) throw new Error('unknown text mode: ' + modeId)
  const silentCounts = marks.find((m) => m.id === 'silent_marked')?.on !== false
  const chars = [...uthmani]
  let out = ''

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (ch === CP.SHADDA) continue
    if (ch === CP.SILENT) continue
    // a letter carrying the silent marker drops out when the toggle is off
    if (!silentCounts && chars[i + 1] === CP.SILENT) continue

    let governed = false
    let mapped = null
    for (const m of marks) {
      if (m.cps[ch] !== undefined) {
        governed = true
        if (m.on) mapped = m.cps[ch]
        break
      }
    }
    if (governed) {
      if (mapped !== null) {
        const folded = mode.fold[mapped] ?? mapped
        if (LETTER.test(folded)) out += folded
      }
      continue
    }

    if (ALWAYS_DROP.has(ch)) continue
    const folded = mode.fold[ch] ?? ch
    if (LETTER.test(folded)) out += folded
  }
  return out
}

/** The distinct letters a mode's fold can produce over a corpus. Used to
 * assert that Simplified29 really does resolve to 29. */
export function alphabetOf(streams) {
  const set = new Set()
  for (const s of streams) for (const ch of s) set.add(ch)
  return [...set].sort()
}

/* ── derived segmentation ─────────────────────────────────────────────── */

const WEAK = new Set([CP.WAW, CP.YEH, CP.ALEF, CP.HAMZA])
const SEG_FOLD = TEXT_MODES.simplified29.fold

/**
 * Splits a word into prefix / stem / suffix by walking its root's radicals
 * through the word's consonant skeleton in order.
 *
 * Two allowances take this from 84% to 98.8% of rooted words:
 *
 *   - a shadda-bearing letter may satisfy two consecutive identical radicals,
 *     because a geminate root (ر ب ب) is written once and doubled by the mark;
 *   - one weak radical (و ي ا ء) may be skipped, covering hollow and
 *     assimilated forms where the radical is elided in writing.
 *
 * Returns null when the root will not align, which is a signal to consult the
 * exception table rather than to guess.
 */
export function segmentWord(uthmani, root) {
  const skeleton = []
  for (const ch of uthmani) {
    if (ch === CP.SHADDA) {
      if (skeleton.length) skeleton[skeleton.length - 1].doubled = true
      continue
    }
    if (ch === CP.SILENT || ch === CP.SUP_ALEF || ALWAYS_DROP.has(ch)) continue
    const folded = SEG_FOLD[ch] ?? ch
    if (!LETTER.test(folded)) continue
    skeleton.push({ ch: folded, doubled: false })
  }

  const radicals = String(root).split(/\s+/).filter(Boolean)
  if (!radicals.length || !skeleton.length) return null

  const hits = []
  let cursor = 0
  let lastUsed = -1
  let weakSkipped = 0

  for (const radical of radicals) {
    const alternatives = WEAK.has(radical) ? WEAK : new Set([radical])
    // a doubled letter already consumed can stand in for the next identical radical
    if (lastUsed >= 0 && skeleton[lastUsed].doubled && alternatives.has(skeleton[lastUsed].ch)) {
      hits.push(lastUsed)
      lastUsed = -1
      continue
    }
    let found = -1
    for (let j = cursor; j < skeleton.length; j++) {
      if (alternatives.has(skeleton[j].ch)) { found = j; break }
    }
    if (found < 0) {
      if (WEAK.has(radical) && weakSkipped === 0) { weakSkipped++; continue }
      return null
    }
    hits.push(found)
    lastUsed = found
    cursor = found + 1
  }

  if (!hits.length) return null
  const first = Math.min(...hits)
  const last = Math.max(...hits)
  const letters = skeleton.map((s) => s.ch).join('')
  return {
    prefix: letters.slice(0, first),
    stem: letters.slice(first, last + 1),
    suffix: letters.slice(last + 1),
    weakSkipped,
  }
}

/* ── small numeric helpers the fixtures and the value engine share ─────── */
export const digitSum = (n) => String(n).split('').reduce((a, d) => a + Number(d), 0)
export const digitalRoot = (n) => { while (n > 9) n = digitSum(n); return n }
