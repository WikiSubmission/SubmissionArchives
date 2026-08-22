#!/usr/bin/env node
/**
 * Builds the media index that SA Studio's Media Notes panel reads.
 *
 * Studio is a separate Vite/Tauri app: it cannot reach into the Next.js
 * `public/` tree at runtime, and MASTER_INDEX.json (31 MB) is far too large to
 * ship or fetch wholesale. So this script projects the curated catalog plus its
 * transcripts into two shapes Studio can consume:
 *
 *   studio/public/media/catalog.json             one index of every media record
 *   studio/public/media/transcripts/<slug>.json  one lazily fetched transcript
 *
 * Transcripts use a columnar cue encoding ([start, end, text, speakerIndex])
 * with an interned speaker table, which roughly halves the on-disk size versus
 * the object-per-cue form in MASTER_INDEX.
 *
 * Run: npm run generate:studio-media
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const CATALOG_DIR = path.join(ROOT, 'data', 'catalog')
const MASTER_INDEX = path.join(ROOT, 'public', 'data', 'generated_indices', 'MASTER_INDEX.json')
const OUT_DIR = path.join(ROOT, 'studio', 'public', 'media')
const TRANSCRIPT_DIR = path.join(OUT_DIR, 'transcripts')

const CHECK_ONLY = process.argv.includes('--check')

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

/** Chapter sidecars are keyed QS01..QS52 / MA53..MA100, mirroring the web
 * catalog page's resolution order: inline chapters win, sidecar fills the gap. */
const SIDECAR_PREFIX = { 'quran-study': 'QS', 'messenger-audio': 'MA' }

function resolveChapters(item, masterItem) {
  if (masterItem?.chapters?.length) return masterItem.chapters
  if (item.chapters?.length) return item.chapters
  const prefix = SIDECAR_PREFIX[item.type]
  if (!prefix) return []
  const match = (item.id || '').match(/^[a-z-]+\/(\d+)/i)
  if (!match) return []
  const file = path.join(CATALOG_DIR, 'chapters', prefix + String(Number(match[1])).padStart(2, '0') + '.json')
  if (!fs.existsSync(file)) return []
  try {
    const sidecar = readJson(file)
    return Array.isArray(sidecar.chapters) ? sidecar.chapters : []
  } catch {
    return []
  }
}

/** MA 72+ come from unverified auto-captions, and the 1987 debate deliberately
 * leaves 101 rows blank because the audio cannot settle who is speaking. Neither
 * may inherit the record author, or the archive would silently attribute other
 * voices to Dr. Khalifa. Mirrors src/app/media/[...id]/page.tsx. */
function isUnverifiedSpeakerSource(item) {
  return (
    (item.type === 'messenger-audio' && (item.primaryNumber ?? 0) >= 72) ||
    item.id === 'video-program/debate-dr-rashad-khalifa-ph-d-vs-sunni-scholars-1987'
  )
}

