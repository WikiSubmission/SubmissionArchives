# Search Keyboard Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two-level keyboard navigation (between result cards, and into a card's passages) to the existing archive search UI, with a pragmatic combobox accessibility layer and restrained selected-state styling.

**Architecture:** A pure reducer (`searchNavReducer.ts`) owns nav state transitions and is unit-tested with `node --test`. A React hook (`useSearchKeyboardNav.ts`) wraps the reducer, binds a keydown handler to the search input, and performs side effects (auto-expand/collapse, navigation). `SearchClient.tsx` wires the hook to its results, passes an `active` descriptor down to cards/passages for styling + `aria-activedescendant`, and scrolls the active node into view. The search backend, ranking, highlighting, and "ask" mode are untouched.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, `node --test` + `tsx` for unit tests, Playwright for E2E.

## Global Constraints

- TypeScript strict mode. No `any` in application code. Explicit types on exported functions and React props.
- Immutability: reducer returns new state objects, never mutates.
- No new color tokens. Reuse existing editorial tokens (`ed-accent`, `ed-rule`, `ed-fg`, `ed-fg-muted`, `soft-*`, `archive-*`). No light-blue accents.
- No smooth-scroll animation. Active node uses `scrollIntoView({ block: 'nearest' })` only.
- No `console.log` in committed code.
- Conventional commits, `<type>: <description>`. No co-author / attribution lines. No em-dashes in committed text.
- New unit-test files must be added to the explicit file list in the `test:unit` npm script (the runner does not glob).
- No RTL/jsdom in the repo: the pure reducer is unit-tested; the hook and integration are validated by typecheck + Playwright E2E.

---

### Task 1: Pure nav reducer + unit tests

**Files:**
- Create: `src/app/search/searchNavReducer.ts`
- Test: `tests/unit/search-nav-reducer.test.ts`
- Modify: `package.json:12` (register the new test file)

**Interfaces:**
- Produces:
  - `type NavMode = 'idle' | 'nav'`
  - `interface NavState { mode: NavMode; cardIndex: number; passageIndex: number }`
  - `interface NavBounds { cardCount: number; passageCountFor: (cardIndex: number) => number }`
  - `type NavKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Escape'`
  - `const IDLE: NavState`
  - `function navReduce(state: NavState, key: NavKey, bounds: NavBounds): NavState`
  - `function activeNodeId(state: NavState): string | null`
- Consumes: nothing.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/search-nav-reducer.test.ts`:

```ts
import assert from 'node:assert/strict';
import test from 'node:test';
import {
    IDLE,
    navReduce,
    activeNodeId,
    type NavState,
    type NavBounds,
} from '../../src/app/search/searchNavReducer';

const bounds: NavBounds = {
    cardCount: 3,
    passageCountFor: (cardIndex) => (cardIndex === 0 ? 3 : 1),
};

test('ArrowDown from idle selects the first card and enters nav mode', () => {
    assert.deepEqual(navReduce(IDLE, 'ArrowDown', bounds), {
        mode: 'nav',
        cardIndex: 0,
        passageIndex: -1,
    });
});

test('ArrowDown from idle with no cards stays idle', () => {
    const empty: NavBounds = { cardCount: 0, passageCountFor: () => 0 };
    assert.deepEqual(navReduce(IDLE, 'ArrowDown', empty), IDLE);
});

test('non-ArrowDown keys from idle are ignored', () => {
    assert.deepEqual(navReduce(IDLE, 'ArrowUp', bounds), IDLE);
    assert.deepEqual(navReduce(IDLE, 'ArrowRight', bounds), IDLE);
});

test('card-level ArrowDown moves down and clamps at the last card', () => {
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.equal(navReduce(atFirst, 'ArrowDown', bounds).cardIndex, 1);
    const atLast: NavState = { mode: 'nav', cardIndex: 2, passageIndex: -1 };
    assert.deepEqual(navReduce(atLast, 'ArrowDown', bounds), atLast);
});

