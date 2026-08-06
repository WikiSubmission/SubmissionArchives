# SA Audit

Comprehensive pass, incorporating four parallel read-only explorations
(scripts/, data/, public asset directories, root/reports/scratch/docs/tests)
plus a full SHA-256 hash of every file under data/, public/data/,
public/images/, public/content/, assets/, reports/, and src/data/ (1,149
files).

## 1. The "multiple dat folders" premise

`data/`, `public/data/`, and `src/data/` are **not duplicates of each other**.
They are three distinct tiers of one pipeline:

| Folder | Role | Live at request time? |
|---|---|---|
| `data/catalog/` | Hand-maintained catalog seeds (audios/videos/newsletters/appendix-editions JSON + a CSV) | **Yes** — read directly via `fs` by `src/app/audios/page.tsx`, `src/app/videos/page.tsx`, `src/app/media/[...id]/page.tsx`, `src/lib/appendixCatalog.ts`, `src/lib/newsletterCatalog.ts`. Shipped into the Docker image (`COPY --from=builder /app/data ./data`). |
| `data/corpus/` | Cross-edition Quran comparison + written-document relationship data | Offline only — feeds `scripts/corpus/generate-quran-enrichment.ts` and `scripts/rag/lib/enrichment.ts`. Never opened by `src/` code. |
| `data/rag_enrichment/`, `data/rag_eval/` | LLM-generated enrichment docs and eval question sets | Offline only — ingested into Postgres by `scripts/rag/build-and-ingest.ts`; the live app queries Postgres (`src/lib/rag/retrieval.ts`), never these JSON files directly. Shipped into the Docker image but never opened there — effectively dead weight in the runtime container. |
| `data/sources/` | Raw private build inputs (Bible USFM, Quran editions, book OCR, transcripts, playlists) | **Never reaches the runtime image** — explicitly excluded via `.dockerignore` (`data/sources`), confirmed by `data/sources/README.md`'s own claim. Consumed only by offline scripts under `scripts/generate/`, `scripts/corpus/`, `scripts/process/`. |
| `public/data/generated_indices/*` | Generated search/catalog indices (`MASTER_INDEX.json`, `BOOKS_LIST.json`, `QURAN_CHAPTERS.json`, bible book JSON) | **Yes, live** — read by `src/app/search/actions.ts`, `src/app/sitemap.ts`, `src/app/api/health/route.ts`, `src/app/written/page.tsx`, `src/app/library/[id]/*`, `src/app/quran/**`. Also served directly at fixed URLs since anything under `public/` is Next.js's static root. |
| `public/data/scriptures/ot/*` | Generated Hebrew OT text | **Yes, live** — read by `src/app/quran/bible/[book]/page.tsx::getHebrewData()`. |
| `src/data/quran_study_thumbnails.json` | Small app-bundled data | **Yes, live** — imported directly by TypeScript. |

Every one of these serves a distinct, load-bearing, non-overlapping purpose.
There is no canonical-vs-stale-copy relationship anywhere in this set —
nothing here is a duplicate "dat" folder in the sense the original objective
assumed.

## 2. Hash-diff: true duplicates found (1,149 files hashed)

13 duplicate-hash groups exist, none across `data/`, `public/data/`, or
`src/data/`:

- 8 groups: adjacent Quran appendix thumbnails (1989/1992 editions) that
  happen to hash equal — batch-processed images, not accidental copies.
- 3 groups: `reports/*/latest-*.json` and `latest-*.md` files that are an
  intentional "pointer to most recent" convention sitting alongside their
  timestamped originals (`corpus-migration`, `rag-eval`, `rag-answer-eval`).
- 2 groups previously documented in `reports/duplicate-files.csv`
  (`*_arabic_segments.csv` / `*_low_confidence_pages.csv` across book
  folders) **no longer exist on disk** — that report is partially stale
  relative to current repo state.

**Conclusion: zero duplicate dat folders exist. No archive/dedup action is
warranted or was taken on data/, public/data/, or src/data/.**

## 3. Full scripts/ reference graph

See prior exploration output for the complete per-file table. Summary:

