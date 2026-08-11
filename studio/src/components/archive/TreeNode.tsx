import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import {
  CaretRight,
  Folder,
  FolderOpen,
  Trash,
  Smiley
} from '@phosphor-icons/react'
import type { ArchiveEntry } from './types'
import { fileKindOf, getFileIcon } from '../../lib/fileTypes'
import { AppIcon } from '../ui/Icons'
import { motion, AnimatePresence, springConfig } from '../ui/Motion'

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
  const iconName = entry.is_dir ? null : getFileIcon(entry.name)
  const customIcon = entry.is_dir ? icons[entry.path] : undefined

  return (
    <div>
      <div
        className={`group relative flex items-center gap-1 pr-2 transition-colors duration-150 ${
          isActive
            ? 'bg-ed-surface-strong text-ed-fg'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        {/* Active file left accent bar */}
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-amber-500" />
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
              <CaretRight size={12} weight="bold" className="text-ed-fg-muted" />
            </span>
          ) : (
            <span className="w-3 shrink-0" />
          )}

          {entry.is_dir ? (
            customIcon ? (
              <span className="w-4 h-4 text-[13px] leading-none shrink-0 flex items-center justify-center select-none">
                {customIcon}
              </span>
            ) : expanded ? (
              <FolderOpen size={16} weight="fill" className="shrink-0 text-amber-400/80" />
            ) : (
              <Folder size={16} weight="regular" className="shrink-0 text-ed-fg-muted" />
            )
          ) : (
            iconName && (
              <AppIcon
                name={iconName}
                size={16}
                weight={isActive ? 'fill' : 'regular'}
                className={`shrink-0 ${
                  isActive
                    ? 'text-amber-400'
                    : kind === 'pdf'
                    ? 'text-rose-400'
                    : kind === 'image'
                    ? 'text-emerald-400'
                    : kind === 'audio'
                    ? 'text-violet-400'
                    : kind === 'video'
                    ? 'text-sky-400'
                    : 'text-ed-fg-muted'
                }`}
              />
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
            aria-label="Set folder icon"
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong transition-opacity shrink-0"
          >
            <Smiley size={14} weight="regular" />
          </button>
        ) : (
          <button
            onClick={() => onTrash(entry.path)}
            title="Move to Trash"
            aria-label="Move to trash"
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-ed-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-opacity shrink-0"
          >
            <Trash size={14} weight="regular" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springConfig}
            className="overflow-hidden"
          >
            {loading && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 14}px` }}
                className="text-[11px] text-ed-fg-muted py-1.5 font-mono flex items-center"
              >
                <span className="inline-block w-3 h-3 border-2 border-ed-rule border-t-ed-fg-muted rounded-full animate-spin mr-2" />
                Loading...
              </div>
            )}

            {children && children.length === 0 && (
              <div
                style={{ paddingLeft: `${(depth + 1) * 14 + 14}px` }}
                className="text-[11px] text-ed-fg-muted py-1.5 font-mono italic"
              >
                Empty folder
              </div>
            )}

            {children?.map((child) => (
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
