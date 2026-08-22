import { useState, useEffect, type ReactNode } from 'react'
import {
  Gear,
  BookOpen,
  Keyboard,
  DownloadSimple,
  FolderOpen,
  X,
  Sun,
  Moon,
  Desktop,
  ShieldCheck,
  Translate,
  ArrowCounterClockwise,
  WarningCircle,
  IconProps
} from '@phosphor-icons/react'
import {
  useSettings,
  type QuranShowMode,
  type QuranInsertStyle,
  type UiFont,
  type BodyFont,
  type ArabicFont,
} from '../hooks/useSettings'
import { useAppearance, type Appearance } from '../hooks/useAppearance'
import { TYPOGRAPHY_OPTIONS } from '../hooks/useTypography'
import { SYSTEM_COMMANDS, getDefaultShortcut, normalizeKeyboardEvent } from '../lib/shortcuts'
import { safeInvoke as invoke } from '../lib/ipc'

const APPEARANCE_OPTIONS: { value: Appearance; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Paper', icon: Sun },
  { value: 'dark', label: 'Obsidian', icon: Moon },
  { value: 'system', label: 'System', icon: Desktop },
]

type SettingsSection = 'general' | 'appearance' | 'quran' | 'transliteration' | 'shortcuts' | 'import'

interface SettingsModalProps {
  archivePath: string
  onChangeArchive: () => void
  onImportFiles: () => void
  onImportZip: () => void
  onOpenImportWizard?: () => void
  onClose: () => void
}

function SettingRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-ed-rule last:border-0">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-ed-fg">{label}</div>
        <div className="text-[11px] text-ed-fg-secondary truncate">{description}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function SettingToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
        checked ? 'bg-ed-accent' : 'bg-ed-surface-strong border border-ed-rule'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-ed-surface-raised transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
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

const SLASH_SHORTCUTS = [
  { keys: '/quran 2:255', label: 'Insert a Quran verse block' },
  { keys: '/quran inline 2:255', label: 'Insert an inline Quran verse chip' },
  { keys: '/arabic', label: 'Insert a right-to-left Arabic writing block' },
  { keys: '/note /tip /warning /important', label: 'Insert a stylized callout box' },
  { keys: '[[Page Name]]', label: 'Bidirectional link to another note' },
]

