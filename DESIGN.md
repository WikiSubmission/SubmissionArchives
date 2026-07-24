# Submission Archives Design System

## Design read

Submission Archives is a trust-first digital heritage archive for researchers, readers, and members of the Submission community. The interface should feel editorial, documentary, calm, and contemporary. It should never resemble a generic SaaS dashboard, a neon technology landing page, or an ornamental religious template.

## Design dials

```text
DESIGN_VARIANCE: 6
MOTION_INTENSITY: 4
VISUAL_DENSITY: 4
COLOR_SCHEME: monochrome
```

- **Variance 6:** Use asymmetric editorial grids and distinct section structures. Preserve predictable navigation and reading order.
- **Motion 4:** Motion explains state changes and archival workflows. Avoid perpetual spectacle.
- **Density 4:** Show useful metadata without turning the site into a dashboard.

## Brand character

- Documentary rather than promotional.
- Historical rather than nostalgic.
- Serious without becoming institutional or sterile.
- Warm rather than glossy.
- Precise rather than decorative.

## Visual foundations

### Color

The `--ed-*` variables are the single source of truth. The palette is strictly monochromatic black and white.

- `--ed-bg`: pure white (#fafafa) in light, near-black (#0a0a0a) in dark.
- `--ed-surface`: slight off-white or slightly lighter dark.
- `--ed-fg`: near-black ink in light, near-white in dark.
- `--ed-fg-muted`: neutral gray.
- `--ed-rule`: subtle dividers in neutral gray.
- `--ed-accent`: foreground tone — black in light, white in dark. Used sparingly for state and emphasis.

Never add colored hues, gradients, amber, gold, terracotta, or neon tones.

### Typography

- **Superior Serif:** titles, editorial display, archival identity.
- **Libre Franklin:** navigation, labels, controls, body copy.
- **Amiri:** Arabic content.
- **System monospace:** timestamps, counters, references, technical identifiers only.

Do not use the serif as a blanket “premium” effect. It belongs to titles and archival display text. Interface labels remain sans-serif.

### Shape

- Prefer straight rules, restrained radii, and framed media.
- Small controls may be square or lightly rounded.
- Avoid pill-shaped containers for every label.
- Avoid stacking rounded cards inside rounded cards.

### Imagery

- Archival photographs are evidence, not decorative lifestyle photography.
- Use `object-contain` when the original frame matters.
- Use `object-cover` for thumbnails only.
- Captions should distinguish verified provenance from descriptive placeholders.
- Do not invent dates, locations, or identities.

## Homepage macrostructure

1. **Identity and archive plate**
   - Large editorial title.
   - Concise explanation and primary search action.
   - One framed archival-photo viewer with manual controls.

2. **Three distinct pathways**
   - Video uses a film or screening-desk metaphor.
   - Audio uses a listening-desk and waveform metaphor.
   - Search uses a staged explanatory workflow.
   - Do not render three copies of the same generic card layout.

3. **Footer as provenance layer**
   - State the archive’s purpose.
   - Preserve the transcription disclaimer.
   - Keep navigation readable and restrained.

## Motion rules

Motion must communicate one of these:

- A new archive plate has been selected.
- A featured record has changed.
- A search has moved from query to ranked evidence.
- A mobile menu has opened or closed.

### Required behavior

- Pause autoplay when the component is offscreen.
- Pause autoplay while the tab is hidden.
- Pause on pointer hover and keyboard focus.
- Respect `prefers-reduced-motion`.
- Provide manual previous, next, pause, and replay controls where autoplay exists.
- Animate `transform` and `opacity` whenever possible.
- Use one owned timer per carousel.
- Clean up every timer and observer.

### Prohibited behavior

- Infinite rotating conic borders.
- Cursor-following backgrounds that update React state.
- Multiple recursive timeout chains.
- Autoplaying YouTube players on the homepage.
- Motion added only to make a section feel “premium.”
- Large blurred gradients behind every card.

## Client and server boundaries

- The homepage composition is a Server Component.
- Carousels, menus, theme controls, pagination, and staged demos are isolated Client Components.
- Do not place `'use client'` on a parent merely because one descendant is interactive.
- Heavy components must be conditionally mounted near the viewport.
- Avoid client-side props that are already represented by CSS variables.

## Performance rules

- Do not embed `react-player` on the homepage.
- Do not preload below-the-fold thumbnails.
- Preload only the first likely LCP image and the small header mark.
- Use local canonical thumbnails rather than remote YouTube thumbnails when available.
- Use `content-visibility: auto` for substantial below-the-fold sections.
- A carousel should not trigger more than one React update per slide interval.
- Pointer movement must not rerender the component tree.
- Generated catalog validation should catch missing assets before deployment.

## Accessibility rules

- Interactive targets must be at least 44 by 44 CSS pixels.
- Autoplaying interfaces require pause controls.
- Mobile navigation must close on Escape and route changes.
- Return focus to the menu trigger after Escape.
- Lock background scrolling while the mobile navigation dialog is open.
- Use `aria-pressed` for selected slides and filters.
- Use polite live regions only for concise state labels.
- Decorative images use empty alternative text.
- Historical photographs use meaningful alternative text without unsupported claims.

## Component rules

### Feature descriptions

Use divided editorial rows with an index, title, and short explanation. Do not use equal glowing cards by default.

### Calls to action

Use compact, clearly ranked links or buttons. A section CTA does not need to fill the full container width.

### Media cards

- Theme through CSS variables.
- Do not pass unused theme objects through every card.
- Keep catalog cards server-renderable when possible.
- Missing thumbnail paths should fail catalog validation rather than force every card to hydrate for `onError` state.

### Search demonstrations

Treat the animation as an explanatory scene:

```text
query → ranked records → selected passage → playback at evidence
```

The visitor must be able to pause or replay it. The final state must remain understandable with motion disabled.

## Anti-slop checklist

Before merging a UI change, confirm:

- Does this resemble the archive, or a generic AI-generated landing page?
- Does each section have a distinct function and shape?
- Is every animation explaining a state change?
- Are there unnecessary glows, pills, gradients, or equal feature cards?
- Is archival metadata more prominent than ornamental decoration?
- Does the page work with JavaScript delayed, motion reduced, and light or dark mode active?
- Are all titles and thumbnails drawn from canonical catalog data where practical?
