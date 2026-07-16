# Submission Archives — Homepage Redesign Kit

A complete drop-in redesign of the homepage, built on your existing architecture.
Two directions ship together through your existing `.dark` theme switch:

- **Light theme → "Illuminated Archive"** — the evolved version of your current identity: warm parchment, a reading-lamp ambient glow, film grain, layered elevation, gradient copper accents, and choreographed scroll reveals.
- **Dark theme → "Midnight Vault"** — deep warm charcoal, luminous gold accents, stronger ambient glows, frosted-glass surfaces, and glow-on-hover CTAs.

Everything is driven by the same extended `--ed-*` token contract, so the rest of your site (viewer pages, search UI, `SearchFunctionDemo`, shadcn bridges) picks up the new theme automatically with zero changes.

---

## What changed and why

**Design system (`globals.css`)**

| Before | After |
|---|---|
| Single 8% shadow, 1px hairlines everywhere | Layered elevation scale (`--ed-shadow-sm/md/lg`) + accent glow shadow |
| Radii 4–10px | Radius scale 10/14/20/28px (`--ed-radius-sm…xl`) |
| Accent used only on kickers/hovers | Copper→gold gradient system (`--ed-accent-strong`, `--ed-gold`) powering gradient numerals, hairlines, CTAs |
| Flat page background | `ambient-page`: three radial "lamp" glows + SVG film grain, per-theme tuned |
| One hover translate on buttons | Motion scale (`--dur-fast/med/slow`) + shared spring easings everywhere |
| No entrance motion | `.reveal` system (IntersectionObserver, staggered, reduced-motion safe) |
| Sections end in hard `border-b` | `divider-fade` hairlines that dissolve at the edges |

**New shared primitives**

- `Reveal.tsx` — scroll-triggered entrance wrapper (opacity + rise, spring-out, per-block `delay`). Reduced-motion users see content instantly.
- `SectionHeading.tsx` — replaces the three duplicated local heading components (ArchiveBranch / Video / Audio) with one: gradient Roman numeral, serif title, accent segment on the rule.
- `CtaLink` (inside `SectionCta.tsx`) — the "swept underline + arrow medallion" link, reused in card footers.

**Component highlights**

- **Hero** — staggered entrance choreography (kicker → display line → accent rule → lede → CTAs → stats), brand mark in a raised badge, "ARCHIVES" with a dissolving accent rule, stats as a frosted `glass-panel` strip, and the photograph plate elevated with a gradient top hairline, halo glow, inner-shadow mat, and rounded index pills.
- **Video / Audio consoles** — consistent media-device language: gradient hairline, dark console tokens (`--ed-console-*`) shared by both themes, luminous play medallion that fills with accent on hover, active-track accent rail, hover-lift cards.
- **Written shelf** — lamp glow over the shelf, deeper cover shadows, hover lift with gradient scrim, refined shelf plate.
- **Qur'an editions** — verse set in a softly lit inner page panel with ornamental brackets ﴿ ﴾, gradient translation rule, pill-shaped edition switcher.
- **Homepage composition** — editorial section header with gradient italic accent, fading dividers between branches, and a new closing CTA band ("Start with a single search.") in a luminous accent gradient with grain overlay. Delete that `<Reveal className="mt-24 ...">` block if you don't want it.

**Preserved as-is:** `useAutoplayCarousel.ts`, `SearchFunctionDemo.tsx` + its CSS module (it reskins via tokens), `WebVitals.tsx`, `page.tsx`, all props, all aria attributes, `content-visibility` performance hints, and the reduced-motion / forced-colors / high-contrast guards.

---

## Integration

1. Back up your current files, then copy each file below to the path shown in its heading.
2. `Reveal.tsx` and `SectionHeading.tsx` are new — place them beside the other home components.
3. No dependency changes; everything uses what you already have (`next/image`, `next/link`, `lucide-react`, Tailwind v4).
4. If your display serif ships a true italic, the `<em>` accent in the section header will use it; otherwise the browser synthesizes it (still fine).
5. Optional `SearchFunctionDemo.module.css` polish (not required): change `.root { border-radius: 1rem }` to `border-radius: var(--ed-radius-lg)` to match the new radius scale.

---

## Files


### `app/globals.css` **(replace existing)**

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

/* ==========================================================================
   Design tokens — "Illuminated Archive" (light) · "Midnight Vault" (dark)
   Same `--ed-*` contract as before, extended with elevation, radii,
   ambient light, grain, and a motion scale. Both themes ship together;
   the existing .dark / [data-theme] switch flips between them.
   ========================================================================== */

:root,
[data-theme="light"] {
  /* Surfaces & ink — warm parchment under warm ink */
  --ed-bg: oklch(0.938 0.021 80);
  --ed-fg: oklch(0.235 0.014 62);
  --ed-fg-muted: oklch(0.475 0.026 66);
  --ed-rule: color-mix(in oklch, var(--ed-fg) 16%, transparent);
  --ed-rule-strong: color-mix(in oklch, var(--ed-fg) 30%, transparent);
  --ed-surface: oklch(0.963 0.015 81);
  --ed-surface-strong: oklch(0.982 0.01 82);

  /* Accent — copper amber, with a gold companion for gradient work */
  --ed-accent: oklch(0.555 0.155 44);
  --ed-accent-strong: oklch(0.485 0.16 40);
  --ed-accent-soft: oklch(0.7 0.12 50);
  --ed-gold: oklch(0.74 0.115 78);

  /* Ambient light — the "reading lamp" washes behind the page */
  --ed-ambient-1: color-mix(in oklch, var(--ed-accent) 13%, transparent);
  --ed-ambient-2: color-mix(in oklch, var(--ed-gold) 15%, transparent);
  --ed-ambient-3: color-mix(in oklch, var(--ed-accent-soft) 11%, transparent);
  --ed-grain-opacity: 0.05;
  --ed-grain-blend: multiply;

  /* Elevation — layered ambient + contact shadows */
  --ed-shadow: color-mix(in oklch, var(--ed-fg) 8%, transparent);
  --ed-shadow-sm:
    0 1px 2px color-mix(in oklch, var(--ed-fg) 5%, transparent),
    0 3px 10px -2px color-mix(in oklch, var(--ed-fg) 5%, transparent);
  --ed-shadow-md:
    0 2px 6px color-mix(in oklch, var(--ed-fg) 5%, transparent),
    0 18px 44px -14px color-mix(in oklch, var(--ed-fg) 16%, transparent);
  --ed-shadow-lg:
    0 4px 14px color-mix(in oklch, var(--ed-fg) 6%, transparent),
    0 36px 90px -24px color-mix(in oklch, var(--ed-fg) 24%, transparent);
  --ed-shadow-glow: 0 10px 34px -10px color-mix(in oklch, var(--ed-accent) 45%, transparent);

  /* Viewer + shadcn bridges (unchanged contract) */
  --ed-viewer-bg: oklch(0.86 0.022 78);
  --background: var(--ed-bg);
  --foreground: var(--ed-fg);
  --border: var(--ed-rule);
  --muted: var(--ed-surface);
  --muted-foreground: var(--ed-fg-muted);
}

.dark,
[data-theme="dark"] {
  /* Surfaces & ink — deep warm charcoal, luminous cream */
  --ed-bg: oklch(0.175 0.008 60);
  --ed-fg: oklch(0.945 0.02 78);
  --ed-fg-muted: oklch(0.75 0.03 70);
  --ed-rule: color-mix(in oklch, var(--ed-fg) 14%, transparent);
  --ed-rule-strong: color-mix(in oklch, var(--ed-fg) 26%, transparent);
  --ed-surface: oklch(0.22 0.01 62);
  --ed-surface-strong: oklch(0.26 0.012 64);

  /* Accent — luminous gold-amber that carries light in the dark */
  --ed-accent: oklch(0.81 0.115 68);
  --ed-accent-strong: oklch(0.875 0.1 76);
  --ed-accent-soft: oklch(0.6 0.13 38);
  --ed-gold: oklch(0.865 0.1 86);

  /* Ambient light — stronger, slower-burning in the vault */
  --ed-ambient-1: color-mix(in oklch, var(--ed-accent) 20%, transparent);
  --ed-ambient-2: color-mix(in oklch, var(--ed-gold) 13%, transparent);
  --ed-ambient-3: color-mix(in oklch, var(--ed-accent-soft) 16%, transparent);
  --ed-grain-opacity: 0.07;
  --ed-grain-blend: overlay;

  /* Elevation — deeper contact shadows + accent halos */
  --ed-shadow: rgba(0, 0, 0, 0.34);
  --ed-shadow-sm:
    0 1px 2px rgba(0, 0, 0, 0.45),
    0 3px 12px -2px rgba(0, 0, 0, 0.4);
  --ed-shadow-md:
    0 2px 8px rgba(0, 0, 0, 0.4),
    0 20px 52px -14px rgba(0, 0, 0, 0.6);
  --ed-shadow-lg:
    0 6px 18px rgba(0, 0, 0, 0.42),
    0 40px 100px -24px rgba(0, 0, 0, 0.68);
  --ed-shadow-glow: 0 10px 40px -8px color-mix(in oklch, var(--ed-accent) 40%, transparent);

  --ed-viewer-bg: oklch(0.18 0.005 70);
}

