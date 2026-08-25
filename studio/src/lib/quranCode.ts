/**
 * Typed access to the `qc_*` IPC surface.
 *
 * The shapes below mirror `src-tauri/src/qurancode.rs` field for field. They
 * are hand-written rather than generated because there are eight of them and a
 * codegen step would be more machinery than the drift it prevents, but they are
 * the one place to change when the Rust structs change.
 *
 * The important thing this file establishes is that **no count arrives without
 * its provenance**. `Counts` carries the mode, the toggles, the scope and the
 * mode's verification state, so a component cannot render a number and forget
 * to say what produced it.
 */
import { safeInvoke as invoke } from './ipc'

/** The sentinel path the QuranCode surface opens under. It is not a file, and
 * `fileKindOf` knows that, which is what keeps the editor and the status bar
 * out of the way while still giving the surface a tab, history and a place in
 * the split view. */
export const QC_TAB_PATH = 'qc://workspace'

export interface Toggles {
  hamza_on_line: boolean
  superscript_alef: boolean
  small_waw_yeh: boolean
  silent_marked: boolean
}

export type ToggleId = keyof Toggles

export interface Provenance {
  text_mode: string
  text_mode_label: string
  value_system: string | null
  scope: string
  toggles: Toggles
  include_basmalah: boolean
  /** Non-empty means the mode cannot reproduce some published figure. The UI
   * must not present an affected number as authoritative. */
  known_gaps: string[]
  verified: string[]
}

export interface Counts {
  chapters: number
  verses: number
  words: number
  letters: number
  unique_letters: number
  value: number | null
  digit_sum: number | null
  digital_root: number | null
  provenance: Provenance
}

export interface LetterStat {
  letter: string
  count: number
  sum_positions: number
  sum_distances: number
}

export interface WordView {
  position: number
  uthmani: string
  folded: string
  letters: number
  gloss: string
  translit: string
  canonical: boolean
}

export interface VerseView {
  chapter: number
  verse: number
  english: string
  words: WordView[]
  provenance: Provenance
  /** The part, group, quarter, station, bowing and page this verse sits in. */
  divisions: VerseDivisions | null
}

export interface ChapterView {
  chapter: number
  name_arabic: string
  name_english: string
  name_transliterated: string
  revelation_order: number
  verses: VerseView[]
  /** The unnumbered Basmalah where the chapter has one. Kept apart from
   * `verses` because it is not verse 1 and must never be counted as one. */
  basmalah: VerseView | null
  provenance: Provenance
}

export interface SelectionValue {
  /** What the selection folded to, so the researcher sees what was measured
   * rather than only what was highlighted. */
  folded: string
  letters: number
  words: number
  unique_letters: number
  value: number
  digit_sum: number
  digital_root: number
  is_prime: boolean
  divisors: number[]
  provenance: Provenance
}

export interface ModeInfo {
  id: string
  label: string
  countable: boolean
  include_basmalah_in_initials: boolean
  verified: string[]
  known_gaps: string[]
  alphabet: string | null
}

export interface ToggleInfo {
  id: ToggleId
  label: string
  default: boolean
}

/** The six ways a mushaf is divided. Lowercase because these are the wire
 * values the Rust side deserializes. */
export type DivisionKind = 'part' | 'group' | 'quarter' | 'station' | 'bowing' | 'page'

/** One division picked by kind and number. A division is an address *range*,
 * which is why it cannot be expressed by `Scope`'s chapter/verse/word fields. */
export interface DivisionRef {
  kind: DivisionKind
  number: number
}

export interface DivisionKindInfo {
  id: DivisionKind
  label: string
  count: number
}

/** Which division of each kind a verse sits in. Absent for the 112 unnumbered
 * Basmalahs, which have no address and so belong to no division. */
export interface VerseDivisions {
  part: number
  group: number
  quarter: number
  station: number
  bowing: number
  page: number
}

export interface ChapterInfo {
  number: number
  verses: number
  revelation_order: number
  /** `Makkah` or `Medina`, from Tanzil. Never blank. */
  revelation_place: string
  name_arabic: string
  name_english: string
  name_transliterated: string
  /** The Quranic Initials prefixing this sura, empty for the 85 that carry
   * none. Empty is a fact about the sura, not missing data. */
  initials: string
}

