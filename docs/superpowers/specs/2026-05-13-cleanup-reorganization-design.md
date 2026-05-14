# Cleanup & Reorganization Design

**Date:** 2026-05-13
**Scope:** Local changes only, no commits

---

## Goals

- Remove junk files and dead code
- Fix naming inconsistencies in `public/`
- Organize `scripts/` by purpose
- Move misplaced component to its correct location

---

## Section 1: Delete Junk

| Action | Target |
|--------|--------|
| Delete directory | `src/archive/` |
| Delete directory | `src/app/media/What_Is_Life_All_About.bak/` |
| Delete directory | `src/app/media/Who_Is_GOD.bak/` |
| Delete directory | `scratch/` |
| Move file | `speaker_analysis.json` (root) → `scripts/utils/speaker_analysis.json` |

---

## Section 2: Fix Casing in `public/`

| Action | From | To |
|--------|------|----|
| Rename folder | `public/Audios/` | `public/audios/` |
| Rename folder | `public/Videos/` | `public/videos/` |
| Update string refs | `"/Audios/"` | `"/audios/"` in all `.ts`/`.tsx` files |
| Update string refs | `"/Videos/"` | `"/videos/"` in all `.ts`/`.tsx` files |

---

## Section 3: Reorganize `scripts/`

Split 18 flat scripts into four subdirectories. Keep `scripts/README.md` at the top level.

| Folder | Scripts |
|--------|---------|
| `scripts/generate/` | `build-search-index.ts`, `generate_mega_indices.ts`, `generate_other_index.ts`, `generate_appendices_index.ts`, `generate_video_search_index.ts`, `generateMediaDurations.ts` |
| `scripts/process/` | `process-quran-studies.ts`, `process-messenger-audios.ts`, `vtt-to-json-converter.ts`, `extract-notes.ts`, `ocr-other-books.ts`, `organize-videos.ts`, `create-quran-studies-folders.ts` |
| `scripts/upload/` | `upload-quran-study-transcripts.ts` |
| `scripts/utils/` | `analyze-speakers.ts`, `speaker_analysis.json`, `format_json.js`, `clean-search-index.ts` |

Update `package.json`:
- `prebuild`: `tsx scripts/build-search-index.ts` → `tsx scripts/generate/build-search-index.ts`
- `build:search`: same update

---

## Section 4: Fix `src/components/archive/`

| Action | From | To |
|--------|------|----|
| Move file | `src/components/archive/SharedPlayer.tsx` | `src/components/player/SharedPlayer.tsx` |
| Delete directory | `src/components/archive/` | (empty after move) |
| Update imports | `@/components/archive/SharedPlayer` | `@/components/player/SharedPlayer` |

---

## Out of Scope

- Merging `src/app/components/` and `src/components/` (deferred, higher risk)
- Committing any changes (all local for now)
