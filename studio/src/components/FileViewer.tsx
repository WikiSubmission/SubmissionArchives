import { useEffect, useState } from 'react'
import { invoke, convertFileSrc } from '@tauri-apps/api/core'
import { fileKindOf } from '../lib/fileTypes'

interface FileViewerProps {
  filePath: string
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < content.length; i++) {
    const char = content[i]
    if (inQuotes) {
      if (char === '"') {
        if (content[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && content[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ''))
}

function CsvTable({ content }: { content: string }) {
  const rows = parseCsv(content)
  if (rows.length === 0) return <div className="text-sm text-white/30 p-8">Empty file.</div>

  const [header, ...body] = rows
  return (
    <div className="overflow-auto p-8 h-full">
      <table className="text-sm border-collapse">
        <thead>
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="border border-ed-rule px-3 py-1.5 text-left text-white/70 bg-white/5 font-medium">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} className="border border-ed-rule px-3 py-1.5 text-white/60">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function FileViewer({ filePath }: FileViewerProps) {
  const kind = fileKindOf(filePath)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [textError, setTextError] = useState<string | null>(null)
  const needsTextContent = kind === 'csv' || kind === 'unknown'

  useEffect(() => {
    if (!needsTextContent) return
    setTextContent(null)
    setTextError(null)
    invoke<string>('read_note', { path: filePath })
      .then(setTextContent)
      .catch((err) => setTextError(String(err)))
  }, [filePath, needsTextContent])

  if (kind === 'image') {
    return (
      <div className="h-full w-full flex items-center justify-center p-8 overflow-auto">
        <img src={convertFileSrc(filePath)} alt={filePath} className="max-w-full max-h-full object-contain" />
      </div>
    )
  }

  if (kind === 'pdf') {
    return <iframe title={filePath} src={convertFileSrc(filePath)} className="h-full w-full border-0" />
  }

  if (kind === 'video') {
    return (
      <div className="h-full w-full flex items-center justify-center p-8 bg-black">
        <video controls src={convertFileSrc(filePath)} className="max-w-full max-h-full" />
      </div>
    )
  }

  if (kind === 'audio') {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <audio controls src={convertFileSrc(filePath)} className="w-full max-w-md" />
      </div>
    )
  }

  if (kind === 'csv') {
    if (textError) return <div className="p-8 text-sm text-red-400 font-mono">{textError}</div>
    if (textContent === null) return <div className="p-8 text-sm text-white/30">Loading...</div>
    return <CsvTable content={textContent} />
  }

  if (textError) {
    return (
      <div className="h-full w-full flex items-center justify-center text-sm text-white/30">
        Preview not available for this file type.
      </div>
    )
  }
  if (textContent === null) return <div className="p-8 text-sm text-white/30">Loading...</div>
  return <pre className="p-8 text-sm text-white/70 font-mono whitespace-pre-wrap overflow-auto h-full">{textContent}</pre>
}
