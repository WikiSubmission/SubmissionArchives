import type { Editor, Range } from '@tiptap/core'
import { IconMap } from '../../ui/Icons'

export interface SlashCommandItem {
  title: string
  description: string
  category?: 'Quran' | 'Formatting' | 'Media' | 'Callouts'
  icon?: keyof typeof IconMap
  command: (props: { editor: Editor; range: Range }) => void
}

const QURAN_TRIGGER = /^quran\b\s*/i
const INSERT_STYLE_OVERRIDE = /^(inline|block)\b\s*/i
const CALLOUT_TYPES = ['note', 'tip', 'warning', 'important'] as const

let defaultQuranInsertStyle: 'block' | 'inline' = 'block'

export function setDefaultQuranInsertStyle(style: 'block' | 'inline') {
  defaultQuranInsertStyle = style
}

function calloutCommand(type: string): SlashCommandItem {
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return {
    title: `${label} callout`,
    description: `Insert a ${type} callout box`,
    category: 'Callouts',
    icon: type === 'warning' ? 'warning' : type === 'tip' ? 'sparkle' : 'info',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertContent({ type: 'callout', attrs: { type, title: '' }, content: [{ type: 'paragraph' }] })
        .run()
    },
  }
}

export function getSlashCommandItems(query: string): SlashCommandItem[] {
  const trimmed = query.trimStart()
  const lower = trimmed.toLowerCase()
  const items: SlashCommandItem[] = []

  // Quran commands
  if (QURAN_TRIGGER.test(trimmed) || 'quran'.startsWith(lower)) {
    const afterTrigger = trimmed.replace(QURAN_TRIGGER, '').trim()
    const styleOverride = INSERT_STYLE_OVERRIDE.exec(afterTrigger)?.[1]?.toLowerCase() as
      | 'block'
      | 'inline'
      | undefined
    const ref = afterTrigger.replace(INSERT_STYLE_OVERRIDE, '').trim()
    const style = styleOverride ?? defaultQuranInsertStyle

    items.push({
      title: `Quran Verse${style === 'inline' ? ' (inline)' : ''}`,
      description: ref ? `Insert ${ref}` : 'e.g. 1:1-7, 2:255 — or "inline 2:255" to override style',
      category: 'Quran',
      icon: 'book',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: style === 'inline' ? 'quranEmbedInline' : 'quranEmbed',
            attrs: { verses: ref || '1:1' },
          })
          .run()
      },
    })
  }

  if ('arabic'.startsWith(lower)) {
    items.push({
      title: 'Arabic block',
      description: 'Insert a right-to-left writing block',
      category: 'Quran',
      icon: 'quotes',
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({ type: 'arabicBlock', content: [{ type: 'paragraph' }] })
          .run()
      },
    })
  }

  // Formatting commands
  if (!lower || 'heading 1'.startsWith(lower) || 'h1'.startsWith(lower)) {
    items.push({
      title: 'Heading 1',
      description: 'Large section heading',
      category: 'Formatting',
      icon: 'heading',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
      }
    })
  }

  if (!lower || 'heading 2'.startsWith(lower) || 'h2'.startsWith(lower)) {
    items.push({
      title: 'Heading 2',
      description: 'Medium section heading',
      category: 'Formatting',
      icon: 'heading',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
      }
    })
  }

  if (!lower || 'bullet list'.startsWith(lower) || 'bullet'.startsWith(lower)) {
    items.push({
      title: 'Bullet List',
      description: 'Create a simple bulleted list',
      category: 'Formatting',
      icon: 'listBullets',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
      }
    })
  }

  if (!lower || 'numbered list'.startsWith(lower) || 'number'.startsWith(lower)) {
    items.push({
      title: 'Numbered List',
      description: 'Create an ordered numbered list',
      category: 'Formatting',
      icon: 'listNumbers',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run()
      }
    })
  }

  // Callouts
  for (const type of CALLOUT_TYPES) {
    if (type.startsWith(lower) || !lower) {
      items.push(calloutCommand(type))
    }
  }

  return items
}
