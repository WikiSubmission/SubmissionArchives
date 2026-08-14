import { useEffect } from 'react'
import { SYSTEM_COMMANDS, getDefaultShortcut, normalizeKeyboardEvent } from '../lib/shortcuts'
import { useSettings } from './useSettings'

export interface ShortcutActionMap {
  [commandId: string]: () => void
}

export function useShortcuts(actions: ShortcutActionMap) {
  const { settings } = useSettings()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.closest('.ProseMirror'))

      const keyCombo = normalizeKeyboardEvent(e)
      if (!keyCombo) return

      // Build active command mapping from settings or defaults
      for (const cmd of SYSTEM_COMMANDS) {
        const boundKey = settings.shortcuts?.[cmd.id] ?? getDefaultShortcut(cmd)

        if (boundKey.toLowerCase() === keyCombo.toLowerCase()) {
          // If focus is in editor/input, only execute shortcuts that have modifier keys (Ctrl/Cmd/Alt)
          const hasModifier = e.ctrlKey || e.metaKey || e.altKey
          if (isInput && !hasModifier) {
            continue
          }

          e.preventDefault()
          e.stopPropagation()
          actions[cmd.id]?.()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [actions, settings.shortcuts])
}
