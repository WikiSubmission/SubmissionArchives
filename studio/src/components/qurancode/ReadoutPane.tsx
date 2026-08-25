import { CaretLeft, CaretRight, Warning } from '@phosphor-icons/react'
import {
  divisibility,
  fmt,
  type Counts,
  type LetterStat,
  type ModifierId,
  type Modifiers,
  type PresetInfo,
  type ToggleId,
  type SelectionValue,
  type ToggleInfo,
  type Toggles,
  type ValueResult,
} from '../../lib/quranCode'
import MarkToggleRow from './MarkToggleRow'
import LetterFrequencyTable from './LetterFrequencyTable'
import ValueCalculator from './ValueCalculator'

interface ReadoutPaneProps {
  counts: Counts[]
  frequency: LetterStat[]
  toggleSpecs: ToggleInfo[]
  toggles: Toggles
  occurrences?: Partial<Record<ToggleId, number>>
  divisor: number
  activeMode: string
  busy: boolean
  value: ValueResult | null
  selection: SelectionValue | null
  onClearSelection: () => void
  presets: PresetInfo[]
  preset: string
  modifiers: Modifiers
  onToggleMark: (id: ToggleId) => void
  onDivisorStep: (delta: number) => void
  onPresetChange: (id: string) => void
  onModifierToggle: (id: ModifierId) => void
}

/**
 * The live numbers.
 *
 * Two decisions here are deliberate and cheap to get wrong.
 *
 * **Comparison is the default view.** The backend returns every countable mode
 * from one call, so both sit side by side instead of the researcher toggling
 * between them and holding the other in their head. Where a mode has an
 * unresolved rule its figures are marked rather than presented as authoritative.
 *
 * **Gold means the number, terracotta means you.** The accent marks selection
 * everywhere else in Studio, so divisibility uses `--ed-gold`. In a tool whose
 * entire subject is divisibility, painting a hit in the selection colour would
 * make every result look clicked.
 */
export default function ReadoutPane({
  counts,
  frequency,
  toggleSpecs,
  toggles,
  occurrences,
  divisor,
  activeMode,
  busy,
  value,
  selection,
  onClearSelection,
  presets,
  preset,
  modifiers,
  onToggleMark,
  onDivisorStep,
  onPresetChange,
  onModifierToggle,
}: ReadoutPaneProps) {
  const primary = counts.find((c) => c.provenance.text_mode === activeMode) ?? counts[0]

  return (
    <div className={`flex flex-1 flex-col gap-4 overflow-y-auto p-3.5 transition-opacity ${busy ? 'opacity-60' : ''}`}>
      <Section title="Statistics">
        <div className="flex flex-wrap gap-2">
          <Readonly label="base" value="10" />
          <Stepper label="÷" value={divisor} onStep={onDivisorStep} />
        </div>
      </Section>

      <Section title="Counts as letter">
        <MarkToggleRow
          specs={toggleSpecs}
          toggles={toggles}
          occurrences={occurrences}
          onToggle={onToggleMark}
        />
      </Section>

      {/* A measured selection sits above the scope counts rather than replacing
          them: the two answer different questions, and overwriting one with the
          other loses the comparison the researcher is making. */}
      {selection && (
        <section className="flex flex-col gap-2 rounded-md border border-ed-gold/40 bg-ed-gold-soft/40 p-2.5 shadow-2xs">
          <h3 className="flex items-baseline gap-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ed-gold">
            Selection
            <span className="h-px flex-1 self-center bg-ed-gold/25" />
            <button
              type="button"
              onClick={onClearSelection}
              className="tactile normal-case tracking-normal text-ed-fg-muted underline hover:text-ed-fg"
            >
              clear
            </button>
          </h3>
          <p dir="rtl" className="break-words text-right font-arabic text-[17px] leading-relaxed text-ed-fg">
            {selection.folded}
          </p>
          <div className="flex flex-col divide-y divide-ed-gold/20">
            <Row label="Letters" value={fmt(selection.letters)} />
            <Row label="Words" value={fmt(selection.words)} />
            <Row label="Unique" value={fmt(selection.unique_letters)} />
            <Row
              label="Value"
              value={fmt(selection.value)}
              big
              gold={divisibility(selection.value, divisor).exact}
            />
            <Row label="Digital root" value={fmt(selection.digital_root)} />
            <Row
              label={`÷ ${divisor}`}
              value={
                divisibility(selection.value, divisor).exact
                  ? `${fmt(divisibility(selection.value, divisor).quotient)} × ${divisor}`
                  : (selection.value / divisor).toFixed(2)
              }
              gold={divisibility(selection.value, divisor).exact}
            />
          </div>
          <p className="text-[10.5px] leading-snug text-ed-fg-muted">
            A selection has no address; position and distance modifiers do not apply.
          </p>
        </section>
      )}

      {primary && (
        <Section title="Scope counts">
          <div className="flex flex-col divide-y divide-ed-rule">
            <Row label="Chapters" value={fmt(primary.chapters)} />
            <Row label="Verses" value={fmt(primary.verses)} />
            <Row label="Words" value={fmt(primary.words)} />
            <Row
              label="Letters"
              value={fmt(primary.letters)}
              gold={divisibility(primary.letters, divisor).exact}
            />
            <Row label="Unique letters" value={fmt(primary.unique_letters)} />
            {primary.value !== null && (
              <>
                <Row
                  label="Value"
                  value={fmt(primary.value)}
                  big
                  gold={divisibility(primary.value, divisor).exact}
                />
                <Row label="Digit sum" value={fmt(primary.digit_sum)} />
                <Row label="Digital root" value={fmt(primary.digital_root)} />
                <Row
                  label={`÷ ${divisor}`}
                  value={
                    divisibility(primary.value, divisor).exact
                      ? `${fmt(divisibility(primary.value, divisor).quotient)} × ${divisor}`
                      : (primary.value / divisor).toFixed(2)
                  }
                  gold={divisibility(primary.value, divisor).exact}
                />
              </>
            )}
          </div>
        </Section>
      )}

      {value && (
        <Section title="Value">
          <ValueCalculator
            result={value}
            presets={presets}
            preset={preset}
            modifiers={modifiers}
            divisor={divisor}
            onPresetChange={onPresetChange}
            onModifierToggle={onModifierToggle}
          />
        </Section>
      )}

      {counts.length > 1 && (
        <Section title="Modes side by side">
          <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3 gap-y-1.5 rounded-md border border-ed-rule bg-ed-surface-raised p-2 shadow-2xs">
            <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-ed-fg-faint">
              Metric
            </span>
            {counts.map((c) => (
              <span
                key={c.provenance.text_mode}
                className="text-right font-mono text-[9px] font-semibold uppercase tracking-wider text-ed-fg-muted"
              >
                {shortLabel(c.provenance.text_mode_label)}
              </span>
            ))}

            <CompareRow label="Letters" counts={counts} pick={(c) => c.letters} />
            <CompareRow label="Unique" counts={counts} pick={(c) => c.unique_letters} />
            {counts[0].value !== null && (
              <CompareRow label="Value" counts={counts} pick={(c) => c.value} />
            )}
          </div>

          {counts.some((c) => c.provenance.known_gaps.length > 0) && (
            <p className="mt-1 flex gap-1.5 text-[11px] leading-snug text-ed-fg-muted">
              <Warning size={13} weight="fill" className="mt-0.5 shrink-0 text-ed-danger" />
              <span>
                Figures with open rules are dotted; computed, not fixture-confirmed.
              </span>
            </p>
          )}
        </Section>
      )}

      <Section title="Letter frequency" aside={`${frequency.length} of 29`}>
        <LetterFrequencyTable stats={frequency} />
      </Section>
    </div>
  )
}

