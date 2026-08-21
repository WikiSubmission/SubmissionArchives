import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { safeInvoke as invoke } from '../lib/ipc'

export type QuranShowMode = 'both' | 'arabic' | 'translation'
export type QuranInsertStyle = 'block' | 'inline'

export interface TransliterationSettings {
  enabled: boolean
  autoExpandTerms: boolean
  diacriticModifiers: boolean
}

export type UiFont = 'dm-sans' | 'system'
export type BodyFont = 'newsreader' | 'source-serif' | 'dm-sans' | 'mono'
export type ArabicFont = 'amiri'

export interface TypographySettings {
  uiFont: UiFont
  bodyFont: BodyFont
  arabicFont: ArabicFont
}

/** Vaults written before the typography settings were wired up hold names for
 * fonts Studio never bundled. Map them onto what is actually available rather
 * than letting them resolve to nothing. */
const LEGACY_FONTS: Record<string, string> = {
  jakarta: 'dm-sans',
  serif: 'source-serif',
  mushaf: 'amiri',
  plex: 'amiri',
}
/* 'default' is deliberately absent: it meant "whatever the app picks", and the
   app now picks a different face per role. Letting it fall through to each
   field's own fallback preserves that meaning; mapping it to one family would
   freeze old vaults onto the UI sans for body prose. */

function migrateFont<T extends string>(value: string | undefined, allowed: readonly T[], fallback: T): T {
  if (value && (allowed as readonly string[]).includes(value)) return value as T
  const mapped = value ? LEGACY_FONTS[value] : undefined
  if (mapped && (allowed as readonly string[]).includes(mapped)) return mapped as T
  return fallback
}

export interface StudioSettings {
  quran: {
    showMode: QuranShowMode
    insertStyle: QuranInsertStyle
    arabicSize: number
    translationSize: number
  }
  transliteration: TransliterationSettings
  typography: TypographySettings
  shortcuts: Record<string, string>
  lastSeenVersion?: string
}

export const DEFAULT_SETTINGS: StudioSettings = {
  quran: { showMode: 'both', insertStyle: 'block', arabicSize: 26, translationSize: 17 },
  transliteration: {
    enabled: true,
    autoExpandTerms: true,
    diacriticModifiers: true,
  },
  typography: {
    uiFont: 'dm-sans',
    // Long-form prose is Newsreader in the archive; the UI sans stays for chrome.
    bodyFont: 'newsreader',
    arabicFont: 'amiri',
  },
  shortcuts: {},
  lastSeenVersion: '0.1.0',
}

function mergeSettings(partial: Partial<StudioSettings> | null | undefined): StudioSettings {
  return {
    quran: { ...DEFAULT_SETTINGS.quran, ...(partial?.quran ?? {}) },
    transliteration: { ...DEFAULT_SETTINGS.transliteration, ...(partial?.transliteration ?? {}) },
    typography: {
      uiFont: migrateFont(partial?.typography?.uiFont, ['dm-sans', 'system'] as const, 'dm-sans'),
      bodyFont: migrateFont(
        partial?.typography?.bodyFont,
        ['newsreader', 'source-serif', 'dm-sans', 'mono'] as const,
        'newsreader'
      ),
      arabicFont: migrateFont(partial?.typography?.arabicFont, ['amiri'] as const, 'amiri'),
    },
    shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...(partial?.shortcuts ?? {}) },
    lastSeenVersion: partial?.lastSeenVersion ?? DEFAULT_SETTINGS.lastSeenVersion,
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
