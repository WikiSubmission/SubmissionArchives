# Complete Shelf Implementation Plan

> **Status: superseded on 2026-07-29.** Replaced by `docs/superpowers/specs/2026-07-29-book-3d-covers-design.md`, a lighter CSS-transform treatment of the same grid. This plan is kept for reference only and should not be executed.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2D thumbnail grid in the "Books & Publications" section of `/written` with a warm editorial 3D shelf (React Three Fiber) built on the site's 13 real books, browsable by drag/wheel/keys/markers and inspectable in a pulled-forward orbit view.

**Architecture:** A server-rendered `page.tsx` maps the existing `Books`-category catalog entries into a small typed list and hands it to a client-only `CompleteShelf` component (dynamically imported, `ssr: false`). Inside, pure logic modules (deterministic per-book layout, a nav reducer, theme palettes) drive a small tree of R3F components (`Shelf`, `BookMesh`, `ShelfScene`) plus an HTML overlay (`ShelfOverlay`, `InspectPanel`) layered on top of the `<canvas>`. An always-mounted, screen-reader-accessible link list keeps the page's existing accessibility and e2e contract intact regardless of what the 3D layer does.

**Tech Stack:** Next.js 16 / React 19 (existing), `three`, `@react-three/fiber`, `@react-three/drei` (new), Tailwind v4 + existing `--ed-*` design tokens, `framer-motion` (existing), Playwright + `node:test` (existing).

## Global Constraints

- Books & Publications section only — the "Submitters Perspectives" newsletter grid on `/written` is not touched.
- React Three Fiber + drei only, no vanilla Three.js render loop.
- Book cover art always comes from the site's real thumbnails (`public/content/written/books/thumbnails/*`) — never generated art.
- Always render the 3D shelf; no soft fallback for `prefers-reduced-motion` or low-end-device heuristics. A hard-failure fallback (plain link list) exists only for genuine render/WebGL crashes.
- Full touch parity with desktop (drag-to-browse, one-finger orbit + pinch zoom to inspect).
- The shelf's palette must track the site's existing light/dark theme via `useTheme()` from `src/components/providers/ThemeProvider.tsx`.
- Conventional commits, no co-author lines, no em-dashes or AI-slop phrasing in commit messages or UI copy.
- No new API routes or data sources — the 13 existing `Books`-category catalog entries are the complete shelf contents.

---

### Task 1: Add Three.js dependencies

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `three@^0.185.1`, `@react-three/fiber@^9.6.1`, `@react-three/drei@^10.7.7` available to import from any later task.

- [ ] **Step 1: Install the packages**

Run:
```bash
npm install three@^0.185.1 @react-three/fiber@^9.6.1 @react-three/drei@^10.7.7
```

- [ ] **Step 2: Verify the install didn't break the existing build pipeline**

Run: `npm run typecheck`
Expected: passes with no errors (these packages ship their own TypeScript types; no `@types/three` needed).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add three.js and react-three-fiber dependencies"
```

---

### Task 2: `ShelfBook` data mapping

**Files:**
- Create: `src/lib/shelfBook.ts`
- Test: `tests/unit/shelf-book.test.ts`

**Interfaces:**
- Consumes: `getPublicAssetUrl` from `src/lib/mediaAssets.ts` (existing).
- Produces: `type ShelfBook = { id: string; title: string; author: string | null; coverUrl: string; libraryHref: string }`, `type RawBookEntry = { id: string; title: string; author?: string; thumbnailOverride?: string }`, `function mapBookToShelfBook(book: RawBookEntry): ShelfBook`. Later tasks import `ShelfBook` from this file.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/shelf-book.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { mapBookToShelfBook } from '../../src/lib/shelfBook';

test('maps a raw catalog book to a shelf book with a resolved cover url and library href', () => {
    const shelfBook = mapBookToShelfBook({
        id: 'computer-speaks',
        title: "The Computer Speaks: God's Message to the World",
        author: 'Dr. Rashad Khalifa',
        thumbnailOverride: '/content/written/books/thumbnails/computer-speaks.jpg',
    });

    assert.deepEqual(shelfBook, {
        id: 'computer-speaks',
        title: "The Computer Speaks: God's Message to the World",
        author: 'Dr. Rashad Khalifa',
        coverUrl: '/content/written/books/thumbnails/computer-speaks.jpg',
        libraryHref: '/library/computer-speaks',
    });
});

test('defaults a missing author to null', () => {
    const shelfBook = mapBookToShelfBook({
        id: 'salat-booklet',
        title: 'The Contact Prayers',
        thumbnailOverride: '/content/written/books/thumbnails/salat-booklet.png',
    });

    assert.equal(shelfBook.author, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/shelf-book.test.ts`
Expected: FAIL with a module-not-found error for `src/lib/shelfBook`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/shelfBook.ts
import { getPublicAssetUrl } from '@/lib/mediaAssets';

export type ShelfBook = {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string;
    libraryHref: string;
};

export type RawBookEntry = {
    id: string;
    title: string;
    author?: string;
    thumbnailOverride?: string;
};

