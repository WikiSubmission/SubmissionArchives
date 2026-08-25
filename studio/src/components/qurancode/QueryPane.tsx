import { useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { motion, springConfig } from '../ui/Motion'
import type {
  MatchKind,
  MatchLocation,
  NumberTarget,
  SimilarityMethod,
  Wordness,
} from '../../lib/quranCode'

export type QueryTab = 'text' | 'numbers' | 'similar' | 'root'

export interface TextQuery {
  query: string
  kind: MatchKind
  location: MatchLocation
  wordness: Wordness
}

export interface NumberQuery {
  target: string
  quantity: NumberTarget
}

export interface SimilarQuery {
  method: SimilarityMethod
  threshold: number
}

interface QueryPaneProps {
  tab: QueryTab
  text: TextQuery
  numbers: NumberQuery
  similar: SimilarQuery
  root: string
  busy: boolean
  scopeLabel: string
  onTabChange: (tab: QueryTab) => void
  onTextChange: (next: TextQuery) => void
  onNumbersChange: (next: NumberQuery) => void
  onSimilarChange: (next: SimilarQuery) => void
  onRootChange: (next: string) => void
  onRun: () => void
}

const TABS: { id: QueryTab; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'similar', label: 'Similar' },
  { id: 'root', label: 'Root' },
]

/**
 * One question at a time.
 *
 * The original app puts text, number, similarity, frequency and half a dozen
 * analysis tabs on screen simultaneously. Here the pane holds whichever
 * question is being asked and the centre pane answers it, which is the same
 * segmented-tab shell `ExplorerPanel` uses for files, tags, search and trash.
 */
