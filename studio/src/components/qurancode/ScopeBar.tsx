import { BookOpen, CaretLeft, CaretRight, ListMagnifyingGlass } from '@phosphor-icons/react'
import type { ChapterInfo } from '../../lib/quranCode'
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
  view: 'read' | 'results'
  hasResults: boolean
  onViewChange: (view: 'read' | 'results') => void
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
  view,
  hasResults,
  onViewChange,
}: ScopeBarProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-ed-rule bg-ed-bg-secondary px-3 py-2">
      <Stepper label="Ch" value={chapter} onStep={onStepChapter} />
      <Stepper label="V" value={verse} onStep={onStepVerse} />
      <Stepper label="W" value={word ?? '—'} onStep={onStepWord} />

      {activeChapter && (
        <span className="ml-1 truncate font-serif text-[13px] text-ed-fg-secondary">
          <b className="font-semibold text-ed-fg">{activeChapter.name_transliterated}</b>
          <span className="mx-1.5 text-ed-fg-faint">·</span>
          {activeChapter.verses} verses
          <span className="mx-1.5 text-ed-fg-faint">·</span>
          revealed {ordinal(activeChapter.revelation_order)}
        </span>
      )}

      <span className="flex-1" />

      {/* Whether the pane shows one verse or the whole sura. Separate from the
          counting scope, because a researcher often wants to read the sura
          while still counting a single verse. */}
      <div className="flex overflow-hidden rounded-md border border-ed-rule-strong">
        {(
          [
            ['verse', 'Verse'],
            ['chapter', 'Sura'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={reading === id}
            onClick={() => onReadingChange(id)}
            title={id === 'chapter' ? 'Read the whole sura' : 'Read one verse at a time'}
            className={`tactile px-2 py-1 font-mono text-[10px] tracking-wide transition-colors ${
              reading === id
                ? 'bg-ed-accent-soft font-semibold text-ed-accent'
                : 'bg-ed-surface-raised text-ed-fg-muted hover:text-ed-fg'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reading and results share the pane, so the switch belongs where the
          rest of the navigation is rather than floating over the content. */}
      {hasResults && (
        <div className="flex overflow-hidden rounded-md border border-ed-rule-strong">
          {([
            ['read', 'Read', BookOpen],
            ['results', 'Results', ListMagnifyingGlass],
          ] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => onViewChange(id)}
              title={label}
              className={`tactile flex items-center gap-1 px-2 py-1 font-mono text-[10px] tracking-wide transition-colors ${
                view === id
                  ? 'bg-ed-accent-soft font-semibold text-ed-accent'
                  : 'bg-ed-surface-raised text-ed-fg-muted hover:text-ed-fg'
              }`}
            >
              <Icon size={11} weight={view === id ? 'fill' : 'regular'} />
              {label}
            </button>
          ))}
        </div>
      )}

      <select
        aria-label="Scope"
        value={level}
        onChange={(e) => onLevelChange(e.target.value as ScopeLevel)}
        className="rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 py-1 font-mono text-[11px] text-ed-fg"
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
    <div className="flex items-stretch overflow-hidden rounded-md border border-ed-rule-strong bg-ed-surface-raised">
      <span className="border-r border-ed-rule bg-ed-surface px-1.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ed-fg-muted">
        {label}
      </span>
      <button
        type="button"
        aria-label={`Previous ${label}`}
        onClick={() => onStep(-1)}
        className="tactile px-1.5 text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-accent"
      >
        <CaretLeft size={11} weight="bold" />
      </button>
      <span className="min-w-[2.4rem] px-1 py-1 text-center font-mono text-[12px] font-semibold tabular-nums text-ed-fg">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Next ${label}`}
        onClick={() => onStep(1)}
        className="tactile px-1.5 text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-accent"
      >
        <CaretRight size={11} weight="bold" />
      </button>
    </div>
  )
}

function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}
