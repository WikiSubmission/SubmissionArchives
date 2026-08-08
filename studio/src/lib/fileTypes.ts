export type FileKind = 'markdown' | 'image' | 'pdf' | 'video' | 'audio' | 'csv' | 'unknown'

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'mkv'])
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'm4a', 'flac'])

export function extensionOf(path: string): string {
  const name = path.split(/[\\/]/).pop() ?? path
  const dot = name.lastIndexOf('.')
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase()
}

export function fileKindOf(path: string): FileKind {
  const ext = extensionOf(path)
  if (ext === 'md') return 'markdown'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'csv') return 'csv'
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio'
  return 'unknown'
}
