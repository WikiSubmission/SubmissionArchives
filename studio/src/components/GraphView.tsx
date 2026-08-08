import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { scanArchive } from '../lib/notes'
import { computeLayout, type PositionedNode } from '../lib/graph'

interface GraphViewProps {
  archivePath: string
  onOpenFile: (path: string) => void
  onClose: () => void
}

const WIDTH = 900
const HEIGHT = 600

export default function GraphView({ archivePath, onOpenFile, onClose }: GraphViewProps) {
  const [nodes, setNodes] = useState<PositionedNode[]>([])
  const [edges, setEdges] = useState<[string, string][]>([])

  useEffect(() => {
    scanArchive(archivePath)
      .then((notes) => {
        const byName = new Map(notes.map((note) => [note.name.toLowerCase(), note.path]))
        const graphNodes = notes.map((note) => ({ id: note.path, label: note.name }))
        const graphEdges: [string, string][] = []

        for (const note of notes) {
          for (const link of note.links) {
            const targetPath = byName.get(link.toLowerCase())
            if (targetPath && targetPath !== note.path) {
              graphEdges.push([note.path, targetPath])
            }
          }
        }

        setNodes(computeLayout(graphNodes, graphEdges, WIDTH, HEIGHT))
        setEdges(graphEdges)
      })
      .catch(() => {
        setNodes([])
        setEdges([])
      })
  }, [archivePath])

  const positionById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#141416] border border-ed-rule rounded-lg shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-ed-rule">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Graph</span>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
            <X size={15} />
          </button>
        </div>

        {nodes.length === 0 ? (
          <div className="flex items-center justify-center text-sm text-white/30" style={{ width: WIDTH, height: HEIGHT }}>
            No linked notes yet.
          </div>
        ) : (
          <svg width={WIDTH} height={HEIGHT}>
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
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={1}
                />
              )
            })}
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onClick={() => {
                  onOpenFile(node.id)
                  onClose()
                }}
              >
                <circle r={5} fill="#fafafa" fillOpacity={0.85} />
                <text x={9} y={4} fontSize={11} fill="rgba(255,255,255,0.6)">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        )}
      </div>
    </div>
  )
}
