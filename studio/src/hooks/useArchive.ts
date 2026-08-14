import { useCallback, useState } from 'react'

const STORAGE_KEY = 'sa-studio-archive-path'
const RECENT_KEY = 'sa-studio-recent-archives'

export function useArchive() {
  const [archivePath, setArchivePathState] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
    return null
  })

  const [recentArchives, setRecentArchives] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const setArchivePath = useCallback((path: string | null) => {
    if (path) {
      localStorage.setItem(STORAGE_KEY, path)
      setRecentArchives((prev) => {
        const next = [path, ...prev.filter((p) => p !== path)].slice(0, 5)
        localStorage.setItem(RECENT_KEY, JSON.stringify(next))
        return next
      })
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setArchivePathState(path)
  }, [])

  return { archivePath, setArchivePath, recentArchives }
}
