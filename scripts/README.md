# Maintenance Scripts

This folder contains optional data-maintenance scripts for rebuilding generated indexes.

## Media Indexes

`generate/generate_catalog_search_indices.mjs` rebuilds the runtime catalog and search indexes for videos, Quran studies, messenger audios, and R2 asset metadata.

Run manually when new media is uploaded:

```bash
node scripts/generate/generate_catalog_search_indices.mjs
```

## Books Indexes

`generate/generate_other_index.ts` and `process/ocr-other-books.ts` rebuild `public/data/other/search_index.json` from the PDFs in `public/content/books`.

Run one of these only when the books PDFs change:

```bash
npx tsx scripts/generate/generate_other_index.ts
npx tsx scripts/process/ocr-other-books.ts
```
