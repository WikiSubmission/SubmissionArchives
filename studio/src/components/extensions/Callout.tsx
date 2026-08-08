import { mergeAttributes, Node } from '@tiptap/core'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import { Info, Lightbulb, TriangleAlert, Star } from 'lucide-react'

const CALLOUT_META: Record<string, { icon: typeof Info; className: string }> = {
  note: { icon: Info, className: 'border-white/25 bg-white/5' },
  tip: { icon: Lightbulb, className: 'border-ed-accent/30 bg-ed-accent/5' },
  warning: { icon: TriangleAlert, className: 'border-amber-500/30 bg-amber-500/5' },
  important: { icon: Star, className: 'border-red-500/30 bg-red-500/5' },
}

function CalloutComponent({ node, updateAttributes }: any) {
  const type: string = node.attrs.type
  const title: string = node.attrs.title
  const meta = CALLOUT_META[type] ?? CALLOUT_META.note
  const Icon = meta.icon
  const placeholder = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <NodeViewWrapper className={`callout-wrapper my-3 border-l-2 rounded-r-md pl-4 pr-3 py-2 ${meta.className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-1 select-none" contentEditable={false}>
        <Icon size={15} className="shrink-0" />
        <input
          value={title}
          placeholder={placeholder}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          className="bg-transparent outline-none flex-1 placeholder:text-white/40"
        />
      </div>
      <NodeViewContent className="text-sm text-white/70 [&_p]:my-1" />
    </NodeViewWrapper>
  )
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'note',
        parseHTML: (element) => element.getAttribute('data-callout-type') ?? 'note',
        renderHTML: (attributes) => ({ 'data-callout-type': attributes.type }),
      },
      title: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-callout-title') ?? '',
        renderHTML: (attributes) => ({ 'data-callout-title': attributes.title }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0]
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent)
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const header = `[!${node.attrs.type}]${node.attrs.title ? ` ${node.attrs.title}` : ''}`
          state.wrapBlock('> ', null, node, () => {
            state.write(header)
            state.ensureNewLine()
            state.renderContent(node)
          })
        },
        parse: {
          // Callouts are just blockquotes whose first line is "[!type] Title" — markdown-it's
          // own blockquote rule already handles the tricky '>' line-continuation parsing, so
          // this only needs a post-pass that reclassifies the token pair and strips that header line.
          setup(markdownit: any) {
            markdownit.core.ruler.push('callout', (state: any) => {
              const tokens = state.tokens

              for (let i = 0; i < tokens.length; i++) {
                if (tokens[i].type !== 'blockquote_open') continue

                const para = tokens[i + 1]
                const inline = tokens[i + 2]
                const paraClose = tokens[i + 3]
                if (
                  !para ||
                  para.type !== 'paragraph_open' ||
                  !inline ||
                  inline.type !== 'inline' ||
                  !paraClose ||
                  paraClose.type !== 'paragraph_close'
                ) {
                  continue
                }

                // A blockquote's consecutive non-blank lines merge into ONE paragraph
                // with soft breaks — only a blank line inside the '>' block starts a new
                // paragraph. So the "[!type] Title" marker is only ever the FIRST LINE of
                // that first paragraph, not the whole thing; body text on the very next
                // line (the common case — no blank line after the marker) rides along in
                // the same inline token and must be split back out, not matched against.
                const raw = inline.content
                const newlineIndex = raw.indexOf('\n')
                const firstLine = newlineIndex === -1 ? raw : raw.slice(0, newlineIndex)
                const rest = newlineIndex === -1 ? '' : raw.slice(newlineIndex + 1)

                const match = /^\[!(\w+)\]\s*(.*)$/.exec(firstLine.trim())
                if (!match) continue

                let depth = 1
                let closeIndex = -1
                for (let j = i + 1; j < tokens.length; j++) {
                  if (tokens[j].type === 'blockquote_open') depth++
                  else if (tokens[j].type === 'blockquote_close') {
                    depth--
                    if (depth === 0) {
                      closeIndex = j
                      break
                    }
                  }
                }
                if (closeIndex === -1) continue

                tokens[i].type = 'callout_open'
                tokens[i].tag = 'div'
                tokens[i].attrSet('type', match[1].toLowerCase())
                tokens[i].attrSet('title', match[2].trim())
                tokens[closeIndex].type = 'callout_close'
                tokens[closeIndex].tag = 'div'

                if (rest.trim().length > 0) {
                  const restInline = new state.Token('inline', '', 0)
                  restInline.content = rest
                  restInline.children = []
                  state.md.inline.parse(rest, state.md, state.env, restInline.children)

                  tokens.splice(
                    i + 1,
                    3,
                    new state.Token('paragraph_open', 'p', 1),
                    restInline,
                    new state.Token('paragraph_close', 'p', -1),
                  )
                } else {
                  tokens.splice(i + 1, 3)
                }
              }
            })

            markdownit.renderer.rules.callout_open = (tokens: any, idx: number) => {
              const token = tokens[idx]
              const type = token.attrGet('type')
              const title = token.attrGet('title') || ''
              return `<div data-callout data-callout-type="${type}" data-callout-title="${title}">\n`
            }
            markdownit.renderer.rules.callout_close = () => `</div>\n`
          },
        },
      },
    }
  },
})