- **Genuinely wired into `package.json`/CI**: `audit-assets.mjs`,
  `generate_catalog_search_indices.mjs`, `validate_catalog.mjs`,
  `generate_book_thumbnails.mjs`, `prepare-standalone.mjs`,
  `verify_catalog_reproducibility.mjs`, all 8 `scripts/rag/*.ts` entry
  points, plus `scripts/lib/archive-schema.mjs` (imported by two of the
  above and by `tests/integration/catalog.test.ts`).
- **Documented manual tools** (referenced in `scripts/README.md`, no
  npm/CI wiring): `transcription_pipeline.py`, `vtt-to-json-converter.ts`,
  `analyze-speakers.ts`.
- **Orphans with zero references anywhere**: `build_islam_volume_bundle.mjs`,
  `clean_quran1989_structured_csvs.py`, `extract_sefaria_hebrew.py`,
  `inject_bible_footnotes.py`, `rename_books.js`, `update_manifests.js`,
  `run-corpus-migration.ps1`, and most of `scripts/corpus/*.ts` (mentioned
  only in `docs/RAG_FINALIZATION_REPORT.md` narrative text, not called by
  anything). These are all already sensibly located within `scripts/`
  subdirectories matching their purpose (`generate/`, `corpus/`) — orphan
  status alone isn't a location problem, so none were relocated.

Every script using `process.cwd()`-relative paths assumes invocation from
repo root (the established convention per `scripts/README.md`); scripts
using `__file__`/`__dirname` resolution are location-independent.

## 4. Archived this session (see SA_REPORT.md for full rationale)

| Old path | New path | Reason |
|---|---|---|
| `data/sources/raw_transcripts/` | `archive/superseded/data/sources/raw_transcripts/` | Zero references anywhere in the repo |
| `data/sources/newsletters/extras/` | `archive/superseded/data/sources/newsletters/extras/` | Zero references anywhere in the repo |
| `reports/book-transcription-migration.csv` | `archive/superseded/reports/book-transcription-migration.csv` | References a deleted directory (`public/content/books/jsons/`); no generating script |
| `docs/newsletter_urls.md` | `archive/superseded/docs/newsletter_urls.md` | Raw scrape input, zero code references |
| `docs/COLOR_SYSTEM_EXPLAINED.md` | `archive/superseded/docs/COLOR_SYSTEM_EXPLAINED.md` | Describes an unrelated project (`rk-media-platform`) — copied in by mistake |
| `docs/SETUP_QURAN_COMPARE.md` | `archive/superseded/docs/SETUP_QURAN_COMPARE.md` | Same unrelated project; references a `supabaseClient.ts` that doesn't exist in this repo |

## 5. Final state — all moves this session

| Old path | New path | Verified |
|---|---|---|
| `convert_to_csv.py` | `scripts/process/convert_to_csv.py` | ✅ |
| `fetch_transcripts.py` | `scripts/process/fetch_transcripts.py` | ✅ |
| `process_csv_speakers.py` | `scripts/process/process_csv_speakers.py` | ✅ |
| `data/sources/raw_transcripts/*` | `archive/superseded/data/sources/raw_transcripts/*` | ✅ |
| `data/sources/newsletters/extras/*` | `archive/superseded/data/sources/newsletters/extras/*` | ✅ |
| `reports/book-transcription-migration.csv` | `archive/superseded/reports/book-transcription-migration.csv` | ✅ |
| `docs/newsletter_urls.md` | `archive/superseded/docs/newsletter_urls.md` | ✅ |
| `docs/COLOR_SYSTEM_EXPLAINED.md` | `archive/superseded/docs/COLOR_SYSTEM_EXPLAINED.md` | ✅ |
| `docs/SETUP_QURAN_COMPARE.md` | `archive/superseded/docs/SETUP_QURAN_COMPARE.md` | ✅ |

All verified via `git mv` (100% rename, 0 insertions/deletions), pre/post
SHA-256 match, and repo-wide grep returning no functional stale references
(only a generated inventory CSV that will regenerate correctly).

## 6. What was deliberately not renamed, and why

`data/catalog`, `data/corpus`, `data/rag_enrichment`, `data/rag_eval`,
`data/sources`, `public/data/*`, `src/data/*` — no rename or restructuring
was performed. See SA_PLAN.md for the reasoning.
