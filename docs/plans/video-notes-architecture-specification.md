# Architecture & Implementation Specification: Video & Media Notes in SA Studio

> **Target Environment:** `studio/` (React 19 + TypeScript + Vite + Tailwind CSS + TipTap/ProseMirror + Tauri v2 + Rust Core)  
> **Target Audience:** Autonomous Coding Agent / LLM Engineer  
> **Status:** Specification Ready for Autonomous Execution

---

## 1. Executive Summary & User Experience

### 1.1 Goal
Provide a scholarly **Video & Media Notes** companion inside SA Studio that enables researchers to watch or listen to preserved archival lectures (Friday sermons, conference speeches, Quran studies, debates) while drafting notes, inserting formatted academic blockquote citations, and seeking media bidirectionally with timestamped deep links.

### 1.2 UX Flow
1. **Dock & Trigger**:
   - In the **Right Inspector** panel, user clicks the **Media Notes** tab (`VideoCamera` icon, shortcut `Ctrl+Shift+M`).
   - The Right Inspector expands adaptively from standard width (`280px`) to media width (`440px`–`480px`), with free horizontal resize drag handles.
2. **Media Selection**:
   - User searches across 300+ indexed audio/video records via fuzzy auto-complete (or pastes a Submission Archives / YouTube URL).
   - If the active note's YAML frontmatter contains a `media` field, that lecture and its last played timestamp load automatically on file open.
3. **Playback & Teleprompter**:
   - The embedded player plays the native video/audio stream (defaulting to Submission Archives local/remote streams with a YouTube toggle).
   - Below the player, a synchronized chapter timeline and scrolling transcript teleprompter highlight the active speech cue in real time.
4. **Citation & Bidirectional Deep-Linking**:
   - User clicks the **Quote** icon `Quotes` next to any transcript cue (or presses `Ctrl+Shift+Q` for active cue).
   - TipTap inserts an academic blockquote at cursor:
     ```markdown
     > "The body you see in the mirror is just a garment. The real person is the soul..."
     > — *Dr. Rashad Khalifa, [01:39](sa://media/video-program/what-is-life-all-about?t=99)*
     ```
   - In the editor, clicking any `[MM:SS]` timestamp deep-link immediately seeks the right-side media player to that second.

---

## 2. File Hierarchy & Architecture

```
studio/src/
├── components/
│   ├── RightInspector.tsx                   # [MODIFY] Add 'media' tab and adaptive width trigger
│   ├── media/
│   │   ├── MediaNotesPanel.tsx              # [NEW] Main container for video notes tab
│   │   ├── MediaSearchSelector.tsx          # [NEW] Fuzzy lecture search & URL parser
│   │   ├── GoldenVideoPlayer.tsx            # [NEW] HTML5 Video/Audio player + YouTube fallback
│   │   ├── TranscriptTeleprompter.tsx       # [NEW] Auto-scrolling live transcript with quote actions
│   │   └── ChapterTimelineStrip.tsx         # [NEW] Clickable chapter marker pills
│   └── extensions/
│       └── MediaTimestampExtension.ts       # [NEW] TipTap extension for interactive [MM:SS] badges
├── lib/
│   ├── mediaCatalog.ts                      # [NEW] Accessor for videos.json & audios.json catalog
│   ├── mediaBus.ts                          # [NEW] Lightweight event bus for seek & citation events
│   └── ipc.ts                               # [MODIFY] Add Tauri / Web mock IPC commands for media
└── App.tsx                                  # [MODIFY] Pass active note frontmatter & editor ref
```

---

## 3. Data Contracts & Interfaces

### 3.1 `studio/src/lib/mediaCatalog.ts`
```typescript
export type MediaType = 'video-program' | 'quran-study' | 'messenger-audio';

export interface MediaChapter {
  id: number;
  startTime: number; // Seconds (e.g. 64.11)
  endTime?: number;
  title: string;
  speaker?: string;
}

export interface TranscriptCue {
  id: number;
  startTime: number; // Seconds
  endTime: number;
  text: string;
  speaker?: string;
}

export interface MediaItem {
  id: string; // e.g. "video-program/what-is-life-all-about"
  title: string;
  displayTitle: string;
  type: MediaType;
  author: string;
  date?: string;
  duration?: string; // "11:47"
  durationSeconds?: number;
  youtubeId?: string;
  youtubeUrl?: string;
  thumbnail?: string;
  streamUrl?: string; // Direct MP4/MP3 or local tauri:// asset
  description?: string;
  chapters: MediaChapter[];
  cues?: TranscriptCue[];
}
```

### 3.2 Note YAML Frontmatter Binding
```yaml
---
title: "Nature of the Soul Exegesis"
media: "video-program/what-is-life-all-about"
media_timestamp: 99
tags:
  - theology
  - soul
---
```

---

## 4. Component Implementation Specifications

### 4.1 `MediaSearchSelector.tsx`
- **Fuzzy Search**: Loads indexed catalog from `mediaCatalog.ts`.
- **Match Queries**: Matches `title`, `author`, `speaker`, `id`, or date.
- **URL Handling**: Accepts:
  - `https://submissionarchives.com/media/video-program/...`
  - `https://www.youtube.com/watch?v=tNqQJR5LyXo`
  - Raw ID (e.g., `what-is-life-all-about` or `QS-01`)
- **Quick Recents**: Shows recently accessed media items for fast switching.

### 4.2 `GoldenVideoPlayer.tsx`
- **Dual-Engine Player**:
  - **Engine A (Native HTML5 Video/Audio)**: Primary engine. Uses HTML5 `<video>` / `<audio>` for smooth rendering, custom playback rates (`0.75x`, `1.0x`, `1.25x`, `1.5x`, `2.0x`), and frame-accurate seeking.
  - **Engine B (YouTube IFrame API)**: Embedded iframe when user toggles "Use YouTube Stream" or when offline local file is unavailable.
