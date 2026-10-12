# Updates implementation progress

- Branch: `updates`; initial worktree clean. No push or deployment performed.
- Read AGENTS.md, PRODUCT.md, DESIGN.md, installed Next guides and frontend-design skill.

## A — implemented
- Shared bibliography-based citations on both reader routes; unknown dates remain n.d.; scan locators explicitly say PDF page.
- Unicode matching/indexing/highlighting share normalization and preserve original offsets. Literal mode remains mark/case-sensitive.
- Studio strict UTC modified-date filters, debounce/stale invalidation and retained Fuse snapshots.
- Trusted ingress IP headers opt-in; composed timestamp links preserve queries/fragments; attribution cautions preserved.
- Routine CI is read-only; explicit visual proposal workflow uploads images for human review.

## B — implemented
- Preserved archive hero/photo/format pathways, refined spacing/glows/radii, semantic tokens/focus/touch styles.
- Removed three unnecessary global font initializations. Added research navigation and Source Details across readers/results.
- Actual browser checks cover mobile overflow, keyboard navigation, reader controls and axe serious/critical violations.

## C — implemented and measured
- Search responsibilities extracted into citation/highlight/navigation helpers; conservative dynamic player/PDF loading retained.
- Bounded OCR source tracing removed whole-repository build tracing warning; PDF request verified 206 and 1024-byte range body.
- 356-record benchmark: cold 1051 ms / heap 141.2 MB; miracle 47.4 ms, God 333.1 ms, phrase 10.3 ms; cached .37–.68 ms.
- Earlier measurement after Unicode implementation, before ASCII optimization: cold 5335 ms / heap 158.6 MB, miracle 427 ms, God 2765 ms, phrase 88.5 ms. This is not a pristine pre-change baseline.
- Studio synthetic 500-note benchmark: cold Fuse index/query 47.28 ms, retained index query 32.38 ms.
- Rust path/mtime/length cache detects edit/create/rename/delete and external changes. Search typing does not scan; metadata refresh every 5 seconds and on actions/saves. Small Rust fixture warm metadata walk: 371 microseconds.

## D — implemented
- Local named collections: capped/versioned validation, save/reopen, canonical dedupe, rename/reorder/remove, JSON import/backup, Markdown/BibTeX export.
- Saves wired to Quran, media cues, PDF citation panel and editorials; supplied bibliographic metadata exported; unknown fields omitted.
- Corrupt storage preserved for backup; errors surfaced. Optional typed provenance passes through catalog generation without generated changes.
- Timeline/topics uses actual catalog dates with explicit upload/unspecified labels, curated subject crosswalk, pagination and undated control.

## E — implemented
- Responsive graph zoom/pan/fit/reset/select/open, keyboard controls, directional local neighborhoods and 500-node cap.
- Native dialogs/toasts replace prompts/alerts; directory picker and trash confirmation retained; real status-bar backlinks refresh.
- Saves capture path/content, flush debounce on switch/unmount/close, serialize per-path writes, guard stale reads and disable editing during loading.
- Split panes share current drafts; older saves cannot mark newer edits saved. Existing atomic writes/snapshots and panel persistence retained.

## F — verification
- Unit/integration: 94/94 pass, including Unicode, citations, URL navigation, collections, provenance, split-pane drafts and graph utilities.
- Rust: 114/114 pass; targeted cache invalidation rerun passes.
- Catalog reproducibility (5 artifacts) and source-schema validation pass. No generated catalog artifacts changed.
- Studio production build passes; existing large-chunk warning remains.
- Website production build passes (633 static pages); build TypeScript checks pass. Full lint: 0 errors / 5 pre-existing warnings; changed-file lint passes.
- First request/API run: 9 pass, including physical PDF ranges. Chromium installed; first executable browser run: 23 pass / 12 fail.
- Failed-step reruns resolved all functional failures: 44/44 nonvisual tests passed across the initial API run and browser reruns (not a single uninterrupted clean run). Final 2/2: four-source save/reopen/rename/reorder/persistence/Markdown+BibTeX export and media axe pass. Missing media skip-link target fixed; citation focus-return and APA punctuation verified. Targeted 15/15 unit rerun passes.

## Explicit remaining review / limitations
- Reviewed visual images: retained Linux baselines untouched; 14 desktop/mobile route assertions added. Local visual suite skipped by default; Linux CI with VISUAL=1 intentionally fails missing/changed baselines until human review. Run the manual “Propose visual baselines for review” workflow, inspect its artifact and commit accepted images separately. Never auto-bless during verification.
- Native Tauri manual validation: launch `npm run tauri dev` from studio; verify simultaneous panes, pending-save close, move/trash/recovery, graph keyboard focus and narrow split panes. Compilation/unit checks do not substitute for native interaction review.
- Full WCAG 2.2 AA contrast/text-zoom/touch audit is not claimed; automated checks cover serious/critical axe violations and selected keyboard/mobile flows.
- Search accepts Hebrew and tested pointed Hebrew fixtures; current indexed corpus has no hits for שלום. Arabic الله yields 42 records.
- Studio cache is in-memory (not persisted to disk); catalog subjects are a small explicit crosswalk. No invented provenance, printed pagination, missing bibliography or comparison corpus.
- Collections remain local to this browser; no cloud accounts, bulk passage capture or cross-collection entry transfer.

Next: no known functional test failures. Human visual baseline review and native Studio interaction checks listed above remain. For regression replay in PowerShell: `$env:PLAYWRIGHT_PORT="3101"; npm run test:e2e` after `npm run build`. Existing user dev server on port 3000 was left running. Proposed visual images require the explicit workflow and review, not automatic acceptance.

## User refinement — transcript controls
- Removed Save controls from every media transcript passage. One Save action alongside Copy Link / Download Transcript preserves collection saving at the current playback position without interrupting the transcript.
- Live browser check: 0 passage Save buttons, 1 page action. Changed-file lint passed.
