# AskArchives corpus integration plan

## The finding that determines everything

The existing transcript folders are **not legacy copies**. They are the canonical private build inputs.

The catalog generator reads:

- `data/sources/playlists/video-transcripts`
- `data/sources/playlists/audio-transcripts`

It combines every CSV row by YouTube ID. Therefore:

- deleting those folders breaks catalog regeneration
- copying the package transcripts beside them can duplicate every segment
- the shortened `A001.csv` and `V001.csv` files in the package are archival copies, not route-ready replacements

The extracted package in the repository root is currently inert. No route reads it.

## Correct placement

| Material | Correct location |
|---|---|
| Original timestamped audio CSVs | `data/sources/playlists/audio-transcripts/` |
| Original timestamped video CSVs | `data/sources/playlists/video-transcripts/` |
| Canonical written transcriptions | `data/sources/books/<slug>/` |
| 1981 Quran source bundle | `data/sources/quran/1981/` |
| 1989 Quran source bundle | `data/sources/quran/1989/` |
| 1992 final Quran CSVs | `data/sources/quran/1992/` |
| Human-readable corpus guides | `docs/corpus/` |
| Draft section enrichment | `data/rag_enrichment/<source-class>/<slug>.json` |
| Retrieval evaluation cases | `data/rag_eval/<source-class>/<slug>.json` |
| Cross-corpus manifests and comparison data | `data/corpus/` |

## Version 2 corrections

The first audit exposed three conditions that version 2 now handles:

- 31 canonical transcript CSVs exist outside the package inventory and must be listed before cleanup.
- 15 enrichment records used stale or `unknown` YouTube IDs. Version 2 resolves them through the numbered canonical transcript and records the catalog document ID.
- The first verifier counted its own package-name constant as a live-code reference. Version 2 excludes the migration script itself.

Version 2 also refuses to stage unmatched enrichment unless `--allow-unmatched-enrichment` is deliberately supplied.

## What the script does

### `audit`

- reads Git status without requiring a clean tree
- fingerprints every existing and packaged transcript
- distinguishes exact duplicates from genuine content conflicts
- detects enrichment duplicates by `document_id`
- maps enrichment documents to `MASTER_INDEX.json`
- records hashes of the locally modified RAG files
- writes `reports/corpus-migration/latest-audit.md` and `.json`

It changes nothing.

### `stage`

- adds ignore rules for the extracted package and rollback directory
- copies corpus guides to `docs/corpus`
- copies compact cross-corpus metadata to `data/corpus`
- deduplicates enrichment and evaluation JSON by `document_id`
- places them under `data/rag_enrichment` and `data/rag_eval`
- copies a historical Quran JSON only when its canonical destination is absent
- does not overwrite transcript conflicts
- creates rollback copies of any existing metadata file it changes

### `verify`

Runs:

```powershell
npm run generate:catalog
npm run validate:catalog
npm test
npm run typecheck
```

It also verifies that live code does not point into the extracted package.

### `cleanup`

After verification, moves the extracted package outside the repository rather than deleting it.

## What this tool intentionally does not do

It does not replace core RAG code yet.

Your screenshot shows local modifications under `.env.example`, `scripts`, and `src`. The committed GitHub branch cannot reveal those uncommitted contents. The audit report captures their hashes and status so the actual RAG upgrade can be built against your local state without overwriting work.

## Commands

Copy `scripts/corpus/integrate-complete-corpus.mjs` into the same path in your repository.

From the repository root:

```powershell
node scripts/corpus/integrate-complete-corpus.mjs audit
```

Review:

```text
reports/corpus-migration/latest-audit.md
reports/corpus-migration/latest-audit.json
```

Then:

```powershell
node scripts/corpus/integrate-complete-corpus.mjs stage
node scripts/corpus/integrate-complete-corpus.mjs verify
node scripts/corpus/integrate-complete-corpus.mjs cleanup
```

The cleanup command moves the package to:

```text
../_askarchives_corpus_packages/
```

Use `--skip-project-checks` only when deliberately postponing the npm checks.

Use `--copy-missing-transcripts` only if the audit identifies genuinely absent recordings. Existing files are never overwritten.
