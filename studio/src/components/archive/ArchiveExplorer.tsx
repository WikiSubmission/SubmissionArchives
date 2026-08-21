import { useCallback, useEffect, useState } from 'react'
import { safeInvoke as invoke } from '../../lib/ipc'
import { FilePlus } from '@phosphor-icons/react'
import TreeNode from './TreeNode'
import type { ArchiveEntry } from './types'
import { EmojiPicker } from '../ui/EmojiPicker'

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
  const [pickerFolder, setPickerFolder] = useState<string | null>(null)

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

  const handleOpenPicker = (folderPath: string) => {
    setPickerFolder(folderPath)
  }

  const handleSelectIcon = async (emoji: string) => {
    if (!pickerFolder) return
    try {
      await invoke('set_folder_icon', {
        archiveRoot: archivePath,
        folderPath: pickerFolder,
        icon: emoji || null,
      })
      refreshIcons()
    } catch (err) {
      setError(String(err))
    }
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="px-3 py-3 flex items-center justify-between shrink-0 border-b border-ed-rule/50">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-ed-fg-secondary pl-1">
          Archive Explorer
        </span>
        <button
          onClick={onNewNote}
          className="tactile p-1.5 rounded-md text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface"
          title="New Note (Ctrl+N)"
          aria-label="New Note"
        >
          <FilePlus size={16} weight="bold" />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-[11px] text-ed-danger/90 font-mono bg-ed-danger/5 border-b border-ed-danger/15">
          {error}
        </div>
      )}

      {pickerFolder && (
        <div className="absolute top-12 left-4 z-50">
          <EmojiPicker
            currentEmoji={icons[pickerFolder]}
            onSelect={handleSelectIcon}
            onClose={() => setPickerFolder(null)}
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {entries.length === 0 && !error && (
          <div className="px-4 py-8 text-center">
            <div className="text-[11px] text-ed-fg-secondary font-mono">No items</div>
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
            onSetIcon={handleOpenPicker}
          />
        ))}
      </div>
    </div>
  )
}
