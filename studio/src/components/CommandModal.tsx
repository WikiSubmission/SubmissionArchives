import { useMemo, useState, type KeyboardEvent } from 'react'
import { ArrowUp, ArrowDown, CornerDownLeft } from 'lucide-react'

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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(107, 52, 16, 0.08) 0%, transparent 60%)',
        }}
      />

      <div
        className="relative w-full max-w-[560px] glass-strong border border-ed-rule rounded-xl shadow-elev-xl overflow-hidden animate-slide-up-fade"
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
            className="w-full bg-transparent px-4 py-3.5 text-sm text-white/90 outline-none placeholder:text-white/20 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20 hover:text-white/50 bg-white/[0.04] hover:bg-white/[0.08] px-1.5 py-0.5 rounded transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <div className="text-sm text-white/25">{emptyMessage}</div>
            </div>
          )}

          {Object.entries(grouped).map(([category, groupItems]) => {
            if (groupItems.length === 0) return null
            const showHeader = getCategory && category

            return (
              <div key={category}>
                {showHeader && (
                  <div className="px-4 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/20">
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
                          ? 'bg-white/[0.06] text-white'
                          : 'text-white/60 hover:text-white/80'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r-full bg-white/60" />
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
        <div className="flex items-center justify-between px-4 py-2 border-t border-ed-rule bg-black/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-white/20">
              <span className="flex items-center justify-center w-4 h-4 rounded bg-white/[0.06] border border-white/[0.06]">
                <ArrowUp size={9} strokeWidth={2} />
              </span>
              <span className="flex items-center justify-center w-4 h-4 rounded bg-white/[0.06] border border-white/[0.06]">
                <ArrowDown size={9} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-medium ml-0.5">Navigate</span>
            </div>
            <div className="flex items-center gap-1 text-white/20">
              <span className="flex items-center justify-center w-4 h-4 rounded bg-white/[0.06] border border-white/[0.06]">
                <CornerDownLeft size={9} strokeWidth={2} />
              </span>
              <span className="text-[10px] font-medium ml-0.5">Select</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-white/20">
            <span className="flex items-center justify-center h-4 px-1 rounded bg-white/[0.06] border border-white/[0.06] text-[8px] font-mono font-bold">
              ESC
            </span>
            <span className="text-[10px] font-medium ml-0.5">Close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
