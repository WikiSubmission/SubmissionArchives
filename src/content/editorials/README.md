# Archive Editorials — Design System & Authoring Guide

This document defines the editorial design system, asset conventions, typographic standards, and MDX component library for **Submission Archives Editorials**. Follow this guide when creating new research monographs or technical articles to maintain visual fidelity and architectural uniformity.

---

## 1. Directory & Asset Architecture

Every editorial is self-contained and organized by its URL `slug`:

```
src/content/editorials/
└── <slug>/
    └── index.mdx              # Article prose, frontmatter, and embedded components

public/editorials/
└── <slug>/
    ├── hero.svg               # Hero illustration (1200×900 or 16:9)
    ├── <diagram-1>.svg        # Technical diagrams & schematics
    └── <photo-1>.webp         # Archival photos or scans (optional)
```

> **Rule**: Never mix assets between articles. All images, SVGs, and diagrams belonging to `<slug>` must live under `public/editorials/<slug>/`.

---

## 2. Frontmatter Schema & Validation

Every `index.mdx` starts with YAML frontmatter validated at build-time with Zod (`src/lib/editorials.ts`):

```yaml
---
title: How the Archive Is Assembled
subtitle: Every recording, scan, and transcript in Submission Archives passes through the same four stages before it is published.
author: Submission Archives
publishedAt: 2026-08-25
updatedAt: 2026-08-26              # Optional revision date (YYYY-MM-DD)
summary: A walkthrough of the preservation pipeline behind Submission Archives and the provenance rules that decide what gets published.
topics:
  - Preservation
  - Methodology
hero:
  src: /editorials/how-the-archive-is-assembled/hero.svg
  alt: 'The four stages of the pipeline shown as numbered plates'
  width: 1200
  height: 900
draft: false                        # Set to true during drafting (hidden in production builds)
---
```

---

## 3. Typographic Hierarchy & Standards

### Font Families
- **Headings & Titles**: *Source Serif* (`var(--font-source-serif), Georgia, serif`)
- **Prose Body & Quotes**: *Newsreader* (`var(--font-newsreader), Georgia, serif`)
- **UI Labels, Metadata & Captions**: *DM Sans* (`var(--font-dm-sans), sans-serif`)
- **Data Readouts, Metrics & Code**: *UI Monospace* (`ui-monospace, SFMono-Regular, monospace`)

### Header Formatting Rules
1. **Title Case**: All `##` and `###` headers must use Title Case (e.g. `## 1. Acquisition`, `### Why the Untouched Master Matters`, `## What Is Deliberately Not Done`).
2. **Numbered Sections**: Multi-part or pipeline articles should number major sections (`## 1.`, `## 2.`, etc.) to match overview schematics.
3. **No Redundant H1s**: Never place an `# H1` in the MDX body; the page template automatically renders the frontmatter `title` as the solitary `<h1>`.

---

## 4. Built-in MDX Components

All components are automatically available in editorial `.mdx` files without manual imports.

### A. `<Lead>` (Standfirst Paragraph)
Use for the opening introductory thesis paragraph. Renders at `1.12em` with enhanced leading.

```mdx
<Lead>
An archive is only as trustworthy as the account it can give of itself. A scanned page with no history is a picture of a page; the same scan with a recorded source is evidence.
</Lead>
```

### B. `<Figure>` (Single Diagram / Plate)
Renders a high-resolution technical diagram with optional full breakout or column width, zoom modal, and caption.

```mdx
<Figure
  src="/editorials/<slug>/record-strata.svg"
  alt="Exploded isometric diagram showing the six archival strata"
  width={1400}
  height={1140}
  caption="One item, six retained artefacts, and the deterministic path back to the source."
  span="full"      # 'full' (default) breaks out of text measure; 'column' stays inside
  priority         # Set on the first/LCP figure
/>
```

### C. `<FigureGroup>` (Side-by-Side Comparison)
Compares 2 figures side-by-side on desktop with automatic snap-scrolling on mobile devices.

```mdx
<FigureGroup caption="Left: preservation master. Right: derived reading copy.">
  <Figure
    src="/editorials/<slug>/capture-master.svg"
    alt="Preservation master scan"
    width={1200}
    height={900}
    span="column"
    caption="Preservation master"
  />
  <Figure
    src="/editorials/<slug>/capture-reading.svg"
    alt="Reading copy derived for legibility"
    width={1200}
    height={900}
    span="column"
    caption="Reading copy"
  />
</FigureGroup>
```

### D. `<PullQuote>` (Archival Mandate / Rule Callout)
Centered statement plate with uppercase attribution. Use for critical claims and provenance rules.

```mdx
<PullQuote attribution="Provenance Rule">
If the origin of an item cannot be stated, the item is not published as evidence.
</PullQuote>
```

### E. `<Verse>` (Scripture Citation)
Minimalist scripture quote block linking directly to the scripture reader for context verification.

```mdx
<Verse chapter={17} verses="36">
You shall not accept any information, unless you verify it for yourself. I have given you the hearing, the eyesight, and the brain, and you are responsible for using them.
</Verse>
```

### F. `<Ref>` & `<Notes>` (Footnotes & Citations)
Bidirectional footnote system with target scroll-offset compensation and highlight animations.

```mdx
In-text citation marker:
...reprint sometimes carries corrections that are part of the record.<Ref id="1" />

Footnote definitions at bottom of article:
<Notes>
  <Note id="1">
    Where a later reprint differs materially, both editions are published.
  </Note>
</Notes>
```

---

## 5. Technical SVG Diagram Standards (*Making Software* Aesthetic)

When authoring new SVGs in `public/editorials/<slug>/`:

1. **Canvas & ViewBox Dimensions**:
   - Quad matrix / Hero: `viewBox="0 0 1200 900"`
   - Deep isometric stack: `viewBox="0 0 1400 1140"`
   - Horizontal pipeline flow: `viewBox="0 0 1600 780"`
2. **Color Palette Tokens**:
   - **Background Canvas**: `#F4EFE6` (Warm blueprint paper)
   - **Grid Lines**: `#DDD4C4` (30px / 40px grid) and `#E6DFD4` (6px / 8px subgrid)
   - **Primary Ink / Lines**: `#1C1A18` / `#2D2824`
   - **Secondary Text / Metadata**: `#575049` / `#756D65`
   - **Terracotta Accent**: `#A85324` (Callouts, active lasers, highlights, match badges)
   - **Card / Plate Surfaces**: `#FAF7F2` (Surface) and `#FFFFFF` (Elevated)
3. **Visual Detailing**:
   - Outer registration marks (`+` crosshairs in corners).
   - Coordinate metric tick marks on axes.
   - 3D isometric projections using 30° angles with edge extrusions and soft drop shadows.
   - Clean data chips (e.g. `600 DPI · 16-BIT RAW`, `D_max: 1.85`, `98.4% MATCH`).