test('card-level ArrowUp moves up and exits to idle above the first card', () => {
    const atSecond: NavState = { mode: 'nav', cardIndex: 1, passageIndex: -1 };
    assert.equal(navReduce(atSecond, 'ArrowUp', bounds).cardIndex, 0);
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.deepEqual(navReduce(atFirst, 'ArrowUp', bounds), IDLE);
});

test('ArrowRight drills into passage 0 when the card has passages', () => {
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.equal(navReduce(atFirst, 'ArrowRight', bounds).passageIndex, 0);
    const atSecond: NavState = { mode: 'nav', cardIndex: 1, passageIndex: -1 };
    // card 1 has 1 passage, so ArrowRight still drills to passage 0
    assert.equal(navReduce(atSecond, 'ArrowRight', bounds).passageIndex, 0);
});

test('ArrowLeft at card level is a no-op', () => {
    const atFirst: NavState = { mode: 'nav', cardIndex: 0, passageIndex: -1 };
    assert.deepEqual(navReduce(atFirst, 'ArrowLeft', bounds), atFirst);
});

test('passage-level ArrowDown moves down and clamps at the last passage', () => {
    const p0: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 0 };
    assert.equal(navReduce(p0, 'ArrowDown', bounds).passageIndex, 1);
    const pLast: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 2 };
    assert.deepEqual(navReduce(pLast, 'ArrowDown', bounds), pLast);
});

test('passage-level ArrowUp from passage 0 returns to card level', () => {
    const p0: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 0 };
    assert.equal(navReduce(p0, 'ArrowUp', bounds).passageIndex, -1);
    const p2: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 2 };
    assert.equal(navReduce(p2, 'ArrowUp', bounds).passageIndex, 1);
});

test('passage-level ArrowLeft returns to card level', () => {
    const p1: NavState = { mode: 'nav', cardIndex: 0, passageIndex: 1 };
    assert.deepEqual(navReduce(p1, 'ArrowLeft', bounds), {
        mode: 'nav',
        cardIndex: 0,
        passageIndex: -1,
    });
});

test('Escape from any nav state returns to idle', () => {
    const p1: NavState = { mode: 'nav', cardIndex: 2, passageIndex: 1 };
    assert.deepEqual(navReduce(p1, 'Escape', bounds), IDLE);
});

test('activeNodeId returns card and passage ids, null when idle', () => {
    assert.equal(activeNodeId(IDLE), null);
    assert.equal(
        activeNodeId({ mode: 'nav', cardIndex: 2, passageIndex: -1 }),
        'search-card-2',
    );
    assert.equal(
        activeNodeId({ mode: 'nav', cardIndex: 2, passageIndex: 1 }),
        'search-card-2-passage-1',
    );
});
```

- [ ] **Step 2: Register the test file, then run to verify it fails**

Edit `package.json` line 12. Change:

```
"test:unit": "node --import tsx --test tests/unit/search-query.test.ts tests/unit/media-assets.test.ts tests/unit/transcript-utils.test.ts tests/unit/web-vitals.test.ts tests/unit/next-config-redirects.test.ts tests/integration/catalog.test.ts",
```

to (adds `tests/unit/search-nav-reducer.test.ts`):

```
"test:unit": "node --import tsx --test tests/unit/search-nav-reducer.test.ts tests/unit/search-query.test.ts tests/unit/media-assets.test.ts tests/unit/transcript-utils.test.ts tests/unit/web-vitals.test.ts tests/unit/next-config-redirects.test.ts tests/integration/catalog.test.ts",
```

Run: `npm run test:unit`
Expected: FAIL — cannot find module `src/app/search/searchNavReducer` (module not created yet).

- [ ] **Step 3: Write minimal implementation**

Create `src/app/search/searchNavReducer.ts`:

```ts
export type NavMode = 'idle' | 'nav';

export interface NavState {
    mode: NavMode;
    cardIndex: number;
    passageIndex: number; // -1 = card level, >= 0 = a specific passage
}

export interface NavBounds {
    cardCount: number;
    passageCountFor: (cardIndex: number) => number;
}

export type NavKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Escape';

export const IDLE: NavState = { mode: 'idle', cardIndex: -1, passageIndex: -1 };

