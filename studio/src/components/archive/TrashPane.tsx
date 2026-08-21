import { useEffect, useState } from 'react'
import { safeInvoke as invoke } from '../../lib/ipc'
import { ArrowCounterClockwise, Trash } from '@phosphor-icons/react'

interface TrashEntry {
  id: string
  name: string
  original_path: string
  trashed_at: number
}

interface TrashPaneProps {
  archivePath: string
  onRestore: (path: string) => void
  refreshToken?: number
}

export default function TrashPane({ archivePath, onRestore, refreshToken }: TrashPaneProps) {
  const [entries, setEntries] = useState<TrashEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    invoke<TrashEntry[]>('list_trash', { archiveRoot: archivePath })
      .then((result) => {
        setEntries(result)
        setError(null)
      })
      .catch((err) => setError(String(err)))
  }

  useEffect(() => {
    refresh()
  }, [archivePath, refreshToken])

  const handleRestore = async (entry: TrashEntry) => {
    try {
      const path = await invoke<string>('restore_note', { archiveRoot: archivePath, entryId: entry.id })
      refresh()
      onRestore(path)
    } catch (err) {
      setError(String(err))
    }
  }

  const handleDelete = async (entry: TrashEntry) => {
    if (!window.confirm(`Permanently delete "${entry.name}"? This cannot be undone.`)) return
    try {
      await invoke('permanently_delete_trash_entry', { archiveRoot: archivePath, entryId: entry.id })
      refresh()
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="st-sidebar-header border-b border-ed-rule/60">
        <span className="st-sidebar-title">Trash</span>
        <span className="st-sidebar-count">{entries.length} {entries.length === 1 ? 'item' : 'items'}</span>
      </div>

      {error && <div className="px-4 py-2 text-xs text-ed-danger font-mono">{error}</div>}
      {entries.length === 0 && !error && (
        <div className="px-4 py-8 text-xs text-ed-fg-faint text-center italic">Trash is empty.</div>
      )}

      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-thin">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center justify-between gap-2 px-3 py-2 rounded-[6px] bg-ed-surface/40 hover:bg-ed-surface-raised border border-ed-rule/60 hover:border-ed-rule-strong text-xs text-ed-fg transition-all"
          >
            <span className="truncate flex-1 font-medium text-[13px] text-ed-fg-secondary group-hover:text-ed-fg">{entry.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => handleRestore(entry)}
                title="Restore note"
                aria-label="Restore"
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-ed-fg-muted hover:text-ed-success hover:bg-ed-success-soft transition-all"
              >
                <ArrowCounterClockwise size={14} weight="bold" />
              </button>
              <button
                onClick={() => handleDelete(entry)}
                title="Delete permanently"
                aria-label="Delete permanently"
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-ed-fg-muted hover:text-ed-danger hover:bg-ed-danger-soft transition-all"
              >
                <Trash size={14} weight="regular" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
