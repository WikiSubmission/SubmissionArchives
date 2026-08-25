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
    <div className="flex shrink-0 flex-col gap-2.5 border-t border-ed-rule bg-ed-surface p-3">
      <Field label="Text mode">
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value)}
          className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 font-mono text-[11px] font-medium text-ed-fg shadow-xs outline-none transition-colors focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
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
        <div
          className={`flex items-start gap-1.5 rounded border px-2 py-1.5 text-[11px] leading-snug ${
            gaps.length === 0
              ? 'border-ed-success/30 bg-ed-success-soft text-ed-success'
              : 'border-ed-danger/30 bg-ed-danger-soft text-ed-danger'
          }`}
        >
          {gaps.length === 0 ? (
            <>
              <SealCheck size={13} weight="fill" className="mt-0.5 shrink-0" />
              <p className="font-mono text-[10px]">
                Verified against {active.verified.length} published figures.
              </p>
            </>
          ) : (
            <>
              <Warning size={13} weight="fill" className="mt-0.5 shrink-0" />
              <p className="font-mono text-[10px]">
                {gaps.length} unresolved {gaps.length === 1 ? 'rule' : 'rules'}. Affected figures are marked.
              </p>
            </>
          )}
        </div>
      )}

      <Field label="Value system">
        <select
          value={valueSystem}
          onChange={(e) => onValueSystemChange(e.target.value)}
          className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 font-mono text-[11px] font-medium text-ed-fg shadow-xs outline-none transition-colors focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
        >
          {valueSystems.map((v) => (
            <option key={v.id} value={v.id} title={v.note}>
              {v.name}
            </option>
          ))}
        </select>
      </Field>

      <label className="tactile flex cursor-pointer items-center gap-2 rounded border border-ed-rule/60 bg-ed-surface-raised/40 px-2 py-1.5 transition-colors hover:border-ed-rule-strong hover:bg-ed-surface-raised">
        <input
          type="checkbox"
          checked={includeBasmalah}
          onChange={(e) => onIncludeBasmalahChange(e.target.checked)}
          className="h-3.5 w-3.5 accent-[var(--ed-accent)]"
        />
        <span className="text-[11px] leading-tight text-ed-fg-secondary">
          Count unnumbered Basmalah
          <span className="block text-[10px] text-ed-fg-muted">Off for corpus, on for initial counts</span>
        </span>
      </label>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
        {label}
      </span>
      {children}
    </div>
  )
}
