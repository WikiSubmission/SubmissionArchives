# Design Language: Egregore — Claude Code, now multiplayer

> Extracted from `https://egregore.xyz` on May 13, 2026
> 442 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#16100b` | rgb(22, 16, 11) | hsl(27, 33%, 6%) | 353 |
| Secondary | `#ff5f56` | rgb(255, 95, 86) | hsl(3, 100%, 67%) | 5 |
| Accent | `#3b2d21` | rgb(59, 45, 33) | hsl(28, 28%, 18%) | 9 |

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#ffffff` | hsl(0, 0%, 100%) | 286 |
| `#000000` | hsl(0, 0%, 0%) | 106 |

### Background Colors

Used on large-area elements: `#1d1611`, `#f5f2ed`

### Text Colors

Text color palette: `#000000`, `#16100b`, `#f5f2ed`, `#e7794b`, `#ffffff`, `#85c0fc`, `#e8772e`, `#f1efe2`, `#6bbf6b`, `#d4875a`

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#16100b` | background, text, border | 353 |
| `#ffffff` | text, border | 286 |
| `#000000` | text, border | 106 |
| `#f1efe2` | background, text, border | 85 |
| `#e7794b` | text, border | 44 |
| `#e8772e` | text, border | 10 |
| `#6bbf6b` | text, border | 10 |
| `#3b2d21` | background | 9 |
| `#ff5f56` | background | 5 |
| `#ffbd2e` | background | 5 |
| `#27c93f` | background | 5 |
| `#85c0fc` | text, border | 4 |
| `#d4875a` | text, border | 2 |

## Typography

### Font Families

