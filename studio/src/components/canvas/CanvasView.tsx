import { useState, useRef, useEffect } from 'react'
import { safeInvoke as invoke } from '../../lib/ipc'
import {
  X,
  Trash,
  BookOpen,
  FileText,
  Article,
  TreeStructure,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  ArrowsClockwise,
  ArrowRight,
  Sparkle,
  ArrowSquareOut,
  FolderOpen
} from '@phosphor-icons/react'
import type { CanvasData, CanvasNode } from '../../lib/canvasTypes'
import { scanArchive, type NoteRecord } from '../../lib/notes'

interface CanvasViewProps {
  archivePath: string
  onOpenFile: (path: string) => void
  onClose: () => void
}

const DEFAULT_CANVAS: CanvasData = {
  nodes: [
    {
      id: 'node-1',
      type: 'quran',
      x: 100,
      y: 120,
      width: 320,
      height: 200,
      color: 'amber',
      quranQuery: '2:255',
      quranArabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
      quranEnglish: 'GOD: there is no god except He, the Living, the Eternal.',
    },
    {
      id: 'node-2',
      type: 'text',
      x: 500,
      y: 120,
      width: 280,
      height: 180,
      color: 'parchment',
      text: '### Key Themes of Ayat al-Kursi\n- Absolute Monotheism (*Tawhid*)\n- Divine Sovereignty (*Al-Hayy, Al-Qayyum*)\n- Everlasting Transcendence',
    },
    {
      id: 'node-3',
      type: 'irab',
      x: 250,
      y: 380,
      width: 440,
      height: 160,
      color: 'emerald',
      irabSentence: 'الله لا إله إلا هو',
      irabTokens: [
        { word: 'اللَّهُ', role: 'Mubtada (Subject)', color: '#3b82f6' },
        { word: 'لَا', role: 'Nafiyah lil-Jins (Negation)', color: '#ef4444' },
        { word: 'إِلَٰهَ', role: 'Ism La (Noun of Negation)', color: '#f59e0b' },
        { word: 'إِلَّا', role: 'Adat Hasr (Restriction)', color: '#8b5cf6' },
        { word: 'هُوَ', role: 'Badal / Khabar', color: '#10b981' },
      ],
    },
  ],
  edges: [
    {
      id: 'edge-1',
      fromNode: 'node-1',
      toNode: 'node-2',
      label: 'Exegesis & Themes',
    },
    {
      id: 'edge-2',
      fromNode: 'node-1',
      toNode: 'node-3',
      label: 'Grammatical Breakdown (I‘rāb)',
    },
  ],
}