export default function QueryPane({
  tab,
  text,
  numbers,
  similar,
  root,
  busy,
  scopeLabel,
  onTabChange,
  onTextChange,
  onNumbersChange,
  onSimilarChange,
  onRootChange,
  onRun,
}: QueryPaneProps) {
  return (
    <form
      className="flex flex-col gap-2.5 p-2.5"
      onSubmit={(e) => {
        e.preventDefault()
        onRun()
      }}
    >
      <div
        role="tablist"
        aria-label="Query kind"
        className="flex gap-0.5 rounded-[7px] border border-ed-rule bg-ed-surface p-0.5"
      >
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(t.id)}
              className={`relative flex-1 rounded-[5px] px-1 py-1.5 text-[10.5px] font-semibold tracking-wide transition-colors ${
                active ? 'text-ed-fg' : 'text-ed-fg-muted hover:text-ed-fg-secondary'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="qcQueryTab"
                  transition={springConfig}
                  className="absolute inset-0 rounded-[5px] border border-ed-rule-strong bg-ed-surface-raised shadow-xs"
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          )
        })}
      </div>

      {tab === 'text' && (
        <>
          <Field label="Find in Arabic">
            <input
              dir="rtl"
              value={text.query}
              onChange={(e) => onTextChange({ ...text, query: e.target.value })}
              placeholder="أهل البيت"
              aria-label="Arabic query"
              className="w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 py-1.5 font-arabic text-[17px] leading-relaxed text-ed-fg"
            />
          </Field>
          <Field label="Match">
            <Chips
              options={[
                ['exact', 'Exact'],
                ['proximity', 'Proximity'],
              ]}
              value={text.kind}
              onChange={(kind) => onTextChange({ ...text, kind: kind as MatchKind })}
            />
          </Field>
          <Field label="Position in word">
            <Chips
              options={[
                ['anywhere', 'Anywhere'],
                ['at_start', 'Start'],
                ['at_middle', 'Middle'],
                ['at_end', 'End'],
              ]}
              value={text.location}
              onChange={(location) => onTextChange({ ...text, location: location as MatchLocation })}
            />
          </Field>
          <Field label="Wordness">
            <Chips
              options={[
                ['whole_word', 'Whole word'],
                ['part_of_word', 'Part of word'],
              ]}
              value={text.wordness}
              onChange={(wordness) => onTextChange({ ...text, wordness: wordness as Wordness })}
            />
          </Field>
          <Hint>
            Prefix a term with <code className="font-mono">-</code> to exclude it or{' '}
            <code className="font-mono">+</code> to require it. The query is folded the same way the
            corpus is, so it obeys the active text mode.
          </Hint>
        </>
      )}

      {tab === 'numbers' && (
        <>
          <Field label="Target">
            <input
              inputMode="numeric"
              value={numbers.target}
              onChange={(e) => onNumbersChange({ ...numbers, target: e.target.value })}
              placeholder="6795"
              aria-label="Target number"
              className="w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 py-1.5 font-mono text-[13px] tabular-nums text-ed-fg"
            />
          </Field>
          <Field label="Of">
            <Chips
              options={[
                ['value', 'Value'],
                ['letters', 'Letters'],
                ['words', 'Words'],
                ['unique_letters', 'Unique'],
              ]}
              value={numbers.quantity}
              onChange={(q) => onNumbersChange({ ...numbers, quantity: q as NumberTarget })}
            />
          </Field>
          <Hint>
            Finds every verse whose figure equals the target. Searching by value uses the value
            system and modifier preset selected below.
          </Hint>
        </>
      )}

      {tab === 'similar' && (
        <>
          <Field label="Method">
            <Chips
              options={[
                ['similar_text', 'Similar text'],
                ['similar_words', 'Similar words'],
                ['similar_start', 'Same opening'],
                ['similar_end', 'Same ending'],
              ]}
              value={similar.method}
              onChange={(m) => onSimilarChange({ ...similar, method: m as SimilarityMethod })}
            />
          </Field>
          <Field label={`Threshold · ${Math.round(similar.threshold * 100)}%`}>
            <input
              type="range"
              min={50}
              max={100}
              value={Math.round(similar.threshold * 100)}
              onChange={(e) => onSimilarChange({ ...similar, threshold: Number(e.target.value) / 100 })}
              aria-label="Similarity threshold"
              className="w-full accent-[var(--ed-accent)]"
            />
          </Field>
          <Hint>
            Compared against <b className="text-ed-fg-secondary">{scopeLabel}</b> over the folded
            letter stream, so similarity respects the active text mode. Levenshtein distance,
            ranked.
          </Hint>
        </>
      )}

      {tab === 'root' && (
        <>
          <Field label="Root">
            <input
              dir="rtl"
              value={root}
              onChange={(e) => onRootChange(e.target.value)}
              placeholder="ط ه ر"
              aria-label="Root"
              className="w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2 py-1.5 font-arabic text-[17px] tracking-[0.1em] text-ed-fg"
            />
          </Field>
          <Hint>
            1,782 roots, every word covered. Spaces are optional. Click any word in the text pane to
            load its root here.
          </Hint>
        </>
      )}

      <button
        type="submit"
        disabled={busy}
        className="tactile flex w-full items-center justify-center gap-1.5 rounded-md border border-ed-accent-strong bg-ed-accent px-2 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.09em] text-ed-on-accent transition-colors hover:bg-ed-accent-strong disabled:opacity-60"
      >
        <MagnifyingGlass size={13} weight="bold" />
        {busy ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.11em] text-ed-fg-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] leading-snug text-ed-fg-muted">{children}</p>
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: [string, string][]
  value: string
  onChange: (next: string) => void
}) {
  const [focused, setFocused] = useState<string | null>(null)
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={value === id}
          onClick={() => onChange(id)}
          onFocus={() => setFocused(id)}
          onBlur={() => setFocused(null)}
          className={`tactile rounded-sm border px-1.5 py-1 font-mono text-[10px] tracking-wide transition-colors ${
            value === id
              ? 'border-ed-accent/40 bg-ed-accent-soft font-semibold text-ed-accent'
              : 'border-ed-rule-strong bg-ed-surface-raised text-ed-fg-secondary hover:border-ed-accent'
          } ${focused === id ? 'ring-1 ring-ed-accent/40' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
