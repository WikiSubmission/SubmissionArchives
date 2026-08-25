import { fmt, type LetterStat } from '../../lib/quranCode'

/**
 * The old app's `# L Freq ΣPos Σ∆` table.
 *
 * The two right-hand columns are what make it more than a histogram: the sum of
 * each letter's positions in the scope's letter stream, and the sum of the gaps
 * between its consecutive occurrences. Both are inputs to the position and
 * distance value modifiers that arrive in 9d, so they are computed here rather
 * than added later.
 *
 * The bar behind the frequency is a background fill rather than a separate
 * element, so the number stays readable at any width and the column keeps its
 * tabular alignment.
 */
export default function LetterFrequencyTable({ stats }: { stats: LetterStat[] }) {
  if (stats.length === 0) {
    return <p className="p-2 text-center font-mono text-[11px] text-ed-fg-muted">No letters in scope.</p>
  }
  const max = stats[0].count || 1

  return (
    <div className="overflow-hidden rounded-md border border-ed-rule bg-ed-surface-raised shadow-2xs">
      <table className="w-full border-collapse font-mono text-[11px]">
        <thead>
          <tr className="border-b border-ed-rule bg-ed-surface">
            {['#', 'L', 'Freq', 'ΣPos', 'Σ∆'].map((h, i) => (
              <th
                key={h}
                scope="col"
                className={`px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-ed-fg-muted ${
                  i === 1 ? 'text-center' : 'text-right'
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ed-rule">
          {stats.map((s, i) => (
            <tr key={s.letter} className="transition-colors hover:bg-ed-surface">
              <td className="px-2 py-0.5 text-right font-mono text-[9.5px] tabular-nums text-ed-fg-faint">
                {i + 1}
              </td>
              <td className="px-2 py-0.5 text-center font-arabic text-[16px] leading-none text-ed-fg">
                {s.letter}
              </td>
              <td
                className="relative px-2 py-0.5 text-right font-mono text-[11px] font-semibold tabular-nums text-ed-fg"
                style={{
                  backgroundImage: `linear-gradient(to left, var(--ed-accent-soft) ${(s.count / max) * 100}%, transparent ${(s.count / max) * 100}%)`,
                }}
              >
                {s.count}
              </td>
              <td className="px-2 py-0.5 text-right font-mono text-[10.5px] tabular-nums text-ed-fg-secondary">
                {fmt(s.sum_positions)}
              </td>
              <td className="px-2 py-0.5 text-right font-mono text-[10.5px] tabular-nums text-ed-fg-secondary">
                {s.sum_distances || '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