export function navReduce(state: NavState, key: NavKey, bounds: NavBounds): NavState {
    const { cardCount } = bounds;

    if (state.mode === 'idle') {
        if (key === 'ArrowDown' && cardCount > 0) {
            return { mode: 'nav', cardIndex: 0, passageIndex: -1 };
        }
        return state;
    }

    if (key === 'Escape') {
        return IDLE;
    }

    const passageCount = bounds.passageCountFor(state.cardIndex);

    if (state.passageIndex === -1) {
        switch (key) {
            case 'ArrowDown':
                return state.cardIndex < cardCount - 1
                    ? { ...state, cardIndex: state.cardIndex + 1 }
                    : state;
            case 'ArrowUp':
                return state.cardIndex > 0
                    ? { ...state, cardIndex: state.cardIndex - 1 }
                    : IDLE;
            case 'ArrowRight':
                return passageCount > 0 ? { ...state, passageIndex: 0 } : state;
            default:
                return state;
        }
    }

    switch (key) {
        case 'ArrowDown':
            return state.passageIndex < passageCount - 1
                ? { ...state, passageIndex: state.passageIndex + 1 }
                : state;
        case 'ArrowUp':
            return { ...state, passageIndex: state.passageIndex - 1 };
        case 'ArrowLeft':
            return { ...state, passageIndex: -1 };
        default:
            return state;
    }
}

