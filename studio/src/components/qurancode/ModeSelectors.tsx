import { SealCheck, Warning } from '@phosphor-icons/react'
import type { ModeInfo, ValueSystemInfo } from '../../lib/quranCode'

interface ModeSelectorsProps {
  modes: ModeInfo[]
  valueSystems: ValueSystemInfo[]
  mode: string
  valueSystem: string
  includeBasmalah: boolean
  onModeChange: (id: string) => void
  onValueSystemChange: (id: string) => void
  onIncludeBasmalahChange: (on: boolean) => void
}

/**
 * The text mode and the value system, pinned to the foot of the query pane.
 *
 * They are not settings and they do not belong in a settings modal. Because
 * there is no single true letter count, the mode is part of every question
 * asked, so it stays visible next to the question rather than being something
 * the researcher configured once and forgot.
 *
 * The selected mode's verification state sits directly underneath, which is the
 * cheapest place to learn that a mode has an unresolved rule: before running
 * the query, not after quoting the answer.
 */
export default function ModeSelectors({
  modes,
  valueSystems,
  mode,
  valueSystem,
  includeBasmalah,
  onModeChange,
  onValueSystemChange,
  onIncludeBasmalahChange,
}: ModeSelectorsProps) {
  const active = modes.find((m) => m.id === mode)
  const gaps = active?.known_gaps ?? []

  return (
    <div className="flex shrink-0 flex-col gap-2.5 border-t border-ed-rule bg-ed-surface p-2.5">
      <Field label="Text mode">
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value)}
          className="w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 py-1.5 font-mono text-[12px] text-ed-fg"
        >
          {modes.map((m) => (
            <option key={m.id} value={m.id} disabled={!m.countable}>
              {m.label}
              {m.countable ? '' : ' — display only'}
            </option>
          ))}
        </select>
      </Field>

      {active && (
        <div className="flex items-start gap-1.5 px-0.5">
          {gaps.length === 0 ? (
            <>
              <SealCheck size={13} weight="fill" className="mt-0.5 shrink-0 text-ed-success" />
              <p className="text-[11px] leading-snug text-ed-fg-secondary">
                Verified against {active.verified.length} published figures.
              </p>
            </>
          ) : (
            <>
              <Warning size={13} weight="fill" className="mt-0.5 shrink-0 text-ed-danger" />
              <p className="text-[11px] leading-snug text-ed-fg-secondary">
                {gaps.length} unresolved {gaps.length === 1 ? 'rule' : 'rules'}. Affected figures are
                marked, not presented as authoritative.
              </p>
            </>
          )}
        </div>
      )}

      <Field label="Value system">
        <select
          value={valueSystem}
          onChange={(e) => onValueSystemChange(e.target.value)}
          className="w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 py-1.5 font-mono text-[12px] text-ed-fg"
        >
          {valueSystems.map((v) => (
            <option key={v.id} value={v.id} title={v.note}>
              {v.name}
            </option>
          ))}
        </select>
      </Field>

      <label className="tactile flex cursor-pointer items-center gap-2 rounded-sm px-0.5 py-1 hover:bg-ed-surface-strong">
        <input
          type="checkbox"
          checked={includeBasmalah}
          onChange={(e) => onIncludeBasmalahChange(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--ed-accent)]"
        />
        <span className="text-[11px] leading-tight text-ed-fg-secondary">
          Count the unnumbered Basmalah
          <span className="block text-ed-fg-muted">Off for corpus totals, on for initial counts</span>
        </span>
      </label>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-ed-fg-muted">
        {label}
      </span>
      {children}
    </div>
  )
}
