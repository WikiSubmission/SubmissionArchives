import { useCallback, useEffect, useState } from 'react'

export type Appearance = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'sa-studio-appearance'

/** Which appearance the archive itself defaults to (`:root` in globals.css). */
const DEFAULT_APPEARANCE: Appearance = 'light'

function isAppearance(value: string | null): value is Appearance {
  return value === 'light' || value === 'dark' || value === 'system'
}

function readStored(): Appearance {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return isAppearance(raw) ? raw : DEFAULT_APPEARANCE
  } catch {
    return DEFAULT_APPEARANCE
  }
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function resolveAppearance(appearance: Appearance): 'light' | 'dark' {
  if (appearance === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return appearance
}

/** Owns the `data-theme` attribute on `<html>`, which is what every `--ed-*`
 * token and the `dark:` variant key off (see App.css).
 *
 * Unlike the rest of Studio's preferences this lives in `localStorage`, not in
 * `<archive>/.studio/settings.json` — appearance is a property of the screen
 * you are reading on, not of the vault, so it should not follow the archive
 * onto someone else's machine. */
export function useAppearance() {
  const [appearance, setAppearanceState] = useState<Appearance>(readStored)

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolveAppearance(appearance)
    }
    apply()

    if (appearance !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [appearance])

  const setAppearance = useCallback((next: Appearance) => {
    setAppearanceState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode / quota — the in-memory choice still applies this session */
    }
  }, [])

  const toggle = useCallback(() => {
    setAppearance(resolveAppearance(appearance) === 'dark' ? 'light' : 'dark')
  }, [appearance, setAppearance])

  return { appearance, resolved: resolveAppearance(appearance), setAppearance, toggle }
}
