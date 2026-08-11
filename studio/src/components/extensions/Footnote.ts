import { Node, mergeAttributes, InputRule } from '@tiptap/core'

export interface FootnoteOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (id?: string, content?: string) => ReturnType
    }
  }
}

export const FootnoteRef = Node.create<FootnoteOptions>({
  name: 'footnoteRef',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: '1',
        parseHTML: (element) => element.getAttribute('data-footnote-id'),
        renderHTML: (attributes) => ({
          'data-footnote-id': attributes.id
        })
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote-id]'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'footnote-ref text-amber-400 cursor-pointer font-bold select-none px-0.5 hover:underline' }), `[${HTMLAttributes['data-footnote-id'] || '1'}]`]
  },

  addCommands() {
    return {
      insertFootnote:
        (id = '1') =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { id }
          })
        }
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[\^(\d+)\]$/,
        handler: ({ state, range, match }) => {
          const id = match[1]
          const { tr } = state
          tr.delete(range.from, range.to)
          const node = this.type.create({ id })
          tr.insert(range.from, node)
        }
      })
    ]
  }
})
