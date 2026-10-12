import Fuse from 'fuse.js'
import type { NoteRecord } from './notes'

export interface SearchOperator {
  tag?: string
  path?: string
  before?: string
  after?: string
  query: string
}

export function parseSearchQuery(raw: string): SearchOperator {
  let tag: string | undefined
  let path: string | undefined
  let before: string | undefined
  let after: string | undefined

  let cleaned = raw

  // Extract operators
  cleaned = cleaned.replace(/tag:(\S+)/g, (_, val) => {
    tag = val
    return ''
  })

  cleaned = cleaned.replace(/path:(\S+)/g, (_, val) => {
    path = val
    return ''
  })

  cleaned = cleaned.replace(/before:(\S+)/g, (_, val) => {
    before = val
    return ''
  })

  cleaned = cleaned.replace(/after:(\S+)/g, (_, val) => {
    after = val
    return ''
  })

  return {
    tag,
    path,
    before,
    after,
    query: cleaned.trim()
  }
}

export function createSearchIndex(notes: NoteRecord[]) {
  return new Fuse(notes, {
    keys: [
      { name: 'name', weight: 0.5 },
      { name: 'content', weight: 0.4 },
      { name: 'tags', weight: 0.1 }
    ],
    threshold: 0.3,
    includeMatches: true,
    ignoreLocation: true
  })
}

const indices = new WeakMap<NoteRecord[], ReturnType<typeof createSearchIndex>>()
function dateBoundary(value: string | undefined): number | undefined {
  if (!value) return undefined
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Use YYYY-MM-DD for file modification date filters.')
  const time = Date.parse(value + 'T00:00:00Z')
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) throw new Error('Invalid date filter.')
  return time
}
export function performSearch(notes: NoteRecord[], rawQuery: string) {
  const operator = parseSearchQuery(rawQuery)

  const before = dateBoundary(operator.before)
  const after = dateBoundary(operator.after)
  let filtered = notes.filter(n => (before === undefined || (n.modifiedMs !== undefined && n.modifiedMs < before)) && (after === undefined || (n.modifiedMs !== undefined && n.modifiedMs >= after + 86400000)))

  if (operator.tag) {
    const t = operator.tag.toLowerCase()
    filtered = filtered.filter((n) => n.tags.some((tag) => tag.toLowerCase().includes(t)))
  }

  if (operator.path) {
    const p = operator.path.toLowerCase()
    filtered = filtered.filter((n) => n.path.toLowerCase().includes(p))
  }

  if (!operator.query) {
    return filtered.map((n) => ({
      note: n,
      snippet: n.content.slice(0, 90) + '...'
    }))
  }

  let fuse = indices.get(notes)
  if (!fuse) { fuse = createSearchIndex(notes); indices.set(notes, fuse) }
  const allowed = new Set(filtered.map(n => n.path))
  const results = fuse.search(operator.query).filter(r => allowed.has(r.item.path))

  return results.map((r: { item: NoteRecord; matches?: ReadonlyArray<{ key?: string; indices: ReadonlyArray<[number, number]> }> }) => {
    const match = r.matches?.find(m => m.key === 'content')
    let snippet = r.item.content.slice(0, 90)
    if (match && match.indices.length > 0) {
      const [start, end] = match.indices[0]
      const min = Math.max(0, start - 30)
      const max = Math.min(r.item.content.length, end + 30)
      snippet = (min > 0 ? '...' : '') + r.item.content.slice(min, max) + (max < r.item.content.length ? '...' : '')
    }

    return {
      note: r.item,
      snippet
    }
  })
}
