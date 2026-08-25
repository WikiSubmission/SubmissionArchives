import { useState } from 'react'
import { CaretDown, CaretRight, Warning } from '@phosphor-icons/react'
import {
  MODIFIER_IDS,
  divisibility,
  fmt,
  type ModifierId,
  type Modifiers,
  type PresetInfo,
  type ValueResult,
} from '../../lib/quranCode'

interface ValueCalculatorProps {
  result: ValueResult | null
  presets: PresetInfo[]
  preset: string
  modifiers: Modifiers
  divisor: number
  onPresetChange: (id: string) => void
  onModifierToggle: (id: ModifierId) => void
}

/** What each flag actually adds, in the researcher's terms rather than the
 * field name's. The grouping is by the level it acts on, which is how the
 * original app's matrix is organised too. */
const MODIFIER_COPY: Record<ModifierId, { group: string; label: string }> = {
  letter_number: { group: 'Letter', label: 'Number in the Quran' },
  letter_number_in_word: { group: 'Letter', label: 'Number in its word' },
  letter_number_in_verse: { group: 'Letter', label: 'Number in its verse' },
  letter_number_in_chapter: { group: 'Letter', label: 'Number in its chapter' },
  letter_distance: { group: 'Letter', label: 'Distance to the previous letter' },
  word_number: { group: 'Word', label: 'Number in the Quran' },
  word_number_in_verse: { group: 'Word', label: 'Number in its verse' },
  word_number_in_chapter: { group: 'Word', label: 'Number in its chapter' },
  word_distance: { group: 'Word', label: 'Distance to the previous word' },
  verse_number: { group: 'Verse', label: 'Number in the Quran' },
  verse_number_in_chapter: { group: 'Verse', label: 'Number in its chapter' },
  verse_distance: { group: 'Verse', label: 'Distance to the previous verse' },
  chapter_number: { group: 'Chapter', label: 'Number' },
  chapter_distance: { group: 'Chapter', label: 'Distance to the previous chapter' },
}

const GROUPS = ['Letter', 'Word', 'Verse', 'Chapter'] as const

/**
 * The gematria readout, and the modifier matrix behind a disclosure.
 *
 * The original app puts all of these on screen at once as a grid of checkboxes.
 * That is a search space of roughly sixteen thousand combinations with nothing
 * to say which are meaningful, and a tool that will produce a different number
 * for any of them answers whatever question you came with.
 *
 * So presets come first and the raw matrix sits behind "Custom", which says out
 * loud what it is. When a custom combination is active the readout labels it,
 * and the copied figure carries the full set, because a value quoted without
 * its modifiers is not reproducible.
 */
export default function ValueCalculator({
  result,
  presets,
  preset,
  modifiers,
  divisor,
  onPresetChange,
  onModifierToggle,
}: ValueCalculatorProps) {
  const [open, setOpen] = useState(false)
  const custom = preset === 'custom'
  const activeCount = MODIFIER_IDS.filter((id) => modifiers[id]).length

  return (
    <div className="flex flex-col gap-2.5">
      <select
        aria-label="Modifier preset"
        value={preset}
        onChange={(e) => onPresetChange(e.target.value)}
        className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 font-mono text-[11px] font-medium text-ed-fg shadow-xs outline-none transition-colors focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
      >
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom…</option>
      </select>

      {result && (
        <div className="flex flex-col divide-y divide-ed-rule">
          <div className="flex items-baseline justify-between gap-2 py-1.5">
            <span className="text-[12px] font-medium text-ed-fg-secondary">Value</span>
            <span
              className={`font-mono text-[18px] font-bold tabular-nums ${
                divisibility(result.value, divisor).exact ? 'text-ed-gold' : 'text-ed-fg'
              }`}
            >
              {fmt(result.value)}
            </span>
          </div>

          <Row label="Digit sum" value={fmt(result.digit_sum)} />
          <Row label="Digital root" value={fmt(result.digital_root)} />
          <Row
            label={`÷ ${divisor}`}
            value={
              divisibility(result.value, divisor).exact
                ? `${fmt(divisibility(result.value, divisor).quotient)} × ${divisor}`
                : (result.value / divisor).toFixed(2)
            }
            gold={divisibility(result.value, divisor).exact}
          />

          <div className="flex flex-wrap items-center gap-1.5 py-2">
            {result.is_prime && (
              <span className="rounded border border-ed-gold/50 bg-ed-gold-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ed-gold shadow-2xs">
                prime
              </span>
            )}
            {result.divisors.map((d) => (
              <span
                key={d}
                className="rounded border border-ed-rule-strong bg-ed-surface-raised px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-ed-fg-secondary shadow-2xs"
              >
                ÷{d}
              </span>
            ))}
            {!result.is_prime && result.divisors.length === 0 && (
              <span className="font-mono text-[10px] text-ed-fg-muted">
                no small prime divisor
              </span>
            )}
          </div>

          {custom && (
            <div className="flex gap-2 rounded border border-ed-danger/30 bg-ed-danger-soft p-2 text-[11px] leading-snug text-ed-fg-secondary">
              <Warning size={13} weight="fill" className="mt-0.5 shrink-0 text-ed-danger" />
              <span>
                Custom combination: {activeCount} of {MODIFIER_IDS.length} modifiers active. Cite full modifier set for reproducibility.
              </span>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tactile flex items-center gap-1.5 rounded px-1 py-1 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted transition-colors hover:text-ed-fg"
      >
        {open ? <CaretDown size={11} weight="bold" /> : <CaretRight size={11} weight="bold" />}
        <span>Modifiers</span>
        <span className="ml-auto rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 font-mono text-[9px] font-normal tracking-normal text-ed-fg-muted">
          {activeCount} / {MODIFIER_IDS.length} active
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 rounded-md border border-ed-rule bg-ed-surface-raised p-2.5 shadow-2xs">
          <p className="text-[10.5px] leading-snug text-ed-fg-muted">
            Modifiers add position or distance values per letter. Custom choices override presets.
          </p>
          {GROUPS.map((group) => (
            <fieldset key={group} className="flex flex-col gap-1">
              <legend className="w-full border-b border-ed-rule/60 pb-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                {group}
              </legend>
              {MODIFIER_IDS.filter((id) => MODIFIER_COPY[id].group === group).map((id) => (
                <label
                  key={id}
                  className="tactile flex cursor-pointer items-center gap-2 rounded px-1.5 py-0.5 transition-colors hover:bg-ed-surface"
                >
                  <input
                    type="checkbox"
                    checked={modifiers[id]}
                    onChange={() => onModifierToggle(id)}
                    className="h-3.5 w-3.5 accent-[var(--ed-accent)]"
                  />
                  <span
                    className={`text-[11px] leading-tight ${
                      modifiers[id] ? 'font-medium text-ed-fg' : 'text-ed-fg-secondary'
                    }`}
                  >
                    {MODIFIER_COPY[id].label}
                  </span>
                </label>
              ))}
            </fieldset>
          ))}
          <p className="border-t border-ed-rule pt-1.5 text-[10px] leading-snug text-ed-fg-muted">
            5 additional division modifiers (page, station, part, group, bowing) arrive in 9g.
          </p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5">
      <span className="text-[12px] text-ed-fg-secondary">{label}</span>
      <span
        className={`font-mono text-[12.5px] font-semibold tabular-nums ${
          gold ? 'text-ed-gold' : 'text-ed-fg'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
