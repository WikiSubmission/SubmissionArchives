import { useEffect, useState } from 'react'
import { scanArchive, type NoteRecord } from '../lib/notes'

interface BacklinksPanelProps {
  archivePath: string
  filePath: string
  onOpenFile: (path: string) => void
}

function stemOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path
  return base.replace(/\.md$/, '')
}

export default function BacklinksPanel({ archivePath, filePath, onOpenFile }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<NoteRecord[]>([])

  useEffect(() => {
    let cancelled = false
    const currentName = stemOf(filePath).toLowerCase()

    scanArchive(archivePath)
      .then((notes) => {
        if (cancelled) return
        const linked = notes.filter(
          (note) => note.path !== filePath && note.links.some((link) => link.toLowerCase() === currentName)
        )
        setBacklinks(linked)
      })
      .catch(() => setBacklinks([]))

    return () => {
      cancelled = true
    }
  }, [archivePath, filePath])

  if (backlinks.length === 0) return null

  return (
    <div className="max-w-3xl mx-auto px-8 pt-6 pb-8 mt-6 border-t border-ed-rule">
      <div className="text-xs font-semibold uppercase tracking-wider text-ed-fg-secondary mb-3">
        Linked mentions ({backlinks.length})
      </div>
      <div className="space-y-1.5">
        {backlinks.map((note) => (
          <button
            key={note.path}
            onClick={() => onOpenFile(note.path)}
            className="block w-full text-left text-sm text-ed-accent hover:underline decoration-ed-accent/40 transition-colors"
          >
            {note.name}
          </button>
        ))}
      </div>
    </div>
  )
}