const shortLabel = (label: string) => label.replace('Simplified 29', 'Simp 29').replace('Appendix 1 (published)', 'App 1')

function CompareRow({
  label,
  counts,
  pick,
}: {
  label: string
  counts: Counts[]
  pick: (c: Counts) => number | null
}) {
  return (
    <>
      <span className="text-[11.5px] text-ed-fg-secondary">{label}</span>
      {counts.map((c) => {
        const unverified = c.provenance.known_gaps.length > 0
        return (
          <span
            key={c.provenance.text_mode}
            title={unverified ? c.provenance.known_gaps.join('\n') : undefined}
            className={`text-right font-mono text-[11.5px] font-semibold tabular-nums ${
              unverified
                ? 'cursor-help text-ed-fg-muted underline decoration-ed-danger decoration-dotted underline-offset-[3px]'
                : 'text-ed-fg'
            }`}
          >
            {fmt(pick(c))}
          </span>
        )
      })}
    </>
  )
}

function Section({
  title,
  aside,
  children,
}: {
  title: string
  aside?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-baseline gap-2 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
        {title}
        <span className="h-px flex-1 self-center bg-ed-rule" />
        {aside && <span className="text-ed-fg-faint font-normal">{aside}</span>}
      </h3>
      {children}
    </section>
  )
}

function Row({
  label,
  value,
  gold,
  big,
}: {
  label: string
  value: string
  gold?: boolean
  big?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5">
      <span className="text-[12px] text-ed-fg-secondary">{label}</span>
      <span
        className={`font-mono font-semibold tabular-nums ${big ? 'text-[16px]' : 'text-[12.5px]'} ${
          gold ? 'text-ed-gold' : 'text-ed-fg'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function Readonly({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-[26px] items-stretch overflow-hidden rounded-md border border-ed-rule-strong bg-ed-surface-raised shadow-xs">
      <span className="flex items-center border-r border-ed-rule bg-ed-surface px-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-ed-fg-muted select-none">
        {label}
      </span>
      <span className="flex items-center px-2 font-mono text-[11px] font-semibold tabular-nums text-ed-fg select-none">{value}</span>
    </div>
  )
}

function Stepper({
  label,
  value,
  onStep,
}: {
  label: string
  value: number
  onStep: (delta: number) => void
}) {
  return (
    <div className="flex h-[26px] items-stretch overflow-hidden rounded-md border border-ed-rule-strong bg-ed-surface-raised shadow-xs">
      <span className="flex items-center border-r border-ed-rule bg-ed-surface px-1.5 font-mono text-[9.5px] font-semibold text-ed-fg-muted select-none">
        {label}
      </span>
      <button
        type="button"
        aria-label="Smaller divisor"
        onClick={() => onStep(-1)}
        className="tactile flex items-center px-1 text-ed-fg-muted transition-colors hover:bg-ed-surface-strong hover:text-ed-accent active:bg-ed-surface"
      >
        <CaretLeft size={10} weight="bold" />
      </button>
      <span className="flex min-w-[2rem] items-center justify-center px-1 font-mono text-[11px] font-semibold tabular-nums text-ed-fg select-none">
        {value}
      </span>
      <button
        type="button"
        aria-label="Larger divisor"
        onClick={() => onStep(1)}
        className="tactile flex items-center px-1 text-ed-fg-muted transition-colors hover:bg-ed-surface-strong hover:text-ed-accent active:bg-ed-surface"
      >
        <CaretRight size={10} weight="bold" />
      </button>
    </div>
  )
}
