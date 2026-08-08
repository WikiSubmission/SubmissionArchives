import { useEffect, useState } from 'react'
import { ChevronRight, ChevronDown, Hash } from 'lucide-react'
import { scanArchive, type NoteRecord } from '../../lib/notes'

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
      <div className="p-4 shrink-0">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Tags</span>
      </div>

      {error && <div className="px-4 pb-2 text-xs text-red-400 font-mono">{error}</div>}
      {groups.length === 0 && !error && (
        <div className="px-4 text-xs text-white/30">No tags yet. Write #like-this in a note.</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {groups.map(({ tag, notes }) => (
          <div key={tag}>
            <button
              onClick={() => toggle(tag)}
              className="w-full flex items-center gap-1.5 px-3 py-1 text-sm text-left text-white/60 hover:text-white/90 hover:bg-white/5 transition-colors"
            >
              {expanded.has(tag) ? <ChevronDown size={13} className="shrink-0" /> : <ChevronRight size={13} className="shrink-0" />}
              <Hash size={12} className="text-ed-accent/70 shrink-0" />
              <span className="truncate">{tag}</span>
              <span className="text-white/30 text-xs ml-auto shrink-0">{notes.length}</span>
            </button>
            {expanded.has(tag) &&
              notes.map((note) => (
                <button
                  key={note.path}
                  onClick={() => onOpenFile(note.path)}
                  className="w-full text-left pl-9 pr-3 py-1 text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors truncate"
                >
                  {note.name}
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}
