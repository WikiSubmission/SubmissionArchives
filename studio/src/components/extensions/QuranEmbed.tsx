import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { safeInvoke as invoke } from '../../lib/ipc'
import { useSettings } from '../../hooks/useSettings'
import { Copy, Check, Eye, EyeSlash } from '@phosphor-icons/react'
import { motion, springConfig } from '../ui/Motion'

interface Verse {
  chapter: number
  verse: number
  arabic: string
  english: string
}

interface MarkdownSerializerState {
  write: (content: string) => void
  closeBlock: (node: unknown) => void
}

interface MarkdownItState {
  bMarks: number[]
  tShift: number[]
  eMarks: number[]
  src: string
  line: number
  push: (type: string, tag: string, nesting: number) => {
    attrSet: (name: string, value: string) => void
    map: number[]
  }
}

interface MarkdownItToken {
  attrGet: (name: string) => string | null
}

interface MarkdownItInstance {
  block: {
    ruler: {
      before: (
        beforeName: string,
        ruleName: string,
        fn: (state: MarkdownItState, startLine: number, endLine: number, silent: boolean) => boolean
      ) => void
    }
  }
  renderer: {
    rules: Record<string, (tokens: MarkdownItToken[], idx: number) => string>
  }
}

function QuranEmbedComponent({ node, updateAttributes }: NodeViewProps) {
  const { settings } = useSettings()
  const verses = String(node.attrs.verses ?? '1:1')
  const showEnglish = Boolean(node.attrs.showEnglish)

  const [result, setResult] = useState<Verse[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prevVerses, setPrevVerses] = useState(verses)
  const [copied, setCopied] = useState(false)
  const [focused, setFocused] = useState(false)

  if (verses !== prevVerses) {
    setPrevVerses(verses)
    setResult(null)
    setError(null)
  }

  useEffect(() => {
    let cancelled = false

    invoke<Verse[]>('search_verses', { query: verses })
      .then((data) => {
        if (!cancelled) {
          setResult(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err))
          setResult(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [verses])

  const showArabic = settings.quran.showMode !== 'translation'
  const showTranslation = showEnglish && settings.quran.showMode !== 'arabic'

  const handleCopy = () => {
    if (!result) return
    const text = result
      .map((v) => `${v.arabic}\n${v.english} [Surah ${v.chapter}:${v.verse}]`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <NodeViewWrapper
      onClick={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`quran-embed-wrapper my-6 rounded-xl border transition-all duration-300 bg-qv-bg select-none relative group overflow-hidden ${
        focused ? 'ring-2 ring-amber-500/40 border-amber-500/50 shadow-elev-lg' : 'border-qv-border'
      }`}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-qv-accent/20 to-transparent" />

      {/* Hover action bar */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-[-4px] group-hover:translate-y-0 z-10">
        <button
          onClick={handleCopy}
          aria-label="Copy citation"
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-qv-fg/8 text-qv-fg/70 hover:bg-qv-fg/12 hover:text-qv-fg px-2.5 py-1 rounded-md transition-all duration-150 border border-qv-fg/5"
        >
          {copied ? <Check size={12} weight="bold" className="text-emerald-600" /> : <Copy size={12} weight="bold" />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          onClick={() => updateAttributes({ showEnglish: !showEnglish })}
          aria-label="Toggle translation"
          className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-qv-fg/8 text-qv-fg/70 hover:bg-qv-fg/12 hover:text-qv-fg px-2.5 py-1 rounded-md transition-all duration-150 border border-qv-fg/5"
        >
          {showEnglish ? <EyeSlash size={12} weight="bold" /> : <Eye size={12} weight="bold" />}
          <span>{showEnglish ? 'Hide English' : 'Show English'}</span>
        </button>
      </div>

      <div className="px-6 py-5">
        {error && (
          <div className="text-sm text-red-700/80 font-mono bg-red-500/5 rounded-lg px-3 py-2 border border-red-500/10">
            {error}
          </div>
        )}

        {!error && !result && (
          <div className="flex items-center gap-2 text-sm text-qv-muted animate-pulse">
            <span className="w-3.5 h-3.5 border-2 border-qv-accent/20 border-t-qv-accent/50 rounded-full animate-spin" />
            Loading {verses}...
          </div>
        )}

        {result && (
          <div className="space-y-0">
            {result.map((v, i) => (
              <motion.div
                key={`${v.chapter}:${v.verse}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springConfig, delay: i * 0.04 }}
                className={i > 0 ? 'pt-4 mt-4 border-t border-qv-divider' : ''}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-5 px-1.5 rounded-md bg-qv-tint text-qv-accent text-[10px] font-bold tracking-wide">
                    {v.chapter}:{v.verse}
                  </span>
                </div>

                {showArabic && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...springConfig, delay: i * 0.04 }}
                    className="font-arabic text-right leading-[1.8] text-qv-fg tracking-normal"
                    style={{ fontSize: settings.quran.arabicSize }}
                    dir="rtl"
                  >
                    {v.arabic}
                  </motion.div>
                )}

                {showTranslation && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...springConfig, delay: i * 0.04 + 0.04 }}
                    className="font-serif leading-[1.7] text-qv-fg/90 mt-2"
                    style={{ fontSize: settings.quran.translationSize }}
                  >
                    {v.english}
                  </motion.p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer — Manuscript reference strip */}
      <div className="px-6 py-2.5 border-t border-qv-divider flex justify-between items-center bg-qv-tint/30">
        <span className="text-[10px] tracking-[0.08em] text-qv-subtle font-medium uppercase">
          Reference: {verses}
        </span>
        <span className="text-[9px] tracking-[0.15em] uppercase text-qv-muted/70 font-semibold">
          SubmissionArchives
        </span>
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
    return [{ tag: 'quran-embed' }]
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
        serialize(state: MarkdownSerializerState, node: { attrs: Record<string, unknown> }) {
          const verses = String(node.attrs.verses)
          const suffix = node.attrs.showEnglish === false ? ` showEnglish="false"` : ''
          state.write(`::: quran {verses="${verses}"${suffix}} :::`)
          state.closeBlock(node)
        },
        parse: {
          setup(markdownit: MarkdownItInstance) {
            markdownit.block.ruler.before(
              'fence',
              'quran_embed',
              (state: MarkdownItState, startLine: number, _endLine: number, silent: boolean) => {
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

            markdownit.renderer.rules.quran_embed = (tokens: MarkdownItToken[], idx: number) => {
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