- **Synchronized Time Broadcast**:
  - Emits `timeupdate` events every `250ms` on `mediaBus` (`mediaBus.emit('time_update', currentTime)`).
- **Controls**:
  - Play/Pause toggle (spacebar when player is focused).
  - Step backward/forward 5 seconds (`J` / `L` or on-screen buttons).
  - "Insert Current Timestamp" button (`Ctrl+Shift+T`).

### 4.3 `TranscriptTeleprompter.tsx`
- **Virtual Scrolling**: Renders list of cues efficiently.
- **Active Highlight**: The cue where `cue.startTime <= currentTime && currentTime < cue.endTime` receives an active accent highlight (`border-l-2 border-ed-accent bg-ed-accent/10`).
- **Auto-Scroll Toggle**: Smoothly scrolls the active cue into view (with a button to lock/unlock auto-scroll if the user wants to browse manually).
- **Actions per Cue**:
  - **Click Timestamp**: Jumps player to `cue.startTime`.
  - **Quote Button (`Quotes` icon)**: Triggers blockquote insertion into the active editor.
  - **Copy Button**: Copies raw cue text to clipboard.

### 4.4 `ChapterTimelineStrip.tsx`
- Horizontal scrollable strip of chapter badges.
- Displays formatted start time (e.g., `01:04`) and chapter title (`The Biggest Problem`).
- Active chapter is highlighted with `bg-ed-accent text-white`.
- Clicking a chapter badge seeks player to `chapter.startTime`.

---

## 5. TipTap Editor Integration

### 5.1 `MediaTimestampExtension.ts`
Create a TipTap mark / inline node that parses and renders timestamps:
- **Input Rule**: Matches `\[(\d{1,2}:\d{2}(?::\d{2})?)\]\((sa:\/\/media\/[^)]+|#t=\d+)\)` or standard `[MM:SS]` links.
- **Rendered Node View**:
  ```tsx
  <span 
    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-xs font-semibold bg-ed-accent/15 text-ed-accent hover:bg-ed-accent hover:text-white cursor-pointer transition-colors"
    onClick={() => mediaBus.emit('seek_to', targetSeconds)}
    title={`Jump video to ${timestamp}`}
  >
    <Play className="w-2.5 h-2.5 fill-current" />
    {timestamp}
  </span>
  ```

### 5.2 Blockquote Insertion Utility (`studio/src/lib/mediaBus.ts`)
```typescript
export function insertMediaQuote(editor: Editor, item: MediaItem, cue: TranscriptCue) {
  const formattedTime = formatSeconds(cue.startTime);
  const deepLink = `sa://media/${item.id}?t=${Math.floor(cue.startTime)}`;
  const speaker = cue.speaker || item.author || 'Dr. Rashad Khalifa';

  // Academic Blockquote Schema
  const quoteMarkdown = `> "${cue.text.trim()}"\n> — *${speaker}, [${formattedTime}](${deepLink})*\n\n`;

  editor.commands.insertContent(quoteMarkdown);
  editor.commands.focus();
}
```

---

## 6. Event Bus & State Synchronization

Create `studio/src/lib/mediaBus.ts`:
```typescript
type MediaEventType = 
  | 'seek_to'          // Payload: number (seconds)
  | 'time_update'      // Payload: number (seconds)
  | 'play_pause'       // Payload: void
  | 'load_media'       // Payload: string (mediaId)
  | 'insert_citation'; // Payload: { cue: TranscriptCue }

class MediaEventBus {
  private listeners: Map<string, Set<(payload: any) => void>> = new Map();

  on(event: MediaEventType, handler: (payload: any) => void) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: MediaEventType, handler: (payload: any) => void) {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: MediaEventType, payload?: any) {
    this.listeners.get(event)?.forEach(fn => fn(payload));
  }
}

export const mediaBus = new MediaEventBus();
```

---

## 7. Right Inspector Adaptive Layout

In `studio/src/components/RightInspector.tsx`:
- Add `'media'` to `InspectorTab`:
  ```typescript
  type InspectorTab = 'outline' | 'backlinks' | 'footnotes' | 'media' | 'info';
  ```
- When `activeTab === 'media'`, dynamically adjust container styling or notify parent `App.tsx` to expand the right sidebar width from `280px` to `440px`.
- Provide smooth CSS transition: `transition: width 240ms cubic-bezier(0.2, 0, 0, 1)`.

---

## 8. Verification & Test Plan

1. **Catalog Loading**:
   - Verify `mediaCatalog.ts` loads and parses all `data/catalog/videos.json` and `data/catalog/audios.json` items without runtime crashes.
2. **Playback & Transcript Sync**:
   - Select `What is Life All About?`. Verify video starts, timeline advances, and transcript cue highlights in sync.
3. **Blockquote Citation**:
   - Click quote on cue at `01:39`. Verify clean Markdown blockquote is inserted into TipTap editor with speaker and `[01:39]` link.
4. **Bidirectional Deep-Link**:
   - In editor, click `[01:39]` link. Verify player jumps directly to second 99.
5. **Frontmatter Persistence**:
   - Save note with `media: "video-program/what-is-life-all-about"`. Reopen note and verify media loads automatically.
6. **Build Integrity**:
   - Execute `npm run build` in `studio/` &rarr; 0 TypeScript / bundling errors.
   - Execute `npm run typecheck` & `npm run test:unit` in root workspace &rarr; 100% pass.
