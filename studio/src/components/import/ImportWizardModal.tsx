import { useState } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { safeInvoke as invoke } from '../../lib/ipc'
import {
  FileDoc,
  FolderOpen,
  Archive,
  ArrowRight,
  CheckCircle,
  X,
  Sparkle,
  DownloadSimple,
  WarningCircle,
  FileText
} from '@phosphor-icons/react'

type ImportSource = 'docx' | 'notion' | 'obsidian' | 'sanote' | 'general'

interface ImportWizardModalProps {
  archivePath: string
  onImportCompleted: (importedPaths: string[]) => void
  onClose: () => void
}

interface SourceOption {
  id: ImportSource
  title: string
  subtitle: string
  badge: string
  description: string
  icon: typeof FileDoc
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    id: 'docx',
    title: 'Microsoft Word / Google Docs',
    subtitle: '.docx files or Google Docs export',
    badge: 'DOCX Converter',
    description: 'Extracts headings, rich formatting, tables, and extracts embedded images into attachments.',
    icon: FileDoc,
  },
  {
    id: 'notion',
    title: 'Notion Workspace Export',
    subtitle: 'Notion export ZIP bundle',
    badge: 'UUID Cleaner',
    description: 'Strips 32-character hexadecimal UUID hashes from file and folder names, rewrites media links, and normalizes callouts.',
    icon: Archive,
  },
  {
    id: 'obsidian',
    title: 'Obsidian Vault',
    subtitle: 'Folder or Markdown ZIP',
    badge: 'Vault Importer',
    description: 'Preserves frontmatter properties, nested folder hierarchies, and maps Obsidian callouts cleanly to Studio.',
    icon: FolderOpen,
  },
  {
    id: 'sanote',
    title: 'Studio Note Package',
    subtitle: '.sanote distributable package',
    badge: 'Native Bundle',
    description: 'Restores self-contained note bundles with complete metadata, attachments, and PDF sidecars.',
    icon: Sparkle,
  },
]