export function mapBookToShelfBook(book: RawBookEntry): ShelfBook {
    return {
        id: book.id,
        title: book.title,
        author: book.author ?? null,
        coverUrl: getPublicAssetUrl(book.thumbnailOverride),
        libraryHref: `/library/${book.id}`,
    };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/shelf-book.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/shelfBook.ts tests/unit/shelf-book.test.ts
git commit -m "feat: add shelf book data mapping"
```

---

### Task 3: Deterministic per-book layout

**Files:**
- Create: `src/lib/shelfBookLayout.ts`
- Test: `tests/unit/shelf-book-layout.test.ts`

**Interfaces:**
- Produces: `type BookLayout = { width: number; height: number; depth: number; spineColor: string }`, `function getBookLayout(id: string, spineColors: readonly string[]): BookLayout`, `function wrapTextToLines(text: string, maxCharsPerLine: number): string[]`. Later tasks (`BookMesh.tsx`, `ShelfScene.tsx`) import both.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/shelf-book-layout.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { getBookLayout, wrapTextToLines } from '../../src/lib/shelfBookLayout';

const PALETTE = ['#111111', '#222222', '#333333'];

test('produces the same layout for the same id every time', () => {
    const first = getBookLayout('quran1981', PALETTE);
    const second = getBookLayout('quran1981', PALETTE);
    assert.deepEqual(first, second);
});

test('produces varied widths across the real book catalog rather than one uniform size', () => {
    const ids = [
        'computer-speaks', 'english-meanings-of-the-quran', 'eternity-screenplay',
        'hard-cover-1989', 'islam-volume-1-number-1-april-1974', 'miracle-of-quran-alphabets',
        'perpetual-miracle', 'quran1981', 'quran-hadith-islam', 'quran-visual-presentation',
        'salat-booklet',
    ];
    const widths = new Set(ids.map((id) => getBookLayout(id, PALETTE).width));
    assert.ok(widths.size > 1);
});

test('keeps dimensions within book-sized bounds', () => {
    const layout = getBookLayout('perpetual-miracle', PALETTE);
    assert.ok(layout.width >= 0.045 && layout.width <= 0.08);
    assert.ok(layout.height >= 0.28 && layout.height <= 0.36);
    assert.ok(layout.depth >= 0.19 && layout.depth <= 0.24);
});

test('assigns a spine color from the provided palette', () => {
    const layout = getBookLayout('miracle-of-quran-alphabets', PALETTE);
    assert.ok(PALETTE.includes(layout.spineColor));
});

test('wraps long titles across multiple lines without any line running away', () => {
    const lines = wrapTextToLines("The Computer Speaks: God's Message to the World", 16);
    assert.ok(lines.length > 1);
    lines.forEach((line) => assert.ok(line.length <= 20));
});

test('keeps a single long word on its own line instead of splitting it', () => {
    const lines = wrapTextToLines('Supercalifragilisticexpialidocious', 10);
    assert.deepEqual(lines, ['Supercalifragilisticexpialidocious']);
});

test('returns an empty array for blank input', () => {
    assert.deepEqual(wrapTextToLines('   ', 10), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/shelf-book-layout.test.ts`
Expected: FAIL with a module-not-found error.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/shelfBookLayout.ts
const GOLDEN_RATIO_CONJUGATE = 0.6180339887498949;

const BASE_WIDTH = 0.045;
const WIDTH_RANGE = 0.035;
const BASE_HEIGHT = 0.28;
const HEIGHT_RANGE = 0.08;
const BASE_DEPTH = 0.19;
const DEPTH_RANGE = 0.05;

function hashStringToUnit(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) | 0;
    }
    const normalized = (hash >>> 0) / 0xffffffff;
    return (normalized + GOLDEN_RATIO_CONJUGATE) % 1;
}

export type BookLayout = {
    width: number;
    height: number;
    depth: number;
    spineColor: string;
};

export function getBookLayout(id: string, spineColors: readonly string[]): BookLayout {
    const widthUnit = hashStringToUnit(`${id}:width`);
    const heightUnit = hashStringToUnit(`${id}:height`);
    const depthUnit = hashStringToUnit(`${id}:depth`);
    const colorUnit = hashStringToUnit(`${id}:color`);
    const colorIndex = Math.min(spineColors.length - 1, Math.floor(colorUnit * spineColors.length));

    return {
        width: BASE_WIDTH + widthUnit * WIDTH_RANGE,
        height: BASE_HEIGHT + heightUnit * HEIGHT_RANGE,
        depth: BASE_DEPTH + depthUnit * DEPTH_RANGE,
        spineColor: spineColors[colorIndex],
    };
}

