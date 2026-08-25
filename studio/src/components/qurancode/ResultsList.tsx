import { useEffect, useMemo, useRef, useState } from 'react'
import { Warning } from '@phosphor-icons/react'
import { fmt, type SearchResult } from '../../lib/quranCode'

interface ResultsListProps {
  result: SearchResult | null
  error: string | null
  busy: boolean
  onOpen: (chapter: number, verse: number) => void
}

/** Row height in pixels. Fixed rather than measured because every row is the
 * same two lines of Arabic over one line of English, which is what makes a
 * plain windowing calculation exact instead of an estimate. */
const ROW_HEIGHT = 84
const OVERSCAN = 6

/**
 * Search results, windowed.
 *
 * A whole-corpus text search returns thousands of verses, and the transcript
 * teleprompter already established that the pane cannot hold that many rows in
 * the DOM. This uses the same approach at a simpler scale: uniform row height,
 * so the visible slice is arithmetic rather than a measured layout pass.
 */
export default function ResultsList({ result, error, busy, onOpen }: ResultsListProps) {
  const viewport = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [height, setHeight] = useState(600)

  useEffect(() => {
    const el = viewport.current
    if (!el) return
    const observer = new ResizeObserver(() => setHeight(el.clientHeight))
    observer.observe(el)
    setHeight(el.clientHeight)
    return () => observer.disconnect()
  }, [])

  // A new result set starts at the top; leaving the old offset would land the
  // reader somewhere arbitrary in the middle of unrelated verses.
  useEffect(() => {
    viewport.current?.scrollTo({ top: 0 })
    setScrollTop(0)
  }, [result])

  const hits = result?.hits ?? []
  const window = useMemo(() => {
    const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const visible = Math.ceil(height / ROW_HEIGHT) + OVERSCAN * 2
    return { first, slice: hits.slice(first, first + visible) }
  }, [hits, scrollTop, height])

  if (error) {
    return (
      <div className="flex flex-1 items-start gap-2 p-4 text-[12px] leading-snug text-ed-fg-secondary">
        <Warning size={15} weight="fill" className="mt-0.5 shrink-0 text-ed-danger" />
        <span>{error}</span>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center text-[12px] text-ed-fg-muted">
        {busy ? 'Searching…' : 'Run a query to see results here.'}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-baseline gap-2 border-b border-ed-rule px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.11em] text-ed-fg-muted">
        <span>
          {fmt(result.total)} {result.total === 1 ? 'verse' : 'verses'}
        </span>
        {result.truncated && (
          <span className="text-ed-gold">showing the first {fmt(result.hits.length)}</span>
        )}
        <span className="flex-1" />
        <span>{result.provenance.text_mode_label}</span>
      </div>

      <div
        ref={viewport}
        onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        className={`min-h-0 flex-1 overflow-y-auto ${busy ? 'opacity-60' : ''}`}
      >
        {hits.length === 0 ? (
          <p className="p-6 text-center text-[12px] text-ed-fg-muted">
            Nothing in the corpus matches under this text mode.
          </p>
        ) : (
          <div style={{ height: hits.length * ROW_HEIGHT, position: 'relative' }}>
            {window.slice.map((hit, i) => {
              const index = window.first + i
              return (
                <button
                  key={`${hit.chapter}:${hit.verse}`}
                  type="button"
                  onClick={() => onOpen(hit.chapter, hit.verse)}
                  style={{ position: 'absolute', top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
                  className="tactile flex w-full flex-col gap-0.5 border-b border-ed-rule px-3 py-1.5 text-left transition-colors hover:bg-ed-surface-strong"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[10px] font-bold tracking-wider text-ed-accent">
                      {hit.chapter}:{hit.verse}
                    </span>
                    <span className="font-mono text-[9px] tabular-nums text-ed-fg-faint">
                      {hit.words}w · {hit.letters}L
                    </span>
                    {hit.score < 1 && (
                      <span className="font-mono text-[9px] tabular-nums text-ed-gold">
                        {Math.round(hit.score * 100)}%
                      </span>
                    )}
                    {hit.matches.length > 0 && (
                      <span className="font-mono text-[9px] tabular-nums text-ed-fg-faint">
                        {hit.matches.length} match{hit.matches.length === 1 ? '' : 'es'}
                      </span>
                    )}
                  </span>
                  <span
                    dir="rtl"
                    className="line-clamp-1 text-right font-arabic text-[15px] leading-snug text-ed-fg"
                  >
                    {hit.arabic}
                  </span>
                  <span className="line-clamp-1 font-serif text-[11.5px] leading-snug text-ed-fg-secondary">
                    {hit.english}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
