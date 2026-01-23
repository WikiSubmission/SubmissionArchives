# Design Doc: Submission Clips (v2.0 - Physical Clips)

## 1. Executive Summary
A platform allowing users to snip audio/video clips from the archive that are **playable directly in Discord**.
*   **Core Architecture**: Client-Side processing (FFmpeg.wasm) -> Direct R2 Upload -> D1 Metadata.
*   **Key Feature**: Generates actual `.mp3`/`.mp4` files to satisfy Discord's inline player requirements.
*   **Cost Efficiency**: Zero server-side media processing; leverages user devices.

## 2. Technical Stack
*   **Frontend**: Next.js (App Router) on Cloudflare Pages.
*   **Processing**: `@ffmpeg/ffmpeg` (WASM) running in the browser.
*   **Storage**: Cloudflare R2 (`/media`, `/transcripts`, `/clips`).
*   **Database**: Cloudflare D1 (SQLite).
*   **Styling**: Tailwind CSS.

## 3. Data Architecture

### Database Schema (D1)
```sql
-- Source Media
CREATE TABLE media (
  id TEXT PRIMARY KEY,           -- e.g. "episode-001"
  title TEXT NOT NULL,
  r2_key TEXT NOT NULL,          -- "media/episode-001.mp3"
  transcript_key TEXT NOT NULL,  -- "transcripts/episode-001.vtt"
  duration INTEGER NOT NULL,
  type TEXT CHECK(type IN ('audio', 'video')) DEFAULT 'audio'
);

-- User Clips
CREATE TABLE clips (
  id TEXT PRIMARY KEY,           -- e.g. "a3k9m"
  media_id TEXT NOT NULL REFERENCES media(id),
  start_seconds INTEGER NOT NULL,
  end_seconds INTEGER NOT NULL,
  title TEXT,
  r2_key TEXT NOT NULL,          -- "clips/a3k9m.mp3"
  created_at INTEGER DEFAULT (unixepoch())
);
CREATE INDEX idx_clips_media ON clips(media_id);
```

### R2 Structure
*   `/media/*`: Read-Only source files.
*   `/transcripts/*`: Read-Only VTT source files.
*   `/clips/*`: User-generated clips (Write enabled via Signed URLs).

## 4. User Flows

### A. Creation Flow
1.  **Select**: User navigates to `/create` or clicks "Clip" on `/watch/[id]`.
2.  **Edit**: Player UI loads. User enters **Start** and **End** timestamps in text fields (e.g., `1:00` to `1:30`). Optional: A "Preview" button plays the selected range before processing.
3.  **Process**: User clicks "Create Clip".
    *   **Step 1 (Client)**: Browser fetches source byte-range (approximate).
    *   **Step 2 (Client)**: `ffmpeg.wasm` cuts the precise segment (re-encoding not always needed if using `-c copy`, but safer for browser playback to ensure headers are correct).
    *   **Step 3 (Client)**: Request Signed Upload URL from API.
    *   **Step 4 (Client)**: PUT file to R2.
    *   **Step 5 (Client)**: POST metadata to API.
4.  **Result**: User gets link `yoursite.com/c/a3k9m`.

### B. Viewing Flow (Discord/Socials)
1.  **Embed**: Discord bot crawls `yoursite.com/c/a3k9m`.
2.  **Metadata**: Server returns OG tags pointing to `r2.yoursite.com/clips/a3k9m.mp3`.
3.  **Playback**: Discord acts as a native player.

### C. Context Flow
1.  **Click-through**: User clicks title in Discord.
2.  **Landing**: Opens `/c/a3k9m` (Clip View).
3.  **Context**: "Watch Full Episode" button links to `/watch/episode-001?t=60`.

## 5. Risk Analysis & Mitigations

### A. The "VBR Byte Range" Issue
*   **Problem**: MP3s often use Variable Bit Rate (VBR). Calculating byte range (`offset = time * avg_bitrate`) is inaccurate. You might download the wrong chunk.
*   **Mitigation**:
    1.  **Generous Padding**: Download +/- 10% buffer around calculated range.
    2.  **Full Download Fallback**: If file < 50MB, just download the whole thing to memory.
    3.  **CBR Preference**: If possible, standardize source media to CBR (Constant Bit Rate).

### B. FFmpeg WASM Performance
*   **Issue**: The WASM binary is large (~25MB).
*   **Mitigation**:
    *   Load it lazily (don't block page load).
    *   Use **Cloudflare Cache** heavily for the WASM file.
    *   Restrict "Creation" to Desktop browsers initially (Mobile Safari creates memory issues with WASM).

### C. Security / Abuse
*   **Issue**: Public upload endpoint allows anyone to fill R2 bucket.
*   **Mitigation**:
    *   **Turnstile**: Add Cloudflare Turnstile (CAPTCHA) to the "Create" button.
    *   **Rate Limiting**: Limit 5 clips per IP per hour via Cloudflare WAF or KV.
    *   **Lifecycle**: Auto-delete clips older than 90 days checking for "last_accessed" (requires access logging) or just keep them (cheap).

## 6. Implementation Plan
1.  **Phase 1 (Data)**: Populate `media` table from R2 inventory.
2.  **Phase 2 (Core UI)**: Build Player with Range Slider (using `nouislider` or similar).
3.  **Phase 3 (Engine)**: Implement `ffmpeg.wasm` pipeline (Download -> Cut -> Upload).
4.  **Phase 4 (API)**: `/api/sign-upload` and OG Tag generation.
