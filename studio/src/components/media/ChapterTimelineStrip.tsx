import { useEffect, useRef } from 'react'
import { formatSeconds, type MediaChapter } from '../../lib/mediaCatalog'

interface ChapterTimelineStripProps {
  chapters: MediaChapter[]
  activeIndex: number
  onSeek: (seconds: number) => void
}

/** Horizontal chapter rail. Kept above the transcript so the reader can jump by
 * argument rather than by minute. */
export default function ChapterTimelineStrip({ chapters, activeIndex, onSeek }: ChapterTimelineStripProps) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const activeRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (activeIndex < 0 || !activeRef.current || !railRef.current) return
    const rail = railRef.current
    const pill = activeRef.current
    const offset = pill.offsetLeft - rail.clientWidth / 2 + pill.clientWidth / 2
    rail.scrollTo({ left: Math.max(0, offset), behavior: 'smooth' })
  }, [activeIndex])

  if (!chapters.length) return null

  return (
    <div className="border-b border-ed-rule bg-ed-bg-secondary/60">
      <div className="flex items-baseline justify-between px-2.5 pt-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ed-fg-secondary">Chapters</span>
        <span className="text-[10px] text-ed-fg-faint">{chapters.length}</span>
      </div>
      <div ref={railRef} className="flex gap-1.5 overflow-x-auto px-2.5 py-2 scrollbar-thin">
        {chapters.map((chapter, index) => {
          const active = index === activeIndex
          return (
            <button
              key={`${chapter.id}-${chapter.startTime}`}
              ref={active ? activeRef : undefined}
              onClick={() => onSeek(chapter.startTime)}
              title={chapter.speaker ? `${chapter.title} — ${chapter.speaker}` : chapter.title}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                active
                  ? 'border-ed-accent bg-ed-accent text-ed-on-accent'
                  : 'border-ed-rule bg-ed-surface text-ed-fg-secondary hover:border-ed-rule-strong hover:text-ed-fg'
              }`}
            >
              <span className="font-mono text-[10px] tabular-nums opacity-80">{formatSeconds(chapter.startTime)}</span>
              <span className="max-w-[15rem] truncate font-medium">{chapter.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
