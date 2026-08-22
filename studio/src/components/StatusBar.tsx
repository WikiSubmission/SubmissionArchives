import { FileText, LinkSimple, CheckCircle } from '@phosphor-icons/react'

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
    <footer className="h-6 shrink-0 border-t border-ed-rule bg-ed-bg/95 flex items-center justify-between px-3 text-[11px] text-ed-fg-secondary font-mono select-none z-30">
      {/* Left side metrics */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 hover:text-ed-fg transition-colors cursor-default" title="Word & Character count">
          <FileText size={12} weight="regular" className="text-ed-fg-secondary" />
          <span>{wordCount} words</span>
          <span className="text-ed-rule-strong">•</span>
          <span>{charCount} chars</span>
        </div>

        <div className="flex items-center gap-1 hover:text-ed-fg transition-colors cursor-default" title="Incoming Backlinks">
          <LinkSimple size={12} weight="bold" className="text-ed-accent" />
          <span>{backlinksCount} {backlinksCount === 1 ? 'backlink' : 'backlinks'}</span>
        </div>
      </div>

      {/* Right side controls & status */}
      <div className="flex items-center gap-3">
        {/* Mode Selector Pill */}
        <div className="flex items-center bg-ed-surface p-0.5 rounded border border-ed-rule text-[10px]">
          {(['write', 'blocks', 'page'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`px-1.5 py-0.2 rounded capitalize transition-all ${
                editorMode === mode
                  ? 'bg-ed-surface-strong text-ed-fg font-medium'
                  : 'text-ed-fg-secondary hover:text-ed-fg'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Save Status */}
        <div className="flex items-center gap-1 text-[10px]">
          <CheckCircle size={12} weight="fill" className={isSaved ? 'text-ed-success' : 'text-ed-accent'} />
          <span className={isSaved ? 'text-ed-success font-semibold' : 'text-ed-accent font-semibold'}>
            {isSaved ? 'Saved' : 'Unsaved'}
          </span>
        </div>
      </div>
    </footer>
  )
}
