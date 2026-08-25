import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Copy,
  Check,
  Quotes,
  DownloadSimple,
  Selection as SelectionIcon,
} from '@phosphor-icons/react'
import type { ChapterView, VerseView, WordView } from '../../lib/quranCode'
import ProvenanceChip from './ProvenanceChip'
import WordHoverCard from './WordHoverCard'

export type BottomTab = 'words' | 'translation'

interface VerseBrowserProps {
  verse: VerseView | null
  chapter: ChapterView | null
  reading: 'verse' | 'chapter'
  selectedWord: number | null
  bottomTab: BottomTab
  hasSelection: boolean
  onSelectWord: (position: number | null) => void
  onLookupRoot: (position: number) => void
  onBottomTabChange: (tab: BottomTab) => void
  onMeasureSelection: (text: string) => void
  onClearSelection: () => void
  onOpenVerse: (verse: number) => void
  onCopy: () => void
  onCite: () => void
  onExport: () => void
  copyLabel: string
}

/**
 * The reading surface, in one of two modes.
 *
 * `verse` is the close-reading view: one verse, its words laid out for
 * inspection. `chapter` is the whole sura in reading order, which is what a
 * researcher wants when the question is about a sura rather than a line.
 *
 * Both use the Quran embed's `--qv-*` "Ink on Parchment" sub-brand rather than
 * the app tokens, so a verse looks the same here as it does inside a note.
 *
 * **Selecting Arabic with the mouse measures it.** Highlighting any run of the
 * text and releasing asks the backend to fold and value exactly those letters,
 * which is the only way to ask about a phrase that is not a whole verse, word
 * or chapter.
 */
