import { BookOpen, CaretLeft, CaretRight, ListMagnifyingGlass, Sigma } from '@phosphor-icons/react'
import type { ChapterInfo, DivisionKindInfo, DivisionRef, VerseDivisions } from '../../lib/quranCode'
import type { ScopeLevel } from '../../hooks/useQuranCode'

interface ScopeBarProps {
  chapter: number
  verse: number
  word: number | null
  level: ScopeLevel
  activeChapter: ChapterInfo | null
  wordCount: number
  onStepChapter: (delta: number) => void
  onStepVerse: (delta: number) => void
  onStepWord: (delta: number) => void
  onLevelChange: (level: ScopeLevel) => void
  reading: 'verse' | 'chapter'
  onReadingChange: (reading: 'verse' | 'chapter') => void
  divisionKinds: DivisionKindInfo[]
  division: DivisionRef | null
  onDivisionChange: (d: DivisionRef | null) => void
  /** Which divisions the verse on screen sits in, so picking one starts from
   * where the reader already is rather than from number 1. */
  verseDivisions: VerseDivisions | null
  view: View
  hasResults: boolean
  hasTotals: boolean
  onViewChange: (view: View) => void
}

/**
 * Chapter, verse and word steppers plus the scope selector.
 *
 * The old app exposes eleven scopes at once, five of which need division
 * metadata Studio does not have yet. Chapter and verse stay visible because
 * they are what a researcher moves through constantly; the rest sits behind the
 * picker, and the divisions are disabled with the phase that brings them named,
 * rather than hidden as if they were never coming.
 */
type View = 'read' | 'results' | 'totals'

const VIEWS = [
  ['read', 'Read', BookOpen],
  ['results', 'Results', ListMagnifyingGlass],
  ['totals', 'Totals', Sigma],
] as const

