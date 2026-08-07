import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Verse {
  chapter: number
  verse: number
  arabic: string
  english: string
}

function QuranEmbedComponent({ node, updateAttributes }: any) {
  const verses: string = node.attrs.verses
  const showEnglish: boolean = node.attrs.showEnglish

  const [result, setResult] = useState<Verse[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    setResult(null)

    invoke<Verse[]>('search_verses', { query: verses })
      .then((data) => {
        if (!cancelled) setResult(data)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })

    return () => {
      cancelled = true
    }
  }, [verses])

  return (
    <NodeViewWrapper className="quran-embed-wrapper my-4 border border-emerald-500/30 rounded-lg p-4 bg-emerald-500/5 select-none relative group animate-embed-in">
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => updateAttributes({ showEnglish: !showEnglish })}
          className="text-xs bg-black/50 text-white px-2 py-1 rounded"
        >
          Toggle English
        </button>
      </div>

      {error && <div className="text-sm text-red-400 font-mono">{error}</div>}

      {!error && !result && <div className="text-sm text-white/40 animate-pulse">Loading {verses}...</div>}

      {result &&
        result.map((v) => (
          <div key={`${v.chapter}:${v.verse}`} className="mb-3 last:mb-0">
            <div className="text-right font-arabic text-2xl leading-loose text-emerald-400" dir="rtl">
              {v.arabic} <span className="text-emerald-600/70 text-base">({v.verse})</span>
            </div>
            {showEnglish && (
              <div className="text-left text-sm text-gray-400 mt-1">
                {v.english} <span className="text-gray-600">({v.chapter}:{v.verse})</span>
              </div>
            )}
          </div>
        ))}

      <div className="text-xs text-gray-500 mt-2 font-mono border-t border-emerald-500/20 pt-2">
        Reference: {verses}
      </div>
    </NodeViewWrapper>
  )
}

export const QuranEmbed = Node.create({
  name: 'quranEmbed',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      verses: {
        default: '1:1-2',
        parseHTML: (element) => element.getAttribute('verses') ?? '1:1-2',
      },
      showEnglish: {
        default: true,
        parseHTML: (element) => element.getAttribute('showenglish') !== 'false',
        renderHTML: (attributes) => ({ showEnglish: String(attributes.showEnglish) }),
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'quran-embed' },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['quran-embed', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuranEmbedComponent)
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const verses = String(node.attrs.verses)
          const suffix = node.attrs.showEnglish === false ? ` showEnglish="false"` : ''
          state.write(`::: quran {verses="${verses}"${suffix}} :::`)
          state.closeBlock(node)
        },
        parse: {
          setup(markdownit: any) {
            markdownit.block.ruler.before(
              'fence',
              'quran_embed',
              (state: any, startLine: number, _endLine: number, silent: boolean) => {
                const pos = state.bMarks[startLine] + state.tShift[startLine]
                const max = state.eMarks[startLine]
                const line = state.src.slice(pos, max).trim()
                const match = /^:::\s*quran\s*\{([^}]*)\}\s*:::$/.exec(line)
                if (!match) return false
                if (silent) return true

                const attrsStr = match[1]
                const versesMatch = /verses="([^"]*)"/.exec(attrsStr)
                const showEnglishMatch = /showEnglish="([^"]*)"/.exec(attrsStr)

                const token = state.push('quran_embed', '', 0)
                token.attrSet('verses', versesMatch?.[1] ?? '1:1')
                token.attrSet('showenglish', showEnglishMatch?.[1] !== 'false' ? 'true' : 'false')
                token.map = [startLine, startLine + 1]

                state.line = startLine + 1
                return true
              }
            )

            markdownit.renderer.rules.quran_embed = (tokens: any, idx: number) => {
              const token = tokens[idx]
              const verses = token.attrGet('verses')
              const showEnglish = token.attrGet('showenglish')
              return `<quran-embed verses="${verses}" showenglish="${showEnglish}"></quran-embed>\n`
            }
          },
        },
      },
    }
  },
})
