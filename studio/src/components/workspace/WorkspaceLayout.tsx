import { useEffect, useRef, type ReactNode } from 'react'
import { Panel, PanelGroup, type ImperativePanelHandle } from 'react-resizable-panels'
import ResizeHandle from './ResizeHandle'
import type { SplitPaneState } from './splitPaneState'

const EXPLORER_DEFAULT_SIZE = 18
const EXPLORER_MIN_SIZE = 12
const EXPLORER_MAX_SIZE = 34
const INSPECTOR_DEFAULT_SIZE = 22
const INSPECTOR_MIN_SIZE = 14
const INSPECTOR_MAX_SIZE = 40
/** Media Notes seats a player, a chapter rail and a transcript; below this it
 * stops being readable, so the panel is widened to it on first switch. */
const INSPECTOR_MEDIA_MIN_PX = 440
const INSPECTOR_MEDIA_MAX_SIZE = 62

/** Keeps a collapsible panel in step with the React flag that owns it.
 *
 * Prism animates its sidebar collapse by driving `resize()` over rAF. That does
 * not survive here: Studio persists pane sizes through `autoSaveId`, and the
 * saved layout is reapplied on top of any imperative resize, so the pane snaps
 * back. `collapse()` / `expand()` are the calls the library records in that
 * saved layout, so those are what we call — and the smooth width change comes
 * from a CSS transition on the panel's own flex-grow (see App.css), which the
 * library sets inline. Same result as prism's rAF loop, without racing it. */
function useCollapsiblePanel(open: boolean) {
  const panelRef = useRef<ImperativePanelHandle>(null)

  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    if (open && panel.isCollapsed()) panel.expand()
    if (!open && !panel.isCollapsed()) panel.collapse()
  }, [open])

  return panelRef
}

/** Grows the inspector to a pixel floor without taking its width over: the
 * researcher's own drag still wins, because the widening only runs on the
 * transition into a wide tab and only when the panel is currently narrower. */
function useMinimumPanelWidth(
  panelRef: React.RefObject<ImperativePanelHandle | null>,
  groupRef: React.RefObject<HTMLDivElement | null>,
  active: boolean,
  minimumPx: number
) {
  useEffect(() => {
    if (!active) return
    const panel = panelRef.current
    const group = groupRef.current
    if (!panel || !group || panel.isCollapsed()) return

    const groupWidth = group.clientWidth
    if (!groupWidth) return
    const currentPx = (panel.getSize() / 100) * groupWidth
    if (currentPx >= minimumPx) return

    panel.resize(Math.min(INSPECTOR_MEDIA_MAX_SIZE, (minimumPx / groupWidth) * 100))
  }, [active, minimumPx, groupRef, panelRef])
}

export interface WorkspaceLayoutProps {
  /** Distinguishes one archive's saved pane sizes from another's. */
  layoutKey: string
  explorerOpen: boolean
  editorOpen: boolean
  inspectorOpen: boolean
  /** The active inspector tab needs the wider layout (Media Notes). */
  inspectorWide?: boolean
  ribbon: ReactNode
  explorer: ReactNode
  inspector: ReactNode
  tabHeader: ReactNode
  statusBar: ReactNode
  splitState: SplitPaneState | null
  activeFilePath: string | null
  renderPane: (filePath: string | null, pane: 'first' | 'second') => ReactNode
}

/** The workspace as four regions: a fixed icon ribbon, then the explorer, the
 * editor, and the inspector as drag-resizable panels.
 *
 * Sizes persist per archive through `autoSaveId` (react-resizable-panels writes
 * them to localStorage), so reopening a vault restores the layout you left it
 * in without Studio hand-rolling its own persistence. */
export default function WorkspaceLayout({
  layoutKey,
  explorerOpen,
  editorOpen,
  inspectorOpen,
  inspectorWide = false,
  ribbon,
  explorer,
  inspector,
  tabHeader,
  statusBar,
  splitState,
  activeFilePath,
  renderPane,
}: WorkspaceLayoutProps) {
  const explorerRef = useCollapsiblePanel(explorerOpen)
  const inspectorRef = useCollapsiblePanel(inspectorOpen)
  const groupRef = useRef<HTMLDivElement>(null)
  useMinimumPanelWidth(inspectorRef, groupRef, inspectorWide && inspectorOpen, INSPECTOR_MEDIA_MIN_PX)

  const isSplit = Boolean(splitState?.secondPane)

  return (
    <div className="relative flex flex-1 overflow-hidden">
      {ribbon}

      {/* PanelGroup's own ref is its imperative handle, not a DOM node, so the
          pixel measurement the wide inspector needs comes from this wrapper. */}
      <div ref={groupRef} className="flex min-w-0 flex-1">
      <PanelGroup direction="horizontal" autoSaveId={`sa-studio-workspace:${layoutKey}`} className="flex-1">
        <Panel
          id="explorer"
          ref={explorerRef}
          order={1}
          defaultSize={EXPLORER_DEFAULT_SIZE}
          minSize={EXPLORER_MIN_SIZE}
          maxSize={EXPLORER_MAX_SIZE}
          collapsible
          collapsedSize={0}
          className="min-w-0 overflow-hidden"
        >
          <div className="flex h-full flex-col border-r border-ed-rule bg-ed-bg-secondary">{explorer}</div>
        </Panel>

        <ResizeHandle id="explorer-handle" inert={!explorerOpen} />

        {editorOpen && (
          <Panel id="editor" order={2} minSize={30} className="min-w-0">
            <div className="relative flex h-full flex-col bg-ed-bg">
              {tabHeader}

              <div className="relative flex-1 overflow-hidden">
                {isSplit ? (
                  <PanelGroup
                    direction={splitState?.direction === 'horizontal' ? 'vertical' : 'horizontal'}
                    autoSaveId={`sa-studio-split:${layoutKey}`}
                    className="h-full"
                  >
                    <Panel id="split-first" order={1} minSize={20} className="min-w-0 overflow-hidden">
                      {renderPane(splitState?.firstPane ?? activeFilePath, 'first')}
                    </Panel>
                    <ResizeHandle
                      id="split-handle"
                      direction={splitState?.direction === 'horizontal' ? 'vertical' : 'horizontal'}
                    />
                    <Panel id="split-second" order={2} minSize={20} className="min-w-0 overflow-hidden">
                      {renderPane(splitState?.secondPane ?? null, 'second')}
                    </Panel>
                  </PanelGroup>
                ) : (
                  <div className="h-full overflow-hidden">{renderPane(activeFilePath, 'first')}</div>
                )}
              </div>

              {statusBar}
            </div>
          </Panel>
        )}

        <ResizeHandle id="inspector-handle" inert={!editorOpen || !inspectorOpen} />

        <Panel
          id="inspector"
          ref={inspectorRef}
          order={3}
          defaultSize={INSPECTOR_DEFAULT_SIZE}
          minSize={INSPECTOR_MIN_SIZE}
          maxSize={inspectorWide ? INSPECTOR_MEDIA_MAX_SIZE : INSPECTOR_MAX_SIZE}
          collapsible
          collapsedSize={0}
          className="min-w-0 overflow-hidden"
        >
          <div className="flex h-full flex-col border-l border-ed-rule bg-ed-bg-secondary">{inspector}</div>
        </Panel>
      </PanelGroup>
      </div>
    </div>
  )
}
