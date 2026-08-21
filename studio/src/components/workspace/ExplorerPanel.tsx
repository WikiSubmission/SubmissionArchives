import { Folder, Tag, MagnifyingGlass, Trash } from '@phosphor-icons/react'
import ArchiveExplorer from '../archive/ArchiveExplorer'
import TagsPane from '../archive/TagsPane'
import SearchPane from '../archive/SearchPane'
import TrashPane from '../archive/TrashPane'
import { motion, springConfig } from '../ui/Motion'

export type SidebarTab = 'files' | 'tags' | 'search' | 'trash'

export const SIDEBAR_TABS: SidebarTab[] = ['files', 'tags', 'search', 'trash']

const TAB_CONFIG: Record<SidebarTab, { label: string; icon: React.ElementType }> = {
  files: { label: 'Files', icon: Folder },
  tags: { label: 'Tags', icon: Tag },
  search: { label: 'Search', icon: MagnifyingGlass },
  trash: { label: 'Trash', icon: Trash },
}

interface ExplorerPanelProps {
  archivePath: string
  activeFilePath: string | null
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
  onOpenFile: (path: string) => void
  onNewNote: () => void
  onTrash: (path: string) => void
  refreshToken: number
}

export default function ExplorerPanel({
  archivePath,
  activeFilePath,
  activeTab,
  onTabChange,
  onOpenFile,
  onNewNote,
  onTrash,
  refreshToken,
}: ExplorerPanelProps) {
  return (
    <>
      {/* Segmented Top Tab Switcher */}
      <div className="p-2 shrink-0 border-b border-ed-rule bg-ed-bg-secondary/70 backdrop-blur-sm" role="tablist">
        <div className="flex items-center p-0.5 rounded-[7px] bg-ed-surface border border-ed-rule">
          {SIDEBAR_TABS.map((tab) => {
            const { label, icon: Icon } = TAB_CONFIG[tab]
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab)}
                className={`relative flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[5px] text-[11px] font-semibold tracking-wide transition-all duration-150 ${
                  isActive
                    ? 'text-ed-fg font-medium shadow-sm'
                    : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarTabPill"
                    className="absolute inset-0 rounded-[5px] bg-ed-surface-raised border border-ed-rule-strong shadow-xs"
                    transition={springConfig}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <Icon size={13} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-ed-accent' : ''} />
                  <span>{label}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'files' && (
          <ArchiveExplorer
            archivePath={archivePath}
            activeFilePath={activeFilePath}
            onOpenFile={onOpenFile}
            onNewNote={onNewNote}
            onTrash={onTrash}
            refreshToken={refreshToken}
          />
        )}
        {activeTab === 'tags' && (
          <TagsPane archivePath={archivePath} onOpenFile={onOpenFile} refreshToken={refreshToken} />
        )}
        {activeTab === 'search' && <SearchPane archivePath={archivePath} onOpenFile={onOpenFile} />}
        {activeTab === 'trash' && (
          <TrashPane archivePath={archivePath} onRestore={onOpenFile} refreshToken={refreshToken} />
        )}
      </div>
    </>
  )
}
