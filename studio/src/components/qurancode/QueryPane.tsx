import { useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { motion, springConfig } from '../ui/Motion'
import type {
  AggregateQuery,
  MatchKind,
  MatchLocation,
  NumberTarget,
  SimilarityMethod,
  Wordness,
} from '../../lib/quranCode'

export type QueryTab = 'text' | 'numbers' | 'similar' | 'root' | 'totals'

/** The published arguments, as queries.
 *
 * These are not shortcuts. Each one is a claim from Appendix 1 restated as
 * something the engine can be asked, so a reader can run the argument rather
 * than take the number on trust, and can then edit the query and watch the
 * figure move. The first is the one the whole appendix opens with. */
export const AGGREGATE_PRESETS: { label: string; hint: string; query: AggregateQuery }[] = [
  {
    label: 'The divine name',
    hint: '2,698 occurrences, 19 x 142. Verse numbers sum to 118,123, 19 x 6,217.',
    query: { text: 'لله', root_id: 56 },
  },
  {
    label: 'Divine name, first initial to last',
    hint: '2,641 inside 2:1 to 68:1, 19 x 139, leaving 57 outside, 19 x 3.',
    query: { text: 'لله', root_id: 56, from: [2, 1], to: [68, 1] },
  },
  {
    label: 'Qaf in every verse 19',
    hint: '76 across the whole corpus, 19 x 4.',
    query: { verse_number: 19, letters: 'ق' },
  },
  {
    label: 'Ha and Mim, suras 40 to 46',
    hint: '2,147, 19 x 113. Needs the published text mode.',
    query: {
      chapters: [40, 41, 42, 43, 44, 45, 46],
      letters: 'حم',
      scope: { include_basmalah: true },
    },
  },
  {
    label: 'Sura numbers 9 to 27',
    hint: 'Nineteen suras, their numbers summing to 342, 19 x 18.',
    query: { from: [9, 1], to: [27, 93] },
  },
  {
    label: 'The 29 initialed suras',
    hint: 'Their numbers sum to 822; plus the 14 sets that is 836, 19 x 44.',
    query: { initialed: true },
  },
  {
    label: 'Un-initialed suras between 2 and 68',
    hint: '38 of them, 19 x 2.',
    query: { initialed: false, from: [3, 1], to: [67, 30] },
  },
  {
    label: 'Alif Lam Mim, the six suras',
    hint: '19,874, 19 x 1,046 as published. Ours is short by the alif deficit.',
    query: {
      chapters: [2, 3, 29, 30, 31, 32],
      letters: 'الم',
      scope: { include_basmalah: true },
    },
  },
]

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
  aggregate: AggregateQuery
  onAggregateChange: (next: AggregateQuery) => void
}

