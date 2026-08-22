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

The public PDFs in `public/content/written/books` are matched to canonical transcriptions in `data/sources/books` by a normalized source filename. Copy-number suffixes such as `(1)` are ignored, allowing the corpus source names to match the readable archive PDFs without renaming either artifact. Quran search is powered by the canonical 1992 edition under `data/sources/quran/1992`. Historical 1981 and 1989 Quran editions are preserved as visual PDF scans in `public/content/written/books` for visual facsimile reading.
