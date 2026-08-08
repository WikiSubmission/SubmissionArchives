import type { Editor, Range } from '@tiptap/core'

export interface SlashCommandItem {
  title: string
  description: string
  command: (props: { editor: Editor; range: Range }) => void
}

const QURAN_TRIGGER = /^quran\b\s*/i
const INSERT_STYLE_OVERRIDE = /^(inline|block)\b\s*/i
const CALLOUT_TYPES = ['note', 'tip', 'warning', 'important'] as const

// Set by Editor.tsx whenever settings.quran.insertStyle changes — a plain
// module-level default rather than threading settings through Tiptap's
// extension config, since this only needs to be current at the moment a
// command runs, not reactively re-rendered.
let defaultQuranInsertStyle: 'block' | 'inline' = 'block'

export function setDefaultQuranInsertStyle(style: 'block' | 'inline') {
  defaultQuranInsertStyle = style
}

function calloutCommand(type: string): SlashCommandItem {
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return {
    title: `${label} callout`,
    description: `Insert a ${type} callout`,
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

  for (const type of CALLOUT_TYPES) {
    if (type.startsWith(lower)) {
      items.push(calloutCommand(type))
    }
  }

  if ('arabic'.startsWith(lower)) {
    items.push({
      title: 'Arabic block',
      description: 'Insert a right-to-left writing block',
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

  return items
}
