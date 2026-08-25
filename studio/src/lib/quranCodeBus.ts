import type { Editor } from '@tiptap/react'
import { getActiveEditor } from './mediaBus'
import { fmt, type Counts, type Provenance, type ValueResult } from './quranCode'
import { serializeFinding, type FindingAttributes } from './quranCodeDirective'

/**
 * Carries a finding from the research surface into whichever note is being
 * written.
 *
 * The surface and the editor are siblings in the layout, so this reuses the
 * active-editor registry `mediaBus` already maintains: each editor pane claims
 * the slot on mount and on focus, so a citation lands in the pane the
 * researcher is actually working in rather than in whichever one mounted first.
 * There is no second registry, because there is no second answer to "which
 * editor is live".
 */

/* The directive format lives in `quranCodeDirective`, which has no imports at
   all: it is the contract a note carries into other editors, so it must not
   depend on Tauri or TipTap. Re-exported here so callers have one import. */
export {
  serializeFinding,
  parseFinding,
  FINDING_ATTRS,
  type FindingAttributes,
} from './quranCodeDirective'

function attributesFrom(
  provenance: Provenance,
  value: number,
  letters: number,
  words: number,
  modifiers: string[]
): FindingAttributes {
  return {
    ref: provenance.scope,
    system: provenance.value_system ?? 'none',
    mode: provenance.text_mode,
    value,
    letters,
    words,
    modifiers: modifiers.join(','),
    unverified: provenance.known_gaps.length > 0,
  }
}

export function findingFromValue(result: ValueResult, words: number): FindingAttributes {
  return attributesFrom(result.provenance, result.value, result.letters, words, result.modifiers)
}

export function findingFromCounts(counts: Counts): FindingAttributes {
  return attributesFrom(
    counts.provenance,
    counts.value ?? 0,
    counts.letters,
    counts.words,
    []
  )
}

/**
 * Inserts a finding at the cursor of the live editor pane.
 *
 * Returns false rather than throwing when there is no editable pane, because
 * the caller is a keyboard shortcut and a silent no-op is better than an
 * exception when the researcher has the surface open on its own.
 */
export function insertFinding(attrs: FindingAttributes, editor?: Editor | null): boolean {
  const target = editor ?? getActiveEditor()
  if (!target || target.isDestroyed || !target.isEditable) return false
  target.chain().focus().insertContent(`${serializeFinding(attrs)}\n\n`).run()
  return true
}

/** A one-line prose form for the clipboard, for pasting somewhere that is not a
 * Studio note. Same information, no directive syntax. */
export function findingAsProse(attrs: FindingAttributes): string {
  const parts = [
    `${attrs.ref}:`,
    `${fmt(attrs.letters)} letters`,
    `${fmt(attrs.words)} words`,
    `value ${fmt(attrs.value)}`,
  ]
  const tail = [attrs.mode, attrs.system, attrs.modifiers && `modifiers: ${attrs.modifiers}`]
    .filter(Boolean)
    .join(' / ')
  return `${parts.join(', ')} [${tail}${attrs.unverified ? ' / UNVERIFIED' : ''}]`
}

/* ── the surface's own cite action ───────────────────────────────────── */

/* The keyboard shortcut lives in App, which has no view of the surface's
   current figure, and the surface is rendered several layers down inside a
   resizable panel. Rather than thread a ref through WorkspaceLayout for one
   callback, the surface parks its action here while mounted. There is only ever
   one surface, so there is only ever one slot. */
let citeAction: (() => void) | null = null

export function registerCiteAction(action: (() => void) | null) {
  citeAction = action
}

/** Returns false when no surface is mounted, so the shortcut can stay quiet
 * rather than erroring while the researcher is only writing. */
export function citeCurrentFinding(): boolean {
  if (!citeAction) return false
  citeAction()
  return true
}

/* ── CSV export ──────────────────────────────────────────────────────── */

const csvCell = (value: string | number): string => {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n'
}
