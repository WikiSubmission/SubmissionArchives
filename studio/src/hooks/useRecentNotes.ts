import { useEffect, useState } from 'react'

export interface RecentEntry {
  path: string
  name: string
  openedAt: number
}

const MAX_RECENTS = 8

function storageKey(archivePath: string): string {
  return `sa-studio-recents:${archivePath}`
}

function load(archivePath: string): RecentEntry[] {
  try {
    const raw = localStorage.getItem(storageKey(archivePath))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useRecentNotes(archivePath: string) {
  const [recents, setRecents] = useState<RecentEntry[]>(() => load(archivePath))

  useEffect(() => {
    setRecents(load(archivePath))
  }, [archivePath])

  const recordOpen = (path: string) => {
    const name = (path.split(/[\\/]/).pop() ?? path).replace(/\.md$/, '')
    const next = [{ path, name, openedAt: Date.now() }, ...recents.filter((r) => r.path !== path)].slice(
      0,
      MAX_RECENTS,
    )
    setRecents(next)
    localStorage.setItem(storageKey(archivePath), JSON.stringify(next))
  }

  return { recents, recordOpen }
}