export default function SettingsModal({
  archivePath,
  onChangeArchive,
  onImportFiles,
  onImportZip,
  onOpenImportWizard,
  onClose,
}: SettingsModalProps) {
  const { settings, updateSettings } = useSettings()
  const appearance = useAppearance()
  const [section, setSection] = useState<SettingsSection>('general')
  const [healthResult, setHealthResult] = useState<string | null>(null)
  const [recordingCmdId, setRecordingCmdId] = useState<string | null>(null)
  const [shortcutConflict, setShortcutConflict] = useState<string | null>(null)

  // Listen for key recording
  useEffect(() => {
    if (!recordingCmdId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setRecordingCmdId(null)
        setShortcutConflict(null)
        return
      }

      const combo = normalizeKeyboardEvent(e)
      if (!combo) return

      // Check conflict with other commands
      const existingCmd = SYSTEM_COMMANDS.find((c) => {
        if (c.id === recordingCmdId) return false
        const bound = settings.shortcuts?.[c.id] ?? getDefaultShortcut(c)
        return bound.toLowerCase() === combo.toLowerCase()
      })

      if (existingCmd) {
        setShortcutConflict(`Conflicts with "${existingCmd.label}"`)
      } else {
        setShortcutConflict(null)
      }

      updateSettings((s) => ({
        ...s,
        shortcuts: {
          ...s.shortcuts,
          [recordingCmdId]: combo,
        },
      }))
      setRecordingCmdId(null)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [recordingCmdId, settings.shortcuts, updateSettings])

  const runHealthCheck = async () => {
    try {
      const res = await invoke<{ total_notes: number; broken_links: unknown[]; empty_notes: unknown[] }>('check_vault_health', {
        archiveRoot: archivePath,
      })
      setHealthResult(
        `Vault Scan Complete: ${res.total_notes} notes. ${res.broken_links.length} broken links, ${res.empty_notes.length} empty notes.`
      )
    } catch (err) {
      setHealthResult(`Health check error: ${String(err)}`)
    }
  }

  const resetShortcut = (cmdId: string) => {
    updateSettings((s) => {
      const next = { ...s.shortcuts }
      delete next[cmdId]
      return { ...s, shortcuts: next }
    })
  }

  const resetAllShortcuts = () => {
    updateSettings((s) => ({ ...s, shortcuts: {} }))
  }

  const sections: { id: SettingsSection; label: string; icon: React.ComponentType<IconProps> }[] = [
    { id: 'general', label: 'General', icon: Gear },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'quran', label: 'Quran', icon: BookOpen },
    { id: 'transliteration', label: 'Transliteration', icon: Translate },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'import', label: 'Import', icon: DownloadSimple },
  ]

  return (
    <div className="fixed inset-0 bg-ed-scrim backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-[560px] bg-ed-bg border border-ed-rule-strong rounded-2xl shadow-ed-lg overflow-hidden flex animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Sidebar */}
        <div className="w-48 border-r border-ed-rule shrink-0 p-2 space-y-0.5 bg-ed-surface/40">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                section === id ? 'bg-ed-surface-strong text-ed-fg font-bold' : 'text-ed-fg-secondary hover:text-ed-fg'
              }`}
            >
              <Icon size={16} weight={section === id ? 'fill' : 'regular'} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6 border-b border-ed-rule pb-3 shrink-0">
            <h2 className="text-sm font-bold text-ed-fg uppercase tracking-wider">{section}</h2>
            <button onClick={onClose} aria-label="Close settings" className="text-ed-fg-secondary hover:text-ed-fg transition-colors">
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="flex-1">
            {section === 'general' && (
              <div className="space-y-1">
                <SettingRow label="Archive Location" description={archivePath}>
                  <button
                    onClick={onChangeArchive}
                    className="text-xs px-3 py-1.5 rounded-md bg-ed-surface hover:bg-ed-surface-strong text-ed-fg transition-colors flex items-center gap-1.5 border border-ed-rule font-medium"
                  >
                    <FolderOpen size={14} weight="bold" /> Change
                  </button>
                </SettingRow>

                <SettingRow
                  label="Vault Integrity Check"
                  description="Scan archive for broken links, orphaned files, and invalid frontmatter"
                >
                  <button
                    onClick={runHealthCheck}
                    className="text-xs px-3 py-1.5 rounded-md bg-ed-accent-soft hover:bg-ed-accent-soft text-ed-accent border border-ed-accent/25 font-semibold transition-colors flex items-center gap-1.5"
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
              <div className="space-y-1">
                <SettingRow
                  label="Color Theme"
                  description="The same two palettes the web archive uses. Stored per machine, not in the vault."
                >
                  <div className="flex items-center gap-1 rounded-md border border-ed-rule bg-ed-surface p-1">
                    {APPEARANCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => appearance.setAppearance(value)}
                        className={`flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs transition-colors ${
                          appearance.appearance === value
                            ? 'bg-ed-accent font-medium text-ed-on-accent'
                            : 'text-ed-fg-secondary hover:text-ed-fg'
                        }`}
                      >
                        <Icon size={13} weight="regular" /> {label}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Interface font" description="Navigation, labels, buttons, and panel chrome">
                  <select
                    value={settings.typography.uiFont}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        typography: { ...prev.typography, uiFont: e.target.value as UiFont },
                      }))
                    }
                    className={SELECT_CLASS}
                  >
                    {TYPOGRAPHY_OPTIONS.uiFont.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </SettingRow>

                <SettingRow label="Body font" description="Long-form prose in the editor and readers">
                  <select
                    value={settings.typography.bodyFont}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        typography: { ...prev.typography, bodyFont: e.target.value as BodyFont },
                      }))
                    }
                    className={SELECT_CLASS}
                  >
                    {TYPOGRAPHY_OPTIONS.bodyFont.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </SettingRow>

                <SettingRow
                  label="Arabic font"
                  description="Amiri is the only Arabic face bundled; adding another means shipping the file, not just an option"
                >
                  <select
                    value={settings.typography.arabicFont}
                    onChange={(e) =>
                      updateSettings((prev) => ({
                        ...prev,
                        typography: { ...prev.typography, arabicFont: e.target.value as ArabicFont },
                      }))
                    }
                    className={SELECT_CLASS}
                  >
                    {TYPOGRAPHY_OPTIONS.arabicFont.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </SettingRow>
              </div>
            )}

            {section === 'quran' && (
              <div className="space-y-1">
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

            {section === 'transliteration' && (
              <div className="space-y-1">
                <SettingRow
                  label="Academic Transliteration"
                  description="Enable automated Islamic term expansion and diacritic helpers"
                >
                  <SettingToggle
                    checked={settings.transliteration.enabled}
                    onChange={(v) =>
                      updateSettings((s) => ({ ...s, transliteration: { ...s.transliteration, enabled: v } }))
                    }
                  />
                </SettingRow>

                <SettingRow
                  label="Auto-Expand Academic Terms"
                  description="Automatically convert terms on word completion (Quran → Qur'ān, Hadith → Ḥadīth)"
                >
                  <SettingToggle
                    checked={settings.transliteration.autoExpandTerms}
                    onChange={(v) =>
                      updateSettings((s) => ({ ...s, transliteration: { ...s.transliteration, autoExpandTerms: v } }))
                    }
                  />
                </SettingRow>

                <SettingRow
                  label="Fast Inline Diacritic Modifiers"
                  description="Type a= for ā, h. for ḥ, s. for ṣ, d. for ḍ, t. for ṭ, z. for ẓ, dh. for ḏ"
                >
                  <SettingToggle
                    checked={settings.transliteration.diacriticModifiers}
                    onChange={(v) =>
                      updateSettings((s) => ({
                        ...s,
                        transliteration: { ...s.transliteration, diacriticModifiers: v },
                      }))
                    }
                  />
                </SettingRow>
              </div>
            )}

            {section === 'shortcuts' && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ed-fg uppercase tracking-wider">Application Shortcuts</span>
                    {Object.keys(settings.shortcuts).length > 0 && (
                      <button
                        onClick={resetAllShortcuts}
                        className="text-[11px] text-ed-accent hover:underline flex items-center gap-1"
                      >
                        <ArrowCounterClockwise size={12} weight="bold" /> Reset all
                      </button>
                    )}
                  </div>

                  {shortcutConflict && (
                    <div className="mb-3 p-2 rounded-lg bg-ed-accent-soft border border-ed-accent/25 text-xs text-ed-accent flex items-center gap-2">
                      <WarningCircle size={14} weight="bold" />
                      <span>{shortcutConflict}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {SYSTEM_COMMANDS.map((cmd) => {
                      const isOverridden = Boolean(settings.shortcuts[cmd.id])
                      const boundKey = settings.shortcuts[cmd.id] ?? getDefaultShortcut(cmd)
                      const isRecording = recordingCmdId === cmd.id

                      return (
                        <div
                          key={cmd.id}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-ed-surface/50 border border-ed-rule gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-semibold text-ed-fg flex items-center gap-2">
                              <span>{cmd.label}</span>
                              {isOverridden && (
                                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-ed-accent-soft text-ed-accent border border-ed-accent/25">
                                  custom
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-ed-fg-secondary truncate">{cmd.description}</div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                setRecordingCmdId(isRecording ? null : cmd.id)
                                setShortcutConflict(null)
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-mono border transition-all ${
                                isRecording
                                  ? 'bg-ed-accent text-ed-on-accent border-ed-accent font-bold animate-pulse'
                                  : 'bg-ed-surface-strong text-ed-fg border-ed-rule hover:border-ed-accent/45'
                              }`}
                            >
                              {isRecording ? 'Press keys...' : boundKey}
                            </button>

                            {isOverridden && (
                              <button
                                onClick={() => resetShortcut(cmd.id)}
                                title="Reset to default"
                                aria-label="Reset to default"
                                className="p-1 rounded text-ed-fg-secondary hover:text-ed-fg hover:bg-ed-surface"
                              >
                                <ArrowCounterClockwise size={13} weight="bold" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-ed-fg uppercase tracking-wider mb-2">Slash Commands & Directives</h3>
                  <div className="space-y-1.5">
                    {SLASH_SHORTCUTS.map(({ keys, label }) => (
                      <div key={label} className="flex items-center justify-between py-1 text-xs gap-4">
                        <span className="text-ed-fg font-medium">{label}</span>
                        <kbd className="text-xs font-mono bg-ed-surface border border-ed-rule rounded px-2 py-0.5 text-ed-fg-secondary shrink-0">
                          {keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {section === 'import' && (
              <div className="space-y-3">
                {onOpenImportWizard && (
                  <button
                    onClick={() => {
                      onClose()
                      onOpenImportWizard()
                    }}
                    className="w-full text-left p-4 rounded-xl bg-ed-accent-soft hover:bg-ed-accent-soft border border-ed-accent/35 text-xs transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-ed-accent flex items-center gap-1.5">
                        <DownloadSimple size={16} weight="bold" />
                        <span>Launch Universal Import Wizard</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-ed-accent-soft text-ed-accent font-semibold">
                        Word • Notion • Obsidian
                      </span>
                    </div>
                    <div className="text-[11px] text-ed-fg-secondary mt-1 leading-relaxed">
                      Convert .docx files, clean Notion 32-character UUID hashes, and migrate Obsidian vaults with complete attachment extraction.
                    </div>
                  </button>
                )}

                <button
                  onClick={onImportFiles}
                  className="w-full text-left px-4 py-3 rounded-xl bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs text-ed-fg transition-colors"
                >
                  <div className="font-bold">Import individual files...</div>
                  <div className="text-[11px] text-ed-fg-secondary mt-0.5">Word (.docx), Markdown (.md), and Studio packages (.sanote).</div>
                </button>
                <button
                  onClick={onImportZip}
                  className="w-full text-left px-4 py-3 rounded-xl bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule text-xs text-ed-fg transition-colors"
                >
                  <div className="font-bold">Import ZIP archive...</div>
                  <div className="text-[11px] text-ed-fg-secondary mt-0.5">Extracted into the archive, preserving folder structure and cleaning Notion hashes.</div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
