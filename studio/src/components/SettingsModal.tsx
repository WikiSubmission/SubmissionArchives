import { useState, type ReactNode } from 'react'
import {
  Gear,
  BookOpen,
  Keyboard,
  DownloadSimple,
  FolderOpen,
  X,
  Sun,
  Moon,
  ShieldCheck,
  IconProps
} from '@phosphor-icons/react'
import { useSettings, type QuranShowMode, type QuranInsertStyle } from '../hooks/useSettings'
import { invoke } from '@tauri-apps/api/core'

type SettingsSection = 'general' | 'appearance' | 'quran' | 'shortcuts' | 'import'

interface SettingsModalProps {
  archivePath: string
  onChangeArchive: () => void
  onImportFiles: () => void
  onImportZip: () => void
  onClose: () => void
}

function SettingRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-ed-rule last:border-0">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-ed-fg">{label}</div>
        <div className="text-[11px] text-ed-fg-muted truncate">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SizeStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-6 h-6 flex items-center justify-center rounded bg-ed-surface hover:bg-ed-surface-strong text-ed-fg transition-colors"
      >
        −
      </button>
      <span className="text-xs text-ed-fg w-6 text-center font-mono">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-6 h-6 flex items-center justify-center rounded bg-ed-surface hover:bg-ed-surface-strong text-ed-fg transition-colors"
      >
        +
      </button>
    </div>
  )
}

const SELECT_CLASS = 'text-xs bg-ed-surface border border-ed-rule rounded px-2.5 py-1 text-ed-fg outline-none font-medium'

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'Ctrl/Cmd + O', label: 'Quick switcher' },
  { keys: 'Ctrl/Cmd + P', label: 'Command palette' },
  { keys: 'Ctrl/Cmd + \\', label: 'Split vertical' },
  { keys: 'Ctrl/Cmd + Shift + \\', label: 'Split horizontal' },
  { keys: '/quran 2:255', label: 'Insert a Quran verse' },
  { keys: '/note /tip /warning /important', label: 'Insert a callout' },
  { keys: '/arabic', label: 'Insert an Arabic writing block' },
  { keys: '[[Page Name]]', label: 'Link to another note' },
]

