import { CaretLeft, CaretRight, X, Plus, FileText } from '@phosphor-icons/react'
import { motion, springConfig } from './ui/Motion'

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
      <div className="flex items-center h-9 px-2 gap-1 overflow-x-auto no-scrollbar border-b border-ed-rule/40">
        {/* Navigation History Stack Controls */}
        <div className="flex items-center gap-0.5 shrink-0 pr-1.5 border-r border-ed-rule/60">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            title="Navigate Back"
            aria-label="Navigate Back"
            className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            title="Navigate Forward"
            aria-label="Navigate Forward"
            className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface disabled:opacity-20 disabled:hover:bg-transparent transition-all"
          >
            <CaretRight size={14} weight="bold" />
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
                    ? 'bg-ed-surface-strong text-ed-fg border-ed-rule shadow-elev-sm'
                    : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface border-transparent'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-md border border-amber-500/30 pointer-events-none"
                    transition={springConfig}
                  />
                )}
                <FileText size={14} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-amber-400' : 'text-ed-fg-muted'} />
                <span className="truncate flex-1 tracking-tight">{tab.name}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => onCloseTab(tab.path, e)}
                    aria-label="Close tab"
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-ed-surface-strong text-ed-fg-muted hover:text-ed-fg transition-all"
                  >
                    <X size={12} weight="bold" />
                  </button>
                )}
              </div>
            )
          })}

          <button
            onClick={onNewTab}
            title="New Note (Ctrl+N)"
            aria-label="New Note"
            className="p-1 rounded-md text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors shrink-0"
          >
            <Plus size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Path Breadcrumbs Bar */}
      {breadcrumbs.length > 0 && (
        <div className="h-6 flex items-center px-4 gap-1.5 text-[11px] font-mono text-ed-fg-muted overflow-x-auto no-scrollbar">
          {breadcrumbs.map((part, index) => (
            <div key={index} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <span className="text-ed-rule-strong">/</span>}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? 'text-ed-fg font-semibold'
                    : 'hover:text-ed-fg cursor-default'
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
