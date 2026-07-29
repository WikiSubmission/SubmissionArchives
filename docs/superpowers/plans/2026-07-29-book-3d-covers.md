# Book 3D Covers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat cover images in the "Books & Publications" grid on `/written` with book covers rendered as tilted 3D cuboids (real front cover art, procedural spine/edge faces), using only CSS 3D transforms and Framer Motion — no WebGL, no new runtime dependency.

**Architecture:** A build-time script samples each book cover's average color with `sharp` and writes a generated color map next to the site's other generated indices. A pure `bookSpineStyle.ts` module turns a base color into a spine gradient and readable ink color. A single client component, `Book3DCover`, owns the whole grid item (the link, the 3D cuboid, the caption) so hover/focus state and the animated tilt live in one place with no event-bubbling ambiguity. `written/page.tsx` swaps its current flat `<Link>` block for this component per book, keeping the newsletter section, the accessible link structure, and href order untouched.

**Tech Stack:** Next.js 16 / React 19 (existing), `framer-motion` (existing), `sharp` (existing), `node:test` + `tsx` (existing unit test runner), Playwright (existing e2e runner).

## Global Constraints

- No new runtime dependency — specifically no `three`/`@react-three/*`. (Spec decision 4.)
- `prefers-reduced-motion` must disable the hover/focus tilt animation entirely; cards keep their static resting tilt. (Spec: Interaction model.)
- Spine/edge colors are extracted at build time per book, not hand-picked, not uniform, and not theme-dependent. (Spec decision 5, Visual design.)
- No changes to the "Submitters Perspectives" newsletter section, the homepage widget (`WrittenArchiveVisual.tsx`), or `/library/[id]`. (Spec: Out of scope.)
- The existing e2e assertion that `/written`'s "Books & Publications" region exposes exactly these 10 book hrefs in this order must keep passing unchanged: `tests/e2e/archive-flows.spec.ts:17-44`.
- Conventional commits, no co-author line, no em-dashes or AI-cliché phrasing in commit messages or code comments.

---

### Task 1: Build-time spine color extraction

**Files:**
- Create: `scripts/generate/extract-book-spine-colors.mjs`
- Modify: `package.json` (add `generate:book-spine-colors` script)
- Generated (not hand-written): `public/data/generated_indices/BOOK_SPINE_COLORS.json`

**Interfaces:**
- Produces: `public/data/generated_indices/BOOK_SPINE_COLORS.json`, a `{ [bookId: string]: string /* "#rrggbb" */ }` map covering every `BOOKS_LIST.json` entry with `category === 'Books'` and a `thumbnailOverride`. Task 4 imports this file directly.

- [ ] **Step 1: Write the script**

