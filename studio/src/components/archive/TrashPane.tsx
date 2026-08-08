import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { RotateCcw, Trash2 } from 'lucide-react'

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
      <div className="p-4 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Trash</span>
      </div>

      {error && <div className="px-4 pb-2 text-xs text-red-400 font-mono">{error}</div>}
      {entries.length === 0 && !error && <div className="px-4 text-xs text-white/30">Trash is empty.</div>}

      <div className="flex-1 overflow-y-auto">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center gap-1.5 px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 transition-colors"
          >
            <span className="truncate flex-1">{entry.name}</span>
            <button
              onClick={() => handleRestore(entry)}
              title="Restore"
              className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-ed-accent transition-colors shrink-0"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => handleDelete(entry)}
              title="Delete permanently"
              className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-red-400 transition-colors shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
