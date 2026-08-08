import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { invoke } from '@tauri-apps/api/core'

export type QuranShowMode = 'both' | 'arabic' | 'translation'
export type QuranInsertStyle = 'block' | 'inline'

export interface StudioSettings {
  quran: {
    showMode: QuranShowMode
    insertStyle: QuranInsertStyle
    arabicSize: number
    translationSize: number
  }
}

export const DEFAULT_SETTINGS: StudioSettings = {
  quran: { showMode: 'both', insertStyle: 'block', arabicSize: 26, translationSize: 17 },
}

function mergeSettings(partial: Partial<StudioSettings> | null | undefined): StudioSettings {
  return {
    quran: { ...DEFAULT_SETTINGS.quran, ...(partial?.quran ?? {}) },
  }
}

interface SettingsContextValue {
  settings: StudioSettings
  updateSettings: (updater: (current: StudioSettings) => StudioSettings) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
})

interface SettingsProviderProps {
  archivePath: string | null
  children: ReactNode
}

/** Settings live at `<archive>/.studio/settings.json` — same convention as
 * theme.css, trash, and history — so they travel with the vault rather than
 * being tied to one machine's localStorage. */
export function SettingsProvider({ archivePath, children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<StudioSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (!archivePath) {
      setSettings(DEFAULT_SETTINGS)
      return
    }
    invoke<string | null>('read_settings', { archiveRoot: archivePath })
      .then((raw) => setSettings(mergeSettings(raw ? JSON.parse(raw) : null)))
      .catch(() => setSettings(DEFAULT_SETTINGS))
  }, [archivePath])

  const updateSettings = (updater: (current: StudioSettings) => StudioSettings) => {
    setSettings((current) => {
      const next = updater(current)
      if (archivePath) {
        invoke('write_settings', { archiveRoot: archivePath, json: JSON.stringify(next) }).catch(() => {})
      }
      return next
    })
  }

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}
