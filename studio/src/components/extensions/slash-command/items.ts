import type { Editor, Range } from '@tiptap/core'

export interface SlashCommandItem {
  title: string
  description: string
  ref: string
  command: (props: { editor: Editor; range: Range }) => void
}

const QURAN_TRIGGER = /^quran\b\s*/i

export function getSlashCommandItems(query: string): SlashCommandItem[] {
  const trimmed = query.trimStart()
  const isQuranQuery = QURAN_TRIGGER.test(trimmed) || 'quran'.startsWith(trimmed.toLowerCase())

  if (!isQuranQuery) {
    return []
  }

  const ref = trimmed.replace(QURAN_TRIGGER, '').trim()

  return [
    {
      title: 'Quran Verse',
      description: ref ? `Insert ${ref}` : 'e.g. 1:1-7, 2:255',
      ref,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'quranEmbed',
            attrs: { verses: ref || '1:1' },
          })
          .run()
      },
    },
  ]
}
