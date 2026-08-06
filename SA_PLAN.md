# SA Reorg Plan

## Rename map (executed)

| Old path | New path |
|---|---|
| `convert_to_csv.py` | `scripts/process/convert_to_csv.py` |
| `fetch_transcripts.py` | `scripts/process/fetch_transcripts.py` |
| `process_csv_speakers.py` | `scripts/process/process_csv_speakers.py` |
| `data/sources/raw_transcripts/` | `archive/superseded/data/sources/raw_transcripts/` |
| `data/sources/newsletters/extras/` | `archive/superseded/data/sources/newsletters/extras/` |
| `reports/book-transcription-migration.csv` | `archive/superseded/reports/book-transcription-migration.csv` |
| `docs/newsletter_urls.md` | `archive/superseded/docs/newsletter_urls.md` |
| `docs/COLOR_SYSTEM_EXPLAINED.md` | `archive/superseded/docs/COLOR_SYSTEM_EXPLAINED.md` |
| `docs/SETUP_QURAN_COMPARE.md` | `archive/superseded/docs/SETUP_QURAN_COMPARE.md` |

References to update for each: none required. Confirmed by repo-wide grep
before each move (see SA_AUDIT.md).

## Duplicate "dat" folders: none found

`data/`, `public/data/`, and `src/data/` were fully hashed (1,149 files) and
reference-graphed. No two of them contain overlapping or duplicate content —
they are a raw-source → generated-output → app-bundled pipeline, each tier
serving a distinct purpose. There is nothing to keep-canonical-and-archive
here, because there is no duplicate pair to begin with.

## Decision: data/catalog, data/corpus, data/rag_enrichment, data/rag_eval,
## data/sources, public/data/*, src/data/* are not being renamed or moved

This was explicitly authorized (expand scope to include live app data dirs),
but after the full audit, no rename is being executed on these, for a
concrete reason rather than caution alone:

- **No naming inconsistency exists to fix.** Every one of these directories
  already uses a clear, consistent, purpose-named convention
  (`data/catalog`, `data/corpus`, `data/rag_enrichment`, `data/sources`,
  `public/data/generated_indices`, `src/data`). There's no snake_case vs
  kebab-case inconsistency, no ambiguous naming, nothing a rename would
  clarify.
- **No duplication exists to dedupe.** Established above.
- **Renaming would require rewriting live, request-time code paths for zero
  functional gain**: `data/catalog` is read via `path.join(process.cwd(),
  'data', 'catalog')` in three page components and two lib modules;
  `public/data/generated_indices/*` is read in at least six page/route
  files and is also the literal URL path Next.js serves it at;
  `src/data/quran_study_thumbnails.json` is a direct TypeScript import.
  Moving any of these means editing every one of those call sites, in a
  live production Next.js app, purely to relocate something that isn't
  broken, isn't duplicated, and isn't inconsistently named.

This is a value judgment, not a refusal to act: the earlier authorization to
touch live data directories is exercised in full for `archive/superseded/`
(genuinely orphaned/stale content, safely relocated), and deliberately not
exercised for the three "dat" folders themselves, because doing so would be
churn on a live application with no corresponding benefit. If there's a
specific naming convention or structure you want applied here regardless,
say so directly and it can be executed as its own scoped, verified
checkpoint — but it isn't something the audit surfaced a need for.

## Execution

Two commits: the root-script relocation (already landed), and the
archive-superseded checkpoint (already landed). No further moves planned.
