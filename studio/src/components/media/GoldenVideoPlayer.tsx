import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  Clock,
  MonitorPlay,
  Pause,
  Play,
  SpeakerHigh,
  WifiSlash,
} from '@phosphor-icons/react'
import { formatSeconds, type MediaItem } from '../../lib/mediaCatalog'
import { mediaBus } from '../../lib/mediaBus'

const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const
const TICK_MS = 250
const STEP_SECONDS = 5

type Engine = 'native' | 'youtube'

interface GoldenVideoPlayerProps {
  item: MediaItem
  /** Seek target applied once the engine is ready (frontmatter or deep link). */
  initialTime?: number
  onTimeChange: (seconds: number) => void
  onInsertTimestamp: () => void
  onAttachLocalFile: () => void
  onDetachLocalFile: () => void
}

/* ------------------------------ *
 * YouTube IFrame API, loaded once *
 * ------------------------------ */

interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getPlayerState: () => number
  setPlaybackRate: (rate: number) => void
  destroy: () => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayer
      PlayerState: { PLAYING: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let youtubeApiPromise: Promise<void> | null = null

/** Studio ships offline, so the IFrame API may simply never arrive. The promise
 * rejects on script error and after a timeout, which the player turns into an
 * explicit "attach a local file" state rather than an endless spinner. */
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (youtubeApiPromise) return youtubeApiPromise

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      youtubeApiPromise = null
      reject(new Error('YouTube IFrame API timed out'))
    }, 8000)

    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      window.clearTimeout(timeout)
      resolve()
    }

    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    script.async = true
    script.onerror = () => {
      window.clearTimeout(timeout)
      youtubeApiPromise = null
      reject(new Error('YouTube IFrame API unavailable'))
    }
    document.head.appendChild(script)
  })

  return youtubeApiPromise
}

function looksLikeVideo(item: MediaItem): boolean {
  if (item.streamUrl && /\.(mp4|webm|mkv|mov|m4v)(\?|$)/i.test(item.streamUrl)) return true
  if (item.streamUrl) return false
  return item.type === 'video-program'
}

