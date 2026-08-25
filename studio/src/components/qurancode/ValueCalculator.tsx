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
    <div className="flex flex-col gap-2">
      <select
        aria-label="Modifier preset"
        value={preset}
        onChange={(e) => onPresetChange(e.target.value)}
        className="w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 py-1.5 font-mono text-[12px] text-ed-fg"
      >
        {presets.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
        <option value="custom">Custom…</option>
      </select>

      {result && (
        <>
          <div className="flex items-baseline justify-between gap-2 border-b border-ed-rule py-1">
            <span className="text-[12px] text-ed-fg-secondary">Value</span>
            <span
              className={`font-mono text-[17px] font-semibold tabular-nums ${
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

          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {result.is_prime && (
              <span className="rounded-sm border border-ed-gold/45 bg-ed-gold-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide text-ed-gold">
                prime
              </span>
            )}
            {result.divisors.map((d) => (
              <span
                key={d}
                className="rounded-sm border border-ed-rule-strong px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ed-fg-secondary"
              >
                ÷{d}
              </span>
            ))}
            {!result.is_prime && result.divisors.length === 0 && (
              <span className="font-mono text-[10px] text-ed-fg-muted">
                no small prime divides it
              </span>
            )}
          </div>

          {custom && (
            <p className="flex gap-1.5 rounded-sm border border-ed-danger/35 bg-ed-danger-soft px-1.5 py-1 text-[11px] leading-snug text-ed-fg-secondary">
              <Warning size={13} weight="fill" className="mt-0.5 shrink-0 text-ed-danger" />
              <span>
                Custom combination of {activeCount} of {MODIFIER_IDS.length} modifiers. Any figure
                from it is only meaningful alongside the set that produced it.
              </span>
            </p>
          )}
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="tactile flex items-center gap-1 rounded-sm px-0.5 py-1 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-ed-fg-muted hover:text-ed-fg"
      >
        {open ? <CaretDown size={11} weight="bold" /> : <CaretRight size={11} weight="bold" />}
        Modifiers
        <span className="ml-1 normal-case tracking-normal text-ed-fg-faint">
          {activeCount} of {MODIFIER_IDS.length} on
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-2 rounded-md border border-ed-rule bg-ed-surface p-2">
          <p className="text-[11px] leading-snug text-ed-fg-muted">
            Each adds one number per letter on top of the letter&rsquo;s own value. Changing any of
            them switches the preset to Custom.
          </p>
          {GROUPS.map((group) => (
            <fieldset key={group} className="flex flex-col gap-0.5">
              <legend className="font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                {group}
              </legend>
              {MODIFIER_IDS.filter((id) => MODIFIER_COPY[id].group === group).map((id) => (
                <label
                  key={id}
                  className="tactile flex cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-ed-surface-strong"
                >
                  <input
                    type="checkbox"
                    checked={modifiers[id]}
                    onChange={() => onModifierToggle(id)}
                    className="h-3 w-3 accent-[var(--ed-accent)]"
                  />
                  <span
                    className={`text-[11px] leading-tight ${
                      modifiers[id] ? 'text-ed-fg' : 'text-ed-fg-secondary'
                    }`}
                  >
                    {MODIFIER_COPY[id].label}
                  </span>
                </label>
              ))}
            </fieldset>
          ))}
          <p className="border-t border-ed-rule pt-1.5 text-[11px] leading-snug text-ed-fg-muted">
            Five more exist in the original app, keyed to the page, station, part, group, quarter and
            bowing divisions. Those arrive with the division metadata in 9g.
          </p>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-ed-rule py-1 last:border-b-0">
      <span className="text-[12px] text-ed-fg-secondary">{label}</span>
      <span
        className={`font-mono text-[13px] font-semibold tabular-nums ${
          gold ? 'text-ed-gold' : 'text-ed-fg'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