export function wrapTextToLines(text: string, maxCharsPerLine: number): string[] {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (candidate.length > maxCharsPerLine && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);
    return lines;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/shelf-book-layout.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/shelfBookLayout.ts tests/unit/shelf-book-layout.test.ts
git commit -m "feat: add deterministic per-book shelf layout"
```

---

### Task 4: Shelf theme palettes

**Files:**
- Create: `src/components/written/shelfTheme.ts`
- Test: `tests/unit/shelf-theme.test.ts`

**Interfaces:**
- Produces: `type ShelfPalette = { background: string; fog: string; ambientLight: string; ambientIntensity: number; keyLight: string; keyLightIntensity: number; woodBase: string; woodGrainDark: string; woodGrainLight: string; ink: string }`, `const CLOTHBOUND_SPINE_COLORS: readonly string[]` (length 5), `function getShelfPalette(darkMode: boolean): ShelfPalette`. Later tasks (`BookMesh`, `Shelf`, `ShelfScene`, `CompleteShelf`) import all three.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/shelf-theme.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { CLOTHBOUND_SPINE_COLORS, getShelfPalette } from '../../src/components/written/shelfTheme';

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

test('exposes exactly five clothbound spine colors, each a valid hex value', () => {
    assert.equal(CLOTHBOUND_SPINE_COLORS.length, 5);
    CLOTHBOUND_SPINE_COLORS.forEach((color) => assert.match(color, HEX_PATTERN));
});

test('returns a distinct light and dark palette', () => {
    const light = getShelfPalette(false);
    const dark = getShelfPalette(true);
    assert.notEqual(light.background, dark.background);
    assert.match(light.woodBase, HEX_PATTERN);
    assert.match(dark.woodBase, HEX_PATTERN);
});

test('is stable for repeated calls with the same argument', () => {
    assert.deepEqual(getShelfPalette(true), getShelfPalette(true));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/shelf-theme.test.ts`
Expected: FAIL with a module-not-found error.

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/written/shelfTheme.ts
export type ShelfPalette = {
    background: string;
    fog: string;
    ambientLight: string;
    ambientIntensity: number;
    keyLight: string;
    keyLightIntensity: number;
    woodBase: string;
    woodGrainDark: string;
    woodGrainLight: string;
    ink: string;
};

export const CLOTHBOUND_SPINE_COLORS = [
    '#3a3a38',
    '#5c4632',
    '#efe7d8',
    '#3f5142',
    '#5e2a2a',
] as const;

const LIGHT_PALETTE: ShelfPalette = {
    background: '#fafaf7',
    fog: '#f2ede2',
    ambientLight: '#fff3e0',
    ambientIntensity: 0.65,
    keyLight: '#ffe9c7',
    keyLightIntensity: 1.1,
    woodBase: '#6b4a34',
    woodGrainDark: '#4a3223',
    woodGrainLight: '#8a6146',
    ink: '#241f1a',
};

const DARK_PALETTE: ShelfPalette = {
    background: '#15110d',
    fog: '#1c1611',
    ambientLight: '#3a2f22',
    ambientIntensity: 0.35,
    keyLight: '#caa26b',
    keyLightIntensity: 0.75,
    woodBase: '#3d2a1e',
    woodGrainDark: '#241811',
    woodGrainLight: '#54392a',
    ink: '#ece4d6',
};

export function getShelfPalette(darkMode: boolean): ShelfPalette {
    return darkMode ? DARK_PALETTE : LIGHT_PALETTE;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/shelf-theme.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/written/shelfTheme.ts tests/unit/shelf-theme.test.ts
git commit -m "feat: add light and dark shelf palettes"
```

---

### Task 5: Shelf navigation reducer and hook

**Files:**
- Create: `src/components/written/shelfNavReducer.ts`
- Create: `src/components/written/useShelfNavigation.ts`
- Test: `tests/unit/shelf-nav-reducer.test.ts`

**Interfaces:**
- Produces: `type ShelfNavState = { position: number; selectedIndex: number | null }`, `type ShelfNavAction = { type: 'step'; delta: number } | { type: 'jumpTo'; index: number } | { type: 'select'; index: number } | { type: 'returnToShelf' }`, `const INITIAL_SHELF_NAV: ShelfNavState`, `function shelfNavReduce(state: ShelfNavState, action: ShelfNavAction, bookCount: number): ShelfNavState`, and `function useShelfNavigation(bookCount: number): { position: number; selectedIndex: number | null; stepPosition: (delta: number) => void; jumpTo: (index: number) => void; selectBook: (index: number) => void; returnToShelf: () => void }`. `CompleteShelf.tsx` consumes `useShelfNavigation`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/shelf-nav-reducer.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_SHELF_NAV, shelfNavReduce } from '../../src/components/written/shelfNavReducer';

test('starts at position 0 with nothing selected', () => {
    assert.deepEqual(INITIAL_SHELF_NAV, { position: 0, selectedIndex: null });
});

test('steps the position forward and backward, clamped to the book range', () => {
    const stepped = shelfNavReduce(INITIAL_SHELF_NAV, { type: 'step', delta: 1 }, 5);
    assert.equal(stepped.position, 1);

    const clampedLow = shelfNavReduce(INITIAL_SHELF_NAV, { type: 'step', delta: -5 }, 5);
    assert.equal(clampedLow.position, 0);

    const clampedHigh = shelfNavReduce({ position: 4, selectedIndex: null }, { type: 'step', delta: 5 }, 5);
    assert.equal(clampedHigh.position, 4);
});

test('jumping to an index sets position without selecting', () => {
    const next = shelfNavReduce(INITIAL_SHELF_NAV, { type: 'jumpTo', index: 3 }, 5);
    assert.deepEqual(next, { position: 3, selectedIndex: null });
});

test('selecting a book sets both position and selectedIndex, clamped to range', () => {
    const next = shelfNavReduce(INITIAL_SHELF_NAV, { type: 'select', index: 2 }, 5);
    assert.deepEqual(next, { position: 2, selectedIndex: 2 });

    const outOfRange = shelfNavReduce(INITIAL_SHELF_NAV, { type: 'select', index: 99 }, 5);
    assert.deepEqual(outOfRange, { position: 4, selectedIndex: 4 });
});

test('returning to shelf clears the selection but keeps the position', () => {
    const selected = shelfNavReduce(INITIAL_SHELF_NAV, { type: 'select', index: 2 }, 5);
    const back = shelfNavReduce(selected, { type: 'returnToShelf' }, 5);
    assert.deepEqual(back, { position: 2, selectedIndex: null });
});

test('handles an empty shelf without throwing', () => {
    const next = shelfNavReduce(INITIAL_SHELF_NAV, { type: 'select', index: 0 }, 0);
    assert.deepEqual(next, { position: 0, selectedIndex: 0 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test tests/unit/shelf-nav-reducer.test.ts`
Expected: FAIL with a module-not-found error.

- [ ] **Step 3: Write the reducer implementation**

```typescript
// src/components/written/shelfNavReducer.ts
export type ShelfNavState = {
    position: number;
    selectedIndex: number | null;
};

export type ShelfNavAction =
    | { type: 'step'; delta: number }
    | { type: 'jumpTo'; index: number }
    | { type: 'select'; index: number }
    | { type: 'returnToShelf' };

export const INITIAL_SHELF_NAV: ShelfNavState = { position: 0, selectedIndex: null };

function clampToRange(value: number, bookCount: number): number {
    const maxIndex = Math.max(bookCount - 1, 0);
    return Math.min(Math.max(value, 0), maxIndex);
}

export function shelfNavReduce(state: ShelfNavState, action: ShelfNavAction, bookCount: number): ShelfNavState {
    switch (action.type) {
        case 'step':
            return { ...state, position: clampToRange(state.position + action.delta, bookCount) };
        case 'jumpTo':
            return { ...state, position: clampToRange(action.index, bookCount) };
        case 'select': {
            const index = clampToRange(action.index, bookCount);
            return { position: index, selectedIndex: index };
        }
        case 'returnToShelf':
            return { ...state, selectedIndex: null };
        default:
            return state;
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test tests/unit/shelf-nav-reducer.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Write the hook that wraps the reducer**

```typescript
// src/components/written/useShelfNavigation.ts
'use client';

import { useCallback, useState } from 'react';
import { INITIAL_SHELF_NAV, shelfNavReduce, type ShelfNavState } from './shelfNavReducer';

export type ShelfNavigation = {
    position: number;
    selectedIndex: number | null;
    stepPosition: (delta: number) => void;
    jumpTo: (index: number) => void;
    selectBook: (index: number) => void;
    returnToShelf: () => void;
};

export function useShelfNavigation(bookCount: number): ShelfNavigation {
    const [state, setState] = useState<ShelfNavState>(INITIAL_SHELF_NAV);

    const stepPosition = useCallback(
        (delta: number) => setState((current) => shelfNavReduce(current, { type: 'step', delta }, bookCount)),
        [bookCount],
    );
    const jumpTo = useCallback(
        (index: number) => setState((current) => shelfNavReduce(current, { type: 'jumpTo', index }, bookCount)),
        [bookCount],
    );
    const selectBook = useCallback(
        (index: number) => setState((current) => shelfNavReduce(current, { type: 'select', index }, bookCount)),
        [bookCount],
    );
    const returnToShelf = useCallback(
        () => setState((current) => shelfNavReduce(current, { type: 'returnToShelf' }, bookCount)),
        [bookCount],
    );

    return { ...state, stepPosition, jumpTo, selectBook, returnToShelf };
}
```

- [ ] **Step 6: Verify the hook file type-checks**

Run: `npm run typecheck`
Expected: passes with no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/written/shelfNavReducer.ts src/components/written/useShelfNavigation.ts tests/unit/shelf-nav-reducer.test.ts
git commit -m "feat: add shelf navigation reducer and hook"
```

---

### Task 6: Accessible book list and error boundary

**Files:**
- Create: `src/components/written/ShelfAccessibleList.tsx`
- Create: `src/components/written/ShelfErrorBoundary.tsx`

**Interfaces:**
- Consumes: `ShelfBook` from `src/lib/shelfBook.ts`.
- Produces: `function ShelfAccessibleList({ books, srOnly }: { books: ShelfBook[]; srOnly: boolean }): JSX.Element` and `class ShelfErrorBoundary extends Component<{ books: ShelfBook[]; children: ReactNode }>`. `CompleteShelf.tsx` renders both.

- [ ] **Step 1: Write `ShelfAccessibleList`**

```tsx
// src/components/written/ShelfAccessibleList.tsx
import Link from 'next/link';
import type { ShelfBook } from '@/lib/shelfBook';

type Props = {
    books: ShelfBook[];
    srOnly: boolean;
};

export default function ShelfAccessibleList({ books, srOnly }: Props) {
    return (
        <ul className={srOnly ? 'sr-only' : 'grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}>
            {books.map((book) => (
                <li key={book.id}>
                    <Link href={book.libraryHref} className="font-serif text-sm text-ed-fg hover:text-ed-accent">
                        {book.title}
                        {book.author ? ` — ${book.author}` : ''}
                    </Link>
                </li>
            ))}
        </ul>
    );
}
```

- [ ] **Step 2: Write `ShelfErrorBoundary`**

```tsx
// src/components/written/ShelfErrorBoundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import ShelfAccessibleList from './ShelfAccessibleList';
import type { ShelfBook } from '@/lib/shelfBook';

type Props = {
    books: ShelfBook[];
    children: ReactNode;
};

type State = {
    hasError: boolean;
};

export default class ShelfErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        console.error('Complete Shelf failed to render, falling back to a plain list.', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="rounded-md border border-ed-rule bg-ed-surface p-8">
                    <p className="mb-6 font-serif text-sm text-ed-fg-muted">
                        The 3D shelf could not load in this browser. Here is the full list of books.
                    </p>
                    <ShelfAccessibleList books={this.props.books} srOnly={false} />
                </div>
            );
        }
        return this.props.children;
    }
}
```

- [ ] **Step 3: Verify both files type-check**

Run: `npm run typecheck`
Expected: passes with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/written/ShelfAccessibleList.tsx src/components/written/ShelfErrorBoundary.tsx
git commit -m "feat: add accessible book list and shelf error boundary"
```

---

### Task 7: `BookMesh` component

**Files:**
- Create: `src/components/written/BookMesh.tsx`

**Interfaces:**
- Consumes: `ShelfBook` (Task 2), `BookLayout` + `wrapTextToLines` (Task 3), `ShelfPalette` (Task 4).
- Produces: `function BookMesh({ book, layout, palette, x, selected, onSelect }: { book: ShelfBook; layout: BookLayout; palette: ShelfPalette; x: number; selected: boolean; onSelect: () => void }): JSX.Element`. Consumed by `ShelfScene.tsx` (Task 9).

- [ ] **Step 1: Write the component**

```tsx
// src/components/written/BookMesh.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { wrapTextToLines, type BookLayout } from '@/lib/shelfBookLayout';
import type { ShelfBook } from '@/lib/shelfBook';
import type { ShelfPalette } from './shelfTheme';

const textureLoader = new THREE.TextureLoader();
const coverTextureCache = new Map<string, THREE.Texture>();

function loadCoverTexture(url: string, onLoad: (texture: THREE.Texture) => void, onError: () => void) {
    const cached = coverTextureCache.get(url);
    if (cached) {
        onLoad(cached);
        return;
    }
    textureLoader.load(
        url,
        (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            coverTextureCache.set(url, texture);
            onLoad(texture);
        },
        undefined,
        onError,
    );
}

function createCanvasTexture(
    draw: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void,
    width: number,
    height: number,
) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (context) draw(context, canvas);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function drawPlaceholderCover(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    title: string,
    spineColor: string,
    ink: string,
) {
    context.fillStyle = spineColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = ink;
    context.font = '600 40px "Roboto Slab", serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    const lines = wrapTextToLines(title, 16);
    const lineHeight = 52;
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => context.fillText(line, canvas.width / 2, startY + index * lineHeight));
}

function drawSpine(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    title: string,
    author: string | null,
    spineColor: string,
    ink: string,
) {
    context.fillStyle = spineColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = ink;
    context.globalAlpha = 0.5;
    context.lineWidth = 3;
    context.strokeRect(10, 24, canvas.width - 20, canvas.height - 48);
    context.globalAlpha = 1;

    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(Math.PI / 2);
    context.fillStyle = ink;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '600 34px "Roboto Slab", serif';
    context.fillText(title.toUpperCase(), 0, -18);
    if (author) {
        context.font = '400 22px "Roboto Slab", serif';
        context.globalAlpha = 0.75;
        context.fillText(author, 0, 22);
        context.globalAlpha = 1;
    }
    context.restore();
}

const INSPECT_ROTATION_Y = Math.PI / 2;
const INSPECT_PULL_Z = 0.5;
const ANIMATION_SPEED = 6;

type Props = {
    book: ShelfBook;
    layout: BookLayout;
    palette: ShelfPalette;
    x: number;
    selected: boolean;
    onSelect: () => void;
};

export default function BookMesh({ book, layout, palette, x, selected, onSelect }: Props) {
    const groupRef = useRef<THREE.Group>(null);
    const [coverTexture, setCoverTexture] = useState<THREE.Texture | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadCoverTexture(
            book.coverUrl,
            (texture) => {
                if (!cancelled) setCoverTexture(texture);
            },
            () => {
                if (!cancelled) {
                    setCoverTexture(
                        createCanvasTexture(
                            (context, canvas) => drawPlaceholderCover(context, canvas, book.title, layout.spineColor, palette.ink),
                            512,
                            768,
                        ),
                    );
                }
            },
        );
        return () => {
            cancelled = true;
        };
    }, [book.coverUrl, book.title, layout.spineColor, palette.ink]);

    const spineTexture = useMemo(
        () =>
            createCanvasTexture(
                (context, canvas) => drawSpine(context, canvas, book.title, book.author, layout.spineColor, palette.ink),
                128,
                1024,
            ),
        [book.title, book.author, layout.spineColor, palette.ink],
    );

    const materials = useMemo(() => {
        const coverMaterial = new THREE.MeshStandardMaterial(
            coverTexture ? { map: coverTexture } : { color: layout.spineColor },
        );
        const backMaterial = new THREE.MeshStandardMaterial({ color: layout.spineColor });
        const edgeMaterial = new THREE.MeshStandardMaterial({ color: '#efe7d8' });
        const spineMaterial = new THREE.MeshStandardMaterial({ map: spineTexture });
        return [coverMaterial, backMaterial, edgeMaterial, edgeMaterial, spineMaterial, backMaterial];
    }, [coverTexture, spineTexture, layout.spineColor]);

    useFrame((_, delta) => {
        const group = groupRef.current;
        if (!group) return;
        const targetZ = selected ? INSPECT_PULL_Z : 0;
        const targetRotationY = selected ? INSPECT_ROTATION_Y : 0;
        const lerpFactor = 1 - Math.exp(-ANIMATION_SPEED * delta);
        group.position.z += (targetZ - group.position.z) * lerpFactor;
        group.rotation.y += (targetRotationY - group.rotation.y) * lerpFactor;
    });

    const handleClick = (event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onSelect();
    };

    return (
        <group ref={groupRef} position={[x, layout.height / 2, 0]}>
            <mesh material={materials} onClick={handleClick}>
                <boxGeometry args={[layout.width, layout.height, layout.depth]} />
            </mesh>
        </group>
    );
}
```

- [ ] **Step 2: Verify the component type-checks**

Run: `npm run typecheck`
Expected: passes with no errors. If the `material={materials}` prop or `ThreeEvent` import reports a type mismatch, check the installed `@react-three/fiber` version's JSX augmentation for `mesh` and adjust the array typing (`THREE.Material[]`) accordingly — do not suppress with `any`.

- [ ] **Step 3: Commit**

```bash
git add src/components/written/BookMesh.tsx
git commit -m "feat: add BookMesh with real cover art and canvas-drawn spine"
```

---

### Task 8: `Shelf` component (walnut plank)

**Files:**
- Create: `src/components/written/Shelf.tsx`

**Interfaces:**
- Consumes: `ShelfPalette` (Task 4).
- Produces: `function Shelf({ palette, width }: { palette: ShelfPalette; width: number }): JSX.Element`. Consumed by `ShelfScene.tsx` (Task 9).

- [ ] **Step 1: Write the component**

```tsx
// src/components/written/Shelf.tsx
'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import type { ShelfPalette } from './shelfTheme';

