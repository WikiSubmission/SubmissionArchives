# SubmissionArchives Studio - AI Context & Development Plan

**To the AI reading this document:** This file contains the complete architectural context, tech stack, and development roadmap for "SubmissionArchives Studio." You are tasked with helping the user continue the development of this application through the remaining phases.

## 1. Project Overview
**SubmissionArchives Studio** is a premium, privacy-first, 100% offline desktop application for personal note-taking, journaling, and Islamic scholarly writing. It is designed as an alternative to Obsidian and Cabinet, specifically tailored to the SubmissionArchives ecosystem.
- **Core philosophy:** Everything is local. No cloud dependencies, no subscriptions, no telemetry. Data is stored as standard Markdown (`.md`) files in a user-selected folder (the "Archive").
- **Flagship feature:** The ability to type `/quran 1:1-7` and instantly insert an interactive, bilingual (Arabic & English) verse block directly into the editor, queried from a local database in milliseconds.

## 2. Technical Stack
- **Framework:** Tauri v2 (Rust backend, system webview frontend).
- **Frontend:** React 19 + TypeScript, bundled with Vite.
- **Styling:** Tailwind CSS v4 (configured via `@tailwindcss/vite` plugin).
- **Editor Core:** Tiptap (built on ProseMirror) for headless block-based editing.
- **Data Querying:** Tauri IPC (Inter-Process Communication). The Rust backend parses the massive local database to prevent locking the React UI thread.