export default function CanvasView({ archivePath, onOpenFile, onClose }: CanvasViewProps) {
  const [data, setData] = useState<CanvasData>(DEFAULT_CANVAS)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [availableNotes, setAvailableNotes] = useState<NoteRecord[]>([])

  // Modals for adding cards
  const [verseInputOpen, setVerseInputOpen] = useState(false)
  const [verseQuery, setVerseQuery] = useState('')
  const [verseLoading, setVerseLoading] = useState(false)
  const [notePickerOpen, setNotePickerOpen] = useState(false)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastMousePos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    scanArchive(archivePath).then(setAvailableNotes).catch(() => {})
  }, [archivePath])

  // Canvas Pan Handlers
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('canvas-surface')) {
      return
    }
    setIsPanning(true)
    lastMousePos.current = { x: e.clientX, y: e.clientY }
    setSelectedNodeId(null)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x
      const dy = e.clientY - lastMousePos.current.y
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
    } else if (draggingNodeId) {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const canvasX = (e.clientX - rect.left - pan.x) / zoom - dragOffset.x
      const canvasY = (e.clientY - rect.top - pan.y) / zoom - dragOffset.y

      setData((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === draggingNodeId ? { ...n, x: canvasX, y: canvasY } : n)),
      }))
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingNodeId(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    const newZoom = Math.max(0.3, Math.min(2.5, zoom * zoomFactor))
    setZoom(newZoom)
  }

  // Node Drag Starter
  const handleNodeMouseDown = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation()
    setSelectedNodeId(node.id)
    setDraggingNodeId(node.id)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const mouseCanvasX = (e.clientX - rect.left - pan.x) / zoom
    const mouseCanvasY = (e.clientY - rect.top - pan.y) / zoom
    setDragOffset({
      x: mouseCanvasX - node.x,
      y: mouseCanvasY - node.y,
    })
  }

  // Node Creation Actions
  const handleAddTextCard = () => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: 'text',
      x: -pan.x / zoom + 150,
      y: -pan.y / zoom + 150,
      width: 260,
      height: 160,
      color: 'parchment',
      text: '### New Concept\nAdd your insights, cross-references, or definitions here.',
    }
    setData((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }))
    setSelectedNodeId(newNode.id)
  }

  const handleAddQuranCard = async () => {
    if (!verseQuery.trim()) return
    setVerseLoading(true)
    try {
      const verses = await invoke<{ chapter: number; verse: number; arabic: string; english: string }[]>(
        'search_verses',
        { query: verseQuery.trim() }
      )
      if (verses.length > 0) {
        const v = verses[0]
        const newNode: CanvasNode = {
          id: `node-${Date.now()}`,
          type: 'quran',
          x: -pan.x / zoom + 150,
          y: -pan.y / zoom + 150,
          width: 320,
          height: 190,
          color: 'amber',
          quranQuery: `${v.chapter}:${v.verse}`,
          quranArabic: v.arabic,
          quranEnglish: v.english,
        }
        setData((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }))
        setSelectedNodeId(newNode.id)
        setVerseQuery('')
        setVerseInputOpen(false)
      }
    } catch (err) {
      window.alert(String(err))
    } finally {
      setVerseLoading(false)
    }
  }

  const handleAddVaultNoteCard = (note: NoteRecord) => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: 'file',
      x: -pan.x / zoom + 150,
      y: -pan.y / zoom + 150,
      width: 280,
      height: 160,
      file: note.path,
      text: note.content.slice(0, 240) + (note.content.length > 240 ? '...' : ''),
    }
    setData((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }))
    setSelectedNodeId(newNode.id)
    setNotePickerOpen(false)
  }

  const handleAddIrabCard = () => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: 'irab',
      x: -pan.x / zoom + 150,
      y: -pan.y / zoom + 150,
      width: 400,
      height: 150,
      color: 'emerald',
      irabSentence: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
      irabTokens: [
        { word: 'الْحَمْدُ', role: 'Mubtada (Marfu‘)', color: '#3b82f6' },
        { word: 'لِلَّهِ', role: 'Jar wa Majrur (Shibh Jumlah)', color: '#10b981' },
        { word: 'رَبِّ', role: 'Na‘t / Sifah (Majrur)', color: '#f59e0b' },
        { word: 'الْعَالَمِينَ', role: 'Mudaf Ilayh (Majrur bil-Ya)', color: '#8b5cf6' },
      ],
    }
    setData((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }))
    setSelectedNodeId(newNode.id)
  }

  const handleDeleteSelected = () => {
    if (!selectedNodeId) return
    setData((prev) => ({
      nodes: prev.nodes.filter((n) => n.id !== selectedNodeId),
      edges: prev.edges.filter((e) => e.fromNode !== selectedNodeId && e.toNode !== selectedNodeId),
    }))
    setSelectedNodeId(null)
  }

  const nodeMap = new Map(data.nodes.map((n) => [n.id, n]))

  return (
    <div
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex flex-col z-50 select-none animate-fadeIn"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Floating Control Bar */}
      <div className="h-12 border-b border-ed-rule glass px-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TreeStructure size={18} weight="bold" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-ed-fg tracking-tight">Visual Synthesis Whiteboard Canvas</h2>
            <p className="text-[10px] text-ed-fg-muted">Spatial concept mapping, Quran verse cards, and syntax diagramming</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleAddTextCard}
            title="Add Concept Note"
            className="px-2.5 py-1.5 rounded-lg bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs font-semibold text-ed-fg flex items-center gap-1.5 transition-colors"
          >
            <Article size={14} weight="bold" className="text-amber-400" />
            <span>Note Card</span>
          </button>

          <button
            onClick={() => setVerseInputOpen(true)}
            title="Add Quran Verse Card"
            className="px-2.5 py-1.5 rounded-lg bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs font-semibold text-ed-fg flex items-center gap-1.5 transition-colors"
          >
            <BookOpen size={14} weight="bold" className="text-emerald-400" />
            <span>Quran Card</span>
          </button>

          <button
            onClick={() => setNotePickerOpen(true)}
            title="Add Vault Note Card"
            className="px-2.5 py-1.5 rounded-lg bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs font-semibold text-ed-fg flex items-center gap-1.5 transition-colors"
          >
            <FolderOpen size={14} weight="bold" className="text-amber-400" />
            <span>Vault Note</span>
          </button>

          <button
            onClick={handleAddIrabCard}
            title="Add I'rab Grammar Card"
            className="px-2.5 py-1.5 rounded-lg bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs font-semibold text-ed-fg flex items-center gap-1.5 transition-colors"
          >
            <Sparkle size={14} weight="bold" className="text-cyan-400" />
            <span>I‘rāb Syntax</span>
          </button>

          <div className="w-px h-4 bg-ed-rule mx-1" />

          {selectedNodeId && (
            <button
              onClick={handleDeleteSelected}
              title="Delete Selected Card"
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors"
            >
              <Trash size={15} weight="bold" />
            </button>
          )}

          <button
            onClick={() => setZoom((z) => Math.min(2.5, z * 1.15))}
            title="Zoom In"
            className="p-1.5 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface"
          >
            <MagnifyingGlassPlus size={16} />
          </button>

          <button
            onClick={() => setZoom((z) => Math.max(0.3, z * 0.85))}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface"
          >
            <MagnifyingGlassMinus size={16} />
          </button>

          <button
            onClick={() => {
              setZoom(1)
              setPan({ x: 0, y: 0 })
            }}
            title="Reset Canvas View"
            className="p-1.5 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface"
          >
            <ArrowsClockwise size={16} />
          </button>

          <div className="w-px h-4 bg-ed-rule mx-1" />

          <button
            onClick={onClose}
            title="Close Canvas"
            aria-label="Close"
            className="p-1.5 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Surface */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownBackground}
        onWheel={handleWheel}
        className="flex-1 overflow-hidden relative canvas-surface bg-[#121110] cursor-grab active:cursor-grabbing"
        style={{
          backgroundImage: `radial-gradient(circle, #332d27 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transform Container */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* SVG Arrow Connectors Layer */}
          <svg className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-none overflow-visible">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#e5a93c" />
              </marker>
            </defs>

            {data.edges.map((edge) => {
              const from = nodeMap.get(edge.fromNode)
              const to = nodeMap.get(edge.toNode)
              if (!from || !to) return null

              const startX = from.x + from.width
              const startY = from.y + from.height / 2
              const endX = to.x
              const endY = to.y + to.height / 2
              const dx = (endX - startX) / 2

              const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`

              return (
                <g key={edge.id}>
                  <path
                    d={pathData}
                    stroke="#e5a93c"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrow)"
                    opacity={0.8}
                  />
                  {edge.label && (
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 - 8}
                      fill="#e5a93c"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="bg-black px-1"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Canvas Nodes Layer */}
          {data.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                style={{
                  transform: `translate(${node.x}px, ${node.y}px)`,
                  width: `${node.width}px`,
                }}
                className={`absolute pointer-events-auto rounded-xl border p-3.5 transition-shadow select-none shadow-elev-lg backdrop-blur-md ${
                  isSelected
                    ? 'ring-2 ring-amber-400 border-amber-400/80 shadow-elev-xl'
                    : 'border-ed-rule-strong hover:border-amber-500/50'
                } ${
                  node.type === 'quran'
                    ? 'bg-[#1e1b18]/95 border-amber-500/30'
                    : node.type === 'irab'
                    ? 'bg-[#151c18]/95 border-emerald-500/30'
                    : 'bg-ed-surface/95'
                }`}
              >
                {/* Node Header */}
                <div className="flex items-center justify-between pb-2 border-b border-ed-rule/60 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    {node.type === 'quran' && <BookOpen size={12} weight="fill" />}
                    {node.type === 'irab' && <Sparkle size={12} weight="fill" />}
                    {node.type === 'file' && <FolderOpen size={12} weight="fill" />}
                    {node.type === 'text' && <FileText size={12} weight="fill" />}
                    {node.type === 'quran'
                      ? `Surah Reference ${node.quranQuery}`
                      : node.type === 'irab'
                      ? 'I‘rāb Sentence Diagram'
                      : node.type === 'file'
                      ? (node.file?.split(/[\\/]/).pop() ?? 'Vault Note')
                      : 'Concept Note'}
                  </span>

                  {node.type === 'file' && node.file && (
                    <button
                      onClick={() => {
                        onClose()
                        onOpenFile(node.file!)
                      }}
                      title="Open note in editor"
                      className="p-1 rounded text-ed-fg-muted hover:text-amber-400 hover:bg-ed-surface transition-colors"
                    >
                      <ArrowSquareOut size={13} weight="bold" />
                    </button>
                  )}
                </div>

                {/* Node Content */}
                {node.type === 'quran' && (
                  <div className="space-y-2">
                    <p className="text-base text-right font-serif leading-relaxed text-amber-100/90 font-amiri" dir="rtl">
                      {node.quranArabic}
                    </p>
                    <p className="text-xs text-ed-fg-muted font-sans leading-normal border-t border-ed-rule/30 pt-1.5">
                      {node.quranEnglish}
                    </p>
                  </div>
                )}

                {node.type === 'file' && (
                  <div className="space-y-1.5">
                    <p className="text-xs text-ed-fg-muted leading-relaxed font-sans line-clamp-4">
                      {node.text}
                    </p>
                  </div>
                )}

                {node.type === 'irab' && (
                  <div className="space-y-2.5">
                    <div className="text-base font-serif text-right text-emerald-300 font-amiri" dir="rtl">
                      {node.irabSentence}
                    </div>

                    <div className="flex flex-wrap gap-1.5 justify-end" dir="rtl">
                      {node.irabTokens?.map((tok, i) => (
                        <div
                          key={i}
                          className="px-2 py-1 rounded-md bg-black/40 border border-ed-rule/40 text-right flex flex-col items-center gap-0.5"
                        >
                          <span className="text-xs font-serif font-bold text-ed-fg">{tok.word}</span>
                          <span
                            className="text-[9px] font-mono font-semibold px-1 rounded"
                            style={{ color: tok.color, backgroundColor: `${tok.color}15` }}
                          >
                            {tok.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {node.type === 'text' && (
                  <textarea
                    value={node.text}
                    onChange={(e) => {
                      const val = e.target.value
                      setData((prev) => ({
                        ...prev,
                        nodes: prev.nodes.map((n) => (n.id === node.id ? { ...n, text: val } : n)),
                      }))
                    }}
                    className="w-full bg-transparent border-0 text-xs text-ed-fg resize-none outline-none leading-relaxed font-sans"
                    rows={4}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Add Quran Verse Card Modal */}
      {verseInputOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setVerseInputOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-ed-bg border border-ed-rule-strong rounded-2xl shadow-elev-xl p-5 space-y-4 animate-slide-up-fade"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ed-fg uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen size={15} weight="bold" className="text-emerald-400" />
                Add Verse Card to Canvas
              </h3>
              <button onClick={() => setVerseInputOpen(false)} className="text-ed-fg-muted hover:text-ed-fg">
                <X size={15} weight="bold" />
              </button>
            </div>

            <div className="space-y-1.5">
              <input
                autoFocus
                type="text"
                value={verseQuery}
                onChange={(e) => setVerseQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddQuranCard()}
                placeholder="e.g. Baqarah 255, 18:1-5, or Ikhlas"
                className="w-full bg-ed-surface border border-ed-rule rounded-xl px-3 py-2 text-xs text-ed-fg outline-none focus:border-amber-500/50"
              />
              <p className="text-[10px] text-ed-fg-muted font-mono">
                Accepts Surah names or numeric references.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setVerseInputOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ed-fg-muted hover:text-ed-fg"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuranCard}
                disabled={verseLoading || !verseQuery.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black text-xs font-bold transition-all shadow-sm flex items-center gap-1"
              >
                <span>Add Card</span>
                <ArrowRight size={13} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vault Note Card Modal */}
      {notePickerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setNotePickerOpen(false)}
        >
          <div
            className="w-full max-w-md bg-ed-bg border border-ed-rule-strong rounded-2xl shadow-elev-xl p-5 space-y-4 animate-slide-up-fade"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-ed-fg uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen size={15} weight="bold" className="text-amber-400" />
                Add Note to Canvas
              </h3>
              <button onClick={() => setNotePickerOpen(false)} className="text-ed-fg-muted hover:text-ed-fg">
                <X size={15} weight="bold" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
              {availableNotes.length === 0 ? (
                <div className="text-xs text-ed-fg-muted text-center py-6">No notes found in archive.</div>
              ) : (
                availableNotes.map((note) => (
                  <button
                    key={note.path}
                    onClick={() => handleAddVaultNoteCard(note)}
                    className="w-full text-left p-2.5 rounded-xl bg-ed-surface/50 hover:bg-ed-surface-strong border border-ed-rule flex items-center justify-between group transition-colors"
                  >
                    <span className="text-xs font-semibold text-ed-fg truncate">{note.name}</span>
                    <ArrowRight size={13} weight="bold" className="text-ed-fg-muted group-hover:text-amber-400 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
