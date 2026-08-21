import { useState } from 'react'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { scanArchive, type NoteRecord } from '../../lib/notes'
import { performSearch } from '../../lib/search'

interface SearchPaneProps {
  archivePath: string
  onOpenFile: (path: string) => void
}

interface SearchResult {
  note: NoteRecord
  snippet: string
}

const PRESET_OPERATORS = [
  { label: 'tag:sermon', query: 'tag:sermon ' },
  { label: 'tag:quran', query: 'tag:quran ' },
  { label: 'path:notes/', query: 'path:notes/ ' }
]

export default function SearchPane({ archivePath, onOpenFile }: SearchPaneProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const runSearch = (value: string) => {
    setQuery(value)
    const trimmed = value.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    setLoading(true)
    scanArchive(archivePath)
      .then((notes) => {
        const matches = performSearch(notes, trimmed)
        setResults(matches)
        setError(null)
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }

  const applyOperator = (op: string) => {
    runSearch(op)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 shrink-0 border-b border-ed-rule space-y-2">
        <div className="flex items-center gap-2 bg-ed-surface border border-ed-rule rounded-lg px-2.5 py-1.5 focus-within:border-ed-accent/50">
          <MagnifyingGlass size={16} weight="bold" className="text-ed-fg-secondary shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search notes (e.g. tag:sermon, path:notes/)..."
            className="w-full bg-transparent text-xs text-ed-fg outline-none placeholder:text-ed-fg-secondary font-medium"
          />
          {query && (
            <button
              onClick={() => runSearch('')}
              className="text-ed-fg-secondary hover:text-ed-fg text-xs p-0.5 rounded"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>

        {/* Search Operator Quick Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {PRESET_OPERATORS.map((op) => (
            <button
              key={op.label}
              onClick={() => applyOperator(op.query)}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-ed-surface border border-ed-rule text-ed-fg-secondary hover:text-ed-accent hover:border-ed-accent/35 transition-all shrink-0"
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="px-4 py-2 text-xs text-ed-danger font-mono">{error}</div>}

      {loading && (
        <div className="px-4 py-6 text-center text-xs text-ed-fg-secondary font-mono flex items-center justify-center gap-2">
          <span className="w-3.5 h-3.5 border-2 border-ed-rule border-t-ed-accent rounded-full animate-spin" />
          Searching...
        </div>
      )}

      {query.trim() && !loading && results.length === 0 && !error && (
        <div className="px-4 py-8 text-center text-xs text-ed-fg-secondary italic">
          No matches found for "{query}".
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {results.map(({ note, snippet }) => (
          <button
            key={note.path}
            onClick={() => onOpenFile(note.path)}
            className="w-full text-left px-4 py-2.5 hover:bg-ed-surface transition-colors border-b border-ed-rule/50 group"
          >
            <div className="text-xs text-ed-fg font-semibold truncate group-hover:text-ed-accent">
              {note.name}
            </div>
            <div className="text-[11px] text-ed-fg-secondary font-mono truncate mt-0.5">
              {snippet}
            </div>
            {note.tags.length > 0 && (
              <div className="flex items-center gap-1 mt-1">
                {note.tags.map((t) => (
                  <span key={t} className="text-[9px] font-mono text-ed-accent/80 bg-ed-accent-soft px-1 rounded">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
