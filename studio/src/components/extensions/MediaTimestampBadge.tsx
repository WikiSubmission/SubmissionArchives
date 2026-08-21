import { NodeViewWrapper } from '@tiptap/react'
import { Play } from '@phosphor-icons/react'
import { mediaBus, type LoadMediaPayload } from '../../lib/mediaBus'
import type { MediaTimestampAttributes } from './MediaTimestampExtension'

interface MediaTimestampBadgeProps {
  // ProseMirror types attrs as a loose record; the node's own attribute schema
  // is what actually lands here.
  node: { attrs: Record<string, unknown> }
}

/** Clicking the badge drives the media panel: a badge that names a different
 * lecture than the one loaded switches records first, so a note can cite
 * several talks and each link still lands in the right place. */
export default function MediaTimestampBadge({ node }: MediaTimestampBadgeProps) {
  const { label, seconds, mediaId } = node.attrs as unknown as MediaTimestampAttributes

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    mediaBus.emit('reveal_panel')
    if (mediaId) {
      mediaBus.emit<LoadMediaPayload>('load_media', { id: mediaId, timestamp: seconds })
    } else {
      mediaBus.emit<number>('seek_to', seconds)
    }
  }

  return (
    <NodeViewWrapper as="span" className="inline">
      <span
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') handleClick(event as unknown as React.MouseEvent)
        }}
        title={mediaId ? `Jump ${mediaId} to ${label}` : `Jump media to ${label}`}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-xs font-semibold bg-ed-accent/15 text-ed-accent hover:bg-ed-accent hover:text-ed-on-accent cursor-pointer transition-colors align-baseline no-underline"
      >
        <Play size={9} weight="fill" className="shrink-0" />
        {label}
      </span>
    </NodeViewWrapper>
  )
}
