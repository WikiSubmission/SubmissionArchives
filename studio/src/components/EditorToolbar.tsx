import { type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
  BookOpen,
} from 'lucide-react'

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
        className="text-xs text-white/80 bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 rounded px-2 py-1 outline-none font-medium cursor-pointer transition-colors"
      >
        <option value="p" className="bg-[#1c1c1f]">Normal text</option>
        <option value="h1" className="bg-[#1c1c1f]">Heading 1</option>
        <option value="h2" className="bg-[#1c1c1f]">Heading 2</option>
        <option value="h3" className="bg-[#1c1c1f]">Heading 3</option>
      </select>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Formatting Marks */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (Ctrl+B)"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('bold')
            ? 'bg-white/20 text-white font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Bold size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (Ctrl+I)"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('italic')
            ? 'bg-white/20 text-white font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Italic size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('strike')
            ? 'bg-white/20 text-white font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Strikethrough size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('code')
            ? 'bg-white/20 text-white font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Code size={14} />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Lists & Quotes */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('bulletList')
            ? 'bg-white/20 text-white font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <List size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Numbered List"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('orderedList')
            ? 'bg-white/20 text-white font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <ListOrdered size={14} />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
        className={`p-1.5 rounded transition-all ${
          editor.isActive('blockquote')
            ? 'bg-white/20 text-white font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <Quote size={14} />
      </button>

      <div className="w-px h-4 bg-white/10 mx-1" />

      {/* Formatting Utilities & Quick Quran Insert */}
      <button
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        title="Clear Formatting"
        className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
      >
        <RemoveFormatting size={14} />
      </button>

      <button
        onClick={() => {
          const ref = window.prompt('Insert Quran Verse reference (e.g. 1:1 or 2:255)', '1:1-7')
          if (ref) {
            editor.chain().focus().insertContent(`<quran-embed verses="${ref}"></quran-embed>`).run()
          }
        }}
        title="Insert Quran Verse (/quran)"
        className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-medium border border-amber-500/20 transition-all ml-auto"
      >
        <BookOpen size={13} />
        <span>+ Quran</span>
      </button>
    </div>
  )
}