```javascript
// scripts/generate/extract-book-spine-colors.mjs
//
// Samples each book cover's average color at build time so the 3D cuboid's
// spine and edge faces can be color-matched to cover art that has no
// separate spine or back-cover photography.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BOOKS_LIST_PATH = path.join(ROOT, 'public', 'data', 'generated_indices', 'BOOKS_LIST.json');
const OUTPUT_PATH = path.join(ROOT, 'public', 'data', 'generated_indices', 'BOOK_SPINE_COLORS.json');

function toHex(channel) {
  return Math.round(channel).toString(16).padStart(2, '0');
}

async function averageColorHex(imagePath) {
  const { data } = await sharp(imagePath).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function main() {
  const books = JSON.parse(fs.readFileSync(BOOKS_LIST_PATH, 'utf8')).filter(
    (book) => book.category === 'Books' && book.thumbnailOverride,
  );

  const colors = {};
  for (const book of books) {
    const imagePath = path.join(ROOT, 'public', book.thumbnailOverride);
    colors[book.id] = await averageColorHex(imagePath);
    console.log(`${book.id}: ${colors[book.id]}`);
  }

  const sorted = Object.fromEntries(Object.entries(colors).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log('wrote', path.relative(ROOT, OUTPUT_PATH));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Add the npm script**

In `package.json`, next to the existing `"generate:book-thumbnails"` entry:

```json
"generate:book-spine-colors": "node scripts/generate/extract-book-spine-colors.mjs",
```

- [ ] **Step 3: Run it and verify the output**

Run: `npm run generate:book-spine-colors`

Expected: 13 lines logged (one per book id, each with a `#rrggbb` value), then `wrote public/data/generated_indices/BOOK_SPINE_COLORS.json`. Open the generated file and confirm it has exactly 13 keys, each a 7-character hex string, matching the 13 ids in `BOOKS_LIST.json` with `category === 'Books'`.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate/extract-book-spine-colors.mjs package.json public/data/generated_indices/BOOK_SPINE_COLORS.json
git commit -m "feat: generate per-book spine colors from cover art"
```

---

### Task 2: Spine palette pure functions (TDD)

**Files:**
- Create: `src/components/written/bookSpineStyle.ts`
- Test: `tests/unit/book-spine-style.test.ts`
- Modify: `package.json` (`test:unit` script — add the new test file)

**Interfaces:**
- Consumes: nothing (pure module, no dependencies on other tasks).
- Produces: `getBookSpinePalette(baseColorHex: string): { spineGradient: string; textColor: string }`, `PAGE_EDGE_GRADIENT: string`, `FALLBACK_SPINE_COLOR: string`. Task 3 (`Book3DCover.tsx`) and Task 4 (`written/page.tsx`) both import from this module.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/book-spine-style.test.ts
import assert from 'node:assert/strict';
import test from 'node:test';
import { FALLBACK_SPINE_COLOR, PAGE_EDGE_GRADIENT, getBookSpinePalette } from '../../src/components/written/bookSpineStyle';

test('produces a three-stop gradient that includes the base color', () => {
    const { spineGradient } = getBookSpinePalette('#3a6ea5');
    assert.match(spineGradient, /^linear-gradient\(100deg, #[0-9a-f]{6} 0%, #3a6ea5 45%, #[0-9a-f]{6} 100%\)$/);
});

test('picks dark ink for a near-white base color', () => {
    const { textColor } = getBookSpinePalette('#f5f2ea');
    assert.equal(textColor, '#1a1208');
});

test('picks light ink for a near-black base color', () => {
    const { textColor } = getBookSpinePalette('#0a0a0a');
    assert.equal(textColor, '#f5f0e6');
});

test('is deterministic for the same input', () => {
    const first = getBookSpinePalette('#7a3b3b');
    const second = getBookSpinePalette('#7a3b3b');
    assert.deepEqual(first, second);
});

test('exposes a fixed page-edge gradient and fallback color', () => {
    assert.match(PAGE_EDGE_GRADIENT, /^repeating-linear-gradient\(/);
    assert.match(FALLBACK_SPINE_COLOR, /^#[0-9a-f]{6}$/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx --test tests/unit/book-spine-style.test.ts`
Expected: FAIL — cannot find module `../../src/components/written/bookSpineStyle`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/components/written/bookSpineStyle.ts
//
// Turns one sampled cover color into the CSS needed for a book's procedural
// spine and top/bottom edge faces, since none of the site's books have real
// spine or back-cover photography.
interface Rgb {
    r: number;
    g: number;
    b: number;
}

export interface BookSpinePalette {
    spineGradient: string;
    textColor: string;
}

export const PAGE_EDGE_GRADIENT =
    'repeating-linear-gradient(90deg, #ede4cd 0px, #ede4cd 1px, #d9cbaa 1px, #d9cbaa 2px)';

// Matches --ed-accent-soft (light theme) in globals.css; used when a book id
// is missing from the generated spine-color map.
export const FALLBACK_SPINE_COLOR = '#525252';

function hexToRgb(hex: string): Rgb {
    const value = parseInt(hex.replace('#', ''), 16);
    return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
    };
}

function rgbToHex({ r, g, b }: Rgb): string {
    const channelHex = (channel: number) =>
        Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0');
    return `#${channelHex(r)}${channelHex(g)}${channelHex(b)}`;
}

function mix(base: Rgb, target: Rgb, amount: number): Rgb {
    return {
        r: base.r + (target.r - base.r) * amount,
        g: base.g + (target.g - base.g) * amount,
        b: base.b + (target.b - base.b) * amount,
    };
}