export interface ValueSystemInfo {
  id: string
  name: string
  author: string | null
  text_mode: string
  note: string
}

export interface Modifiers {
  letter_number: boolean
  letter_number_in_word: boolean
  letter_number_in_verse: boolean
  letter_number_in_chapter: boolean
  letter_distance: boolean
  word_number: boolean
  word_number_in_verse: boolean
  word_number_in_chapter: boolean
  word_distance: boolean
  verse_number: boolean
  verse_number_in_chapter: boolean
  verse_distance: boolean
  chapter_number: boolean
  chapter_distance: boolean
}

export type ModifierId = keyof Modifiers

/** Declaration order, which is also the order the readout lists them and the
 * order the Rust side reports the active set in. */
export const MODIFIER_IDS: ModifierId[] = [
  'letter_number', 'letter_number_in_word', 'letter_number_in_verse',
  'letter_number_in_chapter', 'letter_distance',
  'word_number', 'word_number_in_verse', 'word_number_in_chapter', 'word_distance',
  'verse_number', 'verse_number_in_chapter', 'verse_distance',
  'chapter_number', 'chapter_distance',
]

/** Spelled out rather than built from `MODIFIER_IDS`, so that adding a field to
 * `Modifiers` without adding it here is a type error rather than a silently
 * missing key. */
export const NO_MODIFIERS: Modifiers = {
  letter_number: false,
  letter_number_in_word: false,
  letter_number_in_verse: false,
  letter_number_in_chapter: false,
  letter_distance: false,
  word_number: false,
  word_number_in_verse: false,
  word_number_in_chapter: false,
  word_distance: false,
  verse_number: false,
  verse_number_in_chapter: false,
  verse_distance: false,
  chapter_number: false,
  chapter_distance: false,
}

export interface PresetInfo {
  id: string
  label: string
  modifiers: Modifiers
}

export interface ValueBreakdown {
  letter: string
  base: number
  added: number
  total: number
  chapter: number
  verse: number
  word: number
  position_in_word: number
}

export interface ValueResult {
  value: number
  letters: number
  digit_sum: number
  digital_root: number
  is_prime: boolean
  divisors: number[]
  breakdown: ValueBreakdown[]
  breakdown_truncated: boolean
  modifiers: ModifierId[]
  provenance: Provenance
}

export interface Metadata {
  presets: PresetInfo[]
  modes: ModeInfo[]
  toggles: ToggleInfo[]
  chapters: ChapterInfo[]
  value_systems: ValueSystemInfo[]
  default_mode: string
  corpus: Counts
  /** The six kinds and how many of each, so no component hardcodes that a
   * mushaf has 604 pages. */
  divisions: DivisionKindInfo[]
  prostrations: number
}

export interface Scope {
  chapter?: number | null
  verse?: number | null
  word?: number | null
  include_basmalah?: boolean | null
  /** One traditional division. An address range rather than a prefix, so it
   * cannot be said with the fields above. */
  division?: DivisionRef
}

/* ── calls ───────────────────────────────────────────────────────────── */

export const qcMetadata = () => invoke<Metadata>('qc_metadata')

export const qcGetVerse = (chapter: number, verse: number, mode?: string, toggles?: Toggles) =>
  invoke<VerseView>('qc_get_verse', { chapter, verse, mode, toggles })

/** Returns one entry per countable mode, always. Comparison is the default
 * view in the readout rather than something the researcher toggles between and
 * has to hold in their head. */
export const qcCount = (scope: Scope, toggles?: Toggles, valueSystem?: string) =>
  invoke<Counts[]>('qc_count', { scope, toggles, valueSystem })

export const qcGetChapter = (chapter: number, mode?: string, toggles?: Toggles) =>
  invoke<ChapterView>('qc_get_chapter', { chapter, mode, toggles })

/** Counts and values an arbitrary run of Arabic, which is what a mouse
 * selection resolves to. */
