import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { FilePlus } from 'lucide-react'
import TreeNode from './TreeNode'
import type { ArchiveEntry } from './types'

interface ArchiveExplorerProps {
  archivePath: string
  activeFilePath: string | null
  onOpenFile: (path: string) => void
  refreshToken?: number
}

export default function ArchiveExplorer({ archivePath, activeFilePath, onOpenFile, refreshToken }: ArchiveExplorerProps) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    invoke<ArchiveEntry[]>('list_directory', { path: archivePath })
      .then((result) => {
        setEntries(result)
        setError(null)
      })
      .catch((err) => setError(String(err)))
  }

  useEffect(() => {
    refresh()
  }, [archivePath, refreshToken])

  const handleNewNote = async () => {
    const name = window.prompt('Note name')
    if (!name) return

    try {
      const path = await invoke<string>('create_note', { dir: archivePath, name })
      refresh()
      onOpenFile(path)
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Archive Explorer</span>
        <button onClick={handleNewNote} className="text-white/40 hover:text-white/80 transition-colors" title="New Note">
          <FilePlus size={15} />
        </button>
      </div>

      {error && <div className="px-4 pb-2 text-xs text-red-400 font-mono">{error}</div>}

      <div className="flex-1 overflow-y-auto">
        {entries.map((entry) => (
          <TreeNode key={entry.path} entry={entry} depth={0} activeFilePath={activeFilePath} onOpenFile={onOpenFile} />
        ))}
      </div>
    </div>
  )
}
