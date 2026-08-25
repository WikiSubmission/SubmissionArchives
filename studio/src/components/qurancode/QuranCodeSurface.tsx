import { useCallback, useEffect, useMemo, useState } from 'react'
import { Panel, PanelGroup } from 'react-resizable-panels'
import { Warning } from '@phosphor-icons/react'
import ResizeHandle from '../workspace/ResizeHandle'
import { DIVISORS, useQuranCode } from '../../hooks/useQuranCode'
import { citationOf, fmt, type ToggleId } from '../../lib/quranCode'
import {
  findingAsProse,
  findingFromCounts,
  findingFromValue,
  insertFinding,
  registerCiteAction,
  toCsv,
} from '../../lib/quranCodeBus'
import { save } from '@tauri-apps/plugin-dialog'
import { safeInvoke } from '../../lib/ipc'
import ScopeBar from './ScopeBar'
import VerseBrowser, { type BottomTab } from './VerseBrowser'
import ReadoutPane from './ReadoutPane'
import ModeSelectors from './ModeSelectors'
import ChapterList from './ChapterList'
import QueryPane from './QueryPane'
import ResultsList from './ResultsList'

/**
 * The QuranCode research surface: query, text, readout.
 *
 * It renders inside the editor region rather than as a modal or an inspector
 * tab. That is what buys split-view against the note being written, a tab in
 * the header, a place in the history stack and per-archive pane persistence,
 * none of which an overlay can have. See §1.2 of the module plan.
 *
 * The nested `PanelGroup` is the same construction `WorkspaceLayout` uses for
 * the editor split, so pane sizes persist under their own `autoSaveId` without
 * this component storing any layout state.
 */
