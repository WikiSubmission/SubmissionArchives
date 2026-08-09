import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { FilePlus } from 'lucide-react'
import TreeNode from './TreeNode'
import type { ArchiveEntry } from './types'

interface ArchiveExplorerProps {
  archivePath: string
  activeFilePath: string | null
  onOpenFile: (path: string) => void
  onNewNote: () => void
  onTrash: (path: string) => void
  refreshToken?: number
}

export default function ArchiveExplorer({
  archivePath,
  activeFilePath,
  onOpenFile,
  onNewNote,
  onTrash,
  refreshToken,
}: ArchiveExplorerProps) {
  const [entries, setEntries] = useState<ArchiveEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [icons, setIcons] = useState<Record<string, string>>({})

  const refreshIcons = useCallback(() => {
    invoke<Record<string, string>>('read_folder_icons', { archiveRoot: archivePath })
      .then(setIcons)
      .catch(() => {})
  }, [archivePath])

  useEffect(() => {
    invoke<ArchiveEntry[]>('list_directory', { path: archivePath })
      .then((result) => {
        setEntries(result)
        setError(null)
      })
      .catch((err) => setError(String(err)))
    refreshIcons()
  }, [archivePath, refreshToken, refreshIcons])

  const handleSetIcon = async (folderPath: string) => {
    const current = icons[folderPath] ?? ''
    const value = window.prompt('Folder icon (emoji) — leave blank to clear:', current)
    if (value === null) return
    try {
      await invoke('set_folder_icon', { archiveRoot: archivePath, folderPath, icon: value || null })
      refreshIcons()
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-3 py-3 flex items-center justify-between shrink-0 border-b border-ed-rule/50">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/25 pl-1">
          Archive Explorer
        </span>
        <button
          onClick={onNewNote}
          className="tactile p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.06]"
          title="New Note"
        >
          <FilePlus size={14} strokeWidth={1.5} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-[11px] text-red-400/90 font-mono bg-red-500/5 border-b border-red-500/10">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {entries.length === 0 && !error && (
          <div className="px-4 py-8 text-center">
            <div className="text-[11px] text-white/20 font-mono">No items</div>
          </div>
        )}
        {entries.map((entry) => (
          <TreeNode
            key={entry.path}
            entry={entry}
            depth={0}
            activeFilePath={activeFilePath}
            onOpenFile={onOpenFile}
            onTrash={onTrash}
            icons={icons}
            onSetIcon={handleSetIcon}
          />
        ))}
      </div>
    </div>
  )
}
