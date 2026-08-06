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
| `data/rag_enrichment/` | `data/rag/enrichment/` |
| `data/rag_eval/` | `data/rag/eval/` |

References updated for the last two: `scripts/rag/verify.ts`,
`scripts/rag/run-eval.ts`, `scripts/rag/run-answer-eval.ts`,
`scripts/rag/lib/enrichment.ts`, `scripts/corpus/apply-review-verdicts.ts`,
`scripts/corpus/generate-quran-enrichment.ts`,
`scripts/corpus/build-review-packets.ts`,
`scripts/corpus/check-enrichment-grounding.ts`,
`scripts/corpus/integrate-complete-corpus.mjs`,
`docs/CORPUS_INTEGRATION_PLAN.md`, and the `"file"` path fields inside
`reports/enrichment-review/review-exceptions.json` and
`reports/enrichment-review/verdicts/wave-*.json` (these are read at runtime
by `apply-review-verdicts.ts` to match verdicts to files, not just historical
record — leaving them stale would have silently orphaned real review work).
All other renames required no reference updates, confirmed by repo-wide
grep before each move (see SA_AUDIT.md).

## Duplicate "dat" folders: none found

`data/`, `public/data/`, and `src/data/` were fully hashed (1,149 files) and
reference-graphed. No two of them contain overlapping or duplicate content —
they are a raw-source → generated-output → app-bundled pipeline, each tier
serving a distinct purpose. There is nothing to keep-canonical-and-archive
here, because there is no duplicate pair to begin with.

## Decision: data/catalog, data/corpus, data/sources, public/data/*,
## src/data/* are not being renamed or moved

`data/rag_enrichment` and `data/rag_eval` *were* renamed (above) because
that had a concrete justification: they were flat siblings of `data/catalog`
despite being purely RAG-pipeline inputs, inconsistent with how
`scripts/rag/` already groups the same concern, and both are offline-only
(never read by live `src/` code), so the move touched zero request-time
paths. That's the bar for "worth it": a real inconsistency, fixed at low
risk.

The remaining directories don't clear that bar:

- **No naming inconsistency exists to fix.** Every one of them already uses
  a clear, consistent, purpose-named convention (`data/catalog`,
  `data/corpus`, `data/sources`, `public/data/generated_indices`,
  `src/data`). There's no snake_case vs kebab-case inconsistency, nothing a
  rename would clarify.
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

This is a value judgment, not a refusal to act: the authorization to touch
live data directories was exercised in full — for `archive/superseded/`
(genuinely orphaned content) and for `data/rag/{enrichment,eval}` (a real
organizational fix) — and deliberately not exercised where there was nothing
to fix. If there's a specific naming convention or structure wanted for the
remaining directories regardless, say so directly and it can be executed as
its own scoped, verified checkpoint.

## Execution

Three commits: root-script relocation, archive-superseded checkpoint, and
the `data/rag_enrichment` + `data/rag_eval` → `data/rag/{enrichment,eval}`
move (all landed). No further moves planned.
