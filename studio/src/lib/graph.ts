export interface GraphNode {
  id: string
  label: string
}

export interface PositionedNode extends GraphNode {
  x: number
  y: number
}

const REPULSION = 6000
const SPRING_LENGTH = 120
const SPRING_STRENGTH = 0.02
const CENTER_STRENGTH = 0.01
const ITERATIONS = 300
const MAX_STEP = 20
// Force-directed layout is O(nodes^2 * iterations); beyond this many notes
// it falls back to a plain circle so the graph stays responsive.
const MAX_SIMULATED_NODES = 300

function circleLayout(nodes: GraphNode[], width: number, height: number): PositionedNode[] {
  const radius = Math.min(width, height) / 2 - 40
  return nodes.map((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2
    return {
      ...node,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
    }
  })
}

/** Force-directed layout: repulsion between all nodes, springs along edges, a weak centering pull. */
export function computeLayout(
  nodes: GraphNode[],
  edges: [string, string][],
  width: number,
  height: number,
): PositionedNode[] {
  if (nodes.length === 0) return []
  if (nodes.length > MAX_SIMULATED_NODES) return circleLayout(nodes, width, height)

  const positions = new Map<string, { x: number; y: number }>()
  const radius = Math.min(width, height) / 4
  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2
    positions.set(node.id, {
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
    })
  })

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const forces = new Map<string, { x: number; y: number }>()
    nodes.forEach((n) => forces.set(n.id, { x: 0, y: 0 }))

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = positions.get(nodes[i].id)!
        const b = positions.get(nodes[j].id)!
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distSq = Math.max(dx * dx + dy * dy, 1)
        const dist = Math.sqrt(distSq)
        const force = REPULSION / distSq
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        forces.get(nodes[i].id)!.x += fx
        forces.get(nodes[i].id)!.y += fy
        forces.get(nodes[j].id)!.x -= fx
        forces.get(nodes[j].id)!.y -= fy
      }
    }

    for (const [from, to] of edges) {
      const a = positions.get(from)
      const b = positions.get(to)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
      const force = (dist - SPRING_LENGTH) * SPRING_STRENGTH
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      forces.get(from)!.x += fx
      forces.get(from)!.y += fy
      forces.get(to)!.x -= fx
      forces.get(to)!.y -= fy
    }

    for (const node of nodes) {
      const pos = positions.get(node.id)!
      const force = forces.get(node.id)!
      force.x += (width / 2 - pos.x) * CENTER_STRENGTH
      force.y += (height / 2 - pos.y) * CENTER_STRENGTH
    }

    for (const node of nodes) {
      const pos = positions.get(node.id)!
      const force = forces.get(node.id)!
      pos.x += Math.max(Math.min(force.x, MAX_STEP), -MAX_STEP)
      pos.y += Math.max(Math.min(force.y, MAX_STEP), -MAX_STEP)
    }
  }

  return nodes.map((node) => ({ ...node, ...positions.get(node.id)! }))
}
