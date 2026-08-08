import { useState } from 'react'
import {
  MoreHorizontal,
  Copy,
  Files,
  FolderInput,
  Download,
  History as HistoryIcon,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
  FileUp,
  Columns2,
} from 'lucide-react'

export type FontFamily = 'default' | 'serif' | 'mono'

interface NoteMenuProps {
  locked: boolean
  fullWidth: boolean
  fontFamily: FontFamily
  hasPdfAttachment: boolean
  pdfSplitView: boolean
  onToggleLock: () => void
  onToggleFullWidth: () => void
  onSetFontFamily: (font: FontFamily) => void
  onOpenHistory: () => void
  onDuplicate: () => void
  onMove: () => void
  onCopyPath: () => void
  onExport: () => void
  onAttachPdf: () => void
  onTogglePdfSplitView: () => void
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof Copy; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white/90 transition-colors text-left"
    >
      <Icon size={13} className="shrink-0 text-white/40" />
      {label}
    </button>
  )
}

function ToggleMenuItem({
  icon: Icon,
  label,
  checked,
  onClick,
}: {
  icon: typeof Copy
  label: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm text-white/70 hover:bg-white/5 hover:text-white/90 transition-colors text-left"
    >
      <span className="flex items-center gap-2">
        <Icon size={13} className="shrink-0 text-white/40" />
        {label}
      </span>
      <span className={`w-3 h-3 rounded-full border ${checked ? 'bg-ed-accent border-ed-accent' : 'border-white/20'}`} />
    </button>
  )
}

export default function NoteMenu({
  locked,
  fullWidth,
  fontFamily,
  hasPdfAttachment,
  pdfSplitView,
  onToggleLock,
  onToggleFullWidth,
  onSetFontFamily,
  onOpenHistory,
  onDuplicate,
  onMove,
  onCopyPath,
  onExport,
  onAttachPdf,
  onTogglePdfSplitView,
}: NoteMenuProps) {
  const [open, setOpen] = useState(false)

  const runAndClose = (fn: () => void) => () => {
    fn()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Note options"
        className="p-1.5 rounded-md text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
      >
        <MoreHorizontal size={14} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-[#1c1c1f] border border-ed-rule rounded-lg shadow-2xl z-50 py-1 animate-fade-in-up">
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-ed-rule/50">
              {(['default', 'serif', 'mono'] as FontFamily[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onSetFontFamily(f)}
                  title={f}
                  className={`flex-1 py-1 rounded text-xs transition-colors ${
                    fontFamily === f ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
                  } ${f === 'serif' ? 'font-serif' : f === 'mono' ? 'font-mono' : ''}`}
                >
                  Ag
                </button>
              ))}
            </div>

            <MenuItem icon={Copy} label="Copy path" onClick={runAndClose(onCopyPath)} />
            <MenuItem icon={Files} label="Duplicate" onClick={runAndClose(onDuplicate)} />
            <MenuItem icon={FolderInput} label="Move to..." onClick={runAndClose(onMove)} />
            <MenuItem icon={Download} label="Export as Markdown..." onClick={runAndClose(onExport)} />

            <div className="border-t border-ed-rule/50 my-1" />

            <MenuItem
              icon={FileUp}
              label={hasPdfAttachment ? 'Replace attached PDF...' : 'Attach PDF...'}
              onClick={runAndClose(onAttachPdf)}
            />
            {hasPdfAttachment && (
              <ToggleMenuItem icon={Columns2} label="PDF split view" checked={pdfSplitView} onClick={onTogglePdfSplitView} />
            )}

            <div className="border-t border-ed-rule/50 my-1" />

            <ToggleMenuItem
              icon={fullWidth ? Minimize2 : Maximize2}
              label="Full width"
              checked={fullWidth}
              onClick={onToggleFullWidth}
            />
            <ToggleMenuItem icon={locked ? Lock : Unlock} label="Lock page" checked={locked} onClick={onToggleLock} />
            <MenuItem icon={HistoryIcon} label="Version history" onClick={runAndClose(onOpenHistory)} />
          </div>
        </>
      )}
    </div>
  )
}
