import { Check } from '@phosphor-icons/react'
import type { ToggleId, ToggleInfo, Toggles } from '../../lib/quranCode'

/** The glyph shown beside each toggle. Drawn from the codepoint the toggle
 * governs, so the control is recognisable to anyone coming from the old app,
 * whose Statistics header carries the same row. */
const GLYPH: Record<string, string> = {
  hamza_on_line: 'ء',
  superscript_alef: 'ٰ',
  small_waw_yeh: 'ۥ',
  silent_marked: '۟',
}

interface MarkToggleRowProps {
  specs: ToggleInfo[]
  toggles: Toggles
  /** How many times each governed mark occurs in the current scope. A toggle
   * that cannot change anything here says so rather than looking broken. */
  occurrences?: Partial<Record<ToggleId, number>>
  onToggle: (id: ToggleId) => void
}

/**
 * Whether a hamza counts as a letter is a checkbox, not a constant.
 *
 * The row is driven entirely by `text_modes.json`: the ids, the labels and the
 * defaults all come from the bundled config, and nothing in the frontend or the
 * Rust backend decides what a mark means. When the alif rule is finally pinned
 * down it lands in that file, and this row picks it up.
 */
export default function MarkToggleRow({ specs, toggles, occurrences, onToggle }: MarkToggleRowProps) {
  const inert = specs.filter((s) => occurrences?.[s.id] === 0)

  return (
    <div className="flex flex-col gap-0.5">
      {specs.map((spec) => {
        const on = toggles[spec.id]
        const count = occurrences?.[spec.id]
        return (
          <button
            key={spec.id}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(spec.id)}
            title={
              count === 0
                ? `${spec.label}. No such mark in this scope, so this changes nothing here.`
                : spec.label
            }
            className="tactile flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left transition-colors hover:bg-ed-surface-strong"
          >
            <span
              aria-hidden
              className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-[3px] border ${
                on
                  ? 'border-ed-accent bg-ed-accent text-ed-on-accent'
                  : 'border-ed-rule-strong bg-ed-surface-raised text-transparent'
              }`}
            >
              <Check size={9} weight="bold" />
            </span>
            <span aria-hidden className="w-4 shrink-0 text-center font-arabic text-base text-ed-fg">
              {GLYPH[spec.id] ?? '·'}
            </span>
            <span
              className={`flex-1 text-[11px] leading-tight ${
                on ? 'text-ed-fg' : 'text-ed-fg-secondary'
              }`}
            >
              {spec.label}
            </span>
            {count !== undefined && (
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-ed-fg-muted">{count}</span>
            )}
          </button>
        )
      })}

      {inert.length > 0 && (
        <p className="mt-1 px-1.5 text-[11px] leading-snug text-ed-fg-muted">
          No {inert.map((s) => s.label.replace(/ as letter$/i, '').toLowerCase()).join(', ')} in this
          scope, so {inert.length > 1 ? 'those toggles change' : 'that toggle changes'} nothing here.
        </p>
      )}
    </div>
  )
}
