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

export function performSearch(notes: NoteRecord[], rawQuery: string) {
  const operator = parseSearchQuery(rawQuery)

  let filtered = notes

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

  const fuse = createSearchIndex(filtered)
  const results = fuse.search(operator.query)

  return results.map((r: { item: NoteRecord; matches?: ReadonlyArray<{ indices: ReadonlyArray<[number, number]> }> }) => {
    const match = r.matches?.[0]
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
