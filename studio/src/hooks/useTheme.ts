import { useEffect } from 'react'
import { safeInvoke as invoke } from '../lib/ipc'

const STYLE_ID = 'sa-studio-user-theme'

/** Loads an optional `.studio/theme.css` from the archive root and injects it,
 * letting users override the `--ed-*` tokens without a full plugin/theme system. */
export function useTheme(archivePath: string | null) {
  useEffect(() => {
    if (!archivePath) return

    let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = STYLE_ID
      document.head.appendChild(styleEl)
    }

    invoke<string | null>('read_theme_css', { archiveRoot: archivePath })
      .then((css) => {
        if (styleEl) styleEl.textContent = css ?? ''
      })
      .catch(() => {
        if (styleEl) styleEl.textContent = ''
      })
  }, [archivePath])
}
