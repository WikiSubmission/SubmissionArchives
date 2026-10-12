import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'
import { scanArchive } from '../lib/notes'
import { computeLayout, neighborhood, type PositionedNode } from '../lib/graph'

interface GraphViewProps {
  archivePath: string
  onOpenFile: (path: string) => void
  onClose: () => void
}

const WIDTH = 900
const HEIGHT = 600

export default function GraphView({ archivePath, onOpenFile, onClose }: GraphViewProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const drag = useRef<{x:number;y:number;left:number;top:number} | null>(null)
  const [selected, setSelected] = useState('')
  const [local, setLocal] = useState(false)
  const [view, setView] = useState({x:0,y:0,width:WIDTH,height:HEIGHT})
  const [error, setError] = useState('')
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const element = dialog.current; element?.showModal()
    return () => { element?.close(); previous?.focus() }
  }, [])
  const [nodes, setNodes] = useState<PositionedNode[]>([])
  const [edges, setEdges] = useState<[string, string][]>([])

  useEffect(() => {
    let active = true
    scanArchive(archivePath)
      .then((allNotes) => {
        if (!active) return
        const notes = allNotes.slice(0, 500)
        if (allNotes.length > 500) setError('Showing the first 500 notes. Use the explorer for the complete vault.')
        const byName = new Map(notes.map((note) => [note.name.toLowerCase(), note.path]))
        const graphNodes = notes.map((note) => ({ id: note.path, label: note.name }))
        const graphEdges: [string, string][] = []

        for (const note of notes) {
          for (const link of note.links) {
            const targetPath = byName.get(link.split('|')[0].split('#')[0].trim().toLowerCase())
            if (targetPath && targetPath !== note.path) {
              graphEdges.push([note.path, targetPath])
            }
          }
        }

        setNodes(computeLayout(graphNodes, graphEdges, WIDTH, HEIGHT))
        setEdges(graphEdges)
      })
      .catch((err) => {
        if (!active) return
        setError(String(err))
        setNodes([])
        setEdges([])
      })
    return () => { active = false }
  }, [archivePath])

  const visible = useMemo(() => {
    const ids = new Set(local && selected ? neighborhood(nodes.map(n => n.id), edges, selected) : nodes.map(n => n.id))
    return nodes.filter(n => ids.has(n.id))
  }, [nodes, edges, selected, local])
  function zoom(factor: number) { setView(v => {
    const width = Math.max(120, Math.min(3600, v.width*factor)), height = width*HEIGHT/WIDTH
    return {x:v.x+(v.width-width)/2,y:v.y+(v.height-height)/2,width,height}
  }) }
  function fit() {
    if (!visible.length) return
    const x = Math.min(...visible.map(n=>n.x))-40, y = Math.min(...visible.map(n=>n.y))-40
    const width = Math.max(Math.max(...visible.map(n=>n.x))+180-x, (Math.max(...visible.map(n=>n.y))+40-y)*WIDTH/HEIGHT)
    setView({x,y,width,height:width*HEIGHT/WIDTH})
  }
  const positionById = useMemo(() => new Map(visible.map((n) => [n.id, n])), [visible])

  return (
    <dialog ref={dialog} aria-label="Knowledge graph" onCancel={e=>{e.preventDefault();onClose()}} className="m-auto w-[95vw] max-w-6xl rounded-lg border border-ed-rule bg-ed-bg p-4 text-ed-fg backdrop:bg-black/60">
        <div className="flex items-center justify-between px-4 py-3 border-b border-ed-rule">
          <span className="text-xs font-bold uppercase tracking-wider text-ed-fg-muted">Knowledge Graph View</span>
          <button onClick={onClose} aria-label="Close graph" className="text-ed-fg-muted hover:text-ed-fg transition-colors">
            <X size={16} weight="bold" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3 py-3">
          <button onClick={()=>zoom(.8)}>Zoom in</button><button onClick={()=>zoom(1.25)}>Zoom out</button><button onClick={fit}>Fit</button><button onClick={()=>setView({x:0,y:0,width:WIDTH,height:HEIGHT})}>Reset</button>
          <label><input type="checkbox" checked={local} onChange={e=>setLocal(e.target.checked)} /> Local links</label>
          <select aria-label="Selected note" value={selected} onChange={e=>setSelected(e.target.value)}><option value="">All notes</option>{nodes.map(n=><option key={n.id} value={n.id}>{n.label}</option>)}</select>
          {selected && <button onClick={()=>{onOpenFile(selected);onClose()}}>Open selected note</button>}
        </div>
        <p className="text-xs">Select a node to inspect incoming/outgoing links. Enter or double-click opens it. Drag empty space to pan.</p>
        {error && <p role="status">{error}</p>}
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center text-xs font-mono text-ed-fg-muted" style={{ minHeight: 200 }}>
            No linked notes yet. Connect notes using [[Wiki Links]].
          </div>
        ) : (
          <svg width="100%" className="h-[60vh] touch-none" role="group" aria-label="Note links" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
            onPointerDown={e=>{if(e.target!==e.currentTarget)return;e.currentTarget.setPointerCapture(e.pointerId);drag.current={x:e.clientX,y:e.clientY,left:view.x,top:view.y}}}
            onPointerMove={e=>{const d=drag.current;if(!d)return;const r=e.currentTarget.getBoundingClientRect();setView(v=>({...v,x:d.left-(e.clientX-d.x)*v.width/r.width,y:d.top-(e.clientY-d.y)*v.height/r.height}))}}
            onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
            <defs><marker id="graph-arrow" viewBox="0 0 10 10" refX="14" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ed-fg-secondary)" /></marker></defs>
            {edges.map(([from, to], i) => {
              const a = positionById.get(from)
              const b = positionById.get(to)
              if (!a || !b) return null
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="var(--ed-fg-secondary)" opacity=".5" markerEnd="url(#graph-arrow)"
                  strokeWidth={1}
                />
              )
            })}
            {visible.map((node) => (
              <g
                role="button" tabIndex={0} aria-label={`Open ${node.label}`} aria-pressed={selected===node.id}
                onKeyDown={e=>{if(e.key==='Enter'){onOpenFile(node.id);onClose()}if(e.key===' '){e.preventDefault();setSelected(node.id)}}}
                onDoubleClick={()=>{onOpenFile(node.id);onClose()}}
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer group"
                onClick={() => setSelected(node.id)}
              >
                <circle r={selected===node.id?9:6} fill="var(--ed-accent)" className="transition-transform group-hover:scale-125" />
                <text x={9} y={4} fontSize={11} fill="var(--ed-fg)" className="font-mono font-medium">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        )}
    </dialog>
  )
}
