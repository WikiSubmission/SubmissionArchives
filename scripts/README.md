# Maintenance Scripts

This folder contains optional data-maintenance scripts for rebuilding generated indexes.

## Media Indexes

`generate_mega_indices.ts` scans media storage and rebuilds the master transcript indexes for sermons, video programs, Quran studies, and messenger audios.

Run manually when new media is uploaded:

```bash
npx tsx scripts/generate_mega_indices.ts
```

## Books Indexes

`generate_other_index.ts` and `ocr-other-books.ts` rebuild `public/data/other/search_index.json` from the PDFs in `public/content/books`.

Run one of these only when the books PDFs change:

```bash
npx tsx scripts/generate_other_index.ts
npx tsx scripts/ocr-other-books.ts
```
