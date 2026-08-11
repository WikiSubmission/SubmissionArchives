import { Extension, textInputRule } from '@tiptap/core'

export interface SmartTypographyOptions {
  activeMode?: 'write' | 'blocks' | 'page'
}

export const SmartTypography = Extension.create<SmartTypographyOptions>({
  name: 'smartTypography',

  addOptions() {
    return {
      activeMode: 'page'
    }
  },

  addInputRules() {
    if (this.options.activeMode !== 'page') return []

    return [
      // Em dash: -- -> —
      textInputRule({
        find: /--$/,
        replace: '—'
      }),
      // Ellipsis: ... -> …
      textInputRule({
        find: /\.\.\.$/,
        replace: '…'
      }),
      // Open double quote: " text -> “ text
      textInputRule({
        find: /(?:^|[\s{[(<])"$/,
        replace: '“'
      }),
      // Close double quote: text" -> text”
      textInputRule({
        find: /"$/,
        replace: '”'
      }),
      // Open single quote: ' text -> ‘ text
      textInputRule({
        find: /(?:^|[\s{[(<])'$/,
        replace: '‘'
      }),
      // Close single quote: text' -> text’
      textInputRule({
        find: /'$/,
        replace: '’'
      })
    ]
  }
})
