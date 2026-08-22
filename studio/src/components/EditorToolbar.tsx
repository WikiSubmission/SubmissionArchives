import { type Editor } from '@tiptap/react'
import {
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  ListBullets,
  ListNumbers,
  Quotes,
  Eraser,
  BookOpen
} from '@phosphor-icons/react'

interface EditorToolbarProps {
  editor: Editor | null
}

export default function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="h-10 shrink-0 bg-ed-surface/90 border-b border-ed-rule flex items-center px-4 gap-1.5 z-30 select-none overflow-x-auto no-scrollbar">
      {/* Headings Selector Dropdown */}
      <select
        onChange={(e) => {
          const val = e.target.value
          if (val === 'p') {
            editor.chain().focus().setParagraph().run()
          } else if (val === 'h1') {
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          } else if (val === 'h2') {
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          } else if (val === 'h3') {
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
        }}
        value={
          editor.isActive('heading', { level: 1 })
            ? 'h1'
            : editor.isActive('heading', { level: 2 })
              ? 'h2'
              : editor.isActive('heading', { level: 3 })
                ? 'h3'
                : 'p'
        }
        className="text-xs text-ed-fg bg-ed-surface hover:bg-ed-surface-strong border border-ed-rule rounded px-2 py-1 outline-none font-medium cursor-pointer transition-colors"
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <div className="w-px h-4 bg-ed-rule mx-1" />

      {/* Formatting Marks */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('bold')
            ? 'bg-ed-surface-strong text-ed-fg font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        <TextB size={16} weight={editor.isActive('bold') ? 'bold' : 'regular'} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('italic')
            ? 'bg-ed-surface-strong text-ed-fg font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        <TextItalic size={16} weight={editor.isActive('italic') ? 'bold' : 'regular'} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
        aria-label="Strikethrough"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('strike')
            ? 'bg-ed-surface-strong text-ed-fg font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        <TextStrikethrough size={16} weight={editor.isActive('strike') ? 'bold' : 'regular'} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
        aria-label="Inline Code"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('code')
            ? 'bg-ed-surface-strong text-ed-fg font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        <Code size={16} weight={editor.isActive('code') ? 'bold' : 'regular'} />
      </button>

      <div className="w-px h-4 bg-ed-rule mx-1" />

      {/* Lists & Quotes */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
        aria-label="Bullet List"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('bulletList')
            ? 'bg-ed-surface-strong text-ed-fg font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        <ListBullets size={16} weight={editor.isActive('bulletList') ? 'bold' : 'regular'} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
        aria-label="Numbered List"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('orderedList')
            ? 'bg-ed-surface-strong text-ed-fg font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        <ListNumbers size={16} weight={editor.isActive('orderedList') ? 'bold' : 'regular'} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
        aria-label="Blockquote"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('blockquote')
            ? 'bg-ed-surface-strong text-ed-fg font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
      >
        <Quotes size={16} weight={editor.isActive('blockquote') ? 'fill' : 'regular'} />
      </button>

      <div className="w-px h-4 bg-ed-rule mx-1" />

      {/* Formatting Utilities & Quick Quran Insert */}
      <button
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear Formatting"
        aria-label="Clear Formatting"
        className="p-1.5 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface transition-all"
      >
        <Eraser size={16} weight="regular" />
      </button>

      <button
        onClick={() => {
          const ref = window.prompt('Insert Quran Verse reference (e.g. 1:1 or 2:255)', '1:1-7')
          if (ref) {
            editor.chain().focus().insertContent(`<quran-embed verses="${ref}"></quran-embed>`).run()
          }
        }}
        title="Insert Quran Verse (/quran)"
        aria-label="Insert Quran Verse"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-ed-accent-soft text-ed-accent hover:bg-ed-accent-soft text-xs font-medium border border-ed-accent/25 transition-all ml-auto"
      >
        <BookOpen size={15} weight="bold" />
        <span>+ Quran</span>
      </button>
    </div>
  )
}