export const qcValueOfText = (text: string, mode?: string, toggles?: Toggles, valueSystem?: string) =>
  invoke<SelectionValue>('qc_value_of_text', { text, mode, toggles, valueSystem })

export const qcLetterFrequency = (scope: Scope, mode?: string, toggles?: Toggles) =>
  invoke<LetterStat[]>('qc_letter_frequency', { scope, mode, toggles })

export const qcComputeValue = (
  scope: Scope,
  valueSystem: string,
  modifiers: Modifiers,
  mode?: string,
  toggles?: Toggles
) => invoke<ValueResult>('qc_compute_value', { scope, mode, toggles, valueSystem, modifiers })

/* ── search ──────────────────────────────────────────────────────────── */

export type MatchKind = 'exact' | 'proximity' | 'root'
export type MatchLocation = 'anywhere' | 'at_start' | 'at_middle' | 'at_end'
export type Wordness = 'whole_word' | 'part_of_word'
export type SimilarityMethod = 'similar_text' | 'similar_words' | 'similar_start' | 'similar_end'
export type NumberTarget = 'value' | 'letters' | 'words' | 'unique_letters'

export interface SearchOptions {
  kind?: MatchKind
  location?: MatchLocation
  wordness?: Wordness
  scope?: Scope
  mode?: string
  toggles?: Toggles
  limit?: number
}

export interface VerseHit {
  chapter: number
  verse: number
  english: string
  /** Word positions that matched, so a hit marks the words rather than the
   * whole verse. Empty for similarity and number queries, which match a verse
   * as a unit. */
  matches: number[]
  words: number
  letters: number
  arabic: string
  score: number
}

export interface SearchResult {
  hits: VerseHit[]
  total: number
  truncated: boolean
  provenance: Provenance
}

export interface WordInfo {
  chapter: number
  verse: number
  position: number
  uthmani: string
  folded: string
  gloss: string
  translit: string
  roots: string[]
  root_occurrences: number
}

export interface RootInfo {
  root: string
  occurrences: number
}

export const qcFindText = (query: string, options: SearchOptions) =>
  invoke<SearchResult>('qc_find_text', { query, options })

export const qcSimilarity = (
  chapter: number,
  verse: number,
  method: SimilarityMethod,
  threshold: number,
  mode?: string,
  toggles?: Toggles,
  limit?: number
) => invoke<SearchResult>('qc_similarity', { chapter, verse, method, threshold, mode, toggles, limit })

export const qcFindByNumber = (
  target: number,
  quantity: NumberTarget,
  valueSystem?: string,
  mode?: string,
  toggles?: Toggles,
  limit?: number
) =>
  invoke<SearchResult>('qc_find_by_number', {
    target,
    quantity,
    valueSystem,
    mode,
    toggles,
    limit,
  })

export const qcWordInfo = (chapter: number, verse: number, position: number, mode?: string, toggles?: Toggles) =>
  invoke<WordInfo>('qc_word_info', { chapter, verse, position, mode, toggles })

/* ── aggregation ───────────────────────────────────────────────────────── */

/** Which word instances an aggregate runs over. Fields intersect, and an empty
 * query is the whole corpus. `Scope` alone cannot express a span that crosses
 * chapters or a verse number taken across every chapter at once, which is what
 * the published arguments actually select. */
export interface AggregateQuery {
  text?: string
  whole_word?: boolean
  root_id?: number
  from?: [number, number]
  to?: [number, number]
  /** Word position inside `from` / `to`, for a span that begins or ends
   * part-way through a verse. Ignored unless the matching bound is set. */
  from_word?: number
  to_word?: number
  verse_number?: number
  /** `Makkah` or `Medina`. */
  revelation_place?: string
  /** True keeps only the fifteen verses of prostration, false excludes them. */
  prostration?: boolean
  /** True keeps only suras carrying Quranic Initials, false only those with
   * none. A property of the sura, so it cannot be a text filter. */
  initialed?: boolean
  chapters?: number[]
  /** Letters to count inside the selected words. Absent counts them all. */
  letters?: string
  scope?: Scope
}

/** One total with its divisibility test already applied. The readout renders a
 * row per figure, so no figure can reach the screen without its remainder. */
