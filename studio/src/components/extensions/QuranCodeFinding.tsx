import { Node, mergeAttributes } from '@tiptap/core'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useEffect, useState } from 'react'
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react'
import { fmt, qcComputeValue, NO_MODIFIERS, type Modifiers, type ModifierId } from '../../lib/quranCode'

/**
 * A research finding, embedded in a note.
 *
 * The point of the node rather than a pasted number is that **it recomputes on
 * load and says so when the answer has changed**. A note that silently drifts
 * from its own data is worse than no note: the figure keeps its authority long
 * after the thing that produced it stopped agreeing.
 *
 * Serializes to `::: qcvalue {…} :::`, matching the Quran embed's directive
 * form, so a note stays portable Markdown outside Studio.
 */

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
  push: (
    type: string,
    tag: string,
    nesting: number
  ) => { attrSet: (name: string, value: string) => void; map: number[] }
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
  renderer: { rules: Record<string, (tokens: MarkdownItToken[], idx: number) => string> }
}

const ATTRS = ['ref', 'system', 'mode', 'value', 'letters', 'words', 'modifiers', 'unverified'] as const

/** Rebuilds a `Modifiers` object from the comma-joined ids the directive
 * stores, so the recomputation asks the backend exactly the question the
 * original did. */
function modifiersFrom(list: string): Modifiers {
  const next: Modifiers = { ...NO_MODIFIERS }
  for (const id of list.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (id in next) next[id as ModifierId] = true
  }
  return next
}

function parseScope(ref: string): { chapter?: number; verse?: number; word?: number } {
  const parts = ref.split(':').map((p) => Number(p.trim()))
  if (parts.some((p) => !Number.isFinite(p))) {
    // "chapter 33" and "corpus" are the other two forms the backend produces
    const chapter = /chapter\s+(\d+)/i.exec(ref)
    return chapter ? { chapter: Number(chapter[1]) } : {}
  }
  return { chapter: parts[0], verse: parts[1], word: parts[2] }
}

type Status = 'checking' | 'agrees' | 'drifted' | 'unavailable'

