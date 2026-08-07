# Branch Consolidation and Feature Removal

## Branch structure: now just main and preview

Before: `main`, `chore/sa-reorg-audit`, `feat/oss-ui-improvements`,
`merge/reorg-and-ui-improvements`, `chore/remove-dead-code`,
`fix/library-reader-mobile-controls`, `preview` (stale, an ancestor of
`main`), plus two linked worktrees (`worktree-complete-shelf`,
`worktree-preview`) each carrying 22 unmerged commits of unrelated feature
work (a 3D bookshelf UI and a "Root Explorer" word-root graph visualizer).

Actions taken:

1. Confirmed `preview` and `fix/library-reader-mobile-controls` had zero
   unique commits beyond what `main` already contained — safe to fold in
   without losing anything.
2. Confirmed `worktree-complete-shelf` and `worktree-preview` were
   substantial (22 commits each) but per your explicit direction, deleted
   both worktrees and branches without merging anything from them,
   including the uncommitted root-explorer e2e test files sitting in
   `worktree-preview`'s working directory.
3. Moved `preview` to point at the fully verified state from this session's
   work (reorg + UI improvements + dead code removal).
4. Deleted every other branch (`chore/sa-reorg-audit`,
   `feat/oss-ui-improvements`, `merge/reorg-and-ui-improvements`,
   `chore/remove-dead-code`, `fix/library-reader-mobile-controls`) — all
   fully contained in `preview`'s history, nothing lost.

Result: exactly two branches, `main` (untouched at `f9794d5`, still the
finalized version) and `preview` (now 89 commits ahead, everything from
this session plus the RAG/3D-reader removal below).

## RAG (Ask Archive) — removed entirely

Every piece: `src/lib/rag/`, `src/components/rag/`, `src/app/api/ask/`,
`scripts/rag/`, `scripts/corpus/`, `data/rag/`, `data/corpus/`, the
`corpus-migration`/`enrichment-review`/`rag-eval`/`rag-answer-eval`/`rag-traces`
report directories, the RAG-specific docs, `docker-compose.rag.yml`, the
`rag:*` package.json scripts, and the `@mistralai/mistralai`/`pg`/`@types/pg`
dependencies. `dotenv` came out too once it turned out to be exclusively used
by the deleted RAG env-loading script.

`src/app/search/page.tsx` now renders `SearchClient` directly instead of
`SearchModeSwitcher` — the search page goes back to search-only, no `?mode=ask`
toggle. `SearchClient.tsx` itself never referenced the ask feature, so this
was the only touch point.

## 3D reader — removed entirely

`src/app/library/[id]/BookReaderWrapper.tsx`, plus `src/lib/search/PDFReaderClient.tsx`
and `pdfTextHighlight.ts` — the shared highlight-matching utility built
exclusively for this effort (its own header comment named both the 2D and
3D readers as consumers). None of these were ever wired into any route —
the library's actual live reader (`LibraryReaderWrapper` →
`PDFReaderWrapper`, both pre-existing, both untouched) is a completely
separate implementation and was unaffected.

Removing `BookReaderWrapper.tsx` also resolved the `Cannot find module
'@/components/written/BookReaderClient'` build failure that blocked merging
to `main` a few turns ago — that blocker no longer exists.

## Dead code

Continued from the prior pass: re-ran `knip` after the RAG/3D-reader
removal to catch anything newly orphaned. Nothing new turned up beyond
`dotenv` (removed, see above). The two previously-flagged ambiguous files
(`src/lib/search/phonetic.ts`, `src/components/home/DeferredSearchFunctionDemo.tsx`)
are unrelated to RAG or the 3D reader and are still sitting there
unresolved — same reasoning as before, no clear signal of abandonment vs.
not-yet-wired-in, so still not touched without your call.

## Verification

- `tsc --noEmit`: **zero errors** — the first fully clean type-check this
  entire session (previous runs always had at least the `BookReaderWrapper`
  error).
- `npm run build`: compiles and prerenders all 514 static paths successfully,
  `/api/ask` is gone, `/search` builds as a static route.
- `npm run test:unit`: 44/44 pass.
- Repo-wide grep for every removed module/script/doc path: zero remaining
  references anywhere, including `README.md`/`PRODUCT.md`/`DESIGN.md`.

## Commit

`refactor: remove RAG (Ask Archive) and 3D-reader features entirely` — one
commit, 346 files changed, on `preview`. Nothing pushed.
