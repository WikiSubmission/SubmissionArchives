import { useEffect, useState } from 'react'
import { CaretRight, CaretDown, Hash } from '@phosphor-icons/react'
import { scanArchive, type NoteRecord } from '../../lib/notes'
import { motion, AnimatePresence, springConfig } from '../ui/Motion'

interface TagsPaneProps {
  archivePath: string
  onOpenFile: (path: string) => void
  refreshToken?: number
}

interface TagGroup {
  tag: string
  notes: NoteRecord[]
}

export default function TagsPane({ archivePath, onOpenFile, refreshToken }: TagsPaneProps) {
  const [groups, setGroups] = useState<TagGroup[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    scanArchive(archivePath)
      .then((notes) => {
        const byTag = new Map<string, NoteRecord[]>()
        for (const note of notes) {
          for (const tag of note.tags) {
            const existing = byTag.get(tag) ?? []
            existing.push(note)
            byTag.set(tag, existing)
          }
        }
        const sorted = Array.from(byTag.entries())
          .map(([tag, notesForTag]) => ({ tag, notes: notesForTag }))
          .sort((a, b) => a.tag.localeCompare(b.tag))
        setGroups(sorted)
        setError(null)
      })
      .catch((err) => setError(String(err)))
  }, [archivePath, refreshToken])

  const toggle = (tag: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="st-sidebar-header border-b border-ed-rule/60">
        <span className="st-sidebar-title">Tags & Taxonomy</span>
        <span className="st-sidebar-count">{groups.length} {groups.length === 1 ? 'tag' : 'tags'}</span>
      </div>

      {error && <div className="px-4 py-2 text-xs text-ed-danger font-mono">{error}</div>}
      {groups.length === 0 && !error && (
        <div className="px-4 py-8 text-xs text-ed-fg-faint text-center italic">
          No tags found yet. Type <code className="text-ed-accent font-mono">#tag</code> in your notes.
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {groups.map(({ tag, notes }) => {
          const isExpanded = expanded.has(tag)
          const parts = tag.split('/')
          const depth = parts.length - 1

          return (
            <div key={tag}>
              <button
                onClick={() => toggle(tag)}
                style={{ paddingLeft: `${depth * 12 + 12}px` }}
                className="w-full flex items-center gap-1.5 py-1.5 pr-3 text-xs text-left text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface transition-colors"
              >
                {isExpanded ? (
                  <CaretDown size={12} weight="bold" className="shrink-0 text-ed-fg-secondary" />
                ) : (
                  <CaretRight size={12} weight="bold" className="shrink-0 text-ed-fg-secondary" />
                )}
                <Hash size={13} weight="bold" className="text-ed-accent shrink-0" />
                <span className="truncate font-mono font-medium">{tag}</span>
                <span className="text-[10px] text-ed-fg-secondary bg-ed-surface-strong px-1.5 py-0.5 rounded-full ml-auto shrink-0 font-mono">
                  {notes.length}
                </span>
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springConfig}
                    className="overflow-hidden"
                  >
                    {notes.map((note) => (
                      <button
                        key={note.path}
                        onClick={() => onOpenFile(note.path)}
                        style={{ paddingLeft: `${depth * 12 + 32}px` }}
                        className="w-full text-left pr-3 py-1 text-xs text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface transition-colors truncate font-medium"
                      >
                        {note.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}
