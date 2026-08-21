import {
  FolderOpen,
  MagnifyingGlass,
  MagnifyingGlassPlus,
  Command,
  ShareNetwork,
  Gear,
  SidebarSimple,
  FilePlus,
  TreeStructure
} from '@phosphor-icons/react'
import { motion, springSnappy } from './ui/Motion'

interface LeftRibbonProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onOpenSearch: () => void
  onOpenQuickSwitcher: () => void
  onOpenCommandPalette: () => void
  onOpenGraph: () => void
  onOpenCanvas?: () => void
  onOpenSettings: () => void
  inspectorOpen: boolean
  onToggleInspector: () => void
  onNewNote: () => void
}

export default function LeftRibbon({
  sidebarOpen,
  onToggleSidebar,
  onOpenSearch,
  onOpenQuickSwitcher,
  onOpenCommandPalette,
  onOpenGraph,
  onOpenCanvas,
  onOpenSettings,
  inspectorOpen,
  onToggleInspector,
  onNewNote
}: LeftRibbonProps) {
  return (
    <aside className="z-40 flex w-11 shrink-0 select-none flex-col items-center justify-between border-r border-ed-rule bg-ed-bg-secondary py-2.5">
      {/* Top Actions */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
          title={sidebarOpen ? 'Collapse Explorer (Ctrl+B)' : 'Expand Explorer (Ctrl+B)'}
          className={`tactile p-2 rounded-lg transition-colors ${
            sidebarOpen
              ? 'text-ed-fg bg-ed-surface-strong'
              : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
          }`}
        >
          <FolderOpen size={18} weight={sidebarOpen ? 'fill' : 'regular'} />
        </motion.button>

        {onOpenCanvas && (
          <motion.button
            whileHover={{ scale: 1.05, y: -1 }}
            whileTap={{ scale: 0.92 }}
            transition={springSnappy}
            onClick={onOpenCanvas}
            aria-label="Whiteboard Canvas"
            title="Visual Synthesis Canvas"
            className="tactile p-2 rounded-lg text-ed-fg-muted hover:text-ed-accent hover:bg-ed-accent-soft transition-colors"
          >
            <TreeStructure size={18} weight="regular" />
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onNewNote}
          aria-label="New Note"
          title="New Note (Ctrl+N)"
          className="tactile p-2 rounded-lg text-ed-fg-muted hover:text-ed-accent hover:bg-ed-accent-soft transition-colors"
        >
          <FilePlus size={18} weight="bold" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onOpenQuickSwitcher}
          aria-label="Quick Switcher"
          title="Quick Switcher (Ctrl+O)"
          className="tactile p-2 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
        >
          <MagnifyingGlassPlus size={18} weight="regular" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onOpenSearch}
          aria-label="Search Vault"
          title="Search Vault"
          className="tactile p-2 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
        >
          <MagnifyingGlass size={18} weight="regular" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onOpenCommandPalette}
          aria-label="Command Palette"
          title="Command Palette (Ctrl+P)"
          className="tactile p-2 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
        >
          <Command size={18} weight="regular" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onOpenGraph}
          aria-label="Graph View"
          title="Open Graph View"
          className="tactile p-2 rounded-lg text-ed-fg-muted hover:text-ed-accent hover:bg-ed-accent-soft transition-colors"
        >
          <ShareNetwork size={18} weight="regular" />
        </motion.button>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onToggleInspector}
          aria-label="Toggle Inspector"
          title={inspectorOpen ? 'Collapse Inspector' : 'Expand Inspector (Outline & Backlinks)'}
          className={`tactile p-2 rounded-lg transition-colors ${
            inspectorOpen
              ? 'text-ed-accent bg-ed-accent-soft'
              : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
          }`}
        >
          <SidebarSimple size={18} weight={inspectorOpen ? 'fill' : 'regular'} className="rotate-180" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={onOpenSettings}
          aria-label="Vault Settings"
          title="Vault Settings"
          className="tactile p-2 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
        >
          <Gear size={18} weight="regular" />
        </motion.button>
      </div>
    </aside>
  )
}
