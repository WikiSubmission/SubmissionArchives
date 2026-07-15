# Maintenance Scripts

Optional data-maintenance scripts for rebuilding generated indices. None of these run automatically; the app reads their output at request time from `public/data/generated_indices/`.

## Catalog & Search Indices

`generate/generate_catalog_search_indices.mjs` rebuilds `MASTER_INDEX.json` (the canonical catalog of video, audio, newsletter, appendix, Quran, and book records), `BOOKS_LIST.json` (lightweight reader/sitemap metadata), `QURAN_CHAPTERS.json`, `CATALOG_VALIDATION.json`, and `ASSET_MANIFEST.csv`. Video/audio transcript segments are sourced from the timestamped CSVs in `data/sources/playlists/video-transcripts` and `data/sources/playlists/audio-transcripts`, matched by YouTube ID and playback window. Canonical book and Quran transcription inputs live in `data/sources`; raw source bundles are not deployed from `public`.

Generation validates record IDs, types, segment counts, required collection coverage, and referenced local assets before writing output. Run the same checks against existing generated output with:

```bash
npm run validate:catalog
```

Run after editing catalog lists, playlist CSVs, or anything under `data/sources`:

```bash
npm run generate:catalog
```

## Books and Quran

The public PDFs in `public/content/written/books` are matched to canonical transcriptions by a normalized source filename. Copy-number suffixes such as `(1)` are ignored, allowing the corpus source names to match the readable archive PDFs without renaming either artifact. The 1981 and 1989 complete Quran JSON files are also used as page-level book transcriptions; the 1989 verse index additionally powers the edition switcher in the Quran reader.

## Transcript Tooling

`process/transcription_pipeline.py` downloads audio via `yt-dlp` and runs local ASR (Whisper/Canary/Parakeet) to produce VTT transcripts for catalog items that have no playlist CSV coverage.

`process/vtt-to-json-converter.ts` converts raw VTT files in a `temp_vtt/` working directory into speaker-attributed JSON, including CP437 mojibake recovery for Arabic text.

`utils/analyze-speakers.ts` scans a `temp_vtt/` directory and reports detected speaker-label patterns, useful when tuning the normalization rules in `vtt-to-json-converter.ts`.