/* Shared tokens — identical in both themes */
:root {
  /* Console ("device") panels — the dark listening/screening rooms
     that stay dark in both themes, as a deliberate contrast moment */
  --ed-console: oklch(0.205 0.009 58);
  --ed-console-raised: oklch(0.255 0.011 60);
  --ed-console-fg: oklch(0.94 0.02 78);
  --ed-console-muted: oklch(0.775 0.028 70);
  --ed-console-accent: oklch(0.83 0.115 72);
  --ed-console-rule: color-mix(in oklch, var(--ed-console-fg) 12%, transparent);

  /* Radii scale */
  --ed-radius-sm: 0.625rem;
  --ed-radius-md: 0.875rem;
  --ed-radius-lg: 1.25rem;
  --ed-radius-xl: 1.75rem;

  /* Motion scale */
  --dur-fast: 160ms;
  --dur-med: 320ms;
  --dur-slow: 640ms;

  /* Film grain (SVG turbulence, tiled) */
  --ed-grain: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");
}

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-border: var(--border);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-ed-bg: var(--ed-bg);
  --color-ed-fg: var(--ed-fg);
  --color-ed-fg-muted: var(--ed-fg-muted);
  --color-ed-rule: var(--ed-rule);
  --color-ed-rule-strong: var(--ed-rule-strong);
  --color-ed-surface: var(--ed-surface);
  --color-ed-surface-strong: var(--ed-surface-strong);
  --color-ed-accent: var(--ed-accent);
  --color-ed-accent-strong: var(--ed-accent-strong);
  --color-ed-accent-soft: var(--ed-accent-soft);
  --color-ed-gold: var(--ed-gold);
  --color-ed-viewer-bg: var(--ed-viewer-bg);
  --color-ed-console: var(--ed-console);
  --color-ed-console-raised: var(--ed-console-raised);
  --color-ed-console-fg: var(--ed-console-fg);
  --color-ed-console-muted: var(--ed-console-muted);
  --color-ed-console-accent: var(--ed-console-accent);
  --color-ed-console-rule: var(--ed-console-rule);
  --font-sans: var(--font-libre-franklin);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --font-serif: var(--font-local-superior);
  --font-display: var(--font-local-superior);
  --font-arabic: var(--font-amiri);
  --font-body: var(--font-libre-franklin);
  --font-ui: var(--font-libre-franklin);
  --ease-spring-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring-pop: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ==========================================================================
   Base
   ========================================================================== */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  max-width: 100%;
  overflow-x: clip;
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
}

body {
  min-height: 100%;
  max-width: 100%;
  overflow-x: clip;
  background: var(--ed-bg);
  color: var(--ed-fg);
  font-family: var(--font-libre-franklin), ui-sans-serif, system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern" 1, "liga" 1, "case" 1;
}

[dir="rtl"],
.font-arabic {
  font-family: var(--font-arabic), serif;
}

h1,
h2,
h3,
h4,
p {
  margin-block: 0;
}

h1,
h2,
h3 {
  text-wrap: balance;
}

p {
  text-wrap: pretty;
}

img,
svg,
video,
canvas {
  display: block;
  max-width: 100%;
}

button,
a,
input,
select,
textarea {
  -webkit-tap-highlight-color: transparent;
}

button,
a {
  touch-action: manipulation;
}

:focus-visible {
  outline: 2px solid var(--ed-accent);
  outline-offset: 3px;
  border-radius: 2px;
}

::selection {
  background: color-mix(in srgb, var(--ed-accent) 30%, transparent);
  color: var(--ed-fg);
}

/* ==========================================================================
   Atmosphere — page-level ambient light + grain.
   Apply `.ambient-page` to <main>. Glows sit above the page background
   and below content (CSS painting order), so sections stay crisp.
   ========================================================================== */

.ambient-page {
  position: relative;
  isolation: isolate;
}

.ambient-page::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -2;
  pointer-events: none;
  background:
    radial-gradient(54rem 36rem at 10% -10%, var(--ed-ambient-1), transparent 62%),
    radial-gradient(46rem 32rem at 98% 2%, var(--ed-ambient-2), transparent 60%),
    radial-gradient(64rem 44rem at 50% 112%, var(--ed-ambient-3), transparent 66%);
}

.ambient-page::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image: var(--ed-grain);
  opacity: var(--ed-grain-opacity);
  mix-blend-mode: var(--ed-grain-blend);
}

/* ==========================================================================
   Type components
   ========================================================================== */

.archive-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--ed-accent);
  font-family: var(--font-ui), sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  line-height: 1.2;
  text-transform: uppercase;
}

/* The small "catalog tick" that introduces every kicker */
.archive-kicker::before {
  content: "";
  width: 1.5rem;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    var(--ed-accent),
    color-mix(in oklch, var(--ed-accent) 20%, transparent)
  );
}

/* ==========================================================================
   Controls
   ========================================================================== */

.archive-button {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  border: 1px solid transparent;
  border-radius: var(--ed-radius-md);
  padding: 0.8rem 1.35rem;
  font-family: var(--font-ui), sans-serif;
  font-size: 0.9rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  line-height: 1.2;
  transition:
    color var(--dur-fast) var(--ease-spring-out),
    background-color var(--dur-fast) var(--ease-spring-out),
    border-color var(--dur-fast) var(--ease-spring-out),
    box-shadow var(--dur-med) var(--ease-spring-out),
    transform var(--dur-med) var(--ease-spring-pop);
}

.archive-button:hover {
  transform: translateY(-2px);
}

.archive-button:active {
  transform: translateY(0);
}

.archive-button-primary {
  background: var(--ed-fg);
  color: var(--ed-bg);
  box-shadow: var(--ed-shadow-sm);
}

.archive-button-primary:hover {
  background: var(--ed-accent);
  color: var(--ed-bg);
  box-shadow: var(--ed-shadow-glow);
}

.archive-button-secondary {
  border-color: var(--ed-rule-strong);
  background: color-mix(in oklch, var(--ed-surface) 55%, transparent);
  color: var(--ed-fg);
}

.archive-button-secondary:hover {
  border-color: color-mix(in oklch, var(--ed-accent) 60%, var(--ed-rule));
  background: var(--ed-surface);
  color: var(--ed-accent);
  box-shadow: var(--ed-shadow-sm);
}

.archive-input {
  min-height: 3.25rem;
  border: 1px solid var(--ed-rule);
  border-radius: var(--ed-radius-md);
  background: var(--ed-surface);
  color: var(--ed-fg);
  font-size: 1rem;
  line-height: 1.4;
  transition:
    border-color var(--dur-fast) var(--ease-spring-out),
    box-shadow var(--dur-fast) var(--ease-spring-out);
}

.archive-input::placeholder {
  color: color-mix(in oklch, var(--ed-fg-muted) 76%, transparent);
}

.archive-input:focus {
  border-color: var(--ed-accent);
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--ed-accent) 22%, transparent);
}

/* ==========================================================================
   Surfaces
   ========================================================================== */

.soft-shell {
  border: 1px solid var(--ed-rule);
  border-radius: var(--ed-radius-lg);
  background: color-mix(in oklch, var(--ed-surface) 80%, var(--ed-bg));
  box-shadow: var(--ed-shadow-md);
}

.soft-panel {
  border: 1px solid var(--ed-rule);
  border-radius: var(--ed-radius-md);
  background: var(--ed-surface);
  box-shadow: var(--ed-shadow-sm);
}

