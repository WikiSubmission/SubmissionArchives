export interface CommandDefinition {
  id: string
  label: string
  category: 'Navigation' | 'Editor' | 'Vault' | 'Quran' | 'View' | 'Media'
  defaultKeys: {
    windows: string
    mac: string
  }
  description: string
}

export const SYSTEM_COMMANDS: CommandDefinition[] = [
  {
    id: 'app.quick-switcher',
    label: 'Quick Switcher',
    category: 'Navigation',
    defaultKeys: { windows: 'Ctrl+O', mac: 'Cmd+O' },
    description: 'Jump to note or tag across the vault',
  },
  {
    id: 'app.command-palette',
    label: 'Command Palette',
    category: 'Navigation',
    defaultKeys: { windows: 'Ctrl+P', mac: 'Cmd+P' },
    description: 'Open all studio commands and actions',
  },
  {
    id: 'view.toggle-sidebar',
    label: 'Toggle Sidebar Explorer',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+B', mac: 'Cmd+B' },
    description: 'Collapse or expand the left archive explorer',
  },
  {
    id: 'view.toggle-inspector',
    label: 'Toggle Right Inspector',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+Shift+I', mac: 'Cmd+Shift+I' },
    description: 'Open or close outline, backlinks, and stats',
  },
  {
    id: 'vault.new-note',
    label: 'Create New Note',
    category: 'Vault',
    defaultKeys: { windows: 'Ctrl+N', mac: 'Cmd+N' },
    description: 'Create a new markdown note in the archive',
  },
  {
    id: 'editor.cycle-mode',
    label: 'Cycle Editor Mode',
    category: 'Editor',
    defaultKeys: { windows: 'Ctrl+M', mac: 'Cmd+M' },
    description: 'Cycle through Write, Blocks, and Page modes',
  },
  {
    id: 'editor.lock-note',
    label: 'Toggle Note Lock',
    category: 'Editor',
    defaultKeys: { windows: 'Ctrl+Shift+L', mac: 'Cmd+Shift+L' },
    description: 'Toggle read-only protection for active note',
  },
  {
    id: 'view.open-graph',
    label: 'Open Graph View',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+G', mac: 'Cmd+G' },
    description: 'View bidirectional link graph visualization',
  },
  {
    id: 'view.open-settings',
    label: 'Open Vault Settings',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+,', mac: 'Cmd+,' },
    description: 'Configure appearance, Quran, and shortcuts',
  },
  {
    id: 'view.toggle-editor',
    label: 'Toggle Editor Pane',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+\\', mac: 'Cmd+\\' },
    description: 'Hide the editor to read the inspector full width',
  },
  {
    id: 'view.toggle-appearance',
    label: 'Toggle Light / Dark',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+Shift+D', mac: 'Cmd+Shift+D' },
    description: 'Switch between the paper and obsidian themes',
  },
  // These two were already wired up in App.tsx but never registered here, so
  // their keys did nothing — useShortcuts only walks SYSTEM_COMMANDS.
  {
    id: 'view.toggle-split',
    label: 'Split Editor Pane',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+Shift+S', mac: 'Cmd+Shift+S' },
    description: 'Show two notes side by side in the editor pane',
  },
  {
    id: 'view.open-canvas',
    label: 'Open Visual Synthesis Canvas',
    category: 'View',
    defaultKeys: { windows: 'Ctrl+Shift+C', mac: 'Cmd+Shift+C' },
    description: 'Arrange notes spatially on the whiteboard canvas',
  },
  {
    id: 'media.open-panel',
    label: 'Open Media Notes',
    category: 'Media',
    defaultKeys: { windows: 'Ctrl+Shift+M', mac: 'Cmd+Shift+M' },
    description: 'Watch or listen to an archived lecture beside the note',
  },
  {
    id: 'media.quote-cue',
    label: 'Quote Playing Cue',
    category: 'Media',
    defaultKeys: { windows: 'Ctrl+Shift+Q', mac: 'Cmd+Shift+Q' },
    description: 'Insert the cue now playing as an academic blockquote',
  },
  {
    id: 'media.insert-timestamp',
    label: 'Insert Media Timestamp',
    category: 'Media',
    defaultKeys: { windows: 'Ctrl+Shift+T', mac: 'Cmd+Shift+T' },
    description: 'Drop a clickable timestamp deep link at the cursor',
  },
]

const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

export function getDefaultShortcut(cmd: CommandDefinition): string {
  return IS_MAC ? cmd.defaultKeys.mac : cmd.defaultKeys.windows
}

/**
 * Normalizes a keyboard event into a canonical shortcut string, e.g. "Ctrl+Shift+O" or "Cmd+P".
 */
export function normalizeKeyboardEvent(e: KeyboardEvent): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return null
  }

  const parts: string[] = []

  if (IS_MAC) {
    if (e.metaKey) parts.push('Cmd')
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
  } else {
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Win')
  }

  let key = e.key
  if (key === ' ') key = 'Space'
  else if (key.length === 1) key = key.toUpperCase()

  parts.push(key)
  return parts.join('+')
}
