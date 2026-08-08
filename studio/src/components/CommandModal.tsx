import { useEffect, useMemo, useState, type KeyboardEvent } from 'react'

interface CommandModalProps<T> {
  items: T[]
  getKey: (item: T) => string
  getLabel: (item: T) => string
  filterText?: (item: T) => string
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

  useEffect(() => setSelectedIndex(0), [query])

  const selectAt = (index: number) => {
    const item = filtered[index]
    if (item) {
      onClose()
      onSelect(item)
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-32 z-50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[#1c1c1f] border border-ed-rule rounded-lg shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent px-4 py-3 text-sm text-white/90 outline-none border-b border-ed-rule placeholder:text-white/25"
        />
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && <div className="px-4 py-3 text-sm text-white/30">{emptyMessage}</div>}
          {filtered.map((item, index) => (
            <button
              key={getKey(item)}
              onClick={() => selectAt(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                index === selectedIndex ? 'bg-ed-accent/10 text-white' : 'text-white/70'
              }`}
            >
              {getLabel(item)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
