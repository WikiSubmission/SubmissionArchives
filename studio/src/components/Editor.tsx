import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { parseFrontmatter, stringifyWithFrontmatter } from '../lib/frontmatter'
import { useCallback, useEffect, useRef, useState } from 'react'
import { safeInvoke as invoke } from '../lib/ipc'
import { open } from '@tauri-apps/plugin-dialog'
import DragHandle from '@tiptap/extension-drag-handle-react'
import { DotsSixVertical } from '@phosphor-icons/react'
import { QuranEmbed } from './extensions/QuranEmbed'
import { QuranEmbedInline } from './extensions/QuranEmbedInline'
import { Callout } from './extensions/Callout'
import { ArabicBlock } from './extensions/ArabicBlock'
import { SlashCommand } from './extensions/slash-command/SlashCommand'
import { setDefaultQuranInsertStyle } from './extensions/slash-command/items'
import { WikiLink } from './extensions/WikiLink'
import { MarkdownSyntaxHighlight } from './extensions/MarkdownSyntaxHighlight'
import { SmartTypography } from './extensions/SmartTypography'
import { AcademicTransliteration } from './extensions/AcademicTransliteration'
import { FootnoteRef } from './extensions/Footnote'
import FrontmatterPanel from './FrontmatterPanel'
import BacklinksPanel from './BacklinksPanel'
import VersionHistoryModal from './VersionHistoryModal'
import NoteMenu, { type FontFamily } from './NoteMenu'
import EditorToolbar from './EditorToolbar'
import EditorBubbleMenu from './EditorBubbleMenu'
import PageModeCanvas from './PageModeCanvas'
import PdfViewer from './pdf/PdfViewer'
import { useSettings } from '../hooks/useSettings'
import { motion, AnimatePresence, springConfig } from './ui/Motion'

export type EditorMode = 'write' | 'blocks' | 'page'

interface EditorProps {
  archivePath: string
  filePath: string
  onWikiLinkNavigate: (pageName: string) => void
  onOpenFile: (path: string) => void
  onDuplicate: () => void
  onMove: () => void
  onCopyPath: () => void
  onExport: () => void
  onExportPackage?: () => void
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  onContentChange?: (content: string) => void
  onStatusChange?: (isSaved: boolean) => void
}

