import { useEffect } from 'react'
import { X, Sparkle, Keyboard, Check } from '@phosphor-icons/react'
import type { ReleaseNote } from '../hooks/useWhatsNew'

interface WhatsNewModalProps {
  releases: ReleaseNote[]
  onClose: () => void
  onOpenSettings?: () => void
}

export default function WhatsNewModal({ releases, onClose, onOpenSettings }: WhatsNewModalProps) {
  const latest = releases[0]

  // Raycast keyboard shortcuts: Esc to close, Enter to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        onClose()
      } else if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        onClose()
        onOpenSettings?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onOpenSettings])

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none font-sans"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#121316]/95 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="h-14 px-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
              <Sparkle size={15} weight="bold" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-zinc-100 tracking-tight">What's New in SA Studio</h2>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  v{latest.version}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">{latest.releaseDate}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X size={15} weight="bold" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Release Headline */}
          <div className="p-3.5 bg-zinc-900/60 border border-zinc-800 rounded-md">
            <h3 className="text-xs font-semibold text-zinc-200">{latest.headline}</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{latest.summary}</p>
          </div>

          {/* Categorized Features */}
          <div className="space-y-6">
            {latest.categories.map((category) => (
              <div key={category.name} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    {category.name}
                  </span>
                  <div className="flex-1 h-px bg-zinc-800/80" />
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {category.items.map((item) => (
                    <div
                      key={item.title}
                      className="p-3 rounded-md bg-zinc-900/30 border border-zinc-800/60 hover:bg-zinc-800/40 hover:border-zinc-700/60 transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 w-4 h-4 rounded bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
                          <Check size={10} weight="bold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-zinc-200">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Bar */}
        <div className="h-12 px-5 border-t border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-3">
            {onOpenSettings && (
              <button
                onClick={() => {
                  onClose()
                  onOpenSettings()
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                <Keyboard size={14} weight="bold" />
                <span>Shortcuts</span>
                <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 text-[10px] font-mono">
                  ⌘,
                </kbd>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700/80 text-zinc-100 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>Dismiss</span>
              <kbd className="px-1.5 py-0.5 rounded bg-zinc-900/80 text-zinc-400 text-[10px] font-mono">
                Esc
              </kbd>
            </button>
          </div>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 5px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}</style>
      </div>
    </div>
  )
}