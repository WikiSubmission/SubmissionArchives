import { FileText, Link2, CheckCircle2 } from 'lucide-react'

interface StatusBarProps {
  wordCount: number
  charCount: number
  backlinksCount: number
  editorMode: 'write' | 'blocks' | 'page'
  onModeChange: (mode: 'write' | 'blocks' | 'page') => void
  isSaved?: boolean
}

export default function StatusBar({
  wordCount,
  charCount,
  backlinksCount,
  editorMode,
  onModeChange,
  isSaved = true,
}: StatusBarProps) {
  return (
    <footer className="h-6 shrink-0 border-t border-ed-rule bg-ed-bg/95 flex items-center justify-between px-3 text-[11px] text-white/35 font-mono select-none z-30">
      {/* Left side metrics */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 hover:text-white/60 transition-colors cursor-default" title="Word & Character count">
          <FileText size={11} className="text-white/25" />
          <span>{wordCount} words</span>
          <span className="text-white/15">•</span>
          <span>{charCount} chars</span>
        </div>

        <div className="flex items-center gap-1 hover:text-white/60 transition-colors cursor-default" title="Incoming Backlinks">
          <Link2 size={11} className="text-amber-400/60" />
          <span>{backlinksCount} {backlinksCount === 1 ? 'backlink' : 'backlinks'}</span>
        </div>
      </div>

      {/* Right side controls & status */}
      <div className="flex items-center gap-3">
        {/* Mode Selector Pill */}
        <div className="flex items-center bg-white/[0.04] p-0.5 rounded border border-white/[0.06] text-[10px]">
          {(['write', 'blocks', 'page'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`px-1.5 py-0.2 rounded capitalize transition-all ${
                editorMode === mode
                  ? 'bg-white/10 text-white font-medium'
                  : 'text-white/35 hover:text-white/60'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-1 text-[10px]">
          <CheckCircle2 size={11} className={isSaved ? 'text-emerald-400/80' : 'text-amber-400/80'} />
          <span className={isSaved ? 'text-emerald-400/80' : 'text-amber-400/80'}>
            {isSaved ? 'Saved' : 'Unsaved'}
          </span>
        </div>
      </div>
    </footer>
  )
}