function FindingView({ node }: NodeViewProps) {
  const attrs = node.attrs as Record<string, string>
  const stored = Number(attrs.value ?? 0)
  const [status, setStatus] = useState<Status>('checking')
  const [actual, setActual] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const scope = parseScope(attrs.ref ?? '')
    qcComputeValue(
      scope,
      attrs.system || 'abjad_standard',
      modifiersFrom(attrs.modifiers ?? ''),
      attrs.mode || undefined
    )
      .then((result) => {
        if (cancelled) return
        setActual(result.value)
        setStatus(result.value === stored ? 'agrees' : 'drifted')
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable')
      })
    return () => {
      cancelled = true
    }
  }, [attrs.ref, attrs.system, attrs.mode, attrs.modifiers, stored])

  const drifted = status === 'drifted'
  const unverified = attrs.unverified === 'true'

  return (
    <NodeViewWrapper
      className={`my-4 overflow-hidden rounded-lg border bg-ed-surface-raised ${
        drifted ? 'border-ed-danger' : 'border-ed-rule'
      }`}
      data-qc-finding
    >
      <div className="flex items-baseline gap-2 border-b border-ed-rule bg-ed-surface px-3 py-1.5">
        <span className="font-mono text-[11px] font-bold tracking-wider text-ed-accent">
          {attrs.ref}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-ed-fg-muted">
          {attrs.mode}
          {attrs.system && attrs.system !== 'none' ? ` · ${attrs.system}` : ''}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 px-3 py-2.5">
        <Figure label="Value" value={fmt(stored)} big />
        <Figure label="Letters" value={fmt(Number(attrs.letters ?? 0))} />
        <Figure label="Words" value={fmt(Number(attrs.words ?? 0))} />
      </div>

      {attrs.modifiers && (
        <p className="px-3 pb-1.5 font-mono text-[10px] text-ed-fg-muted">
          modifiers: {attrs.modifiers.split(',').join(', ')}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-ed-rule bg-ed-surface px-3 py-1.5">
        {status === 'checking' && (
          <Badge tone="muted">checking against the corpus…</Badge>
        )}
        {status === 'agrees' && (
          <Badge tone="ok">
            <CheckCircle size={11} weight="fill" /> recomputed, still {fmt(stored)}
          </Badge>
        )}
        {drifted && (
          <Badge tone="danger">
            <XCircle size={11} weight="fill" /> recomputes to {fmt(actual)}, not {fmt(stored)}
          </Badge>
        )}
        {status === 'unavailable' && (
          <Badge tone="muted">corpus unavailable, figure not re-checked</Badge>
        )}
        {unverified && (
          <Badge tone="danger">
            <Warning size={11} weight="fill" /> mode has an unresolved rule
          </Badge>
        )}
      </div>
    </NodeViewWrapper>
  )
}

function Figure({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <span className="flex flex-col">
      <span className="font-mono text-[9px] uppercase tracking-[0.11em] text-ed-fg-muted">
        {label}
      </span>
      <span
        className={`font-mono font-semibold tabular-nums text-ed-fg ${big ? 'text-[19px]' : 'text-[14px]'}`}
      >
        {value}
      </span>
    </span>
  )
}

function Badge({
  tone,
  children,
}: {
  tone: 'ok' | 'danger' | 'muted'
  children: React.ReactNode
}) {
  const styles = {
    ok: 'border-ed-success/45 bg-ed-success-soft text-ed-success',
    danger: 'border-ed-danger/45 bg-ed-danger-soft text-ed-danger',
    muted: 'border-ed-rule text-ed-fg-muted',
  }[tone]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] tracking-wide ${styles}`}
    >
      {children}
    </span>
  )
}

export const QuranCodeFinding = Node.create({
  name: 'quranCodeFinding',
  group: 'block',
  atom: true,
  selectable: true,

  addAttributes() {
    return Object.fromEntries(ATTRS.map((name) => [name, { default: '' }]))
  },

  parseHTML() {
    return [{ tag: 'div[data-qc-finding]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-qc-finding': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(FindingView)
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: MarkdownSerializerState, node: { attrs: Record<string, string> }) {
          const body = ATTRS.filter((k) => node.attrs[k] !== '' && node.attrs[k] !== undefined)
            .map((k) => `${k}="${node.attrs[k]}"`)
            .join(' ')
          state.write(`::: qcvalue {${body}} :::`)
          state.closeBlock(node)
        },
        parse: {
          setup(markdownit: MarkdownItInstance) {
            /* Registered before `fence` for the same reason the Quran embed's
               rule is: a `:::` line would otherwise be claimed as a fenced
               block and never reach us. */
            markdownit.block.ruler.before(
              'fence',
              'qcvalue',
              (state, startLine, _endLine, silent) => {
                const start = state.bMarks[startLine] + state.tShift[startLine]
                const max = state.eMarks[startLine]
                const line = state.src.slice(start, max).trim()
                const match = /^:::\s*qcvalue\s*\{([^}]*)\}\s*:::$/.exec(line)
                if (!match) return false
                if (silent) return true

                const token = state.push('qcvalue', 'div', 0)
                for (const [, key, value] of match[1].matchAll(/(\w+)="([^"]*)"/g)) {
                  token.attrSet(key, value)
                }
                token.map = [startLine, startLine + 1]
                state.line = startLine + 1
                return true
              }
            )
            markdownit.renderer.rules.qcvalue = (tokens, idx) => {
              const token = tokens[idx]
              const attrs = ATTRS.map((k) => `${k}="${token.attrGet(k) ?? ''}"`).join(' ')
              return `<div data-qc-finding ${attrs}></div>`
            }
          },
        },
      },
    }
  },
})

export default QuranCodeFinding
