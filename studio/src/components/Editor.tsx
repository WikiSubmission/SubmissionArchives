import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { parseFrontmatter, stringifyWithFrontmatter } from '../lib/frontmatter'
import { useCallback, useEffect, useRef, useState } from 'react'
import { invoke, convertFileSrc } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import DragHandle from '@tiptap/extension-drag-handle-react'
import { GripVertical } from 'lucide-react'
import { QuranEmbed } from './extensions/QuranEmbed'
import { QuranEmbedInline } from './extensions/QuranEmbedInline'
import { Callout } from './extensions/Callout'
import { ArabicBlock } from './extensions/ArabicBlock'
import { SlashCommand } from './extensions/slash-command/SlashCommand'
import { setDefaultQuranInsertStyle } from './extensions/slash-command/items'
import { WikiLink } from './extensions/WikiLink'
import FrontmatterPanel from './FrontmatterPanel'
import BacklinksPanel from './BacklinksPanel'
import VersionHistoryModal from './VersionHistoryModal'
import NoteMenu, { type FontFamily } from './NoteMenu'
import { useSettings } from '../hooks/useSettings'

type EditorMode = 'write' | 'blocks' | 'page'

interface EditorProps {
  archivePath: string
  filePath: string
  onWikiLinkNavigate: (pageName: string) => void
  onOpenFile: (path: string) => void
  onDuplicate: () => void
  onMove: () => void
  onCopyPath: () => void
  onExport: () => void
}

const FONT_CLASS: Record<FontFamily, string> = {
  default: '',
  serif: 'font-serif',
  mono: 'font-mono',
}

const MODE_META: Record<
  EditorMode,
  { label: string; description: string }
> = {
  write: { label: 'Write', description: 'Markdown blocks' },
  blocks: { label: 'Blocks', description: 'Drag & drop' },
  page: { label: 'Page', description: 'Continuous prose' },
}

