import { useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import { ArrowRight, ClockCounterClockwise, MagnifyingGlass, X } from '@phosphor-icons/react'
import {
  MEDIA_TYPE_LABEL,
  parseMediaReference,
  parseRecordCode,
  resolveReference,
  type MediaItem,
} from '../../lib/mediaCatalog'

interface MediaSearchSelectorProps {
  items: MediaItem[]
  recentIds: string[]
  loading: boolean
  onSelect: (item: MediaItem, timestamp?: number) => void
  onDismiss?: () => void
}

const MAX_RESULTS = 40

/** Fuzzy selector over the whole media index, doubling as a URL parser so a
 * pasted archive or YouTube link resolves to the same record. */
export default function MediaSearchSelector({
  items,
  recentIds,
  loading,
  onSelect,
  onDismiss,
}: MediaSearchSelectorProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        includeScore: true,
        threshold: 0.38,
        ignoreLocation: true,
        keys: [
          { name: 'displayTitle', weight: 0.45 },
          { name: 'title', weight: 0.2 },
          { name: 'speakers', weight: 0.12 },
          { name: 'author', weight: 0.08 },
          { name: 'chapters.title', weight: 0.08 },
          { name: 'id', weight: 0.04 },
          { name: 'date', weight: 0.03 },
        ],
      }),
    [items]
  )

  /** A pasted link or a bare record code resolves outright; anything else goes
   * through the fuzzy index. */
  const directMatch = useMemo(() => {
    const text = query.trim()
    if (!text) return null
    const reference = parseMediaReference(text)
    const resolved = resolveReference(items, reference)
    if (!resolved) return null
    return { item: resolved, timestamp: reference?.timestamp }
  }, [items, query])

  const results = useMemo(() => {
    const text = query.trim()
    if (!text) {
      const recents = recentIds
        .map((id) => items.find((item) => item.id === id))
        .filter((item): item is MediaItem => Boolean(item))
      return recents.length ? recents : items.slice(0, MAX_RESULTS)
    }
    const code = parseRecordCode(text)
    if (code) {
      const coded = items.filter((item) => item.type === code.type && item.primaryNumber === code.number)
      if (coded.length) return coded
    }
    return fuse
      .search(text, { limit: MAX_RESULTS })
      .map((result) => result.item)
      .filter((item) => item.id !== directMatch?.item.id)
  }, [directMatch, fuse, items, query, recentIds])

  const showingRecents = !query.trim() && recentIds.length > 0

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-1.5 border-b border-ed-rule px-2.5 py-2">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={12}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ed-fg-faint"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                const chosen = directMatch ?? (results[0] ? { item: results[0], timestamp: undefined } : null)
                if (chosen) onSelect(chosen.item, chosen.timestamp)
              }
              if (event.key === 'Escape' && onDismiss) onDismiss()
            }}
            placeholder="Search lectures, or paste an archive / YouTube link"
            aria-label="Search media catalog"
            className="w-full rounded-md border border-ed-rule bg-ed-surface py-1.5 pl-7 pr-2 text-[12px] text-ed-fg placeholder:text-ed-fg-faint focus:border-ed-accent focus:outline-none"
          />
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="st-media-icon" title="Back to the player">
            <X size={12} weight="bold" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="px-3 py-8 text-center text-[11px] italic text-ed-fg-faint">Loading media index&hellip;</div>
        ) : !items.length ? (
          <div className="space-y-2 px-3 py-8 text-center">
            <p className="text-[11px] text-ed-fg-muted">The Studio media index is missing.</p>
            <code className="block rounded bg-ed-surface px-2 py-1 text-[10px] text-ed-fg-secondary">
              npm run generate:studio-media
            </code>
          </div>
        ) : (
          <>
            {directMatch && (
              <button
                onClick={() => onSelect(directMatch.item, directMatch.timestamp)}
                className="flex w-full items-center gap-2 border-b border-ed-rule bg-ed-accent/10 px-2.5 py-2 text-left hover:bg-ed-accent/15"
              >
                <ArrowRight size={13} className="shrink-0 text-ed-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-ed-fg">
                    {directMatch.item.displayTitle}
                  </span>
                  <span className="text-[10px] text-ed-fg-muted">
                    Resolved reference
                    {directMatch.timestamp != null ? ` at ${Math.floor(directMatch.timestamp)}s` : ''}
                  </span>
                </span>
              </button>
            )}

            {showingRecents && (
              <div className="flex items-center gap-1.5 px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-ed-fg-secondary">
                <ClockCounterClockwise size={11} />
                Recent
              </div>
            )}

            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="flex w-full items-start gap-2 border-b border-ed-rule/60 px-2.5 py-2 text-left transition-colors hover:bg-ed-surface"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-medium text-ed-fg">{item.displayTitle}</span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-ed-fg-muted">
                    <span className="rounded bg-ed-surface-strong px-1 py-px">{MEDIA_TYPE_LABEL[item.type]}</span>
                    {item.date && <span className="tabular-nums">{item.date}</span>}
                    {item.duration && <span className="tabular-nums">{item.duration}</span>}
                  </span>
                </span>
              </button>
            ))}

            {!results.length && !directMatch && (
              <div className="px-3 py-8 text-center text-[11px] italic text-ed-fg-faint">
                No lecture matches &ldquo;{query}&rdquo;.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
