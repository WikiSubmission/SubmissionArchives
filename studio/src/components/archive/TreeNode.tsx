import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { ChevronRight, ChevronDown, FileText, Folder } from 'lucide-react'
import type { ArchiveEntry } from './types'

interface TreeNodeProps {
  entry: ArchiveEntry
  depth: number
  activeFilePath: string | null
  onOpenFile: (path: string) => void
}

export default function TreeNode({ entry, depth, activeFilePath, onOpenFile }: TreeNodeProps) {
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

  return (
    <div className="tree-item-enter">
      <button
        onClick={toggle}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
        className={`w-full flex items-center gap-1.5 py-1 pr-2 text-sm text-left transition-colors ${
          isActive ? 'bg-emerald-500/10 text-emerald-400' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
        }`}
      >
        {entry.is_dir ? (
          expanded ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />
        ) : (
          <span className="w-[13px] shrink-0" />
        )}
        {entry.is_dir ? <Folder size={14} className="shrink-0" /> : <FileText size={14} className="shrink-0" />}
        <span className="truncate">{entry.is_dir ? entry.name : entry.name.replace(/\.md$/, '')}</span>
      </button>

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
          />
        ))}
    </div>
  )
}
