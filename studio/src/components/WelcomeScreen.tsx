import { useState, useEffect } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import {
  FolderOpen,
  FileText,
  Command,
  CaretRight
} from '@phosphor-icons/react'
import logoMark from '../assets/submission-archives-mark.png'

interface WelcomeScreenProps {
  onArchiveSelected: (path: string) => void
  recentArchives?: string[]
}

export default function WelcomeScreen({ onArchiveSelected, recentArchives = [] }: WelcomeScreenProps) {
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const defaultPath = 'c:\\Users\\Jonathan\\Desktop\\SA\\archive'

  const handleOpenArchive = async () => {
    setError(null)
    try {
      const path = await open({ directory: true, multiple: false, title: 'Choose your Archive folder' })
      if (typeof path === 'string') {
        onArchiveSelected(path)
      }
    } catch (err) {
      setError(String(err))
    }
  }

  const handleQuickstartDefault = () => {
    onArchiveSelected(defaultPath)
  }

  // Keyboard navigation for Raycast-like command center
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex === 0) {
          handleQuickstartDefault()
        } else if (selectedIndex === 1) {
          handleOpenArchive()
        } else {
          const recent = recentArchives[selectedIndex - 2]
          if (recent) onArchiveSelected(recent)
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        const total = 2 + recentArchives.length
        setSelectedIndex((prev) => (prev + 1) % total)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const total = 2 + recentArchives.length
        setSelectedIndex((prev) => (prev - 1 + total) % total)
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault()
        handleOpenArchive()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, recentArchives])

  return (
    <div className="h-screen w-screen bg-ed-bg text-ed-fg flex flex-col items-center justify-center font-sans relative overflow-hidden select-none">
      {/* Subtle fine grid texture */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(var(--ed-fg) 1px, transparent 1px), linear-gradient(90deg, var(--ed-fg) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-xl px-4 flex flex-col gap-5">
        {/* Raycast Command Window Card */}
        <div className="flex flex-col overflow-hidden rounded-lg border border-ed-rule bg-ed-surface-raised shadow-ed-lg">
          {/* Header search / branding row */}
          <div className="h-12 px-4 border-b border-ed-rule/80 flex items-center gap-3 bg-ed-bg-secondary/40">
            <img
              src={logoMark}
              alt=""
              className="h-5 w-5"
              draggable={false}
            />
            <div className="flex items-center gap-2 text-xs text-ed-fg-secondary font-medium flex-1">
              <span className="text-ed-fg font-semibold">SA Studio</span>
              <span className="text-ed-fg-secondary">/</span>
              <span className="text-ed-fg-secondary">Select Workspace</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-ed-fg-secondary">
              <kbd className="px-1.5 py-0.5 rounded bg-ed-surface-strong text-ed-fg-secondary border border-ed-rule-strong/60 text-[10px]">↑↓</kbd>
              <span>navigate</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-ed-surface-strong text-ed-fg-secondary border border-ed-rule-strong/60 text-[10px]">↵</kbd>
              <span>open</span>
            </div>
          </div>

          {/* Action List */}
          <div className="p-1.5 flex flex-col gap-0.5">
            {/* Primary Action: Launch Study Workspace */}
            <button
              onClick={handleQuickstartDefault}
              onMouseEnter={() => setSelectedIndex(0)}
              className={`w-full h-11 px-3 rounded-md flex items-center justify-between text-left transition-colors ${
                selectedIndex === 0
                  ? 'bg-ed-surface-strong/90 text-ed-fg'
                  : 'text-ed-fg-secondary hover:bg-ed-surface-strong/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    selectedIndex === 0 ? 'bg-ed-rule-strong text-ed-fg' : 'bg-ed-surface-strong text-ed-fg-secondary'
                  }`}
                >
                  <Command size={14} weight="bold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold leading-tight">Launch Study Workspace</span>
                  <span className="text-[11px] text-ed-fg-secondary font-mono truncate leading-tight">
                    {defaultPath}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-ed-surface-strong text-ed-fg-secondary border border-ed-rule-strong/60 text-[10px] font-mono">
                  ↵ Enter
                </kbd>
              </div>
            </button>

            {/* Secondary Action: Open Other Folder */}
            <button
              onClick={handleOpenArchive}
              onMouseEnter={() => setSelectedIndex(1)}
              className={`w-full h-11 px-3 rounded-md flex items-center justify-between text-left transition-colors ${
                selectedIndex === 1
                  ? 'bg-ed-surface-strong/90 text-ed-fg'
                  : 'text-ed-fg-secondary hover:bg-ed-surface-strong/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    selectedIndex === 1 ? 'bg-ed-rule-strong text-ed-fg' : 'bg-ed-surface-strong text-ed-fg-secondary'
                  }`}
                >
                  <FolderOpen size={14} weight="bold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium leading-tight">Choose Archive Folder...</span>
                  <span className="text-[11px] text-ed-fg-secondary leading-tight">
                    Select any local directory
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-ed-surface-strong text-ed-fg-secondary border border-ed-rule-strong/60 text-[10px] font-mono">
                  Ctrl+O
                </kbd>
              </div>
            </button>

            {/* Recent Archives Section */}
            {recentArchives.length > 0 && (
              <>
                <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-ed-fg-secondary uppercase tracking-wider">
                    Recent Workspaces
                  </span>
                </div>
                {recentArchives.map((path, index) => {
                  const itemIndex = 2 + index
                  const isSelected = selectedIndex === itemIndex
                  return (
                    <button
                      key={path}
                      onClick={() => onArchiveSelected(path)}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full h-10 px-3 rounded-md flex items-center justify-between text-left transition-colors ${
                        isSelected
                          ? 'bg-ed-surface-strong/90 text-ed-fg'
                          : 'text-ed-fg-secondary hover:bg-ed-surface-strong/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-ed-rule-strong text-ed-fg' : 'bg-ed-surface-strong/80 text-ed-fg-secondary'
                          }`}
                        >
                          <FileText size={13} weight="bold" />
                        </div>
                        <span className="text-xs font-mono text-ed-fg-secondary truncate">
                          {path.split(/[\\/]/).pop()}
                        </span>
                      </div>
                      <CaretRight
                        size={12}
                        weight="bold"
                        className={`shrink-0 ${isSelected ? 'text-ed-fg' : 'text-ed-fg-secondary'}`}
                      />
                    </button>
                  )
                })}
              </>
            )}
          </div>

          {/* Footer status row */}
          <div className="h-8 px-4 border-t border-ed-rule/80 flex items-center justify-between bg-ed-bg-secondary/30 text-[11px] text-ed-fg-secondary">
            <span>Offline Scholarly Quran & Research Environment</span>
            <span>v0.1.0</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-3.5 py-2.5 rounded-md bg-ed-danger-soft border border-ed-danger/40 text-xs text-ed-danger font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-ed-danger shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}