.soft-pill {
  border: 1px solid var(--ed-rule);
  border-radius: 999px;
  background: color-mix(in oklch, var(--ed-surface) 78%, var(--ed-bg));
}

/* Frosted surface — reads as vellum in light, glass in dark.
   Best used floating over the ambient glows (e.g. hero stat strip). */
.glass-panel {
  border: 1px solid color-mix(in oklch, var(--ed-fg) 10%, transparent);
  background: color-mix(in oklch, var(--ed-surface-strong) 62%, transparent);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  backdrop-filter: blur(14px) saturate(1.2);
  box-shadow:
    inset 0 1px 0 color-mix(in oklch, var(--ed-fg) 6%, transparent),
    var(--ed-shadow-md);
}

/* Hover elevation for cards and media consoles */
.lift-card {
  transition:
    transform var(--dur-med) var(--ease-spring-out),
    box-shadow var(--dur-med) var(--ease-spring-out),
    border-color var(--dur-fast) var(--ease-spring-out);
}

@media (hover: hover) {
  .lift-card:hover {
    transform: translateY(-4px);
    border-color: color-mix(in oklch, var(--ed-accent) 34%, var(--ed-rule));
    box-shadow: var(--ed-shadow-lg);
  }
}

/* Animated underline that sweeps in from the left */
.link-sweep {
  padding-bottom: 2px;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0% 1.5px;
  transition:
    background-size var(--dur-med) var(--ease-spring-out),
    color var(--dur-fast) var(--ease-spring-out);
}

.link-sweep:hover {
  background-size: 100% 1.5px;
}

/* Hairline divider that fades out at both edges */
.divider-fade {
  height: 1px;
  border: 0;
  background: linear-gradient(
    90deg,
    transparent,
    var(--ed-rule-strong) 20%,
    var(--ed-rule-strong) 80%,
    transparent
  );
}

/* ==========================================================================
   Scroll reveals — driven by <Reveal /> (IntersectionObserver).
   ========================================================================== */

.reveal {
  opacity: 0;
  translate: 0 1.4rem;
  transition:
    opacity var(--dur-slow) var(--ease-spring-out) var(--reveal-delay, 0ms),
    translate var(--dur-slow) var(--ease-spring-out) var(--reveal-delay, 0ms);
}

.reveal.is-revealed {
  opacity: 1;
  translate: 0 0;
}

/* ==========================================================================
   Performance hints + keyframes
   ========================================================================== */

.archive-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 980px;
}

.media-card-shell {
  content-visibility: auto;
  contain-intrinsic-size: auto 320px;
}

@keyframes archive-media-reveal {
  from {
    opacity: 0.55;
    transform: scale(1.018);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes float-slow {
  0%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  50% {
    transform: translate3d(0, -14px, 0);
  }
}

.animate-float-slow {
  animation: float-slow 9s ease-in-out infinite;
}

/* ==========================================================================
   Accessibility + forced colors
   ========================================================================== */

@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }

  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Never leave revealed content stranded invisible */
  .reveal {
    opacity: 1 !important;
    translate: none !important;
  }
}

@media (prefers-contrast: more) {
  :root,
  [data-theme="light"],
  .dark,
  [data-theme="dark"] {
    --ed-rule: color-mix(in oklch, var(--ed-fg) 38%, transparent);
    --ed-rule-strong: color-mix(in oklch, var(--ed-fg) 55%, transparent);
  }
}

@media (forced-colors: active) {
  .archive-button,
  .soft-shell,
  .soft-panel,
  .soft-pill,
  .glass-panel {
    border: 1px solid CanvasText;
  }

  .archive-kicker::before,
  .divider-fade {
    background: CanvasText;
  }
}

/* ==========================================================================
   PDF search highlights (unchanged)
   ========================================================================== */

mark.pdf-search-highlight {
  border-radius: 2px;
  padding: 0 1px;
  background-color: color-mix(in srgb, var(--ed-accent) 45%, transparent);
  mix-blend-mode: multiply;
}

.react-pdf__Page__textContent mark.pdf-search-highlight {
  color: transparent;
}
```

### `components/home/Reveal.tsx` **(new file)**

```tsx
'use client';

import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';

type RevealProps = {
    children: ReactNode;
    /** Stagger delay in milliseconds — e.g. index * 90 for lists. */
    delay?: number;
    className?: string;
    /**
     * A negative bottom margin triggers the reveal just before the block
     * is fully in view, so entrances feel anticipated rather than late.
     */
    rootMargin?: string;
};

/**
 * Scroll-triggered entrance wrapper. Pairs with the `.reveal` /
 * `.is-revealed` rules in globals.css (opacity + rise, spring easing).
 * Respects prefers-reduced-motion via the global CSS guard.
 */
export function Reveal({
    children,
    delay = 0,
    className = '',
    rootMargin = '0px 0px -6% 0px',
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || isRevealed) return;

        if (!('IntersectionObserver' in window)) {
            queueMicrotask(() => setIsRevealed(true));
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setIsRevealed(true);
                observer.disconnect();
            },
            { rootMargin, threshold: 0.12 },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [isRevealed, rootMargin]);

    return (
        <div
            ref={ref}
            className={`reveal${isRevealed ? ' is-revealed' : ''}${className ? ` ${className}` : ''}`}
            style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}
```

### `components/home/SectionHeading.tsx` **(new file)**

```tsx
type SectionHeadingProps = {
    numeral: string;
    title: string;
    className?: string;
};

/**
 * Shared branch heading: gradient Roman numeral + serif title on a hairline,
 * with a short accent segment underscoring the rule. Used by ArchiveBranch,
 * VideoArchiveSection, and AudioArchiveSection (replacing their three
 * near-identical local copies).
 */
export function SectionHeading({ numeral, title, className = '' }: SectionHeadingProps) {
    return (
        <header className={`relative ${className}`}>
            <div className="grid grid-cols-[auto_1fr] items-end gap-5 border-b border-ed-rule pb-5">
                <span
                    aria-hidden="true"
                    className="bg-gradient-to-br from-ed-accent via-ed-accent to-ed-accent-soft bg-clip-text font-display text-6xl leading-[0.8] text-transparent sm:text-7xl"
                >
                    {numeral}
                </span>
                <h3 className="font-display text-[clamp(2.4rem,6vw,4.4rem)] font-medium leading-[0.9] tracking-[-0.035em] text-ed-fg">
                    {title}
                </h3>
            </div>
            <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 h-[2px] w-24 bg-gradient-to-r from-ed-accent to-transparent"
            />
        </header>
    );
}
```

### `components/home/SectionCta.tsx` **(replace existing)**

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The shared "swept underline + arrow medallion" link. Exported on its own
 * so media cards (Written / Qur'an / Audio footers) can use the same
 * treatment without SectionCta's top margin.
 */
export function CtaLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} className="group inline-flex min-h-11 items-center gap-3">
            <span className="link-sweep text-sm font-semibold text-ed-fg transition-colors group-hover:text-ed-accent">
                {label}
            </span>
            <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-full border border-ed-rule text-ed-fg transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105 group-hover:border-ed-accent group-hover:bg-ed-accent group-hover:text-ed-bg"
            >
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
        </Link>
    );
}

export function SectionCta({ href, label }: { href: string; label: string }) {
    return (
        <div className="mt-8">
            <CtaLink href={href} label={label} />
        </div>
    );
}
```

### `components/home/ExpectationCard.tsx` **(replace existing)**

```tsx
type ExpectationCardProps = {
    index?: string;
    title: string;
    body: string;
};

/**
 * Capability row: mono index, serif title, muted body. On hover the row
 * gains a soft panel wash and the title slides to the accent — a small
 * reward for scanning the list.
 */
export function ExpectationCard({ index, title, body }: ExpectationCardProps) {
    return (
        <div className="group -mx-3 grid grid-cols-[2.25rem_1fr] gap-3 rounded-[var(--ed-radius-md)] px-3 py-5 transition-colors duration-200 sm:py-6 hover:bg-ed-surface">
            <span
                className="pt-1 font-mono text-[0.66rem] font-semibold tabular-nums text-ed-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0.5"
                aria-hidden="true"
            >
                {index ?? '•'}
            </span>
            <div>
                <h4 className="font-display text-[1.05rem] font-medium leading-6 text-ed-fg transition-colors duration-200 group-hover:text-ed-accent">
                    {title}
                </h4>
                <p className="mt-2 text-[0.82rem] leading-6 text-ed-fg-muted">
                    {body}
                </p>
            </div>
        </div>
    );
}
```

