import type { Editor } from '@tiptap/react'
import { formatSeconds, type MediaItem, type TranscriptCue } from './mediaCatalog'

/**
 * The media panel and the editor are siblings in the layout, so their two-way
 * traffic (a transcript quote going left, a timestamp click going right) would
 * otherwise have to be threaded through App as props. A tiny event bus keeps
 * that coupling out of the tree; the TipTap node views in particular have no
 * React context to reach for.
 */
export type MediaEventType =
  /** Payload: number (seconds) — a timestamp badge or chapter asks for a seek. */
  | 'seek_to'
  /** Payload: number (seconds) — the player's ~4 Hz clock. */
  | 'time_update'
  /** Payload: void */
  | 'play_pause'
  /** Payload: { id: string; timestamp?: number } — open a record in the panel. */
  | 'load_media'
  /** Payload: { cue: TranscriptCue } — quote the cue into the active editor. */
  | 'insert_citation'
  /** Payload: { mediaId: string | null; timestamp?: number } — the open note's
   *  frontmatter binding, emitted by the editor when a note loads. */
  | 'note_media'
  /** Payload: { mediaId: string; timestamp: number } — the panel asking the
   *  editor to persist the binding back into frontmatter. */
  | 'persist_media'
  /** Payload: void — the panel should reveal itself (shortcut / deep link). */
  | 'reveal_panel'
  /** Payload: void — the panel mounted after the note did and is asking the
   *  editor to re-announce its `note_media` binding. */
  | 'request_note_media'

export interface NoteMediaPayload {
  mediaId: string | null
  timestamp?: number
}

export interface PersistMediaPayload {
  mediaId: string
  timestamp: number
}

export interface LoadMediaPayload {
  id: string
  timestamp?: number
}

type Handler = (payload: never) => void

class MediaEventBus {
  private listeners = new Map<MediaEventType, Set<Handler>>()

  on<T = unknown>(event: MediaEventType, handler: (payload: T) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event)!.add(handler as Handler)
    return () => this.off(event, handler)
  }

  off<T = unknown>(event: MediaEventType, handler: (payload: T) => void) {
    this.listeners.get(event)?.delete(handler as Handler)
  }

  emit<T = unknown>(event: MediaEventType, payload?: T) {
    // Copied before iterating so a handler that unsubscribes itself (the common
    // case for one-shot seeks) does not mutate the set mid-dispatch.
    const handlers = this.listeners.get(event)
    if (!handlers) return
    for (const handler of [...handlers]) {
      try {
        ;(handler as (value: unknown) => void)(payload)
      } catch (error) {
        console.error(`[mediaBus] handler for "${event}" threw`, error)
      }
    }
  }
}

export const mediaBus = new MediaEventBus()

/* --------------------- *
 * Active editor registry *
 * --------------------- */

let activeEditor: Editor | null = null

/** Editor panes register themselves here as they mount and focus, so the media
 * panel can insert a citation without knowing which pane of a split is live. */
export function setActiveEditor(editor: Editor | null) {
  activeEditor = editor
}

export function clearActiveEditor(editor: Editor) {
  if (activeEditor === editor) activeEditor = null
}

export function getActiveEditor(): Editor | null {
  if (activeEditor && activeEditor.isDestroyed) {
    activeEditor = null
  }
  return activeEditor
}

/* --------------- *
 * Citation writing *
 * --------------- */

export function mediaDeepLink(mediaId: string, seconds: number): string {
  return `sa://media/${mediaId}?t=${Math.floor(Math.max(0, seconds))}`
}

/** The academic blockquote form the archive standardises on:
 *
 *     > "…quoted cue…"
 *     > — *Dr. Rashad Khalifa, [01:39](sa://media/…?t=99)*
 *
 * Written as Markdown rather than a ProseMirror fragment so the timestamp goes
 * through MediaTimestamp's markdown-it rule and comes back as an interactive
 * badge — the same path a hand-typed link takes.
 */
export function buildMediaQuoteMarkdown(item: MediaItem, cue: TranscriptCue): string {
  const timestamp = formatSeconds(cue.startTime)
  const link = mediaDeepLink(item.id, cue.startTime)
  const speaker = cue.speaker || item.author || 'Dr. Rashad Khalifa'
  const text = cue.text.trim().replace(/\s+/g, ' ')
  return `> "${text}"\n> — *${speaker}, [${timestamp}](${link})*\n\n`
}

export function insertMediaQuote(editor: Editor, item: MediaItem, cue: TranscriptCue): boolean {
  if (!editor || editor.isDestroyed || !editor.isEditable) return false
  editor.chain().focus().insertContent(buildMediaQuoteMarkdown(item, cue)).run()
  return true
}

/** Inline `[MM:SS](sa://…)` for "insert current timestamp", which reads as a
 * cross-reference inside a sentence rather than as a pulled quote. */
export function insertMediaTimestamp(editor: Editor, item: MediaItem, seconds: number): boolean {
  if (!editor || editor.isDestroyed || !editor.isEditable) return false
  const markdown = `[${formatSeconds(seconds)}](${mediaDeepLink(item.id, seconds)})`
  editor.chain().focus().insertContent(markdown).run()
  return true
}

export interface MediaTimestampAttributes {
  label: string
  seconds: number
  mediaId: string | null
}

export function serializeMediaTimestamp(attrs: MediaTimestampAttributes): string {
  const target = attrs.mediaId
    ? `sa://media/${attrs.mediaId}?t=${Math.floor(attrs.seconds)}`
    : `#t=${Math.floor(attrs.seconds)}`
  return `[${attrs.label}](${target})`
}
