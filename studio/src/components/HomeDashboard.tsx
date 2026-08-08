import { Clock, FileText } from 'lucide-react'
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
  return `${days}d ago`
}

export default function HomeDashboard({ archivePath, onOpenFile }: HomeDashboardProps) {
  const { recents } = useRecentNotes(archivePath)

  return (
    <div className="h-full w-full overflow-y-auto flex flex-col items-center pt-24 px-8">
      <img src={logoMark} alt="" className="h-12 w-12 mb-4 select-none animate-fade-in-up" draggable={false} />
      <h1 className="text-xl font-semibold text-white/90 animate-fade-in-up [animation-delay:40ms]">Peace be upon you!</h1>
      <p className="text-sm text-white/40 mt-1 max-w-md text-center animate-fade-in-up [animation-delay:80ms]">
        Open or create a note from the Archive Explorer to start writing. Type{' '}
        <code className="text-white/60">/quran 1:1-7</code> to insert a verse, or{' '}
        <code className="text-white/60">[[Page Name]]</code> to link another note.
      </p>

      {recents.length > 0 && (
        <div className="w-full max-w-md mt-10 animate-fade-in-up [animation-delay:120ms]">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/30 mb-2">
            <Clock size={12} />
            Recently visited
          </div>
          <div className="space-y-1">
            {recents.map((entry) => (
              <button
                key={entry.path}
                onClick={() => onOpenFile(entry.path)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 text-left transition-colors"
              >
                <FileText size={14} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/70 truncate flex-1">{entry.name}</span>
                <span className="text-xs text-white/25 shrink-0">{formatRelativeTime(entry.openedAt)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