export default function QuranCodeSurface() {
  const qc = useQuranCode()
  const [copyLabel, setCopyLabel] = useState('Copy')

  /* The centre pane is either reading or answering, never both. A search
     switches it to results; opening a hit switches it back, which is what makes
     a result feel like a place to go rather than a list to squint at. */
  const [view, setView] = useState<'read' | 'results'>('read')
  const [bottomTab, setBottomTab] = useState<BottomTab>('words')

  /** How many times each governed mark occurs in the verse on screen, so a
   * toggle that cannot change anything here can say so instead of looking
   * broken. Counted off the Uthmani text, which is what the toggles act on. */
  const occurrences = useMemo(() => {
    const text = qc.verseView?.words.map((w) => w.uthmani).join('') ?? ''
    const count = (chars: string[]) =>
      [...text].filter((c) => chars.includes(c)).length
    return {
      hamza_on_line: count(['ء']),
      superscript_alef: count(['ٰ']),
      small_waw_yeh: count(['ۥ', 'ۦ']),
      silent_marked: count(['۟']),
    } satisfies Partial<Record<ToggleId, number>>
  }, [qc.verseView])

  const handleCopy = useCallback(() => {
    const primary = qc.counts.find((c) => c.provenance.text_mode === qc.mode) ?? qc.counts[0]
    if (!primary) return
    navigator.clipboard.writeText(citationOf(primary, qc.divisor)).then(
      () => {
        setCopyLabel('Copied')
        setTimeout(() => setCopyLabel('Copy'), 1600)
      },
      () => setCopyLabel('Copy failed')
    )
  }, [qc.counts, qc.mode, qc.divisor])

  const runSearch = useCallback(() => {
    setView('results')
    qc.runSearch()
  }, [qc])

  const openHit = useCallback(
    (chapter: number, verse: number) => {
      qc.setChapter(chapter)
      qc.setVerse(verse)
      qc.setLevel('verse')
      setView('read')
    },
    [qc]
  )

  /* The finding goes to whichever editor pane holds the active-editor slot, so
     splitting the surface against a note and pressing the shortcut lands the
     block in the note rather than in whichever pane mounted first. When no pane
     is editable the figure goes to the clipboard instead of vanishing. */
  const citeFinding = useCallback(() => {
    const primary = qc.counts.find((c) => c.provenance.text_mode === qc.mode) ?? qc.counts[0]
    if (!primary) return
    const attrs = qc.value
      ? findingFromValue(qc.value, primary.words)
      : findingFromCounts(primary)

    if (insertFinding(attrs)) {
      setCopyLabel('Cited')
      setTimeout(() => setCopyLabel('Copy'), 1600)
      return
    }
    navigator.clipboard.writeText(findingAsProse(attrs)).then(() => {
      setCopyLabel('No note open, copied')
      setTimeout(() => setCopyLabel('Copy'), 2200)
    })
  }, [qc.counts, qc.value, qc.mode])

  /** Exports whatever the readout is showing. Local file write through the
   * dialog plugin the archive picker already uses, so nothing leaves the
   * machine. */
  const exportCsv = useCallback(async () => {
    const rows: (string | number)[][] = [
      ['scope', 'text_mode', 'value_system', 'chapters', 'verses', 'words', 'letters', 'unique_letters', 'value', 'verified'],
      ...qc.counts.map((c) => [
        c.provenance.scope,
        c.provenance.text_mode,
        c.provenance.value_system ?? '',
        c.chapters,
        c.verses,
        c.words,
        c.letters,
        c.unique_letters,
        c.value ?? '',
        c.provenance.known_gaps.length === 0 ? 'yes' : 'no',
      ]),
      [],
      ['letter', 'frequency', 'sum_positions', 'sum_distances'],
      ...qc.frequency.map((f) => [f.letter, f.count, f.sum_positions, f.sum_distances]),
    ]
    try {
      const destination = await save({
        defaultPath: `qurancode-${(qc.counts[0]?.provenance.scope ?? 'scope').replace(/[^0-9a-z]+/gi, '-')}.csv`,
        filters: [{ name: 'CSV', extensions: ['csv'] }],
      })
      if (!destination) return
      await safeInvoke('write_note', { path: destination, content: toCsv(rows) })
      setCopyLabel('Exported')
      setTimeout(() => setCopyLabel('Copy'), 1600)
    } catch {
      setCopyLabel('Export failed')
      setTimeout(() => setCopyLabel('Copy'), 2200)
    }
  }, [qc.counts, qc.frequency])

  // The Ctrl+Shift+V handler in App has no view of the current figure, so the
  // surface parks its action while mounted and withdraws it on unmount.
  useEffect(() => {
    registerCiteAction(citeFinding)
    return () => registerCiteAction(null)
  }, [citeFinding])

  const stepDivisor = useCallback(
    (delta: number) => {
      const i = DIVISORS.indexOf(qc.divisor)
      qc.setDivisor(DIVISORS[Math.min(DIVISORS.length - 1, Math.max(0, i + delta))])
    },
    [qc]
  )

  if (qc.loading) {
    return <Centered>Loading the corpus…</Centered>
  }

  if (qc.error && !qc.metadata) {
    return (
      <Centered>
        <Warning size={24} weight="fill" className="text-ed-danger" />
        <p className="max-w-md text-center text-sm text-ed-fg-secondary">
          This pane needs the desktop build. The research corpus is compiled into the Rust binary
          with <code className="font-mono text-ed-fg">include_str!</code>, so a browser preview has
          nothing to read.
        </p>
        <code className="rounded-md border border-ed-rule-strong bg-ed-surface px-2.5 py-1.5 font-mono text-[12px] text-ed-fg">
          npm run tauri dev
        </code>
        <details className="max-w-lg">
          <summary className="cursor-pointer text-center font-mono text-[10px] uppercase tracking-wider text-ed-fg-muted">
            Details
          </summary>
          <code className="mt-1.5 block break-words rounded-sm border border-ed-rule bg-ed-surface px-2 py-1 font-mono text-[11px] text-ed-fg-muted">
            {qc.error}
          </code>
        </details>
      </Centered>
    )
  }

  if (!qc.metadata || !qc.toggles) return <Centered>Loading…</Centered>

  return (
    <div className="flex h-full flex-col bg-ed-bg">
      <PanelGroup direction="horizontal" autoSaveId="sa-studio-qurancode" className="flex-1">
        {/* ── query ── */}
        <Panel id="qc-query" order={1} defaultSize={20} minSize={15} maxSize={32} className="min-w-0">
          <div className="flex h-full flex-col border-r border-ed-rule bg-ed-bg-secondary">
            <div className="min-h-0 flex-1 overflow-y-auto">
              <QueryPane
                tab={qc.queryTab}
                text={qc.textQuery}
                numbers={qc.numberQuery}
                similar={qc.similarQuery}
                root={qc.rootQuery}
                busy={qc.searching}
                scopeLabel={`${qc.chapter}:${qc.verse}`}
                onTabChange={qc.setQueryTab}
                onTextChange={qc.setTextQuery}
                onNumbersChange={qc.setNumberQuery}
                onSimilarChange={qc.setSimilarQuery}
                onRootChange={qc.setRootQuery}
                onRun={runSearch}
              />
              <div className="border-t border-ed-rule">
                <ChapterList
                  chapters={qc.metadata.chapters}
                  active={qc.chapter}
                  onSelect={(c) => {
                    qc.setChapter(c)
                    setView('read')
                  }}
                />
              </div>
            </div>
            <ModeSelectors
              modes={qc.metadata.modes}
              valueSystems={qc.metadata.value_systems}
              mode={qc.mode}
              valueSystem={qc.valueSystem}
              includeBasmalah={qc.includeBasmalah}
              onModeChange={qc.setMode}
              onValueSystemChange={qc.setValueSystem}
              onIncludeBasmalahChange={qc.setIncludeBasmalah}
            />
          </div>
        </Panel>

        <ResizeHandle id="qc-query-handle" />

        {/* ── text ── */}
        <Panel id="qc-text" order={2} minSize={30} className="min-w-0">
          <div className="flex h-full flex-col">
            <ScopeBar
              chapter={qc.chapter}
              verse={qc.verse}
              word={qc.word}
              level={qc.level}
              activeChapter={qc.activeChapter}
              wordCount={qc.verseView?.words.length ?? 0}
              onStepChapter={qc.stepChapter}
              onStepVerse={qc.stepVerse}
              onStepWord={(d) => {
                const total = qc.verseView?.words.length ?? 0
                if (!total) return
                const next = (qc.word ?? (d > 0 ? 0 : total + 1)) + d
                qc.setWord(next < 1 || next > total ? null : next)
              }}
              onLevelChange={(level) => {
                qc.setLevel(level)
                // Choosing a chapter scope is also a request to read the
                // chapter, which is what "load a full surah" means.
                if (level === 'chapter') qc.setReading('chapter')
                if (level === 'verse' || level === 'word') qc.setReading('verse')
              }}
              reading={qc.reading}
              onReadingChange={qc.setReading}
              view={view}
              hasResults={Boolean(qc.results)}
              onViewChange={setView}
            />
            {view === 'results' ? (
              <ResultsList
                result={qc.results}
                error={qc.searchError}
                busy={qc.searching}
                onOpen={openHit}
              />
            ) : (
              <VerseBrowser
                verse={qc.verseView}
                chapter={qc.chapterView}
                reading={qc.reading}
                selectedWord={qc.word}
                bottomTab={bottomTab}
                hasSelection={Boolean(qc.selection)}
                onSelectWord={(position) => {
                  qc.setWord(position)
                  qc.setLevel(position === null ? 'verse' : 'word')
                }}
                onLookupRoot={qc.lookupWordRoot}
                onBottomTabChange={setBottomTab}
                onMeasureSelection={qc.measureSelection}
                onClearSelection={qc.clearSelection}
                onOpenVerse={(v) => {
                  qc.setVerse(v)
                  qc.setReading('verse')
                  qc.setLevel('verse')
                }}
                onCopy={handleCopy}
                onCite={citeFinding}
                onExport={exportCsv}
                copyLabel={copyLabel}
              />
            )}
          </div>
        </Panel>

        <ResizeHandle id="qc-readout-handle" />

        {/* ── readout ── */}
        <Panel id="qc-readout" order={3} defaultSize={26} minSize={18} maxSize={42} className="min-w-0">
          <div className="flex h-full flex-col border-l border-ed-rule bg-ed-bg-secondary">
            <ReadoutPane
              counts={qc.counts}
              frequency={qc.frequency}
              toggleSpecs={qc.metadata.toggles}
              toggles={qc.toggles}
              occurrences={qc.level === 'verse' || qc.level === 'word' ? occurrences : undefined}
              divisor={qc.divisor}
              activeMode={qc.mode}
              busy={qc.busy}
              value={qc.value}
              selection={qc.selection}
              onClearSelection={qc.clearSelection}
              presets={qc.metadata.presets}
              preset={qc.preset}
              modifiers={qc.modifiers}
              onToggleMark={qc.toggleMark}
              onDivisorStep={stepDivisor}
              onPresetChange={qc.setPreset}
              onModifierToggle={qc.toggleModifier}
            />
          </div>
        </Panel>
      </PanelGroup>

      {/* The corpus figures are never hardcoded in the UI; they come from
          qc_metadata, which computes them from the bundled data. */}
      <footer className="flex h-6 shrink-0 items-center gap-4 border-t border-ed-rule bg-ed-bg-secondary px-3 font-mono text-[10px] text-ed-fg-muted">
        <span>{qc.metadata.modes.find((m) => m.id === qc.mode)?.label}</span>
        <span>scope <b className="font-medium text-ed-fg-secondary">{qc.scope.chapter ? qc.counts[0]?.provenance.scope : 'corpus'}</b></span>
        <span className="flex-1" />
        {qc.results && (
          <span>
            {fmt(qc.results.total)} hit{qc.results.total === 1 ? '' : 's'}
          </span>
        )}
        {qc.error && <span className="text-ed-danger">{qc.error}</span>}
        <span>
          corpus{' '}
          <b className="font-medium text-ed-fg-secondary">
            {qc.metadata.corpus.chapters} / {qc.metadata.corpus.verses.toLocaleString('en-US')} /{' '}
            {qc.metadata.corpus.words.toLocaleString('en-US')} /{' '}
            {qc.metadata.corpus.letters.toLocaleString('en-US')}
          </b>
        </span>
      </footer>
    </div>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-ed-bg p-8 text-sm text-ed-fg-muted">
      {children}
    </div>
  )
}
