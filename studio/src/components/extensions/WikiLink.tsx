import { mergeAttributes, Node, nodeInputRule } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'

const WIKI_LINK_INPUT_REGEX = /\[\[([^[\]]+)\]\]$/

export interface WikiLinkOptions {
  onNavigate: (pageName: string) => void
}

function WikiLinkComponent({ node, extension }: any) {
  const pageName: string = node.attrs.pageName
  const onNavigate = extension.options.onNavigate as WikiLinkOptions['onNavigate']

  return (
    <NodeViewWrapper as="span">
      <button
        onClick={() => onNavigate(pageName)}
        className="text-ed-accent hover:text-ed-accent-strong hover:underline decoration-ed-accent/40 transition-colors"
      >
        [[{pageName}]]
      </button>
    </NodeViewWrapper>
  )
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return {
      onNavigate: () => {},
    }
  },

  addAttributes() {
    return {
      pageName: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-page-name') ?? '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-wiki-link]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(HTMLAttributes, { 'data-wiki-link': '', 'data-page-name': HTMLAttributes.pageName }),
      `[[${HTMLAttributes.pageName}]]`,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiLinkComponent)
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: WIKI_LINK_INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => ({ pageName: match[1].trim() }),
      }),
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`[[${node.attrs.pageName}]]`)
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.before('link', 'wiki_link', (state: any, silent: boolean) => {
              const src = state.src
              const start = state.pos
              if (src[start] !== '[' || src[start + 1] !== '[') return false

              const end = src.indexOf(']]', start + 2)
              if (end === -1) return false

              const pageName = src.slice(start + 2, end).trim()
              if (!pageName) return false

              if (!silent) {
                const token = state.push('wiki_link', '', 0)
                token.attrSet('pageName', pageName)
              }

              state.pos = end + 2
              return true
            })

            markdownit.renderer.rules.wiki_link = (tokens: any, idx: number) => {
              const pageName = tokens[idx].attrGet('pageName')
              return `<a data-wiki-link data-page-name="${pageName}">[[${pageName}]]</a>`
            }
          },
        },
      },
    }
  },
})
