import { Node, mergeAttributes, nodeInputRule } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import MediaTimestampBadge from './MediaTimestampBadge'
import { parseTimestamp } from '../../lib/mediaCatalog'

/**
 * Interactive `[MM:SS](sa://media/<id>?t=<seconds>)` badges.
 *
 * Deliberately a node rather than a styled Link mark: StarterKit's Link runs
 * hrefs through `isAllowedUri`, which does not know the `sa://` scheme, and a
 * mark would give the badge no stable place to hang the resolved second count.
 * As an atom it round-trips through markdown byte-for-byte, so notes stay plain
 * Markdown outside Studio.
 */

import {
  serializeMediaTimestamp,
  type MediaTimestampAttributes,
} from '../../lib/mediaBus'
export { serializeMediaTimestamp, type MediaTimestampAttributes }

/** `[01:39](sa://media/...?t=99)` or the local `[01:39](#t=99)` shorthand. */
const TIMESTAMP_PATTERN = /\[(\d{1,3}:\d{2}(?::\d{2})?)\]\((sa:\/\/media\/[^)\s]+|#t=[\d.]+)\)/

function parseTarget(label: string, target: string): MediaTimestampAttributes {
  const fromLabel = parseTimestamp(label) ?? 0

  if (target.startsWith('#t=')) {
    const seconds = Number(target.slice(3))
    return { label, seconds: Number.isFinite(seconds) ? seconds : fromLabel, mediaId: null }
  }

  const withoutScheme = target.replace(/^sa:\/\/media\//i, '')
  const [rawId, query = ''] = withoutScheme.split('?')
  const params = new URLSearchParams(query)
  const fromQuery = parseTimestamp(params.get('t'))

  let mediaId = rawId
  try {
    mediaId = decodeURIComponent(rawId)
  } catch {
    // Malformed escapes stay literal rather than losing the reference.
  }

  return { label, seconds: fromQuery ?? fromLabel, mediaId: mediaId || null }
}

export const MediaTimestamp = Node.create({
  name: 'mediaTimestamp',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      label: {
        default: '00:00',
        parseHTML: (element) => element.getAttribute('data-label') ?? element.textContent ?? '00:00',
      },
      seconds: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-seconds') ?? 0),
      },
      mediaId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-media-id'),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-media-timestamp]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const attrs = node.attrs as MediaTimestampAttributes
    return [
      'a',
      mergeAttributes(HTMLAttributes, {
        'data-media-timestamp': '',
        'data-label': attrs.label,
        'data-seconds': String(attrs.seconds),
        ...(attrs.mediaId ? { 'data-media-id': attrs.mediaId } : {}),
        class: 'media-timestamp-badge',
      }),
      attrs.label,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaTimestampBadge)
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: new RegExp(`${TIMESTAMP_PATTERN.source}$`),
        type: this.type,
        getAttributes: (match) => parseTarget(match[1], match[2]),
      }),
    ]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: { write: (text: string) => void }, node: { attrs: MediaTimestampAttributes }) {
          state.write(serializeMediaTimestamp(node.attrs))
        },
        parse: {
          setup(markdownit: any) {
            // Before 'link' so the `sa://` target never reaches Link's URI
            // allow-list, which would drop it.
            markdownit.inline.ruler.before('link', 'media_timestamp', (state: any, silent: boolean) => {
              if (state.src[state.pos] !== '[') return false
              const match = TIMESTAMP_PATTERN.exec(state.src.slice(state.pos))
              if (!match || match.index !== 0) return false

              if (!silent) {
                const attrs = parseTarget(match[1], match[2])
                const token = state.push('media_timestamp', '', 0)
                token.attrSet('label', attrs.label)
                token.attrSet('seconds', String(attrs.seconds))
                if (attrs.mediaId) token.attrSet('mediaId', attrs.mediaId)
              }

              state.pos += match[0].length
              return true
            })

            markdownit.renderer.rules.media_timestamp = (tokens: any, index: number) => {
              const token = tokens[index]
              const label = token.attrGet('label') ?? '00:00'
              const seconds = token.attrGet('seconds') ?? '0'
              const mediaId = token.attrGet('mediaId')
              const mediaAttr = mediaId ? ` data-media-id="${escapeAttribute(mediaId)}"` : ''
              return `<a data-media-timestamp data-label="${escapeAttribute(label)}" data-seconds="${escapeAttribute(seconds)}"${mediaAttr}>${escapeAttribute(label)}</a>`
            }
          },
        },
      },
    }
  },
})

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
