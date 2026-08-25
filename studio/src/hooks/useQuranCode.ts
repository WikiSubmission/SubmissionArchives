/**
 * Owns the QuranCode surface's query state and everything derived from it.
 *
 * The shape follows `useArchive`: one hook, one place that talks to IPC, plain
 * state out. Three things it deliberately does:
 *
 * - **Metadata loads once.** Modes, toggles, the chapter table, the value
 *   systems and the corpus totals all arrive in a single `qc_metadata` call, so
 *   nothing in the UI hardcodes a count.
 * - **Every scope change refetches counts for all countable modes.** The
 *   backend returns them together, so comparison costs one call.
 * - **Requests are sequenced.** A fast toggle flip while a corpus count is in
 *   flight must not paint the older result over the newer one, so each fetch
 *   carries a token and a stale reply is dropped.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  NO_MODIFIERS,
  qcAggregate,
  qcComputeValue,
  qcFindByNumber,
  qcFindText,
  qcGetChapter,
  qcValueOfText,
  qcSimilarity,
  qcWordInfo,
  qcCount,
  qcGetVerse,
  qcLetterFrequency,
  qcMetadata,
  type Aggregate,
  type AggregateQuery,
  type ChapterInfo,
  type Counts,
  type LetterStat,
  type Metadata,
  type Scope,
  type ModifierId,
  type Modifiers,
  type Toggles,
  type ToggleId,
  type ChapterView,
  type SearchResult,
  type SelectionValue,
  type ValueResult,
  type VerseView,
} from '../lib/quranCode'
import type { NumberQuery, QueryTab, SimilarQuery, TextQuery } from '../components/qurancode/QueryPane'

export type ScopeLevel = 'corpus' | 'chapter' | 'verse' | 'word'

export interface QuranCodeState {
  loading: boolean
  error: string | null
  metadata: Metadata | null

  chapter: number
  verse: number
  word: number | null
  level: ScopeLevel
  mode: string
  valueSystem: string
  divisor: number
  toggles: Toggles | null
  includeBasmalah: boolean

  verseView: VerseView | null
  chapterView: ChapterView | null
  reading: 'verse' | 'chapter'
  selection: SelectionValue | null
  counts: Counts[]
  frequency: LetterStat[]
  value: ValueResult | null
  preset: string
  modifiers: Modifiers

  queryTab: QueryTab
  textQuery: TextQuery
  numberQuery: NumberQuery
  similarQuery: SimilarQuery
  rootQuery: string
  results: SearchResult | null
  searchError: string | null
  searching: boolean
  aggregateQuery: AggregateQuery
  aggregate: Aggregate | null
  aggregateError: string | null
  aggregating: boolean
  activeChapter: ChapterInfo | null
  scope: Scope
  busy: boolean

  setChapter: (n: number) => void
  setVerse: (n: number) => void
  setWord: (n: number | null) => void
  setLevel: (level: ScopeLevel) => void
  setMode: (id: string) => void
  setValueSystem: (id: string) => void
  setDivisor: (n: number) => void
  toggleMark: (id: ToggleId) => void
  setPreset: (id: string) => void
  toggleModifier: (id: ModifierId) => void
  setQueryTab: (tab: QueryTab) => void
  setTextQuery: (q: TextQuery) => void
  setNumberQuery: (q: NumberQuery) => void
  setSimilarQuery: (q: SimilarQuery) => void
  setRootQuery: (q: string) => void
  runSearch: () => void
  setAggregateQuery: (q: AggregateQuery) => void
  runAggregate: () => void
  clearResults: () => void
  lookupWordRoot: (position: number) => void
  setIncludeBasmalah: (on: boolean) => void
  setReading: (mode: 'verse' | 'chapter') => void
  measureSelection: (text: string) => void
  clearSelection: () => void
  stepVerse: (delta: number) => void
  stepChapter: (delta: number) => void
}

/** The divisors the stepper cycles. 19 first because it is the number the whole
 * literature is about; the rest are the small primes a researcher reaches for
 * next. */
export const DIVISORS = [7, 11, 13, 17, 19, 23, 29]