- **IBM Plex Mono** — used for body (219 elements)
- **Inter** — used for body (134 elements)
- **Times New Roman** — used for all (53 elements)
- **LT Superior Serif** — used for all (36 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 60px | 3.75rem | 400 | 54px | -1.8px | h1, span, br, h2 |
| 32px | 2rem | 400 | 38.4px | normal | h3, h2, span |
| 18px | 1.125rem | 400 | 28.8px | normal | body, div, section, img |
| 16px | 1rem | 400 | normal | normal | html, head, meta, link |
| 14px | 0.875rem | 400 | 20px | -0.09px | p, a, span, div |
| 13px | 0.8125rem | 400 | 19px | normal | p, div, span, br |
| 12px | 0.75rem | 400 | 19.2px | normal | pre, span, a |

### Heading Scale

```css
h1 { font-size: 60px; font-weight: 400; line-height: 54px; }
h3 { font-size: 32px; font-weight: 400; line-height: 38.4px; }
```

### Body Text

```css
body { font-size: 13px; font-weight: 400; line-height: 19px; }
```

### Font Weights in Use

`400` (423x), `500` (18x), `700` (1x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-4 | 4px | 0.25rem |
| spacing-60 | 60px | 3.75rem |
| spacing-80 | 80px | 5rem |
| spacing-128 | 128px | 8rem |
| spacing-264 | 264px | 16.5rem |
| spacing-406 | 406px | 25.375rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| xl | 20px | 7 |
| full | 50px | 22 |

## CSS Custom Properties

### Colors

```css
--blue-muted: #7b9db7;
--border: #e0d8cc;
```

### Typography

```css
--font-serif: "LT Superior Serif", Georgia, "Times New Roman", serif;
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "IBM Plex Mono", monospace;
```

### Other

```css
--cream: #f5f2ed;
--black: #16100b;
--terracotta: #d4875a;
--dark: #2a2a2a;
--max-width: 1200px;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| sm | 480px | max-width |
| md | 768px | max-width |
| 1440px | 1440px | max-width |
| 1650px | 1650px | min-width |

## Transitions & Animations

**Easing functions:** `[object Object]`

**Durations:** `0.2s`, `0.1s`, `0.5s`, `0.7s`

### Common Transitions

```css
transition: all;
transition: opacity 0.2s, transform 0.1s;
transition: opacity 0.2s;
transition: opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1), transform 0.7s cubic-bezier(0.19, 1, 0.22, 1);
transition: background 0.2s;
```

### Keyframe Animations

**blink**
```css
@keyframes blink {
  49% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 0; }
}
```

**barProgress**
```css
@keyframes barProgress {
  0% { width: 0%; }
  100% { width: 100%; }
}
```

**charIn**
```css
@keyframes charIn {
  100% { opacity: 1; transform: translateY(0px); }
}
```

**fadeUp**
```css
@keyframes fadeUp {
  100% { opacity: 1; transform: translateY(0px); }
}
```

**shimmer-sweep**
```css
@keyframes shimmer-sweep {
  0%, 100% { background-position: 200% 0px; }
  50% { background-position: -100% 0px; }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (4 instances)

```css
.button {
  background-color: rgba(29, 22, 17, 0.88);
  color: rgb(245, 242, 237);
  font-size: 18px;
  font-weight: 500;
  padding-top: 0px;
  padding-right: 20px;
  border-radius: 20px;
}
```

### Links (5 instances)

```css
.link {
  color: rgb(22, 16, 11);
  font-size: 14px;
  font-weight: 400;
}
```

### Navigation (2 instances)

```css
.navigatio {
  color: rgb(22, 16, 11);
  padding-top: 0px;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  position: sticky;
}
```

### Footer (14 instances)

```css
.foote {
  background-color: rgba(22, 16, 11, 0.06);
  color: rgb(22, 16, 11);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 18px;
}
```

### Modals (1 instances)

```css
.modal {
  border-radius: 0px;
  padding-top: 0px;
  padding-right: 0px;
}
```

### Badges (5 instances)

```css
.badge {
  color: rgb(232, 119, 46);
  font-size: 32px;
  font-weight: 400;
  padding-top: 0px;
  padding-right: 0px;
  border-radius: 0px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(29, 22, 17, 0.88);
  color: rgb(245, 242, 237);
  padding: 0px 20px 0px 20px;
  border-radius: 20px;
  border: 0px none rgb(245, 242, 237);
  font-size: 18px;
  font-weight: 500;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(59, 45, 33, 0.08);
  color: rgb(22, 16, 11);
  padding: 4px 12px 4px 12px;
  border-radius: 50px;
  border: 0px none rgb(22, 16, 11);
  font-size: 14px;
  font-weight: 400;
```

## Layout System

**0 grid containers** and **44 flex containers** detected.

### Container Widths

| Max Width | Padding |
|-----------|---------|
| calc(100% - 48px) | 0px |
| 752px | 28px |
| 700px | 0px |

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| column/nowrap | 11x |
| row/nowrap | 32x |
| row/wrap | 1x |

**Gap values:** `12px`, `16px`, `24px`, `32px`, `36px`, `6px`, `8px`

## Responsive Design

### Viewport Snapshots

| Viewport | Body Font | Nav Visible | Max Columns | Hamburger | Page Height |
|----------|-----------|-------------|-------------|-----------|-------------|
| mobile (375px) | 18px | No | 0 | No | 7513px |
| tablet (768px) | 18px | No | 0 | No | 6440px |
| desktop (1280px) | 18px | Yes | 0 | No | 6626px |
| wide (1920px) | 18px | Yes | 0 | No | 6726px |

### Breakpoint Changes

**375px → 768px** (mobile → tablet):
- Page height: `7513px` → `6440px`

**768px → 1280px** (tablet → desktop):
- H1 size: `44px` → `60px`
- Nav visibility: `hidden` → `visible`

## Interaction States

### Button States

**"npx create-egregore@latest --o"**
```css
/* Hover */
opacity: 1 → 0.919755;
```
```css
/* Focus */
opacity: 1 → 0.9;
outline: rgb(245, 242, 237) none 3px → rgb(16, 16, 16) auto 1px;
```

**"Read the full article"**
```css
/* Hover */
background-color: rgba(59, 45, 33, 0.08) → rgba(59, 45, 33, 0.098);
```
```css
/* Focus */
outline: rgb(22, 16, 11) none 3px → rgb(16, 16, 16) auto 1px;
```

**"Next post →"**
```css
/* Hover */
background-color: rgba(59, 45, 33, 0.08) → rgba(59, 45, 33, 0.13);
```
```css
/* Focus */
background-color: rgba(59, 45, 33, 0.08) → rgba(59, 45, 33, 0.14);
outline: rgb(22, 16, 11) none 3px → rgb(16, 16, 16) auto 1px;
```

### Link Hover

```css
opacity: 1 → 0.8;
```

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 0 passing, 0 failing color pairs

## Design System Score

**Overall: 83/100 (Grade: B)**

| Category | Score |
|----------|-------|
| Color Discipline | 92/100 |
| Typography Consistency | 50/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 85/100 |
| Border Radius Consistency | 100/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 75/100 |

**Strengths:** Tight, disciplined color palette, Well-defined spacing scale, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 4 font families — consider limiting to 2 (heading + body)
- 71% of CSS is unused — consider purging
- 688 duplicate CSS declarations

## Z-Index Map

**5 unique z-index values** across 2 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| modal | 9998,9999 | div.g.r.i.d.-.l.i.n.e, div.g.r.i.d.-.o.v.e.r.l.a.y |
| base | 1,3 | section.v.a.l.u.e.-.p.r.o.p.s, div.e.g.r.e.g.o.r.i.c.-.t.e.x.t, div.e.g.r.e.g.o.r.i.c.-.t.e.x.t |

## SVG Icons

**3 unique SVG icons** detected. Dominant style: **filled**.

| Size Class | Count |
|------------|-------|
| sm | 1 |
| md | 2 |

**Icon colors:** `currentColor`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| LT Superior Serif | self-hosted | 400, 500, 600, 700, 800 | normal |
| IBM Plex Mono | google-fonts | 400, 500, 600 | normal |
| Inter | google-fonts | 400, 500, 600 | normal |

**Google Fonts URL:** `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap`

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 6 | objectFit: fill, borderRadius: 0px, shape: square |
| avatar | 3 | objectFit: contain, borderRadius: 50%, shape: circular |
| gallery | 1 | objectFit: fill, borderRadius: 0px, shape: square |
| general | 1 | objectFit: contain, borderRadius: 0px, shape: square |

**Aspect ratios:** 1:1 (9x), 2.53:1 (1x), 4.44:1 (1x)

## Motion Language

**Feel:** responsive · **Scroll-linked:** yes

### Duration Tokens

| name | value | ms |
|---|---|---|
| `xs` | `100ms` | 100 |
| `sm` | `200ms` | 200 |
| `lg` | `500ms` | 500 |

### Easing Families

- **ease-out** (5 uses) — `cubic-bezier(0.19, 1, 0.22, 1)`

### Keyframes In Use

| name | kind | properties | uses |
|---|---|---|---|
| `charIn` | slide-y | opacity, transform | 18 |
| `fadeUp` | slide-y | opacity, transform | 2 |

## Component Anatomy

### button — 3 instances

**Slots:** label, icon

## Brand Voice

**Tone:** neutral · **Pronoun:** you-only · **Headings:** Sentence case (tight)

### Top CTA Verbs

- **create** (2)
- **next** (1)

### Button Copy Patterns

- "npx create-egregore@latest --open" (2×)
- "next post →" (1×)

### Sample Headings

> Towards
sharedminds
> Organizational cognition
> Multi-agent continuity
> Deep pattern recognition
> Make it multiplayer /invite
> Atomic unit of AI-native coordination /handoff
> Automate the git workflow /save
> See the whole board /activity
> Surface what's beneath /deep-reflect
> Context gardening

## Page Intent

**Type:** `landing` (confidence 0.75)
**Description:** A shared intelligence layer for teams using Claude Code. Persistent memory, async handoffs, and accumulated knowledge across sessions and people.

## Section Roles

Reading order (top→bottom): hero → content → content → content → testimonial → testimonials → testimonials → nav → hero → hero → footer

| # | Role | Heading | Confidence |
|---|------|---------|------------|
| 0 | hero | Towards
sharedminds | 0.85 |
| 1 | content | Organizational cognition | 0.3 |
| 2 | nav | — | 0.9 |
| 3 | content | Make it multiplayer /invite | 0.3 |
| 4 | content | Atomic unit of AI-native coordination /handoff | 0.3 |
| 5 | testimonial | Automate the git workflow /save | 0.8 |
| 6 | testimonials | See the whole board /activity | 0.4 |
| 7 | testimonials | Surface what's beneath /deep-reflect | 0.4 |
| 8 | hero | Context gardening | 0.85 |
| 9 | hero | Try it now | 0.85 |
| 10 | footer | — | 0.95 |

## Material Language

**Label:** `flat` (confidence 0)

| Metric | Value |
|--------|-------|
| Avg saturation | 0.481 |
| Shadow profile | none |
| Avg shadow blur | 0px |
| Max radius | 50px |
| backdrop-filter in use | no |
| Gradients | 0 |

## Imagery Style

**Label:** `icon-only` (confidence 0.182)
**Counts:** total 11, svg 6, icon 8, screenshot-like 0, photo-like 0
**Dominant aspect:** square-ish
**Radius profile on images:** soft

## Component Screenshots

3 retina crops written to `screenshots/`. Index: `*-screenshots.json`.

| Cluster | Variant | Size (px) | File |
|---------|---------|-----------|------|
| button--default | 0 | 433 × 60 | `screenshots/button-default-0.png` |
| button--default | 1 | 103 × 32 | `screenshots/button-default-1.png` |
| button--default | 2 | 433 × 60 | `screenshots/button-default-2.png` |

Full-page: `screenshots/full-page.png`

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `IBM Plex Mono` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `design-tokens.json` for tooling integration
