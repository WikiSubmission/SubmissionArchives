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
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onCite}
        title="Insert this figure into the open note (Ctrl+Shift+V)"
        className="tactile inline-flex items-center gap-1.5 rounded border border-qv-border/70 bg-qv-tint/50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-qv-muted transition-colors hover:border-qv-border hover:bg-qv-tint-strong hover:text-qv-fg"
      >
        <Quotes size={11} weight="fill" />
        Cite
      </button>
      <button
        type="button"
        onClick={onExport}
        title="Export the readout as CSV"
        className="tactile inline-flex items-center gap-1.5 rounded border border-qv-border/70 bg-qv-tint/50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-qv-muted transition-colors hover:border-qv-border hover:bg-qv-tint-strong hover:text-qv-fg"
      >
        <DownloadSimple size={11} />
        CSV
      </button>
      <button
        type="button"
        onClick={onCopy}
        className="tactile inline-flex items-center gap-1.5 rounded border border-qv-border/70 bg-qv-tint/50 px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-qv-muted transition-colors hover:border-qv-border hover:bg-qv-tint-strong hover:text-qv-fg"
      >
        {copyLabel === 'Copied' ? <Check size={11} weight="bold" /> : <Copy size={11} />}
        {copyLabel}
      </button>
    </div>
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
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-md border border-ed-gold/45 bg-ed-gold-soft px-2.5 py-1.5 shadow-xs backdrop-blur-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold tracking-wide text-ed-gold">
            <SelectionIcon size={13} weight="bold" />
            <span>Measuring active selection</span>
          </div>
          <button
            type="button"
            onClick={() => {
              document.getSelection()?.removeAllRanges()
              onClearSelection()
            }}
            className="tactile rounded px-1.5 py-0.5 font-mono text-[10px] font-medium text-ed-gold underline hover:text-ed-fg"
          >
            Clear selection
          </button>
        </div>
      )}

      {reading === 'chapter' && chapter ? (
        <article className="relative overflow-hidden rounded-lg border border-qv-border bg-qv-bg shadow-[var(--qv-shadow)]">
          <header className="flex flex-wrap items-center gap-2.5 border-b border-qv-divider bg-qv-tint px-4 py-2">
            <span className="rounded border border-qv-border/60 bg-qv-bg px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-qv-accent">
              Sura {chapter.chapter}
            </span>
            <span dir="rtl" className="font-arabic text-[17px] text-qv-fg">
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
              className="border-b border-qv-divider px-4 py-3.5 text-center font-arabic text-[20px] leading-loose text-qv-accent select-none"
            >
              {chapter.basmalah.words.map((w) => w.uthmani).join(' ')}
            </p>
          )}

          <div className="flex flex-col">
            {chapter.verses.map((v) => (
              <section
                key={v.verse}
                className="border-b border-qv-divider px-4 py-3.5 transition-colors last:border-b-0 hover:bg-qv-tint/40"
              >
                <p dir="rtl" className="text-right font-arabic text-[21px] leading-[2.2] text-qv-fg">
                  {v.words.map((w) => w.uthmani).join(' ')}
                  <button
                    type="button"
                    onClick={() => onOpenVerse(v.verse)}
                    title={`Focus ${v.chapter}:${v.verse}`}
                    className="tactile mx-1.5 inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full border border-qv-border/80 bg-qv-bg px-1 font-mono text-[10px] font-semibold tabular-nums text-qv-accent transition-colors hover:border-qv-accent hover:bg-qv-tint-strong"
                  >
                    {v.verse}
                  </button>
                </p>
                {v.english && (
                  <p className="mt-2 font-serif text-[13.5px] leading-relaxed text-qv-fg/80">
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
            <article className="relative overflow-hidden rounded-lg border border-qv-border bg-qv-bg shadow-[var(--qv-shadow)]">
              <header className="flex items-center gap-2 border-b border-qv-divider bg-qv-tint px-4 py-2">
                <span className="rounded border border-qv-border/60 bg-qv-bg px-2 py-0.5 font-mono text-[11px] font-bold tracking-wider text-qv-accent">
                  {verse.chapter}:{verse.verse}
                </span>
                <span className="flex-1" />
                {actions}
              </header>

              <p
                dir="rtl"
                className="flex flex-wrap justify-start gap-x-[0.42em] gap-y-1 px-5 pb-3 pt-5 text-right font-arabic text-[clamp(21px,2.4vw,27px)] leading-[2.3] text-qv-fg"
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
                    className={`rounded px-[0.1em] py-[0.02em] transition-all hover:bg-qv-tint-strong ${
                      selectedWord === w.position
                        ? 'bg-qv-accent/15 text-qv-fg ring-1 ring-qv-accent/40 shadow-xs'
                        : ''
                    }`}
                  >
                    {w.uthmani}
                  </button>
                ))}
              </p>

              {verse.english && (
                <p className="mt-2 border-t border-qv-divider px-5 pb-4 pt-2.5 font-serif text-[14.5px] leading-relaxed text-qv-fg/90">
                  <span className="mr-1 align-super font-mono text-[10px] font-semibold text-qv-subtle">
                    {verse.verse}
                  </span>
                  {verse.english}
                </p>
              )}

              <ProvenanceChip provenance={verse.provenance} />
            </article>

            <section className="flex flex-col gap-2.5">
              <div className="flex items-baseline gap-2">
                <div
                  role="tablist"
                  aria-label="Verse detail"
                  className="flex gap-0.5 rounded-md border border-ed-rule bg-ed-surface p-0.5"
                >
                  {(
                    [
                      ['words', 'Word by word'],
                      ['translation', 'Translation'],
                    ] as const
                  ).map(([id, label]) => {
                    const active = bottomTab === id
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onBottomTabChange(id)}
                        className={`rounded px-2.5 py-1 font-mono text-[10.5px] font-medium tracking-wide transition-all ${
                          active
                            ? 'border border-ed-rule-strong bg-ed-surface-raised font-semibold text-ed-fg shadow-xs'
                            : 'text-ed-fg-muted hover:text-ed-fg'
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                <span className="h-px flex-1 self-center bg-ed-rule" />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                  {verse.words.length} words
                </span>
              </div>

              {bottomTab === 'words' ? (
                <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(118px,1fr))]">
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
                      className={`tactile flex flex-col gap-1 rounded-md border p-2 text-right transition-all ${
                        selectedWord === w.position
                          ? 'border-ed-accent bg-ed-accent-soft ring-1 ring-ed-accent/30 shadow-xs'
                          : 'border-ed-rule bg-ed-surface-raised hover:border-ed-rule-strong hover:bg-ed-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between text-left">
                        <span className="font-mono text-[9px] font-semibold tabular-nums text-ed-fg-faint">
                          #{w.position}
                        </span>
                        <span className="font-mono text-[9px] tabular-nums text-ed-fg-faint">
                          {w.letters}L
                        </span>
                      </div>
                      <span dir="rtl" className="my-0.5 font-arabic text-[18px] leading-snug text-ed-fg">
                        {w.uthmani}
                      </span>
                      <span className="truncate text-left font-mono text-[9.5px] text-ed-fg-muted">
                        {w.translit}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Word for word beside the gloss, so the reader can see which
                   English belongs to which Arabic rather than inferring it from
                   order. */
                <div className="overflow-hidden rounded-md border border-ed-rule bg-ed-surface-raised shadow-xs">
                  <div className="grid grid-cols-[2.5rem_1fr_1.3fr] items-center gap-2 border-b border-ed-rule bg-ed-surface px-3 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-ed-fg-muted">
                    <span>#</span>
                    <span className="text-right">Word</span>
                    <span>Gloss & Transliteration</span>
                  </div>
                  <div className="divide-y divide-ed-rule">
                    {verse.words.map((w) => (
                      <div
                        key={w.position}
                        className="grid grid-cols-[2.5rem_1fr_1.3fr] items-baseline gap-2 px-3 py-2 transition-colors hover:bg-ed-surface"
                      >
                        <span className="font-mono text-[9.5px] font-semibold tabular-nums text-ed-fg-faint">
                          {w.position}
                        </span>
                        <span
                          dir="rtl"
                          className="text-right font-arabic text-[18px] leading-snug text-ed-fg"
                        >
                          {w.uthmani}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-serif text-[13px] leading-snug text-ed-fg-secondary">
                            {w.gloss}
                          </span>
                          <span className="font-mono text-[9.5px] text-ed-fg-muted">{w.translit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
