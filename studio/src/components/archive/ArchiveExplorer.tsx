import { useCallback, useEffect, useMemo, useState } from 'react'
import { safeInvoke as invoke } from '../../lib/ipc'
import { FilePlus, Funnel } from '@phosphor-icons/react'
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

  const [filterText, setFilterText] = useState('')
  const [showFilter, setShowFilter] = useState(false)

  const filteredEntries = useMemo(() => {
    if (!filterText.trim()) return entries
    const q = filterText.toLowerCase()
    return entries.filter((e) => e.name.toLowerCase().includes(q))
  }, [entries, filterText])

  return (
    <div className="h-full flex flex-col relative">
      {/* Header Bar matching Golden Player TOC header */}
      <div className="px-3.5 py-2.5 flex items-center justify-between shrink-0 border-b border-ed-rule/60">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ed-fg-muted">
            Explorer
          </span>
          <span className="text-[11px] font-medium text-ed-fg-faint tabular-nums">
            {entries.length} {entries.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-1.5 rounded-[5px] transition-colors ${
              showFilter || filterText
                ? 'text-ed-accent bg-ed-accent-soft'
                : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
            }`}
            title="Filter Files"
            aria-label="Filter Files"
          >
            <Funnel size={15} weight={showFilter || filterText ? 'fill' : 'regular'} />
          </button>

          <button
            onClick={onNewNote}
            className="p-1.5 rounded-[5px] text-ed-fg-muted hover:text-ed-accent hover:bg-ed-accent-soft transition-colors"
            title="New Note (Ctrl+N)"
            aria-label="New Note"
          >
            <FilePlus size={15} weight="bold" />
          </button>
        </div>
      </div>

      {/* Quick Filter Box */}
      {showFilter && (
        <div className="px-3 py-2 border-b border-ed-rule/60 bg-ed-surface/40">
          <input
            autoFocus
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter files..."
            className="w-full px-2 py-1 text-xs rounded-[5px] bg-ed-surface border border-ed-rule text-ed-fg placeholder:text-ed-fg-faint outline-none focus:border-ed-accent/50"
          />
        </div>
      )}

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

      <div className="flex-1 overflow-y-auto py-1.5 px-1 scrollbar-thin">
        {filteredEntries.length === 0 && !error && (
          <div className="px-4 py-8 text-center">
            <div className="text-[11px] text-ed-fg-faint font-mono">
              {filterText ? `No files matching "${filterText}"` : 'Empty archive'}
            </div>
          </div>
        )}
        {filteredEntries.map((entry) => (
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