export default function SettingsModal({
  archivePath,
  onChangeArchive,
  onImportFiles,
  onImportZip,
  onClose,
}: SettingsModalProps) {
  const { settings, updateSettings } = useSettings()
  const [section, setSection] = useState<SettingsSection>('general')
  const [themeMode, setThemeMode] = useState<'dark' | 'light' | 'system'>('dark')
  const [healthResult, setHealthResult] = useState<string | null>(null)

  const applyTheme = (theme: 'dark' | 'light' | 'system') => {
    setThemeMode(theme)
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  const runHealthCheck = async () => {
    try {
      const res = await invoke<{ total_notes: number; broken_links: any[]; empty_notes: any[] }>('check_vault_health', {
        archiveRoot: archivePath
      })
      setHealthResult(
        `Vault Scan Complete: ${res.total_notes} notes. ${res.broken_links.length} broken links, ${res.empty_notes.length} empty notes.`
      )
    } catch (err) {
      setHealthResult(`Health check error: ${String(err)}`)
    }
  }

  const sections: { id: SettingsSection; label: string; icon: React.ComponentType<IconProps> }[] = [
    { id: 'general', label: 'General', icon: Gear },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'quran', label: 'Quran', icon: BookOpen },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'import', label: 'Import', icon: DownloadSimple },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-[520px] bg-ed-bg border border-ed-rule rounded-xl shadow-elev-xl overflow-hidden flex animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-44 border-r border-ed-rule shrink-0 p-2 space-y-0.5 bg-ed-surface/40">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                section === id ? 'bg-ed-surface-strong text-ed-fg' : 'text-ed-fg-muted hover:text-ed-fg'
              }`}
            >
              <Icon size={16} weight={section === id ? 'fill' : 'regular'} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6 border-b border-ed-rule pb-3">
            <h2 className="text-base font-bold text-ed-fg uppercase tracking-wider">{section}</h2>
            <button onClick={onClose} aria-label="Close settings" className="text-ed-fg-muted hover:text-ed-fg transition-colors">
              <X size={16} weight="bold" />
            </button>
          </div>

          {section === 'general' && (
            <div>
              <SettingRow label="Archive Location" description={archivePath}>
                <button
                  onClick={onChangeArchive}
                  className="text-xs px-3 py-1.5 rounded-md bg-ed-surface hover:bg-ed-surface-strong text-ed-fg transition-colors flex items-center gap-1.5 border border-ed-rule font-medium"
                >
                  <FolderOpen size={14} weight="bold" /> Change
                </button>
              </SettingRow>

              <SettingRow label="Vault Integrity Check" description="Scan archive for broken links, orphaned files, and invalid frontmatter">
                <button
                  onClick={runHealthCheck}
                  className="text-xs px-3 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck size={14} weight="bold" /> Run Check
                </button>
              </SettingRow>

              {healthResult && (
                <div className="mt-3 p-3 rounded-lg bg-ed-surface border border-ed-rule text-xs font-mono text-ed-fg">
                  {healthResult}
                </div>
              )}
            </div>
          )}

          {section === 'appearance' && (
            <div>
              <SettingRow label="Color Theme" description="Choose visual interface theme">
                <div className="flex items-center gap-1 bg-ed-surface p-1 rounded-lg border border-ed-rule">
                  <button
                    onClick={() => applyTheme('dark')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      themeMode === 'dark' ? 'bg-ed-surface-strong text-ed-fg font-bold' : 'text-ed-fg-muted'
                    }`}
                  >
                    <Moon size={13} weight="bold" /> Dark
                  </button>
                  <button
                    onClick={() => applyTheme('light')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                      themeMode === 'light' ? 'bg-amber-500 text-white font-bold' : 'text-ed-fg-muted'
                    }`}
                  >
                    <Sun size={13} weight="bold" /> Light (Reading Room)
                  </button>
                </div>
              </SettingRow>
            </div>
          )}

          {section === 'quran' && (
            <div>
              <SettingRow label="Show Mode" description="What to display when a verse is inserted">
                <select
                  value={settings.quran.showMode}
                  onChange={(e) =>
                    updateSettings((s) => ({ ...s, quran: { ...s.quran, showMode: e.target.value as QuranShowMode } }))
                  }
                  className={SELECT_CLASS}
                >
                  <option value="both">Arabic and translation</option>
                  <option value="arabic">Arabic only</option>
                  <option value="translation">Translation only</option>
                </select>
              </SettingRow>
              <SettingRow label="Insert Style" description="Default appearance for new verse inserts">
                <select
                  value={settings.quran.insertStyle}
                  onChange={(e) =>
                    updateSettings((s) => ({
                      ...s,
                      quran: { ...s.quran, insertStyle: e.target.value as QuranInsertStyle },
                    }))
                  }
                  className={SELECT_CLASS}
                >
                  <option value="block">Block</option>
                  <option value="inline">Inline</option>
                </select>
              </SettingRow>
              <SettingRow label="Arabic Font Size" description="Applies to rendered verses">
                <SizeStepper
                  value={settings.quran.arabicSize}
                  onChange={(v) => updateSettings((s) => ({ ...s, quran: { ...s.quran, arabicSize: v } }))}
                  min={16}
                  max={48}
                />
              </SettingRow>
              <SettingRow label="Translation Font Size" description="Applies to rendered verses">
                <SizeStepper
                  value={settings.quran.translationSize}
                  onChange={(v) => updateSettings((s) => ({ ...s, quran: { ...s.quran, translationSize: v } }))}
                  min={10}
                  max={28}
                />
              </SettingRow>
            </div>
          )}

          {section === 'shortcuts' && (
            <div className="space-y-1.5">
              {SHORTCUTS.map(({ keys, label }) => (
                <div key={label} className="flex items-center justify-between py-1 text-xs gap-4">
                  <span className="text-ed-fg font-medium">{label}</span>
                  <kbd className="text-xs font-mono bg-ed-surface border border-ed-rule rounded px-2 py-0.5 text-ed-fg-muted shrink-0">
                    {keys}
                  </kbd>
                </div>
              ))}
            </div>
          )}

          {section === 'import' && (
            <div className="space-y-3">
              <button
                onClick={onImportFiles}
                className="w-full text-left px-4 py-3 rounded-xl bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs text-ed-fg transition-colors"
              >
                <div className="font-bold">Import files...</div>
                <div className="text-[11px] text-ed-fg-muted mt-0.5">Text and Markdown files, copied into the archive root.</div>
              </button>
              <button
                onClick={onImportZip}
                className="w-full text-left px-4 py-3 rounded-xl bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs text-ed-fg transition-colors"
              >
                <div className="font-bold">Import ZIP...</div>
                <div className="text-[11px] text-ed-fg-muted mt-0.5">Extracted into the archive, preserving folder structure.</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
