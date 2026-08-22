# SubmissionArchives Studio — Comprehensive Improvement Plan

> **Version:** 1.0  
> **Date:** 2026-08-11  
> **Target:** Transform Studio from a working prototype into a premium, category-leading offline Quran research & scholarly writing desktop application.  
> **Baseline:** Preview branch (`WikiSubmission/SubmissionArchives/tree/preview/studio`) — Phases 1–6 complete.

---

## Table of Contents

1. [Phase 7: Design Polish & Visual Language](#phase-7-design-polish--visual-language)
2. [Phase 8: Editor Core Deep Dive](#phase-8-editor-core-deep-dive)
3. [Phase 9: Scholarly Writing Tools](#phase-9-scholarly-writing-tools)
4. [Phase 10: Search & Information Architecture](#phase-10-search--information-architecture)
5. [Phase 11: Workspace & Multi-Pane](#phase-11-workspace--multi-pane)
6. [Phase 12: Desktop Shell & Native Integration](#phase-12-desktop-shell--native-integration)
7. [Phase 13: Data Integrity & Export](#phase-13-data-integrity--export)
8. [Phase 14: Theming & Accessibility](#phase-14-theming--accessibility)
9. [Implementation Order & Sprint Mapping](#implementation-order--sprint-mapping)
10. [Claude Opus Implementation Prompt](#claude-opus-implementation-prompt)

---

## Phase 7: Design Polish & Visual Language

### 7.1 Iconography Overhaul

**Current State:** `lucide-react` throughout.  
**Target:** `phosphor-react` with weight-graduated hierarchy.

#### Implementation Steps:

1. **Install dependency:**
   ```bash
   cd studio
   npm install @phosphor-icons/react
   ```

2. **Create icon mapping file** `src/components/ui/Icons.tsx`:
   ```tsx
   import {
     FileText, Folder, FolderOpen, Tag, Search, Trash,
     Gear, Graph, Plus, X, ChevronRight, ChevronDown,
     Lock, Unlock, Maximize, Minimize, BookOpen,
     // ... map every lucide icon to phosphor equivalent
   } from '@phosphor-icons/react'

   export const IconMap = {
     file: FileText,
     folder: Folder,
     folderOpen: FolderOpen,
     tag: Tag,
     search: Search,
     trash: Trash,
     settings: Gear,
     graph: Graph,
     plus: Plus,
     close: X,
     chevronRight: ChevronRight,
     chevronDown: ChevronDown,
     lock: Lock,
     unlock: Unlock,
     maximize: Maximize,
     minimize: Minimize,
     book: BookOpen,
   } as const
   ```

3. **Weight hierarchy rules:**
   - Sidebar icons: `weight="regular"` (16px)
   - Toolbar icons: `weight="bold"` (18px)
   - Active/selected states: `weight="fill"`
   - Context menu icons: `weight="regular"` (14px)

4. **Replace all `lucide-react` imports** across:
   - `LeftRibbon.tsx`
   - `EditorToolbar.tsx`
   - `ArchiveExplorer.tsx` + `TreeNode.tsx`
   - `NoteMenu.tsx`
   - `CommandModal.tsx`
   - `SettingsModal.tsx`
   - All extension components (`QuranEmbed.tsx`, `Callout.tsx`, etc.)

5. **Remove `lucide-react` from `package.json` dependencies.**

### 7.2 Animation & Motion System

**Current State:** Basic CSS keyframes (`fade-in-up`, `pop-in`, `embed-in`).  
**Target:** Spring-physics layout transitions, staggered entrances, meaningful motion.

#### Implementation Steps:

1. **Install `framer-motion`** (lightweight, works beautifully with React 19):
   ```bash
   npm install framer-motion
   ```

2. **Create motion primitives** `src/components/ui/Motion.tsx`:
   ```tsx
   import { motion, AnimatePresence } from 'framer-motion'

   export const springConfig = {
     type: "spring",
     stiffness: 400,
     damping: 30,
     mass: 0.8,
   }

   export const fadeInUp = {
     initial: { opacity: 0, y: 8 },
     animate: { opacity: 1, y: 0 },
     exit: { opacity: 0, y: -4 },
     transition: springConfig,
   }

   export const scaleIn = {
     initial: { opacity: 0, scale: 0.96 },
     animate: { opacity: 1, scale: 1 },
     exit: { opacity: 0, scale: 0.98 },
     transition: { ...springConfig, stiffness: 500 },
   }

   export const slideIn = {
     initial: { x: -20, opacity: 0 },
     animate: { x: 0, opacity: 1 },
     exit: { x: -10, opacity: 0 },
     transition: springConfig,
   }
   ```

3. **Mode transition morphing** in `Editor.tsx`:
   - Wrap the editor canvas in `<AnimatePresence mode="wait">`
   - When `mode` changes, animate the old canvas out (scale down + fade) and the new one in (scale up + fade)
   - Duration: 200ms with spring physics
   - The toolbar should also morph: Write mode shows block handles, Page mode shows rich text toolbar, Blocks mode shows drag handles

4. **Quran embed staggered entrance** in `QuranEmbed.tsx`:
   ```tsx
   <motion.div
     initial="hidden"
     animate="visible"
     variants={{
       hidden: {},
       visible: {
         transition: { staggerChildren: 0.04 }
       }
     }}
   >
     {result.map((verse, i) => (
       <motion.div
         key={`${verse.chapter}:${verse.verse}`}
         variants={{
           hidden: { opacity: 0, y: 6 },
           visible: { opacity: 1, y: 0 }
         }}
         transition={{ ...springConfig, delay: i * 0.04 }}
       >
         {/* verse content */}
       </motion.div>
     ))}
   </motion.div>
   ```

5. **Sidebar tab sliding indicator:**
   - Add a `<motion.div>` that acts as an active tab underline
   - Use `layoutId="activeTab"` so it smoothly slides between tabs
   - Spring transition: `stiffness: 500, damping: 35`

6. **Ribbon button tactile feedback:**
   ```tsx
   <motion.button
     whileHover={{ scale: 1.05, y: -1 }}
     whileTap={{ scale: 0.92 }}
     transition={{ type: "spring", stiffness: 600, damping: 25 }}
   />
   ```

7. **Tree expand/collapse:** Replace CSS `tree-expand` keyframe with Framer Motion's `<AnimatePresence>` on `TreeNode` children.

### 7.3 Emoji Picker for Folder Icons

**Current State:** `window.prompt()` for folder icons.  
**Target:** Inline popover with emoji grid + search.

#### Implementation Steps:

1. **Create `EmojiPicker.tsx`** (zero external deps, uses native emoji data):
   ```tsx
   // src/components/ui/EmojiPicker.tsx
   const COMMON_EMOJIS = [
     '📁','📂','📄','📝','📖','📚','💡','⭐','🔥','❤️',
     '🕌','🕋','☪️','✨','🌙','📿','🤲','🌿','🕊️','⚡',
     '🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤',
     '1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','✅','❌','❓','❗',
   ]

   export function EmojiPicker({ onSelect, onClose }: {
     onSelect: (emoji: string) => void
     onClose: () => void
   }) {
     const [search, setSearch] = useState('')
     // Filter by search or show common set
     return (
       <div className="glass-strong rounded-lg p-3 shadow-elev-lg w-64">
         <input
           type="text"
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           placeholder="Search emoji..."
           className="w-full bg-ed-surface rounded px-2 py-1 text-sm mb-2"
           autoFocus
         />
         <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
           {filteredEmojis.map(emoji => (
             <button
               key={emoji}
               onClick={() => { onSelect(emoji); onClose() }}
               className="hover:bg-ed-surface-strong rounded p-1 text-lg transition-colors"
             >
               {emoji}
             </button>
           ))}
         </div>
       </div>
     )
   }
   ```

2. **Wire into `TreeNode.tsx`:**
   - Right-click on folder → context menu with "Set Icon"
   - Or: hover on folder → small icon button appears
   - Clicking opens `EmojiPicker` in a floating popover (using Tippy or absolute positioning)

3. **Persist icons:** Already handled by `set_folder_icon` / `read_folder_icon` in Rust.

### 7.4 File Type Icons in Explorer

**Implementation:**

1. **Create `getFileIcon()` utility** in `src/lib/fileTypes.ts`:
   ```ts
   const FILE_TYPE_ICONS: Record<string, string> = {
     md: 'file-text',
     pdf: 'file-pdf',
     mp3: 'file-audio',
     mp4: 'file-video',
     jpg: 'file-image',
     jpeg: 'file-image',
     png: 'file-image',
     gif: 'file-image',
     svg: 'file-image',
     csv: 'table',
     txt: 'file-text',
     json: 'brackets-curly',
     yaml: 'brackets-curly',
     yml: 'brackets-curly',
   }

   export function getFileIcon(filename: string): string {
     const ext = filename.split('.').pop()?.toLowerCase() || ''
     return FILE_TYPE_ICONS[ext] || 'file'
   }
   ```

2. **Update `TreeNode.tsx`** to render the appropriate Phosphor icon based on file extension.

---

## Phase 8: Editor Core Deep Dive

### 8.1 Write Mode: Live Markdown Preview

**Current State:** Plain text blocks.  
**Target:** Typora-like live formatting where markdown syntax remains visible but styled.

#### Implementation Steps:

1. **Create `MarkdownSyntaxHighlight` Tiptap extension:**
   ```ts
   // src/components/extensions/MarkdownSyntaxHighlight.ts
   import { Extension } from '@tiptap/core'
   import { Plugin, PluginKey } from '@tiptap/pm/state'
   import { Decoration, DecorationSet } from '@tiptap/pm/view'

   export const MarkdownSyntaxHighlight = Extension.create({
     name: 'markdownSyntaxHighlight',
     addProseMirrorPlugins() {
       return [
         new Plugin({
           key: new PluginKey('markdownSyntaxHighlight'),
           state: {
             init() { return DecorationSet.empty },
             apply(tr, set) {
               set = set.map(tr.mapping, tr.doc)
               // Find and decorate markdown syntax patterns
               // **bold**, *italic*, `code`, # headings, etc.
               // Use regex on text nodes to create inline decorations
               return set
             }
           },
           props: {
             decorations(state) { return this.getState(state) }
           }
         })
       ]
     }
   })
   ```

2. **Decoration styling** (add to `App.css`):
   ```css
   .md-syntax-bold { color: rgba(251, 191, 36, 0.6); }
   .md-syntax-italic { color: rgba(251, 191, 36, 0.5); font-style: normal; }
   .md-syntax-code { color: rgba(167, 243, 208, 0.6); }
   .md-syntax-heading { color: rgba(251, 191, 36, 0.4); }
   ```

3. **Only activate in Write mode.** In Blocks and Page modes, hide the syntax markers and show rendered formatting.

### 8.2 Page Mode: Typographic Enhancements

#### Implementation Steps:

1. **Auto-curly quotes extension:**
   ```ts
   // src/components/extensions/SmartTypography.ts
   import { Extension } from '@tiptap/core'

   export const SmartTypography = Extension.create({
     name: 'smartTypography',
     addInputRules() {
       return [
         // " -> ""
         textInputRule({ find: /(?:^|[\s{[(<'"‘])"$/, replace: '"' }),
         // ' -> ''
         textInputRule({ find: /(?:^|[\s{[(<'"‘])'$/, replace: ''' }),
         // -- -> —
         textInputRule({ find: /--$/, replace: '—' }),
         // ... -> …
         textInputRule({ find: /\.\.\.$/, replace: '…' }),
       ]
     }
   })
   ```

2. **Typewriter scrolling:**
   ```tsx
   // In Editor.tsx, when mode === 'page'
   useEffect(() => {
     if (mode !== 'page' || !editor) return

     const handleSelectionUpdate = () => {
       const { view } = editor
       const cursorPos = view.coordsAtPos(view.state.selection.head)
       const editorRect = view.dom.getBoundingClientRect()
       const targetY = editorRect.top + editorRect.height / 2
       const scrollContainer = view.dom.closest('.overflow-y-auto')

       if (scrollContainer && Math.abs(cursorPos.top - targetY) > 50) {
         scrollContainer.scrollBy({
           top: cursorPos.top - targetY,
           behavior: 'smooth'
         })
       }
     }

     editor.on('selectionUpdate', handleSelectionUpdate)
     return () => { editor.off('selectionUpdate', handleSelectionUpdate) }
   }, [mode, editor])
   ```

3. **Draft vs. Print layout sub-mode:**
   - Add `layout: 'print' | 'draft'` to frontmatter
   - Print: 816px fixed width, page shadow, 1" margins
   - Draft: `max-width: 80ch`, no page metaphor, continuous flow
   - Toggle in `NoteMenu.tsx` or toolbar

### 8.3 Blocks Mode: Block-Level Actions

#### Implementation Steps:

1. **Create `BlockActions` plugin:**
   - On hover over any top-level block, show a floating action bar
   - Actions: Duplicate, Delete, Turn into Heading 1/2/3, Turn into Quran Embed, Turn into Callout, Move Up, Move Down
   - Use Tippy.js (already a dependency) for positioning

2. **Block handle improvements:**
   - The drag handle from `@tiptap/extension-drag-handle-react` should appear on the left gutter
   - Add a `⋮⋮` grip icon (Phosphor `DotsSixVertical`) instead of the default handle
   - On drag, show a ghost preview of the block

### 8.4 Block-Level Slash Commands

**Current State:** `/quran`, `/note`, `/tip`, `/warning`, `/important`, `/arabic`.  
**Target:** Richer command palette with sections and icons.

#### Implementation Steps:

1. **Restructure `getSlashCommandItems()`** to return grouped items:
   ```ts
   export interface SlashCommandGroup {
     title: string
     items: SlashCommandItem[]
   }

   export function getSlashCommandGroups(query: string): SlashCommandGroup[] {
     return [
       {
         title: 'Quran',
         items: [/* quran block, quran inline, arabic block */]
       },
       {
         title: 'Formatting',
         items: [/* headings, bullet list, numbered list, quote, divider */]
       },
       {
         title: 'Media',
         items: [/* image, audio, table */]
       },
       {
         title: 'Callouts',
         items: [/* note, tip, warning, important */]
       },
     ]
   }
   ```

2. **Update slash command UI** to show grouped sections with Phosphor icons per item.

---

## Phase 9: Scholarly Writing Tools

### 9.1 Footnotes Extension

**This is the single biggest scholarly differentiator.**

#### Implementation Steps:

1. **Create `Footnote` Tiptap node extension:**
   ```ts
   // src/components/extensions/Footnote.ts
   import { Node, mergeAttributes } from '@tiptap/core'

   export const Footnote = Node.create({
     name: 'footnote',
     group: 'inline',
     inline: true,
     atom: true,

     addAttributes() {
       return {
         id: { default: null },
         label: { default: '' },
       }
     },

     parseHTML() {
       return [{ tag: 'sup[data-footnote]' }]
     },

     renderHTML({ HTMLAttributes }) {
       return ['sup', mergeAttributes(HTMLAttributes, { 'data-footnote': '' }), '']
     },

     addNodeView() {
       return ({ node, editor }) => {
         const dom = document.createElement('sup')
         dom.className = 'footnote-ref cursor-pointer text-qv-accent hover:underline'
         dom.textContent = `[${node.attrs.label || node.attrs.id}]`
         dom.addEventListener('click', () => {
           // Scroll to footnote section or open footnote editor
           editor.commands.focus()
         })
         return { dom }
       }
     }
   })
   ```

2. **Create `FootnoteSection` node:**
   - A special block that collects all footnotes at the bottom of the document
   - Auto-updates when footnotes are added/removed
   - Each footnote is editable inline within the section

3. **Input rule for `[^1]`:**
   ```ts
   addInputRules() {
     return [
       new InputRule({
         find: /\\[\\^(\\d+)\\]$/,
         handler: ({ state, range, match }) => {
           const id = match[1]
           return state.tr
             .delete(range.from, range.to)
             .insertText('')
             .setMeta('footnote', { id, action: 'create' })
         }
       })
     ]
   }
   ```

4. **Markdown serialization:**
   - Inline: `[^1]`
   - Section at bottom:
     ```markdown
     [^1]: This is the footnote text.
     ```

5. **Footnote editor in RightInspector:**
   - Add a "Footnotes" tab to `RightInspector.tsx`
   - Shows all footnotes for the current note
   - Click to jump to reference location
   - Edit footnote text inline

### 9.2 Citation Registry

#### Implementation Steps:

1. **Create `.studio/citations.yaml` schema:**
   ```yaml
   citations:
     khalifa1992:
       type: book
       author: "Rashad Khalifa"
       title: "Quran: The Final Testament"
       year: 1992
       publisher: "Islamic Productions"

     submitters-perspectives:
       type: periodical
       title: "Submitters Perspectives"
       publisher: "United Submitters International"
       years: "1985-1990"
   ```

2. **Rust commands:**
   - `read_citations(archive_root)` → parse YAML → return structured citations
   - `write_citation(archive_root, id, data)` → append/update citation
   - `delete_citation(archive_root, id)`

3. **Autocomplete in editor:**
   - Type `@` → trigger citation picker (similar to slash command)
   - Filter by author, title, year
   - Insert as `[@khalifa1992]` or formatted citation

4. **Citation styles:**
   - Support APA, MLA, Chicago (simplified)
   - Store preferred style in settings
   - Export notes with formatted bibliography

### 9.3 Quran Embed Enhancements

#### Implementation Steps:

1. **Copy verse button on hover:**
   ```tsx
   // In QuranEmbedComponent
   const handleCopy = () => {
     const text = result.map(v => 
       `${v.arabic}
${v.english} [${v.chapter}:${v.verse}]`
     ).join('

')
     navigator.clipboard.writeText(text)
     // Show toast: "Copied to clipboard"
   }
   ```

2. **Focus mode for embeds:**
   ```css
   .quran-embed-wrapper:focus-within,
   .quran-embed-wrapper.focused {
     box-shadow: 0 0 0 2px rgba(107, 52, 16, 0.3), var(--shadow-glow-warm);
   }
   ```
   - Click embed → add `.focused` class
   - Click outside → remove
   - Optional: dim rest of editor when focused

3. **Tajweed color support (future-ready):**
   - Add `tajweed` boolean to `Verse` struct in Rust
   - If true, wrap Arabic in spans with tajweed classes
   - CSS classes: `.tajweed-ghunnah`, `.tajweed-ikhfa`, etc.
   - Keep disabled until data is available

4. **Verse comparison:**
   - Allow multiple Quran embeds side-by-side
   - Or: a special "Compare" embed that shows two translations

---

## Phase 10: Search & Information Architecture

### 10.1 Fuzzy Search Integration

#### Implementation Steps:

1. **Install `fuse.js`:**
   ```bash
   npm install fuse.js
   ```

2. **Create `FuseSearch` utility** `src/lib/search.ts`:
   ```ts
   import Fuse from 'fuse.js'
   import type { NoteRecord } from './notes'

   const fuseOptions = {
     keys: [
       { name: 'name', weight: 0.4 },
       { name: 'content', weight: 0.5 },
       { name: 'tags', weight: 0.1 },
     ],
     threshold: 0.3,
     includeScore: true,
     includeMatches: true,
   }

   export function createSearchIndex(records: NoteRecord[]) {
     return new Fuse(records, fuseOptions)
   }
   ```

3. **Update `SearchPane.tsx`:**
   - Use Fuse for fuzzy matching instead of substring
   - Highlight matched terms in results
   - Show match score and context snippet

4. **Search operators:**
   - `tag:sermon` → filter by tag before fuzzy search
   - `path:notes/sermons` → restrict to folder
   - `before:2026-01-01` → filter by frontmatter date
   - `"exact phrase"` → already supported, keep it
   - `AND`, `OR`, `NOT` → basic boolean logic

### 10.2 Saved Searches

#### Implementation Steps:

1. **Add to `.studio/settings.json`:**
   ```json
   {
     "savedSearches": [
       { "name": "Recent Sermons", "query": "tag:sermon sort:modified" },
       { "name": "Unlinked Notes", "query": "links:0" }
     ]
   }
   ```

2. **UI in sidebar:**
   - New section in `SearchPane.tsx`: "Saved Searches"
   - Click to run the query
   - Pin to sidebar as a persistent filter

### 10.3 Tag System Improvements

#### Implementation Steps:

1. **Tag autocomplete:**
   - When typing `#` in the editor, show existing tags from the vault
   - Filter as user types
   - Create new tag on Enter

2. **Tag hierarchy:**
   - Support nested tags: `#topic/sermon/jumuah`
   - `TagsPane.tsx` shows collapsible tree

3. **Tag colors:**
   - Allow assigning colors to tags in `.studio/tag-colors.json`
   - Show colored dots next to tags in explorer

---

## Phase 11: Workspace & Multi-Pane

### 11.1 Note-to-Note Split View

**Current State:** Only PDF split view exists.  
**Target:** Arbitrary horizontal/vertical splits like VS Code/Obsidian.

#### Implementation Steps:

1. **Redesign workspace state** in `App.tsx`:
   ```ts
   interface Pane {
     id: string
     type: 'editor' | 'viewer' | 'graph' | 'pdf'
     filePath: string | null
     mode?: EditorMode
   }

   interface SplitNode {
     id: string
     direction: 'horizontal' | 'vertical'
     children: (SplitNode | Pane)[]
     size: number // percentage
   }

   interface WorkspaceState {
     root: SplitNode | Pane
     activePaneId: string
   }
   ```

2. **Create `SplitPane.tsx`:**
   - Recursive component that renders either a `Pane` or splits into two resizable `SplitPane`s
   - Use a resize handle (3px wide, hover to show)
   - Store sizes in `localStorage` per vault

3. **Tab drag-to-split:**
   - Drag a tab to the left/right/top/bottom edge of another pane
   - Visual drop indicator (blue overlay on target region)
   - On drop, create a new split node

4. **Keyboard shortcuts:**
   - `Ctrl/Cmd+\` → split current pane vertically
   - `Ctrl/Cmd+Shift+\` → split horizontally
   - `Ctrl/Cmd+W` → close active pane

### 11.2 Workspace Sessions

#### Implementation Steps:

1. **Create `.studio/workspace.json`:**
   ```json
   {
     "openTabs": [
       { "path": "notes/sermon-2026-08-11.md", "mode": "page" },
       { "path": "notes/quran-study.md", "mode": "write" }
     ],
     "activeTabIndex": 0,
     "sidebarOpen": true,
     "sidebarTab": "files",
     "sidebarWidth": 280,
     "inspectorOpen": true,
     "inspectorWidth": 320,
     "splitLayout": { /* tree structure */ }
   }
   ```

2. **Save on change:**
   - Debounced save (2s) of workspace state
   - Restore on app launch

3. **Multiple workspaces:**
   - Allow saving named workspace layouts
   - "Study", "Writing", "Sermon Prep" presets

---

## Phase 12: Desktop Shell & Native Integration

### 12.1 Window Configuration

#### Implementation Steps:

1. **Update `tauri.conf.json`:**
   ```json
   {
     "app": {
       "windows": [
         {
           "title": "SubmissionArchives Studio",
           "width": 1400,
           "height": 900,
           "minWidth": 900,
           "minHeight": 600,
           "visible": true,
           "decorations": true,
           "center": true,
           "transparent": false,
           "fullscreen": false,
           "resizable": true,
           "maximizable": true,
           "minimizable": true,
           "closable": true,
           "focus": true
         }
       ]
     }
   }
   ```

2. **Custom title bar (optional, advanced):**
   - Set `decorations: false`
   - Build a custom title bar in React with window controls (minimize, maximize, close)
   - Use Tauri `appWindow` API for controls
   - Add drag region for moving the window
   - Show current note name in title bar

### 12.2 Native Application Menu

#### Implementation Steps:

1. **Add to `src-tauri/src/lib.rs`:**
   ```rust
   use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};

   fn build_menu(app: &tauri::AppHandle) -> tauri::Result<Menu> {
     let file_menu = Submenu::with_items(
       app,
       "File",
       true,
       &[
         &MenuItem::with_id(app, "new-note", "New Note", true, Some("CmdOrCtrl+N"))?,
         &MenuItem::with_id(app, "open-archive", "Open Archive...", true, Some("CmdOrCtrl+O"))?,,
         &PredefinedMenuItem::separator(app)?,
         &MenuItem::with_id(app, "import", "Import...", true, None)?,
         &PredefinedMenuItem::separator(app)?,
         &PredefinedMenuItem::quit(app)?,
       ],
     )?;

     let edit_menu = Submenu::with_items(
       app,
       "Edit",
       true,
       &[
         &PredefinedMenuItem::undo(app)?,
         &PredefinedMenuItem::redo(app)?,
         &PredefinedMenuItem::separator(app)?,
         &PredefinedMenuItem::cut(app)?,
         &PredefinedMenuItem::copy(app)?,
         &PredefinedMenuItem::paste(app)?,
         &PredefinedMenuItem::separator(app)?,
         &MenuItem::with_id(app, "find", "Find in Note", true, Some("CmdOrCtrl+F"))?,,
       ],
     )?;

     let view_menu = Submenu::with_items(
       app,
       "View",
       true,
       &[
         &MenuItem::with_id(app, "toggle-sidebar", "Toggle Sidebar", true, Some("CmdOrCtrl+\"))?,,
         &MenuItem::with_id(app, "toggle-inspector", "Toggle Inspector", true, Some("CmdOrCtrl+Shift+I"))?,,
         &PredefinedMenuItem::separator(app)?,
         &MenuItem::with_id(app, "mode-write", "Write Mode", true, Some("CmdOrCtrl+1"))?,,
         &MenuItem::with_id(app, "mode-blocks", "Blocks Mode", true, Some("CmdOrCtrl+2"))?,,
         &MenuItem::with_id(app, "mode-page", "Page Mode", true, Some("CmdOrCtrl+3"))?,,
         &PredefinedMenuItem::separator(app)?,
         &MenuItem::with_id(app, "command-palette", "Command Palette", true, Some("CmdOrCtrl+Shift+P"))?,,
         &MenuItem::with_id(app, "quick-switcher", "Quick Switcher", true, Some("CmdOrCtrl+O"))?,,
       ],
     )?;

     Menu::with_items(app, &[&file_menu, &edit_menu, &view_menu])
   }
   ```

2. **Handle menu events:**
   ```rust
   .on_menu_event(|app, event| {
     match event.id().as_ref() {
       "new-note" => { /* emit to frontend */ }
       "open-archive" => { /* emit to frontend */ }
       "toggle-sidebar" => { /* emit to frontend */ }
       // ... etc
     }
   })
   ```

3. **Frontend listeners** in `App.tsx`:
   ```ts
   import { listen } from '@tauri-apps/api/event'

   useEffect(() => {
     const unlisten = listen('menu:new-note', () => handleNewNote())
     return () => { unlisten.then(f => f()) }
   }, [])
   ```

### 12.3 Global Shortcuts

#### Implementation Steps:

1. **Register in Rust** (Tauri v2 global shortcuts):
   ```rust
   use tauri_plugin_global_shortcut::{Shortcut, Code, Modifiers};

   app.handle().plugin(
     tauri_plugin_global_shortcut::Builder::new()
       .with_shortcuts(["CmdOrCtrl+Shift+N"])?
       .with_handler(|app, shortcut, event| {
         if event.state == ShortcutState::Pressed {
           app.emit("global:new-note", ()).unwrap();
         }
       })
       .build(),
   )?;
   ```

2. **Custom keybindings config** in `.studio/settings.json`:
   ```json
   {
     "keybindings": {
       "new-note": "CmdOrCtrl+N",
       "quick-switcher": "CmdOrCtrl+O",
       "command-palette": "CmdOrCtrl+Shift+P",
       "toggle-sidebar": "CmdOrCtrl+\",
       "find-in-note": "CmdOrCtrl+F",
       "split-vertical": "CmdOrCtrl+\",
       "split-horizontal": "CmdOrCtrl+Shift+\",
       "close-pane": "CmdOrCtrl+W"
     }
   }
   ```

### 12.4 File Associations

#### Implementation Steps:

1. **Update `tauri.conf.json` bundle config:**
   ```json
   {
     "bundle": {
       "active": true,
       "targets": "all",
       "macOS": {
         "files": {
           "associations": [
             {
               "ext": ["md", "markdown", "mdown"],
               "name": "Markdown Document",
               "role": "Editor"
             }
           ]
         }
       },
       "windows": {
         "webviewInstallMode": {
           "type": "downloadBootstrapper"
         }
       }
     }
   }
   ```

2. **Handle file open events** in Rust:
   ```rust
   .on_open_url(|app, event| {
     if let tauri::UrlOpenEvent::OpenUrl(url) = event {
       if url.scheme() == "studio" {
         app.emit("protocol:open", url.to_string()).unwrap();
       }
     }
   })
   ```

### 12.5 System Tray

#### Implementation Steps:

1. **Add to `tauri.conf.json`:**
   ```json
   {
     "app": {
       "trayIcon": {
         "id": "main-tray",
         "iconPath": "icons/icon.png",
         "iconAsTemplate": true,
         "menuOnLeftClick": false
       }
     }
   }
   ```

2. **Build tray menu in Rust:**
   ```rust
   let tray_menu = Menu::with_items(app, &[
     &MenuItem::with_id(app, "show", "Show Studio", true, None)?,
     &MenuItem::with_id(app, "new-note", "New Note", true, None)?,
     &PredefinedMenuItem::separator(app)?,
     &PredefinedMenuItem::quit(app)?,
   ])?;
   ```

3. **Minimize-to-tray behavior:**
   - On window close (X button), hide instead of quit
   - Show tray notification: "Studio is running in the background"
   - Setting to control this behavior

### 12.6 Auto-Updater

#### Implementation Steps:

1. **Install Tauri updater plugin:**
   ```bash
   cd src-tauri
   cargo add tauri-plugin-updater
   ```

2. **Configure in `tauri.conf.json`:**
   ```json
   {
     "plugins": {
       "updater": {
         "active": true,
         "endpoints": ["https://archive.wikisubmission.org/api/studio/releases"],
         "dialog": true,
         "pubkey": "YOUR_PUBLIC_KEY_HERE"
       }
     }
   }
   ```

3. **Check on startup** (in Rust):
   ```rust
   app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
   ```

### 12.7 Portable Mode

#### Implementation Steps:

1. **Detect portable mode** in Rust `archive.rs`:
   ```rust
   pub fn is_portable() -> bool {
     if let Ok(exe_dir) = std::env::current_exe() {
       if let Some(dir) = exe_dir.parent() {
         return dir.join(".studio").exists();
       }
     }
     false
   }

   pub fn get_default_archive_path() -> Option<PathBuf> {
     if is_portable() {
       std::env::current_exe()
         .ok()?
         .parent()
         .map(|p| p.to_path_buf())
     } else {
       None // Fall back to user selection
     }
   }
   ```

2. **Update `WelcomeScreen.tsx`** to auto-detect and open portable archive.

---

## Phase 13: Data Integrity & Export

### 13.1 Atomic Writes & Crash Recovery

#### Implementation Steps:

1. **Update `write_note` in `archive.rs`:**
   ```rust
   pub fn write_note(path: &str, content: &str) -> Result<(), String> {
     let path = Path::new(path);
     let temp_path = path.with_extension("tmp");

     // Write to temp file
     std::fs::write(&temp_path, content)
       .map_err(|e| format!("Failed to write temp file: {}", e))?;

     // Ensure data is flushed to disk
     let file = std::fs::File::open(&temp_path)
       .map_err(|e| format!("Failed to open temp file: {}", e))?;
     file.sync_all()
       .map_err(|e| format!("Failed to sync temp file: {}", e))?;
     drop(file);

     // Atomic rename
     std::fs::rename(&temp_path, path)
       .map_err(|e| format!("Failed to rename temp file: {}", e))?;

     Ok(())
   }
   ```

2. **Crash recovery buffer** in `archive.rs`:
   ```rust
   pub fn write_recovery_buffer(archive_root: &str, note_path: &str, content: &str) -> Result<(), String> {
     let recovery_dir = Path::new(archive_root).join(".studio").join("crash_recovery");
     std::fs::create_dir_all(&recovery_dir)
       .map_err(|e| format!("Failed to create recovery dir: {}", e))?;

     let hash = blake3::hash(note_path.as_bytes()).to_hex();
     let recovery_path = recovery_dir.join(format!("{}.md", hash));

     std::fs::write(&recovery_path, content)
       .map_err(|e| format!("Failed to write recovery buffer: {}", e))?;

     Ok(())
   }
   ```

3. **Frontend integration:**
   - Call `write_recovery_buffer` on every editor update (not debounced)
   - On app startup, check for recovery files and offer to restore

### 13.2 Vault Health Check

#### Implementation Steps:

1. **Create `health.rs` in Rust:**
   ```rust
   pub struct HealthReport {
     pub broken_links: Vec<(String, String)>, // (note_path, broken_link)
     pub orphaned_attachments: Vec<String>,
     pub frontmatter_errors: Vec<(String, String)>,
     pub empty_notes: Vec<String>,
   }

   pub fn check_vault_health(archive_root: &str) -> Result<HealthReport, String> {
     let records = notes::scan_archive(archive_root)?;
     let mut report = HealthReport {
       broken_links: vec![],
       orphaned_attachments: vec![],
       frontmatter_errors: vec![],
       empty_notes: vec![],
     };

     // Check for broken wiki links
     let all_note_names: HashSet<String> = records.iter()
       .map(|r| r.name.clone())
       .collect();

     for record in &records {
       for link in &record.links {
         if !all_note_names.contains(link) {
           report.broken_links.push((record.path.clone(), link.clone()));
         }
       }

       // Check frontmatter
       if let Err(e) = parse_frontmatter(&record.content) {
         report.frontmatter_errors.push((record.path.clone(), e));
       }

       // Check empty notes
       let body = strip_frontmatter(&record.content);
       if body.trim().is_empty() {
         report.empty_notes.push(record.path.clone());
       }
     }

     // Check orphaned attachments
     let attachments_dir = Path::new(archive_root).join(".studio").join("attachments");
     if attachments_dir.exists() {
       // Compare attachment files against references in notes
     }

     Ok(report)
   }
   ```

2. **UI in command palette:** "Check Vault Integrity" → opens modal with report.

### 13.3 Export System

#### Implementation Steps:

1. **Export to PDF:**
   - Use Tauri's `webview.print()` API
   - Or: use `headless_chrome` Rust crate for server-side PDF generation
   - Page mode should export WYSIWYG
   - Add print CSS (`@media print`) that hides UI chrome

2. **Export to HTML:**
   ```rust
   pub fn export_to_html(archive_root: &str, note_path: &str) -> Result<String, String> {
     let content = read_note(note_path)?;
     let (fm, body) = parse_frontmatter(&content);

     // Convert markdown body to HTML
     let html = markdown_to_html(&body);

     // Wrap in self-contained HTML with inline CSS
     Ok(format!(r#"
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>{}</title>
  <style>
    /* Inline all necessary CSS */
  </style>
</head>
<body>
  <article>{}</article>
</body>
</html>
"#, fm.get("title").unwrap_or(&"Untitled".to_string()), html))
   }
   ```

3. **Export to DOCX:**
   - Option 1: Use `pandoc` if installed on system
   - Option 2: Use `docx-rs` crate for pure Rust generation
   - Start with pandoc integration, add native later

4. **Export UI** in `NoteMenu.tsx`:
   - "Export as..." submenu
   - PDF, HTML, DOCX, Markdown (already exists)
   - Choose destination folder via native dialog

---

## Phase 14: Theming & Accessibility

### 14.1 Light Theme ("Reading Room")

#### Implementation Steps:

1. **Create light theme tokens** in `App.css`:
   ```css
   :root[data-theme="light"] {
     --color-ed-bg: #F5F1E8;
     --color-ed-fg: #2C2416;
     --color-ed-fg-muted: #6B5B4F;
     --color-ed-rule: rgba(44, 36, 22, 0.08);
     --color-ed-rule-strong: rgba(44, 36, 22, 0.16);
     --color-ed-surface: #EDE8DC;
     --color-ed-surface-strong: #E0D9CA;
     --color-ed-accent: #6B3410;
     --color-ed-accent-strong: #4A2408;
     --color-ed-accent-soft: #8B5A2B;
   }
   ```

2. **Theme toggle:**
   - Add to `SettingsModal.tsx`: "Appearance" section with "Dark", "Light", "System" options
   - Persist in `.studio/settings.json`
   - Apply via `document.documentElement.setAttribute('data-theme', theme)`

3. **Quran embed in light mode:**
   - The embed already uses its own `--color-qv-*` tokens
   - May need slight adjustment for contrast on light background

### 14.2 Accessibility

#### Implementation Steps:

1. **Keyboard navigation:**
   - Ensure all interactive elements are reachable via Tab
   - Add `aria-label` to all icon-only buttons
   - Implement focus trapping in modals

2. **Screen reader support:**
   - Add `role="region"` and `aria-label` to sidebar, editor, inspector
   - Live regions for save status announcements
   - Quran embeds should announce "Quran verse [reference]" to screen readers

3. **Reduced motion:**
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

4. **Font size scaling:**
   - Add editor font size control (12px–24px) in settings
   - Apply via CSS custom property `--editor-font-size`

---

## Implementation Order & Sprint Mapping

### Sprint 1: Foundation (Weeks 1–2)
- [ ] Swap `lucide-react` → `phosphor-react`
- [ ] Install `framer-motion`, create motion primitives
- [ ] Update window defaults in `tauri.conf.json`
- [ ] Emoji picker for folder icons
- [ ] File type icons in explorer

### Sprint 2: Editor Polish (Weeks 3–4)
- [ ] Write mode: live markdown syntax highlighting
- [ ] Page mode: smart typography, typewriter scrolling, draft sub-mode
- [ ] Blocks mode: block-level action bar
- [ ] Richer slash command palette with groups and icons
- [ ] Mode transition animations

### Sprint 3: Scholarly Core (Weeks 5–6)
- [ ] Footnotes Tiptap extension + RightInspector panel
- [ ] Citation registry (Rust + YAML)
- [ ] `@` citation autocomplete
- [ ] Quran embed: copy button, focus mode
- [ ] Tag autocomplete in editor

### Sprint 4: Search & IA (Weeks 7–8)
- [ ] Integrate `fuse.js` for fuzzy search
- [ ] Search operators (`tag:`, `path:`, `before:`)
- [ ] Saved searches
- [ ] Tag hierarchy and colors

### Sprint 5: Workspace (Weeks 9–10)
- [ ] Split pane system (horizontal/vertical)
- [ ] Tab drag-to-split
- [ ] Workspace session save/restore
- [ ] Named workspace presets

### Sprint 6: Desktop Shell (Weeks 11–12)
- [ ] Native application menu
- [ ] Global shortcuts
- [ ] System tray
- [ ] File associations
- [ ] Portable mode detection
- [ ] Auto-updater configuration

### Sprint 7: Data Integrity (Weeks 13–14)
- [ ] Atomic writes in Rust
- [ ] Crash recovery buffer
- [ ] Vault health check
- [ ] Export to PDF, HTML, DOCX

### Sprint 8: Theming & Polish (Weeks 15–16)
- [ ] Light theme ("Reading Room")
- [ ] Accessibility audit and fixes
- [ ] Final animation pass
- [ ] Performance optimization (large vault handling)
- [ ] Documentation and onboarding

---

## Claude Opus Implementation Prompt

The following prompt is designed to be copy-pasted into Claude Opus (or any capable coding AI) to implement the improvements. It is structured to maximize context and minimize ambiguity.

---

```
You are an expert full-stack developer specializing in Tauri v2, Rust, React 19, TypeScript, and ProseMirror/Tiptap. You are working on "SubmissionArchives Studio," a premium offline-first desktop application for Islamic scholarly writing and Quran study.

## PROJECT CONTEXT

The app is built with:
- Tauri v2 (Rust backend, system webview frontend)
- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Tiptap (ProseMirror) for the editor
- tauri-apps/plugin-dialog for native dialogs
- tauri-apps/plugin-opener
- tippy.js for popups
- tiptap-markdown for MD serialization
- js-yaml for frontmatter

The app stores all data as standard .md files in a user-selected folder (the "Archive"). It is 100% offline with no cloud dependencies.

## REPOSITORY STRUCTURE

studio/
├── src/
│   ├── App.tsx              (Main app shell: ribbon, sidebar, tabs, editor, inspector)
│   ├── App.css              (Design tokens, animations, glassmorphism utilities)
│   ├── components/
│   │   ├── Editor.tsx       (Tiptap editor wrapper, autosave, mode toggle)
│   │   ├── EditorToolbar.tsx
│   │   ├── LeftRibbon.tsx   (Far-left vertical icon bar)
│   │   ├── ArchiveExplorer.tsx + archive/TreeNode.tsx (File tree sidebar)
│   │   ├── CommandModal.tsx (Shared quick switcher + command palette)
│   │   ├── SettingsModal.tsx
│   │   ├── NoteMenu.tsx     (Note actions dropdown)
│   │   ├── RightInspector.tsx (Outline, backlinks, frontmatter)
│   │   ├── GraphView.tsx
│   │   ├── extensions/
│   │   │   ├── QuranEmbed.tsx      (Block-level bilingual verse embed)
│   │   │   ├── QuranEmbedInline.tsx (Inline verse chip)
│   │   │   ├── Callout.tsx         (Obsidian-style callouts)
│   │   │   ├── ArabicBlock.tsx     (RTL writing block)
│   │   │   ├── WikiLink.tsx        ([[Page Name]] links)
│   │   │   └── slash-command/      (/quran, /note, /tip, etc.)
│   │   └── archive/
│   │       ├── TagsPane.tsx
│   │       ├── SearchPane.tsx
│   │       └── TrashPane.tsx
│   ├── hooks/
│   │   ├── useArchive.ts
│   │   ├── useSettings.tsx   (SettingsProvider with .studio/settings.json)
│   │   └── useTheme.ts
│   └── lib/
│       ├── frontmatter.ts
│       ├── notes.ts
│       ├── graph.ts
│       └── fileTypes.ts
├── src-tauri/src/
│   ├── lib.rs               (Tauri command registrations)
│   ├── archive.rs           (File system: list, read, write, create, trash, duplicate, move)
│   ├── quran.rs             (CSV parsing, verse search)
│   ├── notes.rs             (Vault scan: tags, links, full-text)
│   ├── history.rs           (Version snapshots, debounced)
│   └── import.rs            (File/ZIP import)
└── tauri.conf.json

## DESIGN SYSTEM ("Midnight Vault")

Key CSS custom properties (from App.css):
- --color-ed-bg: #0a0a0a (main background)
- --color-ed-fg: #fafafa (primary text)
- --color-ed-fg-muted: #a1a1aa (secondary text)
- --color-ed-surface: #171717 (card/sidebar background)
- --color-ed-surface-strong: #262626 (hover states)
- --color-ed-accent: #fafafa (active elements)
- --color-ed-rule: rgba(255,255,255,0.08) (borders)
- --font-sans: "Inter", system-ui
- --font-arabic: "Amiri", serif
- --font-serif: "Source Serif 4", Georgia, serif

Quran embed uses its own "Ink on Parchment" palette:
- --color-qv-bg: #fbf8f1
- --color-qv-fg: #1a1715
- --color-qv-accent: #6b3410

Animation easings:
- --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1)
- --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)

## CURRENT FEATURES (Phase 1-6 Complete)

1. Three editor modes: Write, Blocks, Page
2. /quran slash command → bilingual verse embed (block + inline)
3. /arabic slash command → RTL block
4. Obsidian-style [[Wiki Links]] with auto-creation
5. YAML frontmatter with editable panel
6. Bidirectional backlinks panel
7. Tags pane, full-text search pane, trash pane
8. Quick switcher (Ctrl+O) + Command palette (Ctrl+P)
9. Graph view (force simulation, falls back above 300 nodes)
10. Callouts: /note, /tip, /warning, /important
11. CSS theme snippets via .studio/theme.css
12. Multi-format file viewer (images, PDF, video, audio, CSV)
13. Version history (20 snapshots per note, debounced)
14. Trash with restore
15. Duplicate, Move, Import (files + ZIP)
16. PDF split view
17. Lock page, Full width, Font family per note
18. Settings modal with persistence
19. Custom folder icons (emoji via window.prompt)
20. Exact-phrase search with quotes

## YOUR TASK

Implement the following improvements. Work file by file, providing complete, production-ready code for each change. Do not use placeholder comments like "// implement logic here" — write the actual implementation.

### PRIORITY 1: Iconography & Visual Polish

1. Replace ALL `lucide-react` imports with `@phosphor-icons/react` equivalents. Create a centralized icon mapping. Use weight="regular" for sidebar, weight="bold" for toolbar, weight="fill" for active states.

2. Create an `EmojiPicker` component (zero new deps) that replaces `window.prompt()` for folder icons. It should show a grid of common emojis with a search filter. Use the existing `set_folder_icon` / `read_folder_icon` Rust commands.

3. Add file-type-specific icons in the archive explorer using Phosphor icons. Map extensions: md→file-text, pdf→file-pdf, mp3→file-audio, mp4→file-video, jpg/png→file-image, csv→table, txt→file-text, json/yaml→brackets-curly.

### PRIORITY 2: Animation System

4. Install `framer-motion` and create motion primitives (`fadeInUp`, `scaleIn`, `slideIn`) with the project's spring physics. Replace all CSS keyframe animations in the UI with Framer Motion equivalents.

5. Implement mode transition morphing in `Editor.tsx`: when switching Write/Blocks/Page, animate the old canvas out and new one in with spring physics (200ms).

6. Add staggered verse entrance in `QuranEmbed.tsx`: Arabic line rises first, English fades in 40ms later per verse.

7. Add a sliding active indicator to sidebar tabs (files/tags/search/trash) using Framer Motion `layoutId`.

8. Enhance ribbon buttons with `whileHover={{ scale: 1.05, y: -1 }}` and `whileTap={{ scale: 0.92 }}` spring physics.

### PRIORITY 3: Editor Core Enhancements

9. Create a `MarkdownSyntaxHighlight` Tiptap extension that decorates markdown syntax (`**bold**`, `*italic*`, `` `code` ``, `# heading`) with subtle color hints in Write mode only. Use ProseMirror decorations.

10. Create a `SmartTypography` Tiptap extension with input rules: straight quotes → curly quotes, `--` → em-dash, `...` → ellipsis. Only active in Page mode.

11. Implement typewriter scrolling in Page mode: keep the cursor vertically centered in the viewport as the user types.

12. Add a "Draft" sub-mode to Page mode (frontmatter: `layout: 'print' | 'draft'`). Print = 816px fixed width with page shadow. Draft = max-width 80ch, continuous flow, no page metaphor. Toggle in NoteMenu.

13. Create a `BlockActions` floating toolbar that appears on hover over any top-level block in Blocks mode. Actions: Duplicate, Delete, Turn into H1/H2/H3, Turn into Quran Embed, Turn into Callout, Move Up, Move Down. Use tippy.js for positioning.

### PRIORITY 4: Scholarly Tools (THE DIFFERENTIATOR)

14. Create a `Footnote` Tiptap node extension:
    - Inline `[^1]` input rule creates a superscript reference
    - Clicking the reference scrolls to a FootnoteSection at the bottom
    - FootnoteSection is a special block that auto-collects all footnotes
    - Each footnote is editable inline
    - Serialize to standard Markdown: `[^1]: footnote text`
    - Add a "Footnotes" tab to RightInspector showing all footnotes with jump-to-reference

15. Create a citation registry system:
    - `.studio/citations.yaml` stores structured citations
    - Rust commands: `read_citations`, `write_citation`, `delete_citation`
    - `@` trigger in editor opens citation picker (like slash commands)
    - Support citation styles: APA, MLA, Chicago (simplified)
    - Export formatted bibliography

16. Enhance QuranEmbed:
    - Copy verse button on hover (copies Arabic + Translation + reference)
    - Focus mode: clicking an embed adds a subtle glow and optional dimming of surrounding content
    - Add "Compare" variant that shows two verse translations side by side

### PRIORITY 5: Search & Discovery

17. Integrate `fuse.js` for fuzzy search across note names, content, and tags. Replace substring search in `SearchPane.tsx`. Highlight matched terms.

18. Implement search operators: `tag:sermon`, `path:notes/sermons`, `before:2026-01-01`, `after:`, `author:`.

19. Add saved searches to `.studio/settings.json` with UI in SearchPane. Allow pinning searches to sidebar.

20. Add tag autocomplete when typing `#` in the editor. Show existing tags from vault scan. Support nested tags (`#topic/sermon/jumuah`) in TagsPane.

### PRIORITY 6: Workspace & Multi-Pane

21. Implement a split-pane system:
    - Redesign workspace state to support recursive horizontal/vertical splits
    - Create `SplitPane.tsx` recursive component with resize handles
    - `Ctrl/Cmd+\` = split vertical, `Ctrl/Cmd+Shift+\` = split horizontal
    - Drag tab to edge of pane to create split (visual drop indicator)
    - Store split sizes in localStorage

22. Implement workspace sessions:
    - Save `.studio/workspace.json`: open tabs, active tab, sidebar state, inspector state, split layout
    - Restore on app launch
    - Support named workspace presets ("Study", "Writing", "Sermon Prep")

### PRIORITY 7: Desktop Shell

23. Update `tauri.conf.json`: window size 1400×900, min 900×600, title "SubmissionArchives Studio".

24. Build native application menu (File, Edit, View) with keyboard accelerators. Emit events to frontend. Handle: New Note, Open Archive, Toggle Sidebar, Toggle Inspector, Mode switches, Command Palette, Quick Switcher.

25. Add system tray: show/hide, new note, quit. Minimize-to-tray on close (configurable in settings).

26. Implement portable mode: detect `.studio` folder next to executable, auto-open that archive.

27. Configure Tauri auto-updater with placeholder endpoint.

### PRIORITY 8: Data Integrity & Export

28. Make `write_note` atomic in Rust: write to temp file → fsync → rename. Add crash recovery buffer that writes on every editor update (not debounced).

29. Create vault health check Rust module: scan for broken wiki links, orphaned attachments, frontmatter errors, empty notes. Wire to command palette action.

30. Add export system:
    - Export to PDF: use webview.print() or headless approach
    - Export to HTML: self-contained with inline CSS
    - Export to DOCX: via pandoc integration or docx-rs
    - UI in NoteMenu as "Export as..." submenu

### PRIORITY 9: Theming

31. Implement light theme ("Reading Room"):
    - Sepia/warm beige background (#F5F1E8), dark brown text (#2C2416)
    - Add theme toggle in Settings: Dark / Light / System
    - Persist in settings.json
    - Apply via data-theme attribute
    - Adjust Quran embed contrast for light mode

32. Accessibility:
    - aria-label all icon-only buttons
    - focus trapping in modals
    - reduced-motion media query
    - editor font size control (12px–24px)

## CONSTRAINTS

- Stay 100% offline. No network calls, no cloud APIs, no telemetry.
- No new heavy dependencies without justification. Prefer zero-dependency solutions.
- Maintain the existing Rust command signatures where possible. Add new commands as needed.
- All markdown must remain portable standard Markdown with custom directives (::: quran, ::: arabic, ::: callout).
- The Quran CSV data stays bundled in Tauri assets. No external Quran API calls.
- Keep the "Midnight Vault" dark theme as default. Light theme is additive.
- Maintain backward compatibility with existing .studio/ folder structure.

## OUTPUT FORMAT

For each file you modify or create, provide:
1. The complete file path
2. The complete file contents (no omissions, no "...")
3. A brief explanation of what changed and why

Start with the highest priority items and work down. If a task requires changes across multiple files, implement them together in a logical group.
```

---

*End of Improvement Plan*
