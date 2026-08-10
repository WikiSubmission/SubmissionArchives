import { ChevronLeft, ChevronRight, X, Plus, FileText } from 'lucide-react'

export interface TabItem {
  path: string
  name: string
}

interface TabHeaderProps {
  tabs: TabItem[]
  activeFilePath: string | null
  archivePath: string
  onSelectTab: (path: string) => void
  onCloseTab: (path: string, e: React.MouseEvent) => void
  onNewTab: () => void
  canGoBack: boolean
  canGoForward: boolean
  onGoBack: () => void
  onGoForward: () => void
}

export default function TabHeader({
  tabs,
  activeFilePath,
  archivePath,
  onSelectTab,
  onCloseTab,
  onNewTab,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
}: TabHeaderProps) {
  // Extract relative breadcrumbs for active file
  const getBreadcrumbs = () => {
    if (!activeFilePath) return []
    let rel = activeFilePath
    if (activeFilePath.startsWith(archivePath)) {
      rel = activeFilePath.slice(archivePath.length).replace(/^[\\/]+/, '')
    }
    const parts = rel.split(/[\\/]/)
    return parts
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="flex flex-col border-b border-ed-rule bg-ed-surface/40 backdrop-blur-md shrink-0 select-none">
      {/* Top Tabs Bar */}
      <div className="flex items-center h-9 px-2 gap-1 overflow-x-auto no-scrollbar border-b border-white/[0.04]">
        {/* Navigation History Stack Controls */}
        <div className="flex items-center gap-0.5 shrink-0 pr-1.5 border-r border-white/[0.06]">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            title="Navigate Back"
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            title="Navigate Forward"
            className="p-1 rounded text-white/40 hover:text-white hover:bg-white/[0.06] disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Note Tabs List */}
        <div className="flex items-center gap-1 overflow-x-auto flex-1 no-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.path === activeFilePath
            return (
              <div
                key={tab.path}
                onClick={() => onSelectTab(tab.path)}
                className={`group relative flex items-center gap-2 h-7 px-2.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-150 max-w-[180px] shrink-0 border ${
                  isActive
                    ? 'bg-white/[0.08] text-white border-white/[0.12] shadow-elev-sm'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03] border-transparent'
                }`}
              >
                <FileText size={12} className={isActive ? 'text-amber-400' : 'text-white/30'} strokeWidth={1.5} />
                <span className="truncate flex-1 tracking-tight">{tab.name}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => onCloseTab(tab.path, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            )
          })}

          <button
            onClick={onNewTab}
            title="New Note"
            className="p-1 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-colors shrink-0"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Path Breadcrumbs Bar */}
      {breadcrumbs.length > 0 && (
        <div className="h-6 flex items-center px-4 gap-1.5 text-[11px] font-mono text-white/35 overflow-x-auto no-scrollbar">
          {breadcrumbs.map((part, index) => (
            <div key={index} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <span className="text-white/15">/</span>}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'text-white/70 font-semibold'
                    : 'hover:text-white/50 cursor-default'
                }
              >
                {part}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
