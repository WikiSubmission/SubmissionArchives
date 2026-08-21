import { useEffect, useState } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import {
  Quotes,
  Highlighter,
  Trash,
  X,
  Copy,
  Check,
  BookmarkSimple,
  CaretRight,
  Plus
} from '@phosphor-icons/react'
import { loadPdfAnnotations, savePdfAnnotations, type PdfHighlight } from '../../lib/pdfAnnotations'

interface PdfViewerProps {
  archivePath: string
  pdfPath: string
  onQuoteExcerpt?: (quote: string, pageNumber?: number) => void
  onClose?: () => void
}

const HIGHLIGHT_COLORS: { id: PdfHighlight['color']; bg: string; border: string; label: string }[] = [
  { id: 'amber', bg: 'bg-ed-accent-soft text-ed-accent', border: 'border-ed-accent/45', label: 'Amber' },
  { id: 'emerald', bg: 'bg-ed-success-soft text-ed-success', border: 'border-ed-success/45', label: 'Green' },
  { id: 'rose', bg: 'bg-ed-danger-soft text-ed-danger', border: 'border-ed-danger/45', label: 'Rose' },
  { id: 'cyan', bg: 'bg-cyan-500/20 text-cyan-300', border: 'border-cyan-500/40', label: 'Cyan' },
]