export function activeNodeId(state: NavState): string | null {
    if (state.mode !== 'nav') {
        return null;
    }
    return state.passageIndex >= 0
        ? `search-card-${state.cardIndex}-passage-${state.passageIndex}`
        : `search-card-${state.cardIndex}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: PASS (all reducer tests green, existing suites unaffected).

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/search/searchNavReducer.ts tests/unit/search-nav-reducer.test.ts package.json
git commit -m "feat: add pure reducer for search keyboard navigation"
```

---

### Task 2: Keyboard nav hook

**Files:**
- Create: `src/app/search/useSearchKeyboardNav.ts`

**Interfaces:**
- Consumes (from Task 1): `IDLE`, `NavState`, `NavBounds`, `NavKey`, `navReduce`, `activeNodeId`.
- Produces:
  - `interface SearchKeyboardNavOptions { bounds: NavBounds; getHref: (cardIndex: number, passageIndex: number) => string | null; navigate: (href: string) => void; expandCard: (cardIndex: number) => void; collapseCard: (cardIndex: number) => void; isCardExpanded: (cardIndex: number) => boolean }`
  - `interface SearchKeyboardNav { activeNodeId: string | null; activeCardIndex: number; activePassageIndex: number; onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void; reset: () => void }`
  - `function useSearchKeyboardNav(options: SearchKeyboardNavOptions): SearchKeyboardNav`

Notes for the implementer:
- `activeCardIndex`/`activePassageIndex` are `-1` when idle. `activePassageIndex` is `-1` when a card is selected at card level.
- Enter is handled here (not in the reducer): in nav mode it opens the active target and calls `preventDefault`; in idle mode it is left alone so the form still submits a search.
- Auto-expand is tracked in a ref so a card auto-expanded on drill-in is collapsed on drill-out or on exit, but a card the user expanded manually is left alone.

- [ ] **Step 1: Write the hook**

Create `src/app/search/useSearchKeyboardNav.ts`:

```ts
'use client';

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import {
    IDLE,
    navReduce,
    activeNodeId,
    type NavBounds,
    type NavKey,
    type NavState,
} from './searchNavReducer';

const NAV_KEYS: ReadonlySet<string> = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Escape',
]);

export interface SearchKeyboardNavOptions {
    bounds: NavBounds;
    getHref: (cardIndex: number, passageIndex: number) => string | null;
    navigate: (href: string) => void;
    expandCard: (cardIndex: number) => void;
    collapseCard: (cardIndex: number) => void;
    isCardExpanded: (cardIndex: number) => boolean;
}

export interface SearchKeyboardNav {
    activeNodeId: string | null;
    activeCardIndex: number;
    activePassageIndex: number;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    reset: () => void;
}

export function useSearchKeyboardNav(options: SearchKeyboardNavOptions): SearchKeyboardNav {
    const { bounds, getHref, navigate, expandCard, collapseCard, isCardExpanded } = options;
    const [state, setState] = useState<NavState>(IDLE);
    const autoExpandedRef = useRef<number | null>(null);

    const reset = useCallback(() => {
        if (autoExpandedRef.current !== null) {
            collapseCard(autoExpandedRef.current);
            autoExpandedRef.current = null;
        }
        setState(IDLE);
    }, [collapseCard]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            const key = event.key;

            if (state.mode === 'idle') {
                if (key === 'ArrowDown' && bounds.cardCount > 0) {
                    event.preventDefault();
                    setState(navReduce(state, 'ArrowDown', bounds));
                }
                return;
            }

            if (key === 'Enter') {
                event.preventDefault();
                const href = getHref(state.cardIndex, state.passageIndex);
                if (href) {
                    navigate(href);
                }
                return;
            }

            if (!NAV_KEYS.has(key)) {
                return;
            }

            event.preventDefault();
            const next = navReduce(state, key as NavKey, bounds);

            const enteringPassages = state.passageIndex === -1 && next.passageIndex >= 0;
            const leavingPassages = state.passageIndex >= 0 && next.passageIndex === -1;
            const exitingNav = next.mode === 'idle';

            if (enteringPassages && !isCardExpanded(next.cardIndex)) {
                expandCard(next.cardIndex);
                autoExpandedRef.current = next.cardIndex;
            }
            if ((leavingPassages || exitingNav) && autoExpandedRef.current !== null) {
                collapseCard(autoExpandedRef.current);
                autoExpandedRef.current = null;
            }

            setState(next);
        },
        [state, bounds, getHref, navigate, expandCard, collapseCard, isCardExpanded],
    );

    return {
        activeNodeId: activeNodeId(state),
        activeCardIndex: state.mode === 'nav' ? state.cardIndex : -1,
        activePassageIndex: state.mode === 'nav' ? state.passageIndex : -1,
        onKeyDown,
        reset,
    };
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for `src/app/search/useSearchKeyboardNav.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/app/search/useSearchKeyboardNav.ts
git commit -m "feat: add search keyboard navigation hook"
```

---

### Task 3: Wire navigation into SearchClient

**Files:**
- Modify: `src/app/search/SearchClient.tsx`

**Interfaces:**
- Consumes (from Task 2): `useSearchKeyboardNav`, `SearchKeyboardNavOptions`.
- Produces: no new exports. Adds a module helper `getMatchHref(media, match, query)` used by the card, the passage row, and the hook's `getHref`.

Notes for the implementer:
- `SearchClient.tsx` already imports `useCallback`, `useEffect`, `useMemo`, `useRef`, `useState` (line 4) and `useRouter` (line 6). Reuse them.
- Hook callbacks must be stable, so read the latest `rankedResults`, `query`, and `expandedMatches` through refs. Do NOT close over those values directly in `useCallback([])`.
- Card node id: `search-card-${cardIndex}`. Passage node id: `search-card-${cardIndex}-passage-${passageIndex}`. Passage index maps directly onto the `matches` array: passage 0 is the "Best passage" block, passages >= 1 are the `SearchMatchRow`s (which currently render `visibleMatches.slice(1)`).

- [ ] **Step 1: Add the shared `getMatchHref` helper and refactor existing href logic to use it**

In `src/app/search/SearchClient.tsx`, add this module-level helper next to the other link helpers (after `getDocumentMatchLink`, around line 814):

```tsx
function getMatchHref(media: SearchResultMedia, match: SearchMatch, query: string) {
    if (isDocumentType(media.type)) {
        return getDocumentMatchLink(media, match, query);
    }
    return `${getMediaLink(media, query)}?t=${Math.floor(match.start_time)}`;
}
```

Then replace the inline `bestHref` computation in `SearchResultCard` (currently lines 463-467):

```tsx
    const bestHref = bestMatch
        ? isDocumentType(media.type)
            ? getDocumentMatchLink(media, bestMatch, query)
            : `${mediaLink}?t=${Math.floor(bestMatch.start_time)}`
        : mediaLink;
```

with:

```tsx
    const bestHref = bestMatch ? getMatchHref(media, bestMatch, query) : mediaLink;
```

And replace the inline `href` in `SearchMatchRow` (currently lines 610-612):

```tsx
    const href = isDocumentType(media.type)
        ? getDocumentMatchLink(media, match, query)
        : `${mediaLink}?t=${Math.floor(match.start_time)}`;
```

with:

```tsx
    const href = getMatchHref(media, match, query);
```

- [ ] **Step 2: Add stable refs and hook wiring inside `SearchContent`**

In `SearchContent`, immediately after `rankedResults` is defined (after line 118), add refs and hook plumbing:

```tsx
    const rankedRef = useRef(rankedResults);
    rankedRef.current = rankedResults;
    const queryRef = useRef(query);
    queryRef.current = query;
    const expandedRef = useRef(expandedMatches);
    expandedRef.current = expandedMatches;

    const itemKeyFor = useCallback((cardIndex: number) => {
        const media = rankedRef.current[cardIndex]?.media;
        return media ? `${media.id}${media.page ? `-${media.page}` : ''}` : '';
    }, []);

    const expandCard = useCallback((cardIndex: number) => {
        setExpandedMatches((prev) => {
            const next = new Set(prev);
            next.add(itemKeyFor(cardIndex));
            return next;
        });
    }, [itemKeyFor]);

    const collapseCard = useCallback((cardIndex: number) => {
        setExpandedMatches((prev) => {
            const next = new Set(prev);
            next.delete(itemKeyFor(cardIndex));
            return next;
        });
    }, [itemKeyFor]);

    const isCardExpanded = useCallback(
        (cardIndex: number) => expandedRef.current.has(itemKeyFor(cardIndex)),
        [itemKeyFor],
    );

    const getHref = useCallback((cardIndex: number, passageIndex: number) => {
        const result = rankedRef.current[cardIndex];
        if (!result) {
            return null;
        }
        const index = passageIndex >= 0 ? passageIndex : 0;
        const match = result.matches[index];
        return match
            ? getMatchHref(result.media, match, queryRef.current)
            : getMediaLink(result.media, queryRef.current);
    }, []);

    const navigate = useCallback((href: string) => {
        router.push(href);
    }, [router]);

    const navBounds = useMemo(
        () => ({
            cardCount: Math.min(visibleCount, rankedResults.length),
            passageCountFor: (cardIndex: number) => rankedRef.current[cardIndex]?.matches.length ?? 0,
        }),
        [visibleCount, rankedResults.length],
    );

    const nav = useSearchKeyboardNav({
        bounds: navBounds,
        getHref,
        navigate,
        expandCard,
        collapseCard,
        isCardExpanded,
    });

    useEffect(() => {
        nav.reset();
    }, [results, visibleCount, nav.reset]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!nav.activeNodeId) {
            return;
        }
        document.getElementById(nav.activeNodeId)?.scrollIntoView({ block: 'nearest' });
    }, [nav.activeNodeId]);
