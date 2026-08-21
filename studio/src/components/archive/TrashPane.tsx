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
      <div className="p-4 shrink-0 border-b border-ed-rule">
        <span className="text-xs font-bold uppercase tracking-wider text-ed-fg-secondary">Trash</span>
      </div>

      {error && <div className="px-4 py-2 text-xs text-ed-danger font-mono">{error}</div>}
      {entries.length === 0 && !error && (
        <div className="px-4 py-8 text-xs text-ed-fg-secondary text-center italic">Trash is empty.</div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center gap-1.5 px-3 py-1.5 text-xs text-ed-fg-secondary hover:bg-ed-surface transition-colors"
          >
            <span className="truncate flex-1 font-medium">{entry.name}</span>
            <button
              onClick={() => handleRestore(entry)}
              title="Restore note"
              aria-label="Restore"
              className="opacity-0 group-hover:opacity-100 p-1 text-ed-fg-secondary hover:text-ed-success transition-colors shrink-0"
            >
              <ArrowCounterClockwise size={14} weight="bold" />
            </button>
            <button
              onClick={() => handleDelete(entry)}
              title="Delete permanently"
              aria-label="Delete permanently"
              className="opacity-0 group-hover:opacity-100 p-1 text-ed-fg-secondary hover:text-ed-danger transition-colors shrink-0"
            >
              <Trash size={14} weight="regular" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
