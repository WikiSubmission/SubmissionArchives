import { useEffect } from 'react'
import type { TypographySettings } from './useSettings'

/** The families Studio actually bundles, keyed by the role DESIGN.md gives
 * them: sans for interface chrome, Source Serif for display, Newsreader for
 * long-form body copy, JetBrains Mono for references, Amiri for Arabic. */
const STACKS = {
  'dm-sans': '"DM Sans", "Inter", system-ui, sans-serif',
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  newsreader: '"Newsreader", Georgia, serif',
  'source-serif': '"Source Serif 4", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
  amiri: '"Amiri", serif',
} as const

/** Applies the typography settings as runtime overrides of the font tokens.
 *
 * Tailwind compiles `font-sans` to `font-family: var(--font-sans)`, so setting
 * that variable on `<html>` re-points every existing utility rather than
 * needing a parallel set of classes per choice. `--ed-body-font` is Studio's
 * own token for long-form prose, which the archive assigns to Newsreader
 * rather than to the UI sans. */
export function useTypography({ uiFont, bodyFont, arabicFont }: TypographySettings) {
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--font-sans', STACKS[uiFont] ?? STACKS['dm-sans'])
    root.setProperty('--ed-body-font', STACKS[bodyFont] ?? STACKS.newsreader)
    root.setProperty('--font-arabic', STACKS[arabicFont] ?? STACKS.amiri)
  }, [arabicFont, bodyFont, uiFont])
}

export const TYPOGRAPHY_OPTIONS = {
  uiFont: [
    { value: 'dm-sans', label: 'DM Sans' },
    { value: 'system', label: 'System' },
  ],
  bodyFont: [
    { value: 'newsreader', label: 'Newsreader' },
    { value: 'source-serif', label: 'Source Serif' },
    { value: 'dm-sans', label: 'DM Sans' },
    { value: 'mono', label: 'JetBrains Mono' },
  ],
  arabicFont: [{ value: 'amiri', label: 'Amiri' }],
} as const