export default function ScopeBar({
  chapter,
  verse,
  word,
  level,
  activeChapter,
  wordCount,
  onStepChapter,
  onStepVerse,
  onStepWord,
  onLevelChange,
  reading,
  onReadingChange,
  divisionKinds,
  division,
  onDivisionChange,
  verseDivisions,
  view,
  hasResults,
  hasTotals,
  onViewChange,
}: ScopeBarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ed-rule bg-ed-bg-secondary px-3 py-1.5 min-h-[38px]">
      <div className="flex items-center gap-1.5">
        <Stepper label="Ch" value={chapter} onStep={onStepChapter} />
        <Stepper label="V" value={verse} onStep={onStepVerse} />
        <Stepper label="W" value={word ?? '—'} onStep={onStepWord} />
      </div>

      {activeChapter && (
        <div className="ml-1 flex items-center gap-1.5 truncate font-serif text-[12.5px] text-ed-fg-secondary">
          <span className="font-semibold text-ed-fg">{activeChapter.name_transliterated}</span>
          <span className="text-ed-fg-faint">·</span>
          <span className="font-mono text-[11px] tabular-nums text-ed-fg-muted">{activeChapter.verses} verses</span>
          <span className="text-ed-fg-faint">·</span>
          <span className="font-mono text-[11px] text-ed-fg-muted">rev. {ordinal(activeChapter.revelation_order)}</span>
          {/* One of the 29. Shown beside the sura because whether a sura is
              initialed is the first thing that matters about it in this
              literature, and it is otherwise invisible in the reader. */}
          {activeChapter.initials && (
            <span
              dir="rtl"
              title="Quranic Initials"
              className="rounded border border-ed-accent/30 bg-ed-accent-soft px-1.5 font-arabic text-[14px] leading-tight text-ed-accent"
            >
              {activeChapter.initials}
            </span>
          )}
        </div>
      )}

      <span className="flex-1" />

      {/* Whether the pane shows one verse or the whole sura. Separate from the
          counting scope, because a researcher often wants to read the sura
          while still counting a single verse. */}
      <div
        role="group"
        aria-label="Reading scope"
        className="flex items-center rounded-md border border-ed-rule bg-ed-surface p-0.5"
      >
        {(
          [
            ['verse', 'Verse'],
            ['chapter', 'Sura'],
          ] as const
        ).map(([id, label]) => {
          const active = reading === id
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onReadingChange(id)}
              title={id === 'chapter' ? 'Read the whole sura' : 'Read one verse at a time'}
              className={`tactile rounded px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide transition-all ${
                active
                  ? 'border border-ed-rule-strong bg-ed-surface-raised font-semibold text-ed-accent shadow-xs'
                  : 'text-ed-fg-muted hover:text-ed-fg'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* Part, group, quarter, station, bowing and page. One picker with the
          kind as a parameter rather than five controls, and the number defaults
          to whichever division the verse on screen is already in, so choosing
          "page" answers a question about where the reader is standing. */}
      <div className="flex items-center gap-1">
        <select
          aria-label="Division kind"
          value={division?.kind ?? ''}
          onChange={(e) => {
            const kind = e.target.value as DivisionRef['kind'] | ''
            if (!kind) return onDivisionChange(null)
            onDivisionChange({ kind, number: verseDivisions?.[kind] ?? 1 })
          }}
          className="h-[24px] cursor-pointer rounded-md border border-ed-rule bg-ed-surface px-1.5 font-mono text-[10px] text-ed-fg-secondary outline-none transition-colors hover:border-ed-rule-strong focus:border-ed-accent"
        >
          <option value="">No division</option>
          {divisionKinds.map((k) => (
            <option key={k.id} value={k.id}>
              {k.label}
            </option>
          ))}
        </select>
        {division && (
          <Stepper
            label="#"
            value={division.number}
            onStep={(delta) => {
              const max =
                divisionKinds.find((k) => k.id === division.kind)?.count ?? division.number
              const next = Math.min(max, Math.max(1, division.number + delta))
              onDivisionChange({ ...division, number: next })
            }}
          />
        )}
      </div>

      {/* Reading, results and totals share the pane, so the switch belongs
          where the rest of the navigation is rather than floating over the
          content. A view appears only once it has something to show, which is
          why the buttons are filtered rather than disabled: a control that can
          never do anything yet is noise, not affordance. */}
      {(hasResults || hasTotals) && (
        <div
          role="group"
          aria-label="View mode"
          className="flex items-center rounded-md border border-ed-rule bg-ed-surface p-0.5"
        >
          {VIEWS.filter(
            ([id]) => id === 'read' || (id === 'results' ? hasResults : hasTotals)
          ).map(([id, label, Icon]) => {
            const active = view === id
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => onViewChange(id)}
                title={label}
                className={`tactile flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide transition-all ${
                  active
                    ? 'border border-ed-rule-strong bg-ed-surface-raised font-semibold text-ed-accent shadow-xs'
                    : 'text-ed-fg-muted hover:text-ed-fg'
                }`}
              >
                <Icon size={11} weight={active ? 'fill' : 'regular'} />
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Scope selector */}
      <select
        aria-label="Scope"
        value={level}
        onChange={(e) => onLevelChange(e.target.value as ScopeLevel)}
        className="h-[26px] rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 font-mono text-[11px] font-medium text-ed-fg shadow-xs outline-none transition-colors focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
      >
        <option value="corpus">Scope: corpus</option>
        <option value="chapter">Scope: chapter</option>
        <option value="verse">Scope: verse</option>
        <option value="word" disabled={wordCount === 0}>
          Scope: word
        </option>
        <option disabled>Scope: page (9g)</option>
        <option disabled>Scope: station (9g)</option>
        <option disabled>Scope: bowing (9g)</option>
      </select>
    </div>
  )
}

function Stepper({
  label,
  value,
  onStep,
}: {
  label: string
  value: number | string
  onStep: (delta: number) => void
}) {
  return (
    <div className="flex h-[26px] items-stretch overflow-hidden rounded-md border border-ed-rule-strong bg-ed-surface-raised shadow-xs">
      <span className="flex items-center border-r border-ed-rule bg-ed-surface px-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-ed-fg-muted select-none">
        {label}
      </span>
      <button
        type="button"
        aria-label={`Previous ${label}`}
        onClick={() => onStep(-1)}
        className="tactile flex items-center px-1 text-ed-fg-muted transition-colors hover:bg-ed-surface-strong hover:text-ed-accent active:bg-ed-surface"
      >
        <CaretLeft size={10} weight="bold" />
      </button>
      <span className="flex min-w-[2.2rem] items-center justify-center px-1 font-mono text-[11px] font-semibold tabular-nums text-ed-fg select-none">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Next ${label}`}
        onClick={() => onStep(1)}
        className="tactile flex items-center px-1 text-ed-fg-muted transition-colors hover:bg-ed-surface-strong hover:text-ed-accent active:bg-ed-surface"
      >
        <CaretRight size={10} weight="bold" />
      </button>
    </div>
  )
}

function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}