```

Add the hook import near the top of the file (after line 13):

```tsx
import { useSearchKeyboardNav } from './useSearchKeyboardNav';
```

- [ ] **Step 3: Add combobox ARIA + keydown to the search input**

On the `<input id="archive-search-input" ...>` element (lines 349-357), add these attributes:

```tsx
                            onKeyDown={nav.onKeyDown}
                            role="combobox"
                            aria-expanded={rankedResults.length > 0}
                            aria-controls="search-results"
                            aria-autocomplete="list"
                            aria-activedescendant={nav.activeNodeId ?? undefined}
```

- [ ] **Step 4: Make the results container a listbox and thread the active descriptor to cards**

Change the results wrapper `<div className="space-y-5">` (line 405) to:

```tsx
                    <div id="search-results" role="listbox" aria-label="Search results" className="space-y-5">
```

Update the `.map` (lines 406-418) so each card knows its index and active state:

```tsx
                        {rankedResults.slice(0, visibleCount).map((result, index) => {
                            const itemKey = `${result.media.id}${result.media.page ? `-${result.media.page}` : ''}`;
                            const active = nav.activeCardIndex === index ? nav.activePassageIndex : null;
                            return (
                                <SearchResultCard
                                    key={itemKey}
                                    cardIndex={index}
                                    active={active}
                                    result={result}
                                    query={query}
                                    rank={index + 1}
                                    expanded={expandedMatches.has(itemKey)}
                                    onToggle={() => toggleMatches(itemKey)}
                                />
                            );
                        })}
