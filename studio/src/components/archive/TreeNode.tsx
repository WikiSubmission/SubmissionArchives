import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ChevronRight, ChevronDown, Folder, FileText, Image, FileVideo, FileAudio, FileSpreadsheet, File as FileIcon, Trash2, Smile } from 'lucide-react'
import type { ArchiveEntry } from './types'
import { fileKindOf, type FileKind } from '../../lib/fileTypes'

const FILE_ICONS: Record<FileKind, typeof FileText> = {
  markdown: FileText,
  pdf: FileText,
  image: Image,
  video: FileVideo,
  audio: FileAudio,
  csv: FileSpreadsheet,
  unknown: FileIcon,
}

interface TreeNodeProps {
  entry: ArchiveEntry
  depth: number
  activeFilePath: string | null
  onOpenFile: (path: string) => void
  onTrash: (path: string) => void
  icons: Record<string, string>
  onSetIcon: (folderPath: string) => void
}

export default function TreeNode({ entry, depth, activeFilePath, onOpenFile, onTrash, icons, onSetIcon }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<ArchiveEntry[] | null>(null)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (!entry.is_dir) {
      onOpenFile(entry.path)
      return
    }

    if (expanded) {
      setExpanded(false)
      return
    }

    if (children === null) {
      setLoading(true)
      try {
        const result = await invoke<ArchiveEntry[]>('list_directory', { path: entry.path })
        setChildren(result)
      } catch {
        setChildren([])
      } finally {
        setLoading(false)
      }
    }

    setExpanded(true)
  }

  const isActive = !entry.is_dir && entry.path === activeFilePath
  const kind = entry.is_dir ? null : fileKindOf(entry.name)
  const FileTypeIcon = kind ? FILE_ICONS[kind] : null
  const customIcon = entry.is_dir ? icons[entry.path] : undefined

  return (
    <div className="tree-item-enter">
      <div
        className={`group flex items-center gap-1.5 pr-2 transition-colors ${
          isActive ? 'bg-ed-accent/10 text-ed-accent' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        <button
          onClick={toggle}
          style={{ paddingLeft: `${depth * 14 + 12}px` }}
          className="flex-1 min-w-0 flex items-center gap-1.5 py-1 text-sm text-left"
        >
          {entry.is_dir ? (
            expanded ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />
          ) : (
            <span className="w-[13px] shrink-0" />
          )}
          {entry.is_dir ? (
            customIcon ? (
              <span className="w-[14px] h-[14px] text-[11px] leading-none shrink-0 flex items-center justify-center">
                {customIcon}
              </span>
            ) : (
              <Folder size={14} className="shrink-0" />
            )
          ) : (
            FileTypeIcon && <FileTypeIcon size={14} className="shrink-0" />
          )}
          <span className="truncate">
            {entry.is_dir || kind !== 'markdown' ? entry.name : entry.name.replace(/\.md$/, '')}
          </span>
        </button>
        {entry.is_dir ? (
          <button
            onClick={() => onSetIcon(entry.path)}
            title="Set folder icon"
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-ed-accent transition-colors shrink-0"
          >
            <Smile size={12} />
          </button>
        ) : (
          <button
            onClick={() => onTrash(entry.path)}
            title="Move to Trash"
            className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {expanded && loading && (
        <div style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }} className="text-xs text-white/30 py-1">
          Loading...
        </div>
      )}

      {expanded && children && children.length === 0 && (
        <div style={{ paddingLeft: `${(depth + 1) * 14 + 12}px` }} className="text-xs text-white/30 py-1">
          Empty
        </div>
      )}

      {expanded &&
        children?.map((child) => (
          <TreeNode
            key={child.path}
            entry={child}
            depth={depth + 1}
            activeFilePath={activeFilePath}
            onOpenFile={onOpenFile}
            onTrash={onTrash}
            icons={icons}
            onSetIcon={onSetIcon}
          />
        ))}
    </div>
  )
}
