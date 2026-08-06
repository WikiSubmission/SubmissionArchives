# SA Reorg Report

## Summary

The original objective assumed this repo was a loose collection of scripts,
csvs, pngs, and duplicate "dat" folders needing a ground-up reorganization.
That premise didn't hold: `SA` is a live Next.js application (Quran/Bible
library, mint 3D tool, audio/video archive) that already went through a prior
reorg, evidenced by the existing structured `scripts/`, `data/`, and
`reports/` directories and their audit artifacts.

Given that, and per your explicit scoping answers, this pass:

1. Committed all pre-existing uncommitted feature work first, as its own
   set of commits, untouched by the reorg itself.
2. Limited the actual reorg to loose root files and non-live data
   directories, excluding `public/data/`, `src/data/`, and `src/app/`.

## What moved

| Old path | New path |
|---|---|
| `convert_to_csv.py` | `scripts/process/convert_to_csv.py` |
| `fetch_transcripts.py` | `scripts/process/fetch_transcripts.py` |
| `process_csv_speakers.py` | `scripts/process/process_csv_speakers.py` |

All three are one small pipeline (fetch a YouTube transcript, convert to CSV,
normalize speaker labels) for the "Messenger Audio" series. They now sit next
to their closest siblings, `scripts/process/transcription_pipeline.py` and
`scripts/process/vtt-to-json-converter.ts`. No other file in the repo
referenced them by path, and their internal I/O is cwd-relative rather than
`__file__`-relative, so no code changes were needed beyond the move — verified
by identical pre/post SHA-256 hashes and a clean repo-wide reference grep.

## What was NOT moved, and why

- **`data/`, `public/data/`, `src/data/`** — not duplicates. They're a raw
  source → generated output → app-bundled pipeline, each serving a distinct
  purpose. `public/data/` is served at fixed URLs by Next.js and `src/data/`
  is imported directly by TypeScript; neither could be renamed without
  updating every fetch/import site across a live application, which was
  explicitly out of scope for this pass.
- **`reports/duplicate-files.csv` findings** — pre-existing, legitimate:
  a few adjacent Quran appendix thumbnails that hash equal, and
  `*_arabic_segments.csv` / `*_low_confidence_pages.csv` files intentionally
  shared across different book folders. Not stray copies; left alone.
- **`scratch/books-repo/`** — a nested git repository under `scratch/`.
  Already correctly named and located; left alone.
- **All of `src/app/`, mint feature, library reader, audio transcripts,
  and `.agents/`** — this was in-progress feature work sitting uncommitted
  at session start. It has been committed as its own set of five feature
  commits, completely separate from the reorg, and was not touched, moved,
  or renamed in any way.

## Commits made (in order)

1. `feat: add Bible and Testament scripture reading pages`
2. `feat: add mint API, 3D tool page, and supporting components`
3. `feat: add library book reader and PDF text highlighting`
4. `feat: add messenger audio transcripts MA70-72`
5. `chore: add skills-lock.json`
6. `chore: add transcript/CSV processing scripts` (baseline commit, pre-move)
7. `refactor: relocate orphaned transcript scripts into scripts/process`

All work is on branch `chore/sa-reorg-audit`, created from `main` before any
changes, per the Loop 0 safety net. Nothing has been pushed or merged.

## Nothing unclear

Every file touched had a clear, identifiable purpose. There is nothing left
over from this pass that needs a follow-up decision.