function createWoodTexture(base: string, grainDark: string, grainLight: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) return new THREE.CanvasTexture(canvas);

    context.fillStyle = base;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let line = 0; line < 40; line += 1) {
        const y = (line / 40) * canvas.height + Math.sin(line) * 3;
        context.strokeStyle = line % 2 === 0 ? grainDark : grainLight;
        context.globalAlpha = 0.12 + (line % 5) * 0.03;
        context.lineWidth = 1 + (line % 3);
        context.beginPath();
        context.moveTo(0, y);
        context.bezierCurveTo(canvas.width / 3, y + 6, (canvas.width * 2) / 3, y - 6, canvas.width, y);
        context.stroke();
    }
    context.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

const SHELF_THICKNESS = 0.05;
const SHELF_DEPTH = 0.28;
const SHELF_MARGIN = 0.25;

type Props = {
    palette: ShelfPalette;
    width: number;
};

export default function Shelf({ palette, width }: Props) {
    const texture = useMemo(
        () => createWoodTexture(palette.woodBase, palette.woodGrainDark, palette.woodGrainLight),
        [palette.woodBase, palette.woodGrainDark, palette.woodGrainLight],
    );

    const shelfWidth = width + SHELF_MARGIN * 2;

    useMemo(() => {
        texture.repeat.set(shelfWidth / 0.4, 1);
    }, [texture, shelfWidth]);

    return (
        <mesh position={[width / 2, -SHELF_THICKNESS / 2, 0]}>
            <boxGeometry args={[shelfWidth, SHELF_THICKNESS, SHELF_DEPTH]} />
            <meshStandardMaterial map={texture} roughness={0.75} />
        </mesh>
    );
}
```

- [ ] **Step 2: Verify the component type-checks**

Run: `npm run typecheck`
Expected: passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/written/Shelf.tsx
git commit -m "feat: add procedural walnut shelf plank"
```