const FONT_CLASS: Record<FontFamily, string> = {
  default: 'font-body',
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
  onExportPackage,
  mode,
  onModeChange,
  onContentChange,
  onStatusChange,
}: EditorProps) {
  const { settings } = useSettings()
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
      onStatusChange?.(false)
      const storageInstance = editorInstance.storage as unknown as { markdown: { getMarkdown: () => string } }
      const body = storageInstance.markdown.getMarkdown()
      onContentChange?.(body)
      const content = stringifyWithFrontmatter(body, frontmatterRef.current)

      // Atomic file write + recovery buffer
      invoke('write_note', { path, content })
        .then(() => {
          setStatus('saved')
          onStatusChange?.(true)
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
      FootnoteRef,
      MarkdownSyntaxHighlight.configure({ activeMode: mode }),
      SmartTypography.configure({ activeMode: mode }),
      AcademicTransliteration.configure({
        enabled: settings.transliteration.enabled,
        autoExpandTerms: settings.transliteration.autoExpandTerms,
        diacriticModifiers: settings.transliteration.diacriticModifiers,
      }),
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

  // Typewriter scrolling in Page mode
  useEffect(() => {
    if (mode !== 'page' || !editor) return

    const handleSelectionUpdate = () => {
      const { view } = editor
      if (!view) return
      const cursorPos = view.coordsAtPos(view.state.selection.head)
      const editorRect = view.dom.getBoundingClientRect()
      const targetY = editorRect.top + editorRect.height / 2
      const scrollContainer = view.dom.closest('.overflow-y-auto')

      if (scrollContainer && Math.abs(cursorPos.top - targetY) > 60) {
        scrollContainer.scrollBy({
          top: cursorPos.top - targetY,
          behavior: 'smooth'
        })
      }
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [mode, editor])

  const loadNote = useCallback(
    (path: string) => {
      invoke<string>('read_note', { path })
        .then((raw) => {
          const { data, content } = parseFrontmatter(raw)
          editor?.commands.setContent(content, { emitUpdate: false })
          frontmatterRef.current = data
          setFrontmatter(data)
          setStatus('idle')
          onContentChange?.(content)
          onStatusChange?.(true)
        })
        .catch(() => setStatus('error'))
    },
    [editor, onContentChange, onStatusChange]
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
    idle: { dot: 'bg-transparent', text: 'text-ed-fg-muted', label: '' },
    saving: { dot: 'bg-ed-accent', text: 'text-ed-accent', label: 'Saving' },
    saved: { dot: 'bg-ed-success', text: 'text-ed-success', label: 'Saved' },
    error: { dot: 'bg-ed-danger', text: 'text-ed-danger', label: 'Error' },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="w-full h-full bg-ed-bg text-ed-fg flex flex-col relative select-none">
      {/* Floating Toolbar */}
      <div className="absolute top-3 right-6 z-20 flex items-center gap-3">
        {/* Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
            status === 'idle'
              ? 'border-transparent opacity-0'
              : 'border-ed-rule bg-ed-surface opacity-100'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot} ${
              status === 'saving' ? 'animate-pulse' : ''
            }`}
          />
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${currentStatus.text}`}>
            {currentStatus.label}
          </span>
        </div>

        {/* Note Menu + Mode Toggle Container */}
        <div className="flex items-center gap-2 glass-strong rounded-xl border border-ed-rule shadow-ed-md p-1">
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
            onExportPackage={onExportPackage}
            onAttachPdf={handleAttachPdf}
            onTogglePdfSplitView={() => handleFrontmatterChange({ ...frontmatter, pdfSplitView: !pdfSplitView })}
          />

          <div className="w-px h-4 bg-ed-rule" />

          {/* Premium Segmented Mode Control */}
          <div className="flex items-center p-0.5 bg-ed-surface rounded-lg">
            {(['write', 'blocks', 'page'] as EditorMode[]).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                title={MODE_META[m].description}
                aria-label={`${MODE_META[m].label} mode`}
                className={`relative px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 tactile ${
                  mode === m
                    ? 'text-ed-fg font-bold'
                    : 'text-ed-fg-muted hover:text-ed-fg'
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="activeModeTab"
                    className="absolute inset-0 bg-ed-surface-strong rounded-md shadow-sm border border-ed-rule"
                    transition={springConfig}
                  />
                )}
                <span className="relative z-10">{MODE_META[m].label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated Rich Text Toolbar for Page Mode */}
      {mode === 'page' && <EditorToolbar editor={editor} />}

      {/* Floating Selection Bubble Menu */}
      <EditorBubbleMenu editor={editor} />

      {/* Main Document Body with Morphing Transitions */}
      <div className="flex-1 overflow-hidden flex relative">
        {pdfSplitView && pdfAttachment && (
          <div className="w-1/2 border-r border-ed-rule shrink-0">
            <PdfViewer
              archivePath={archivePath}
              pdfPath={pdfAttachment}
              onQuoteExcerpt={(quote, page) => {
                if (!editor) return
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: 'blockquote',
                    content: [
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: `"${quote}"` }],
                      },
                      {
                        type: 'paragraph',
                        content: [{ type: 'text', text: `— Page ${page ?? 1}` }],
                      },
                    ],
                  })
                  .run()
              }}
              onClose={() => handleFrontmatterChange({ ...frontmatter, pdfSplitView: false })}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={springConfig}
            className="w-full h-full flex-1 flex overflow-hidden"
          >
            {mode === 'page' ? (
              <div className={`${pdfSplitView && pdfAttachment ? 'w-1/2' : 'flex-1'} h-full overflow-hidden`}>
                <PageModeCanvas>
                  <FrontmatterPanel data={frontmatter} onChange={handleFrontmatterChange} />
                  <EditorContent editor={editor} className="h-full w-full select-text" />
                  <BacklinksPanel archivePath={archivePath} filePath={filePath} onOpenFile={onOpenFile} />
                </PageModeCanvas>
              </div>
            ) : (
              <div
                className={`overflow-y-auto select-text ${
                  pdfSplitView && pdfAttachment ? 'w-1/2' : 'flex-1'
                } ${FONT_CLASS[fontFamily]}`}
              >
                <div
                  className={`h-full w-full mx-auto transition-all duration-300 ${
                    mode === 'blocks'
                      ? `${fullWidth ? 'max-w-none' : 'max-w-5xl'} pl-14`
                      : fullWidth
                        ? 'max-w-none'
                        : 'max-w-3xl'
                  }`}
                >
                  <FrontmatterPanel data={frontmatter} onChange={handleFrontmatterChange} />
                  {mode === 'blocks' && editor && (
                    <DragHandle editor={editor}>
                      <div className="w-5 h-6 flex items-center justify-center text-ed-fg-muted hover:text-ed-fg cursor-grab active:cursor-grabbing transition-colors rounded hover:bg-ed-surface">
                        <DotsSixVertical size={16} weight="bold" />
                      </div>
                    </DragHandle>
                  )}
                  <EditorContent editor={editor} className="h-full w-full" />
                  <BacklinksPanel archivePath={archivePath} filePath={filePath} onOpenFile={onOpenFile} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
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
