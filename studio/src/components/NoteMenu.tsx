import { useState } from 'react'
import {
  DotsThreeVertical,
  Copy,
  CopySimple,
  FolderOpen,
  DownloadSimple,
  Package,
  ClockCounterClockwise,
  Lock,
  LockOpen,
  ArrowsOut,
  ArrowsIn,
  UploadSimple,
  Columns,
  IconProps
} from '@phosphor-icons/react'

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
  onExportPackage?: () => void
  onAttachPdf: () => void
  onTogglePdfSplitView: () => void
}

function MenuItem({
  icon: Icon,
  label,
  onClick
}: {
  icon: React.ComponentType<IconProps>
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-fg transition-colors text-left"
    >
      <Icon size={14} weight="regular" className="shrink-0 text-ed-fg-muted" />
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
  icon: React.ComponentType<IconProps>
  label: string
  checked: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-ed-fg-muted hover:bg-ed-surface-strong hover:text-ed-fg transition-colors text-left"
    >
      <span className="flex items-center gap-2">
        <Icon size={14} weight="regular" className="shrink-0 text-ed-fg-muted" />
        {label}
      </span>
      <span className={`w-3 h-3 rounded-full border ${checked ? 'bg-amber-500 border-amber-500' : 'border-ed-rule'}`} />
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
  onExportPackage,
  onAttachPdf,
  onTogglePdfSplitView,
}: NoteMenuProps) {
  const [open, setOpen] = useState(false)

  const runAndClose = (fn?: () => void) => () => {
    fn?.()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        title="Note options"
        aria-label="Note options"
        className="p-1.5 rounded-md text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
      >
        <DotsThreeVertical size={16} weight="bold" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-56 bg-ed-surface border border-ed-rule rounded-lg shadow-elev-lg z-50 py-1 animate-fadeInUp">
            <div className="flex items-center gap-1 px-2 py-1.5 border-b border-ed-rule">
              {(['default', 'serif', 'mono'] as FontFamily[]).map((f) => (
                <button
                  key={f}
                  onClick={() => onSetFontFamily(f)}
                  title={f}
                  className={`flex-1 py-1 rounded text-xs transition-colors ${
                    fontFamily === f ? 'bg-ed-surface-strong text-ed-fg font-bold' : 'text-ed-fg-muted hover:text-ed-fg'
                  } ${f === 'serif' ? 'font-serif' : f === 'mono' ? 'font-mono' : ''}`}
                >
                  Ag
                </button>
              ))}
            </div>

            <MenuItem icon={Copy} label="Copy path" onClick={runAndClose(onCopyPath)} />
            <MenuItem icon={CopySimple} label="Duplicate" onClick={runAndClose(onDuplicate)} />
            <MenuItem icon={FolderOpen} label="Move to..." onClick={runAndClose(onMove)} />
            <MenuItem icon={DownloadSimple} label="Export as Markdown..." onClick={runAndClose(onExport)} />
            {onExportPackage && (
              <MenuItem icon={Package} label="Export as Package (.sanote)..." onClick={runAndClose(onExportPackage)} />
            )}

            <div className="border-t border-ed-rule my-1" />

            <MenuItem
              icon={UploadSimple}
              label={hasPdfAttachment ? 'Replace attached PDF...' : 'Attach PDF...'}
              onClick={runAndClose(onAttachPdf)}
            />
            {hasPdfAttachment && (
              <ToggleMenuItem icon={Columns} label="PDF split view" checked={pdfSplitView} onClick={onTogglePdfSplitView} />
            )}

            <div className="border-t border-ed-rule my-1" />

            <ToggleMenuItem
              icon={fullWidth ? ArrowsIn : ArrowsOut}
              label="Full width"
              checked={fullWidth}
              onClick={onToggleFullWidth}
            />
            <ToggleMenuItem icon={locked ? Lock : LockOpen} label="Lock page" checked={locked} onClick={onToggleLock} />
            <MenuItem icon={ClockCounterClockwise} label="Version history" onClick={runAndClose(onOpenHistory)} />
          </div>
        </>
      )}
    </div>
  )
}