```

Here `active` is: `null` when this card is not selected, `-1` when the card is selected at card level, and `>= 0` when a passage in this card is active.

- [ ] **Step 5: Render selected state + node ids in `SearchResultCard`**

Update the `SearchResultCard` props type (lines 444-456) to add `cardIndex` and `active`:

```tsx
function SearchResultCard({
    result,
    query,
    rank,
    expanded,
    onToggle,
    cardIndex,
    active,
}: {
    result: SearchResult;
    query: string;
    rank: number;
    expanded: boolean;
    onToggle: () => void;
    cardIndex: number;
    active: number | null;
}) {
```

Inside `SearchResultCard`, after `const bestHref = ...`, derive display flags:

```tsx
    const cardActive = active === -1;
    const cardId = `search-card-${cardIndex}`;
    const cardTitle = media.displayTitle || media.title;
    const bestPassageId = `search-card-${cardIndex}-passage-0`;
    const bestPassageActive = active === 0;
```

Add id + group semantics + active styling to the `<article>` (line 470). The card is a
`group` (not an `option`): it wraps several links and nested `option` passages, so making
it an `option` would create invalid nested options and `nested-interactive` axe violations.
`listbox > group > option` is the ARIA-valid two-level shape. Card-level selection is shown
with the ring and reflected via `aria-activedescendant` on the input. Change:

```tsx
        <article className={`soft-shell overflow-hidden ${isDocument ? 'bg-ed-muted/20' : ''}`}>
```

to:

```tsx
        <article
            id={cardId}
            role="group"
            aria-label={cardTitle}
            className={`soft-shell overflow-hidden ${isDocument ? 'bg-ed-muted/20' : ''} ${
                cardActive ? 'ring-2 ring-ed-accent ring-offset-2 ring-offset-ed-bg' : ''
            }`}
        >
```

On the "Best passage" `<Link>` (line 538), add id, role, selected state, and an active ring. Change the opening tag:

```tsx
                        <Link
                            href={bestHref}
                            className="my-4 block rounded-[1.35rem] border border-ed-rule bg-ed-muted/45 px-4 py-4 transition hover:border-ed-accent/50"
                        >
```

to:

```tsx
                        <Link
                            href={bestHref}
                            id={bestPassageId}
                            role="option"
                            aria-selected={bestPassageActive}
                            className={`my-4 block rounded-[1.35rem] border bg-ed-muted/45 px-4 py-4 transition hover:border-ed-accent/50 ${
                                bestPassageActive ? 'border-ed-accent ring-1 ring-ed-accent' : 'border-ed-rule'
                            }`}
                        >
```

Update the `visibleMatches.slice(1)` mapping (lines 569-581) so each row receives its passage index and active flag. `visibleMatches.slice(1)` are `matches[1..]`, so a row's passage index is its `matches` index. Use the index from `matches` to stay correct when collapsed vs expanded:

```tsx
                    {visibleMatches.length > 1 ? (
                        <div>
                            {visibleMatches.slice(1).map((match) => {
                                const passageIndex = matches.indexOf(match);
                                return (
                                    <SearchMatchRow
                                        key={match.id}
                                        media={media}
                                        mediaLink={mediaLink}
                                        match={match}
                                        query={query}
                                        nodeId={`search-card-${cardIndex}-passage-${passageIndex}`}
                                        active={active === passageIndex}
                                    />
                                );
                            })}
                        </div>
                    ) : null}
```

- [ ] **Step 6: Render selected state + node id in `SearchMatchRow`**

Update `SearchMatchRow` props (lines 599-608) to accept `nodeId` and `active`:

```tsx
function SearchMatchRow({
    media,
    mediaLink,
    match,
    query,
    nodeId,
    active,
}: {
    media: SearchResultMedia;
    mediaLink: string;
    match: SearchMatch;
    query: string;
    nodeId: string;
    active: boolean;
}) {
```

Add id, role, selected state, and active styling to the row `<Link>` (line 615). Change:

```tsx
        <Link
            href={href}
            className="group flex gap-4 border-t border-ed-rule py-4 transition first:border-t-0 first:pt-3"
        >
```

to:

```tsx
        <Link
            href={href}
            id={nodeId}
            role="option"
            aria-selected={active}
            className={`group flex gap-4 border-t py-4 transition first:border-t-0 first:pt-3 ${
                active ? 'border-ed-accent bg-ed-accent/5' : 'border-ed-rule'
            }`}
        >
```

- [ ] **Step 7: Add the keyboard hint line**

In the results-summary block, inside the `<div>` that holds "Best matches first" (after line 394's `<p>`), add a hint that is hidden on coarse (touch) pointers:

```tsx
                                <p className="mt-2 text-[0.62rem] uppercase tracking-[0.18em] text-ed-fg-muted [@media(pointer:coarse)]:hidden">
                                    &uarr;&darr; navigate &middot; &rarr; passages &middot; &crarr; open
                                </p>
```

- [ ] **Step 8: Typecheck and lint**

Run: `npm run typecheck`
Expected: no errors.

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 9: Manual smoke check**

Run: `npm run dev`, open `/search`, run a query, then:
- `ArrowDown` selects card 01 (accent ring appears, input keeps focus).
- `ArrowDown`/`ArrowUp` move between cards; `ArrowUp` on card 01 clears selection.
- `ArrowRight` on a card auto-expands it and highlights the best passage; `ArrowDown` moves through passages.
- `ArrowLeft` collapses back to card level; `Enter` navigates to the active target; `Escape` clears selection.
- Typing still edits text normally when no card is selected.

- [ ] **Step 10: Commit**

```bash
git add src/app/search/SearchClient.tsx
git commit -m "feat: wire two-level keyboard navigation into search results"
```

---

### Task 4: E2E keyboard navigation journey

**Files:**
- Modify: `tests/e2e/archive-flows.spec.ts`

**Interfaces:**
- Consumes: the `role="combobox"` input, `#search-card-0`, and `aria-activedescendant` wiring from Task 3.

- [ ] **Step 1: Add the E2E test**

Append to `tests/e2e/archive-flows.spec.ts`:

```ts
test('keyboard navigation moves through result cards and into passages', async ({ page }) => {
    await page.goto('/search?filters=other');

    const input = page.getByRole('combobox');
    await input.fill('prayer');
    await page.getByRole('button', { name: 'Search', exact: true }).click();

    await expect(page.locator('#search-card-0')).toBeVisible();

    await input.press('ArrowDown');
    await expect(input).toHaveAttribute('aria-activedescendant', 'search-card-0');

    await input.press('ArrowRight');
    await expect(input).toHaveAttribute('aria-activedescendant', 'search-card-0-passage-0');

    await input.press('Enter');
    await expect(page).not.toHaveURL(/\/search(\?|$)/);
});
```

- [ ] **Step 2: Run the E2E test**

Run: `npx playwright test tests/e2e/archive-flows.spec.ts -g "keyboard navigation"`
Expected: PASS. (If the dev/preview server is not auto-started by `playwright.config.ts`, start the app first per that config.)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/archive-flows.spec.ts
git commit -m "test: add e2e journey for search keyboard navigation"
```

---

### Task 5: Full verification

**Files:** none (verification only).

- [ ] **Step 1: Run the full quality gate**

Run: `npm run lint && npm run typecheck && npm test`
Expected: all pass.

- [ ] **Step 2: Run the E2E accessibility spec (regression for the new combobox roles)**

Run: `npx playwright test tests/e2e/accessibility.spec.ts`
Expected: PASS (no new axe violations from `role="combobox"`/`role="listbox"`/`role="option"`).

- [ ] **Step 3: Final review with code-reviewer**

Dispatch the `code-reviewer` agent (and `typescript-reviewer`) against the diff `git diff main...HEAD` for `src/app/search/**`. Address any CRITICAL/HIGH findings before opening a PR.
```
