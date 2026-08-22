import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { convertFileSrc } from '@tauri-apps/api/core'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { CaretLeft, CaretRight, ListMagnifyingGlass, PushPin, PushPinSlash, Quotes } from '@phosphor-icons/react'
import {
  findActiveChapterIndex,
  findActiveCueIndex,
  loadMediaCatalog,
  loadTranscript,
  MEDIA_TYPE_LABEL,
  readLocalStreams,
  readRecentMediaIds,
  recordRecentMediaId,
  writeLocalStream,
  type MediaItem,
  type TranscriptCue,
} from '../../lib/mediaCatalog'
import {
  getActiveEditor,
  insertMediaQuote,
  insertMediaTimestamp,
  mediaBus,
  type LoadMediaPayload,
  type NoteMediaPayload,
  type PersistMediaPayload,
} from '../../lib/mediaBus'
import { isTauriEnvironment } from '../../lib/ipc'
import { useShortcuts } from '../../hooks/useShortcuts'
import GoldenVideoPlayer from './GoldenVideoPlayer'
import ChapterTimelineStrip from './ChapterTimelineStrip'
import TranscriptTeleprompter from './TranscriptTeleprompter'
import MediaSearchSelector from './MediaSearchSelector'

const PERSIST_INTERVAL_MS = 5000

/** Media Notes: the player, its chapter rail and its transcript, sitting beside
 * the note being written. Everything the editor needs from it (citations,
 * seeks, the frontmatter binding) travels over `mediaBus`, so this panel never
 * has to know which editor pane is live. */