export default function ImportWizardModal({ archivePath, onImportCompleted, onClose }: ImportWizardModalProps) {
  const [selectedSource, setSelectedSource] = useState<ImportSource>('docx')
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [importedFiles, setImportedFiles] = useState<string[]>([])

  const handleStartImport = async () => {
    setStatus('processing')
    setErrorMessage(null)

    try {
      if (selectedSource === 'docx') {
        const selected = await open({
          multiple: true,
          title: 'Select Word (.docx) Files',
          filters: [{ name: 'Word Document', extensions: ['docx'] }],
        })
        if (!selected) {
          setStatus('idle')
          return
        }
        const paths = Array.isArray(selected) ? selected : [selected]
        const res = await invoke<string[]>('import_files', { archiveRoot: archivePath, sourcePaths: paths })
        setImportedFiles(res)
        setStatus('success')
        onImportCompleted(res)
      } else if (selectedSource === 'notion' || selectedSource === 'obsidian') {
        const selected = await open({
          multiple: false,
          title: `Select ${selectedSource === 'notion' ? 'Notion' : 'Obsidian'} Export ZIP`,
          filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
        })
        if (!selected || typeof selected !== 'string') {
          setStatus('idle')
          return
        }
        const res = await invoke<string[]>('import_zip', { archiveRoot: archivePath, zipPath: selected })
        setImportedFiles(res)
        setStatus('success')
        onImportCompleted(res)
      } else if (selectedSource === 'sanote') {
        const selected = await open({
          multiple: false,
          title: 'Select .sanote Package',
          filters: [{ name: 'Studio Note Package', extensions: ['sanote'] }],
        })
        if (!selected || typeof selected !== 'string') {
          setStatus('idle')
          return
        }
        const res = await invoke<string>('import_sanote', { archiveRoot: archivePath, sanotePath: selected })
        setImportedFiles([res])
        setStatus('success')
        onImportCompleted([res])
      }
    } catch (err) {
      setErrorMessage(String(err))
      setStatus('error')
    }
  }

  return (
    <div className="fixed inset-0 bg-ed-scrim backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-ed-bg border border-ed-rule-strong rounded-2xl shadow-ed-lg overflow-hidden flex flex-col max-h-[85vh] animate-slide-up-fade"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-ed-rule flex items-center justify-between bg-ed-surface/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ed-accent-soft border border-ed-accent/25 flex items-center justify-center text-ed-accent">
              <DownloadSimple size={18} weight="bold" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-ed-fg tracking-tight">Universal Import Wizard</h2>
              <p className="text-[11px] text-ed-fg-muted mt-0.5">
                Migrate notes from Word, Google Docs, Notion, or Obsidian into your offline archive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
          >
            <X size={16} weight="bold" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {status === 'idle' && (
            <div className="space-y-4">
              <span className="text-xs font-bold text-ed-fg uppercase tracking-wider">Choose Import Source</span>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SOURCE_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  const isSelected = selectedSource === opt.id

                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedSource(opt.id)}
                      className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-ed-surface-strong border-ed-accent shadow-ed-sm'
                          : 'bg-ed-surface/40 border-ed-rule hover:border-ed-rule-strong hover:bg-ed-surface/60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-ed-accent text-ed-on-accent' : 'bg-ed-surface text-ed-fg-muted'}`}>
                            <Icon size={18} weight={isSelected ? 'bold' : 'regular'} />
                          </div>
                          <span className="text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full bg-ed-accent-soft text-ed-accent border border-ed-accent/25">
                            {opt.badge}
                          </span>
                        </div>

                        <h3 className="text-xs font-bold text-ed-fg tracking-tight">{opt.title}</h3>
                        <p className="text-[11px] text-ed-fg-muted mt-0.5 font-medium">{opt.subtitle}</p>
                      </div>

                      <p className="text-[11px] text-ed-fg-muted/80 mt-3 leading-relaxed border-t border-ed-rule/40 pt-2">
                        {opt.description}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <span className="w-8 h-8 border-2 border-ed-accent/25 border-t-ed-accent rounded-full animate-spin" />
              <h3 className="text-sm font-bold text-ed-fg">Converting & Ingesting Files...</h3>
              <p className="text-xs text-ed-fg-muted max-w-sm">
                Parsing document structure, extracting media attachments, and normalizing Markdown formatting.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-slide-up-fade">
              <div className="w-12 h-12 rounded-full bg-ed-success-soft border border-ed-success/25 flex items-center justify-center text-ed-success">
                <CheckCircle size={28} weight="fill" />
              </div>
              <div>
                <h3 className="text-base font-bold text-ed-fg">Import Completed Successfully!</h3>
                <p className="text-xs text-ed-fg-muted mt-1">
                  Successfully imported {importedFiles.length} file{importedFiles.length === 1 ? '' : 's'} into your archive.
                </p>
              </div>

              <div className="w-full max-h-48 overflow-y-auto bg-ed-surface/50 border border-ed-rule rounded-xl p-3 text-left space-y-1">
                {importedFiles.map((f) => (
                  <div key={f} className="text-[11px] font-mono text-ed-fg-muted flex items-center gap-2 truncate">
                    <FileText size={14} weight="regular" className="text-ed-accent shrink-0" />
                    <span className="truncate">{f.split(/[\\/]/).pop()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 bg-ed-danger-soft border border-ed-danger/25 rounded-xl space-y-2 text-ed-danger text-xs">
              <div className="font-bold flex items-center gap-1.5">
                <WarningCircle size={16} weight="bold" />
                <span>Import Failed</span>
              </div>
              <p className="font-mono text-[11px]">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="px-6 py-4 border-t border-ed-rule bg-ed-surface/30 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-colors"
          >
            {status === 'success' ? 'Close' : 'Cancel'}
          </button>

          {status === 'idle' && (
            <button
              onClick={handleStartImport}
              className="px-4 py-2 rounded-lg bg-ed-accent hover:bg-ed-accent-strong text-ed-on-accent text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Select & Import</span>
              <ArrowRight size={13} weight="bold" />
            </button>
          )}

          {status === 'error' && (
            <button
              onClick={() => setStatus('idle')}
              className="px-4 py-2 rounded-lg bg-ed-surface hover:bg-ed-surface-strong text-ed-fg text-xs font-bold border border-ed-rule transition-all"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
