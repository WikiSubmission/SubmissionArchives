import { invoke } from '@tauri-apps/api/core'

export interface NoteRecord {
  path: string
  name: string
  content: string
  tags: string[]
  links: string[]
}

export function scanArchive(archivePath: string): Promise<NoteRecord[]> {
  return invoke<NoteRecord[]>('scan_archive', { root: archivePath })
}
