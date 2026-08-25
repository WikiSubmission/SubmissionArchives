import { useMemo, useState } from 'react'
import { MagnifyingGlass } from '@phosphor-icons/react'
import type { ChapterInfo } from '../../lib/quranCode'

/**
 * The 114 chapters, filterable by number, English title or transliteration.
 *
 * All 114 rows render at once. Windowing them would be premature: the list is
 * two orders of magnitude smaller than the transcript teleprompter that needed
 * it, and a fixed 114 rows of three spans is well inside what the pane can
 * paint. The result lists in 9e are the ones that will need measuring.
 */
export default function ChapterList({
  chapters,
  active,
  onSelect,
}: {
  chapters: ChapterInfo[]
  active: number
  onSelect: (n: number) => void
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chapters
    return chapters.filter(
      (c) =>
        String(c.number) === q ||
        c.name_english.toLowerCase().includes(q) ||
        c.name_transliterated.toLowerCase().includes(q) ||
        c.name_arabic.includes(query.trim())
    )
  }, [chapters, query])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative shrink-0 p-2">
        <MagnifyingGlass
          size={13}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ed-fg-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter chapters"
          aria-label="Filter chapters"
          className="w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised py-1.5 pl-7 pr-2 text-[12px] text-ed-fg placeholder:text-ed-fg-faint"
        />
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
        {filtered.map((c) => {
          const isActive = c.number === active
          return (
            <li key={c.number}>
              <button
                type="button"
                onClick={() => onSelect(c.number)}
                aria-current={isActive}
                className={`tactile flex w-full items-baseline gap-2 rounded-sm px-1.5 py-1 text-left transition-colors ${
                  isActive
                    ? 'bg-ed-accent-soft text-ed-fg'
                    : 'text-ed-fg-secondary hover:bg-ed-surface-strong hover:text-ed-fg'
                }`}
              >
                <span
                  className={`w-6 shrink-0 text-right font-mono text-[10px] tabular-nums ${
                    isActive ? 'text-ed-accent' : 'text-ed-fg-faint'
                  }`}
                >
                  {c.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px]">{c.name_transliterated}</span>
                <span className="shrink-0 font-arabic text-[13px] text-ed-fg-muted">{c.name_arabic}</span>
                <span className="w-6 shrink-0 text-right font-mono text-[10px] tabular-nums text-ed-fg-faint">
                  {c.verses}
                </span>
              </button>
            </li>
          )
        })}

        {filtered.length === 0 && (
          <li className="px-2 py-3 text-[11px] text-ed-fg-muted">No chapter matches “{query}”.</li>
        )}
      </ul>
    </div>
  )
}
