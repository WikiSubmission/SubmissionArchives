import { mergeAttributes, Node } from '@tiptap/core'

/**
 * A dedicated RTL writing block, distinct from just typing Arabic inline —
 * inserted via `/arabic`. Serializes to a `::: arabic ... :::` fenced
 * container so the markdown stays portable and readable outside Studio.
 */
export const ArabicBlock = Node.create({
  name: 'arabicBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-arabic-block]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-arabic-block': '',
        dir: 'rtl',
        class: 'font-arabic text-right text-xl leading-loose my-2 py-2 border-y border-ed-rule',
      }),
      0,
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write('::: arabic')
          state.ensureNewLine()
          state.renderContent(node)
          state.ensureNewLine()
          state.write(':::')
          state.closeBlock(node)
        },
        parse: {
          // A from-scratch fenced container (unlike Callout, which piggybacks on
          // markdown-it's blockquote rule): the `::: arabic` / `:::` markers are
          // unambiguous block boundaries we own outright, so there's no paragraph-
          // merging ambiguity to work around here.
          setup(markdownit: any) {
            markdownit.block.ruler.before(
              'fence',
              'arabic_block',
              (state: any, startLine: number, endLine: number, silent: boolean) => {
                const pos = state.bMarks[startLine] + state.tShift[startLine]
                const max = state.eMarks[startLine]
                const line = state.src.slice(pos, max).trim()
                if (line !== '::: arabic') return false
                if (silent) return true

                let nextLine = startLine + 1
                let found = false
                while (nextLine < endLine) {
                  const p = state.bMarks[nextLine] + state.tShift[nextLine]
                  const m = state.eMarks[nextLine]
                  if (state.src.slice(p, m).trim() === ':::') {
                    found = true
                    break
                  }
                  nextLine++
                }
                if (!found) return false

                const oldParentType = state.parentType
                const oldLineMax = state.lineMax
                state.parentType = 'arabic_block'
                state.lineMax = nextLine

                const token = state.push('arabic_block_open', 'div', 1)
                token.map = [startLine, nextLine]

                state.md.block.tokenize(state, startLine + 1, nextLine)

                state.push('arabic_block_close', 'div', -1)

                state.parentType = oldParentType
                state.lineMax = oldLineMax
                state.line = nextLine + 1
                return true
              },
            )

            markdownit.renderer.rules.arabic_block_open = () => '<div data-arabic-block dir="rtl">\n'
            markdownit.renderer.rules.arabic_block_close = () => '</div>\n'
          },
        },
      },
    }
  },
})