export function useQuranCode(): QuranCodeState {
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [chapter, setChapterRaw] = useState(1)
  const [verse, setVerseRaw] = useState(1)
  const [word, setWord] = useState<number | null>(null)
  const [level, setLevel] = useState<ScopeLevel>('verse')
  const [mode, setMode] = useState('simplified29')
  const [valueSystem, setValueSystem] = useState('abjad_standard')
  const [divisor, setDivisor] = useState(19)
  const [toggles, setToggles] = useState<Toggles | null>(null)
  const [includeBasmalah, setIncludeBasmalah] = useState(false)

  const [queryTab, setQueryTab] = useState<QueryTab>('text')
  const [textQuery, setTextQuery] = useState<TextQuery>({
    query: '',
    kind: 'exact',
    location: 'anywhere',
    wordness: 'whole_word',
  })
  const [numberQuery, setNumberQuery] = useState<NumberQuery>({ target: '', quantity: 'letters' })
  const [similarQuery, setSimilarQuery] = useState<SimilarQuery>({
    method: 'similar_text',
    threshold: 0.8,
  })
  const [rootQuery, setRootQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [aggregateQuery, setAggregateQuery] = useState<AggregateQuery>({})
  const [aggregate, setAggregate] = useState<Aggregate | null>(null)
  const [aggregateError, setAggregateError] = useState<string | null>(null)
  const [aggregating, setAggregating] = useState(false)

  const [preset, setPresetRaw] = useState('simple_value')
  const [modifiers, setModifiers] = useState<Modifiers>(NO_MODIFIERS)
  const [value, setValue] = useState<ValueResult | null>(null)
  const [verseView, setVerseView] = useState<VerseView | null>(null)
  const [chapterView, setChapterView] = useState<ChapterView | null>(null)
  const [reading, setReading] = useState<'verse' | 'chapter'>('verse')
  const [selection, setSelection] = useState<SelectionValue | null>(null)
  const [counts, setCounts] = useState<Counts[]>([])
  const [frequency, setFrequency] = useState<LetterStat[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    qcMetadata()
      .then((meta) => {
        if (cancelled) return
        setMetadata(meta)
        setMode(meta.default_mode)
        setToggles(meta.corpus.provenance.toggles)
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) setError(String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const activeChapter = useMemo(
    () => metadata?.chapters.find((c) => c.number === chapter) ?? null,
    [metadata, chapter]
  )

  /* Clamping lives here rather than at each call site so the stepper, the
     chapter list and a direct edit cannot disagree about what a legal verse is. */
  const setChapter = useCallback(
    (n: number) => {
      if (!metadata) return
      const clamped = Math.min(114, Math.max(1, n))
      setChapterRaw(clamped)
      const total = metadata.chapters.find((c) => c.number === clamped)?.verses ?? 1
      setVerseRaw((v) => Math.min(Math.max(1, v), total))
      setWord(null)
    },
    [metadata]
  )

  const setVerse = useCallback(
    (n: number) => {
      const total = activeChapter?.verses ?? 1
      setVerseRaw(Math.min(Math.max(1, n), total))
      setWord(null)
    },
    [activeChapter]
  )

  /** Walks past a chapter boundary in either direction, because a researcher
   * reading straight through should not have to stop and change two fields. */
  const stepVerse = useCallback(
    (delta: number) => {
      if (!metadata) return
      const total = activeChapter?.verses ?? 1
      const next = verse + delta
      if (next >= 1 && next <= total) {
        setVerseRaw(next)
        setWord(null)
        return
      }
      if (next < 1 && chapter > 1) {
        const prev = metadata.chapters.find((c) => c.number === chapter - 1)
        setChapterRaw(chapter - 1)
        setVerseRaw(prev?.verses ?? 1)
        setWord(null)
        return
      }
      if (next > total && chapter < 114) {
        setChapterRaw(chapter + 1)
        setVerseRaw(1)
        setWord(null)
      }
    },
    [metadata, activeChapter, chapter, verse]
  )

  const stepChapter = useCallback((delta: number) => setChapter(chapter + delta), [chapter, setChapter])

  const toggleMark = useCallback((id: ToggleId) => {
    setToggles((current) => (current ? { ...current, [id]: !current[id] } : current))
  }, [])

  const setPreset = useCallback(
    (id: string) => {
      setPresetRaw(id)
      // "custom" keeps whatever is currently ticked; a named preset replaces it.
      if (id === 'custom') return
      const found = metadata?.presets.find((p) => p.id === id)
      if (found) setModifiers(found.modifiers)
    },
    [metadata]
  )

  /* Touching any checkbox means the combination is no longer the preset's, and
     saying so is the point: a value is only meaningful beside the modifier set
     that produced it. */
  const toggleModifier = useCallback((id: ModifierId) => {
    setModifiers((current) => ({ ...current, [id]: !current[id] }))
    setPresetRaw('custom')
  }, [])

  /* An aggregate is a question about a set, so like a search it runs when
     asked rather than on every scope change. It carries the divisor because the
     divisibility test is part of the answer, not a display option. */
  const aggregateToken = useRef(0)
  const aggregateRan = useRef(false)

  const runAggregate = useCallback(() => {
    if (!toggles) return
    aggregateRan.current = true
    const mine = ++aggregateToken.current
    setAggregating(true)
    setAggregateError(null)
    qcAggregate(aggregateQuery, mode, toggles, valueSystem, divisor)
      .then(
        (a) => {
          if (mine !== aggregateToken.current) return
          setAggregate(a)
        },
        (e) => {
          if (mine !== aggregateToken.current) return
          setAggregateError(String(e))
          setAggregate(null)
        }
      )
      .finally(() => {
        if (mine === aggregateToken.current) setAggregating(false)
      })
  }, [aggregateQuery, mode, toggles, valueSystem, divisor])

  /* A live aggregate answers under the mode, toggles, value system and divisor
     that were active when it ran, so a later change to any of them would leave
     a stale number on screen claiming a convention it was not computed under.
     Rerunning is cheaper than explaining that, and clearing it would throw away
     the researcher's query.

     Keyed on the convention alone. Editing the query must not refire, because
     a half-typed selector is not a question, and the effect watches a string
     rather than the values so a new but equal `toggles` object cannot trigger a
     spurious run. */
  const convention = `${mode}|${valueSystem}|${divisor}|${JSON.stringify(toggles)}`
  const lastConvention = useRef(convention)
  useEffect(() => {
    if (!aggregateRan.current || lastConvention.current === convention) {
      lastConvention.current = convention
      return
    }
    lastConvention.current = convention
    runAggregate()
  }, [convention, runAggregate])

  /* Search results are their own request, not part of the scope effect: a
     query is something the researcher runs, and refiring it on every verse step
     would make the centre pane flicker between reading and results. */
  const searchToken = useRef(0)

  const runSearch = useCallback(() => {
    if (!toggles) return
    const mine = ++searchToken.current
    setSearching(true)
    setSearchError(null)

    const finish = (r: SearchResult) => {
      if (mine !== searchToken.current) return
      setResults(r)
    }
    const fail = (e: unknown) => {
      if (mine !== searchToken.current) return
      setSearchError(String(e))
      setResults(null)
    }
    const done = () => {
      if (mine === searchToken.current) setSearching(false)
    }

    if (queryTab === 'text' || queryTab === 'root') {
      const isRoot = queryTab === 'root'
      qcFindText(isRoot ? rootQuery : textQuery.query, {
        kind: isRoot ? 'root' : textQuery.kind,
        location: textQuery.location,
        wordness: textQuery.wordness,
        mode,
        toggles,
      })
        .then(finish, fail)
        .finally(done)
      return
    }

    if (queryTab === 'numbers') {
      const target = Number(numberQuery.target)
      if (!Number.isFinite(target)) {
        setSearchError('Enter a number to search for')
        setSearching(false)
        return
      }
      qcFindByNumber(
        target,
        numberQuery.quantity,
        numberQuery.quantity === 'value' ? valueSystem : undefined,
        mode,
        toggles
      )
        .then(finish, fail)
        .finally(done)
      return
    }

    qcSimilarity(chapter, verse, similarQuery.method, similarQuery.threshold, mode, toggles)
      .then(finish, fail)
      .finally(done)
  }, [queryTab, textQuery, rootQuery, numberQuery, similarQuery, mode, toggles, valueSystem, chapter, verse])

  /* A selection is measured on demand rather than on every mouse move: the
     researcher finishes dragging, then asks. Its figure sits beside the scope
     counts instead of replacing them, because the two answer different
     questions and overwriting one with the other loses the comparison. */
  const measureSelection = useCallback(
    (text: string) => {
      if (!toggles || !text.trim()) return
      qcValueOfText(text, mode, toggles, valueSystem === 'none' ? undefined : valueSystem)
        .then(setSelection)
        .catch(() => setSelection(null))
    },
    [mode, toggles, valueSystem]
  )

  const clearSelection = useCallback(() => setSelection(null), [])

  const clearResults = useCallback(() => {
    searchToken.current++
    setResults(null)
    setSearchError(null)
  }, [])

  /** Loads a word's root into the root query and switches to that tab, which is
   * the old app's Ctrl+Click on a word. */
  const lookupWordRoot = useCallback(
    (position: number) => {
      qcWordInfo(chapter, verse, position, mode, toggles ?? undefined)
        .then((info) => {
          if (!info.roots.length) return
          setRootQuery(info.roots[0])
          setQueryTab('root')
        })
        .catch((e) => setSearchError(String(e)))
    },
    [chapter, verse, mode, toggles]
  )

  const scope: Scope = useMemo(() => {
    const base: Scope = { include_basmalah: includeBasmalah }
    if (level === 'corpus') return base
    if (level === 'chapter') return { ...base, chapter }
    if (level === 'verse') return { ...base, chapter, verse }
    return { ...base, chapter, verse, word: word ?? 1 }
  }, [level, chapter, verse, word, includeBasmalah])

  /* One token per fetch. A stale reply from a slower call must never paint over
     a newer one, which is easy to hit by flipping a toggle during a corpus
     count. */
  const token = useRef(0)

  useEffect(() => {
    if (!metadata || !toggles) return
    const mine = ++token.current
    setBusy(true)

    const wantsValue = valueSystem !== 'none' && valueSystem !== 'counts_only'

    /* `allSettled`, not `all`. These four answer different panels, and a single
       rejection must degrade its own panel rather than blanking the pane: with
       `all`, picking the Original reading mode made the value call reject and
       took the counts, the frequency table and the verse down with it. */
    Promise.allSettled([
      qcCount(scope, toggles, valueSystem === 'none' ? undefined : valueSystem),
      qcLetterFrequency(scope, mode, toggles),
      qcGetVerse(chapter, verse, mode, toggles),
      wantsValue
        ? qcComputeValue(scope, valueSystem, modifiers, mode, toggles)
        : Promise.resolve(null),
      reading === 'chapter' ? qcGetChapter(chapter, mode, toggles) : Promise.resolve(null),
    ])
      .then(([nextCounts, nextFrequency, nextVerse, nextValue, nextChapter]) => {
        if (mine !== token.current) return
        if (nextCounts.status === 'fulfilled') setCounts(nextCounts.value)
        if (nextFrequency.status === 'fulfilled') setFrequency(nextFrequency.value)
        if (nextVerse.status === 'fulfilled') setVerseView(nextVerse.value)
        setValue(nextValue.status === 'fulfilled' ? nextValue.value : null)
        if (nextChapter.status === 'fulfilled') setChapterView(nextChapter.value)

        // Report the first real failure rather than the last, so the message
        // names the thing that actually broke.
        const failure = [nextCounts, nextFrequency, nextVerse, nextValue, nextChapter].find(
          (r) => r.status === 'rejected'
        )
        setError(failure ? String((failure as PromiseRejectedResult).reason) : null)
      })
      .finally(() => {
        if (mine === token.current) setBusy(false)
      })
  }, [metadata, toggles, scope, mode, valueSystem, modifiers, chapter, verse, reading])

  return {
    loading,
    error,
    metadata,
    chapter,
    verse,
    word,
    level,
    mode,
    valueSystem,
    divisor,
    toggles,
    includeBasmalah,
    verseView,
    chapterView,
    reading,
    selection,
    counts,
    frequency,
    value,
    preset,
    modifiers,
    queryTab,
    textQuery,
    numberQuery,
    similarQuery,
    rootQuery,
    results,
    searchError,
    searching,
    aggregateQuery,
    aggregate,
    aggregateError,
    aggregating,
    activeChapter,
    scope,
    busy,
    setChapter,
    setVerse,
    setWord,
    setLevel,
    setMode,
    setValueSystem,
    setDivisor,
    toggleMark,
    setPreset,
    toggleModifier,
    setQueryTab,
    setTextQuery,
    setNumberQuery,
    setSimilarQuery,
    setRootQuery,
    runSearch,
    setAggregateQuery,
    runAggregate,
    clearResults,
    lookupWordRoot,
    setIncludeBasmalah,
    setReading,
    measureSelection,
    clearSelection,
    stepVerse,
    stepChapter,
  }
}
