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
    return <p className="text-[11px] text-ed-fg-muted">No letters in this scope.</p>
  }
  const max = stats[0].count || 1

  return (
    <table className="w-full border-collapse font-mono text-[11px]">
      <thead>
        <tr>
          {['#', 'L', 'Freq', 'ΣPos', 'Σ∆'].map((h, i) => (
            <th
              key={h}
              scope="col"
              className={`border-b border-ed-rule-strong px-1 py-1 text-[9px] font-semibold uppercase tracking-wider text-ed-fg-muted ${
                i === 1 ? 'text-center' : 'text-right'
              }`}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {stats.map((s, i) => (
          <tr key={s.letter} className="hover:bg-ed-surface-strong">
            <td className="border-b border-ed-rule px-1 py-0.5 text-right tabular-nums text-ed-fg-secondary">
              {i + 1}
            </td>
            <td className="border-b border-ed-rule px-1 py-0.5 text-center font-arabic text-[15px] text-ed-fg">
              {s.letter}
            </td>
            <td
              className="relative border-b border-ed-rule px-1 py-0.5 text-right font-semibold tabular-nums text-ed-fg"
              style={{
                backgroundImage: `linear-gradient(to left, var(--ed-accent-soft) ${(s.count / max) * 100}%, transparent ${(s.count / max) * 100}%)`,
              }}
            >
              {s.count}
            </td>
            <td className="border-b border-ed-rule px-1 py-0.5 text-right tabular-nums text-ed-fg-secondary">
              {fmt(s.sum_positions)}
            </td>
            <td className="border-b border-ed-rule px-1 py-0.5 text-right tabular-nums text-ed-fg-secondary">
              {s.sum_distances || '–'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