export default function Editor({
  archivePath,
  filePath,
  onWikiLinkNavigate,
  onOpenFile,
  onDuplicate,
  onMove,
  onCopyPath,
  onExport,
}: EditorProps) {
  const { settings } = useSettings()
  const [mode, setMode] = useState<EditorMode>('write')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({})
  const [historyOpen, setHistoryOpen] = useState(false)
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeFilePath = useRef<string | null>(null)
  const frontmatterRef = useRef<Record<string, unknown>>({})

  const locked = Boolean(frontmatter.locked)
  const fullWidth = Boolean(frontmatter.fullWidth)
  const fontFamily = (frontmatter.fontFamily as FontFamily) || 'default'
  const pdfAttachment = (frontmatter.pdfAttachment as string) || null
  const pdfSplitView = Boolean(frontmatter.pdfSplitView) && Boolean(pdfAttachment)

  useEffect(() => {
    setDefaultQuranInsertStyle(settings.quran.insertStyle)
  }, [settings.quran.insertStyle])

  const scheduleSave = (editorInstance: ReturnType<typeof useEditor>) => {
    if (!activeFilePath.current) return

    if (saveTimeout.current) clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      const path = activeFilePath.current
      if (!path || !editorInstance) return

      setStatus('saving')
      const storageInstance = editorInstance.storage as unknown as { markdown: { getMarkdown: () => string } }
      const body = storageInstance.markdown.getMarkdown()
      const content = stringifyWithFrontmatter(body, frontmatterRef.current)
      invoke('write_note', { path, content })
        .then(() => {
          setStatus('saved')
          invoke('snapshot_note', { archiveRoot: archivePath, notePath: path, content }).catch(() => {})
        })
        .catch(() => setStatus('error'))
    }, 500)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      QuranEmbed,
      QuranEmbedInline,
      Callout,
      ArabicBlock,
      SlashCommand,
      Markdown,
      WikiLink.configure({ onNavigate: onWikiLinkNavigate }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] w-full p-8',
      },
    },
    onUpdate: ({ editor: instance }) => scheduleSave(instance),
  })

  const loadNote = useCallback(
    (path: string) => {
      invoke<string>('read_note', { path })
        .then((raw) => {
          const { data, content } = parseFrontmatter(raw)
          editor?.commands.setContent(content, { emitUpdate: false })
          frontmatterRef.current = data
          setFrontmatter(data)
          setStatus('idle')
        })
        .catch(() => setStatus('error'))
    },
    [editor]
  )

  useEffect(() => {
    activeFilePath.current = filePath
    if (!editor) return
    loadNote(filePath)
  }, [filePath, editor, loadNote])

  useEffect(() => {
    editor?.setEditable(!locked)
  }, [locked, editor])

  const handleFrontmatterChange = (next: Record<string, unknown>) => {
    frontmatterRef.current = next
    setFrontmatter(next)
    scheduleSave(editor)
  }

  const handleAttachPdf = async () => {
    const selected = await open({ multiple: false, title: 'Attach PDF', filters: [{ name: 'PDF', extensions: ['pdf'] }] })
    if (!selected || typeof selected !== 'string') return
    try {
      const attached = await invoke<string>('attach_pdf_to_note', { archiveRoot: archivePath, pdfSourcePath: selected })
      handleFrontmatterChange({ ...frontmatterRef.current, pdfAttachment: attached, pdfSplitView: true })
    } catch (err) {
      window.alert(String(err))
    }
  }

  const statusConfig = {
    idle: { dot: 'bg-transparent', text: 'text-white/20', label: '' },
    saving: { dot: 'bg-amber-400', text: 'text-amber-400/80', label: 'Saving' },
    saved: { dot: 'bg-emerald-400', text: 'text-emerald-400/80', label: 'Saved' },
    error: { dot: 'bg-red-400', text: 'text-red-400/80', label: 'Error' },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="w-full h-full bg-ed-bg text-ed-fg flex flex-col relative">
      {/* Floating Toolbar — Glass pill with layered controls */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-3">
        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
            status === 'idle'
              ? 'border-transparent opacity-0'
              : 'border-white/[0.06] bg-white/[0.03] opacity-100'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot} ${
              status === 'saving' ? 'animate-status-pulse' : ''
            }`}
          />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${currentStatus.text}`}>
            {currentStatus.label}
          </span>
        </div>

        {/* Note Menu + Mode Toggle Container */}
        <div className="flex items-center gap-2 glass-strong rounded-xl border border-ed-rule shadow-elev-md p-1">
          <NoteMenu
            locked={locked}
            fullWidth={fullWidth}
            fontFamily={fontFamily}
            hasPdfAttachment={Boolean(pdfAttachment)}
            pdfSplitView={pdfSplitView}
            onToggleLock={() => handleFrontmatterChange({ ...frontmatter, locked: !locked })}
            onToggleFullWidth={() => handleFrontmatterChange({ ...frontmatter, fullWidth: !fullWidth })}
            onSetFontFamily={(font) => handleFrontmatterChange({ ...frontmatter, fontFamily: font })}
            onOpenHistory={() => setHistoryOpen(true)}
            onDuplicate={onDuplicate}
            onMove={onMove}
            onCopyPath={onCopyPath}
            onExport={onExport}
            onAttachPdf={handleAttachPdf}
            onTogglePdfSplitView={() => handleFrontmatterChange({ ...frontmatter, pdfSplitView: !pdfSplitView })}
          />

          <div className="w-px h-4 bg-white/[0.08]" />

          {/* Premium Segmented Mode Control */}
          <div className="flex items-center p-0.5 bg-black/30 rounded-lg">
            {(['write', 'blocks', 'page'] as EditorMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                title={MODE_META[m].description}
                className={`relative px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 tactile ${
                  mode === m
                    ? 'text-white'
                    : 'text-white/35 hover:text-white/60'
                }`}
              >
                {mode === m && (
                  <span className="absolute inset-0 bg-white/10 rounded-md shadow-sm" />
                )}
                <span className="relative z-10">{MODE_META[m].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {pdfSplitView && pdfAttachment && (
          <div className="w-1/2 border-r border-ed-rule shrink-0 bg-ed-surface/30">
            <iframe
              title="Attached PDF"
              src={convertFileSrc(pdfAttachment)}
              className="w-full h-full border-0"
            />
          </div>
        )}

        <div
          className={`overflow-y-auto ${
            pdfSplitView && pdfAttachment ? 'w-1/2' : 'flex-1'
          } ${FONT_CLASS[fontFamily]}`}
        >
          <div
            className={`h-full w-full mx-auto transition-all duration-500 ${
              mode === 'page'
                ? 'max-w-[800px] bg-white text-black mt-6 page-sheet rounded-sm p-6 min-h-[1056px]'
                : mode === 'blocks'
                  ? `${fullWidth ? 'max-w-none' : 'max-w-5xl'} pl-14`
                  : fullWidth
                    ? 'max-w-none'
                    : 'max-w-3xl'
            }`}
          >
            <FrontmatterPanel data={frontmatter} onChange={handleFrontmatterChange} />
            {mode === 'blocks' && editor && (
              <DragHandle editor={editor}>
                <div className="w-5 h-6 flex items-center justify-center text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing transition-colors rounded hover:bg-white/[0.04]">
                  <GripVertical size={14} strokeWidth={1.5} />
                </div>
              </DragHandle>
            )}
            <EditorContent editor={editor} className="h-full w-full" />
            <BacklinksPanel archivePath={archivePath} filePath={filePath} onOpenFile={onOpenFile} />
          </div>
        </div>
      </div>

      {historyOpen && (
        <VersionHistoryModal
          archivePath={archivePath}
          notePath={filePath}
          onRestored={() => loadNote(filePath)}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </div>
  )
}
