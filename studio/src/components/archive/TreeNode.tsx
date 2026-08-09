import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  ChevronRight,
  Folder,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  File as FileIcon,
  Trash2,
  Smile,
} from 'lucide-react'
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

const FILE_ICON_COLORS: Record<FileKind, string> = {
  markdown: 'text-white/40',
  pdf: 'text-amber-400/50',
  image: 'text-emerald-400/50',
  video: 'text-rose-400/50',
  audio: 'text-violet-400/50',
  csv: 'text-sky-400/50',
  unknown: 'text-white/25',
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

export default function TreeNode({
  entry,
  depth,
  activeFilePath,
  onOpenFile,
  onTrash,
  icons,
  onSetIcon,
}: TreeNodeProps) {
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
        className={`group relative flex items-center gap-1 pr-2 transition-all duration-150 ${
          isActive
            ? 'bg-white/[0.06] text-ed-accent'
            : 'text-white/50 hover:text-white/85 hover:bg-white/[0.03]'
        }`}
      >
        {/* Active file left accent bar */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-ed-accent/80" />
        )}

        <button
          onClick={toggle}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className="flex-1 min-w-0 flex items-center gap-1.5 py-[5px] text-[13px] text-left tactile"
        >
          {entry.is_dir ? (
            <span
              className={`shrink-0 transition-transform duration-200 ${
                expanded ? 'rotate-90' : ''
              }`}
            >
              <ChevronRight size={12} className="text-white/30" />
            </span>
          ) : (
            <span className="w-3 shrink-0" />
          )}

          {entry.is_dir ? (
            customIcon ? (
              <span className="w-4 h-4 text-[12px] leading-none shrink-0 flex items-center justify-center select-none">
                {customIcon}
              </span>
            ) : (
              <Folder
                size={14}
                className={`shrink-0 transition-colors duration-150 ${
                  expanded ? 'text-white/50' : 'text-white/30'
                }`}
              />
            )
          ) : (
            FileTypeIcon && (
              <FileTypeIcon size={14} className={`shrink-0 ${FILE_ICON_COLORS[kind!]}`} />
            )
          )}

          <span className="truncate font-medium tracking-tight">
            {entry.is_dir || kind !== 'markdown' ? entry.name : entry.name.replace(/\.md$/, '')}
          </span>
        </button>

        {entry.is_dir ? (
          <button
            onClick={() => onSetIcon(entry.path)}
            title="Set folder icon"
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-150 shrink-0"
          >
            <Smile size={11} strokeWidth={1.5} />
          </button>
        ) : (
          <button
            onClick={() => onTrash(entry.path)}
            title="Move to Trash"
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 shrink-0"
          >
            <Trash2 size={11} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {expanded && loading && (
        <div
          style={{ paddingLeft: `${(depth + 1) * 14 + 14}px` }}
          className="text-[11px] text-white/20 py-1.5 font-mono flex items-center"
        >
          <span className="inline-block w-3 h-3 border-2 border-white/10 border-t-white/30 rounded-full animate-spin mr-2" />
          Loading...
        </div>
      )}

      {expanded && children && children.length === 0 && (
        <div
          style={{ paddingLeft: `${(depth + 1) * 14 + 14}px` }}
          className="text-[11px] text-white/20 py-1.5 font-mono italic"
        >
          Empty folder
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
