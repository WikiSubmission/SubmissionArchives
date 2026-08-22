import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ArrowsInLineVertical, Copy, MagnifyingGlass, Quotes, X } from '@phosphor-icons/react'
import { formatSeconds, type TranscriptCue } from '../../lib/mediaCatalog'

const ESTIMATED_ROW_HEIGHT = 68
const OVERSCAN = 6

interface TranscriptTeleprompterProps {
  cues: TranscriptCue[]
  /** Index into `cues` (not into the filtered view) of the cue being spoken. */
  activeCueId: number | null
  loading: boolean
  onSeek: (seconds: number) => void
  onQuote: (cue: TranscriptCue) => void
}

interface CueRowProps {
  cue: TranscriptCue
  active: boolean
  onSeek: (seconds: number) => void
  onQuote: (cue: TranscriptCue) => void
  onCopy: (cue: TranscriptCue) => void
}

const CueRow = memo(function CueRow({ cue, active, onSeek, onQuote, onCopy }: CueRowProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSeek(cue.startTime)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSeek(cue.startTime)
        }
      }}
      className={`group cursor-pointer border-l-2 px-2.5 py-2 transition-colors select-text ${
        active
          ? 'border-ed-accent bg-ed-accent/10'
          : 'border-transparent hover:border-ed-rule-strong hover:bg-ed-surface/60'
      }`}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSeek(cue.startTime)
          }}
          title={`Jump to ${formatSeconds(cue.startTime)}`}
          className={`font-mono text-[10px] font-semibold tabular-nums transition-colors ${
            active ? 'text-ed-accent' : 'text-ed-fg-faint hover:text-ed-accent'
          }`}
        >
          {formatSeconds(cue.startTime)}
        </button>
        {cue.speaker && (
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-ed-fg-muted">
            {cue.speaker}
          </span>
        )}
        <span className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onQuote(cue)
            }}
            className="st-media-icon"
            title="Insert as blockquote citation"
          >
            <Quotes size={12} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCopy(cue)
            }}
            className="st-media-icon"
            title="Copy cue text"
          >
            <Copy size={12} />
          </button>
        </span>
      </div>
      <p
        className={`mt-1 text-[12.5px] leading-relaxed ${
          active ? 'text-ed-fg font-medium' : 'text-ed-fg-secondary group-hover:text-ed-fg'
        }`}
      >
        {cue.text}
      </p>
    </div>
  )
})

/**
 * Auto-scrolling transcript.
 *
 * Transcripts run to ~1,700 cues and the player republishes the clock four times
 * a second, so the list is windowed: only the rows near the viewport are in the
 * DOM, with real heights measured as they render and an estimate standing in for
 * rows never yet seen. That keeps both the mount and each tick cheap without
 * forcing every cue to the same height, which prose cues are not.
 */
