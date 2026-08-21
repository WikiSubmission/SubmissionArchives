import { PanelResizeHandle } from 'react-resizable-panels'

interface ResizeHandleProps {
  /** Stable identity, so a persisted layout survives panes being toggled. */
  id: string
  direction?: 'horizontal' | 'vertical'
  /** True when the pane beside it is collapsed. The handle stays mounted but
   * takes no space and no input: react-resizable-panels requires a handle
   * between every adjacent panel pair, and unmounting one leaves the group in
   * an invalid state where imperative expand/collapse stops working. */
  inert?: boolean
}

/** A hairline rule that turns accent-coloured while it is being dragged.
 *
 * DESIGN.md asks for straight rules over floating chrome, so the handle is a
 * 1px divider that gains an invisible hit area rather than a visible gutter:
 * the line you see is the line you would draw between two panes anyway. */
export default function ResizeHandle({ id, direction = 'horizontal', inert = false }: ResizeHandleProps) {
  const isHorizontal = direction === 'horizontal'

  return (
    <PanelResizeHandle
      id={id}
      disabled={inert}
      className={`group relative shrink-0 transition-colors ${
        inert
          ? isHorizontal
            ? 'pointer-events-none w-0'
            : 'pointer-events-none h-0'
          : `bg-ed-rule data-[resize-handle-state=drag]:bg-ed-accent data-[resize-handle-state=hover]:bg-ed-accent ${
              isHorizontal ? 'w-px cursor-col-resize' : 'h-px cursor-row-resize'
            }`
      }`}
    >
      {!inert && (
        <span
          aria-hidden
          className={`absolute ${isHorizontal ? '-inset-x-1 inset-y-0' : '-inset-y-1 inset-x-0'}`}
        />
      )}
    </PanelResizeHandle>
  )
}
