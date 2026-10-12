import { safeInvoke } from './ipc'

export interface NoteRecord {
  path: string
  name: string
  content: string
  tags: string[]
  links: string[]
  modifiedMs?: number
}

const snapshots = new Map<string, { signature: string; notes: NoteRecord[] }>()
export async function scanArchive(archivePath: string): Promise<NoteRecord[]> {
  const notes = await safeInvoke<NoteRecord[]>('scan_archive', { root: archivePath })
  const signature = notes.map(n => `${n.path}:${n.modifiedMs}:${n.content.length}`).join('|')
  const previous = snapshots.get(archivePath)
  if (previous?.signature === signature) return previous.notes
  // Bound vault retention; the Rust metadata pass notices external changes too.
  snapshots.clear()
  snapshots.set(archivePath, { signature, notes })
  return notes
}