export interface Figure {
  id: string
  label: string
  total: number
  exact: boolean
  quotient: number
  remainder: number
  digit_sum: number
  digital_root: number
}

export interface Aggregate {
  provenance: Provenance
  divisor: number
  /** What was selected, in words. Provenance says how it was counted; a figure
   * needs both before anyone else can check it. */
  selector: string
  occurrences: number
  verses: number
  chapters: number
  letters: number
  value: number | null
  first: string | null
  last: string | null
  examples: string[]
  figures: Figure[]
}

export const qcAggregate = (
  query: AggregateQuery,
  mode?: string,
  toggles?: Toggles,
  valueSystem?: string,
  divisor?: number
) =>
  invoke<Aggregate>('qc_aggregate', {
    query,
    mode,
    toggles,
    valueSystem: valueSystem === 'none' ? undefined : valueSystem,
    divisor,
  })

/* ── the fixture ledger ────────────────────────────────────────────────── */

/** One published figure, what this corpus computes for it, and whether they
 * agree. The generator refuses to write a dataset where a `verified` entry
 * drifts, so a verified row is true of the bytes in this binary. */
export interface Fixture {
  id: string
  mode: string
  description: string
  expected: number
  actual: number
  pass: boolean
  status: 'verified' | 'known_gap'
  /** Where the published figure comes from, as `appendix-1 s67`. Empty when the
   * fixture is a property of the corpus rather than a quotation. */
  source: string
}

/** One "N is 19 x M" from the appendices, extracted rather than transcribed.
 * Most are not automatically checkable, because the selector lives in the
 * surrounding prose. The catalogue makes the unchecked ones visible instead of
 * letting the checked ones look like the whole set. */
export interface Claim {
  appendix: string
  section: number
  total: number
  multiplier: number
  context: string
  checked: boolean
}

export interface Ledger {
  fixtures: Fixture[]
  verified: number
  known_gaps: number
  /** Summed absolute difference across the gaps. The count alone is a poor
   * measure, because a fixture that nearly reproduces raises it. */
  distance: number
  /** How many claims the appendices make, so the verified count has a
   * denominator rather than standing alone. */
  claims: number
}

export const qcLedger = () => invoke<Ledger>('qc_ledger')
export const qcClaims = () => invoke<Claim[]>('qc_claims')

export const qcRoots = () => invoke<RootInfo[]>('qc_roots')



/* ── formatting ──────────────────────────────────────────────────────── */

/** Every numeral in this module is typeset, not printed: grouped, tabular, and
 * in the mono face the archive already uses for references and timestamps. */
export const fmt = (n: number | null | undefined): string =>
  n === null || n === undefined ? '—' : n.toLocaleString('en-US')

/** Whether a total divides by the active divisor, and by how much. Returned
 * rather than rendered so the caller decides how loud to be about it. */
export function divisibility(total: number, divisor: number): { exact: boolean; quotient: number } {
  return { exact: divisor > 0 && total % divisor === 0, quotient: divisor > 0 ? total / divisor : 0 }
}

/** A citation line for the clipboard. It names the convention because a letter
 * count without one is not a fact, and the whole module is built on that. */
export function citationOf(counts: Counts, divisor: number): string {
  const p = counts.provenance
  const parts = [
    `${p.scope}`,
    `${fmt(counts.letters)} letters`,
    `${fmt(counts.words)} words`,
  ]
  if (counts.value !== null) parts.push(`value ${fmt(counts.value)}`)
  const { exact, quotient } = divisibility(counts.value ?? counts.letters, divisor)
  if (exact) parts.push(`= ${fmt(quotient)} × ${divisor}`)
  const marks = (Object.entries(p.toggles) as [ToggleId, boolean][])
    .filter(([, on]) => on)
    .map(([id]) => id)
    .join(', ')
  return (
    `${parts.join(', ')} ` +
    `[${p.text_mode_label}${p.value_system ? ' / ' + p.value_system : ''}` +
    `${marks ? ' / marks: ' + marks : ''}` +
    `${p.known_gaps.length ? ' / UNVERIFIED' : ''}]`
  )
}
