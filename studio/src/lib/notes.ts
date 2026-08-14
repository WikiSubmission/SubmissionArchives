import { safeInvoke } from './ipc'

export interface NoteRecord {
  path: string
  name: string
  content: string
  tags: string[]
  links: string[]
}

export function scanArchive(archivePath: string): Promise<NoteRecord[]> {
  return safeInvoke<NoteRecord[]>('scan_archive', { root: archivePath })
}
