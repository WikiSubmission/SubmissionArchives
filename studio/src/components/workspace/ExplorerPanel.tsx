import ArchiveExplorer from '../archive/ArchiveExplorer'
import TagsPane from '../archive/TagsPane'
import SearchPane from '../archive/SearchPane'
import TrashPane from '../archive/TrashPane'
import { motion, springConfig } from '../ui/Motion'

export type SidebarTab = 'files' | 'tags' | 'search' | 'trash'

export const SIDEBAR_TABS: SidebarTab[] = ['files', 'tags', 'search', 'trash']

const TAB_LABELS: Record<SidebarTab, string> = {
  files: 'Files',
  tags: 'Tags',
  search: 'Search',
  trash: 'Trash',
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
      <div className="flex shrink-0 border-b border-ed-rule" role="tablist">
        {SIDEBAR_TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            onClick={() => onTabChange(tab)}
            className={`relative flex-1 py-2 text-label uppercase transition-colors ${
              activeTab === tab ? 'text-ed-fg' : 'text-ed-fg-secondary hover:text-ed-fg'
            }`}
          >
            {activeTab === tab && (
              <motion.span
                layoutId="activeSidebarTabIndicator"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-ed-accent"
                transition={springConfig}
              />
            )}
            {TAB_LABELS[tab]}
          </button>
        ))}
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
