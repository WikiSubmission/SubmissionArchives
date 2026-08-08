import { useState } from 'react'
import { Search } from 'lucide-react'
import { scanArchive, type NoteRecord } from '../../lib/notes'

interface SearchPaneProps {
  archivePath: string
  onOpenFile: (path: string) => void
}

interface SearchResult {
  note: NoteRecord
  snippet: string
}

interface ParsedQuery {
  phrases: string[]
  words: string[]
}

/** Unquoted terms match as an AND of individual words (any order); a
 * "quoted phrase" must appear verbatim, exactly like Maktabook's search. */
function parseQuery(raw: string): ParsedQuery {
  const phrases: string[] = []
  const remainder = raw.replace(/"([^"]+)"/g, (_, phrase: string) => {
    phrases.push(phrase.toLowerCase())
    return ' '
  })
  const words = remainder
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .filter(Boolean)
  return { phrases, words }
}

function matchesQuery(content: string, query: ParsedQuery): boolean {
  const lower = content.toLowerCase()
  return query.phrases.every((p) => lower.includes(p)) && query.words.every((w) => lower.includes(w))
}

function snippetAround(content: string, term: string): string {
  const index = term ? content.toLowerCase().indexOf(term.toLowerCase()) : -1
  if (index === -1) return content.slice(0, 80).trim()

  const start = Math.max(0, index - 30)
  const end = Math.min(content.length, index + term.length + 30)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < content.length ? '…' : ''
  return `${prefix}${content.slice(start, end).trim()}${suffix}`
}

export default function SearchPane({ archivePath, onOpenFile }: SearchPaneProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const runSearch = (value: string) => {
    setQuery(value)
    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setResults([])
      return
    }

    const parsed = parseQuery(trimmed)
    const snippetTerm = parsed.phrases[0] ?? parsed.words[0] ?? ''

    scanArchive(archivePath)
      .then((notes) => {
        const matches = notes
          .filter((note) => matchesQuery(note.content, parsed))
          .map((note) => ({ note, snippet: snippetAround(note.content, snippetTerm) }))
        setResults(matches)
        setError(null)
      })
      .catch((err) => setError(String(err)))
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-ed-rule rounded-md px-2.5 py-1.5">
          <Search size={13} className="text-white/30 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/25"
          />
        </div>
      </div>

      {error && <div className="px-4 pb-2 text-xs text-red-400 font-mono">{error}</div>}
      {query.trim().length >= 2 && results.length === 0 && !error && (
        <div className="px-4 text-xs text-white/30">No matches.</div>
      )}

      <div className="flex-1 overflow-y-auto">
        {results.map(({ note, snippet }) => (
          <button
            key={note.path}
            onClick={() => onOpenFile(note.path)}
            className="w-full text-left px-4 py-2 hover:bg-white/5 transition-colors border-b border-ed-rule/50"
          >
            <div className="text-sm text-white/80 truncate">{note.name}</div>
            <div className="text-xs text-white/35 font-mono truncate mt-0.5">{snippet}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
