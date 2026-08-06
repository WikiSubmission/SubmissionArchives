# SA Reorg Report

## Summary

The original objective assumed `/SA` was a loose collection of scripts,
csvs, pngs, and duplicate "dat" folders needing a ground-up reorganization.
It's a live Next.js application (Quran/Bible library, mint 3D tool,
audio/video archive) that already went through a prior reorg — evidenced by
its existing structured `scripts/`, `data/`, and `reports/` directories.

This pass ran a full explore → plan → execute → verify cycle:

1. Committed all pre-existing uncommitted feature work first, as its own
   set of commits, untouched by the reorg.
2. Ran four parallel explorations covering every subtree of the repo:
   `scripts/`, `data/`, the `public/` asset directories, and
   root/reports/scratch/docs/tests.
3. Hashed all 1,149 files under `data/`, `public/data/`, `public/images/`,
   `public/content/`, `assets/`, `reports/`, and `src/data/` to conclusively
   test the "duplicate dat folders" premise.
4. Executed two verified move checkpoints, and made an explicit,
   reasoned decision not to execute a third.

## What moved

**Checkpoint 1 — orphaned root scripts into their pipeline home:**

| Old path | New path |
|---|---|
| `convert_to_csv.py` | `scripts/process/convert_to_csv.py` |
| `fetch_transcripts.py` | `scripts/process/fetch_transcripts.py` |
| `process_csv_speakers.py` | `scripts/process/process_csv_speakers.py` |

**Checkpoint 2 — genuinely orphaned/misplaced content, archived not deleted:**

| Old path | New path | Why |
|---|---|---|
| `data/sources/raw_transcripts/` | `archive/superseded/data/sources/raw_transcripts/` | Zero references anywhere in the repo |
| `data/sources/newsletters/extras/` | `archive/superseded/data/sources/newsletters/extras/` | Zero references anywhere in the repo |
| `reports/book-transcription-migration.csv` | `archive/superseded/reports/book-transcription-migration.csv` | References a directory that no longer exists; no generating script |
| `docs/newsletter_urls.md` | `archive/superseded/docs/newsletter_urls.md` | Raw scrape input, zero code references |
| `docs/COLOR_SYSTEM_EXPLAINED.md` | `archive/superseded/docs/COLOR_SYSTEM_EXPLAINED.md` | Describes an unrelated project (`rk-media-platform`) |
| `docs/SETUP_QURAN_COMPARE.md` | `archive/superseded/docs/SETUP_QURAN_COMPARE.md` | Same unrelated project; references a file that doesn't exist here |

Both checkpoints verified clean: `git mv` reported 100% renames with 0
insertions/deletions, pre/post SHA-256 hashes matched exactly, and a
repo-wide grep for every old path returned no functional stale references
(only a generated inventory CSV that regenerates on its own).

## The "multiple dat folders": there weren't any

`data/`, `public/data/`, and `src/data/` were fully hashed and
reference-graphed. They are a raw-source → generated-output → app-bundled
pipeline, each tier serving a distinct, load-bearing purpose:

- `data/catalog` — read live by three page components and two lib modules
- `data/corpus`, `data/rag_enrichment`, `data/rag_eval` — offline pipeline
  inputs, ingested into Postgres, never opened directly by the running app
- `data/sources` — raw build inputs, explicitly excluded from the Docker
  image via `.dockerignore`
- `public/data/*` — generated indices and Hebrew scripture text, served
  live at fixed URLs and read by six-plus page/route files
- `src/data/*` — a small app-bundled JSON, imported directly

None of these duplicate each other. The 13 true duplicate-hash groups found
across the full 1,149-file scan are adjacent batch-processed thumbnails and
intentional "latest pointer" report aliases — not stray copies of anything.

Given that, `data/catalog`, `data/corpus`, `data/rag_enrichment`,
`data/rag_eval`, `data/sources`, `public/data/*`, and `src/data/*` were
deliberately not renamed or moved, despite having authorization to do so.
There was no naming inconsistency or duplication for a rename to fix, and
doing it anyway would mean rewriting live request-time code paths in a
production app for no functional benefit. Full reasoning in SA_PLAN.md.

## Files whose purpose was genuinely unclear

- `docs/COLOR_SYSTEM_EXPLAINED.md` and `docs/SETUP_QURAN_COMPARE.md` turned
  out to describe a different project entirely (`rk-media-platform`,
  `submitter-perspectives/[id]/page.tsx`, a Supabase client that doesn't
  exist anywhere in this repo) — almost certainly copied in by mistake from
  a sibling project on the same machine. Archived rather than deleted, in
  case that's wrong.
- `data/sources/raw_transcripts/` (one `.srt.txt` debate transcript) and
  `data/sources/newsletters/extras/` (two scanned bulletin issues) have no
  code path anywhere that reads them — worth confirming with whoever added
  them whether they were meant to feed a pipeline that was never wired up.

## Commits made this session (in order)

1. `feat: add Bible and Testament scripture reading pages`
2. `feat: add mint API, 3D tool page, and supporting components`
3. `feat: add library book reader and PDF text highlighting`
4. `feat: add messenger audio transcripts MA70-72`
5. `chore: add skills-lock.json`
6. `chore: add transcript/CSV processing scripts` (pre-move baseline)
7. `refactor: relocate orphaned transcript scripts into scripts/process`
8. `docs: add SA reorg audit, plan, and report`
9. `chore: archive orphaned data and misplaced docs`

All work is on branch `chore/sa-reorg-audit`, created from `main` before any
changes. Nothing has been pushed or merged.
