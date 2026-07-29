# Book 3D covers — design spec

Date: 2026-07-29

Status: supersedes `2026-07-28-complete-shelf-design.md` and its plan `2026-07-28-complete-shelf.md`. Those documents proposed a full React Three Fiber shelf-browsing experience for the same grid; that direction is dropped in favor of the lighter CSS-based treatment below. The old files are marked superseded rather than deleted.

## Summary

Replace the flat 2:3 cover images in the "Books & Publications" grid on `/written` (`src/app/written/page.tsx:71-99`) with book covers rendered as tilted 3D objects, inspired by the Stripe Press "living cover" look (two standalone Three.js prototypes reviewed during brainstorming) and a bare Vite prototype at `github.com/thebuggeddev/books` (also Three.js, no reusable React pattern). Neither reference is followed literally: this project's books have only a single front-cover thumbnail per title (no spine/back photography), and the grid holds 13 books at once rather than a single hero book, so the design substitutes procedural spine/edge faces and a static-tilt-plus-hover interaction built from CSS 3D transforms instead of WebGL.

The "Submitters Perspectives" newsletter grid on the same page, the homepage archive widget, and the `/library/[id]` detail page are all untouched.

## Context / constraints discovered

- `/written` (`src/app/written/page.tsx`) is a server component. It filters `public/data/generated_indices/BOOKS_LIST.json` for `category === 'Books'` (13 entries), each with `id`, `title`, `author`, `thumbnailOverride`, `pdfLink`.
- Real cover images exist at `public/content/written/books/thumbnails/*.jpg|png` for all 13 books. No back-cover or spine photography exists for any of them.
- The project has no Three.js/WebGL dependency, and none is being added. `framer-motion` is already a dependency and covers the animation needs here.
- `sharp` is already a dependency and already used for build-time image work (`scripts/generate/generate_book_thumbnails.mjs`).
- The site is a monochrome editorial theme via `--ed-*` custom properties in `src/app/globals.css`, with light/dark variants.
- `prefers-reduced-motion` is an established convention across the codebase (`Reveal.tsx`, `globals.css`, several home components) — new motion must follow the same pattern rather than introduce a new one.
- `src/components/home/Reveal.tsx` provides the existing scroll-triggered stagger entrance used elsewhere on the site.

## Decisions from brainstorming

1. **Scope**: `/written` archive grid only. Homepage widget and `/library/[id]` are out of scope.
2. **Missing spine/back assets**: build a real cuboid with procedural spine and top/bottom edge faces (color sampled from the cover, cloth-weave-style overlay, spine title text); front face uses the real cover image. No back face — the interaction never rotates far enough to need one.
3. **Interaction**: static resting tilt per book (not continuous auto-rotation). Hover/focus eases into a deeper angle that reveals more spine, then eases back. No idle animation loop once settled.
4. **Technology**: CSS 3D transforms (`perspective`, `transform-style: preserve-3d`, `rotateY`/`translateZ`) animated with Framer Motion. No Three.js, no new runtime dependency, no WebGL context per card.
5. **Spine color**: auto-extracted per book at build time from its cover thumbnail, not hand-picked or uniform.

## Architecture

- `src/app/written/page.tsx` — unchanged data-fetching logic; maps each `Books`-category entry plus its extracted spine color into a `Book3DCoverProps` and renders `<Book3DCover />` in place of the current flat `<Image>` block inside the existing grid `<Link>`. Newsletter section untouched.
- `src/components/written/Book3DCover.tsx` — `'use client'`. Renders the perspective container and the four-face cuboid (front, spine, top edge, bottom edge) for one book, and owns the hover/focus tilt animation via Framer Motion. Pure presentational component: takes `coverSrc`, `title`, `spineColor`, and renders no links itself (the parent `<Link>` in the grid stays the click target, matching current behavior).
- `src/components/written/bookSpineStyle.ts` — pure helper: derives spine gradient stops, edge-strip gradient, and a readable spine-text color from a base `spineColor`, so the color math is unit-testable without mounting React.
- `scripts/generate/extract-book-spine-colors.mjs` — new build script, same pattern as `generate_book_thumbnails.mjs`. Uses `sharp` to sample the dominant edge color of each book cover thumbnail. Writes `public/data/generated_indices/BOOK_SPINE_COLORS.json`, keyed by book `id`, as a `{ [id]: string /* hex */ }` map.

