import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface MarkdownSyntaxHighlightOptions {
  activeMode?: 'write' | 'blocks' | 'page'
}

export const MarkdownSyntaxHighlight = Extension.create<MarkdownSyntaxHighlightOptions>({
  name: 'markdownSyntaxHighlight',

  addOptions() {
    return {
      activeMode: 'write'
    }
  },

  addProseMirrorPlugins() {
    const extension = this

    return [
      new Plugin({
        key: new PluginKey('markdownSyntaxHighlight'),
        state: {
          init(_, { doc }) {
            return buildDecorations(doc, extension.options.activeMode)
          },
          apply(tr, oldSet, _oldState, newState) {
            if (tr.docChanged || tr.getMeta('modeChanged')) {
              return buildDecorations(newState.doc, extension.options.activeMode)
            }
            return oldSet.map(tr.mapping, tr.doc)
          }
        },
        props: {
          decorations(state) {
            return this.getState(state)
          }
        }
      })
    ]
  }
})

function buildDecorations(doc: any, mode?: string): DecorationSet {
  if (mode !== 'write') {
    return DecorationSet.empty
  }

  const decorations: Decoration[] = []

  doc.descendants((node: any, pos: number) => {
    if (!node.isText || !node.text) return

    const text = node.text

    // Bold **text**
    const boldRegex = /(\*\*|__)(.*?)\1/g
    let match
    while ((match = boldRegex.exec(text)) !== null) {
      const from = pos + match.index
      const to = from + match[0].length
      decorations.push(
        Decoration.inline(from, to, {
          class: 'md-syntax-bold font-bold text-ed-accent/90'
        })
      )
    }

    // Italic *text*
    const italicRegex = /(\*|_)(.*?)\1/g
    while ((match = italicRegex.exec(text)) !== null) {
      if (text.slice(match.index, match.index + 2) === '**') continue
      const from = pos + match.index
      const to = from + match[0].length
      decorations.push(
        Decoration.inline(from, to, {
          class: 'md-syntax-italic italic text-ed-accent/80'
        })
      )
    }

    // Code `text`
    const codeRegex = /`([^`]+)`/g
    while ((match = codeRegex.exec(text)) !== null) {
      const from = pos + match.index
      const to = from + match[0].length
      decorations.push(
        Decoration.inline(from, to, {
          class: 'md-syntax-code font-mono text-ed-success/90 bg-ed-success-soft/40 px-1 rounded'
        })
      )
    }

    // Headings #, ##, ###
    if (pos === 1 || text.startsWith('#')) {
      const headingRegex = /^(#{1,6})\s+(.*)$/g
      while ((match = headingRegex.exec(text)) !== null) {
        const from = pos + match.index
        const to = from + match[1].length
        decorations.push(
          Decoration.inline(from, to, {
            class: 'md-syntax-heading font-mono font-bold text-ed-accent/80'
          })
        )
      }
    }
  })

  return DecorationSet.create(doc, decorations)
}
