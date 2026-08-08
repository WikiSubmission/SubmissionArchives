import { useEffect, useState } from 'react'
import CommandModal from './CommandModal'
import { scanArchive, type NoteRecord } from '../lib/notes'

interface QuickSwitcherProps {
  archivePath: string
  onOpenFile: (path: string) => void
  onClose: () => void
}

export default function QuickSwitcher({ archivePath, onOpenFile, onClose }: QuickSwitcherProps) {
  const [notes, setNotes] = useState<NoteRecord[]>([])

  useEffect(() => {
    scanArchive(archivePath).then(setNotes).catch(() => setNotes([]))
  }, [archivePath])

  const sorted = [...notes].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <CommandModal
      items={sorted}
      getKey={(note) => note.path}
      getLabel={(note) => note.name}
      onSelect={(note) => onOpenFile(note.path)}
      onClose={onClose}
      placeholder="Jump to note..."
      emptyMessage="No notes found."
    />
  )
}