export default function PdfViewer({ archivePath, pdfPath, onQuoteExcerpt, onClose }: PdfViewerProps) {
  const [highlights, setHighlights] = useState<PdfHighlight[]>([])
  const [showAnnotations, setShowAnnotations] = useState(false)
  const [newExcerpt, setNewExcerpt] = useState('')
  const [newPageNum, setNewPageNum] = useState(1)
  const [selectedColor, setSelectedColor] = useState<PdfHighlight['color']>('amber')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isAddingExcerpt, setIsAddingExcerpt] = useState(false)

  const fileName = pdfPath.split(/[\\/]/).pop() ?? 'Document.pdf'

  useEffect(() => {
    loadPdfAnnotations(archivePath, pdfPath).then(setHighlights)
  }, [archivePath, pdfPath])

  const handleAddHighlight = async () => {
    if (!newExcerpt.trim()) return

    const newHl: PdfHighlight = {
      id: `hl-${Date.now()}`,
      pageNumber: newPageNum,
      color: selectedColor,
      text: newExcerpt.trim(),
      createdAt: Date.now(),
    }

    const updated = [newHl, ...highlights]
    setHighlights(updated)
    await savePdfAnnotations(archivePath, pdfPath, updated)
    setNewExcerpt('')
    setIsAddingExcerpt(false)
  }

  const handleDeleteHighlight = async (id: string) => {
    const updated = highlights.filter((h) => h.id !== id)
    setHighlights(updated)
    await savePdfAnnotations(archivePath, pdfPath, updated)
  }

  const handleCopyQuote = (text: string, id: string) => {
    navigator.clipboard.writeText(`> "${text}"\n> — *${fileName}*`)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="h-full w-full flex flex-col bg-ed-bg border-r border-ed-rule overflow-hidden select-none">
      {/* Top PDF Control Bar */}
      <div className="h-10 px-3 border-b border-ed-rule flex items-center justify-between bg-ed-surface/40 shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <BookmarkSimple size={15} weight="fill" className="text-ed-accent shrink-0" />
          <span className="text-xs font-semibold text-ed-fg truncate max-w-[220px]" title={fileName}>
            {fileName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsAddingExcerpt((v) => !v)}
            title="Capture excerpt into notes"
            aria-label="Capture excerpt"
            className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
              isAddingExcerpt
                ? 'bg-ed-accent text-ed-on-accent'
                : 'bg-ed-surface hover:bg-ed-surface-strong text-ed-fg border border-ed-rule'
            }`}
          >
            <Plus size={13} weight="bold" />
            <span>Capture Excerpt</span>
          </button>

          <button
            onClick={() => setShowAnnotations((v) => !v)}
            title="Toggle Highlights Panel"
            aria-label="Toggle Highlights"
            className={`p-1.5 rounded-md transition-colors relative ${
              showAnnotations
                ? 'text-ed-accent bg-ed-accent-soft'
                : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
            }`}
          >
            <Highlighter size={16} weight={showAnnotations ? 'fill' : 'regular'} />
            {highlights.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-ed-accent" />
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              title="Close PDF view"
              aria-label="Close PDF"
              className="p-1.5 rounded-md text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface"
            >
              <X size={15} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Excerpt Creation Drawer */}
      {isAddingExcerpt && (
        <div className="p-3 bg-ed-surface/90 border-b border-ed-rule flex flex-col gap-2 shrink-0 animate-slide-up-fade">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-ed-fg uppercase tracking-wider flex items-center gap-1">
              <Quotes size={14} weight="bold" className="text-ed-accent" />
              Capture Excerpt & Citation
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-ed-fg-muted font-mono">Page:</span>
              <input
                type="number"
                min={1}
                value={newPageNum}
                onChange={(e) => setNewPageNum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 bg-ed-bg border border-ed-rule rounded px-1.5 py-0.5 text-xs text-ed-fg font-mono text-center outline-none"
              />
            </div>
          </div>

          <textarea
            autoFocus
            rows={2}
            value={newExcerpt}
            onChange={(e) => setNewExcerpt(e.target.value)}
            placeholder="Paste or type excerpt passage from this PDF page..."
            className="w-full bg-ed-bg border border-ed-rule rounded-lg p-2 text-xs text-ed-fg placeholder:text-ed-fg-muted outline-none focus:border-ed-accent/50 resize-none font-sans"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  title={c.label}
                  className={`w-4 h-4 rounded-full border transition-transform ${
                    c.id === 'amber'
                      ? 'bg-ed-accent'
                      : c.id === 'emerald'
                      ? 'bg-ed-success'
                      : c.id === 'rose'
                      ? 'bg-ed-danger'
                      : 'bg-cyan-400'
                  } ${selectedColor === c.id ? 'scale-125 ring-2 ring-ed-accent/50 border-ed-fg' : 'border-transparent'}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {onQuoteExcerpt && (
                <button
                  onClick={() => {
                    if (!newExcerpt.trim()) return
                    onQuoteExcerpt(newExcerpt.trim(), newPageNum)
                    handleAddHighlight()
                  }}
                  disabled={!newExcerpt.trim()}
                  className="px-3 py-1 rounded-md bg-ed-accent hover:bg-ed-accent-strong disabled:opacity-30 text-ed-on-accent text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                >
                  <Quotes size={12} weight="bold" />
                  <span>Insert into Note</span>
                </button>
              )}

              <button
                onClick={handleAddHighlight}
                disabled={!newExcerpt.trim()}
                className="px-3 py-1 rounded-md bg-ed-surface-strong hover:bg-ed-surface disabled:opacity-30 text-ed-fg text-xs font-semibold border border-ed-rule transition-all"
              >
                Save Highlight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Area: PDF Frame & Highlights Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Frame */}
        <div className="flex-1 h-full overflow-hidden bg-ed-surface/20 relative">
          <iframe
            title={fileName}
            src={convertFileSrc(pdfPath)}
            className="w-full h-full border-0 select-text"
          />
        </div>

        {/* Persistent Highlights Side Panel */}
        {showAnnotations && (
          <div className="w-[240px] border-l border-ed-rule bg-ed-bg/95 flex flex-col h-full shrink-0 animate-fade-in select-none">
            <div className="p-3 border-b border-ed-rule flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ed-fg-muted">
                Highlights ({highlights.length})
              </span>
              <button onClick={() => setShowAnnotations(false)} className="text-ed-fg-muted hover:text-ed-fg">
                <X size={13} weight="bold" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {highlights.length === 0 ? (
                <div className="text-center py-8 text-xs text-ed-fg-muted italic">
                  No highlights saved yet. Click "Capture Excerpt" above to add quotes and annotations.
                </div>
              ) : (
                highlights.map((hl) => (
                  <div
                    key={hl.id}
                    className="p-2.5 rounded-lg bg-ed-surface/60 border border-ed-rule space-y-1.5 group hover:border-ed-rule-strong transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-semibold text-ed-accent bg-ed-accent-soft px-1.5 py-0.5 rounded">
                        Page {hl.pageNumber}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyQuote(hl.text, hl.id)}
                          title="Copy Quote"
                          className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface"
                        >
                          {copiedId === hl.id ? (
                            <Check size={12} weight="bold" className="text-ed-success" />
                          ) : (
                            <Copy size={12} weight="bold" />
                          )}
                        </button>

                        {onQuoteExcerpt && (
                          <button
                            onClick={() => onQuoteExcerpt(hl.text, hl.pageNumber)}
                            title="Quote into Active Note"
                            className="p-1 rounded text-ed-fg-muted hover:text-ed-accent hover:bg-ed-surface"
                          >
                            <CaretRight size={12} weight="bold" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteHighlight(hl.id)}
                          title="Delete Highlight"
                          className="p-1 rounded text-ed-fg-muted hover:text-ed-danger hover:bg-ed-surface"
                        >
                          <Trash size={12} weight="bold" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-ed-fg leading-relaxed select-text font-serif italic">
                      "{hl.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
