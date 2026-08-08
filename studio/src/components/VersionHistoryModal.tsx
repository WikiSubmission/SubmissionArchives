import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import CommandModal from './CommandModal'

interface HistoryEntry {
  timestamp: number
  path: string
}

interface VersionHistoryModalProps {
  archivePath: string
  notePath: string
  onRestored: () => void
  onClose: () => void
}

export default function VersionHistoryModal({ archivePath, notePath, onRestored, onClose }: VersionHistoryModalProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])

  useEffect(() => {
    invoke<HistoryEntry[]>('list_note_history', { archiveRoot: archivePath, notePath })
      .then(setEntries)
      .catch(() => setEntries([]))
  }, [archivePath, notePath])

  const handleSelect = async (entry: HistoryEntry) => {
    try {
      await invoke('restore_note_version', { snapshotPath: entry.path, notePath })
      onRestored()
    } catch (err) {
      window.alert(String(err))
    }
  }

  return (
    <CommandModal
      items={entries}
      getKey={(entry) => entry.path}
      getLabel={(entry) => new Date(entry.timestamp * 1000).toLocaleString()}
      onSelect={handleSelect}
      onClose={onClose}
      placeholder="Filter version history..."
      emptyMessage="No history yet for this note."
    />
  )
}