export function slugifyMediaId(id) {
  return String(id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0
}

function encodeCues(segments, defaultSpeaker) {
  const speakers = []
  const speakerIndex = new Map()
  const cues = []
  for (const segment of segments) {
    const text = (segment.text ?? '').replace(/\s*\n\s*/g, ' ').trim()
    if (!text) continue
    const speaker = segment.speaker || defaultSpeaker
    let index = -1
    if (speaker) {
      if (!speakerIndex.has(speaker)) {
        speakerIndex.set(speaker, speakers.length)
        speakers.push(speaker)
      }
      index = speakerIndex.get(speaker)
    }
    const start = Number(segment.start ?? 0)
    const end = Number(segment.end ?? start)
    cues.push([round(start), round(end), text, index])
  }
  return { speakers, cues }
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return undefined
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return hours > 0 ? hours + ':' + pad(minutes) + ':' + pad(secs) : minutes + ':' + pad(secs)
}

function build() {
  const videos = readJson(path.join(CATALOG_DIR, 'videos.json'))
  const audios = readJson(path.join(CATALOG_DIR, 'audios.json'))
  const master = fs.existsSync(MASTER_INDEX) ? readJson(MASTER_INDEX) : []
  const masterById = new Map(master.map((record) => [record.id, record]))

  const items = []
  const transcripts = new Map()
  const usedSlugs = new Set()
  const warnings = []

  for (const raw of [...videos, ...audios]) {
    if (!raw?.id) continue
    const masterItem = masterById.get(raw.id)
    const chapters = resolveChapters(raw, masterItem).map((chapter, index) => ({
      id: chapter.id ?? index + 1,
      startTime: round(Number(chapter.startTime ?? 0)),
      endTime: chapter.endTime == null ? undefined : round(Number(chapter.endTime)),
      title: chapter.title ?? 'Chapter ' + (index + 1),
      speaker: chapter.speaker || undefined,
    }))

    const defaultSpeaker = isUnverifiedSpeakerSource(raw) ? '' : raw.author || 'Dr. Rashad Khalifa'
    const encoded = encodeCues(masterItem?.segments ?? [], defaultSpeaker)
    const encodedAr = encodeCues(masterItem?.segments_ar ?? [], defaultSpeaker)

    let slug = slugifyMediaId(raw.id)
    if (usedSlugs.has(slug)) {
      let suffix = 2
      while (usedSlugs.has(slug + '-' + suffix)) suffix += 1
      warnings.push('slug collision for ' + raw.id + ' -> ' + slug + ' (suffixed -' + suffix + ')')
      slug = slug + '-' + suffix
    }
    usedSlugs.add(slug)

    const lastCue = encoded.cues[encoded.cues.length - 1]
    const lastChapter = chapters[chapters.length - 1]
    const durationSeconds =
      Number(masterItem?.duration_seconds) ||
      Number(raw.duration_seconds) ||
      (lastCue ? lastCue[1] : 0) ||
      (lastChapter?.endTime ?? 0)

    if (!encoded.cues.length) warnings.push('no transcript cues for ' + raw.id)
    if (!raw.youtubeId && !raw.youtubeUrl) warnings.push('no playable stream for ' + raw.id)

    items.push({
      id: raw.id,
      slug,
      title: raw.title ?? raw.id,
      displayTitle: raw.displayTitle ?? raw.title ?? raw.id,
      type: raw.type,
      author: raw.author ?? 'Dr. Rashad Khalifa',
      date: raw.fullDate || raw.date || undefined,
      year: raw.year ?? undefined,
      durationSeconds: durationSeconds || undefined,
      duration: formatDuration(durationSeconds),
      youtubeId: raw.youtubeId || undefined,
      youtubeUrl: raw.youtubeUrl || undefined,
      thumbnail: raw.thumbnailOverride || undefined,
      description: raw.description || undefined,
      primaryNumber: raw.primaryNumber ?? undefined,
      cueCount: encoded.cues.length,
      speakers: encoded.speakers,
      chapters,
    })

    transcripts.set(slug, {
      id: raw.id,
      slug,
      durationSeconds: durationSeconds || undefined,
      speakers: encoded.speakers,
      cues: encoded.cues,
      ...(encodedAr.cues.length ? { speakersAr: encodedAr.speakers, cuesAr: encodedAr.cues } : {}),
    })
  }

  return { catalog: { count: items.length, items }, transcripts, warnings }
}

function main() {
  const { catalog, transcripts, warnings } = build()
  const catalogPath = path.join(OUT_DIR, 'catalog.json')

  if (CHECK_ONLY) {
    for (const warning of warnings) console.warn('[studio-media] ' + warning)
    const existing = fs.existsSync(catalogPath) ? readJson(catalogPath) : null
    const missingTranscripts = [...transcripts.keys()].filter(
      (slug) => !fs.existsSync(path.join(TRANSCRIPT_DIR, slug + '.json'))
    )
    if (!existing || existing.count !== catalog.count || missingTranscripts.length > 0) {
      console.error(
        '[studio-media] studio/public/media is missing or stale (' +
          missingTranscripts.length +
          ' transcripts absent). Run npm run generate:studio-media'
      )
      process.exit(1)
    }
    console.log('[studio-media] check ok (' + catalog.count + ' records)')
    return
  }

  fs.mkdirSync(TRANSCRIPT_DIR, { recursive: true })
  for (const stale of fs.readdirSync(TRANSCRIPT_DIR)) {
    if (stale.endsWith('.json') && !transcripts.has(stale.replace(/\.json$/, ''))) {
      fs.rmSync(path.join(TRANSCRIPT_DIR, stale))
    }
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog) + '\n')
  let bytes = 0
  for (const [slug, transcript] of transcripts) {
    const json = JSON.stringify(transcript) + '\n'
    bytes += json.length
    fs.writeFileSync(path.join(TRANSCRIPT_DIR, slug + '.json'), json)
  }

  for (const warning of warnings) console.warn('[studio-media] ' + warning)
  console.log(
    '[studio-media] wrote catalog.json (' +
      catalog.count +
      ' records) and ' +
      transcripts.size +
      ' transcripts (' +
      (bytes / 1e6).toFixed(2) +
      ' MB)'
  )
}

main()