export default function MediaNotesPanel() {
  const [catalog, setCatalog] = useState<MediaItem[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [cues, setCues] = useState<TranscriptCue[]>([])
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [seekOnLoad, setSeekOnLoad] = useState<number | undefined>(undefined)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [recentIds, setRecentIds] = useState<string[]>(() => readRecentMediaIds())
  const [localStreams, setLocalStreams] = useState<Record<string, string>>(() => readLocalStreams())
  const [pinnedToNote, setPinnedToNote] = useState(true)
  const [notice, setNotice] = useState<string | null>(null)

  const catalogRef = useRef<MediaItem[]>([])
  const selectedRef = useRef<MediaItem | null>(null)
  const currentTimeRef = useRef(0)
  const lastPersistRef = useRef(0)
  const webFileInputRef = useRef<HTMLInputElement | null>(null)

  catalogRef.current = catalog
  selectedRef.current = selected
  currentTimeRef.current = currentTime

  /* The record carries its attached local file so the player can prefer a real
     stream over the YouTube embed without a second lookup. */
  const activeItem = useMemo(() => {
    if (!selected) return null
    const streamUrl = localStreams[selected.id]
    return streamUrl ? { ...selected, streamUrl } : selected
  }, [localStreams, selected])

  useEffect(() => {
    let cancelled = false
    loadMediaCatalog().then((items) => {
      if (cancelled) return
      setCatalog(items)
      setCatalogLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const selectItem = useCallback((item: MediaItem, timestamp?: number) => {
    setSelected(item)
    setPickerOpen(false)
    setCues([])
    setTranscriptLoading(true)
    setCurrentTime(timestamp ?? 0)
    setSeekOnLoad(timestamp ?? 0)
    setRecentIds(recordRecentMediaId(item.id))
    lastPersistRef.current = 0

    loadTranscript(item.slug).then((transcript) => {
      // A fast second selection must not have its transcript overwritten by the
      // first one landing late.
      if (selectedRef.current?.slug !== item.slug) return
      setCues(transcript.cues)
      setTranscriptLoading(false)
    })
  }, [])

  const selectById = useCallback(
    (id: string, timestamp?: number) => {
      const item = catalogRef.current.find((candidate) => candidate.id === id)
      if (!item) {
        setNotice(`No catalog record for "${id}".`)
        return
      }
      if (selectedRef.current?.id === id) {
        if (timestamp != null) mediaBus.emit<number>('seek_to', timestamp)
        return
      }
      selectItem(item, timestamp)
    },
    [selectItem]
  )

  /* Deep links from timestamp badges, and the frontmatter binding of whichever
     note just opened. */
  useEffect(() => {
    const offLoad = mediaBus.on<LoadMediaPayload>('load_media', (payload) => {
      if (payload?.id) selectById(payload.id, payload.timestamp)
    })
    const offNote = mediaBus.on<NoteMediaPayload>('note_media', (payload) => {
      if (!pinnedToNote || !payload?.mediaId) return
      selectById(payload.mediaId, payload.timestamp)
    })
    return () => {
      offLoad()
      offNote()
    }
  }, [pinnedToNote, selectById])

  // The catalog can arrive after the note did, so replay the pending binding.
  useEffect(() => {
    if (!catalog.length) return
    mediaBus.emit('request_note_media')
  }, [catalog.length])

  const persist = useCallback((seconds: number, force = false) => {
    const item = selectedRef.current
    if (!item) return
    const now = Date.now()
    if (!force && now - lastPersistRef.current < PERSIST_INTERVAL_MS) return
    lastPersistRef.current = now
    mediaBus.emit<PersistMediaPayload>('persist_media', {
      mediaId: item.id,
      timestamp: Math.floor(seconds),
    })
  }, [])

  const handleTimeChange = useCallback(
    (seconds: number) => {
      setCurrentTime(seconds)
      persist(seconds)
    },
    [persist]
  )

  // Writing the last position on unmount is what makes "reopen where I left
  // off" work for a note closed mid-lecture.
  useEffect(
    () => () => {
      if (selectedRef.current && currentTimeRef.current > 0) persist(currentTimeRef.current, true)
    },
    [persist]
  )

  const activeCueIndex = useMemo(() => findActiveCueIndex(cues, currentTime), [cues, currentTime])
  const activeCueId = activeCueIndex >= 0 ? cues[activeCueIndex].id : null
  const activeChapterIndex = useMemo(
    () => findActiveChapterIndex(activeItem?.chapters ?? [], currentTime),
    [activeItem, currentTime]
  )

  const currentIndex = useMemo(() => {
    if (!selected) return -1
    return catalog.findIndex((candidate) => candidate.id === selected.id)
  }, [catalog, selected])

  const prevItem = currentIndex > 0 ? catalog[currentIndex - 1] : null
  const nextItem = currentIndex >= 0 && currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : null

  const quoteCue = useCallback(
    (cue: TranscriptCue) => {
      const item = selectedRef.current
      const editor = getActiveEditor()
      if (!item) return
      if (!editor) {
        setNotice('Open a note in the editor to receive the citation.')
        return
      }
      if (!insertMediaQuote(editor, item, cue)) {
        setNotice('This note is locked, so the citation was not inserted.')
        return
      }
      setNotice(null)
    },
    []
  )

  const stampCurrentTime = useCallback(() => {
    const item = selectedRef.current
    const editor = getActiveEditor()
    if (!item) return
    if (!editor) {
      setNotice('Open a note in the editor to receive the timestamp.')
      return
    }
    if (!insertMediaTimestamp(editor, item, currentTimeRef.current)) {
      setNotice('This note is locked, so the timestamp was not inserted.')
      return
    }
    setNotice(null)
  }, [])

  useShortcuts({
    'media.quote-cue': () => {
      if (activeCueIndex >= 0) quoteCue(cues[activeCueIndex])
      else setNotice('No cue is playing, so there is nothing to quote yet.')
    },
    'media.insert-timestamp': stampCurrentTime,
  })

  const attachLocalFile = useCallback(async () => {
    const item = selectedRef.current
    if (!item) return

    if (!isTauriEnvironment()) {
      webFileInputRef.current?.click()
      return
    }

    try {
      const picked = await openDialog({
        multiple: false,
        title: `Attach a media file for ${item.displayTitle}`,
        filters: [{ name: 'Audio & Video', extensions: ['mp4', 'webm', 'mkv', 'mov', 'm4v', 'mp3', 'm4a', 'wav', 'ogg'] }],
      })
      if (!picked || typeof picked !== 'string') return
      setLocalStreams(writeLocalStream(item.id, convertFileSrc(picked)))
      setNotice(null)
    } catch (error) {
      setNotice(String(error))
    }
  }, [])

  const detachLocalFile = useCallback(() => {
    const item = selectedRef.current
    if (!item) return
    setLocalStreams(writeLocalStream(item.id, null))
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex items-center gap-1.5 border-b border-ed-rule px-2.5 py-2">
        {selected && pickerOpen && (
          <button onClick={() => setPickerOpen(false)} className="st-media-icon" title="Back to current playback">
            <CaretLeft size={12} weight="bold" />
          </button>
        )}
        {selected && !pickerOpen && (
          <button
            onClick={() => setPickerOpen(true)}
            className="st-media-icon text-ed-accent hover:text-ed-fg"
            title="Back to library / browse all lectures"
          >
            <CaretLeft size={13} weight="bold" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-ed-fg">
            {selected ? selected.displayTitle : 'Media Notes'}
          </div>
          <div className="truncate text-[10px] text-ed-fg-muted">
            {selected
              ? [MEDIA_TYPE_LABEL[selected.type], selected.date, selected.duration].filter(Boolean).join(' · ')
              : `${catalog.length} indexed lectures`}
          </div>
        </div>
        <button
          onClick={() => setPinnedToNote((value) => !value)}
          className={`st-media-icon ${pinnedToNote ? 'st-media-icon-primary' : ''}`}
          title={
            pinnedToNote
              ? 'Following the open note’s media frontmatter'
              : 'Ignoring the note’s media frontmatter'
          }
        >
          {pinnedToNote ? <PushPin size={13} /> : <PushPinSlash size={13} />}
        </button>
        {selected && !pickerOpen && (
          <button onClick={() => setPickerOpen(true)} className="st-media-icon" title="Browse / choose another lecture">
            <ListMagnifyingGlass size={13} />
          </button>
        )}
      </div>

      {notice && (
        <div className="flex items-start gap-1.5 border-b border-ed-rule bg-ed-accent-soft px-2.5 py-1.5 text-[10.5px] text-ed-fg-secondary">
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-ed-fg-faint hover:text-ed-fg">
            &times;
          </button>
        </div>
      )}

      {!selected || pickerOpen ? (
        <MediaSearchSelector
          items={catalog}
          recentIds={recentIds}
          loading={catalogLoading}
          onSelect={selectItem}
          onDismiss={selected ? () => setPickerOpen(false) : undefined}
        />
      ) : (
        activeItem && (
          <>
            <GoldenVideoPlayer
              item={activeItem}
              initialTime={seekOnLoad}
              onTimeChange={handleTimeChange}
              onInsertTimestamp={stampCurrentTime}
              onAttachLocalFile={() => void attachLocalFile()}
              onDetachLocalFile={detachLocalFile}
            />

            <ChapterTimelineStrip
              chapters={activeItem.chapters}
              activeIndex={activeChapterIndex}
              onSeek={(seconds) => mediaBus.emit<number>('seek_to', seconds)}
            />

            <TranscriptTeleprompter
              cues={cues}
              activeCueId={activeCueId}
              loading={transcriptLoading}
              onSeek={(seconds) => mediaBus.emit<number>('seek_to', seconds)}
              onQuote={quoteCue}
            />

            <div className="flex items-center gap-1.5 border-t border-ed-rule px-2.5 py-1.5">
              <button
                onClick={() => activeCueIndex >= 0 && quoteCue(cues[activeCueIndex])}
                disabled={activeCueIndex < 0}
                className="st-media-chip disabled:opacity-40"
                title="Quote the cue now playing (Ctrl+Shift+Q)"
              >
                <Quotes size={12} />
                Quote
              </button>
              <button
                onClick={() => setPickerOpen(true)}
                className="st-media-chip"
                title="Browse all indexed audios and videos"
              >
                <ListMagnifyingGlass size={12} />
                Browse all
              </button>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => prevItem && selectItem(prevItem)}
                  disabled={!prevItem}
                  className="st-media-icon disabled:opacity-30"
                  title={prevItem ? `Previous: ${prevItem.displayTitle}` : 'No previous lecture'}
                >
                  <CaretLeft size={12} weight="bold" />
                </button>
                <button
                  onClick={() => nextItem && selectItem(nextItem)}
                  disabled={!nextItem}
                  className="st-media-icon disabled:opacity-30"
                  title={nextItem ? `Next: ${nextItem.displayTitle}` : 'No next lecture'}
                >
                  <CaretRight size={12} weight="bold" />
                </button>
              </div>
            </div>
          </>
        )
      )}

      {/* Browser-preview fallback for attaching a file: object URLs cannot be
          persisted, so this path is deliberately session-only. */}
      <input
        ref={webFileInputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          const item = selectedRef.current
          if (!file || !item) return
          setLocalStreams((streams) => ({ ...streams, [item.id]: URL.createObjectURL(file) }))
          setNotice('Attached for this session only (browser preview cannot remember file paths).')
          event.target.value = ''
        }}
      />
    </div>
  )
}
