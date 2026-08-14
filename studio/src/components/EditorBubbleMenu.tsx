import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  TextB,
  TextItalic,
  TextStrikethrough,
  Code,
  Quotes,
  TextHOne,
  TextHTwo,
  TextHThree
} from '@phosphor-icons/react'

interface EditorBubbleMenuProps {
  editor: Editor | null
}

export default function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      const { from, to, empty } = editor.state.selection
      if (empty || from === to) {
        setVisible(false)
        return
      }

      try {
        const start = editor.view.coordsAtPos(from)
        const end = editor.view.coordsAtPos(to)
        setCoords({
          top: Math.max(10, Math.min(start.top, end.top) - 42),
          left: (start.left + end.right) / 2,
        })
        setVisible(true)
      } catch {
        setVisible(false)
      }
    }

    editor.on('selectionUpdate', handleUpdate)
    return () => {
      editor.off('selectionUpdate', handleUpdate)
    }
  }, [editor])

  if (!editor || !visible || !coords) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        transform: 'translateX(-50%)',
      }}
      className="flex items-center gap-0.5 p-1 glass-strong rounded-xl border border-ed-rule shadow-elev-xl z-50 animate-slide-up-fade select-none"
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleBold().run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('bold')
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Bold (Ctrl+B)"
      >
        <TextB size={14} weight="bold" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleItalic().run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('italic')
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Italic (Ctrl+I)"
      >
        <TextItalic size={14} weight="bold" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleStrike().run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('strike')
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Strikethrough"
      >
        <TextStrikethrough size={14} weight="bold" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleCode().run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('code')
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Inline Code"
      >
        <Code size={14} weight="bold" />
      </button>

      <div className="w-px h-3.5 bg-ed-rule mx-0.5" />

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('heading', { level: 1 })
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Heading 1"
      >
        <TextHOne size={14} weight="bold" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('heading', { level: 2 })
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Heading 2"
      >
        <TextHTwo size={14} weight="bold" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('heading', { level: 3 })
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Heading 3"
      >
        <TextHThree size={14} weight="bold" />
      </button>

      <button
        onMouseDown={(e) => {
          e.preventDefault()
          editor.chain().focus().toggleBlockquote().run()
        }}
        className={`p-1.5 rounded-lg text-xs transition-colors ${
          editor.isActive('blockquote')
            ? 'bg-amber-500 text-black font-bold'
            : 'text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface'
        }`}
        title="Blockquote"
      >
        <Quotes size={14} weight="bold" />
      </button>
    </div>
  )
}
