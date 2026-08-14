import React, { useState, useRef, useCallback, useEffect } from 'react'

export interface SplitPaneState {
  id: string
  direction: 'horizontal' | 'vertical'
  splitRatio: number // 0.15 - 0.85
  firstPane: string | null // filePath
  secondPane: string | null // filePath
}

interface SplitPaneProps {
  splitState: SplitPaneState | null
  activeFilePath: string | null
  renderPane: (filePath: string | null, paneIndex: 'first' | 'second') => React.ReactNode
  onRatioChange?: (ratio: number) => void
}

export function SplitPane({ splitState, activeFilePath, renderPane, onRatioChange }: SplitPaneProps) {
  const [ratio, setRatio] = useState(splitState?.splitRatio ?? 0.5)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (splitState?.splitRatio) {
      setRatio(splitState.splitRatio)
    }
  }, [splitState?.splitRatio])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = splitState?.direction === 'horizontal' ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'
  }, [splitState?.direction])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const isHorizontal = splitState?.direction === 'horizontal'

      let newRatio: number
      if (isHorizontal) {
        newRatio = (e.clientY - rect.top) / rect.height
      } else {
        newRatio = (e.clientX - rect.left) / rect.width
      }

      // Clamp ratio between 15% and 85%
      newRatio = Math.max(0.15, Math.min(0.85, newRatio))
      setRatio(newRatio)
      onRatioChange?.(newRatio)
    }

    const handlePointerUp = () => {
      if (isDragging.current) {
        isDragging.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [splitState?.direction, onRatioChange])

  if (!splitState || !splitState.secondPane) {
    return <div className="w-full h-full flex-1 overflow-hidden">{renderPane(activeFilePath, 'first')}</div>
  }

  const isHorizontal = splitState.direction === 'horizontal'

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex ${isHorizontal ? 'flex-col' : 'flex-row'} overflow-hidden relative select-none`}
    >
      <div
        style={{ [isHorizontal ? 'height' : 'width']: `${ratio * 100}%` }}
        className="overflow-hidden relative min-w-[200px] min-h-[150px]"
      >
        {renderPane(splitState.firstPane || activeFilePath, 'first')}
      </div>

      {/* Interactive Draggable Resize Handle */}
      <div
        onPointerDown={handlePointerDown}
        className={`group relative ${
          isHorizontal
            ? 'h-2 cursor-row-resize py-0.5'
            : 'w-2 cursor-col-resize px-0.5'
        } bg-ed-bg hover:bg-amber-500/20 active:bg-amber-500/40 transition-colors z-30 shrink-0 select-none flex items-center justify-center`}
      >
        <div
          className={`${
            isHorizontal ? 'h-[1px] w-8' : 'w-[1px] h-8'
          } bg-ed-rule-strong group-hover:bg-amber-500 transition-colors rounded-full`}
        />
      </div>

      <div
        style={{ [isHorizontal ? 'height' : 'width']: `${(1 - ratio) * 100}%` }}
        className="overflow-hidden relative min-w-[200px] min-h-[150px]"
      >
        {renderPane(splitState.secondPane, 'second')}
      </div>
    </div>
  )
}
