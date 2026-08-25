import { Warning, SealCheck } from '@phosphor-icons/react'
import type { Provenance } from '../../lib/quranCode'

/**
 * The strip that makes a number citable.
 *
 * There is no single true letter count, so a figure without its convention is
 * not a fact. This renders the mode, the value system, the scope and the active
 * marks beside every result, and marks the figure unverified where the mode has
 * an unresolved rule. Making the lazy path the correct one is the whole job.
 */
export default function ProvenanceChip({ provenance }: { provenance: Provenance }) {
  const marks = Object.entries(provenance.toggles)
    .filter(([, on]) => on)
    .map(([id]) => id.replace(/_/g, ' '))

  const unverified = provenance.known_gaps.length > 0

  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 py-2.5 border-t border-qv-divider bg-qv-tint">
      <Chip label="mode" value={provenance.text_mode_label} />
      {provenance.value_system && <Chip label="system" value={provenance.value_system} />}
      <Chip label="scope" value={provenance.scope} />
      {marks.length > 0 && <Chip label="marks" value={marks.join(', ')} />}
      {provenance.include_basmalah && <Chip label="incl." value="basmalah" />}

      {unverified ? (
        <span
          title={provenance.known_gaps.join('\n')}
          className="inline-flex items-center gap-1 rounded-sm border border-ed-danger/45 bg-ed-danger-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ed-danger"
        >
          <Warning size={11} weight="fill" />
          unverified &middot; {provenance.known_gaps.length} open{' '}
          {provenance.known_gaps.length === 1 ? 'gap' : 'gaps'}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-sm border border-ed-success/45 bg-ed-success-soft px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-ed-success">
          <SealCheck size={11} weight="fill" />
          verified &middot; {provenance.verified.length} fixtures
        </span>
      )}
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-sm border border-qv-border px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-qv-muted">
      {label} <b className="font-semibold text-qv-fg">{value}</b>
    </span>
  )
}
