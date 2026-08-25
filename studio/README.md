# SubmissionArchives Studio

A privacy-first, 100% offline desktop application and scientific workstation for personal note-taking, archival research, and Islamic scholarly writing. Built as a local-first companion to the [SubmissionArchives](https://wikisubmission.org) ecosystem.

---

## Key Highlights

- **100% Offline & Local-First:** All notes, research corpora, media notes, and calculations reside entirely on your local filesystem as portable Markdown (`.md`) and asset files. No accounts, no cloud sync lock-in, no telemetry.
- **Native Performance:** Powered by **Tauri v2** with a Rust backend handling high-speed corpus indexing, file system operations, and heavy arithmetic off the UI thread.
- **Scholarly Quran Embeds (`/quran`):** Instant bilingual (Uthmani Arabic & English translation) verse cards embedded directly into prose using portable directives (`::: quran {verses="..."} :::`).
- **Integrated QuranCode Research Suite:** Enterprise-grade corpus analysis surface featuring multi-mode letter/word frequency statistics, gematria/abjad calculations, 14-modifier formula engines, root indexing (1,782 roots), and Levenshtein similarity search with reproducible citations.
- **Multi-Modal Prose Editor:** Fluidly switch between **Write** (keyboard-first Markdown), **Blocks** (drag-and-drop block manipulation), and **Page** (paginated WYSIWYG manuscript sheet).

---

## Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Desktop Runtime** | [Tauri v2](https://v2.tauri.app/) (Rust 2021 edition) |
| **Frontend Framework** | React 19 + TypeScript (bundled with [Vite 7](https://vitejs.dev/)) |
| **Styling & Design System** | [Tailwind CSS v4](https://tailwindcss.com/) with archival CSS token variables |
| **Rich Text & Block Editor** | [TipTap v3](https://tiptap.dev/) / ProseMirror with custom React NodeViews & Markdown serializers |
| **Typography (Offline Bundled)** | *DM Sans* (Interface), *Source Serif 4* (Headings), *Newsreader* (Body Prose), *JetBrains Mono* (Technical/Data), *Amiri* (Arabic Script) |
| **Icons & Motion** | [Phosphor Icons](https://phosphoricons.com/), [Framer Motion](https://www.framer.com/motion/) |

---

## Modules & Capabilities

### 1. The Editor
- **Multi-Modal Views:** `Write`, `Blocks`, and `Page` modes tailored for different writing workflows.
- **Slash Commands (`/`):** Rapid block insertion for headings, quotes, callouts, tables, dividers, media, and Quranic citations.
- **Bidirectional Links & Backlinks:** Obsidian-compatible `[[WikiLinks]]` with real-time backlink indexing and unlinked mention discovery.
- **YAML Frontmatter:** Native structured metadata inspector with tag filtering and key-value attributes.
- **Recomputable Findings (`::: qcvalue :::`):** Research findings cite their exact computational parameters and automatically verify reproducibility upon note reload.

### 2. QuranCode Research Surface
- **Multi-Text Modes:** Compare counts side-by-side across Uthmani (standard), Simplified 29, Cleaned 28, and historical reference fixtures with transparent gap indicators.
- **Scientific Gematria & Calculation Engine:** Abjad systems (Standard 28, 29-letter, Historical) paired with customizable letter/word/verse/chapter position and distance modifiers.
- **Corpus Query Engine:**
  - **Text:** Exact or proximity Arabic search with word boundary and positioning filters.
  - **Numbers:** Find verses matching exact target values, letter counts, or word counts.
  - **Similar:** Ranked Levenshtein similarity over the folded letter stream.
  - **Roots:** Full dictionary of 1,782 roots covering the entire corpus.
- **Letter Frequency Analysis:** Complete tabular frequency breakdown, sum of positions ($\Sigma\text{Pos}$), and sum of consecutive distances ($\Sigma\Delta$).

### 3. Media Notes, PDFs & Canvas
- **Media Notes:** Local audio/video playback with timestamped note synchronization and transcript teleprompter.
- **PDF Viewer & Annotations:** Deep PDF reading and quotation tools directly within your archival workspace.
- **Graph View:** Interactive network graph exploring note connections, tags, and citation clusters.

---

## Getting Started

### Prerequisites

1. **Node.js** (v20 or newer) & `npm`
2. **Rust** & `cargo` (Install via [rustup.rs](https://rustup.rs/))
3. **Platform Build Tools** (See [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/)):
   - **Windows:** Microsoft C++ Build Tools & WebView2
   - **macOS:** Xcode Command Line Tools
   - **Linux:** `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/SubmissionArchives.git
cd SubmissionArchives/studio

# Install frontend dependencies
npm install
```

### Local Development

To run the desktop application with hot-reloading for both Rust and React:

```bash
npm run tauri dev
```

To run only the frontend Vite development server in a browser:

```bash
npm run dev
```

> **Note:** Corpus counting and local filesystem IPC commands require the desktop Tauri build (`npm run tauri dev`).

### Building for Production

Compile optimized production binaries and installers:

```bash
# Validate TypeScript types and bundle frontend
npm run build

# Package native platform desktop bundle (MSI/.exe, DMG, AppImage/deb)
npm run tauri build
```

---

## Project Structure

```
studio/
├── src/
│   ├── assets/              # Offline fonts, icons, and bundled media
│   ├── components/
│   │   ├── extensions/      # Custom TipTap nodes (Quran embed, QuranCode findings)
│   │   ├── qurancode/       # QuranCode research workstation components
│   │   ├── workspace/       # Pane layouts, explorer, and split views
│   │   ├── Editor.tsx       # Multi-modal TipTap/ProseMirror editor
│   │   └── ...              # Modals, toolbars, and inspector panels
│   ├── hooks/               # React hooks (useQuranCode, useArchive, useAppearance)
│   ├── lib/                 # Core algorithms, IPC wrappers, formatting, and bus events
│   ├── App.css              # Archival design tokens and Tailwind CSS rules
│   └── App.tsx              # Root application shell and global keyboard shortcuts
├── src-tauri/
│   ├── assets/              # Bundled datasets (Quranic text, text modes, value systems)
│   ├── src/                 # Rust core (corpus analysis, search indexing, file I/O)
│   └── tauri.conf.json      # Tauri application configuration and permissions
├── package.json
└── README.md
```

---

## License

Private repository. All rights reserved. Part of the [SubmissionArchives](https://wikisubmission.org) project.