## Data flow

No new runtime data source. At build time, `extract-book-spine-colors.mjs` reads the same thumbnail files already used by the grid and writes the color map alongside the other generated indices. `written/page.tsx` reads `BOOK_SPINE_COLORS.json` the same way it already reads `BOOKS_LIST.json`, looks up each book's color by `id`, and falls back to a fixed neutral tone (sampled from `--ed-accent-soft`) if a book is missing from the map (e.g. a newly added book before the next build). No client-side color computation, no hydration risk.

## Visual design

- **Front face**: the existing cover `<Image>`, unchanged aspect ratio and `sizes`, positioned as the front `translateZ` face of the cuboid.
- **Spine face**: a narrow left-side face, width proportional to the card (not book-accurate thickness — there is no real thickness data, so a fixed visual proportion is used consistently across all 13). Background is a gradient from the extracted color, with a low-opacity repeating diagonal pattern standing in for cloth weave. Title text is set vertically (`writing-mode: vertical-rl`) in the site's existing serif/mono type, in a foil-like light or dark ink chosen for contrast against the spine color.
- **Top/bottom edges**: thin strips (a few px) using a cream `repeating-linear-gradient` echoing a compressed page stack, capping the cuboid so it doesn't read as a flat card with a fake shadow.
- **Ambient shadow**: a soft blurred ellipse beneath each book, present at rest, growing/softening slightly on hover to sell a lift.
- **Theming**: spine/edge colors are extracted once and don't change with the site's light/dark toggle (they're derived from the physical cover art, not the UI theme); the ambient shadow and any surrounding chrome use `--ed-*` tokens so the card sits correctly in both themes.

## Interaction model

- **Rest**: each card is statically tilted at `rotateY(-16deg) rotateX(2deg)` on mount — no idle loop, no auto-rotation.
- **Hover / focus-visible**: Framer Motion spring animates to a deeper `rotateY` (revealing more spine) plus a small lift (`translateY`/scale), matching keyboard focus to mouse hover so the effect isn't mouse-only.
- **Leave / blur**: springs back to the resting tilt.
- **Mount**: cards stagger in using the existing `Reveal` pattern/timing convention, not a new bespoke entrance.
- **prefers-reduced-motion**: the hover/focus spring is disabled; cards keep their static resting tilt with no transition, consistent with how `Reveal.tsx` and `globals.css` already gate motion.

## Error handling

- If a book's `id` is missing from `BOOK_SPINE_COLORS.json` (e.g. added after the last build), the card falls back to the fixed neutral spine tone rather than failing to render or showing an undefined color.
- If a cover image fails to load, the existing `<Image>` `alt`/broken-image behavior is unchanged; the 3D wrapper itself has no additional failure mode since it does no asset loading of its own.

## Testing

- Unit tests for `bookSpineStyle.ts`: given a base color, verify gradient stops and text-ink contrast selection are deterministic and produce valid CSS values across a range of light/dark/saturated input colors.
- Playwright e2e (matching this repo's existing journey-test pattern): `/written` loads with all 13 books rendered at their resting tilt; hovering/focusing a card visibly changes its transform; the card's `<Link>` still navigates to `/library/[id]` as before; a `prefers-reduced-motion` emulation run shows no transform transition on hover.

## Out of scope

- No changes to the "Submitters Perspectives" newsletter section, the homepage widget, or `/library/[id]`.
- No new runtime dependencies (no Three.js/WebGL).
- No back-cover face or book-accurate spine thickness (no source assets exist for either).
