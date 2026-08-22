import { useMemo, useState, type KeyboardEvent } from 'react'
import { ArrowUp, ArrowDown, ArrowElbowDownLeft } from '@phosphor-icons/react'
import { motion, springConfig } from './ui/Motion'

interface CommandModalProps<T> {
  items: T[]
  getKey: (item: T) => string
  getLabel: (item: T) => string
  filterText?: (item: T) => string
  getCategory?: (item: T) => string | undefined
  onSelect: (item: T) => void
  onClose: () => void
  placeholder: string
  emptyMessage: string
}

export default function CommandModal<T>({
  items,
  getKey,
  getLabel,
  filterText,
  getCategory,
  onSelect,
  onClose,
  placeholder,
  emptyMessage,
}: CommandModalProps<T>) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => (filterText ? filterText(item) : getLabel(item)).toLowerCase().includes(q))
  }, [items, query, filterText, getLabel])

  const grouped = useMemo(() => {
    if (!getCategory) return { '': filtered }
    const groups: Record<string, T[]> = {}
    filtered.forEach((item) => {
      const cat = getCategory(item) || 'Actions'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    })
    return groups
  }, [filtered, getCategory])

  const [prevQuery, setPrevQuery] = useState(query)
  if (query !== prevQuery) {
    setPrevQuery(query)
    setSelectedIndex(0)
  }

  const flatIndexToItem = (flatIdx: number): { item: T; globalIndex: number } | null => {
    let count = 0
    for (const cat of Object.keys(grouped)) {
      const groupItems = grouped[cat]
      if (flatIdx < count + groupItems.length) {
        return { item: groupItems[flatIdx - count], globalIndex: flatIdx }
      }
      count += groupItems.length
    }
    return null
  }

  const selectAt = (index: number) => {
    const found = flatIndexToItem(index)
    if (found) {
      onClose()
      onSelect(found.item)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectAt(selectedIndex)
    }
  }

  let globalIdx = 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
    >
      {/* Backdrop with radial glow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ed-scrim backdrop-blur-sm"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(107, 52, 16, 0.08) 0%, transparent 60%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98, y: -4 }}
        transition={springConfig}
        className="relative w-full max-w-[560px] glass-strong border border-ed-rule rounded-xl shadow-ed-lg overflow-hidden z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="relative border-b border-ed-rule">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent px-4 py-3.5 text-sm text-ed-fg outline-none placeholder:text-ed-fg-secondary font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ed-fg-secondary hover:text-ed-fg bg-ed-surface hover:bg-ed-surface-strong px-1.5 py-0.5 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-sm text-ed-fg-secondary">{emptyMessage}</div>
            </div>
          )}

          {Object.entries(grouped).map(([category, groupItems]) => {
            if (groupItems.length === 0) return null
            const showHeader = getCategory && category

            return (
              <div key={category}>
                {showHeader && (
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ed-fg-secondary">
                    {category}
                  </div>
                )}
                {groupItems.map((item) => {
                  const isSelected = globalIdx === selectedIndex
                  const currentGlobalIdx = globalIdx
                  globalIdx++

                  return (
                    <button
                      key={getKey(item)}
                      onClick={() => selectAt(currentGlobalIdx)}
                      onMouseEnter={() => setSelectedIndex(currentGlobalIdx)}
                      className={`w-full text-left px-4 py-2 text-sm transition-all duration-100 relative group ${
                        isSelected
                          ? 'bg-ed-surface-strong text-ed-fg'
                          : 'text-ed-fg-secondary hover:text-ed-fg'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-ed-accent" />
                      )}
                      <span className="relative z-10 font-medium tracking-tight">{getLabel(item)}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* Keyboard Hint Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-ed-rule bg-ed-surface/50 text-ed-fg-secondary">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="flex items-center justify-center w-4 h-4 rounded bg-ed-surface border border-ed-rule">
                <ArrowUp size={10} weight="bold" />
              </span>
              <span className="flex items-center justify-center w-4 h-4 rounded bg-ed-surface border border-ed-rule">
                <ArrowDown size={10} weight="bold" />
              </span>
              <span className="text-[10px] font-medium ml-0.5">Navigate</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="flex items-center justify-center w-4 h-4 rounded bg-ed-surface border border-ed-rule">
                <ArrowElbowDownLeft size={10} weight="bold" />
              </span>
              <span className="text-[10px] font-medium ml-0.5">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="flex items-center justify-center h-4 px-1 rounded bg-ed-surface border border-ed-rule text-[8px] font-mono font-bold">
              ESC
            </span>
            <span className="text-[10px] font-medium ml-0.5">Close</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