export default function TranscriptTeleprompter({
  cues,
  activeCueId,
  loading,
  onSeek,
  onQuote,
}: TranscriptTeleprompterProps) {
  const [autoScroll, setAutoScroll] = useState(true)
  const [query, setQuery] = useState('')
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(400)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const heightsRef = useRef<number[]>([])
  const [measureVersion, setMeasureVersion] = useState(0)
  const measureFrameRef = useRef<number | null>(null)
  const lastProgrammaticScrollRef = useRef(0)

  const visibleCues = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return cues
    return cues.filter(
      (cue) => cue.text.toLowerCase().includes(needle) || (cue.speaker ?? '').toLowerCase().includes(needle)
    )
  }, [cues, query])

  // Heights are indexed by position in the filtered view, so a new filter or a
  // new transcript resets the measurement cache.
  useEffect(() => {
    heightsRef.current = []
    setMeasureVersion((version) => version + 1)
    setScrollTop(0)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [visibleCues])

  const offsets = useMemo(() => {
    const result = new Array<number>(visibleCues.length + 1)
    result[0] = 0
    for (let index = 0; index < visibleCues.length; index += 1) {
      result[index + 1] = result[index] + (heightsRef.current[index] || ESTIMATED_ROW_HEIGHT)
    }
    return result
    // measureVersion is the signal that heightsRef changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleCues, measureVersion])

  const totalHeight = offsets[visibleCues.length] ?? 0

  const findIndexAtOffset = useCallback(
    (offset: number) => {
      let low = 0
      let high = visibleCues.length - 1
      let found = 0
      while (low <= high) {
        const mid = (low + high) >> 1
        if (offsets[mid] <= offset) {
          found = mid
          low = mid + 1
        } else {
          high = mid - 1
        }
      }
      return found
    },
    [offsets, visibleCues.length]
  )

  const startIndex = Math.max(0, findIndexAtOffset(scrollTop) - OVERSCAN)
  const endIndex = Math.min(visibleCues.length, findIndexAtOffset(scrollTop + viewportHeight) + OVERSCAN + 1)

  const measureRow = useCallback((index: number, element: HTMLDivElement | null) => {
    if (!element) return
    const height = element.offsetHeight
    if (height > 0 && Math.abs((heightsRef.current[index] || 0) - height) > 0.5) {
      heightsRef.current[index] = height
      if (measureFrameRef.current == null) {
        measureFrameRef.current = window.requestAnimationFrame(() => {
          measureFrameRef.current = null
          setMeasureVersion((version) => version + 1)
        })
      }
    }
  }, [])

  useEffect(
    () => () => {
      if (measureFrameRef.current != null) window.cancelAnimationFrame(measureFrameRef.current)
    },
    []
  )

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setViewportHeight(element.clientHeight))
    observer.observe(element)
    setViewportHeight(element.clientHeight)
    return () => observer.disconnect()
  }, [])

  const activeViewIndex = useMemo(() => {
    if (activeCueId == null) return -1
    return visibleCues.findIndex((cue) => cue.id === activeCueId)
  }, [activeCueId, visibleCues])

  // Keep the spoken cue a third of the way down: near enough to the top to read
  // ahead, far enough from it to keep the previous line in view.
  useEffect(() => {
    if (!autoScroll || activeViewIndex < 0) return
    const element = scrollRef.current
    if (!element) return
    const target = Math.max(0, (offsets[activeViewIndex] ?? 0) - element.clientHeight / 3)
    if (Math.abs(element.scrollTop - target) < 24) return
    lastProgrammaticScrollRef.current = Date.now()
    element.scrollTo({ top: target, behavior: 'smooth' })
  }, [activeViewIndex, autoScroll, offsets])

  const scrollToActive = useCallback(() => {
    if (activeViewIndex < 0 || !scrollRef.current) return
    const target = Math.max(0, (offsets[activeViewIndex] ?? 0) - scrollRef.current.clientHeight / 3)
    lastProgrammaticScrollRef.current = Date.now()
    scrollRef.current.scrollTo({ top: target, behavior: 'smooth' })
  }, [activeViewIndex, offsets])

  const handleCopy = useCallback((cue: TranscriptCue) => {
    void navigator.clipboard
      .writeText(cue.text)
      .then(() => {
        setCopiedId(cue.id)
        window.setTimeout(() => setCopiedId((current) => (current === cue.id ? null : current)), 1200)
      })
      .catch(() => setCopiedId(null))
  }, [])

  const handleSeekAndSync = useCallback(
    (seconds: number) => {
      onSeek(seconds)
      setAutoScroll(true)
    },
    [onSeek]
  )

  const rows = []
  for (let index = startIndex; index < endIndex; index += 1) {
    const cue = visibleCues[index]
    if (!cue) continue
    rows.push(
      <div
        key={cue.id}
        ref={(element) => measureRow(index, element)}
        style={{ position: 'absolute', top: offsets[index], left: 0, right: 0 }}
      >
        <CueRow
          cue={cue}
          active={cue.id === activeCueId}
          onSeek={handleSeekAndSync}
          onQuote={onQuote}
          onCopy={handleCopy}
        />
      </div>
    )
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {/* Transcript toolbar */}
      <div className="flex items-center gap-1.5 border-b border-ed-rule px-2.5 py-1.5">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={11}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ed-fg-faint"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find in transcript"
            aria-label="Find in transcript"
            className="w-full rounded-md border border-ed-rule bg-ed-surface py-1 pl-6 pr-6 text-[11px] text-ed-fg placeholder:text-ed-fg-faint focus:border-ed-accent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ed-fg-faint hover:text-ed-fg"
              aria-label="Clear transcript search"
            >
              <X size={11} weight="bold" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            const next = !autoScroll
            setAutoScroll(next)
            if (next) scrollToActive()
          }}
          title={autoScroll ? 'Auto-track active (scrolling manually pauses tracking)' : 'Auto-track paused — click to sync'}
          className={`st-media-icon flex items-center gap-1 px-1.5 ${autoScroll ? 'st-media-icon-primary' : 'text-ed-fg-muted hover:text-ed-fg'}`}
        >
          <ArrowsInLineVertical size={13} weight={autoScroll ? 'bold' : 'regular'} />
          <span className="text-[10px] font-medium">{autoScroll ? 'Tracking' : 'Sync'}</span>
        </button>
        <span className="min-w-[3.5rem] text-right text-[10px] tabular-nums text-ed-fg-faint">
          {query ? `${visibleCues.length}/${cues.length}` : `${cues.length} cues`}
        </span>
      </div>

      {/* Windowed cue list */}
      <div
        ref={scrollRef}
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop)
          // A user drag / scroll releases auto-scroll; programmatic scroll within threshold does not.
          if (Date.now() - lastProgrammaticScrollRef.current > 700) {
            if (autoScroll) setAutoScroll(false)
          }
        }}
        onWheel={() => {
          if (autoScroll) setAutoScroll(false)
        }}
        onTouchMove={() => {
          if (autoScroll) setAutoScroll(false)
        }}
        className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin"
      >
        {loading ? (
          <div className="px-3 py-8 text-center text-[11px] italic text-ed-fg-faint">Loading transcript&hellip;</div>
        ) : !cues.length ? (
          <div className="px-3 py-8 text-center text-[11px] italic text-ed-fg-faint">
            No transcript is indexed for this record.
          </div>
        ) : !visibleCues.length ? (
          <div className="px-3 py-8 text-center text-[11px] italic text-ed-fg-faint">
            Nothing in this transcript matches &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>{rows}</div>
        )}
      </div>

      {/* Floating Sync Pill when auto-track is disengaged */}
      {!autoScroll && activeCueId != null && activeViewIndex >= 0 && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 z-20 flex justify-center">
          <button
            type="button"
            onClick={() => {
              setAutoScroll(true)
              scrollToActive()
            }}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-ed-accent px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Resume transcript auto-tracking"
          >
            <ArrowsInLineVertical size={13} weight="bold" />
            <span>Sync to playback</span>
          </button>
        </div>
      )}

      {copiedId != null && (
        <div className="border-t border-ed-rule px-2.5 py-1 text-[10px] text-ed-success">Cue copied to clipboard</div>
      )}
    </div>
  )
}
