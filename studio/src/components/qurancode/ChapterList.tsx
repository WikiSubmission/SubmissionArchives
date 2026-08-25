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
      <div className="relative shrink-0 p-2.5">
        <MagnifyingGlass
          size={13}
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-ed-fg-muted"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter surahs…"
          aria-label="Filter chapters"
          className="h-[30px] w-full rounded-md border border-ed-rule-strong bg-ed-surface-raised pl-8 pr-2.5 font-mono text-[11px] text-ed-fg shadow-xs outline-none transition-colors placeholder:font-sans placeholder:text-ed-fg-faint focus:border-ed-accent focus:ring-1 focus:ring-ed-accent"
        />
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
        {filtered.map((c) => {
          const isActive = c.number === active
          return (
            <li key={c.number}>
              <button
                type="button"
                onClick={() => onSelect(c.number)}
                aria-current={isActive}
                className={`tactile flex w-full items-baseline gap-2 rounded px-2 py-1 text-left transition-all ${
                  isActive
                    ? 'border-l-2 border-ed-accent bg-ed-accent-soft font-semibold text-ed-fg shadow-xs'
                    : 'text-ed-fg-secondary hover:bg-ed-surface hover:text-ed-fg'
                }`}
              >
                <span
                  className={`w-5 shrink-0 text-right font-mono text-[10px] font-semibold tabular-nums ${
                    isActive ? 'text-ed-accent' : 'text-ed-fg-faint'
                  }`}
                >
                  {c.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-[12px]">{c.name_transliterated}</span>
                <span dir="rtl" className="shrink-0 font-arabic text-[14px] text-ed-fg-muted">
                  {c.name_arabic}
                </span>
                <span className="w-7 shrink-0 text-right font-mono text-[9.5px] tabular-nums text-ed-fg-faint">
                  {c.verses}v
                </span>
              </button>
            </li>
          )
        })}

        {filtered.length === 0 && (
          <li className="px-3 py-4 text-center font-mono text-[11px] text-ed-fg-muted">
            No surah matches “{query}”.
          </li>
        )}
      </ul>
    </div>
  )
}