---

### Task 9: `ShelfScene` (camera rig and composition)

**Files:**
- Create: `src/components/written/ShelfScene.tsx`

**Interfaces:**
- Consumes: `ShelfBook` (Task 2), `getBookLayout` + `BookLayout` (Task 3), `ShelfPalette` + `CLOTHBOUND_SPINE_COLORS` (Task 4), `BookMesh` (Task 7), `Shelf` (Task 8).
- Produces: `function ShelfScene({ books, palette, position, selectedIndex, onSelect }: { books: ShelfBook[]; palette: ShelfPalette; position: number; selectedIndex: number | null; onSelect: (index: number) => void }): JSX.Element`. Rendered inside `<Canvas>` by `CompleteShelf.tsx` (Task 12).

- [ ] **Step 1: Write the component**

```tsx
// src/components/written/ShelfScene.tsx
'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import BookMesh from './BookMesh';
import Shelf from './Shelf';
import { CLOTHBOUND_SPINE_COLORS, type ShelfPalette } from './shelfTheme';
import { getBookLayout, type BookLayout } from '@/lib/shelfBookLayout';
import type { ShelfBook } from '@/lib/shelfBook';

const BOOK_GAP = 0.02;
const BROWSE_CAMERA_HEIGHT = 0.32;
const BROWSE_CAMERA_DISTANCE = 0.85;
const INSPECT_CAMERA_DISTANCE = 0.55;
const CAMERA_LERP_SPEED = 4;

type BookSlot = { book: ShelfBook; layout: BookLayout; x: number };

function layoutBooks(books: ShelfBook[]): BookSlot[] {
    let cursor = 0;
    return books.map((book) => {
        const layout = getBookLayout(book.id, CLOTHBOUND_SPINE_COLORS);
        const x = cursor + layout.width / 2;
        cursor += layout.width + BOOK_GAP;
        return { book, layout, x };
    });
}

type CameraRigProps = { targetX: number; selected: boolean };

function CameraRig({ targetX, selected }: CameraRigProps) {
    const { camera } = useThree();
    const targetPosition = useRef(new THREE.Vector3());
    const targetLookAt = useRef(new THREE.Vector3());

    useFrame((_, delta) => {
        if (selected) {
            targetPosition.current.set(targetX, BROWSE_CAMERA_HEIGHT, INSPECT_CAMERA_DISTANCE);
        } else {
            targetPosition.current.set(targetX, BROWSE_CAMERA_HEIGHT, BROWSE_CAMERA_DISTANCE);
        }
        targetLookAt.current.set(targetX, BROWSE_CAMERA_HEIGHT, 0);

        const lerpFactor = 1 - Math.exp(-CAMERA_LERP_SPEED * delta);
        camera.position.lerp(targetPosition.current, lerpFactor);
        if (!selected) {
            camera.lookAt(targetLookAt.current);
        }
    });

    return null;
}

type Props = {
    books: ShelfBook[];
    palette: ShelfPalette;
    position: number;
    selectedIndex: number | null;
    onSelect: (index: number) => void;
};

export default function ShelfScene({ books, palette, position, selectedIndex, onSelect }: Props) {
    const slots = useMemo(() => layoutBooks(books), [books]);
    const lastSlot = slots[slots.length - 1];
    const shelfWidth = lastSlot ? lastSlot.x + lastSlot.layout.width / 2 : 0;
    const nearestIndex = Math.min(Math.max(Math.round(position), 0), Math.max(slots.length - 1, 0));
    const targetSlot = slots[nearestIndex];

    return (
        <>
            <color attach="background" args={[palette.background]} />
            <fog attach="fog" args={[palette.fog, 1.2, 3.4]} />
            <ambientLight color={palette.ambientLight} intensity={palette.ambientIntensity} />
            <directionalLight color={palette.keyLight} intensity={palette.keyLightIntensity} position={[0.6, 1.2, 1]} />
            <Shelf palette={palette} width={shelfWidth} />
            {slots.map((slot, index) => (
                <BookMesh
                    key={slot.book.id}
                    book={slot.book}
                    layout={slot.layout}
                    palette={palette}
                    x={slot.x}
                    selected={selectedIndex === index}
                    onSelect={() => onSelect(index)}
                />
            ))}
            <CameraRig targetX={targetSlot ? targetSlot.x : 0} selected={selectedIndex !== null} />
            {selectedIndex !== null && (
                <OrbitControls
                    makeDefault
                    enablePan={false}
                    minDistance={INSPECT_CAMERA_DISTANCE * 0.7}
                    maxDistance={INSPECT_CAMERA_DISTANCE * 1.6}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 1.7}
                    target={[targetSlot ? targetSlot.x : 0, BROWSE_CAMERA_HEIGHT, 0]}
                />
            )}
        </>
    );
}
```

