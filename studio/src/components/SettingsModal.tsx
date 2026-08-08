import { useState, type ReactNode } from 'react'
import { X, Settings as SettingsIcon, BookOpen, Keyboard, Download, FolderOpen } from 'lucide-react'
import { useSettings, type QuranShowMode, type QuranInsertStyle } from '../hooks/useSettings'

type SettingsSection = 'general' | 'quran' | 'shortcuts' | 'import'

interface SettingsModalProps {
  archivePath: string
  onChangeArchive: () => void
  onImportFiles: () => void
  onImportZip: () => void
  onClose: () => void
}

function SettingRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-ed-rule/50 last:border-0">
      <div className="min-w-0">
        <div className="text-sm text-white/80">{label}</div>
        <div className="text-xs text-white/35 truncate">{description}</div>
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
        className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
      >
        −
      </button>
      <span className="text-xs text-white/70 w-6 text-center font-mono">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-6 h-6 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
      >
        +
      </button>
    </div>
  )
}

const SELECT_CLASS = 'text-xs bg-[#1c1c1f] border border-white/10 rounded px-2 py-1 text-white/80 outline-none'

const SHORTCUTS: { keys: string; label: string }[] = [
  { keys: 'Ctrl/Cmd + O', label: 'Quick switcher' },
  { keys: 'Ctrl/Cmd + P', label: 'Command palette' },
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

  const sections: { id: SettingsSection; label: string; icon: typeof SettingsIcon }[] = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'quran', label: 'Quran', icon: BookOpen },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'import', label: 'Import', icon: Download },
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="w-full max-w-2xl h-[500px] bg-[#141416] border border-ed-rule rounded-lg shadow-2xl overflow-hidden flex animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-44 border-r border-ed-rule shrink-0 p-2 space-y-0.5">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm text-left transition-colors ${
                section === id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white/90 capitalize">{section}</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
              <X size={16} />
            </button>
          </div>

          {section === 'general' && (
            <div>
              <SettingRow label="Archive" description={archivePath}>
                <button
                  onClick={onChangeArchive}
                  className="text-xs px-3 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/70 transition-colors flex items-center gap-1.5"
                >
                  <FolderOpen size={12} /> Change
                </button>
              </SettingRow>
              <SettingRow label="Custom theme" description="Drop a theme.css into .studio/ inside your archive to override colors.">
                <span className="text-xs text-white/30 font-mono">.studio/theme.css</span>
              </SettingRow>
            </div>
          )}

          {section === 'quran' && (
            <div>
              <SettingRow label="Show" description="What to display when a verse is inserted">
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
              <SettingRow label="Insert style" description="Default appearance for new verse inserts">
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
              <SettingRow label="Arabic text size" description="Applies to newly rendered verses">
                <SizeStepper
                  value={settings.quran.arabicSize}
                  onChange={(v) => updateSettings((s) => ({ ...s, quran: { ...s.quran, arabicSize: v } }))}
                  min={16}
                  max={48}
                />
              </SettingRow>
              <SettingRow label="Translation text size" description="Applies to newly rendered verses">
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
                <div key={label} className="flex items-center justify-between py-1 text-sm gap-4">
                  <span className="text-white/60">{label}</span>
                  <kbd className="text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/70 shrink-0">
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
                className="w-full text-left px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
              >
                Import files...
                <div className="text-xs text-white/35 mt-0.5">Text and Markdown files, copied into the archive root.</div>
              </button>
              <button
                onClick={onImportZip}
                className="w-full text-left px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-sm text-white/80 transition-colors"
              >
                Import ZIP...
                <div className="text-xs text-white/35 mt-0.5">Extracted into the archive, preserving folder structure.</div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
