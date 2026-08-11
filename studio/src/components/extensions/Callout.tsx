import { mergeAttributes, Node } from '@tiptap/core'
import { NodeViewWrapper, NodeViewContent, ReactNodeViewRenderer } from '@tiptap/react'
import { Info, Sparkle, Warning, Star, IconProps } from '@phosphor-icons/react'
import React from 'react'

const CALLOUT_META: Record<string, { icon: React.ComponentType<IconProps>; className: string }> = {
  note: { icon: Info, className: 'border-ed-rule bg-ed-surface' },
  tip: { icon: Sparkle, className: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' },
  warning: { icon: Warning, className: 'border-amber-500/30 bg-amber-500/5 text-amber-300' },
  important: { icon: Star, className: 'border-red-500/30 bg-red-500/5 text-red-300' },
}

function CalloutComponent({ node, updateAttributes }: any) {
  const type: string = node.attrs.type
  const title: string = node.attrs.title
  const meta = CALLOUT_META[type] ?? CALLOUT_META.note
  const Icon = meta.icon
  const placeholder = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <NodeViewWrapper className={`callout-wrapper my-3 border-l-2 rounded-r-md pl-4 pr-3 py-2 ${meta.className}`}>
      <div className="flex items-center gap-2 text-xs font-bold text-ed-fg mb-1 select-none" contentEditable={false}>
        <Icon size={16} weight="bold" className="shrink-0" />
        <input
          value={title}
          placeholder={placeholder}
          onChange={(e) => updateAttributes({ title: e.target.value })}
          className="bg-transparent outline-none flex-1 placeholder:text-ed-fg-muted font-semibold"
        />
      </div>
      <NodeViewContent className="text-xs text-ed-fg-muted [&_p]:my-1" />
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
