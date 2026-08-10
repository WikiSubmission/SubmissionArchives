import {
  FolderTree,
  Search,
  FileSearch,
  Command,
  Network,
  Settings,
  PanelRight,
  SquarePlus
} from 'lucide-react'

interface LeftRibbonProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onOpenSearch: () => void
  onOpenQuickSwitcher: () => void
  onOpenCommandPalette: () => void
  onOpenGraph: () => void
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
  onOpenSettings,
  inspectorOpen,
  onToggleInspector,
  onNewNote
}: LeftRibbonProps) {
  return (
    <aside className="w-[44px] shrink-0 border-r border-ed-rule bg-ed-bg/90 flex flex-col items-center justify-between py-2.5 z-40 select-none">
      {/* Top Actions */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        <button
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Collapse Explorer (Ctrl+B)' : 'Expand Explorer (Ctrl+B)'}
          className={`tactile p-2 rounded-lg transition-all duration-150 ${
            sidebarOpen
              ? 'text-white/90 bg-white/[0.08]'
              : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
          }`}
        >
          <FolderTree size={17} strokeWidth={1.5} />
        </button>

        <button
          onClick={onNewNote}
          title="New Note"
          className="tactile p-2 rounded-lg text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all duration-150"
        >
          <SquarePlus size={17} strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenQuickSwitcher}
          title="Quick Switcher (Ctrl+O)"
          className="tactile p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-150"
        >
          <FileSearch size={17} strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenSearch}
          title="Search Vault"
          className="tactile p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-150"
        >
          <Search size={17} strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenCommandPalette}
          title="Command Palette (Ctrl+P)"
          className="tactile p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-150"
        >
          <Command size={17} strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenGraph}
          title="Open Graph View"
          className="tactile p-2 rounded-lg text-white/40 hover:text-sky-400 hover:bg-sky-500/10 transition-all duration-150"
        >
          <Network size={17} strokeWidth={1.5} />
        </button>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-1.5 w-full px-1">
        <button
          onClick={onToggleInspector}
          title={inspectorOpen ? 'Collapse Inspector' : 'Expand Inspector (Outline & Backlinks)'}
          className={`tactile p-2 rounded-lg transition-all duration-150 ${
            inspectorOpen
              ? 'text-amber-400 bg-amber-500/10'
              : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]'
          }`}
        >
          <PanelRight size={17} strokeWidth={1.5} />
        </button>

        <button
          onClick={onOpenSettings}
          title="Vault Settings"
          className="tactile p-2 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-150"
        >
          <Settings size={17} strokeWidth={1.5} />
        </button>
      </div>
    </aside>
  )
}
