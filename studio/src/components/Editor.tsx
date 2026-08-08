import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { parseFrontmatter, stringifyWithFrontmatter } from '../lib/frontmatter'
import { useEffect, useRef, useState } from 'react'
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
      const body = (editorInstance.storage as any).markdown.getMarkdown()
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

  const loadNote = (path: string) => {
    invoke<string>('read_note', { path })
      .then((raw) => {
        const { data, content } = parseFrontmatter(raw)
        editor?.commands.setContent(content, { emitUpdate: false })
        frontmatterRef.current = data
        setFrontmatter(data)
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }

  useEffect(() => {
    activeFilePath.current = filePath
    if (!editor) return
    loadNote(filePath)
  }, [filePath, editor])

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

  return (
    <div className="w-full h-full bg-white dark:bg-ed-bg text-gray-900 dark:text-gray-100 flex flex-col relative">
      {/* Mode Toggle Toolbar */}
      <div className="absolute top-4 right-8 z-10 flex items-center gap-3">
        <span key={status} className="text-xs text-white/30 font-mono animate-fade-in">
          {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : status === 'error' ? 'Error' : ''}
        </span>
        <div className="bg-[#1c1c1f] p-1 rounded-lg border border-ed-rule shadow-lg">
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
        </div>
        <div className="flex gap-2 bg-[#1c1c1f] p-1 rounded-lg border border-ed-rule shadow-lg">
          {(['write', 'blocks', 'page'] as EditorMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                mode === m ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {pdfSplitView && pdfAttachment && (
          <div className="w-1/2 border-r border-ed-rule shrink-0">
            <iframe title="Attached PDF" src={convertFileSrc(pdfAttachment)} className="w-full h-full border-0" />
          </div>
        )}

        <div className={`overflow-y-auto ${pdfSplitView && pdfAttachment ? 'w-1/2' : 'flex-1'} ${FONT_CLASS[fontFamily]}`}>
          <div
            className={`h-full w-full mx-auto transition-all duration-300 ${
              mode === 'page'
                ? 'max-w-[800px] bg-white text-black mt-8 shadow-2xl rounded-sm p-4 min-h-[1056px]'
                : mode === 'blocks'
                  ? `${fullWidth ? 'max-w-none' : 'max-w-5xl'} pl-16`
                  : fullWidth
                    ? 'max-w-none'
                    : 'max-w-3xl'
            }`}
          >
            <FrontmatterPanel data={frontmatter} onChange={handleFrontmatterChange} />
            {mode === 'blocks' && editor && (
              <DragHandle editor={editor}>
                <div className="w-5 h-6 flex items-center justify-center text-white/30 hover:text-white/70 cursor-grab active:cursor-grabbing transition-colors">
                  <GripVertical size={15} />
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
