import React, { useState } from 'react'

export interface SplitPaneState {
  id: string
  direction: 'horizontal' | 'vertical'
  splitRatio: number // 0.1 - 0.9
  firstPane: string | null // filePath
  secondPane: string | null // filePath
}

interface SplitPaneProps {
  splitState: SplitPaneState | null
  activeFilePath: string | null
  renderPane: (filePath: string | null) => React.ReactNode
}

export function SplitPane({ splitState, activeFilePath, renderPane }: SplitPaneProps) {
  const [ratio] = useState(splitState?.splitRatio ?? 0.5)

  if (!splitState || !splitState.secondPane) {
    return <div className="w-full h-full flex-1 overflow-hidden">{renderPane(activeFilePath)}</div>
  }

  const isHorizontal = splitState.direction === 'horizontal'

  return (
    <div className={`w-full h-full flex ${isHorizontal ? 'flex-col' : 'flex-row'} overflow-hidden relative`}>
      <div
        style={{ [isHorizontal ? 'height' : 'width']: `${ratio * 100}%` }}
        className="overflow-hidden relative"
      >
        {renderPane(splitState.firstPane || activeFilePath)}
      </div>

      {/* Resize Handle */}
      <div
        className={`${
          isHorizontal ? 'h-1.5 cursor-row-resize' : 'w-1.5 cursor-col-resize'
        } bg-ed-rule hover:bg-amber-500/80 transition-colors z-30 shrink-0 select-none`}
      />

      <div
        style={{ [isHorizontal ? 'height' : 'width']: `${(1 - ratio) * 100}%` }}
        className="overflow-hidden relative"
      >
        {renderPane(splitState.secondPane)}
      </div>
    </div>
  )
}
