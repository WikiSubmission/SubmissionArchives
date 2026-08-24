# Submission Archives Studio

Submission Archives Studio is a 100% offline, privacy-first desktop application for note-taking, journaling, and research within the Submission Archives ecosystem.

## Role in Submission Archives

Studio serves as the offline desktop companion to the primary Submission Archives repository and web platform. While the web archive provides public search, reading, and listening interfaces, Studio provides a local environment for personal study and scholarly writing:

- **Offline Canonical Data**: Direct access to local canonical Quranic text and translations without cloud dependencies or network requests.
- **Ecosystem Alignment**: Uses Submission Archives design tokens, typography, and citation conventions.
- **Local Data Ownership**: Notes and metadata are stored directly as standard Markdown (`.md`) files in a user-selected local directory.

## Technology Stack

- **Desktop Framework**: [Tauri v2](https://v2.tauri.app/) (Rust backend for file system operations, indexing, and IPC)
- **Frontend**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Editor Engine**: [Tiptap](https://tiptap.dev/) (ProseMirror-based headless block editor)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Phosphor Icons](https://phosphoricons.com/)

## Features

- **Bilingual Quran Embeds**: Instant verse queries via `/quran <reference>` slash command, rendering side-by-side Arabic and English translations.
- **Multi-Modal Editing**: Toggle between keyboard-first Markdown (Write), draggable block layout (Blocks), and continuous document layout (Page).
- **Knowledge Management**: Bidirectional wiki linking (`[[Note]]`), backlinks, tag explorer, full-text search, and graph visualization.
- **Local Storage & History**: Local folder vault management, automatic snapshot-based version history, and soft deletion.

## Development and Running

### Prerequisites

- **Node.js**: Version 20 or newer
- **Rust**: Latest stable toolchain (required for desktop Tauri runs)
- Platform-specific Tauri prerequisites (see [Tauri Prerequisites Guide](https://v2.tauri.app/start/prerequisites/))

### Installation

From the `studio` directory:

```bash
npm install
```

### Running the Desktop App

To run the full Tauri desktop application with the Rust backend:

```bash
npm run tauri dev
```

### Running the Web Preview

To run the frontend UI in a standard browser (uses simulated browser-side IPC fallbacks):

```bash
npm run dev
```

### Production Build

To compile and package the desktop binary for your current platform:

```bash
npm run tauri build
```

To build only the frontend assets:

```bash
npm run build
```
