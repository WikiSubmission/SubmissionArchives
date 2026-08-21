import { useEffect, useRef, useState } from 'react'
import { Columns, FolderOpen, NotePencil, SidebarSimple } from '@phosphor-icons/react'
import { AnimatePresence, motion, springSnappy } from '../ui/Motion'

export interface PaneVisibility {
  explorer: boolean
  editor: boolean
  inspector: boolean
}

interface PaneSwitcherProps {
  visibility: PaneVisibility
  onChange: (pane: keyof PaneVisibility, visible: boolean) => void
}

const PANES: { key: keyof PaneVisibility; label: string; hint: string; icon: typeof FolderOpen }[] = [
  { key: 'explorer', label: 'Explorer', hint: 'Ctrl+B', icon: FolderOpen },
  { key: 'editor', label: 'Editor', hint: 'Ctrl+\\', icon: NotePencil },
  { key: 'inspector', label: 'Inspector', hint: 'Ctrl+I', icon: SidebarSimple },
]

/** Which panes of the workspace are on screen, in one control.
 *
 * Prism keeps this in the sidebar footer, where it disappears the moment the
 * sidebar itself is collapsed. Studio puts it in the title bar so it stays
 * reachable no matter which panes are currently hidden. */
export default function PaneSwitcher({ visibility, onChange }: PaneSwitcherProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        title="Layout"
        aria-label="Layout"
        aria-expanded={open}
        className={`tactile rounded-sm p-1.5 ${
          open ? 'bg-ed-surface-strong text-ed-fg' : 'text-ed-fg-secondary hover:bg-ed-surface hover:text-ed-fg'
        }`}
      >
        <Columns size={16} weight="regular" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={springSnappy}
            className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-ed-rule bg-ed-surface-raised p-1 shadow-ed-lg"
          >
            <div className="px-2 py-1.5 text-caption font-medium uppercase tracking-wider text-ed-fg-secondary">
              Panes
            </div>
            {PANES.map(({ key, label, hint, icon: Icon }) => {
              const checked = visibility[key]
              return (
                <button
                  key={key}
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  onClick={() => onChange(key, !checked)}
                  className="flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left transition-colors hover:bg-ed-surface"
                >
                  <Icon
                    size={15}
                    weight={checked ? 'fill' : 'regular'}
                    className={checked ? 'shrink-0 text-ed-accent' : 'shrink-0 text-ed-fg-secondary'}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-ed-fg">{label}</span>
                  <span className="font-mono text-[10px] text-ed-fg-secondary">{hint}</span>
                  <span
                    className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${
                      checked ? 'bg-ed-accent' : 'bg-ed-rule-strong'
                    }`}
                  >
                    <motion.span
                      layout
                      transition={springSnappy}
                      className="absolute top-0.5 size-3 rounded-full bg-ed-surface-raised"
                      style={{ left: checked ? 14 : 2 }}
                    />
                  </span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
