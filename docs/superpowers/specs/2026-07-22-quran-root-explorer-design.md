# Root Explorer Design

**Date:** 2026-07-22
**Scope:** New route `/quran/roots` — 3D constellation graph of Arabic roots and their derived words

---

## Purpose

A navigable 3D graph mapping Quranic Arabic roots to the words derived from them, for the pedagogical benefit of visitors learning Quranic Arabic. Root nodes connect to every word derived from that root; words in the same verse connect to each other in sequence. Scoped to chapters 1-10 for the first version; the data pipeline and renderer are built so widening to the full corpus later is a matter of re-running the generator and lifting the chapter filter, not a rewrite.

## Brand alignment

Submission Archives (`PRODUCT.md`, `DESIGN.md`) is documentary, restrained, and explicitly rejects neon/glass/spectacle aesthetics (`MOTION_INTENSITY: 4`, "Never add unrelated purple, cyan, or neon gradients"). This feature is reframed accordingly: not a sci-fi starfield, but an **illuminated star-chart / genealogical manuscript diagram** — ink linework on the archive's warm paper background, a single accent color, calm motion that only ever explains a state change (camera move, layout switch, selection), never plays for its own sake.

| Original brainstorm concept | Archive-aligned treatment |
|---|---|
| Neon glow / bloom on nodes | `--ed-shadow-glow` (already a subtle accent-tinted soft shadow token) |
| Rainbow verse coloring | 4-5 muted earthy tints derived from `--ed-accent-soft` / `--ed-fg-muted` |
| Twinkling starfield background | Faint, mostly-static dot grid |
| Auto-rotating camera | None — camera only moves on user input |
| Space blues/purples | `--ed-bg`, `--ed-fg`, `--ed-accent` (existing tokens only) |

## Data

Source: `ws_quran_word_by_word_rows.csv` (79,325 words) and `ws_quran_text_rows.csv` (6,364 verses), copied into the repo as:

- `data/corpus/quran_words.csv`
- `data/corpus/quran_verses.csv`

Scope for v1: chapters 1-10 (28,115 words, 1,479 verses, 1,133 unique `root_word` values in that range).

**Root filtering rule:** `root_word` values with 3 or more space-separated letters are treated as true roots and get their own root node (matches triliteral/quadriliteral Arabic morphology). Values with 1-2 letters are grammatical particles (و, ف, ال, etc.) — they remain visible as word nodes in verse-flow sequence, but instead of each spawning its own hub (a few of these appear thousands of times and would otherwise dominate the graph), they attach to one shared "function words" cluster node. 5-6 letter entries (9 rows total, corpus-wide) are excluded as data noise; any word whose only root candidate falls in this range is instead attached to the shared function-words cluster.

**Pipeline:**
- `scripts/generate/generate_root_graph.mjs` — joins the two CSVs, applies the filtering rule above, dedupes roots (same `root_word` → one node, meanings taken from first occurrence), builds `{ roots[], words[], verses[], edges[] }`, writes `public/data/root-graph/ch1-10.json`.
- `scripts/validate/validate_root_graph.mjs` — schema check plus referential integrity (every word references a real root id and verse id). Added to `verify:deploy` alongside the existing catalog validator.

## Route & integration

- `src/app/quran/roots/page.tsx` — Server Component: metadata, page shell, fetches the static JSON path.
- `src/app/quran/roots/RootExplorerClient.tsx` — `'use client'`, mounted only when scrolled near viewport (existing performance convention).
- New nav entry next to Quran / Appendices.

## Rendering architecture

Three.js (new dependency). Two `InstancedMesh` groups: one for word nodes (small, tinted by verse group), one for root nodes (larger, accent-filled with soft halo). Instancing keeps draw calls flat regardless of node count, which is the seam that lets this scale toward the full ~77k word / ~6k root corpus later without a rewrite.

Picking: a spatial hash of screen-projected node positions, checked against pointer position on move/click, rather than per-object raycasting — stays cheap as node count grows.

LOD: frustum culling, plus word nodes fade below a pixel-size threshold at distance rather than a hard chapter-count wall — this is the mechanism that will carry the eventual full-corpus scale.

Camera: perspective projection, drag-to-orbit with damped inertia, scroll/pinch to zoom. No automatic movement.

## Layout modes

All three are computed once (on load / on mode switch), not simulated per-frame. Switching modes animates existing node positions via transform interpolation (600-800ms, eased), which snaps instantly under `prefers-reduced-motion`.

1. **Constellation** — one-time 3D force-directed layout; roots act as gravity wells, their words settle nearby.
2. **Verse-flow** — words placed along a gentle arc per verse, verses stacked in reading order.
3. **Root-tree** — hierarchical: root at the trunk, derived words as branches, roots grouped by shared first radical.

## Interaction

- Hover: small tooltip near the node with Arabic (Amiri), English, and transliteration.
- Click: side panel slides in (transform/opacity, not a modal overlay) with full root meaning, every derived word in scope, and links to `/quran/[chapter]?verse=` for each verse it appears in.
- Keyboard: a tab-focusable list of nodes parallel to the canvas, since a WebGL canvas has no native accessibility tree. Selecting a list entry performs the same action as clicking its node.
- Touch: drag-orbit and pinch-zoom equivalents to mouse controls.

## Typography & color

Reuses tokens and fonts already loaded in `layout.tsx` — no new font files.

- Superior Serif: root heading in the detail panel.
- Libre Franklin: English text, labels, controls.
- Amiri: Arabic text.
- Monospace: verse IDs, node/edge counts, stats bar.
- Colors: `--ed-bg`, `--ed-fg`, `--ed-fg-muted`, `--ed-accent`, `--ed-accent-soft`, `--ed-shadow-glow` only.

## Testing

- Unit tests (TDD): CSV join/filter logic in the generator, the three layout algorithms (deterministic given seeded input), and the spatial-hash picking function are all pure and directly testable.
- Playwright smoke test: canvas mounts without console errors, basic drag/click interaction doesn't throw, panel opens on node click.
- Manual verification in browser for visual/motion quality, since WebGL rendering isn't meaningfully covered by pixel-diff testing.

## Out of scope for v1

- Full-corpus data (chapters 11+). Architecture supports it; not built now.
- Sound-on-hover, progress tracking, root-comparison mode (mentioned as optional ideas in the original brainstorm) — not included unless requested later.
