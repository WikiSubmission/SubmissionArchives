import { ClockCounterClockwise, FileText } from '@phosphor-icons/react'
import logoMark from '../assets/submission-archives-mark.png'
import { useRecentNotes } from '../hooks/useRecentNotes'

interface HomeDashboardProps {
  archivePath: string
  onOpenFile: (path: string) => void
}

function formatRelativeTime(epochMs: number): string {
  const diff = Date.now() - epochMs
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function HomeDashboard({ archivePath, onOpenFile }: HomeDashboardProps) {
  const { recents } = useRecentNotes(archivePath)

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col items-center pt-20 px-8 relative select-none">
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(107, 52, 16, 0.05) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        <img
          src={logoMark}
          alt=""
          className="h-12 w-12 mb-5 select-none opacity-80"
          draggable={false}
        />
        <h1 className="text-xl font-bold text-ed-fg tracking-tight">
          Peace be upon you!
        </h1>
        <p className="text-xs text-ed-fg-muted mt-1.5 leading-relaxed text-center font-medium">
          Open or create a note from the Archive Explorer to start writing. Type{' '}
          <code className="text-amber-400 font-mono text-[11px] bg-ed-surface px-1 py-0.5 rounded border border-ed-rule">/quran 1:1-7</code>{' '}
          to insert a verse, or{' '}
          <code className="text-amber-400 font-mono text-[11px] bg-ed-surface px-1 py-0.5 rounded border border-ed-rule">[[Page Name]]</code>{' '}
          to link another note.
        </p>

        {recents.length > 0 && (
          <div className="w-full mt-10">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-ed-fg-muted mb-2 pl-1">
              <ClockCounterClockwise size={13} weight="bold" />
              Recently visited
            </div>
            <div className="space-y-0.5">
              {recents.map((entry) => (
                <button
                  key={entry.path}
                  onClick={() => onOpenFile(entry.path)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-150 group tactile hover:bg-ed-surface"
                >
                  <FileText
                    size={16}
                    weight="regular"
                    className="text-ed-fg-muted group-hover:text-ed-fg transition-colors shrink-0"
                  />
                  <span className="text-xs text-ed-fg-muted group-hover:text-ed-fg truncate flex-1 font-medium tracking-tight transition-colors">
                    {entry.name}
                  </span>
                  <span className="text-[10px] text-ed-fg-muted font-mono shrink-0 transition-colors">
                    {formatRelativeTime(entry.openedAt)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