export default function GoldenVideoPlayer({
  item,
  initialTime,
  onTimeChange,
  onInsertTimestamp,
  onAttachLocalFile,
  onDetachLocalFile,
}: GoldenVideoPlayerProps) {
  const hasLocalStream = Boolean(item.streamUrl)
  const canUseYouTube = Boolean(item.youtubeId)

  const [engine, setEngine] = useState<Engine>(hasLocalStream || !canUseYouTube ? 'native' : 'youtube')
  const [isPlaying, setIsPlaying] = useState(false)
  const [rate, setRate] = useState<number>(1)
  const [currentTime, setCurrentTime] = useState(initialTime ?? 0)
  const [youtubeError, setYoutubeError] = useState<string | null>(null)

  const nativeRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const youtubeHostRef = useRef<HTMLDivElement | null>(null)
  const youtubePlayerRef = useRef<YouTubePlayer | null>(null)
  const pendingSeekRef = useRef<number | null>(initialTime ?? null)
  const onTimeChangeRef = useRef(onTimeChange)
  onTimeChangeRef.current = onTimeChange

  const isVideo = looksLikeVideo(item)
  const duration = item.durationSeconds ?? 0

  /* Engine follows the record: a lecture with a local file attached should not
     stay on a YouTube embed that cannot play offline, and vice versa. */
  useEffect(() => {
    setEngine(hasLocalStream || !canUseYouTube ? 'native' : 'youtube')
    setYoutubeError(null)
    setIsPlaying(false)
    pendingSeekRef.current = initialTime ?? 0
    setCurrentTime(initialTime ?? 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, hasLocalStream, canUseYouTube])

  useEffect(() => {
    if (initialTime == null) return
    pendingSeekRef.current = initialTime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTime])

  const publishTime = useCallback((seconds: number) => {
    setCurrentTime(seconds)
    onTimeChangeRef.current(seconds)
    mediaBus.emit<number>('time_update', seconds)
  }, [])

  const seek = useCallback(
    (seconds: number) => {
      const target = Math.max(0, duration ? Math.min(seconds, duration) : seconds)
      if (engine === 'youtube') {
        const player = youtubePlayerRef.current
        if (player) player.seekTo(target, true)
        else pendingSeekRef.current = target
      } else {
        const element = nativeRef.current
        if (element && Number.isFinite(element.duration)) element.currentTime = target
        else pendingSeekRef.current = target
      }
      publishTime(target)
    },
    [duration, engine, publishTime]
  )

  const togglePlay = useCallback(() => {
    if (engine === 'youtube') {
      const player = youtubePlayerRef.current
      if (!player) return
      if (isPlaying) player.pauseVideo()
      else player.playVideo()
      setIsPlaying(!isPlaying)
      return
    }
    const element = nativeRef.current
    if (!element) return
    if (element.paused) void element.play()
    else element.pause()
  }, [engine, isPlaying])

  /* Bus wiring: timestamp badges, chapter pills and transcript rows all seek
     through the bus so none of them need a handle on this component. */
  useEffect(() => {
    const offSeek = mediaBus.on<number>('seek_to', (seconds) => seek(seconds))
    const offToggle = mediaBus.on('play_pause', () => togglePlay())
    return () => {
      offSeek()
      offToggle()
    }
  }, [seek, togglePlay])

  /* --------------- YouTube engine --------------- */
  useEffect(() => {
    if (engine !== 'youtube' || !item.youtubeId) return
    let cancelled = false

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !youtubeHostRef.current || !window.YT) return
        youtubePlayerRef.current = new window.YT.Player(youtubeHostRef.current, {
          videoId: item.youtubeId,
          playerVars: { rel: 0, modestbranding: 1, playsinline: 1, start: Math.floor(pendingSeekRef.current ?? 0) },
          events: {
            onReady: () => {
              const pending = pendingSeekRef.current
              if (pending) youtubePlayerRef.current?.seekTo(pending, true)
              youtubePlayerRef.current?.setPlaybackRate(rate)
            },
            onStateChange: (event: { data: number }) => {
              setIsPlaying(event.data === window.YT?.PlayerState.PLAYING)
            },
            onError: () => setYoutubeError('YouTube refused to play this record.'),
          },
        })
      })
      .catch((error: Error) => {
        if (!cancelled) setYoutubeError(error.message)
      })

    return () => {
      cancelled = true
      try {
        youtubePlayerRef.current?.destroy()
      } catch {
        // The iframe may already be gone with the unmounted host node.
      }
      youtubePlayerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, item.youtubeId])

  /* One clock for both engines, at the 250 ms cadence the transcript needs. */
  useEffect(() => {
    if (!isPlaying) return
    const timer = window.setInterval(() => {
      if (engine === 'youtube') {
        const player = youtubePlayerRef.current
        if (player) publishTime(player.getCurrentTime())
      } else {
        const element = nativeRef.current
        if (element) publishTime(element.currentTime)
      }
    }, TICK_MS)
    return () => window.clearInterval(timer)
  }, [engine, isPlaying, publishTime])

  useEffect(() => {
    if (engine === 'youtube') youtubePlayerRef.current?.setPlaybackRate(rate)
    else if (nativeRef.current) nativeRef.current.playbackRate = rate
  }, [engine, rate])

  const stepBy = useCallback((delta: number) => seek(currentTime + delta), [currentTime, seek])

  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0

  const engineToggle = useMemo(() => {
    if (!canUseYouTube || !hasLocalStream) return null
    return (
      <button
        onClick={() => setEngine(engine === 'youtube' ? 'native' : 'youtube')}
        className="st-media-chip"
        title={engine === 'youtube' ? 'Play the attached local file' : 'Play the YouTube stream'}
      >
        {engine === 'youtube' ? <MonitorPlay size={12} /> : <SpeakerHigh size={12} />}
        {engine === 'youtube' ? 'YouTube' : 'Local file'}
      </button>
    )
  }, [canUseYouTube, engine, hasLocalStream])

  return (
    <div className="border-b border-ed-rule bg-ed-bg-secondary">
      {/* Stage */}
      <div className="relative aspect-video w-full bg-black/90">
        {engine === 'youtube' ? (
          youtubeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <WifiSlash size={22} className="text-ed-fg-muted" />
              <p className="text-[11px] leading-relaxed text-ed-fg-muted">
                {youtubeError} Every catalog record streams from YouTube, so playback needs a connection.
              </p>
              <button onClick={onAttachLocalFile} className="st-media-chip">
                Attach a local file instead
              </button>
            </div>
          ) : (
            <div className="absolute inset-0">
              <div ref={youtubeHostRef} className="h-full w-full" />
            </div>
          )
        ) : item.streamUrl ? (
          isVideo ? (
            <video
              ref={nativeRef as React.RefObject<HTMLVideoElement>}
              src={item.streamUrl}
              className="h-full w-full"
              controls={false}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(event) => publishTime(event.currentTarget.currentTime)}
              onLoadedMetadata={(event) => {
                const pending = pendingSeekRef.current
                if (pending) event.currentTarget.currentTime = pending
                event.currentTarget.playbackRate = rate
              }}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <SpeakerHigh size={28} className="text-ed-fg-muted" />
              <audio
                ref={nativeRef as React.RefObject<HTMLAudioElement>}
                src={item.streamUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(event) => publishTime(event.currentTarget.currentTime)}
                onLoadedMetadata={(event) => {
                  const pending = pendingSeekRef.current
                  if (pending) event.currentTarget.currentTime = pending
                  event.currentTarget.playbackRate = rate
                }}
              />
              <span className="text-[10px] uppercase tracking-wider text-ed-fg-muted">Audio only</span>
            </div>
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <MonitorPlay size={22} className="text-ed-fg-muted" />
            <p className="text-[11px] text-ed-fg-muted">No stream attached for this record.</p>
            <button onClick={onAttachLocalFile} className="st-media-chip">
              Attach a local file
            </button>
          </div>
        )}
      </div>

      {/* Scrub bar */}
      <div
        className="group relative h-1.5 w-full cursor-pointer bg-ed-surface"
        onClick={(event) => {
          if (!duration) return
          const bounds = event.currentTarget.getBoundingClientRect()
          seek(((event.clientX - bounds.left) / bounds.width) * duration)
        }}
        title={duration ? `Seek within ${formatSeconds(duration)}` : 'Duration unknown'}
      >
        <div className="h-full bg-ed-accent transition-[width] duration-200" style={{ width: `${progress}%` }} />
      </div>

      {/* Transport */}
      <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2">
        <button onClick={() => stepBy(-STEP_SECONDS)} className="st-media-icon" title="Back 5 seconds (J)">
          <ArrowCounterClockwise size={14} />
        </button>
        <button
          onClick={togglePlay}
          className="st-media-icon st-media-icon-primary"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
        </button>
        <button onClick={() => stepBy(STEP_SECONDS)} className="st-media-icon" title="Forward 5 seconds (L)">
          <ArrowClockwise size={14} />
        </button>

        <span className="ml-1 font-mono text-[11px] tabular-nums text-ed-fg-secondary">
          {formatSeconds(currentTime)}
          <span className="text-ed-fg-faint"> / {item.duration ?? formatSeconds(duration)}</span>
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
            className="st-media-select"
            title="Playback rate"
            aria-label="Playback rate"
          >
            {PLAYBACK_RATES.map((value) => (
              <option key={value} value={value}>
                {value}&times;
              </option>
            ))}
          </select>

          <button onClick={onInsertTimestamp} className="st-media-chip" title="Insert current timestamp (Ctrl+Shift+T)">
            <Clock size={12} />
            Stamp
          </button>

          {engineToggle}

          {hasLocalStream ? (
            <button onClick={onDetachLocalFile} className="st-media-chip" title="Forget the attached local file">
              Detach
            </button>
          ) : (
            <button onClick={onAttachLocalFile} className="st-media-chip" title="Attach a local audio or video file">
              Attach
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
