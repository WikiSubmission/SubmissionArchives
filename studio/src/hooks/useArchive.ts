import { useCallback, useState } from 'react'

const STORAGE_KEY = 'sa-studio-archive-path'

export function useArchive() {
  const [archivePath, setArchivePathState] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  )

  const setArchivePath = useCallback((path: string | null) => {
    if (path) {
      localStorage.setItem(STORAGE_KEY, path)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
    setArchivePathState(path)
  }, [])

  return { archivePath, setArchivePath }
}
