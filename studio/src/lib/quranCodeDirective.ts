/**
 * The `::: qcvalue {…} :::` directive: the portable form a research finding
 * takes inside a note.
 *
 * Deliberately dependency-free. This is the contract that has to survive a note
 * being opened in any other Markdown editor, so it must not reach for Tauri,
 * TipTap or the IPC layer, and it stays testable outside the desktop build.
 *
 * The shape mirrors the Quran embed's own `::: quran {verses="1:1"} :::`, so a
 * note carries both kinds of block in the same idiom.
 */

export interface FindingAttributes {
  /** `33:33`, `chapter 33`, `corpus` — whatever the scope resolved to. */
  ref: string
  system: string
  mode: string
  value: number
  letters: number
  words: number
  /** The modifier ids that were on, comma-joined. Empty for a plain sum. */
  modifiers: string
  /** True when the mode has an unresolved rule, so the note can say so. */
  unverified: boolean
}

/** Attribute order is fixed so a round-trip is byte-for-byte and a note does
 * not churn in git every time it is opened. */
export const FINDING_ATTRS = [
  'ref',
  'system',
  'mode',
  'value',
  'letters',
  'words',
  'modifiers',
  'unverified',
] as const

const ATTR = /(\w+)="([^"]*)"/g
const DIRECTIVE = /^:::\s*qcvalue\s*\{([^}]*)\}\s*:::$/

export function serializeFinding(attrs: FindingAttributes): string {
  const pairs: [string, string | number][] = [
    ['ref', attrs.ref],
    ['system', attrs.system],
    ['mode', attrs.mode],
    ['value', attrs.value],
    ['letters', attrs.letters],
    ['words', attrs.words],
  ]
  // Optional attributes are omitted rather than written empty, so the common
  // case stays short and a diff shows only what actually changed.
  if (attrs.modifiers) pairs.push(['modifiers', attrs.modifiers])
  if (attrs.unverified) pairs.push(['unverified', 'true'])
  const body = pairs.map(([k, v]) => `${k}="${String(v).replace(/"/g, '')}"`).join(' ')
  return `::: qcvalue {${body}} :::`
}

export function parseFinding(directive: string): FindingAttributes | null {
  const inner = DIRECTIVE.exec(directive.trim())
  if (!inner) return null
  const found: Record<string, string> = {}
  for (const [, key, value] of inner[1].matchAll(ATTR)) found[key] = value
  // A finding without a scope is not a finding; refuse rather than render a
  // block whose provenance is missing.
  if (!found.ref) return null
  return {
    ref: found.ref,
    system: found.system ?? '',
    mode: found.mode ?? '',
    value: Number(found.value ?? 0),
    letters: Number(found.letters ?? 0),
    words: Number(found.words ?? 0),
    modifiers: found.modifiers ?? '',
    unverified: found.unverified === 'true',
  }
}
