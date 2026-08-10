import { useState, useEffect, useMemo } from 'react'
import { ListTree, Link2, Info, X, FileText, ChevronRight } from 'lucide-react'
import { scanArchive, type NoteRecord } from '../lib/notes'

interface OutlineItem {
  level: number
  text: string
  line: number
}

interface RightInspectorProps {
  archivePath: string
  filePath: string | null
  content: string
  onOpenFile: (path: string) => void
  onClose: () => void
}

type InspectorTab = 'outline' | 'backlinks' | 'info'

function stemOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path
  return base.replace(/\.md$/, '')
}

export default function RightInspector({
  archivePath,
  filePath,
  content,
  onOpenFile,
  onClose,
}: RightInspectorProps) {
  const [activeTab, setActiveTab] = useState<InspectorTab>('outline')
  const [backlinks, setBacklinks] = useState<NoteRecord[]>([])

  // Derived Headings Outline (using useMemo instead of useEffect + setState)
  const headings = useMemo(() => {
    if (!content) return []
    const lines = content.split('\n')
    const extracted: OutlineItem[] = []

    lines.forEach((lineText, idx) => {
      const match = lineText.match(/^(#{1,6})\s+(.*)$/)
      if (match) {
        extracted.push({
          level: match[1].length,
          text: match[2].replace(/[*_~`]/g, '').trim(),
          line: idx + 1,
        })
      }
    })
    return extracted
  }, [content])

  // Scan Backlinks
  useEffect(() => {
    if (!filePath || !archivePath) return
    let cancelled = false
    const currentName = stemOf(filePath).toLowerCase()

    scanArchive(archivePath)
      .then((notes) => {
        if (!cancelled) {
          const linked = notes.filter(
            (note) => note.path !== filePath && note.links.some((link) => link.toLowerCase() === currentName)
          )
          setBacklinks(linked)
        }
      })
      .catch(() => {
        if (!cancelled) setBacklinks([])
      })

    return () => {
      cancelled = true
    }
  }, [archivePath, filePath])

  const effectiveBacklinks = filePath && archivePath ? backlinks : []

  const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0
  const charCount = content ? content.length : 0
  const lineCount = content ? content.split('\n').length : 0

  return (
    <aside className="w-[280px] shrink-0 border-l border-ed-rule bg-ed-bg/80 backdrop-blur-xl flex flex-col h-full select-none z-30">
      {/* Header & Tabs */}
      <div className="h-10 border-b border-ed-rule flex items-center justify-between px-3 bg-ed-surface/30">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('outline')}
            title="Table of Contents Outline"
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'outline'
                ? 'text-white bg-white/[0.08]'
                : 'text-white/35 hover:text-white/70'
            }`}
          >
            <ListTree size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => setActiveTab('backlinks')}
            title="Linked Mentions & Backlinks"
            className={`p-1.5 rounded-md transition-colors relative ${
              activeTab === 'backlinks'
                ? 'text-white bg-white/[0.08]'
                : 'text-white/35 hover:text-white/70'
            }`}
          >
            <Link2 size={15} strokeWidth={1.5} />
            {effectiveBacklinks.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('info')}
            title="Document Info & Stats"
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'info'
                ? 'text-white bg-white/[0.08]'
                : 'text-white/35 hover:text-white/70'
            }`}
          >
            <Info size={15} strokeWidth={1.5} />
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md text-white/30 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeTab === 'outline' && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3 px-1">
              Table of Contents ({headings.length})
            </div>
            {headings.length === 0 ? (
              <div className="text-xs text-white/25 italic px-1 py-4 text-center">
                No headings found in this note. Add # H1 or ## H2 to build an outline.
              </div>
            ) : (
              <div className="space-y-1">
                {headings.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-white/70 hover:text-white hover:bg-white/[0.04] cursor-pointer transition-colors"
                    style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                  >
                    <ChevronRight size={11} className="text-white/30 shrink-0" />
                    <span className="truncate font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'backlinks' && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mb-3 px-1">
              Backlinks ({effectiveBacklinks.length})
            </div>
            {effectiveBacklinks.length === 0 ? (
              <div className="text-xs text-white/25 italic px-1 py-4 text-center">
                No notes currently link to this note via [[{filePath ? stemOf(filePath) : 'Note'}]].
              </div>
            ) : (
              <div className="space-y-1">
                {effectiveBacklinks.map((note) => (
                  <button
                    key={note.path}
                    onClick={() => onOpenFile(note.path)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-xs bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.04] text-amber-400/90 font-medium transition-all group"
                  >
                    <FileText size={13} className="text-white/30 group-hover:text-white/60 shrink-0" />
                    <span className="truncate flex-1">{note.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-3 px-1 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">
              Note Statistics
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04] space-y-2 text-white/60 font-mono">
              <div className="flex justify-between">
                <span>Words</span>
                <span className="text-white font-semibold">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Characters</span>
                <span className="text-white font-semibold">{charCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines</span>
                <span className="text-white font-semibold">{lineCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
