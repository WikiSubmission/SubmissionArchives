# 🛠️ Maintenance Scripts

This directory contains critical scripts for building and maintaining the RK-Media platform.
**DO NOT DELETE** the following files, as they are required for deployment and data updates.

## 🚨 Critical Scripts

### 1. `build-search-index.ts`
*   **Purpose**: Generates the optimized search index for the static site.
*   **Usage**: Runs automatically during `npm run build`.
*   **Command**: `npm run build:search`
*   **Dependency**: Required for Vercel deployment.

### 2. `generate_mega_indices.ts`
*   **Purpose**: Scans R2 storage to generate the master JSON indices for Sermons, Video Programs, and Audio.
*   **Usage**: Run manually when new media is uploaded to R2.
*   **Command**: `npx tsx scripts/generate_mega_indices.ts`

### 3. `generate_other_index.ts`
*   **Purpose**: Parses PDF files in `public/other/` to generate the search index for "Other Resources" (Books).
*   **Usage**: Run manually when new PDFs are added.
*   **Command**: `npx tsx scripts/generate_other_index.ts`
