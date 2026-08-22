import { useState, useEffect, useMemo } from 'react'
import { TreeStructure, LinkSimple, Info, X, FileText, Quotes, VideoCamera } from '@phosphor-icons/react'
import { scanArchive, type NoteRecord } from '../lib/notes'
import MediaNotesPanel from './media/MediaNotesPanel'

interface OutlineItem {
  level: number
  text: string
  line: number
}

export type InspectorTab = 'outline' | 'backlinks' | 'footnotes' | 'media' | 'info'

interface RightInspectorProps {
  archivePath: string
  filePath: string | null
  content: string
  activeTab: InspectorTab
  onTabChange: (tab: InspectorTab) => void
  onOpenFile: (path: string) => void
  onClose: () => void
}

function stemOf(path: string): string {
  const base = path.split(/[\\/]/).pop() ?? path
  return base.replace(/\.md$/, '')
}

export default function RightInspector({
  archivePath,
  filePath,
  content,
  activeTab,
  onTabChange,
  onOpenFile,
  onClose,
}: RightInspectorProps) {
  const [backlinks, setBacklinks] = useState<NoteRecord[]>([])

  // Derived Headings Outline
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

  // Derived Footnotes List
  const footnotes = useMemo(() => {
    if (!content) return []
    const matches: { id: string; text: string }[] = []
    const lines = content.split('\n')
    lines.forEach((line) => {
      const m = line.match(/^\[\^([^\]]+)\]:\s*(.*)$/)
      if (m) {
        matches.push({ id: m[1], text: m[2] })
      }
    })
    return matches
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
    <aside className="flex h-full w-full min-w-0 select-none flex-col">
      {/* Header & Tabs */}
      <div className="h-10 border-b border-ed-rule flex items-center justify-between px-3 bg-ed-surface/30">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('outline')}
            title="Table of Contents Outline"
            aria-label="Outline"
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'outline'
                ? 'text-ed-fg bg-ed-surface-strong'
                : 'text-ed-fg-secondary hover:text-ed-fg'
            }`}
          >
            <TreeStructure size={16} weight="regular" />
          </button>
          <button
            onClick={() => onTabChange('backlinks')}
            title="Linked Mentions & Backlinks"
            aria-label="Backlinks"
            className={`p-1.5 rounded-md transition-colors relative ${
              activeTab === 'backlinks'
                ? 'text-ed-fg bg-ed-surface-strong'
                : 'text-ed-fg-secondary hover:text-ed-fg'
            }`}
          >
            <LinkSimple size={16} weight="regular" />
            {effectiveBacklinks.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-ed-accent" />
            )}
          </button>
          <button
            onClick={() => onTabChange('footnotes')}
            title="Footnotes Reference"
            aria-label="Footnotes"
            className={`p-1.5 rounded-md transition-colors relative ${
              activeTab === 'footnotes'
                ? 'text-ed-fg bg-ed-surface-strong'
                : 'text-ed-fg-secondary hover:text-ed-fg'
            }`}
          >
            <Quotes size={16} weight="regular" />
            {footnotes.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-ed-success" />
            )}
          </button>
          <button
            onClick={() => onTabChange('media')}
            title="Media Notes: watch or listen while you write"
            aria-label="Media notes"
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'media'
                ? 'text-ed-fg bg-ed-surface-strong'
                : 'text-ed-fg-secondary hover:text-ed-fg'
            }`}
          >
            <VideoCamera size={16} weight="regular" />
          </button>
          <button
            onClick={() => onTabChange('info')}
            title="Document Info & Stats"
            aria-label="Document info"
            className={`p-1.5 rounded-md transition-colors ${
              activeTab === 'info'
                ? 'text-ed-fg bg-ed-surface-strong'
                : 'text-ed-fg-secondary hover:text-ed-fg'
            }`}
          >
            <Info size={16} weight="regular" />
          </button>
        </div>

        <button
          onClick={onClose}
          aria-label="Close inspector"
          className="p-1 rounded-md text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface transition-colors"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {/* Tab Content — the media panel manages its own scroll regions, so it
          sits outside the padded scroller the text tabs share. */}
      {activeTab === 'media' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <MediaNotesPanel />
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3 scrollbar-thin">
        {activeTab === 'outline' && (
          <div>
            <div className="st-sidebar-header">
              <span className="st-sidebar-title">Contents</span>
              <span className="st-sidebar-count">{headings.length} {headings.length === 1 ? 'topic' : 'topics'}</span>
            </div>

            {headings.length === 0 ? (
              <div className="text-xs text-ed-fg-faint italic px-3 py-6 text-center">
                No headings found in this note. Add # H1 or ## H2 to build an outline.
              </div>
            ) : (
              <div className="space-y-0.5 mt-1">
                {headings.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-baseline gap-2.5 px-2.5 py-1.5 rounded-[6px] text-xs text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface cursor-pointer transition-all duration-150 group"
                    style={{ paddingLeft: `${(item.level - 1) * 10 + 10}px` }}
                  >
                    <span className="text-[10px] font-mono font-semibold text-ed-fg-faint group-hover:text-ed-accent transition-colors tabular-nums shrink-0 min-w-[24px]">
                      H{item.level}
                    </span>
                    <span className="truncate font-medium text-[13px] text-ed-fg-secondary group-hover:text-ed-fg">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'backlinks' && (
          <div>
            <div className="st-sidebar-header">
              <span className="st-sidebar-title">Backlinks</span>
              <span className="st-sidebar-count">{effectiveBacklinks.length} linked</span>
            </div>

            {effectiveBacklinks.length === 0 ? (
              <div className="text-xs text-ed-fg-faint italic px-3 py-6 text-center">
                No notes currently link to this note via [[{filePath ? stemOf(filePath) : 'Note'}]].
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {effectiveBacklinks.map((note) => (
                  <button
                    key={note.path}
                    onClick={() => onOpenFile(note.path)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-left text-xs bg-ed-surface/70 hover:bg-ed-surface-raised border border-ed-rule hover:border-ed-rule-strong text-ed-fg transition-all group"
                  >
                    <FileText size={14} weight="regular" className="text-ed-accent shrink-0" />
                    <span className="truncate flex-1 font-medium text-[12px]">{note.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'footnotes' && (
          <div>
            <div className="st-sidebar-header">
              <span className="st-sidebar-title">Footnotes</span>
              <span className="st-sidebar-count">{footnotes.length} refs</span>
            </div>

            {footnotes.length === 0 ? (
              <div className="text-xs text-ed-fg-faint italic px-3 py-6 text-center">
                No footnotes in this note. Type [^1] to add inline footnote references.
              </div>
            ) : (
              <div className="space-y-1.5 mt-1">
                {footnotes.map((fn) => (
                  <div
                    key={fn.id}
                    className="p-2.5 rounded-[6px] bg-ed-surface/60 border border-ed-rule text-xs space-y-1"
                  >
                    <div className="font-mono text-[10px] font-bold text-ed-accent">
                      [^{fn.id}]
                    </div>
                    <p className="text-ed-fg-secondary text-[11px] leading-relaxed line-clamp-3">
                      {fn.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="space-y-3 px-1 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-ed-fg-secondary">
              Note Statistics
            </div>
            <div className="bg-ed-surface rounded-lg p-3 border border-ed-rule space-y-2 text-ed-fg-secondary font-mono">
              <div className="flex justify-between">
                <span>Words</span>
                <span className="text-ed-fg font-semibold">{wordCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Characters</span>
                <span className="text-ed-fg font-semibold">{charCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Lines</span>
                <span className="text-ed-fg font-semibold">{lineCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </aside>
  )
}
