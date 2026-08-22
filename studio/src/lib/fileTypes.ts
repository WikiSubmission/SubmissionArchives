import { IconMap } from '../components/ui/Icons'

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
  if (ext === 'md' || ext === 'markdown') return 'markdown'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'csv') return 'csv'
  if (IMAGE_EXTENSIONS.has(ext)) return 'image'
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  if (AUDIO_EXTENSIONS.has(ext)) return 'audio'
  return 'unknown'
}

const FILE_TYPE_ICONS: Record<string, keyof typeof IconMap> = {
  md: 'file',
  markdown: 'file',
  pdf: 'filePdf',
  mp3: 'fileAudio',
  wav: 'fileAudio',
  ogg: 'fileAudio',
  m4a: 'fileAudio',
  flac: 'fileAudio',
  mp4: 'fileVideo',
  webm: 'fileVideo',
  mov: 'fileVideo',
  mkv: 'fileVideo',
  jpg: 'fileImage',
  jpeg: 'fileImage',
  png: 'fileImage',
  gif: 'fileImage',
  svg: 'fileImage',
  bmp: 'fileImage',
  csv: 'table',
  txt: 'file',
  json: 'brackets',
  yaml: 'brackets',
  yml: 'brackets'
}

export function getFileIcon(filename: string): keyof typeof IconMap {
  const ext = extensionOf(filename)
  return FILE_TYPE_ICONS[ext] || 'file'
}