### `components/home/HeroSection.tsx` **(replace existing)**

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { Reveal } from './Reveal';
import { useAutoplayCarousel } from './useAutoplayCarousel';

const HERO_IMAGES = [
    {
        src: '/images/archive-photos/M3.png',
        alt: 'Rashad Khalifa archival photograph',
        label: 'Archive plate 01',
    },
    {
        src: '/images/archive-photos/M1.png',
        alt: 'Rashad Khalifa with others in an archival photograph',
        label: 'Archive plate 02',
    },
    {
        src: '/images/archive-photos/M2.png',
        alt: 'Rashad Khalifa in an archival group photograph',
        label: 'Archive plate 03',
    },
    {
        src: '/images/archive-photos/M4.jpeg',
        alt: 'Rashad Khalifa archival scene',
        label: 'Archive plate 04',
    },
] as const;

const HERO_STATS = [
    { label: 'Formats', value: 'Audio, video, text' },
    { label: 'Access', value: 'Open and searchable' },
    { label: 'Purpose', value: 'Study and preservation' },
] as const;

const HERO_ROTATION_MS = 7_000;

export function HeroSection() {
    const {
        rootRef,
        index,
        goTo,
        next,
        previous,
        reducedMotion,
        isManuallyPaused,
        setIsManuallyPaused,
        interactionProps,
    } = useAutoplayCarousel({
        count: HERO_IMAGES.length,
        intervalMs: HERO_ROTATION_MS,
    });

    const currentImage = HERO_IMAGES[index];

    return (
        <section className="relative border-b border-ed-rule">
            {/* Local atmosphere: a slow-drifting lamp glow + the ghost brand mark */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <div className="animate-float-slow absolute -left-28 top-8 h-[34rem] w-[34rem] rounded-full bg-ed-accent/10 blur-3xl dark:bg-ed-accent/15" />
                <div className="absolute -bottom-32 left-1/3 h-[26rem] w-[26rem] rounded-full bg-ed-gold/10 blur-3xl dark:bg-ed-gold/12" />
                <Image
                    src="/assets/brand/submission-archives-mark.png"
                    alt=""
                    width={500}
                    height={500}
                    className="absolute -right-24 -top-20 hidden w-[34rem] select-none opacity-[0.04] grayscale lg:block dark:opacity-[0.06]"
                    aria-hidden="true"
                />
            </div>

            <div className="relative mx-auto grid max-w-[1440px] gap-14 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
                <div className="max-w-3xl">
                    <Reveal>
                        <div className="flex items-center gap-4">
                            <span className="grid h-12 w-12 place-items-center rounded-[var(--ed-radius-md)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-sm)]">
                                <Image
                                    src="/assets/brand/submission-archives-mark.png"
                                    alt=""
                                    width={30}
                                    height={30}
                                    className="h-[1.875rem] w-[1.875rem] object-contain opacity-85"
                                    aria-hidden="true"
                                />
                            </span>
                            <p className="archive-kicker">A living digital archive</p>
                        </div>
                    </Reveal>

                    <Reveal delay={90}>
                        <h1 className="mt-10 font-display text-[clamp(3.6rem,9.5vw,7.75rem)] font-medium leading-[0.8] tracking-[-0.05em] text-ed-fg">
                            <span className="block">Submission</span>
                            <span className="mt-5 flex items-center gap-5 font-ui text-[clamp(0.82rem,1.5vw,1.05rem)] font-bold uppercase leading-none tracking-[0.34em] text-ed-accent">
                                Archives
                                <span
                                    aria-hidden="true"
                                    className="h-px max-w-40 flex-1 bg-gradient-to-r from-ed-accent/70 to-transparent"
                                />
                            </span>
                        </h1>
                    </Reveal>

                    <Reveal delay={180}>
                        <p className="mt-8 max-w-[54ch] text-[1.05rem] leading-8 text-ed-fg-muted sm:text-lg">
                            Explore preserved recordings, Qur&apos;an editions, newsletters, books, appendices, and searchable transcripts from the Submission archive.
                        </p>
                    </Reveal>

                    <Reveal delay={270}>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <Link href="/search" className="archive-button archive-button-primary group px-6 sm:px-7">
                                Search the archive
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                            <Link href="/videos" className="archive-button archive-button-secondary px-6 sm:px-7">
                                Browse recordings
                            </Link>
                        </div>
                    </Reveal>

                    <Reveal delay={380}>
                        <dl className="glass-panel mt-10 grid max-w-2xl grid-cols-1 gap-y-4 rounded-[var(--ed-radius-lg)] p-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-ed-rule sm:p-0">
                            {HERO_STATS.map((stat) => (
                                <div key={stat.label} className="sm:px-5 sm:py-4">
                                    <dt className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-ed-fg-muted">
                                        {stat.label}
                                    </dt>
                                    <dd className="mt-1 font-display text-lg leading-snug text-ed-fg sm:text-xl">
                                        {stat.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </div>

                <Reveal delay={220} className="relative">
                    {/* Halo behind the plate */}
                    <div
                        aria-hidden="true"
                        className="absolute -inset-8 -z-10 rounded-[2.5rem] bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--ed-accent)_18%,transparent),transparent)] blur-2xl"
                    />
                    <div ref={rootRef} {...interactionProps} className="touch-pan-y">
                        <figure className="lift-card relative overflow-hidden rounded-[var(--ed-radius-xl)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-lg)]">
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/70 to-transparent"
                            />

                            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                                <div>
                                    <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                                        Historical photographs
                                    </p>
                                    <p className="mt-1 text-sm text-ed-fg" aria-live="polite">
                                        {currentImage.label}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <CarouselButton label="Previous photograph" onClick={previous}>
                                        <ArrowLeft className="h-4 w-4" />
                                    </CarouselButton>
                                    {!reducedMotion ? (
                                        <CarouselButton
                                            label={isManuallyPaused ? 'Resume photograph rotation' : 'Pause photograph rotation'}
                                            onClick={() => setIsManuallyPaused((paused) => !paused)}
                                            pressed={isManuallyPaused}
                                        >
                                            {isManuallyPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        </CarouselButton>
                                    ) : null}
                                    <CarouselButton label="Next photograph" onClick={next}>
                                        <ArrowRight className="h-4 w-4" />
                                    </CarouselButton>
                                </div>
                            </div>

                            <div className="relative aspect-[1.22/1] overflow-hidden bg-[color-mix(in_oklch,var(--ed-surface)_72%,var(--ed-bg))] shadow-[inset_0_2px_20px_color-mix(in_oklch,var(--ed-fg)_7%,transparent)] sm:aspect-[1.36/1]">
                                {HERO_IMAGES.map((image, imageIndex) => (
                                    <Image
                                        key={image.src}
                                        src={image.src}
                                        alt={image.alt}
                                        fill
                                        preload={imageIndex === 0}
                                        quality={70}
                                        sizes="(min-width: 1024px) 54vw, 100vw"
                                        className={`object-contain p-4 transition-[opacity,transform] duration-700 ease-out sm:p-7 ${
                                            imageIndex === index
                                                ? 'scale-100 opacity-100'
                                                : 'pointer-events-none scale-[1.015] opacity-0'
                                        }`}
                                    />
                                ))}
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ed-bg/25 via-transparent to-transparent" />
                            </div>

                            <figcaption className="grid gap-4 border-t border-ed-rule px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                                <p className="max-w-[54ch] text-sm leading-6 text-ed-fg-muted">
                                    A rotating selection from the visual archive. Original captions should be added as provenance becomes available.
                                </p>
                                <div className="flex items-center gap-2" role="group" aria-label="Select archive photograph">
                                    {HERO_IMAGES.map((image, imageIndex) => (
                                        <button
                                            key={image.src}
                                            type="button"
                                            onClick={() => goTo(imageIndex)}
                                            aria-label={`Show ${image.label.toLowerCase()}`}
                                            aria-pressed={imageIndex === index}
                                            className={`min-h-11 min-w-11 rounded-[var(--ed-radius-sm)] border px-3 text-xs font-semibold tabular-nums transition-all duration-200 ${
                                                imageIndex === index
                                                    ? 'border-ed-accent bg-ed-accent/12 text-ed-accent shadow-[var(--ed-shadow-sm)]'
                                                    : 'border-ed-rule text-ed-fg-muted hover:border-ed-accent/50 hover:text-ed-fg'
                                            }`}
                                        >
                                            {String(imageIndex + 1).padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                            </figcaption>
                        </figure>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}

function CarouselButton({
    label,
    onClick,
    pressed,
    children,
}: {
    label: string;
    onClick: () => void;
    pressed?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={pressed}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-surface text-ed-fg-muted transition-[color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:border-ed-accent/60 hover:text-ed-accent hover:shadow-[var(--ed-shadow-sm)] active:scale-95"
        >
            {children}
        </button>
    );
}
```

### `components/home/ArchiveBranch.tsx` **(replace existing)**

```tsx
import type { ReactNode } from 'react';

import { DeferredSearchFunctionDemo } from './DeferredSearchFunctionDemo';
import { ExpectationCard } from './ExpectationCard';
import { Reveal } from './Reveal';
import { SectionCta } from './SectionCta';
import { SectionHeading } from './SectionHeading';

type ArchiveBranchProps = {
    numeral: string;
    kicker: string;
    title: string;
    body: string;
    href: string;
    cta: string;
    details: ReadonlyArray<{ title: string; body: string }>;
    visual?: ReactNode;
    reverse?: boolean;
    showSearchDemo?: boolean;
};

export function ArchiveBranch({
    numeral,
    kicker,
    title,
    body,
    href,
    cta,
    details,
    visual,
    reverse = false,
    showSearchDemo = false,
}: ArchiveBranchProps) {
    if (visual) {
        return (
            <article
                className={`archive-section grid gap-10 lg:items-center lg:gap-16 ${
                    reverse ? 'lg:grid-cols-[1.15fr_0.85fr]' : 'lg:grid-cols-[0.85fr_1.15fr]'
                }`}
            >
                <div className={`min-w-0 ${reverse ? 'lg:order-2' : ''}`}>
                    <Reveal>
                        <p className="archive-kicker mb-6">{kicker}</p>
                    </Reveal>
                    <Reveal delay={70}>
                        <SectionHeading numeral={numeral} title={title} />
                    </Reveal>
                    <Reveal delay={140}>
                        <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                            {body}
                        </p>
                    </Reveal>

                    <div className="mt-8 grid gap-x-6 sm:grid-cols-2">
                        {details.map((item, itemIndex) => (
                            <Reveal key={item.title} delay={200 + itemIndex * 80}>
                                <ExpectationCard
                                    index={String(itemIndex + 1).padStart(2, '0')}
                                    title={item.title}
                                    body={item.body}
                                />
                            </Reveal>
                        ))}
                    </div>

                    <Reveal delay={200 + details.length * 80}>
                        <SectionCta href={href} label={cta} />
                    </Reveal>
                </div>

                <Reveal delay={160} className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>
                    {visual}
                </Reveal>
            </article>
        );
    }

    return (
        <article className="archive-section">
            <div className="max-w-3xl">
                <Reveal>
                    <p className="archive-kicker mb-6">{kicker}</p>
                </Reveal>
                <Reveal delay={70}>
                    <SectionHeading numeral={numeral} title={title} />
                </Reveal>
                <Reveal delay={140}>
                    <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                        {body}
                    </p>
                </Reveal>
            </div>

            <div className="mt-8 grid gap-x-8 divide-y divide-ed-rule border-y border-ed-rule sm:grid-cols-3">
                {details.map((item, itemIndex) => (
                    <Reveal key={item.title} delay={200 + itemIndex * 80}>
                        <ExpectationCard
                            index={String(itemIndex + 1).padStart(2, '0')}
                            title={item.title}
                            body={item.body}
                        />
                    </Reveal>
                ))}
            </div>

            <Reveal delay={200 + details.length * 80}>
                <SectionCta href={href} label={cta} />
            </Reveal>

            {showSearchDemo ? (
                <Reveal delay={120} className="mt-10 lg:mt-14">
                    <DeferredSearchFunctionDemo />
                </Reveal>
            ) : null}
        </article>
    );
}
```

### `components/home/VideoArchiveSection.tsx` **(replace existing)**

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import type { ReactNode } from 'react';

import { ExpectationCard } from './ExpectationCard';
import { Reveal } from './Reveal';
import { SectionCta } from './SectionCta';
import { SectionHeading } from './SectionHeading';
import { useAutoplayCarousel } from './useAutoplayCarousel';

const VIDEO_SLIDES = [
    {
        src: '/content/videos/thumbnails/friday-sermon-universal-unity-through-devotion-to-god-alone.webp',
        category: 'Friday sermon',
        title: 'Universal Unity Through Devotion to God Alone',
    },
    {
        src: '/content/videos/thumbnails/mathematical-miracle-of-quran.jpg',
        category: 'Instructional program',
        title: 'Mathematical Miracle of the Qur\'an',
    },
    {
        src: '/content/videos/thumbnails/friday-sermon-united-submitters-international-conference-1989.webp',
        category: 'Friday sermon',
        title: 'United Submitters International Conference, 1989',
    },
    {
        src: '/content/videos/thumbnails/united-submitters-international-conference-final-speech-by-dr-rashad-khalifa-1989.webp',
        category: 'Conference recording',
        title: 'Final Speech at the 1989 Conference',
    },
    {
        src: '/content/videos/thumbnails/essentials-of-submission-islam.jpg',
        category: 'Instructional program',
        title: 'Essentials of Submission',
    },
    {
        src: '/content/videos/thumbnails/principles-of-contact-prayers-salat.jpg',
        category: 'Instructional program',
        title: 'Principles of Contact Prayers',
    },
] as const;

const VIDEO_CAPABILITIES = [
    {
        title: 'Dated recordings',
        body: 'Sermons and conference material stay connected to their historical sequence.',
    },
    {
        title: 'Searchable speech',
        body: 'Transcripts make spoken passages findable without scrubbing through an entire recording.',
    },
    {
        title: 'Original context',
        body: 'Each record keeps its title, source, thumbnail, and playback page together.',
    },
    {
        title: 'Direct study',
        body: 'Move from an index result to the recording and its synchronized transcript.',
    },
] as const;

const ROTATION_MS = 6_200;

export function VideoArchiveSection() {
    const {
        rootRef,
        index,
        goTo,
        next,
        previous,
        reducedMotion,
        isManuallyPaused,
        setIsManuallyPaused,
        interactionProps,
    } = useAutoplayCarousel({
        count: VIDEO_SLIDES.length,
        intervalMs: ROTATION_MS,
    });

    const slide = VIDEO_SLIDES[index];

    return (
        <article className="archive-section grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:pt-5">
                <Reveal>
                    <SectionHeading numeral="I" title="Video archive" />
                </Reveal>
                <Reveal delay={80}>
                    <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                        Friday sermons, instructional programs, public talks, and United Submitters International conference recordings preserved as a visual study collection.
                    </p>
                </Reveal>

                <div className="mt-8 grid gap-x-6 divide-y divide-ed-rule sm:grid-cols-2">
                    {VIDEO_CAPABILITIES.map((item, itemIndex) => (
                        <Reveal key={item.title} delay={140 + itemIndex * 80}>
                            <ExpectationCard
                                index={String(itemIndex + 1).padStart(2, '0')}
                                title={item.title}
                                body={item.body}
                            />
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={140 + VIDEO_CAPABILITIES.length * 80}>
                    <SectionCta href="/videos" label="Browse the video archive" />
                </Reveal>
            </div>

            <Reveal delay={160} className="min-w-0">
                <div ref={rootRef} {...interactionProps} className="touch-pan-y">
                    <div className="lift-card relative overflow-hidden rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
                        <span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
                        />

                        <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                            <div>
                                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                                    Featured recording
                                </p>
                                <p className="mt-1 text-sm text-ed-fg" aria-live="polite">
                                    {slide.category}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <ControlButton label="Previous featured video" onClick={previous}>
                                    <ArrowLeft className="h-4 w-4" />
                                </ControlButton>
                                {!reducedMotion ? (
                                    <ControlButton
                                        label={isManuallyPaused ? 'Resume video rotation' : 'Pause video rotation'}
                                        onClick={() => setIsManuallyPaused((paused) => !paused)}
                                        pressed={isManuallyPaused}
                                    >
                                        {isManuallyPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                    </ControlButton>
                                ) : null}
                                <ControlButton label="Next featured video" onClick={next}>
                                    <ArrowRight className="h-4 w-4" />
                                </ControlButton>
                            </div>
                        </div>

                        <Link href="/videos" className="group relative block aspect-video overflow-hidden bg-ed-console">
                            <Image
                                key={slide.src}
                                src={slide.src}
                                alt={slide.title}
                                fill
                                quality={65}
                                sizes="(min-width: 1024px) 55vw, 100vw"
                                className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:animate-[archive-media-reveal_620ms_cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 group-hover:border-ed-console-accent group-hover:bg-ed-console-accent group-hover:text-ed-console">
                                    <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
                                </span>
                                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.17em] text-ed-console-accent">
                                    {slide.category}
                                </p>
                                <h4 className="mt-2 max-w-[20ch] font-display text-2xl leading-[1.02] text-ed-console-fg sm:text-4xl">
                                    {slide.title}
                                </h4>
                            </div>
                        </Link>

                        <div className="grid grid-cols-3 gap-px border-t border-ed-rule bg-ed-rule sm:grid-cols-6">
                            {VIDEO_SLIDES.map((item, itemIndex) => (
                                <button
                                    key={item.src}
                                    type="button"
                                    onClick={() => goTo(itemIndex)}
                                    aria-label={`Show ${item.title}`}
                                    aria-pressed={itemIndex === index}
                                    className={`relative min-h-20 overflow-hidden bg-ed-bg p-1 transition-colors ${
                                        itemIndex === index ? 'ring-2 ring-inset ring-ed-accent' : 'hover:bg-ed-surface'
                                    }`}
                                >
                                    <span className="relative block aspect-video overflow-hidden rounded-[3px] bg-ed-console">
                                        <Image
                                            src={item.src}
                                            alt=""
                                            fill
                                            quality={45}
                                            sizes="140px"
                                            className={`object-cover transition duration-300 ${
                                                itemIndex === index
                                                    ? 'opacity-100'
                                                    : 'opacity-55 grayscale hover:opacity-95 hover:grayscale-0'
                                            }`}
                                        />
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Reveal>
        </article>
    );
}

function ControlButton({
    label,
    onClick,
    pressed,
    children,
}: {
    label: string;
    onClick: () => void;
    pressed?: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            aria-pressed={pressed}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-surface text-ed-fg-muted transition-[color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 hover:border-ed-accent/60 hover:text-ed-accent hover:shadow-[var(--ed-shadow-sm)] active:scale-95"
        >
            {children}
        </button>
    );
}
```

### `components/home/AudioArchiveSection.tsx` **(replace existing)**

```tsx
'use client';

import Image from 'next/image';
import { Headphones, Play } from 'lucide-react';
import { useState } from 'react';

import { ExpectationCard } from './ExpectationCard';
import { Reveal } from './Reveal';
import { CtaLink, SectionCta } from './SectionCta';
import { SectionHeading } from './SectionHeading';

const AUDIO_CLIPS = [
    {
        id: 'qs01',
        label: 'Qur\'an study 01',
        title: 'Sura 72–73, Jinns and Night Prayer',
        thumbnail: '/content/audios/quran-studies/thumbnails/01-quran-study-from-azhar-1-sura-7219-28-and-sura-73-by-kathryn-jinns-05-26-1989.jpg',
        excerpt: 'When God\'s servant advocated Him alone, they almost crowded around him.',
        time: '18:42',
    },
    {
        id: 'qs07',
        label: 'Qur\'an study 07',
        title: 'Sura 62–63 and God\'s Religion Will Dominate',
        thumbnail: '/content/audios/quran-studies/thumbnails/07-quran-study-from-azhar-7-sura-62-and-sura-63-by-kathryn-gods-religion-will-dominate-in-20-to-50-yr.jpg',
        excerpt: 'The recording can be followed beside its searchable transcript and revisited by timestamp.',
        time: '31:06',
    },
    {
        id: 'messenger-audio',
        label: 'Messenger audio',
        title: 'Historical talks and preserved recordings',
        thumbnail: '/content/audios/messenger-audios/default.jpg',
        excerpt: 'The Messenger Audio collection preserves talks with titles, source context, and synchronized text where available.',
        time: 'Archive',
    },
] as const;

const AUDIO_CAPABILITIES = [
    {
        title: 'Read while listening',
        body: 'Synchronized transcripts keep the active passage beside the recording.',
    },
    {
        title: 'Return by timestamp',
        body: 'Search results and transcript rows open the recording at the relevant moment.',
    },
    {
        title: 'Two audio collections',
        body: 'Qur\'an studies and Messenger Audios remain distinct while sharing one interface.',
    },
    {
        title: 'Quote with caution',
        body: 'Transcripts support research, while the original recording remains the source of record.',
    },
] as const;

const WAVEFORM = [34, 58, 42, 78, 54, 92, 63, 46, 72, 39, 84, 56, 68, 44, 88, 61, 36, 75, 52, 94, 66, 47, 81, 59, 38, 73, 49, 86, 62, 43, 79, 55] as const;

export function AudioArchiveSection() {
    const [selected, setSelected] = useState(0);
    const clip = AUDIO_CLIPS[selected];

    return (
        <article className="archive-section grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
            <div className="min-w-0 lg:order-2 lg:pt-5">
                <Reveal>
                    <SectionHeading numeral="II" title="Audio archives" />
                </Reveal>
                <Reveal delay={80}>
                    <p className="mt-6 max-w-[62ch] text-[15px] leading-8 text-ed-fg-muted">
                        Qur&apos;an studies and Messenger recordings paired with searchable transcripts for close listening, quotation, and historical research.
                    </p>
                </Reveal>

                <div className="mt-8 grid gap-x-6 divide-y divide-ed-rule sm:grid-cols-2">
                    {AUDIO_CAPABILITIES.map((item, itemIndex) => (
                        <Reveal key={item.title} delay={140 + itemIndex * 80}>
                            <ExpectationCard
                                index={String(itemIndex + 1).padStart(2, '0')}
                                title={item.title}
                                body={item.body}
                            />
                        </Reveal>
                    ))}
                </div>

                <Reveal delay={140 + AUDIO_CAPABILITIES.length * 80}>
                    <SectionCta href="/audios" label="Browse the audio archives" />
                </Reveal>
            </div>

            <Reveal delay={160} className="min-w-0 lg:order-1">
                <div className="lift-card relative overflow-hidden rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
                    <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
                    />

                    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-bg text-ed-accent">
                                <Headphones className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div>
                                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                                    Listening desk
                                </p>
                                <p className="mt-1 text-sm text-ed-fg">Transcript-linked audio</p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold tabular-nums text-ed-fg-muted">
                            {String(selected + 1).padStart(2, '0')} / {String(AUDIO_CLIPS.length).padStart(2, '0')}
                        </span>
                    </div>

                    {/* The dark console — a deliberate "vault" moment in both themes */}
                    <div className="bg-ed-console px-4 py-5 text-ed-console-fg sm:px-6 sm:py-7">
                        <div className="grid gap-5 sm:grid-cols-[9rem_1fr] sm:items-center">
                            <div className="relative aspect-square overflow-hidden rounded-[var(--ed-radius-sm)] border border-ed-console-rule bg-ed-console-raised">
                                <Image
                                    key={clip.thumbnail}
                                    src={clip.thumbnail}
                                    alt=""
                                    fill
                                    quality={60}
                                    sizes="144px"
                                    className="object-cover motion-safe:animate-[archive-media-reveal_520ms_cubic-bezier(0.16,1,0.3,1)]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                                <span className="absolute bottom-3 left-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-sm">
                                    <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden="true" />
                                </span>
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.17em] text-ed-console-accent">{clip.label}</p>
                                <h4 className="mt-3 font-display text-2xl leading-[1.03] text-ed-console-fg sm:text-3xl">
                                    {clip.title}
                                </h4>
                                <p className="mt-3 text-sm leading-7 text-ed-console-muted">
                                    {clip.excerpt}
                                </p>
                            </div>
                        </div>

                        <div className="mt-7 border-t border-ed-console-rule pt-5">
                            <div className="flex h-20 items-center gap-[3px] overflow-hidden" aria-hidden="true">
                                {WAVEFORM.map((height, barIndex) => (
                                    <span
                                        key={`${clip.id}-${barIndex}`}
                                        className="block min-w-[3px] flex-1 rounded-full bg-ed-console-accent/70 transition-[transform,opacity] duration-500"
                                        style={{
                                            height: `${height}%`,
                                            opacity: barIndex < 20 ? 0.86 : 0.38,
                                            transform: selected % 2 === 0 && barIndex % 3 === 0 ? 'scaleY(0.82)' : 'scaleY(1)',
                                        }}
                                    />
                                ))}
                            </div>
                            <div className="mt-3 flex items-center justify-between font-mono text-xs tabular-nums text-ed-console-muted">
                                <span>Matched passage</span>
                                <span className="text-ed-console-accent">{clip.time}</span>
                            </div>
                        </div>
                    </div>

                    <div className="divide-y divide-ed-rule">
                        {AUDIO_CLIPS.map((item, itemIndex) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelected(itemIndex)}
                                aria-pressed={itemIndex === selected}
                                className={`grid min-h-20 w-full grid-cols-[3.25rem_1fr_auto] items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors sm:px-5 ${
                                    itemIndex === selected
                                        ? 'border-ed-accent bg-ed-accent/8 text-ed-fg'
                                        : 'border-transparent bg-ed-surface text-ed-fg-muted hover:bg-ed-bg hover:text-ed-fg'
                                }`}
                            >
                                <span className="relative aspect-square overflow-hidden rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-bg">
                                    <Image src={item.thumbnail} alt="" fill quality={45} sizes="52px" className="object-cover" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-[0.64rem] font-semibold uppercase tracking-[0.13em] text-ed-accent">
                                        {item.label}
                                    </span>
                                    <span className="mt-1 block truncate text-sm font-medium text-current">
                                        {item.title}
                                    </span>
                                </span>
                                <span className="font-mono text-xs tabular-nums text-ed-fg-muted">
                                    {String(itemIndex + 1).padStart(2, '0')}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-ed-rule px-4 py-3 sm:px-5">
                        <CtaLink href="/audios" label="Open the full listening interface" />
                    </div>
                </div>
            </Reveal>
        </article>
    );
}
```

### `components/home/WrittenArchiveVisual.tsx` **(replace existing)**

```tsx
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { CtaLink } from './SectionCta';

const SHELF_COVERS = [
    {
        id: 'quran1981',
        title: 'Quran: The Final Scripture (1981)',
        src: '/content/written/books/thumbnails/Quran1981.png',
    },
    {
        id: 'hard-cover-1989',
        title: 'Quran: The Final Testament (1989)',
        src: '/content/written/books/thumbnails/Hard Cover 1989.png',
    },
    {
        id: 'quran-hadith-islam',
        title: 'Quran, Hadith, and Islam',
        src: '/content/written/books/thumbnails/Quran, Hadith, and Islam.png',
    },
    {
        id: 'miracle-of-quran-alphabets',
        title: 'Miracle of the Quran',
        src: '/content/written/books/thumbnails/Miracle of Quran - Significance of the Mysterious Alphabets.png',
    },
    {
        id: 'computer-speaks',
        title: 'The Computer Speaks',
        src: "/content/written/books/thumbnails/The Computer Speaks God's Message to the World.jpg",
    },
] as const;

const SHELF_TILT = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1'] as const;

export function WrittenArchiveVisual() {
    return (
        <div className="lift-card relative overflow-hidden rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
            />

            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-bg text-ed-accent">
                        <BookOpen className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                            Reading room
                        </p>
                        <p className="mt-1 text-sm text-ed-fg">From the shelf</p>
                    </div>
                </div>
                <span className="text-xs font-semibold tabular-nums text-ed-fg-muted">
                    10 books · 64 newsletters
                </span>
            </div>

            <div className="relative bg-[color-mix(in_oklch,var(--ed-surface)_68%,var(--ed-bg))] px-4 pb-0 pt-8 sm:px-6 sm:pt-10">
                {/* Warm lamp glow over the shelf */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-10 top-0 h-40 bg-[radial-gradient(closest-side,color-mix(in_oklch,var(--ed-gold)_16%,transparent),transparent)] blur-xl"
                />
                <div className="relative mx-auto flex max-w-xl items-end justify-center">
                    {SHELF_COVERS.map((cover, index) => (
                        <Link
                            key={cover.id}
                            href={`/library/${cover.id}`}
                            aria-label={`Open ${cover.title}`}
                            className={`group relative -mx-2 block w-[22%] max-w-[8.5rem] origin-bottom rounded-[4px] border border-ed-rule bg-ed-bg shadow-[0_14px_35px_color-mix(in_oklch,var(--ed-fg)_16%,transparent)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] first:ml-0 last:mr-0 hover:z-10 hover:-translate-y-3 hover:rotate-0 hover:shadow-[var(--ed-shadow-lg)] ${SHELF_TILT[index]}`}
                            style={{ zIndex: index === 2 ? 5 : 4 - Math.abs(index - 2) }}
                        >
                            <span className="relative block aspect-[2/3] overflow-hidden rounded-[3px]">
                                <Image
                                    src={cover.src}
                                    alt={`Cover of ${cover.title}`}
                                    fill
                                    unoptimized
                                    sizes="140px"
                                    className="object-cover"
                                />
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 bg-gradient-to-t from-black/0 to-black/0 transition-colors duration-300 group-hover:from-black/12"
                                />
                            </span>
                        </Link>
                    ))}
                </div>
                <div
                    className="relative mx-auto h-2 max-w-2xl rounded-t-sm border-x border-t border-ed-rule bg-gradient-to-b from-ed-surface-strong to-ed-surface"
                    aria-hidden="true"
                />
            </div>

            <div className="border-t border-ed-rule px-4 py-3 sm:px-5">
                <CtaLink href="/written" label="Open the reading room" />
            </div>
        </div>
    );
}
```

### `components/home/QuranEditionsVisual.tsx` **(replace existing)**

```tsx
import { BookMarked } from 'lucide-react';

import { CtaLink } from './SectionCta';

const EDITIONS = [
    { label: 'Primary (1992)', active: true },
    { label: '1989', active: false },
    { label: '1981', active: false },
] as const;

export function QuranEditionsVisual() {
    return (
        <div className="lift-card relative overflow-hidden rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-md)]">
            <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-transparent via-ed-accent/60 to-transparent"
            />

            <div className="flex min-h-14 items-center justify-between gap-4 border-b border-ed-rule px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--ed-radius-sm)] border border-ed-rule bg-ed-bg text-ed-accent">
                        <BookMarked className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.15em] text-ed-fg-muted">
                            Verse study
                        </p>
                        <p className="mt-1 text-sm text-ed-fg">Sura 1 · The Key</p>
                    </div>
                </div>
                <span className="font-mono text-xs font-semibold tabular-nums text-ed-accent">1:1</span>
            </div>

            <div className="px-4 py-6 sm:px-6 sm:py-8">
                <div className="flex flex-wrap items-center gap-2" aria-hidden="true">
                    {EDITIONS.map((edition) => (
                        <span
                            key={edition.label}
                            className={`inline-flex min-h-8 items-center rounded-full border px-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition-colors ${
                                edition.active
                                    ? 'border-ed-accent bg-ed-accent/10 text-ed-accent'
                                    : 'border-ed-rule text-ed-fg-muted'
                            }`}
                        >
                            {edition.label}
                        </span>
                    ))}
                </div>

                {/* The verse panel — a softly lit page inside the card */}
                <div className="relative mt-7 overflow-hidden rounded-[var(--ed-radius-md)] border border-ed-rule bg-ed-bg px-5 py-7 sm:px-7">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_130%_at_50%_0%,color-mix(in_oklch,var(--ed-gold)_12%,transparent),transparent_60%)]"
                    />
                    <p
                        dir="rtl"
                        lang="ar"
                        className="relative text-center font-arabic text-[clamp(1.8rem,4vw,2.6rem)] leading-[1.9] text-ed-fg"
                    >
                        <span aria-hidden="true" className="mx-3 text-[0.6em] text-ed-accent">﴿</span>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        <span aria-hidden="true" className="mx-3 text-[0.6em] text-ed-accent">﴾</span>
                    </p>

                    <div className="relative mt-6 flex gap-4">
                        <span
                            aria-hidden="true"
                            className="w-[3px] shrink-0 rounded-full bg-gradient-to-b from-ed-accent to-ed-accent-soft"
                        />
                        <p className="font-display text-lg leading-8 text-ed-fg sm:text-xl">
                            In the name of GOD, Most Gracious, Most Merciful.
                        </p>
                    </div>
                </div>

                <p className="mt-6 max-w-[52ch] text-sm leading-7 text-ed-fg-muted">
                    Every verse carries its Arabic text, three English editions, and the
                    subtitles and footnotes recorded by Dr. Rashad Khalifa.
                </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ed-rule px-4 py-3 sm:px-5">
                <CtaLink href="/quran/1" label="Read Sura 1, The Key" />
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ed-fg-muted">
                    114 suras · 3 editions
                </span>
            </div>
        </div>
    );
}
```

### `components/home/DeferredSearchFunctionDemo.tsx` **(replace existing — placeholder restyle only)**

```tsx
'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const SearchFunctionDemo = dynamic(() => import('./SearchFunctionDemo'), {
    ssr: false,
    loading: () => <SearchDemoPlaceholder />,
});

export function DeferredSearchFunctionDemo() {
    const hostRef = useRef<HTMLDivElement>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const host = hostRef.current;
        if (!host || shouldLoad) return;

        if (!('IntersectionObserver' in window)) {
            queueMicrotask(() => setShouldLoad(true));
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setShouldLoad(true);
                observer.disconnect();
            },
            { rootMargin: '600px 0px', threshold: 0.01 },
        );

        observer.observe(host);
        return () => observer.disconnect();
    }, [shouldLoad]);

    return (
        <div ref={hostRef} className="min-h-[34rem] w-full">
            {shouldLoad ? <SearchFunctionDemo /> : <SearchDemoPlaceholder />}
        </div>
    );
}

function SearchDemoPlaceholder() {
    return (
        <div
            className="min-h-[34rem] w-full rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-sm)] motion-safe:animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
        />
    );
}
```

### `components/home/HomePageClient.tsx` **(replace existing)**

```tsx
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ArchiveBranch } from './ArchiveBranch';
import { AudioArchiveSection } from './AudioArchiveSection';
import { HeroSection } from './HeroSection';
import { QuranEditionsVisual } from './QuranEditionsVisual';
import { Reveal } from './Reveal';
import { VideoArchiveSection } from './VideoArchiveSection';
import { WrittenArchiveVisual } from './WrittenArchiveVisual';

const WRITTEN_CAPABILITIES = [
    {
        title: 'Books and publications',
        body: 'Full-length works by Dr. Rashad Khalifa, transcribed and connected to the archive search.',
    },
    {
        title: 'Every newsletter issue',
        body: 'Submitters Perspectives issues are indexed in full, not summarized.',
    },
    {
        title: 'Page-accurate results',
        body: 'Search results open the original scan at the matched page.',
    },
] as const;

const QURAN_CAPABILITIES = [
    {
        title: 'Three parallel editions',
        body: 'The 1981, 1989, and 1992 English editions appear beside the Arabic text.',
    },
    {
        title: 'Subtitles and footnotes',
        body: 'Dr. Rashad Khalifa\'s subtitles and footnotes are preserved with each verse.',
    },
    {
        title: 'Verse-level search',
        body: 'Search within a sura or across all 114 suras at once.',
    },
] as const;

const SEARCH_CAPABILITIES = [
    {
        title: 'Exact and nearby terms',
        body: 'Search exact phrases or find related words within the same passage.',
    },
    {
        title: 'One index, many formats',
        body: 'Recordings, newsletters, books, appendices, and Qur\'an editions appear together.',
    },
    {
        title: 'Open at the evidence',
        body: 'Playable results begin at the matched timestamp, while documents open at the relevant page.',
    },
] as const;

export default function HomePageClient() {
    return (
        <main id="main-content" className="ambient-page min-h-screen overflow-hidden bg-ed-bg text-ed-fg">
            <HeroSection />

            <section
                aria-labelledby="archive-pathways-title"
                className="mx-auto max-w-[1440px] px-4 pb-20 pt-16 sm:px-6 lg:px-10 lg:pb-28 lg:pt-28"
            >
                <header>
                    <Reveal>
                        <p className="archive-kicker">Ways into the collection</p>
                    </Reveal>
                    <div className="mt-7 grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-end lg:gap-14">
                        <Reveal delay={90}>
                            <h2
                                id="archive-pathways-title"
                                className="max-w-[16ch] font-display text-[clamp(2.75rem,7vw,5.75rem)] font-medium leading-[0.92] tracking-[-0.035em] text-ed-fg"
                            >
                                Five paths through{' '}
                                <em className="bg-gradient-to-br from-ed-accent to-ed-accent-soft bg-clip-text italic text-transparent">
                                    one archive.
                                </em>
                            </h2>
                        </Reveal>
                        <Reveal delay={180} className="lg:pb-2">
                            <p className="max-w-[38ch] text-[15px] leading-7 text-ed-fg-muted">
                                Browse by medium, then move from a catalog record to its original recording, transcript, or scan.
                            </p>
                            <p className="mt-4 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ed-fg-muted">
                                05 collections · 01 search index
                            </p>
                        </Reveal>
                    </div>
                    <Reveal delay={260}>
                        <div className="divider-fade mt-10 lg:mt-12" aria-hidden="true" />
                    </Reveal>
                </header>

                <div className="mt-16 space-y-24 lg:mt-24 lg:space-y-32">
                    <VideoArchiveSection />
                    <div className="divider-fade" aria-hidden="true" />
                    <AudioArchiveSection />
                    <div className="divider-fade" aria-hidden="true" />
                    <ArchiveBranch
                        numeral="III"
                        kicker="Books, newsletters, appendices"
                        title="Written archive"
                        body="Books, newsletters, and appendices by Dr. Rashad Khalifa, transcribed and connected to the same research search used across the whole collection."
                        href="/written"
                        cta="Browse the written archive"
                        details={WRITTEN_CAPABILITIES}
                        visual={<WrittenArchiveVisual />}
                    />
                    <div className="divider-fade" aria-hidden="true" />
                    <ArchiveBranch
                        numeral="IV"
                        kicker="Three editions, one text"
                        title="Qur'an editions"
                        body="Arabic text alongside the 1981, 1989, and 1992 English editions, with subtitles, footnotes, and verse-level search for all 114 suras."
                        href="/quran"
                        cta="Open the Qur'an editions"
                        details={QURAN_CAPABILITIES}
                        visual={<QuranEditionsVisual />}
                        reverse
                    />
                    <div className="divider-fade" aria-hidden="true" />
                    <ArchiveBranch
                        numeral="V"
                        kicker="Cross-collection search"
                        title="Search the archive"
                        body="Search names, verses, phrases, and recurring ideas across transcripts and written works. Results are ranked by exact phrases, nearby terms, and repeated evidence."
                        href="/search"
                        cta="Search the archive"
                        details={SEARCH_CAPABILITIES}
                        showSearchDemo
                    />
                </div>

                {/* Closing invitation — one luminous band to end the scroll */}
                <Reveal className="mt-24 lg:mt-32">
                    <section
                        aria-labelledby="closing-cta-title"
                        className="relative overflow-hidden rounded-[var(--ed-radius-xl)] bg-[linear-gradient(135deg,var(--ed-accent-strong),var(--ed-accent)_55%,var(--ed-accent-soft))] px-6 py-14 text-center shadow-[var(--ed-shadow-lg)] sm:px-12 lg:py-20"
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,oklch(1_0_0/0.16),transparent_65%)]"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
                            style={{ backgroundImage: 'var(--ed-grain)' }}
                        />
                        <div className="relative">
                            <p className="font-ui text-[0.72rem] font-bold uppercase tracking-[0.2em] text-ed-bg/80">
                                Begin anywhere
                            </p>
                            <h2
                                id="closing-cta-title"
                                className="mx-auto mt-5 max-w-[16ch] font-display text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.03em] text-ed-bg"
                            >
                                Start with a single search.
                            </h2>
                            <p className="mx-auto mt-5 max-w-[46ch] text-[15px] leading-7 text-ed-bg/85">
                                One query reaches every recording, transcript, newsletter, book, and verse in the collection.
                            </p>
                            <Link
                                href="/search"
                                className="group mt-9 inline-flex min-h-12 items-center gap-2.5 rounded-[var(--ed-radius-md)] bg-ed-bg px-7 font-ui text-sm font-semibold text-ed-fg shadow-[var(--ed-shadow-md)] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-0.5 hover:shadow-[var(--ed-shadow-lg)]"
                            >
                                Search the archive
                                <ArrowRight
                                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </section>
                </Reveal>
            </section>
        </main>
    );
}
```
