import { ReactNode } from 'react'
import PageRuler from './PageRuler'

interface PageModeCanvasProps {
  children: ReactNode
}

export default function PageModeCanvas({ children }: PageModeCanvasProps) {
  return (
    <div className="w-full h-full overflow-y-auto document-canvas-bg flex flex-col items-center py-6 select-none">
      {/* Horizontal Page Ruler aligned with 816px paper sheet */}
      <PageRuler />

      {/* Centered White Paper Sheet (8.5" x 11", 1" Margins) */}
      <div className="page-sheet-standard my-4">
        {children}
      </div>
    </div>
  )
}
