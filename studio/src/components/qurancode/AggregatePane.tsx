import { Warning } from '@phosphor-icons/react'
import type { Aggregate } from '../../lib/quranCode'
import { fmt } from '../../lib/quranCode'
import ProvenanceChip from './ProvenanceChip'

interface AggregatePaneProps {
  result: Aggregate | null
  error: string | null
  busy: boolean
  onCite: () => void
  onCopy: () => void
  copyLabel: string
}

/**
 * The totals pane.
 *
 * Every other pane in this surface answers a question about one contiguous
 * stretch of text. This one answers questions about a *set*: how many word
 * instances match, how many verses they touch, what their verse numbers add up
 * to. That is the shape nearly every published 19-based argument takes, and it
 * is the one thing the counting engine could not previously express.
 *
 * Three things it deliberately does.
 *
 * **Every figure carries its remainder.** A total is rendered beside its
 * quotient when the division is exact and beside its remainder when it is not.
 * Showing only the multiples would make the pane an advocate; showing the
 * misses alongside them is what makes it an instrument.
 *
 * **The selector is displayed as prominently as the numbers.** Provenance says
 * how the corpus was counted. The selector says what was selected. A figure
 * needs both to be checkable by anyone else, and the second is the half that
 * published arguments usually omit.
 *
 * **The two verse-number sums sit side by side.** "The numbers of the verses
 * where the word occurs" is ambiguous between counting a verse once and
 * counting it once per occurrence. For the divine name those are 118,123 and
 * 182,034, and only the first is a multiple of 19. Naming both is the
 * difference between a reproducible claim and a lucky one.
 */
export default function AggregatePane({
  result,
  error,
  busy,
  onCite,
  onCopy,
  copyLabel,
}: AggregatePaneProps) {
  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <Warning size={20} weight="fill" className="text-ed-danger" />
        <p className="max-w-sm font-mono text-[11.5px] text-ed-fg-secondary">{error}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center font-mono text-[11.5px] text-ed-fg-muted">
        {busy ? 'Totalling…' : 'Choose what to total, then run.'}
      </div>
    )
  }

  const exact = result.figures.filter((f) => f.exact && f.total !== 0).length

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${busy ? 'opacity-60' : ''}`}>
      <header className="shrink-0 border-b border-ed-rule bg-ed-bg-secondary px-3.5 py-2">
        <div className="flex items-baseline gap-2 font-mono text-[9.5px] uppercase tracking-wider text-ed-fg-muted">
          <span className="font-semibold text-ed-fg-secondary">Totals</span>
          <span className="text-ed-fg-faint">|</span>
          <span>
            {exact} of {result.figures.length} divide by {result.divisor}
          </span>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onCopy}
            className="tactile rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 font-semibold text-ed-fg-secondary hover:text-ed-fg"
          >
            {copyLabel}
          </button>
          <button
            type="button"
            onClick={onCite}
            className="tactile rounded border border-ed-rule bg-ed-surface px-1.5 py-0.5 font-semibold text-ed-fg-secondary hover:text-ed-fg"
          >
            Cite
          </button>
        </div>
        <p className="mt-1 font-serif text-[12.5px] leading-snug text-ed-fg">
          <span className="text-ed-fg-muted">Selected: </span>
          {result.selector}
        </p>
        {result.first && result.last && (
          <p className="mt-0.5 font-mono text-[9.5px] tabular-nums text-ed-fg-faint">
            {result.first} … {result.last}
          </p>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-ed-bg">
            <tr className="border-b border-ed-rule font-mono text-[9px] uppercase tracking-wider text-ed-fg-muted">
              <th className="px-3.5 py-1.5 font-semibold">Figure</th>
              <th className="px-2 py-1.5 text-right font-semibold">Total</th>
              <th className="px-2 py-1.5 text-right font-semibold">÷ {result.divisor}</th>
              <th className="px-2 py-1.5 text-right font-semibold">Digit sum</th>
              <th className="px-3.5 py-1.5 text-right font-semibold">Root</th>
            </tr>
          </thead>
          <tbody>
            {result.figures.map((f) => (
              <tr
                key={f.id}
                className={`border-b border-ed-rule-subtle ${
                  f.exact && f.total !== 0 ? 'bg-ed-gold-soft' : ''
                }`}
              >
                <td className="px-3.5 py-1.5 font-serif text-[12.5px] text-ed-fg-secondary">
                  {f.label}
                </td>
                <td
                  className={`px-2 py-1.5 text-right font-mono text-[13px] tabular-nums ${
                    f.exact && f.total !== 0 ? 'font-bold text-ed-gold' : 'text-ed-fg'
                  }`}
                >
                  {fmt(f.total)}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-[11px] tabular-nums">
                  {f.total === 0 ? (
                    <span className="text-ed-fg-faint">—</span>
                  ) : f.exact ? (
                    <span className="font-semibold text-ed-gold">
                      {fmt(f.quotient)} × {result.divisor}
                    </span>
                  ) : (
                    <span className="text-ed-fg-muted">
                      r {f.remainder}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-[11px] tabular-nums text-ed-fg-muted">
                  {f.digit_sum}
                </td>
                <td className="px-3.5 py-1.5 text-right font-mono text-[11px] tabular-nums text-ed-fg-muted">
                  {f.digital_root}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {result.examples.length > 0 && (
          <section className="border-t border-ed-rule px-3.5 py-2">
            <h3 className="font-mono text-[9px] font-semibold uppercase tracking-wider text-ed-fg-muted">
              First {result.examples.length} of {fmt(result.occurrences)}
            </h3>
            {/* Addresses rather than a hit list: the point is to make a total
                spot-checkable without paying for a second query, not to become
                a second results pane. */}
            <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 font-mono text-[10px] tabular-nums text-ed-fg-secondary">
              {result.examples.map((a) => (
                <span key={a}>{a}</span>
              ))}
            </p>
          </section>
        )}
      </div>

      <ProvenanceChip provenance={result.provenance} />
    </div>
  )
}
