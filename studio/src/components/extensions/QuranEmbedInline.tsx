import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useSettings } from '../../hooks/useSettings'

interface Verse {
  chapter: number
  verse: number
  arabic: string
  english: string
}

function QuranEmbedInlineComponent({ node }: any) {
  const { settings } = useSettings()
  const verses: string = node.attrs.verses
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

  if (error) {
    return (
      <NodeViewWrapper as="span" className="text-red-400 text-xs font-mono">
        {error}
      </NodeViewWrapper>
    )
  }

  if (!result) {
    return (
      <NodeViewWrapper as="span" className="text-white/30 text-xs">
        Loading {verses}...
      </NodeViewWrapper>
    )
  }

  const showArabic = settings.quran.showMode !== 'translation'
  const showTranslation = settings.quran.showMode !== 'arabic'

  return (
    <NodeViewWrapper
      as="span"
      className="quran-embed-inline bg-qv-tint text-qv-accent rounded px-1.5 py-0.5 mx-0.5 select-none"
    >
      {result.map((v, i) => (
        <span key={`${v.chapter}:${v.verse}`}>
          {i > 0 && '; '}
          {showArabic && (
            <span className="font-arabic" dir="rtl">
              {v.arabic}
            </span>
          )}
          {showArabic && showTranslation && ' — '}
          {showTranslation && <span className="italic">{v.english}</span>}{' '}
          <span className="text-[10px] opacity-70">
            ({v.chapter}:{v.verse})
          </span>
        </span>
      ))}
    </NodeViewWrapper>
  )
}

/** The "inline" insert-style counterpart to QuranEmbed — a compact chip
 * embedded within a sentence, rather than a standalone card. A separate
 * node type rather than a variant of QuranEmbed, since ProseMirror's block
 * vs. inline `group` is fixed per node type, not switchable per instance. */
export const QuranEmbedInline = Node.create({
  name: 'quranEmbedInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      verses: {
        default: '1:1',
        parseHTML: (element) => element.getAttribute('verses') ?? '1:1',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'quran-embed-inline' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['quran-embed-inline', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(QuranEmbedInlineComponent)
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`::: quran-inline {verses="${node.attrs.verses}"} :::`)
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.before('link', 'quran_embed_inline', (state: any, silent: boolean) => {
              const src = state.src
              const start = state.pos
              const marker = '::: quran-inline {verses="'
              if (!src.startsWith(marker, start)) return false

              const closeIdx = src.indexOf('"} :::', start + marker.length)
              if (closeIdx === -1) return false

              if (!silent) {
                const verses = src.slice(start + marker.length, closeIdx)
                const token = state.push('quran_embed_inline', '', 0)
                token.attrSet('verses', verses)
              }

              state.pos = closeIdx + '"} :::'.length
              return true
            })

            markdownit.renderer.rules.quran_embed_inline = (tokens: any, idx: number) => {
              const verses = tokens[idx].attrGet('verses')
              return `<quran-embed-inline verses="${verses}"></quran-embed-inline>`
            }
          },
        },
      },
    }
  },
})
