# SA Audit

Scope note: the original reorg objective assumed a loose collection of scripts,
csvs, pngs, and duplicate "dat" folders. That does not match this repo's actual
state. `scripts/`, `data/`, `reports/`, and `assets/` already have an
established, purposeful structure from prior reorg work (see the existing
`reports/duplicate-files.csv`, `reports/orphan-assets.csv`,
`reports/directory-sizes.csv`, `reports/route-map.md`). Per user direction,
this pass is scoped to loose root files and non-live data dirs, excluding
`public/data/`, `src/data/`, and all of `src/app/` (live Next.js routes and
in-progress feature work).

## Data directories are not duplicates

- `data/` — raw source material feeding build/generation scripts (catalog,
  corpus, rag_enrichment, rag_eval, sources/{bible,books,newsletters,
  playlists,quran}, raw_transcripts).
- `public/data/` — generated output served directly by Next.js at fixed URLs
  (e.g. `generated_indices/MASTER_INDEX.json`, `scriptures/ot/*.json`). Live,
  excluded from this pass.
- `src/data/` — small app-bundled data (`quran_study_thumbnails.json`),
  imported directly by TypeScript. Live, excluded from this pass.

These form a raw → generated → bundled pipeline, not duplicate copies. No
dedup action needed.

## Existing duplicate-file findings (pre-existing, out of scope)

`reports/duplicate-files.csv` already documents true file-level duplicates:
a handful of adjacent Quran appendix thumbnails that happen to hash equal, and
matching `*_arabic_segments.csv` / `*_low_confidence_pages.csv` files shared
across different book source folders. These are legitimate cross-references
in existing book-processing data, not stray copies, and are left untouched.

## Reorg target: orphaned root-level scripts

| Path | Size | Modified | Purpose |
|---|---|---|---|
| `convert_to_csv.py` | 1706 B | 2026-07-31 | Fetches a YouTube transcript and writes it to CSV under `data/sources/playlists/audio-transcripts/`. |
| `fetch_transcripts.py` | 1032 B | 2026-07-31 | Fetches a YouTube transcript and writes a WebVTT file under `public/content/audios/messenger-audios/`. |
| `process_csv_speakers.py` | 6493 B | 2026-08-06 | Post-processes the CSVs from `convert_to_csv.py`, splitting/normalizing speaker segments in place. |

All three sit at repo root while every comparable script already lives under
`scripts/` (e.g. `scripts/process/transcription_pipeline.py`,
`scripts/process/vtt-to-json-converter.ts`, `scripts/utils/analyze-speakers.ts`).
They form one small pipeline (fetch → convert → normalize speakers) for the
"MA" (Messenger Audio) transcript series.

### Reference graph

Repo-wide case-insensitive search for `convert_to_csv`, `fetch_transcripts`,
`process_csv_speakers` returns **zero matches** outside the files themselves —
no `package.json` script, no README/docs mention, no CI workflow, no other
script imports or shells out to them.

All file I/O inside the three scripts uses paths relative to the process's
current working directory (`data/sources/...`, `public/content/...`), not
`__file__`-relative paths. Moving the script files does not change these
paths as long as they continue to be invoked from the repo root — which is
the existing convention for every script in `scripts/`.

**Conclusion: safe to relocate with no reference updates required beyond the
move itself.**

### Content hashes (pre-move baseline)

```
8ebbb9ce46647b5394c28431caa2b57177379a66f6c90d296905cb30103d9c2e  convert_to_csv.py
0e736c9569bd712c865a1760675eb47b04d33bbeced84f9767f7e3aae3eba4a9  fetch_transcripts.py
d9badfcab14cc94b931831a367489a83546a1e84fee6b1ce386bc426a147ec4a  process_csv_speakers.py
```

## Other notable state (informational only, not touched)

- `scratch/books-repo/` is a nested git repository (has its own `.git`).
  Already correctly named/located under `scratch/`; left alone.
- `reports/` contains dated audit artifacts from an earlier reorg effort.
  Left alone as historical record.

## Final state

| Old path | New path | Verified |
|---|---|---|
| `convert_to_csv.py` | `scripts/process/convert_to_csv.py` | ✅ |
| `fetch_transcripts.py` | `scripts/process/fetch_transcripts.py` | ✅ |
| `process_csv_speakers.py` | `scripts/process/process_csv_speakers.py` | ✅ |

Verification performed: `git mv` reported 100% renames with 0
insertions/deletions; post-move SHA-256 hashes match the pre-move baseline
exactly; `python -m py_compile` succeeds on all three; a repo-wide
case-insensitive grep for the old filenames returns matches only in this
audit/plan doc, none in code. Full execution was not attempted — both
transcript scripts make live YouTube API calls and `process_csv_speakers.py`
rewrites CSVs in place, none of which is relevant to confirming a pure file
relocation.
