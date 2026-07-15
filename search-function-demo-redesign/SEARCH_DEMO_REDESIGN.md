# Search Function Demo Redesign

## Goal

Replace the current decorative macOS/Raycast simulation with a fast, credible demonstration of the actual Submission Archives search workflow.

The redesigned component should feel like a condensed version of the real search and media pages. It should use the project’s existing editorial visual system, canonical catalog records, and performance standards.

## Files

```text
src/components/home/SearchFunctionDemo.tsx
src/components/home/SearchFunctionDemo.module.css
src/components/home/DeferredSearchFunctionDemo.tsx
```

## Core improvements

### 1. Match the real product

The new demo follows the actual workflow:

1. Form a query.
2. Reveal cross-collection filters.
3. Rank matching documents and passages.
4. Select the strongest passage.
5. Open the media view at the matching timestamp.

It uses the canonical QS 45 and Old Message, New Messenger records rather than invented or stale paths.

### 2. Remove the fake operating-system shell

Delete the macOS menu bar, live date, menu labels, full black backdrop, and spinning Raycast border. These elements create a second design system and distract from the archive itself.

The replacement uses:

```text
--ed-bg
--ed-surface
--ed-fg
--ed-fg-muted
--ed-rule
--ed-accent
```

### 3. Reduce rendering cost

The new animation changes React state only four times during a cycle.

CSS animation is limited mainly to:

```text
opacity
transform
```

The following are removed:

```text
width animation
large infinite conic-gradient rotation
animated box shadows
full-scene backdrop filters
multiple independent 20-second global keyframes
```

### 4. Stop work when it is not visible

The component pauses its timeline when:

```text
the component leaves the viewport
the browser tab becomes hidden
the user presses Pause
the operating system requests reduced motion
```

The optional deferred wrapper prevents the component chunk from loading until the homepage visitor approaches the search section.

### 5. Keep animation local

The old `search-demo-*` rules should be removed from `src/app/globals.css`.

All new animation and layout rules live in:

```text
SearchFunctionDemo.module.css
```

This prevents global naming collisions and keeps the component portable.

### 6. Improve accessibility

The visual simulation is decorative and marked `aria-hidden`.

The real controls remain accessible:

```text
Pause
Resume
Replay
```

The status is announced with `aria-live="polite"`.

Users who request reduced motion see the final player state without the timeline animation.

### 7. Use image optimization

All images use `next/image` with explicit dimensions, `sizes`, and `quality`.

Do not use `unoptimized` for these local JPEG thumbnails.

## Integration

### Replace the current import in ArchiveBranch

Remove:

```tsx
const SearchFunctionDemo = dynamic(() => import('./SearchFunctionDemo'), {
    ssr: false,
    loading: () => <div className="h-[560px] sm:h-[620px] animate-pulse rounded-[1.25rem] bg-ed-surface" />
});
```

Add:

```tsx
import { DeferredSearchFunctionDemo } from './DeferredSearchFunctionDemo';
```

Replace:

```tsx
<SearchFunctionDemo />
```

with:

```tsx
<DeferredSearchFunctionDemo />
```

### Remove old global CSS

Delete the entire block beginning with:

```css
/* Search Demo: 20s cinematic loop */
```

and ending after:

```css
.search-demo-phase-4
```

Also remove the old `search-demo-*` names from the mobile animation reset list.

## Optional next step

Move the demo records into a server-generated homepage configuration. That would allow the component to receive a small typed prop object derived from `data/catalog/audios.json` and `data/catalog/videos.json`.

Suggested type:

```ts
type SearchDemoRecord = {
    id: string;
    title: string;
    type: 'quran-study' | 'video-program';
    thumbnail: string;
    timestamp: number;
    passage: string;
    highlightedTerms: readonly string[];
};
```

This would remove the final hard-coded catalog metadata from the client component.

## Validation

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Then verify:

```text
Desktop light theme
Desktop dark theme
Mobile 360px
Mobile 390px
Reduced motion
Background tab
Slow 4G
CPU 4x slowdown
Keyboard navigation
No layout shift while deferred content loads
```

## Performance acceptance criteria

- No timer advances while the demo is offscreen.
- No timer advances while the document is hidden.
- No hydration-dependent date or random value appears.
- No `unoptimized` image remains.
- No animation changes `width`, `height`, `top`, or `left`.
- The placeholder and loaded component reserve the same minimum height.
- The demo JavaScript is not fetched until the section approaches the viewport when the deferred wrapper is used.
- The animation remains readable when reduced motion is enabled.
