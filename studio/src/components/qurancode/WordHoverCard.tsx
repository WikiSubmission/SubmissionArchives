import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { WordView } from '../../lib/quranCode'

/**
 * What one word is, on hover: its gloss, its transliteration, and the folded
 * letter stream the counts are actually taken over.
 *
 * Showing the fold matters more than it looks. The Uthmani form on the card and
 * the letters underneath it are different strings, and a researcher who cannot
 * see the difference has no way to tell why a count came out as it did.
 *
 * Rendered through a portal because the card has to escape the pane's
 * `overflow-y-auto`, and positioned after measuring so it flips above or below
 * the word rather than being clipped at the viewport edge.
 */
export default function WordHoverCard({ word, anchor }: { word: WordView; anchor: DOMRect }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const left = Math.max(8, Math.min(anchor.left + anchor.width / 2 - box.width / 2, window.innerWidth - box.width - 8))
    const above = anchor.top - box.height - 8
    setPos({ left, top: above < 8 ? anchor.bottom + 8 : above })
  }, [anchor, word.position])

  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999, opacity: pos ? 1 : 0 }}
      className="pointer-events-none fixed z-[70] flex max-w-[280px] min-w-[210px] flex-col gap-1 rounded-md border border-ed-rule-strong bg-ed-surface-raised p-3 shadow-ed-md transition-opacity"
    >
      <span dir="rtl" className="text-right font-arabic text-[22px] leading-none text-ed-fg">
        {word.uthmani}
      </span>
      <span className="font-mono text-[11px] font-semibold text-ed-accent">{word.translit}</span>
      <span className="font-serif text-[13px] leading-snug text-ed-fg-secondary">{word.gloss}</span>

      <div className="mt-1 flex items-baseline justify-between border-t border-ed-rule pt-2 font-mono text-[10px] text-ed-fg-muted">
        <span>folded stream:</span>
        <div className="flex items-baseline gap-1">
          <span dir="rtl" className="font-arabic text-[16px] font-medium text-ed-fg">
            {word.folded}
          </span>
          <span className="tabular-nums text-ed-fg-faint">({word.letters}L)</span>
        </div>
      </div>
    </div>,
    document.body
  )
}
