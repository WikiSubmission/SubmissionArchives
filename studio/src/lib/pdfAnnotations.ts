import { safeInvoke as invoke } from './ipc'

export interface PdfHighlight {
  id: string
  pageNumber: number
  color: 'amber' | 'emerald' | 'rose' | 'cyan'
  text: string
  rects?: { x: number; y: number; width: number; height: number }[]
  createdAt: number
}

export interface PdfAnnotationFile {
  pdfFileName: string
  highlights: PdfHighlight[]
}

function annotationPath(archiveRoot: string, pdfPath: string): string {
  const fileName = pdfPath.split(/[\\/]/).pop() ?? 'document.pdf'
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const sep = archiveRoot.includes('\\') ? '\\' : '/'
  return `${archiveRoot}${sep}.studio${sep}annotations${sep}${safeName}.json`
}

export async function loadPdfAnnotations(archiveRoot: string, pdfPath: string): Promise<PdfHighlight[]> {
  try {
    const path = annotationPath(archiveRoot, pdfPath)
    const raw = await invoke<string>('read_note', { path })
    const data = JSON.parse(raw) as PdfAnnotationFile
    return data.highlights || []
  } catch {
    return []
  }
}

export async function savePdfAnnotations(
  archiveRoot: string,
  pdfPath: string,
  highlights: PdfHighlight[]
): Promise<void> {
  const fileName = pdfPath.split(/[\\/]/).pop() ?? 'document.pdf'
  const path = annotationPath(archiveRoot, pdfPath)
  const data: PdfAnnotationFile = {
    pdfFileName: fileName,
    highlights,
  }
  await invoke('write_note', { path, content: JSON.stringify(data, null, 2) })
}
