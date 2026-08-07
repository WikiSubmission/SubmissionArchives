import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { parseFrontmatter, stringifyWithFrontmatter } from '../lib/frontmatter'
import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { QuranEmbed } from './extensions/QuranEmbed'
import { SlashCommand } from './extensions/slash-command/SlashCommand'
import { WikiLink } from './extensions/WikiLink'
import FrontmatterPanel from './FrontmatterPanel'

type EditorMode = 'obsidian' | 'cabinet' | 'docs'

const WELCOME_CONTENT = `
  <h2>SubmissionArchives Studio</h2>
  <p>This is a <strong>local-first</strong> knowledge base and scholarly writing tool.</p>
  <quran-embed verses="1:1-2" showenglish="true"></quran-embed>
  <p>Open or create a note from the Archive Explorer to start writing. Type <code>/quran 1:1-7</code> and press Enter to insert a verse block, or <code>[[Page Name]]</code> to link another note.</p>
`

interface EditorProps {
  filePath: string | null
  onWikiLinkNavigate: (pageName: string) => void
}

export default function Editor({ filePath, onWikiLinkNavigate }: EditorProps) {
  const [mode, setMode] = useState<EditorMode>('obsidian')
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({})
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeFilePath = useRef<string | null>(null)
  const frontmatterRef = useRef<Record<string, unknown>>({})

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
        .then(() => setStatus('saved'))
        .catch(() => setStatus('error'))
    }, 500)
  }

  const editor = useEditor({
    extensions: [
      StarterKit,
      QuranEmbed,
      SlashCommand,
      Markdown,
      WikiLink.configure({ onNavigate: onWikiLinkNavigate }),
    ],
    content: WELCOME_CONTENT,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] w-full p-8',
      },
    },
    onUpdate: ({ editor: instance }) => scheduleSave(instance),
  })

  useEffect(() => {
    activeFilePath.current = filePath
    if (!editor) return

    if (!filePath) {
      editor.commands.setContent(WELCOME_CONTENT, { emitUpdate: false })
      frontmatterRef.current = {}
      setFrontmatter({})
      setStatus('idle')
      return
    }

    invoke<string>('read_note', { path: filePath })
      .then((raw) => {
        const { data, content } = parseFrontmatter(raw)
        editor.commands.setContent(content, { emitUpdate: false })
        frontmatterRef.current = data
        setFrontmatter(data)
        setStatus('idle')
      })
      .catch(() => setStatus('error'))
  }, [filePath, editor])

  const handleFrontmatterChange = (next: Record<string, unknown>) => {
    frontmatterRef.current = next
    setFrontmatter(next)
    scheduleSave(editor)
  }

  return (
    <div className="w-full h-full bg-white dark:bg-[#0f0f11] text-gray-900 dark:text-gray-100 flex flex-col relative">
      {/* Mode Toggle Toolbar */}
      <div className="absolute top-4 right-8 z-10 flex items-center gap-3">
        {filePath && (
          <span key={status} className="text-xs text-white/30 font-mono animate-fade-in">
            {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : status === 'error' ? 'Error' : ''}
          </span>
        )}
        <div className="flex gap-2 bg-[#1c1c1f] p-1 rounded-lg border border-white/10 shadow-lg">
          {(['obsidian', 'cabinet', 'docs'] as EditorMode[]).map((m) => (
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

      <div className="flex-1 overflow-y-auto">
        <div
          className={`h-full w-full mx-auto transition-all duration-300 ${
            mode === 'docs'
              ? 'max-w-[800px] bg-white text-black mt-8 shadow-2xl rounded-sm p-4 min-h-[1056px]'
              : mode === 'cabinet'
                ? 'max-w-5xl pl-16'
                : 'max-w-3xl'
          }`}
        >
          {filePath && <FrontmatterPanel data={frontmatter} onChange={handleFrontmatterChange} />}
          <EditorContent editor={editor} className="h-full w-full" />
        </div>
      </div>
    </div>
  )
}
