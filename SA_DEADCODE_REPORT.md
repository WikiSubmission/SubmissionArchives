# Dead Code Analysis and Removal

## Method

Ran `knip` scoped to actual application code (`src/`, `scripts/`), with a
`knip.json` excluding the vendored `mint-threejs-skills` templates, raw data
directories, and other non-application content that would otherwise produce
false positives (standalone CLI scripts flagged as "unused" simply because
nothing imports them, which is normal for entry-point scripts).

Every flagged item was individually verified before action — checked for
usage knip's static analysis might miss (dynamic imports, re-exports),
checked git history for context, and checked sibling files' own comments for
declared intent. Several items that looked identical to a linter turned out
to be very different in reality: some were genuinely superseded code, others
were unfinished-but-intentional scaffolding for planned features that just
haven't been wired in yet. Treating those the same would have deleted real,
in-progress work.

## Removed (confirmed superseded or orphaned)

| What | Why it's actually dead |
|---|---|
| `src/lib/otCatalog.ts` | `old-testament/page.tsx` reads `BIBLE_OT_BOOKS.json` directly via its own inline `fs` call; nothing imports this file's types or functions anymore. |
| `src/components/home/QuranEditionsVisual.tsx` + its alias export in `ScripturesVisual.tsx` | A re-export left over from an earlier component name. Nothing imports `QuranEditionsVisual` from either location. |
| `src/components/rag/SearchModeToggle.tsx` | Superseded by `SearchModeSwitcher.tsx`, which `src/app/search/page.tsx` actually renders. Confirmed by tracing the real search/ask mode-switching flow. |
| `searchAppendixCsv` + `AppendixSearchResult` (in `appendixCatalog.ts`), plus the `findQueryMatch` import it left behind | A parallel per-source-type search implementation with zero call sites anywhere — the live search flow queries the unified `MASTER_INDEX.json` instead. |
| `embedQuery` (in `src/lib/rag/mistral.ts`) | A single-text convenience wrapper around `embedQueries` that nothing ever called. |
| `ts-node` devDependency | Every script in `package.json` runs through `tsx`; `ts-node` had zero references anywhere. |

## Found unused, but NOT removed — flagged instead

These looked identical to dead code by every automated signal, but turned
out to be something else on inspection:

- **`src/app/library/[id]/BookReaderWrapper.tsx`**, **`src/lib/search/PDFReaderClient.tsx`**, **`src/lib/search/pdfTextHighlight.ts`** — this is the planned "3D reader" feature discussed earlier in this session. `pdfTextHighlight.ts`'s own header comment states it's "shared between PDFReaderClient (flat 2D reader) and BookReaderClient's hidden accessibility text layer (3D reader)" — direct evidence this is unfinished, intentional work, not abandoned code. You already know about this one; it's the same blocker from the earlier merge conversation.
- **`src/lib/search/phonetic.ts`** — a complete, working Metaphone-style phonetic matching function, fully self-contained, but not called from `queryMatch.ts` or anywhere else. Unlike the items above, there's no comment or sibling file declaring future intent — but there's also no evidence it was replaced by something else. Could genuinely be an unfinished fuzzy-search improvement, or could be a dead experiment. Left alone rather than guess.
- **`src/components/home/DeferredSearchFunctionDemo.tsx`** — a complete, well-built `IntersectionObserver`-based lazy-loading wrapper around `SearchFunctionDemo`. `ArchiveBranch.tsx` currently imports `SearchFunctionDemo` directly, not this deferred version. Could be an intended performance optimization that never got the one-line swap to activate it, or an abandoned experiment. Left alone for the same reason.

If you want any of these three finished, removed, or wired in, that's a
distinct decision from "is this dead" — happy to do any of those once you
say which.

## Also considered, not acted on

- **`tailwindcss` devDependency** flagged as unused by knip — false positive.
  It's consumed via `@tailwindcss/postcss` in `postcss.config.mjs` and CSS
  `@import`, not a JS import, so knip's import-graph analysis can't see it.
  Removing it would break the entire site's styling.
- **A handful of exported functions/types** (`AskRequestError`, `parseCsv`,
  `mintApiRequest`, `normalizeSearchText`, `recoverMojibake`,
  `getThumbnailSrc`, `ARCHIVE_RECORD_TYPES`, and 11 exported types) are
  flagged as "unused exports" but are actually used internally within their
  own files — they're just exported more broadly than necessary. Not dead
  code, just wider-than-needed visibility. Left as-is rather than churn
  unrelated files for a purely cosmetic narrowing.
- **58 files** in knip's first, unscoped pass turned out to be either the
  vendored `mint-threejs-skills` template projects (not part of this app),
  raw Bible source data files, or standalone CLI scripts that are real,
  working tools invoked manually or via `package.json` — confirmed against
  the reference-graph work from the earlier reorg session. None of these
  were touched.

## Verification

- `knip` re-run after removal: all six items gone from the report, nothing
  new introduced.
- `tsc --noEmit`: zero new errors (the two pre-existing `BookReaderWrapper`
  errors remain, unrelated to this work and already known).
- `npm run build`: compiles cleanly; fails only at the same known, pre-existing
  type-check step.
- `npm run test:unit`: 44/44 pass.

## Commits

1. `refactor: remove confirmed-dead code`
2. `chore: remove unused ts-node dependency, add knip config`
3. `docs: add dead code analysis report` (this file)

All on branch `chore/remove-dead-code`, branched from
`merge/reorg-and-ui-improvements`. Nothing pushed or merged.
