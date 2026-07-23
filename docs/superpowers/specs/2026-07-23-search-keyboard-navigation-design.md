# Search Keyboard Navigation + Polish — Design

Date: 2026-07-23
Status: Approved (design)
Area: `src/app/search/`

## Context

`src/app/search/SearchClient.tsx` is an existing, production search UI wired to a
real backend (`searchTranscripts` server action over the RAG/Postgres/Mistral
pipeline). It already has debounced input, URL-synced type filters, XSS-safe
highlighting, load-more pagination, expandable passages, Qur'an verse refs, and a
separate semantic "ask" mode (`SearchModeSwitcher` -> `AskArchiveClient`).

A pasted design doc proposed rebuilding search from a static mock. That would be a
regression, since the real component already covers those features and more. The
single genuinely new capability is **keyboard navigation of results**. This spec
covers adding two-level keyboard navigation plus small polish, without touching the
search backend, highlighting, or ask mode.

## Goals

- Navigate results by keyboard: between result cards, and into the passages within a card.
- Open the active card or passage with Enter.
- Keep focus in the search input so typing is uninterrupted.
- Add restrained selected-state styling and a pragmatic combobox a11y layer.

## Non-goals

- No change to the search backend, server action, ranking, or highlighting.
- No change to the "ask" (semantic) mode.
- No new color tokens; reuse the existing editorial design system.
- No smooth-scroll animation (respect restrained-motion preference).

## Navigation model

Single input-anchored model with an explicit mode boundary that resolves the
conflict between passage navigation and text-cursor editing.

State: `{ mode: 'idle' | 'nav', cardIndex: number, passageIndex: number }`
where `passageIndex === -1` means "card level" and `>= 0` means a specific passage.

- **mode = idle** (default, while typing): all arrow keys behave normally for text
  editing, EXCEPT `ArrowDown`, which selects the first visible card and enters
  `nav` mode (`cardIndex = 0`, `passageIndex = -1`).
- **mode = nav** (a card is selected):
  - `ArrowDown` / `ArrowUp`: move between visible cards at card level. `ArrowUp`
    from the first card exits to `idle` and clears selection.
  - `ArrowRight`: drill into passages — sets `passageIndex = 0` and auto-expands the
    card so all passages are reachable.
  - `ArrowLeft`: back out to card level (`passageIndex = -1`); collapse the card
    again unless the user had manually expanded it.
  - While drilled in, `ArrowDown` / `ArrowUp` move between passages; moving above
    passage 0 returns to card level; moving below the last passage clamps.
  - `Enter`: open the active target — the passage link when drilled in, else the
    card's best-passage link (`bestHref`).
  - `Escape`: exit to `idle`, clear selection.
- At the last visible card, `ArrowDown` clamps (no auto "Load more").
- Selection resets to `idle` on: new search, filter change, and "Load more".

`ArrowLeft` / `ArrowRight` are only intercepted in `nav` mode, so text-cursor
editing is unaffected whenever no card is selected.

## Architecture

`SearchClient.tsx` is already ~898 lines (over the 800 guideline). Extract the nav
logic rather than inlining it.

### New: `src/app/search/useSearchKeyboardNav.ts`
A small reducer-style hook. Pure, unit-testable, no DOM assumptions in the reducer.

Inputs (from `SearchClient`):
- `visibleCount` and a way to read each visible result's passage count.
- Callbacks to expand/collapse a card and to navigate (open a target href/router push).

Returns:
- `activeNode`: `{ cardIndex: number, passageIndex: number } | null`.
- `onKeyDown`: a handler bound to the search input.
- helpers to reset selection.

Internally the reducer computes next state from the current state, a key event, and
bounds `{ cardCount, passageCountFor(cardIndex) }`. Side effects (expand/collapse,
scrollIntoView, navigation) are performed by the hook wrapper, not the reducer.

### Consumers
- `SearchClient` owns results, `visibleCount`, `expandedMatches`, and the router. It
  wires those into the hook and spreads `onKeyDown` onto the input.
- `SearchResultCard` and `SearchMatchRow` receive an `active` descriptor (whether
  this card is active, and which passage index is active) plus stable node `id`s so
  they can render selected state and back `aria-activedescendant`.

### Node id scheme
- Card: `search-card-<cardIndex>`
- Passage: `search-card-<cardIndex>-passage-<passageIndex>`
Passage index 0 is the "Best passage" block; indices >= 1 map to `SearchMatchRow`s,
matching the existing `matches` array order.

## Accessibility (pragmatic combobox)

- Search input: `role="combobox"`, `aria-expanded` (true when results shown),
  `aria-controls` pointing at the results container, `aria-activedescendant` set to
  the active node id (or omitted when idle).
- Results container: `role="listbox"` (flat listbox of nodes is acceptable for the
  pragmatic level; passages are addressable nodes within it).
- Active card/passage: `aria-selected="true"` and the matching `id`.
- Active node calls `scrollIntoView({ block: 'nearest' })` — no `behavior: 'smooth'`.

## Polish

- Selected/active styling: a restrained ring / left accent using existing `ed-accent`
  tokens. No new colors, no light blue.
- Keyboard hint line near the results header: `↑↓ navigate · → passages · ↵ open`,
  hidden on coarse pointers (`@media (pointer: coarse)` / `hidden` on touch).
- Empty state: keep existing example chips (already the "suggestions when empty").

## Error handling / edge cases

- Empty results or `isSearching`: hook stays idle; `onKeyDown` is a no-op for nav keys.
- `visibleCount` shrinks below `cardIndex` (shouldn't happen, but): clamp to bounds
  or reset to idle.
- A card with a single passage: `ArrowRight` still drills to passage 0; `ArrowLeft`
  returns to card level.
- Non-passage keys pass through untouched so typing/search is never blocked.

## Testing

- Unit (`tests/unit/search-keyboard-nav.test.ts`): reducer transitions — enter nav
  on ArrowDown, exit on ArrowUp-past-top and Escape, drill in/out on Right/Left,
  passage movement and clamping, reset on new results. Follows the repo's
  `node --test` + `tsx` setup used by existing unit tests.
- E2E (extend the Playwright search spec): type a query, ArrowDown to first card,
  ArrowRight into passages, ArrowDown between passages, Enter navigates to the
  expected href.

## Rollout

Single change set. No migrations, no backend changes, no config changes. Verified
via `npm run lint`, `npm run typecheck`, `npm test`, and the extended E2E spec.