## 3. Design Aesthetics & Inspirations
The UI must feel highly premium, fluid, and modern. We are drawing heavy inspiration from the following open-source resources. **You should reference these when building out UI components:**
- **Animations & Interactions:** [emilkowalski/skills](https://github.com/emilkowalski/skills) and [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)
- **Iconography & Polish:** [phosphor-icons/homepage](https://github.com/phosphor-icons/homepage)
- **Advanced Componentry:** [harshjdhv/componentry](https://github.com/harshjdhv/componentry) and [WatermelonCorp/watermelon-platform](https://github.com/WatermelonCorp/watermelon-platform)
- **Syntax Highlighting & Markdown Aesthetics:** [delibae/claude-prism](https://github.com/delibae/claude-prism)

### Editor & Architecture Inspiration
- **Qirtaas SDK:** ([alrimaal/qirtaas-js](https://github.com/alrimaal/qirtaas-js)) - We are heavily studying their open-source repository to reverse-engineer how they handle bidirectional text (RTL/LTR mixing), first-class Arabic typography, and verse insertion in ProseMirror/Tiptap. We cannot use their SDK directly because it relies on a cloud API (`api.qirtaas.io`), and we must remain 100% offline.
- **Cabinet:** ([cabinetai](https://github.com/cabinetai)) - Inspiration for the drag-and-drop block-based editor style and slash-command popups.
- **Obsidian:** Inspiration for local file system sync, strict markdown parsing, and bidirectional linking (`[[Page Link]]`).

## 4. Key Architectural Features

### A. Dynamic Editor Styles (Multi-Modal)
Because users have different preferences, the Tiptap editor dynamically toggles between three visual modes via local component state in `Editor.tsx`:
1. **Write:** Markdown-focused, block-based view optimized for keyboard-centric users.
2. **Blocks:** A drag-and-drop interface where each top-level block is manipulable via `@tiptap/extension-drag-handle-react`.
3. **Page:** A traditional, continuous WYSIWYG editor focused on uninterrupted prose, styled like a paginated document.

### B. The Quran Embed (Tiptap Node View)
- Triggered via a slash command (e.g., `/quran 1:1, 2:3`).
- Spawns a floating React menu querying the Rust backend.
- Renders as a custom React NodeView inside the editor showing Arabic/English.
- Serializes to plain markdown using custom remark directives (e.g., `::: quran {verses="1:1"} :::`) so the file remains portable.

### C. Data Source
The static database (`ws_quran_text_rows.csv` from the 1992 translation) is bundled directly into the Tauri app's assets.

### D. Quran Embed Styling — "Ink on Parchment"
The embed deliberately does **not** use the app's own `--ed-*` monochrome tokens. It has its own palette, `--color-qv-*` (App.css), copied from wikisubmission.org's `VersePrintPalette` (`LIGHT_PRINT_PALETTE`) — parchment background (`#FBF8F1`), near-black ink text (`#1A1715`), brown accent (`#6B3410`). Arabic renders in Amiri (`--font-arabic`), English in Source Serif 4 (`--font-serif`); both are self-hosted `.woff2` files under `src/assets/fonts/` (arabic-only / latin-only subsets, fetched once from Google Fonts at build time and bundled — no CDN calls at runtime, so this stays 100% offline). The result reads as a small manuscript card floating inside the otherwise dark editor, the same way "Page" mode already floats a white page inside the dark chrome.

## 5. Development Phases Roadmap

### Phase 1: Scaffolding (COMPLETED)
- ✅ Initialized `studio/` directory with Tauri + React + Vite.
- ✅ Configured Tailwind CSS v4.
- ✅ Mounted the headless Tiptap editor.
- ✅ Built the mode-toggle toolbar (now Write/Blocks/Page — originally named after Obsidian/Cabinet/Docs, the apps that inspired each mode).
- ✅ Scaffolded the `QuranEmbed` React NodeView placeholder in Tiptap.

### Phase 2: Rust Backend & Slash Commands (COMPLETED)
- ✅ `src-tauri/src/quran.rs` reads and indexes the bundled CSV (`chapter:verse` and range/multi-ref parsing), with unit tests.
- ✅ `search_verses` Tauri IPC command, called from React via `invoke`.
- ✅ `/quran` slash command (`extensions/slash-command/`) opens a tippy.js popup on typing `/quran`.
- ✅ Popup wires straight into the Rust backend; `QuranEmbed` renders the bilingual Arabic/English result and round-trips through the `::: quran {verses="..."} :::` markdown directive.

### Phase 3: File System & Vault Management (COMPLETED)
- ✅ `WelcomeScreen` lets the user pick an Archive folder via the native dialog plugin; the path persists in `localStorage` (`useArchive`).
- ✅ `src-tauri/src/archive.rs` implements `list_directory` / `read_note` / `write_note` / `create_note`, with unit tests.
- ✅ `ArchiveExplorer` + `TreeNode` render a lazy-loading recursive sidebar; `Editor.tsx` autosaves 500ms after edits with a saving/saved/error indicator.

### Phase 4: Polish & Advanced PKM Features (COMPLETED)
- ✅ Bidirectional linking: `[[Page Name]]` input rule + NodeView ([`WikiLink.tsx`](src/components/extensions/WikiLink.tsx)), with `resolve_wiki_link` in Rust doing a recursive lookup and auto-creating the note if missing.
- ✅ YAML frontmatter: `lib/frontmatter.ts` (parse/stringify) plus an editable `FrontmatterPanel` UI with typed fields (text/number/checkbox/date/list — type is inferred from the value's shape, matching how Obsidian's Properties view works, rather than storing an extra type tag).
- ✅ Blocks mode drag-and-drop: `@tiptap/extension-drag-handle-react` is mounted only while `mode === 'blocks'`, giving each top-level block a real drag handle for reordering.
- [ ] Advanced UI polish and animations using the design inspirations above — icons are currently `lucide-react`, not yet swapped to Phosphor; motion is limited to a few basic Tailwind fade/enter transitions.
- [ ] Write and Page modes are still visual-only (no distinct editing behavior yet, unlike Blocks).

### Phase 5: Navigation, Search & Extensibility (COMPLETED)
Closes the gap identified against Obsidian's and Cabinet's own docs. Everything below is scoped to what's achievable while staying 100% offline — see the AI-agent note at the end of this phase for the one deliberate exception.

- ✅ **One scan, five features:** `src-tauri/src/notes.rs` exposes a single `scan_archive` command that recursively walks the archive once, extracting `#tags` and `[[links]]` per note (`NoteRecord { path, name, content, tags, links }`). Backlinks, the tags pane, search, the quick switcher, and the graph view all consume this same record shape (`src/lib/notes.ts`) instead of each doing their own file-system query.
- ✅ **Backlinks:** [`BacklinksPanel.tsx`](src/components/BacklinksPanel.tsx) renders "Linked mentions" below the note body — every other note whose `links` array points at the open note.
- ✅ **Tags:** [`TagsPane.tsx`](src/components/archive/TagsPane.tsx), a sidebar tab that groups notes by tag with counts, expandable to the matching notes.
- ✅ **Full-text search:** [`SearchPane.tsx`](src/components/archive/SearchPane.tsx), a sidebar tab doing substring search across note content with a snippet preview.
- ✅ **Quick switcher** (`Ctrl/Cmd+O`) and **command palette** (`Ctrl/Cmd+P`): both are thin wrappers around one shared [`CommandModal.tsx`](src/components/CommandModal.tsx) (search input + keyboard nav + filtered list), since the two behave identically and only differ in what they list.
- ✅ **Graph view:** [`GraphView.tsx`](src/components/GraphView.tsx) renders notes as nodes and `[[links]]` as edges, laid out by a small hand-rolled force simulation ([`lib/graph.ts`](src/lib/graph.ts) — no new dependency; falls back to a plain circle layout above ~300 notes to stay responsive).
- ✅ **Callouts:** [`Callout.tsx`](src/components/extensions/Callout.tsx) adds Obsidian-style `> [!note] Title` blocks (note/tip/warning/important), available via `/note`, `/tip`, `/warning`, `/important`. The markdown parser reuses markdown-it's own blockquote line-continuation logic and just reclassifies the token pair afterward, rather than reimplementing `>`-line parsing.
- ✅ **CSS theme snippets (scoped extensibility):** `read_theme_css` (Rust) loads an optional `<archive>/.studio/theme.css`; `useTheme` (React) injects it, letting users override the `--ed-*` tokens. **This is a deliberate scope-down from a full plugin/theme API** — building a real plugin system means designing a stable public API surface, a manifest format, and a sandboxed loading mechanism for arbitrary code, none of which exists yet. CSS-only customization ships now; a JS plugin API is a distinct future decision, not an accidental omission.
- ✅ **Multi-format file viewers:** `list_directory` no longer filters to `.md` — the archive is a general file browser now (dotfiles/dotfolders like `.studio/` stay hidden). [`FileViewer.tsx`](src/components/FileViewer.tsx) renders images/PDF/video/audio via the Tauri asset protocol (`assetProtocol.scope: ["**"]` in `tauri.conf.json`, matching the existing trust model — the Rust `fs` commands already touch any user-chosen path unrestricted), CSV as a table (hand-rolled quote-aware parser, no new dependency), and falls back to a plain-text dump or a "preview not available" message for anything else. DOCX/XLSX/PPTX rendering was deliberately left out — those need heavy libraries (`mammoth`, `xlsx`, ...) that aren't worth pulling in for this pass.

**Explicitly not built: an AI-agent layer** (the other half of Cabinet's differentiator — personas, skills, scheduled tasks calling out to Claude/GPT/Gemini/etc.). That requires network calls to a cloud provider, which directly contradicts this project's "100% offline, no cloud dependencies" charter (Section 1). Decision made 2026-08-07: skip it rather than build it silently or quietly rewrite the charter. If this is ever revisited, it should be an explicit, opt-in, off-by-default feature — not a default assumption.

### Phase 6: Maktabook-Inspired Features
Notes from a direct walkthrough of Maktabook's desktop app (2026-08-07) — a competing Islamic note-taking app, closer to Studio's actual niche than Obsidian or Cabinet. Functional layer built 2026-08-07; UI/UX polish is the next pass.

**Functional layer (COMPLETED):**
- ✅ **Trash / soft delete:** `archive.rs` — `trash_note` moves a file to `<archive>/.studio/trash/<id>/` with a `meta.json` sidecar recording its original path; `list_trash`, `restore_note` (restores to the original spot, or alongside it as "Name (restored N)" if that spot is occupied again), `permanently_delete_trash_entry`. [`TrashPane.tsx`](src/components/archive/TrashPane.tsx) is a fourth sidebar tab; `TreeNode` grew a per-file trash button.
- ✅ **Duplicate / Move:** `duplicate_note` ("Name (copy).md", "Name (copy 2).md", ...) and `move_note` (rejects on name collision at the destination) in `archive.rs`. Wired as command-palette entries — "Move to..." is a `window.prompt` for the destination folder for now, not a folder picker; that's a UI-pass upgrade, not a missing capability.
- ✅ **Version history:** new [`history.rs`](src-tauri/src/history.rs) module. `snapshot_note` is called right after every successful `write_note` and is deliberately debounced (skips if content is unchanged since the last snapshot, or if under 60s has passed) so autosave's 500ms cadence doesn't spam a snapshot per keystroke pause; capped at 20 snapshots per note. `list_note_history` / `restore_note_version` back a [`VersionHistoryModal.tsx`](src/components/VersionHistoryModal.tsx) (reuses `CommandModal`) opened from a toolbar button in `Editor.tsx`.
- ✅ **Import flows:** new [`import.rs`](src-tauri/src/import.rs) module. `import_files` copies arbitrary files into the archive root (`.txt` → `.md`, everything else keeps its extension); `import_zip` (new `zip` crate dependency, pinned to the `deflate`-only feature set to avoid pulling in bzip2/lzma/zstd/aes support this doesn't need) extracts a ZIP preserving its internal folder structure. Both wired as command-palette entries using the native file-picker dialog — no dedicated Import screen yet (UI-pass item).
- ✅ **PDF attach (data plumbing only):** `attach_pdf_to_note` copies a PDF into `<archive>/.studio/attachments/` and returns its path. This is the data half of "PDF Split View" — the actual side-by-side split-pane *rendering* in `Editor.tsx` is not built; a note can reference an attached PDF, but there's no UI yet that shows it alongside the note.
- ✅ **Lock page / Full width:** two toggle buttons in `Editor.tsx`'s toolbar, backed by frontmatter (`locked`, `fullWidth`) so they persist with the note. Locked calls `editor.setEditable(false)` (blocks editing the body; frontmatter panel and toolbar stay usable — deliberately simple). Full width overrides the mode's default max-width, except in Page mode, where a fixed page width is the entire point of that mode.
- ✅ **`/arabic` slash command:** [`ArabicBlock.tsx`](src/components/extensions/ArabicBlock.tsx) — a from-scratch `::: arabic ... :::` fenced container (its own markdown-it block rule, not piggybacking on blockquote like Callout does, since the fence markers are unambiguous and don't have Callout's paragraph-merging edge case).
- ✅ **Exact-phrase search:** `SearchPane.tsx` now parses `"quoted phrases"` as required verbatim substrings and treats remaining unquoted words as an AND-of-words match (any order) — previously the whole query had to appear as one contiguous substring, so quotes didn't change anything.
- ✅ **Custom folder icons:** `read_folder_icons` / `set_folder_icon` in `archive.rs`, keyed by the folder's absolute path (not a relative path — avoids reconciling path-separator differences between Rust and the frontend, at the cost of icons not surviving an archive move to a different disk location). `TreeNode` renders the emoji in place of the folder icon when set; setting it is a `window.prompt` today, not an emoji picker (UI-pass item).

**UI/UX layer (COMPLETED 2026-08-07):**
- ✅ **Settings modal:** [`SettingsModal.tsx`](src/components/SettingsModal.tsx), a trimmed section list — General (archive path + "Change" button, `.studio/theme.css` hint), Quran (show mode, insert style default, arabic/translation size), Shortcuts (static keyboard/slash-command reference), Import (the same file/ZIP import commands, surfaced here too). Deliberately **doesn't** mirror Maktabook's full section list — no Account, Hadith, Tafsir, or Data & Sources sections, since Studio has no accounts, no hadith/tafsir features yet, and no cloud sync; building settings pages with nothing real behind them would just be fake UI.
- ✅ **Settings persistence:** [`hooks/useSettings.tsx`](src/hooks/useSettings.tsx) — `SettingsProvider`/`useSettings` (React Context, not prop-drilled) backed by `read_settings`/`write_settings` (Rust) at `<archive>/.studio/settings.json`, same convention as theme.css/trash/history. Settings travel with the vault, not tied to one machine's `localStorage`.
- ✅ **Quran settings actually affect rendering:** `QuranEmbed.tsx` and the new inline variant both read `useSettings()` directly — Tiptap's `ReactNodeViewRenderer` mounts node views as React portals that still sit inside the app's own component tree, so Context propagates through normally; no prop-threading through Tiptap's (static, creation-time) extension config was needed. The per-embed "Toggle English" button and the global show-mode setting compose as a ceiling: the global setting can force arabic-only or translation-only for everything, and the per-embed toggle is a further override underneath that ceiling.
- ✅ **Quran insert style (inline vs. block):** [`QuranEmbedInline.tsx`](src/components/extensions/QuranEmbedInline.tsx) is a separate node type from `QuranEmbed`, not a variant of it — ProseMirror's block/inline `group` is fixed per node type, not switchable per instance. It's a compact chip with its own `::: quran-inline {verses="..."} :::` inline markdown token (verified against 5 cases — mid-sentence, start-of-line, two-in-one-line, and confirmed no collision with the block directive — before wiring in). `/quran` defaults to `settings.quran.insertStyle` (set via a plain module-level variable in `items.ts`, not threaded through Tiptap reactively, since it only needs to be current at the moment a command runs); typing `/quran inline 2:255` or `/quran block 2:255` overrides the default for that one insert.
- ✅ **Page-level font choice:** per-note `fontFamily` (`default`/`serif`/`mono`) in frontmatter, applied via a wrapper class around the editor content (CSS `font-family` inheritance, no Tiptap reconfiguration needed). Picker lives in the note menu (below).
- ✅ **Unified note menu:** [`NoteMenu.tsx`](src/components/NoteMenu.tsx) replaces the old scattered lock/full-width/history toolbar buttons with one dropdown: font-family swatches, Copy path, Duplicate, Move to..., Export as Markdown, Attach PDF.../PDF split view toggle, Full width, Lock page, Version history. Toggles (full width/lock/PDF-split) leave the menu open so several can be flipped in one go; actions close it.
- ✅ **PDF split-view rendering:** attaching a PDF (via the note menu) stores its path in frontmatter (`pdfAttachment`) and turns on `pdfSplitView`; `Editor.tsx` then renders a two-pane layout — the PDF in an `<iframe>` via `convertFileSrc` on the left, the normal editor on the right.
- ✅ **Home dashboard:** [`HomeDashboard.tsx`](src/components/HomeDashboard.tsx) replaces the old static "welcome" content that used to live inside `Editor.tsx` — `App.tsx` now renders it whenever no note is open, instead of mounting `Editor` at all. Backed by [`hooks/useRecentNotes.ts`](src/hooks/useRecentNotes.ts), a `localStorage`-keyed-by-archive recency list (max 8), recorded through one `handleOpenFile` wrapper in `App.tsx` that every "open a note" path now goes through instead of calling `setActiveFilePath` directly.
- ✅ **System frontmatter keys hidden from the properties UI:** `locked`, `fullWidth`, `fontFamily`, `pdfAttachment`, `pdfSplitView` all have dedicated UI elsewhere now (the note menu), so `FrontmatterPanel` excludes them from the regular editable-property list — otherwise they'd double-appear as raw checkbox/text rows, which is exactly the kind of implementation detail leaking into the UI that's worth cleaning up during a polish pass.

**Still deferred — genuinely need their own scoping, not just UI work:**
- [ ] **Whiteboard pages** — closer to Obsidian's Canvas than anything here (a new page type, a canvas rendering library, a new file format). Deserves its own pass.
- [ ] **`/hadith` slash command** — blocked on a real decision, not effort: Studio has no hadith dataset bundled at all (unlike Quran, where `quran.csv` already exists). Needs a data-sourcing/licensing decision before any backend or NodeView work makes sense.
- [ ] **Drag-to-reorder in the file tree** — `list_directory` always sorts alphabetically; manual ordering needs a new persisted-order concept, and the interaction itself is inherently a drag gesture — building the persistence without the gesture alongside it has little value.
- [ ] **Translation edition choice** — Studio only bundles the 1992 translation. The Settings UI has room for this, but offering a real choice means bundling more editions first — a data question, not a UI one.
- [ ] **"Move to..." folder picker** — still a `window.prompt` for the destination path, not a folder-tree picker.
- [ ] **Folder icon picker** — still a `window.prompt` for an emoji, not a picker UI.
- [ ] **Copy link** — implemented as "copy the note's absolute file path" (`handleCopyPath`), since a desktop app with no server has no real "public link" concept. Worth confirming this reading is what's wanted.

**Alternate Quran embed visual reference** — Maktabook's own embed uses a warm brown/olive card natively inside its dark theme, distinct from the light parchment card Studio built to match wikisubmission.org (Section 4D). Worth knowing as a second reference point, not a replacement — the wikisubmission.org look was an explicit, specific instruction.

**Explicitly excluded — do not build:** "Islamic shortcuts" (typing `PBUH`, `SWT`, `RA`, `INSH`, `ALHAM`, etc. and a space auto-expands to the Arabic honorific phrase). The user crossed this section out in red when sharing the reference screenshots. Do not propose or implement this without the user raising it first.

**Design taste notes** (from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), referenced in Section 3 as a design inspiration): most of that skill's checklist is landing-page-specific (hero copy, CTAs, logo walls) and doesn't transfer to an app UI. The parts that do:
- Lock one accent color per surface, mechanically — Studio already does this (`--ed-accent` for the app, `--qv-accent` for the Quran embed's own sub-brand) — don't let a third accent creep in without the same deliberateness.
- WCAG AA contrast minimum (4.5:1 body, 3:1 large text) on every interactive element — worth an explicit audit pass once Settings/Trash/etc. above add more UI surface.
- Full interactive-state coverage: every async action needs a loading state, an empty state, and an error state — not just the happy path. Several panels added in Phase 5 already do this (`SearchPane`, `TagsPane`, `BacklinksPanel`); keep it up for whatever's built next.
- Tactile feedback on click (`active:scale-[0.98]` or similar) — already used inconsistently (`WelcomeScreen`'s button has it, most others don't). Worth a consistency pass, not urgent.
- One corner-radius system — Studio currently mixes `rounded-md`/`rounded-lg`/`rounded-xl`/`rounded-full` without a stated rule. Worth deciding on a scale (e.g. sm/md/lg mapped to specific px values) rather than picking per-component.
- Motion must be motivated — every animation should justify itself in one sentence. Don't add motion "for polish" without being able to state why.