- [ ] **Step 2: Verify the component type-checks**

Run: `npm run typecheck`
Expected: passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/written/ShelfScene.tsx
git commit -m "feat: add shelf scene composition and camera rig"
```

---

### Task 10: `ShelfOverlay` (browse controls)

**Files:**
- Create: `src/components/written/ShelfOverlay.tsx`

**Interfaces:**
- Consumes: `ShelfBook` (Task 2).
- Produces: `function ShelfOverlay({ books, position, selectedIndex, onStep, onSelect, onReturnToShelf }: { books: ShelfBook[]; position: number; selectedIndex: number | null; onStep: (delta: number) => void; onSelect: (index: number) => void; onReturnToShelf: () => void }): JSX.Element`. Exposes `data-testid="shelf-current-title"` and `data-testid="shelf-marker-${book.id}"` for e2e coverage (Task 14). Rendered by `CompleteShelf.tsx` (Task 12).

- [ ] **Step 1: Write the component**

```tsx
// src/components/written/ShelfOverlay.tsx
'use client';

import { ChevronLeft, ChevronRight, Undo2 } from 'lucide-react';
import type { ShelfBook } from '@/lib/shelfBook';

type Props = {
    books: ShelfBook[];
    position: number;
    selectedIndex: number | null;
    onStep: (delta: number) => void;
    onSelect: (index: number) => void;
    onReturnToShelf: () => void;
};