function relativeLuminance({ r, g, b }: Rgb): number {
    const channel = (value: number) => {
        const normalized = value / 255;
        return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function getBookSpinePalette(baseColorHex: string): BookSpinePalette {
    const base = hexToRgb(baseColorHex);
    const highlight = rgbToHex(mix(base, { r: 255, g: 255, b: 255 }, 0.22));
    const shadow = rgbToHex(mix(base, { r: 0, g: 0, b: 0 }, 0.3));

    return {
        spineGradient: `linear-gradient(100deg, ${highlight} 0%, ${baseColorHex} 45%, ${shadow} 100%)`,
        textColor: relativeLuminance(base) > 0.4 ? '#1a1208' : '#f5f0e6',
    };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --import tsx --test tests/unit/book-spine-style.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Add the test to the tracked unit test list**

In `package.json`, append `tests/unit/book-spine-style.test.ts` to the `test:unit` script's file list (after `tests/unit/mint-api.test.ts`, before `tests/integration/catalog.test.ts`).

Run: `npm run test:unit`
Expected: all existing tests plus the 5 new ones pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/written/bookSpineStyle.ts tests/unit/book-spine-style.test.ts package.json
git commit -m "feat: add pure spine palette derivation for book covers"
```

---

### Task 3: `Book3DCover` component

**Files:**
- Create: `src/components/written/Book3DCover.tsx`

**Interfaces:**
- Consumes: `getBookSpinePalette`, `PAGE_EDGE_GRADIENT` from `./bookSpineStyle` (Task 2).
- Produces: `Book3DCover` React component with props `{ href: string; coverSrc: string | null; coverAlt: string; title: string; author?: string; spineColor: string; sizes: string }`. Task 4 renders this in place of the current flat grid item.

- [ ] **Step 1: Write the component**

```tsx
// src/components/written/Book3DCover.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';

import { getBookSpinePalette, PAGE_EDGE_GRADIENT } from './bookSpineStyle';

interface Book3DCoverProps {
    href: string;
    coverSrc: string | null;
    coverAlt: string;
    title: string;
    author?: string;
    spineColor: string;
    sizes: string;
}

const REST_TILT = { rotateY: -16, rotateX: 2 };
const HOVER_TILT = { rotateY: -34, rotateX: 3 };
const SPRING_TRANSITION = { type: 'spring' as const, stiffness: 220, damping: 22 };
const NO_TRANSITION = { duration: 0 };

export function Book3DCover({ href, coverSrc, coverAlt, title, author, spineColor, sizes }: Book3DCoverProps) {
    const [isActive, setIsActive] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const { spineGradient, textColor } = getBookSpinePalette(spineColor);
    const tilt = !prefersReducedMotion && isActive ? HOVER_TILT : REST_TILT;
    const shadowActive = !prefersReducedMotion && isActive;

    return (
        <Link
            href={href}
            className="group flex flex-col gap-3"
            onPointerEnter={() => setIsActive(true)}
            onPointerLeave={() => setIsActive(false)}
            onFocus={() => setIsActive(true)}
            onBlur={() => setIsActive(false)}
        >
            <div className="relative aspect-[2/3] w-full [perspective:1200px]">
                <motion.div
                    className="relative h-full w-full [transform-style:preserve-3d]"
                    animate={tilt}
                    transition={prefersReducedMotion ? NO_TRANSITION : SPRING_TRANSITION}
                >
                    <div className="absolute inset-0 overflow-hidden rounded-md border border-ed-rule bg-ed-surface [transform:translateZ(7px)]">
                        {coverSrc ? (
                            <Image src={coverSrc} alt={coverAlt} fill className="object-cover" sizes={sizes} />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-ed-surface text-ed-fg-muted">
                                <span className="font-serif text-sm">No Cover</span>
                            </div>
                        )}
                    </div>

                    <div
                        className="absolute inset-y-0 left-0 w-[14px] origin-left [transform:rotateY(-90deg)]"
                        style={{ background: spineGradient }}
                    >
                        <span
                            className="absolute inset-0 flex items-center justify-center overflow-hidden whitespace-nowrap text-center font-mono text-[6px] uppercase tracking-wide [writing-mode:vertical-rl]"
                            style={{ color: textColor }}
                        >
                            {title}
                        </span>
                    </div>

                    <div
                        className="absolute inset-x-0 top-0 h-[14px] origin-top [transform:rotateX(90deg)]"
                        style={{ background: PAGE_EDGE_GRADIENT }}
                    />
                    <div
                        className="absolute inset-x-0 bottom-0 h-[14px] origin-bottom [transform:rotateX(-90deg)]"
                        style={{ background: PAGE_EDGE_GRADIENT }}
                    />
                </motion.div>

                <motion.div
                    className="absolute inset-x-4 -bottom-2 h-3 rounded-full bg-black/30 blur-md"
                    animate={{ opacity: shadowActive ? 0.45 : 0.25, scale: shadowActive ? 1.08 : 1 }}
                    transition={prefersReducedMotion ? NO_TRANSITION : { duration: 0.3 }}
                />
            </div>

            <div>
                <h3 className="font-serif text-sm font-medium text-ed-fg group-hover:text-ed-accent line-clamp-2">
                    {title}
                </h3>
                {author && <p className="mt-1 text-xs text-ed-fg-muted">{author}</p>}
            </div>
        </Link>
    );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/written/Book3DCover.tsx
git commit -m "feat: add Book3DCover component with tilt-and-reveal interaction"
```

---

### Task 4: Wire `Book3DCover` into the `/written` grid

**Files:**
- Modify: `src/app/written/page.tsx:1-9` (imports), `src/app/written/page.tsx:71-99` (book grid block)

**Interfaces:**
- Consumes: `Book3DCover` (Task 3), `FALLBACK_SPINE_COLOR` (Task 2), `Reveal` (`src/components/home/Reveal.tsx`, existing), `BOOK_SPINE_COLORS.json` (Task 1).

- [ ] **Step 1: Add imports**

At the top of `src/app/written/page.tsx`, alongside the existing imports:

```typescript
import bookSpineColors from '../../../public/data/generated_indices/BOOK_SPINE_COLORS.json';
import { Book3DCover } from '@/components/written/Book3DCover';
import { FALLBACK_SPINE_COLOR } from '@/components/written/bookSpineStyle';
import { Reveal } from '@/components/home/Reveal';
```

- [ ] **Step 2: Replace the book grid block**

Replace lines 71-99 (the `<div className="grid grid-cols-2 gap-6 ...">` block and its `.map`) with:

```tsx
<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
    {books.map((book, index) => (
        <Reveal key={book.id} delay={index * 60}>
            <Book3DCover
                href={`/library/${book.id}`}
                coverSrc={book.thumbnailOverride ? getPublicAssetUrl(book.thumbnailOverride) : null}
                coverAlt={`Cover of ${book.title}`}
                title={book.title}
                author={book.author}
                spineColor={(bookSpineColors as Record<string, string>)[book.id] ?? FALLBACK_SPINE_COLOR}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
        </Reveal>
    ))}
</div>
```

- [ ] **Step 3: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Confirm the existing archive e2e test still passes**

Run: `npx playwright test tests/e2e/archive-flows.spec.ts -g "written archive prioritizes books"`
Expected: PASS — the "Books & Publications" region still exposes the same 10 leading hrefs in the same order.

- [ ] **Step 5: Commit**

```bash
git add src/app/written/page.tsx
git commit -m "feat: render written archive books as 3D covers"
```

---

### Task 5: e2e coverage for the tilt-and-reveal interaction

**Files:**
- Create: `tests/e2e/book-3d-covers.spec.ts`

- [ ] **Step 1: Write the test**

```typescript
// tests/e2e/book-3d-covers.spec.ts
import { expect, test } from '@playwright/test';

test('written archive books render at a resting tilt and deepen it on hover', async ({ page }) => {
    await page.goto('/written');

    const books = page.getByRole('region', { name: 'Books & Publications' });
    const firstCard = books.locator('a[href^="/library/"]').first();
    const cuboid = firstCard.locator('[class*="preserve-3d"]').first();

    await expect(firstCard.getByText('No Cover')).toHaveCount(0);

    const restTransform = await cuboid.evaluate((element) => getComputedStyle(element).transform);
    expect(restTransform).not.toBe('none');

    await firstCard.hover();
    await expect
        .poll(async () => cuboid.evaluate((element) => getComputedStyle(element).transform))
        .not.toBe(restTransform);
});

test('reduced motion keeps the resting tilt static on hover', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/written');

    const books = page.getByRole('region', { name: 'Books & Publications' });
    const firstCard = books.locator('a[href^="/library/"]').first();
    const cuboid = firstCard.locator('[class*="preserve-3d"]').first();

    const restTransform = await cuboid.evaluate((element) => getComputedStyle(element).transform);
    await firstCard.hover();
    const hoverTransform = await cuboid.evaluate((element) => getComputedStyle(element).transform);

    expect(hoverTransform).toBe(restTransform);
});

test('a book card still navigates to its library reader', async ({ page }) => {
    await page.goto('/written');

    const books = page.getByRole('region', { name: 'Books & Publications' });
    await books.locator('a[href^="/library/"]').first().click();

    await expect(page).toHaveURL(/\/library\//);
});
```

- [ ] **Step 2: Run the new spec**

Run: `npx playwright test tests/e2e/book-3d-covers.spec.ts`
Expected: PASS (3 tests). The `cuboid` locator matches the `motion.div` in `Book3DCover.tsx` via its `[transform-style:preserve-3d]` Tailwind class — Tailwind renders arbitrary properties as a literal class name containing `preserve-3d`, which `[class*="preserve-3d"]` matches directly.

- [ ] **Step 3: Run the full e2e suite once**

Run: `npm run test:e2e`
Expected: all specs pass, including the pre-existing `archive-flows.spec.ts` and `accessibility.spec.ts`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/book-3d-covers.spec.ts
git commit -m "test: add e2e coverage for the 3D book cover interaction"
```

---

### Task 6: Final verification

- [ ] **Step 1: Run the full verification chain**

Run: `npm run lint && npm run typecheck && npm run test:unit && npm run test:e2e`
Expected: everything passes with no changes required. This is a check, not a code change — no commit follows unless a fix was needed, in which case commit that fix on its own with a `fix:` message before finishing.
