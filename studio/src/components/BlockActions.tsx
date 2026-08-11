import { Editor } from '@tiptap/react'
import {
  Copy,
  Trash,
  TextHOne,
  TextHTwo,
  TextHThree,
  BookOpen,
  Info,
  DotsSixVertical
} from '@phosphor-icons/react'

interface BlockActionsProps {
  editor: Editor
  blockPos: number
}

export function BlockActions({ editor, blockPos }: BlockActionsProps) {
  const duplicateBlock = () => {
    const node = editor.state.doc.nodeAt(blockPos)
    if (!node) return
    editor.chain().focus().insertContentAt(blockPos + node.nodeSize, node.toJSON()).run()
  }

  const deleteBlock = () => {
    const node = editor.state.doc.nodeAt(blockPos)
    if (!node) return
    editor.chain().focus().deleteRange({ from: blockPos, to: blockPos + node.nodeSize }).run()
  }

  const turnIntoHeading = (level: 1 | 2 | 3) => {
    editor.chain().focus().setTextSelection(blockPos + 1).toggleHeading({ level }).run()
  }

  const insertQuran = () => {
    const ref = window.prompt('Quran verse reference:', '1:1-7')
    if (ref) {
      editor.chain().focus().insertContentAt(blockPos, `<quran-embed verses="${ref}"></quran-embed>`).run()
    }
  }

  const insertCallout = () => {
    editor.chain().focus().insertContentAt(blockPos, `<div data-type="callout" data-callout-type="note"><p>Callout text...</p></div>`).run()
  }

  return (
    <div className="flex items-center gap-0.5 p-1 glass-strong border border-ed-rule rounded-lg shadow-elev-md z-40">
      <div className="p-1 text-ed-fg-muted cursor-grab active:cursor-grabbing hover:text-ed-fg">
        <DotsSixVertical size={16} weight="bold" />
      </div>

      <div className="w-px h-3.5 bg-ed-rule mx-0.5" />

      <button
        onClick={() => turnIntoHeading(1)}
        title="Heading 1"
        aria-label="Heading 1"
        className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong transition-colors"
      >
        <TextHOne size={15} weight="bold" />
      </button>

      <button
        onClick={() => turnIntoHeading(2)}
        title="Heading 2"
        aria-label="Heading 2"
        className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong transition-colors"
      >
        <TextHTwo size={15} weight="bold" />
      </button>

      <button
        onClick={() => turnIntoHeading(3)}
        title="Heading 3"
        aria-label="Heading 3"
        className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong transition-colors"
      >
        <TextHThree size={15} weight="bold" />
      </button>

      <div className="w-px h-3.5 bg-ed-rule mx-0.5" />

      <button
        onClick={insertQuran}
        title="Turn into Quran Embed"
        aria-label="Quran embed"
        className="p-1 rounded text-amber-400 hover:bg-amber-500/10 transition-colors"
      >
        <BookOpen size={15} weight="bold" />
      </button>

      <button
        onClick={insertCallout}
        title="Turn into Callout"
        aria-label="Callout"
        className="p-1 rounded text-sky-400 hover:bg-sky-500/10 transition-colors"
      >
        <Info size={15} weight="bold" />
      </button>

      <div className="w-px h-3.5 bg-ed-rule mx-0.5" />

      <button
        onClick={duplicateBlock}
        title="Duplicate Block"
        aria-label="Duplicate block"
        className="p-1 rounded text-ed-fg-muted hover:text-ed-fg hover:bg-ed-surface-strong transition-colors"
      >
        <Copy size={15} weight="regular" />
      </button>

      <button
        onClick={deleteBlock}
        title="Delete Block"
        aria-label="Delete block"
        className="p-1 rounded text-ed-fg-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        <Trash size={15} weight="regular" />
      </button>
    </div>
  )
}
