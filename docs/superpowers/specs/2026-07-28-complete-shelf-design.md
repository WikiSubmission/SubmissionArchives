# The Complete Shelf — design spec

Date: 2026-07-28

## Summary

Recreate Mint's "The Complete Shelf" experience (https://play.mint.gg/complete-shelf, https://github.com/mintdotgg/mint-playground/tree/main/experiences/complete-shelf) as an original Three.js build for this project. Replaces the current 2D thumbnail grid in the "Books & Publications" section of `/written` with a warm editorial 3D shelf, built on the site's real 13 books (real cover art, titles, authors, PDF links), not a generated asset pack. The "Submitters Perspectives" newsletter grid on the same page is untouched.

## Context / constraints discovered

- `/written` (`src/app/written/page.tsx`) is a server component. It filters `public/data/generated_indices/BOOKS_LIST.json` for `category === 'Books'` (currently 13 entries), each with `id`, `title`, `author`, `thumbnailOverride`, `pdfLink`.
- Real cover images already exist at `public/content/written/books/thumbnails/*.jpg|png` for all 13 books.
- The project has no Three.js dependency yet.
- Mint MCP (`mcp.mint.gg`) was not connected during design. It requires OAuth via `claude mcp add --transport http mint https://mcp.mint.gg/mcp` followed by `/mcp` in a Claude Code session, and reconnecting. If it becomes available before implementation, it may be used to generate the walnut shelf/environment material; if not, a procedural canvas/noise-based wood material is the baseline and Mint's version is a drop-in swap behind the same material interface later. Book cover art itself never depends on Mint — it always comes from the site's real thumbnails.
- The site has an existing light/dark theme via `--ed-*` CSS custom properties in `src/app/globals.css`. The 3D shelf must track this toggle.
- Existing pattern for heavy client-side interactive pages: a server `page.tsx` passes typed props into a `'use client'` component (see `src/app/quran/QuranPageClient.tsx`).

## Decisions from brainstorming

1. **Mint MCP**: proceed without blocking. Use it for shelf/environment materials only if connected by implementation time; procedural materials otherwise.
2. **Route**: replace the existing grid section in place on `/written` (no new route).
3. **Framework**: React Three Fiber + drei.
4. **Inspect UI**: HTML overlay panel (title, author, "Read" button to `/library/[id]`) alongside the 3D orbit view.
5. **Fallback policy**: always render 3D — no soft fallback for `prefers-reduced-motion` or low-end-device heuristics. A hard-failure safety net still exists for genuine WebGL-unavailable environments (see Error handling).
6. **Mobile**: full touch support at parity with desktop (drag to browse, one-finger orbit + pinch zoom to inspect).
7. **Theming**: shelf adapts to the site's light/dark toggle.

## Architecture

- `src/app/written/page.tsx` — unchanged data-fetching logic; maps the 13 `Books`-category entries to a `ShelfBook[]` and renders `<CompleteShelf books={shelfBooks} />` in place of the current grid markup. Newsletter section untouched.
- `src/components/written/CompleteShelf.tsx` — `'use client'`; loaded via `next/dynamic({ ssr: false })` from the page (Three.js requires `window`/WebGL and must never attempt SSR). Owns the R3F `<Canvas>`, top-level state (`shelfPosition`, `selectedIndex`), and the palette switch.
- `src/components/written/Shelf.tsx` — walnut shelf geometry, lighting rig, cream backdrop.
- `src/components/written/BookMesh.tsx` — one book: box geometry with per-book proportions, real cover texture on the front face, canvas-drawn clothbound spine (title/author/foil rule), muted cloth color on remaining faces.
- `src/components/written/ShelfOverlay.tsx` — HTML overlay: prev/next buttons, per-book position markers, "back to shelf" control.
- `src/components/written/InspectPanel.tsx` — HTML overlay for the selected book: title, author, "Read" link.
- `src/components/written/shelfTheme.ts` — light/dark palette constants mirrored from `--ed-*` tokens, plus the fixed muted clothbound spine-color set.
- `src/lib/shelfBookLayout.ts` — pure functions: deterministic per-book hash → height/thickness/spine-color, and cover-load-failure fallback logic. Unit-tested, no React/Three dependency.

## Data flow

No new data source. `ShelfBook` = `{ id, title, author, coverUrl, libraryHref }`, derived server-side exactly as the current grid does (via `getPublicAssetUrl`). Per-book visual variation (height, thickness, spine color) is computed from a deterministic hash of `book.id` — never `Math.random()` at render time, avoiding hydration mismatches and keeping the shelf stable across reloads.

## Interaction model

Faithful to a physical bookshelf: browsing shows spines; covers are revealed on selection.

- **Browse mode**: drag (pointer), mouse wheel, and arrow keys all drive one continuous `shelfPosition`, clamped to the book range. Position markers allow jumping directly to any book.
- **Select**: clicking/tapping a spine pulls that book forward and rotates it to face the camera, entering inspect mode.
- **Inspect mode**: drei `OrbitControls` constrained to a limited polar/azimuth range and clamped zoom distance, scoped around the selected book's local origin.
- **Exit**: a visible "back to shelf" button and the `Escape` key return to browse mode, animating the camera back.
- **Touch**: pointer events unify mouse/touch for browse-mode dragging; drei `OrbitControls` provides one-finger orbit and two-finger zoom natively for inspect mode.

## Look

- Palette: light/dark variants mirrored from this site's `--ed-*` design tokens (cream background, muted foreground, etc.), switching with the existing site theme toggle.
- Walnut shelf material: procedural canvas/noise-based wood grain by default; replaceable by a Mint-generated material behind the same interface if Mint is connected later.
- Typography: spine text is canvas-rendered in a serif face; the HTML inspect panel reuses the site's existing `font-serif`/`font-display` classes.
- Clothbound spine colors: a small fixed muted palette (charcoal, walnut brown, cream, deep green, oxblood), assigned deterministically per book alongside its proportions.

## Error handling

- A cover image that fails to load falls back to a canvas-drawn placeholder (title text over a muted color) — never a broken texture.
- The `<Canvas>` tree is wrapped in an error boundary. If WebGL is genuinely unavailable, it renders a plain text list of the 13 books linking directly to `/library/[id]`, instead of a blank or crashed canvas. This is a hard-failure safety net only — it does not trigger for reduced-motion preference or general low-end-device heuristics, per decision 5 above.

## Testing

- Playwright e2e, matching this repo's existing journey-test pattern: page loads and canvas mounts; arrow-key navigation changes selection; clicking a book opens the inspect panel with correct title/author/Read `href`; Escape/back returns to browse.
- Unit tests for `shelfBookLayout.ts`: deterministic per-book hash output, and the cover-load-failure fallback path.

## Out of scope

- No changes to the "Submitters Perspectives" newsletter section.
- No new API routes or data sources — the 13 existing `Books`-category entries are the complete shelf contents.
- No Mint-generated book cover art — cover art is always the site's real thumbnails.