export default function VerseBrowser({
  verse,
  chapter,
  reading,
  selectedWord,
  bottomTab,
  hasSelection,
  onSelectWord,
  onLookupRoot,
  onBottomTabChange,
  onMeasureSelection,
  onClearSelection,
  onOpenVerse,
  onCopy,
  onCite,
  onExport,
  copyLabel,
}: VerseBrowserProps) {
  const [hovered, setHovered] = useState<{ word: WordView; anchor: DOMRect } | null>(null)
  const surface = useRef<HTMLDivElement>(null)

  /* Measured on mouse-up rather than on selectionchange: the researcher
     finishes dragging, then asks. Firing mid-drag would send a request per
     pixel and paint a number that is never the one they meant. */
  const captureSelection = useCallback(() => {
    const picked = document.getSelection()?.toString() ?? ''
    if (picked.trim().length > 1) onMeasureSelection(picked)
  }, [onMeasureSelection])

  useEffect(() => {
    const node = surface.current
    if (!node) return
    node.addEventListener('mouseup', captureSelection)
    return () => node.removeEventListener('mouseup', captureSelection)
  }, [captureSelection])

  const show = (word: WordView) => (e: React.MouseEvent | React.FocusEvent) =>
    setHovered({ word, anchor: (e.currentTarget as HTMLElement).getBoundingClientRect() })

  /* Ctrl or Cmd click loads the word's root into the query, which is the old
     app's own gesture for "show me the rest of this family". A plain click
     narrows the scope to the word. */
  const pick = (position: number) => (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onLookupRoot(position)
      return
    }
    onSelectWord(selectedWord === position ? null : position)
  }

  const actions = (
    <>
      <button
        type="button"
        onClick={onCite}
        title="Insert this figure into the open note (Ctrl+Shift+V)"
        className="tactile inline-flex items-center gap-1 rounded-sm border border-qv-border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-qv-muted hover:bg-qv-tint-strong hover:text-qv-fg"
      >
        <Quotes size={11} weight="fill" />
        Cite
      </button>
      <button
        type="button"
        onClick={onExport}
        title="Export the readout as CSV"
        className="tactile inline-flex items-center gap-1 rounded-sm border border-qv-border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-qv-muted hover:bg-qv-tint-strong hover:text-qv-fg"
      >
        <DownloadSimple size={11} />
        CSV
      </button>
      <button
        type="button"
        onClick={onCopy}
        className="tactile inline-flex items-center gap-1 rounded-sm border border-qv-border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-qv-muted hover:bg-qv-tint-strong hover:text-qv-fg"
      >
        {copyLabel === 'Copied' ? <Check size={11} weight="bold" /> : <Copy size={11} />}
        {copyLabel}
      </button>
    </>
  )

  if (!verse && !chapter) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-ed-fg-muted">
        Loading…
      </div>
    )
  }

  return (
    <div ref={surface} className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      {hasSelection && (
        <button
          type="button"
          onClick={() => {
            document.getSelection()?.removeAllRanges()
            onClearSelection()
          }}
          className="tactile sticky top-0 z-10 flex items-center gap-1.5 self-start rounded-md border border-ed-gold/45 bg-ed-gold-soft px-2 py-1 font-mono text-[10px] font-semibold tracking-wide text-ed-gold"
        >
          <SelectionIcon size={12} weight="bold" />
          Measuring your selection &middot; clear
        </button>
      )}

      {reading === 'chapter' && chapter ? (
        <article className="relative overflow-hidden rounded-xl border border-qv-border bg-qv-bg shadow-[var(--qv-shadow)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-qv-accent/20 to-transparent" />
          <header className="flex flex-wrap items-center gap-2 border-b border-qv-divider bg-qv-tint px-4 py-2">
            <span className="font-mono text-[11px] font-bold tracking-wider text-qv-accent">
              Sura {chapter.chapter}
            </span>
            <span dir="rtl" className="font-arabic text-[16px] text-qv-fg">
              {chapter.name_arabic}
            </span>
            <span className="font-serif text-[13px] text-qv-muted">
              {chapter.name_transliterated} &middot; {chapter.name_english}
            </span>
            <span className="flex-1" />
            {actions}
          </header>

          {chapter.basmalah && (
            <p
              dir="rtl"
              title="The unnumbered Basmalah. Not verse 1, and not counted as one."
              className="border-b border-qv-divider px-4 py-3 text-center font-arabic text-[19px] leading-loose text-qv-accent"
            >
              {chapter.basmalah.words.map((w) => w.uthmani).join(' ')}
            </p>
          )}

          <div className="flex flex-col">
            {chapter.verses.map((v) => (
              <section
                key={v.verse}
                className="border-b border-qv-divider px-4 py-3 last:border-b-0 hover:bg-qv-tint/60"
              >
                <p dir="rtl" className="text-right font-arabic text-[21px] leading-[2.05] text-qv-fg">
                  {v.words.map((w) => w.uthmani).join(' ')}
                  <button
                    type="button"
                    onClick={() => onOpenVerse(v.verse)}
                    title={`Focus ${v.chapter}:${v.verse}`}
                    className="tactile mx-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-qv-border px-1 font-mono text-[10px] tabular-nums text-qv-accent hover:bg-qv-tint-strong"
                  >
                    {v.verse}
                  </button>
                </p>
                {v.english && (
                  <p className="mt-1.5 font-serif text-[13.5px] leading-relaxed text-qv-muted">
                    {v.english}
                  </p>
                )}
              </section>
            ))}
          </div>

          <ProvenanceChip provenance={chapter.provenance} />
        </article>
      ) : (
        verse && (
          <>
            <article className="relative overflow-hidden rounded-xl border border-qv-border bg-qv-bg shadow-[var(--qv-shadow)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-qv-accent/20 to-transparent" />
              <header className="flex items-center gap-2 border-b border-qv-divider bg-qv-tint px-4 py-2">
                <span className="font-mono text-[11px] font-bold tracking-wider text-qv-accent">
                  {verse.chapter}:{verse.verse}
                </span>
                <span className="flex-1" />
                {actions}
              </header>

              <p
                dir="rtl"
                className="flex flex-wrap justify-start gap-x-[0.38em] px-4 pb-2 pt-4 text-right font-arabic text-[clamp(19px,2.1vw,25px)] leading-[2.15] text-qv-fg"
              >
                {verse.words.map((w) => (
                  <button
                    key={w.position}
                    type="button"
                    onClick={pick(w.position)}
                    title="Click to scope to this word, Ctrl+Click for its root"
                    onMouseEnter={show(w)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={show(w)}
                    onBlur={() => setHovered(null)}
                    className={`rounded-[3px] px-[0.06em] transition-colors hover:bg-qv-tint-strong ${
                      selectedWord === w.position
                        ? 'bg-qv-accent/20 shadow-[0_1.5px_0_var(--qv-accent)]'
                        : ''
                    }`}
                  >
                    {w.uthmani}
                  </button>
                ))}
              </p>

              {verse.english && (
                <p className="mt-2 border-t border-qv-divider px-4 pb-4 pt-1.5 font-serif text-[14.5px] leading-relaxed text-qv-fg">
                  <span className="mr-0.5 align-super font-mono text-[10px] text-qv-subtle">
                    {verse.verse}
                  </span>
                  {verse.english}
                </p>
              )}

              <ProvenanceChip provenance={verse.provenance} />
            </article>

            <section className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <div
                  role="tablist"
                  aria-label="Verse detail"
                  className="flex gap-0.5 rounded-[7px] border border-ed-rule bg-ed-surface p-0.5"
                >
                  {(
                    [
                      ['words', 'Word by word'],
                      ['translation', 'Translation'],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={bottomTab === id}
                      onClick={() => onBottomTabChange(id)}
                      className={`rounded-[5px] px-2 py-1 font-mono text-[10px] font-semibold tracking-wide transition-colors ${
                        bottomTab === id
                          ? 'border border-ed-rule-strong bg-ed-surface-raised text-ed-fg shadow-xs'
                          : 'text-ed-fg-muted hover:text-ed-fg-secondary'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <span className="h-px flex-1 self-center bg-ed-rule" />
                <span className="font-mono text-[10px] uppercase tracking-[0.11em] text-ed-fg-muted">
                  {verse.words.length} words
                </span>
              </div>

              {bottomTab === 'words' ? (
                <div className="grid gap-1.5 [grid-template-columns:repeat(auto-fill,minmax(112px,1fr))]">
                  {verse.words.map((w) => (
                    <button
                      key={w.position}
                      type="button"
                      onClick={pick(w.position)}
                      title="Click to scope to this word, Ctrl+Click for its root"
                      onMouseEnter={show(w)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={show(w)}
                      onBlur={() => setHovered(null)}
                      className={`tactile flex flex-col gap-0.5 rounded-md border p-1.5 text-right transition-colors ${
                        selectedWord === w.position
                          ? 'border-ed-accent bg-ed-accent-soft'
                          : 'border-ed-rule bg-ed-surface-raised hover:border-ed-accent'
                      }`}
                    >
                      <span className="text-left font-mono text-[9px] tabular-nums text-ed-fg-faint">
                        {w.position}
                      </span>
                      <span dir="rtl" className="font-arabic text-[17px] leading-snug text-ed-fg">
                        {w.uthmani}
                      </span>
                      <span className="truncate text-left font-mono text-[9px] text-ed-fg-muted">
                        {w.translit}
                      </span>
                      <span className="text-left font-mono text-[9px] tabular-nums text-ed-fg-faint">
                        {w.letters} letters
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Word for word beside the gloss, so the reader can see which
                   English belongs to which Arabic rather than inferring it from
                   order. */
                <div className="flex flex-col divide-y divide-ed-rule rounded-md border border-ed-rule bg-ed-surface-raised">
                  {verse.words.map((w) => (
                    <div
                      key={w.position}
                      className="grid grid-cols-[2rem_1fr_1.2fr] items-baseline gap-2 px-2 py-1.5"
                    >
                      <span className="font-mono text-[9px] tabular-nums text-ed-fg-faint">
                        {w.position}
                      </span>
                      <span
                        dir="rtl"
                        className="text-right font-arabic text-[17px] leading-snug text-ed-fg"
                      >
                        {w.uthmani}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-serif text-[12.5px] leading-snug text-ed-fg-secondary">
                          {w.gloss}
                        </span>
                        <span className="font-mono text-[9px] text-ed-fg-muted">{w.translit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )
      )}

      {hovered && <WordHoverCard word={hovered.word} anchor={hovered.anchor} />}
    </div>
  )
}
