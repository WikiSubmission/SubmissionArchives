import { useEffect, useMemo, useState } from 'react'
import { SealCheck, Warning } from '@phosphor-icons/react'
import { fmt, qcLedger, type Ledger } from '../../lib/quranCode'

/**
 * What this corpus reproduces, and what it does not.
 *
 * §5.6 argues that a numeric research tool which hides its conventions produces
 * unfalsifiable claims. This pane is the strongest form of that argument the
 * module can make: the whole fixture table, published figure beside computed
 * figure, with the disagreements in the same list as the agreements rather than
 * in a build log nobody reads.
 *
 * The distance column is the metric, not the count of gaps. Adding a fixture
 * that nearly reproduces *raises* the gap count while improving the dataset, so
 * the header leads with the summed absolute difference. It stood at 2,123
 * before the alif class was corrected.
 */
export default function LedgerPane() {
  const [ledger, setLedger] = useState<Ledger | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [only, setOnly] = useState<'all' | 'gaps'>('all')

  useEffect(() => {
    qcLedger().then(setLedger, (e) => setError(String(e)))
  }, [])

  const rows = useMemo(() => {
    if (!ledger) return []
    const list = only === 'gaps' ? ledger.fixtures.filter((f) => !f.pass) : ledger.fixtures
    /* Gaps first. A reader who opens this pane is looking for what does not
       reproduce, and burying six rows among sixty-one would be a strange way to
       claim transparency. */
    return [...list].sort((a, b) => Number(a.pass) - Number(b.pass) || a.mode.localeCompare(b.mode))
  }, [ledger, only])

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <Warning size={20} weight="fill" className="text-ed-danger" />
        <p className="max-w-sm font-mono text-[11.5px] text-ed-fg-secondary">{error}</p>
      </div>
    )
  }

  if (!ledger) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 font-mono text-[11.5px] text-ed-fg-muted">
        Reading the ledger…
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-baseline gap-2 border-b border-ed-rule bg-ed-bg-secondary px-3.5 py-2 font-mono text-[9.5px] uppercase tracking-wider text-ed-fg-muted">
        <span className="inline-flex items-center gap-1 font-semibold text-ed-success">
          <SealCheck size={11} weight="fill" />
          {ledger.verified} verified
        </span>
        <span className="text-ed-fg-faint">|</span>
        <span className="inline-flex items-center gap-1 font-semibold text-ed-gold">
          <Warning size={11} weight="fill" />
          {ledger.known_gaps} open
        </span>
        <span className="text-ed-fg-faint">|</span>
        <span>
          distance{' '}
          <b className="font-semibold tabular-nums text-ed-fg-secondary">{fmt(ledger.distance)}</b>
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setOnly(only === 'all' ? 'gaps' : 'all')}
          className="tactile rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 font-semibold text-ed-fg-secondary hover:text-ed-fg"
        >
          {only === 'all' ? 'Gaps only' : 'Show all'}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-ed-bg">
            <tr className="border-b border-ed-rule font-mono text-[9px] uppercase tracking-wider text-ed-fg-muted">
              <th className="px-3.5 py-1.5 font-semibold">Published figure</th>
              <th className="px-2 py-1.5 font-semibold">Mode</th>
              <th className="px-2 py-1.5 text-right font-semibold">Published</th>
              <th className="px-2 py-1.5 text-right font-semibold">Computed</th>
              <th className="px-3.5 py-1.5 text-right font-semibold">Off by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => {
              const off = f.actual - f.expected
              return (
                <tr
                  key={f.id}
                  className={`border-b border-ed-rule-subtle ${f.pass ? '' : 'bg-ed-gold-soft'}`}
                >
                  <td className="px-3.5 py-1.5 font-serif text-[12.5px] leading-snug text-ed-fg-secondary">
                    {f.description}
                    <span className="ml-1.5 font-mono text-[9px] text-ed-fg-faint">{f.id}</span>
                  </td>
                  <td className="px-2 py-1.5 font-mono text-[9.5px] text-ed-fg-muted">
                    {f.mode === 'khalifa_appendix1' ? 'Appendix 1' : 'Simplified 29'}
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-[12px] tabular-nums text-ed-fg">
                    {fmt(f.expected)}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-right font-mono text-[12px] tabular-nums ${
                      f.pass ? 'text-ed-fg' : 'font-semibold text-ed-gold'
                    }`}
                  >
                    {fmt(f.actual)}
                  </td>
                  <td className="px-3.5 py-1.5 text-right font-mono text-[11px] tabular-nums">
                    {f.pass ? (
                      <span className="text-ed-success">exact</span>
                    ) : (
                      <span className="font-semibold text-ed-gold">
                        {off > 0 ? '+' : ''}
                        {fmt(off)}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="shrink-0 border-t border-ed-rule bg-ed-surface px-3.5 py-2">
        <p className="text-[11px] leading-snug text-ed-fg-muted">
          A verified row is true of the data compiled into this build: the generator refuses to
          write a dataset where one drifts. An open row is a figure this corpus cannot yet
          reproduce, kept in the same list rather than in a build log, because a tool that shows
          only its successes cannot be checked.
        </p>
      </footer>
    </div>
  )
}
