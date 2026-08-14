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
    <div className="h-screen w-screen bg-[#0c0d0f] text-zinc-200 flex flex-col items-center justify-center font-sans relative overflow-hidden select-none">
      {/* Subtle fine grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-xl px-4 flex flex-col gap-5">
        {/* Raycast Command Window Card */}
        <div className="bg-[#121316]/95 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col">
          {/* Header search / branding row */}
          <div className="h-12 px-4 border-b border-zinc-800/80 flex items-center gap-3 bg-zinc-900/40">
            <img
              src={logoMark}
              alt=""
              className="h-5 w-5 opacity-80 grayscale contrast-125"
              draggable={false}
            />
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium flex-1">
              <span className="text-zinc-100 font-semibold">SA Studio</span>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-400">Select Workspace</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[10px]">↑↓</kbd>
              <span>navigate</span>
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[10px]">↵</kbd>
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
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    selectedIndex === 0 ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Command size={14} weight="bold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold leading-tight">Launch Study Workspace</span>
                  <span className="text-[11px] text-zinc-500 font-mono truncate leading-tight">
                    {defaultPath}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[10px] font-mono">
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
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-300 hover:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    selectedIndex === 1 ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <FolderOpen size={14} weight="bold" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-medium leading-tight">Choose Archive Folder...</span>
                  <span className="text-[11px] text-zinc-500 leading-tight">
                    Select any local directory
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[10px] font-mono">
                  Ctrl+O
                </kbd>
              </div>
            </button>

            {/* Recent Archives Section */}
            {recentArchives.length > 0 && (
              <>
                <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
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
                          ? 'bg-zinc-800/90 text-zinc-100'
                          : 'text-zinc-300 hover:bg-zinc-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800/80 text-zinc-400'
                          }`}
                        >
                          <FileText size={13} weight="bold" />
                        </div>
                        <span className="text-xs font-mono text-zinc-300 truncate">
                          {path.split(/[\\/]/).pop()}
                        </span>
                      </div>
                      <CaretRight
                        size={12}
                        weight="bold"
                        className={`shrink-0 ${isSelected ? 'text-zinc-200' : 'text-zinc-600'}`}
                      />
                    </button>
                  )
                })}
              </>
            )}
          </div>

          {/* Footer status row */}
          <div className="h-8 px-4 border-t border-zinc-800/80 flex items-center justify-between bg-zinc-900/30 text-[11px] text-zinc-500">
            <span>Offline Scholarly Quran & Research Environment</span>
            <span>v0.1.0</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="px-3.5 py-2.5 rounded-md bg-red-950/40 border border-red-800/50 text-xs text-red-300 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}