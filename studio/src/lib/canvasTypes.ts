export type CanvasNodeType = 'text' | 'file' | 'quran' | 'irab' | 'group'

export interface CanvasNode {
  id: string
  type: CanvasNodeType
  x: number
  y: number
  width: number
  height: number
  color?: 'amber' | 'emerald' | 'rose' | 'cyan' | 'violet' | 'parchment'
  // Text node
  text?: string
  // File node
  file?: string
  // Quran node
  quranQuery?: string
  quranArabic?: string
  quranEnglish?: string
  // Irab node
  irabSentence?: string
  irabTokens?: { word: string; role: string; color: string }[]
}

export interface CanvasEdge {
  id: string
  fromNode: string
  toNode: string
  fromSide?: 'top' | 'right' | 'bottom' | 'left'
  toSide?: 'top' | 'right' | 'bottom' | 'left'
  label?: string
  color?: string
}

export interface CanvasData {
  nodes: CanvasNode[]
  edges: CanvasEdge[]
}