const TABS: { id: QueryTab; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'numbers', label: 'Numbers' },
  { id: 'similar', label: 'Similar' },
  { id: 'root', label: 'Root' },
  { id: 'totals', label: 'Totals' },
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
  aggregate,
  onAggregateChange,
}: QueryPaneProps) {
  return (
    <form
      className="flex flex-col gap-3 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        onRun()
      }}
    >
      <div
        role="tablist"
        aria-label="Query kind"
        className="flex h-[30px] gap-0.5 rounded-md border border-ed-rule bg-ed-surface p-0.5"
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
              className={`relative flex flex-1 items-center justify-center rounded px-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                active ? 'text-ed-fg' : 'text-ed-fg-muted hover:text-ed-fg-secondary'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="qcQueryTab"
                  transition={springConfig}
                  className="absolute inset-0 rounded border border-ed-rule-strong bg-ed-surface-raised shadow-xs"
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          )
        })}
      </div>

      {tab === 'text' && (
        <div className="flex flex-col gap-2.5">
          <Field label="Find in Arabic">
            <input
              dir="rtl"
              value={text.query}
              onChange={(e) => onTextChange({ ...text, query: e.target.value })}
              placeholder="أهل البيت"
              aria-label="Arabic query"
              className="h-[34px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-arabic text-[18px] text-ed-fg shadow-xs outline-none transition-colors placeholder:font-arabic placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
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
            Prefix a term with <code className="rounded border border-ed-rule bg-ed-surface px-1 py-0.5 font-mono text-[9.5px] text-ed-fg-secondary">-</code> to exclude or{' '}
            <code className="rounded border border-ed-rule bg-ed-surface px-1 py-0.5 font-mono text-[9.5px] text-ed-fg-secondary">+</code> to require. Folds per active text mode.
          </Hint>
        </div>
      )}

      {tab === 'numbers' && (
        <div className="flex flex-col gap-2.5">
          <Field label="Target">
            <input
              inputMode="numeric"
              value={numbers.target}
              onChange={(e) => onNumbersChange({ ...numbers, target: e.target.value })}
              placeholder="6795"
              aria-label="Target number"
              className="h-[32px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-mono text-[12.5px] font-semibold tabular-nums text-ed-fg shadow-xs outline-none transition-colors placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
            />
          </Field>
          <Field label="Quantity">
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
            Finds every verse matching the target value using the active value system and modifiers.
          </Hint>
        </div>
      )}

      {tab === 'similar' && (
        <div className="flex flex-col gap-2.5">
          <Field label="Method">
            <Chips
              options={[
                ['similar_text', 'Similar text'],
                ['similar_words', 'Similar words'],
                ['similar_start', 'Same start'],
                ['similar_end', 'Same end'],
              ]}
              value={similar.method}
              onChange={(m) => onSimilarChange({ ...similar, method: m as SimilarityMethod })}
            />
          </Field>
          <Field label={`Threshold · ${Math.round(similar.threshold * 100)}%`}>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="range"
                min={50}
                max={100}
                value={Math.round(similar.threshold * 100)}
                onChange={(e) => onSimilarChange({ ...similar, threshold: Number(e.target.value) / 100 })}
                aria-label="Similarity threshold"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ed-rule-strong accent-[var(--ed-accent)]"
              />
            </div>
          </Field>
          <Hint>
            Ranked Levenshtein similarity against <b className="font-mono text-ed-fg-secondary">{scopeLabel}</b> over the folded letter stream.
          </Hint>
        </div>
      )}

      {tab === 'totals' && (
        <div className="flex flex-col gap-2.5">
          <Field label="Published arguments">
            {/* Presets first, raw fields behind them, for the same reason the
                value calculator does it: the useful region of this query space
                is tiny and undiscoverable, and a reader who has never built one
                learns more from running a known claim than from an empty form. */}
            <div className="flex flex-col gap-1">
              {AGGREGATE_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  title={p.hint}
                  onClick={() => onAggregateChange(p.query)}
                  className="tactile flex flex-col gap-0.5 rounded-md border border-ed-rule bg-ed-surface-raised px-2 py-1.5 text-left transition-colors hover:border-ed-accent hover:bg-ed-surface-strong"
                >
                  <span className="font-serif text-[12px] font-semibold text-ed-fg">{p.label}</span>
                  <span className="font-mono text-[9.5px] leading-snug text-ed-fg-muted">{p.hint}</span>
                </button>
              ))}
            </div>
          </Field>

          <Field label="Word contains">
            <input
              dir="rtl"
              value={aggregate.text ?? ''}
              onChange={(e) => onAggregateChange({ ...aggregate, text: e.target.value })}
              placeholder="لله"
              aria-label="Folded form the word must contain"
              className="h-[34px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-arabic text-[18px] text-ed-fg shadow-xs outline-none transition-colors placeholder:font-arabic placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
            />
          </Field>

          <div className="grid grid-cols-2 gap-2">
            <Field label="Root #">
              <NumberField
                value={aggregate.root_id}
                placeholder="56"
                label="Root id"
                onChange={(root_id) => onAggregateChange({ ...aggregate, root_id })}
              />
            </Field>
            <Field label="Verse no.">
              <NumberField
                value={aggregate.verse_number}
                placeholder="19"
                label="Verse number, every chapter"
                onChange={(verse_number) => onAggregateChange({ ...aggregate, verse_number })}
              />
            </Field>
          </div>

          <Field label="Count only these letters">
            <input
              dir="rtl"
              value={aggregate.letters ?? ''}
              onChange={(e) => onAggregateChange({ ...aggregate, letters: e.target.value })}
              placeholder="الم"
              aria-label="Letters to count"
              className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-arabic text-[16px] text-ed-fg shadow-xs outline-none transition-colors placeholder:font-arabic placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
            />
          </Field>

          <Field label="Suras">
            <input
              value={(aggregate.chapters ?? []).join(', ')}
              onChange={(e) =>
                onAggregateChange({
                  ...aggregate,
                  chapters: e.target.value
                    .split(/[^0-9]+/)
                    .map(Number)
                    .filter((n) => n >= 1 && n <= 114),
                })
              }
              placeholder="40, 41, 42"
              aria-label="Sura numbers"
              className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-mono text-[12px] tabular-nums text-ed-fg shadow-xs outline-none transition-colors placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
            />
          </Field>

          <Field label="From / to (sura:verse)">
            <div className="grid grid-cols-2 gap-2">
              <AddressField
                value={aggregate.from}
                placeholder="2:1"
                label="Span start"
                onChange={(from) => onAggregateChange({ ...aggregate, from })}
              />
              <AddressField
                value={aggregate.to}
                placeholder="68:1"
                label="Span end"
                onChange={(to) => onAggregateChange({ ...aggregate, to })}
              />
            </div>
          </Field>

          <Field label="Quranic Initials">
            <Chips
              options={[
                ['any', 'Any sura'],
                ['yes', 'Initialed'],
                ['no', 'Un-initialed'],
              ]}
              value={aggregate.initialed === undefined ? 'any' : aggregate.initialed ? 'yes' : 'no'}
              onChange={(v) =>
                onAggregateChange({
                  ...aggregate,
                  initialed: v === 'any' ? undefined : v === 'yes',
                })
              }
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] text-ed-fg-secondary">
            <input
              type="checkbox"
              checked={aggregate.scope?.include_basmalah ?? false}
              onChange={(e) =>
                onAggregateChange({
                  ...aggregate,
                  scope: { ...aggregate.scope, include_basmalah: e.target.checked },
                })
              }
              className="accent-ed-accent"
            />
            Include the unnumbered Basmalahs
          </label>

          <Hint>
            Filters intersect. Every total is tested against the divisor in the
            readout, and both readings of the verse-number sum are shown because
            the phrase is ambiguous between them.
          </Hint>
        </div>
      )}

      {tab === 'root' && (
        <div className="flex flex-col gap-2.5">
          <Field label="Root">
            <input
              dir="rtl"
              value={root}
              onChange={(e) => onRootChange(e.target.value)}
              placeholder="ط ه ر"
              aria-label="Root"
              className="h-[34px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-arabic text-[18px] text-ed-fg shadow-xs outline-none transition-colors placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
            />
          </Field>
          <Hint>
            1,782 roots covered. Spaces optional. Click any word in reading view to load its root.
          </Hint>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="tactile flex h-[32px] w-full items-center justify-center gap-1.5 rounded-md border border-ed-accent-strong bg-ed-accent px-3 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-ed-on-accent shadow-xs transition-colors hover:bg-ed-accent-strong disabled:opacity-60"
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
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ed-fg-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

/** A number input that reports `undefined` for empty rather than 0, because a
 * cleared field means "do not filter on this" and zero would mean "sura 0". */
function NumberField({
  value,
  placeholder,
  label,
  onChange,
}: {
  value: number | undefined
  placeholder: string
  label: string
  onChange: (next: number | undefined) => void
}) {
  return (
    <input
      inputMode="numeric"
      value={value ?? ''}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => {
        const n = Number(e.target.value.replace(/[^0-9]/g, ''))
        onChange(e.target.value.trim() === '' || !Number.isFinite(n) || n <= 0 ? undefined : n)
      }}
      className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-mono text-[12px] tabular-nums text-ed-fg shadow-xs outline-none transition-colors placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
    />
  )
}

/** A `sura:verse` pair. Typed as one field because that is how a researcher
 * writes an address, and split on the colon rather than offering two boxes. */
function AddressField({
  value,
  placeholder,
  label,
  onChange,
}: {
  value: [number, number] | undefined
  placeholder: string
  label: string
  onChange: (next: [number, number] | undefined) => void
}) {
  return (
    <input
      value={value ? `${value[0]}:${value[1]}` : ''}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => {
        const parts = e.target.value.split(':').map((x) => Number(x.replace(/[^0-9]/g, '')))
        onChange(
          parts.length === 2 && parts.every((n) => Number.isFinite(n) && n > 0)
            ? [parts[0], parts[1]]
            : undefined
        )
      }}
      className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised px-2.5 font-mono text-[12px] tabular-nums text-ed-fg shadow-xs outline-none transition-colors placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
    />
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
      {options.map(([id, label]) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            onFocus={() => setFocused(id)}
            onBlur={() => setFocused(null)}
            className={`tactile rounded px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide transition-all ${
              active
                ? 'border border-ed-accent/50 bg-ed-accent-soft font-semibold text-ed-accent shadow-2xs'
                : 'border border-ed-rule bg-ed-surface-raised text-ed-fg-secondary hover:border-ed-rule-strong hover:text-ed-fg'
            } ${focused === id ? 'ring-1 ring-ed-accent/40' : ''}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