export default function ShelfOverlay({ books, position, selectedIndex, onStep, onSelect, onReturnToShelf }: Props) {
    const nearestIndex = Math.min(Math.max(Math.round(position), 0), Math.max(books.length - 1, 0));
    const currentBook = books[nearestIndex];

    return (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-3 px-4">
            {selectedIndex !== null ? (
                <button
                    type="button"
                    onClick={onReturnToShelf}
                    className="archive-button archive-button-secondary pointer-events-auto"
                >
                    <Undo2 className="h-4 w-4" />
                    Back to shelf
                </button>
            ) : (
                <>
                    <p aria-live="polite" data-testid="shelf-current-title" className="font-serif text-sm text-ed-fg-muted">
                        {currentBook?.title ?? ''}
                    </p>
                    <div className="pointer-events-auto flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => onStep(-1)}
                            aria-label="Previous book"
                            className="rounded-full border border-ed-rule bg-ed-surface p-2 hover:border-ed-accent"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-2">
                            {books.map((book, index) => (
                                <button
                                    key={book.id}
                                    type="button"
                                    onClick={() => onSelect(index)}
                                    aria-label={`Inspect ${book.title}`}
                                    data-testid={`shelf-marker-${book.id}`}
                                    className={`h-2 w-2 rounded-full transition-colors ${
                                        index === nearestIndex ? 'bg-ed-accent' : 'bg-ed-rule-strong'
                                    }`}
                                />
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={() => onStep(1)}
                            aria-label="Next book"
                            className="rounded-full border border-ed-rule bg-ed-surface p-2 hover:border-ed-accent"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Verify the component type-checks**

Run: `npm run typecheck`
Expected: passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/written/ShelfOverlay.tsx
git commit -m "feat: add shelf browse overlay controls"
```

---

### Task 11: `InspectPanel`

**Files:**
- Create: `src/components/written/InspectPanel.tsx`

**Interfaces:**
- Consumes: `ShelfBook` (Task 2), `framer-motion` (existing dependency).
- Produces: `function InspectPanel({ book, onClose }: { book: ShelfBook | null; onClose: () => void }): JSX.Element`. Exposes `data-testid="inspect-panel"` for e2e coverage (Task 14). Rendered by `CompleteShelf.tsx` (Task 12).

- [ ] **Step 1: Write the component**

```tsx
// src/components/written/InspectPanel.tsx
'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import type { ShelfBook } from '@/lib/shelfBook';

type Props = {
    book: ShelfBook | null;
    onClose: () => void;
};

export default function InspectPanel({ book, onClose }: Props) {
    return (
        <AnimatePresence>
            {book && (
                <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="pointer-events-auto absolute right-4 top-4 w-[min(320px,80vw)] rounded-md border border-ed-rule bg-ed-surface/95 p-6 shadow-lg backdrop-blur"
                    data-testid="inspect-panel"
                >
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close inspection view"
                        className="absolute right-4 top-4 text-ed-fg-muted hover:text-ed-fg"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <p className="archive-kicker text-ed-fg-muted">Now inspecting</p>
                    <h3 className="mt-3 font-display text-xl text-ed-fg">{book.title}</h3>
                    {book.author && <p className="mt-1 text-sm text-ed-fg-muted">{book.author}</p>}
                    <Link href={book.libraryHref} className="archive-button archive-button-primary mt-6">
                        Read
                        <ArrowUpRight className="h-4 w-4" />
                    </Link>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
```

- [ ] **Step 2: Verify the component type-checks**

Run: `npm run typecheck`
Expected: passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/written/InspectPanel.tsx
git commit -m "feat: add book inspect panel"
```

---

### Task 12: `CompleteShelf` (top-level composition)

**Files:**
- Create: `src/components/written/CompleteShelf.tsx`

**Interfaces:**
- Consumes: `ShelfBook` (Task 2), `useShelfNavigation` (Task 5), `ShelfAccessibleList` + `ShelfErrorBoundary` (Task 6), `ShelfScene` (Task 9), `ShelfOverlay` (Task 10), `InspectPanel` (Task 11), `getShelfPalette` (Task 4), `useTheme` from `src/components/providers/ThemeProvider.tsx` (existing).
- Produces: `function CompleteShelf({ books }: { books: ShelfBook[] }): JSX.Element | null`. Consumed by `src/app/written/page.tsx` (Task 13) via `next/dynamic` with `ssr: false`.

- [ ] **Step 1: Write the component**

```tsx
// src/components/written/CompleteShelf.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useShelfNavigation } from './useShelfNavigation';
import { getShelfPalette } from './shelfTheme';
import ShelfScene from './ShelfScene';
import ShelfOverlay from './ShelfOverlay';
import InspectPanel from './InspectPanel';
import ShelfAccessibleList from './ShelfAccessibleList';
import ShelfErrorBoundary from './ShelfErrorBoundary';
import type { ShelfBook } from '@/lib/shelfBook';

const DRAG_SENSITIVITY = 0.012;
const WHEEL_SENSITIVITY = 0.0025;

type Props = {
    books: ShelfBook[];
};

export default function CompleteShelf({ books }: Props) {
    const { darkMode } = useTheme();
    const palette = getShelfPalette(darkMode);
    const nav = useShelfNavigation(books.length);
    const dragOrigin = useRef<{ x: number; position: number } | null>(null);

    const handlePointerDown = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            if (nav.selectedIndex !== null) return;
            dragOrigin.current = { x: event.clientX, position: nav.position };
            event.currentTarget.setPointerCapture(event.pointerId);
        },
        [nav.position, nav.selectedIndex],
    );

    const handlePointerMove = useCallback(
        (event: ReactPointerEvent<HTMLDivElement>) => {
            const origin = dragOrigin.current;
            if (!origin) return;
            const deltaPixels = event.clientX - origin.x;
            nav.jumpTo(origin.position - deltaPixels * DRAG_SENSITIVITY);
        },
        [nav],
    );

    const handlePointerUp = useCallback(() => {
        dragOrigin.current = null;
    }, []);

    const handleWheel = useCallback(
        (event: ReactWheelEvent<HTMLDivElement>) => {
            if (nav.selectedIndex !== null) return;
            nav.stepPosition(event.deltaY * WHEEL_SENSITIVITY);
        },
        [nav],
    );

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'ArrowLeft') {
                nav.stepPosition(-1);
            } else if (event.key === 'ArrowRight') {
                nav.stepPosition(1);
            } else if (event.key === 'Escape' && nav.selectedIndex !== null) {
                nav.returnToShelf();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nav]);

    const selectedBook = useMemo(
        () => (nav.selectedIndex !== null ? books[nav.selectedIndex] ?? null : null),
        [books, nav.selectedIndex],
    );

    if (books.length === 0) return null;

    return (
        <div className="relative h-[70vh] min-h-[420px] w-full overflow-hidden rounded-md border border-ed-rule">
            <ShelfErrorBoundary books={books}>
                <div
                    className="h-full w-full touch-none"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onWheel={handleWheel}
                >
                    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.32, 0.85], fov: 35 }}>
                        <ShelfScene
                            books={books}
                            palette={palette}
                            position={nav.position}
                            selectedIndex={nav.selectedIndex}
                            onSelect={nav.selectBook}
                        />
                    </Canvas>
                </div>
                <div className="pointer-events-none absolute inset-0">
                    <ShelfOverlay
                        books={books}
                        position={nav.position}
                        selectedIndex={nav.selectedIndex}
                        onStep={nav.stepPosition}
                        onSelect={nav.selectBook}
                        onReturnToShelf={nav.returnToShelf}
                    />
                    <InspectPanel book={selectedBook} onClose={nav.returnToShelf} />
                </div>
            </ShelfErrorBoundary>
            <ShelfAccessibleList books={books} srOnly />
        </div>
    );
}
```

- [ ] **Step 2: Verify the component type-checks**

Run: `npm run typecheck`
Expected: passes with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/written/CompleteShelf.tsx
git commit -m "feat: compose the complete shelf experience"
```

---

### Task 13: Wire into `/written`

**Files:**
- Modify: `src/app/written/page.tsx:71-98`

**Interfaces:**
- Consumes: `mapBookToShelfBook` (Task 2), `CompleteShelf` (Task 12) via `next/dynamic`.

- [ ] **Step 1: Replace the grid markup with the dynamically-imported shelf**

Add near the top of `src/app/written/page.tsx`, alongside the other imports:

```tsx
import dynamic from 'next/dynamic';
import { mapBookToShelfBook } from '@/lib/shelfBook';

const CompleteShelf = dynamic(() => import('@/components/written/CompleteShelf'), { ssr: false });
```

Inside `WrittenArchivePage`, after `const books = booksData...` (existing sort logic stays untouched), add:

```tsx
const shelfBooks = books.map((book) =>
    mapBookToShelfBook({
        id: book.id,
        title: book.title,
        author: book.author,
        thumbnailOverride: book.thumbnailOverride,
    }),
);
```

Replace lines 71-98 (the `<div className="grid grid-cols-2 gap-6 ...">...</div>` grid) with:

```tsx
<CompleteShelf books={shelfBooks} />
```

The surrounding `<section aria-labelledby="featured-books">` wrapper and its `<h2 id="featured-books">Books & Publications</h2>` heading stay exactly as they are — the accessible region name the existing e2e test depends on is unchanged.

- [ ] **Step 2: Verify the page still type-checks and lints**

Run: `npm run typecheck && npm run lint`
Expected: both pass with no errors.

- [ ] **Step 3: Start the dev server and verify manually in the browser**

Run: `npm run dev`, then open `http://localhost:3000/written`.

Check:
- The "Books & Publications" section shows a 3D canvas with a row of book spines instead of the flat grid.
- Dragging, scrolling, and the left/right arrow keys move along the shelf; the caption text under the shelf updates to the nearest book's title.
- Clicking a position marker (or a book's spine) pulls that book forward, rotates it to reveal its real cover art, and opens the inspect panel with the correct title/author and a working "Read" link.
- "Back to shelf" and `Escape` return to the browse view.
- Toggling the site's dark/light mode switch changes the shelf's background and wood tones.

If the front cover is not what's visible after selecting a book (i.e. a side or back face shows instead), flip the sign of `INSPECT_ROTATION_Y` in `src/components/written/BookMesh.tsx` and re-check.

- [ ] **Step 4: Commit**

```bash
git add src/app/written/page.tsx
git commit -m "feat: replace the books grid with the complete shelf on /written"
```

---

### Task 14: End-to-end coverage

**Files:**
- Create: `tests/e2e/complete-shelf.spec.ts`
- Verify (no change expected): `tests/e2e/archive-flows.spec.ts`

**Interfaces:**
- Consumes: `data-testid="shelf-current-title"`, `data-testid="shelf-marker-${id}"`, `data-testid="inspect-panel"` (Tasks 10-11), the region name `"Books & Publications"` (existing, unchanged).

- [ ] **Step 1: Write the new e2e spec**

```typescript
// tests/e2e/complete-shelf.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Complete Shelf', () => {
    test('renders the 3D canvas and keeps every book reachable as a real link', async ({ page }) => {
        await page.goto('/written');
        const shelf = page.getByRole('region', { name: 'Books & Publications' });
        await expect(shelf.locator('canvas')).toBeVisible();
        await expect(shelf.locator('a[href^="/library/"]')).toHaveCount(13);
    });

    test('arrow keys move the browse caption between books', async ({ page }) => {
        await page.goto('/written');
        const caption = page.getByTestId('shelf-current-title');
        const initial = await caption.textContent();
        await page.keyboard.press('ArrowRight');
        await expect(caption).not.toHaveText(initial ?? '');
    });

    test('selecting a position marker opens the inspect panel with the right Read link', async ({ page }) => {
        await page.goto('/written');
        await page.getByTestId('shelf-marker-computer-speaks').click();
        const panel = page.getByTestId('inspect-panel');
        await expect(panel).toBeVisible();
        await expect(panel.getByRole('link', { name: /Read/ })).toHaveAttribute('href', '/library/computer-speaks');
    });

    test('back to shelf closes the inspect panel', async ({ page }) => {
        await page.goto('/written');
        await page.getByTestId('shelf-marker-computer-speaks').click();
        await expect(page.getByTestId('inspect-panel')).toBeVisible();
        await page.getByRole('button', { name: 'Back to shelf' }).click();
        await expect(page.getByTestId('inspect-panel')).toBeHidden();
    });
});
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test tests/e2e/complete-shelf.spec.ts`
Expected: PASS (4 tests)

- [ ] **Step 3: Confirm the existing archive-flows spec still passes unchanged**

Run: `npx playwright test tests/e2e/archive-flows.spec.ts`
Expected: PASS. The `written archive prioritizes books and exposes every newsletter issue` test should still see the same 10 `/library/...` hrefs in the same order, now coming from `ShelfAccessibleList` instead of the old grid.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/complete-shelf.spec.ts
git commit -m "test: add e2e coverage for the complete shelf"
```

---

### Task 15: Register unit tests and run full verification

**Files:**
- Modify: `package.json:12`

**Interfaces:**
- None (final integration task).

- [ ] **Step 1: Add the four new unit test files to the `test:unit` script**

Update the `test:unit` script in `package.json` to include the new files:

```json
"test:unit": "node --import tsx --test tests/unit/search-nav-reducer.test.ts tests/unit/search-query.test.ts tests/unit/media-assets.test.ts tests/unit/transcript-utils.test.ts tests/unit/web-vitals.test.ts tests/unit/next-config-redirects.test.ts tests/unit/shelf-book.test.ts tests/unit/shelf-book-layout.test.ts tests/unit/shelf-theme.test.ts tests/unit/shelf-nav-reducer.test.ts tests/integration/catalog.test.ts",
```

- [ ] **Step 2: Run the full unit suite**

Run: `npm run test:unit`
Expected: PASS, including all four new shelf test files.

- [ ] **Step 3: Run lint, typecheck, and the production build**

Run: `npm run lint && npm run typecheck && npm run build`
Expected: all three pass with no errors.

- [ ] **Step 4: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: PASS, including `complete-shelf.spec.ts` and the unmodified `archive-flows.spec.ts`.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "test: register complete shelf unit tests in the test:unit script"
```
