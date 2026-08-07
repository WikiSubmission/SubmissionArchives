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
Because users have different preferences, the Tiptap editor dynamically toggles between three visual modes via a React Context/State:
1. **Obsidian Mode:** Markdown-focused, block-based view optimized for keyboard-centric users.
2. **Cabinet Mode:** A drag-and-drop interface where each paragraph is an easily manipulable block (using Tiptap's DragHandle extension).
3. **Docs Mode:** A traditional, continuous WYSIWYG editor focused on uninterrupted prose.

### B. The Quran Embed (Tiptap Node View)
- Triggered via a slash command (e.g., `/quran 1:1, 2:3`).
- Spawns a floating React menu querying the Rust backend.
- Renders as a custom React NodeView inside the editor showing Arabic/English.
- Serializes to plain markdown using custom remark directives (e.g., `::: quran {verses="1:1"} :::`) so the file remains portable.

### C. Data Source
The static database (`ws_quran_text_rows.csv` from the 1992 translation) is bundled directly into the Tauri app's assets.

## 5. Development Phases Roadmap

### Phase 1: Scaffolding (COMPLETED)
- ✅ Initialized `studio/` directory with Tauri + React + Vite.
- ✅ Configured Tailwind CSS v4.
- ✅ Mounted the headless Tiptap editor.
- ✅ Built the mock mode-toggle toolbar (Obsidian/Cabinet/Docs).
- ✅ Scaffolded the `QuranEmbed` React NodeView placeholder in Tiptap.

### Phase 2: Rust Backend & Slash Commands (CURRENT/NEXT)
- [ ] Write a Rust function in `src-tauri` to read and index the bundled CSV file.
- [ ] Create a Tauri IPC command (e.g., `search_verses`) that React can call.
- [ ] Implement the Tiptap Slash Command extension to trigger a floating popup menu when `/quran` is typed.
- [ ] Wire the popup menu to the Rust backend so it fetches verses instantly.

### Phase 3: File System & Vault Management
- [ ] Build the "Welcome" screen allowing the user to select an "Archive" folder on their hard drive.
- [ ] Implement Rust `fs` commands to list `.md` files and folders in the sidebar.
- [ ] Build the Markdown serializer/parser to ensure the `QuranEmbed` blocks save properly to the `.md` files on disk.

### Phase 4: Polish & Advanced PKM Features
- [ ] Implement bidirectional linking (`[[link]]`).
- [ ] Add YAML frontmatter support.
- [ ] Implement advanced UI polish and animations using the design inspirations provided above.
