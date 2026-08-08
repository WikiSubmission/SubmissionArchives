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

function QuranEmbedComponent({ node, updateAttributes }: any) {
  const { settings } = useSettings()
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

  // The global "show" setting is a ceiling: it can force arabic-only or
  // translation-only across the whole app. The per-embed toggle button is
  // a further override underneath that ceiling, not above it.
  const showArabic = settings.quran.showMode !== 'translation'
  const showTranslation = showEnglish && settings.quran.showMode !== 'arabic'

  return (
    <NodeViewWrapper className="quran-embed-wrapper my-4 rounded-xl border border-qv-border bg-qv-bg select-none relative group animate-embed-in overflow-hidden shadow-lg">
      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => updateAttributes({ showEnglish: !showEnglish })}
          className="text-xs bg-qv-fg/10 text-qv-fg px-2 py-1 rounded hover:bg-qv-fg/15 transition-colors"
        >
          Toggle English
        </button>
      </div>

      <div className="px-5 py-4">
        {error && <div className="text-sm text-red-700 font-mono">{error}</div>}

        {!error && !result && <div className="text-sm text-qv-muted animate-pulse">Loading {verses}...</div>}

        {result &&
          result.map((v, i) => (
            <div key={`${v.chapter}:${v.verse}`} className={i > 0 ? 'pt-3 mt-3 border-t border-qv-divider' : ''}>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-qv-tint text-qv-accent text-xs font-semibold mb-1.5">
                {v.chapter}:{v.verse}
              </span>
              {showArabic && (
                <div
                  className="font-arabic text-right leading-relaxed text-qv-fg"
                  style={{ fontSize: settings.quran.arabicSize }}
                  dir="rtl"
                >
                  {v.arabic}
                </div>
              )}
              {showTranslation && (
                <p className="font-serif leading-relaxed text-qv-fg mt-2" style={{ fontSize: settings.quran.translationSize }}>
                  {v.english}
                </p>
              )}
            </div>
          ))}
      </div>

      <div className="px-5 py-2 border-t border-qv-divider flex justify-between items-center">
        <span className="text-[11px] tracking-wide text-qv-subtle font-medium">Reference: {verses}</span>
        <span className="text-[10.5px] tracking-widest uppercase text-qv-muted font-semibold">SubmissionArchives</span>
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
