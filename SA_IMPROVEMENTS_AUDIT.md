# SA Improvements Audit

Read-only survey of SA's current UI/functionality craft: icons, animation,
section transitions, and interaction states. Goal: find genuine weak points,
not manufacture polish work.

## Baseline: this codebase is already well-crafted

Before listing gaps, it's worth being honest about what's already good,
since forcing in external libraries where nothing is broken would be the
exact mistake this task warns against:

- **Icons**: 24 files use `lucide-react` consistently (already installed,
  ISC-licensed). One clean icon system, not a mix.
- **Animation**: no framer-motion; hand-rolled CSS keyframes with correct,
  deliberate easing (`cubic-bezier(0.16, 1, 0.3, 1)` — a proper ease-out
  curve, exactly what emilkowalski/skills calls out as the common AI mistake
  to avoid: using ease-in where ease-out belongs). Every animation respects
  `prefers-reduced-motion` via a global override block. A code comment in
  `globals.css` even documents that framer-motion was deliberately removed
  in favor of these CSS animations.
- **Section transitions**: `HomePage.tsx` already separates every major
  section with a `divider-fade` (soft opacity fade), not a hard rule or
  abrupt cut. This is a more restrained choice than a decorative SVG divider
  would be.
- **Hover states**: `MediaCard`/`MediaList` already have layered hover
  treatment (lift, border, shadow, image zoom, title color shift), all
  `motion-safe`-gated.

## Genuine gaps found

### 1. Icon inconsistency: `Footer.tsx` hand-rolls a chevron SVG

`src/components/layout/Footer.tsx:44` hand-draws a chevron-down icon as a
raw `<svg>` with a hardcoded `m6 9 6 6 6-6` path, immediately below icons
sourced from `lucide-react` (`Youtube`, `MessageCircle`) in the same file.
It's functionally identical to `lucide-react`'s `ChevronDown`, which is
already imported 24 times elsewhere in the codebase. This is a real, if
small, consistency gap — one file diverges from the icon system the rest of
the app already uses.

The only other inline `<svg>` outside `lucide-react`
(`src/app/quran/[chapter]/QuranChapterClient.tsx:394`) is a bespoke
geometric rosette/seal graphic used as a decorative verse-marker badge —
not a generic icon, and not something an icon library would represent. Left
alone; replacing it would remove intentional bespoke design, not fix a gap.

### 2. Search loading state has no visual treatment

`src/app/search/SearchClient.tsx:556-560` renders `isSearching` as plain
centered text ("Searching the archive...") with zero visual loading
affordance — no skeleton, no pulse, nothing. This is the single most
important interactive feature on the site, and it's the one place in the
app that doesn't follow the app's own established loading convention.

Every route-level `loading.tsx` in this codebase (`src/app/loading.tsx`,
`src/app/written/loading.tsx`, `src/app/quran/loading.tsx`, and five others)
already uses a consistent skeleton pattern: shape-matched placeholder blocks
with a `soft-shell` class and Tailwind's `animate-pulse`. The search
client-side loading state is the outlier that never adopted this pattern —
likely because it's a client-state transition, not a route navigation, so
it never went through the same `loading.tsx` convention.

## Explicitly considered and not pursued

- **Phosphor Icons**: not used. The one icon gap found is solved by the
  icon system already installed and used 24 times (`lucide-react`).
  Introducing Phosphor for a single chevron would create a second icon
  system in the same file — a new inconsistency, not a fix.
- **Animista**: not used. The search loading fix reuses the app's own
  already-correct `animate-pulse` convention rather than sourcing a new
  external snippet; there's no motion gap where Animista would add
  something the codebase doesn't already do well.
- **Skiper UI**: not used. No component gap was found that isn't already
  covered by an existing, better-fitting in-house pattern (see above). No
  marquee, hover-card, or similar Skiper-shaped component has a natural,
  justified place in this content (a religious text archive, not a
  marketing site) without being decoration for its own sake.
- **Shape Divider**: not used. Section breaks are already handled with soft
  fade dividers, a more restrained and consistent choice for this design
  language than decorative wave SVGs.
- **Variant**: not used for direct changes (by design, it's inspiration-only
  per the brief). No structural layout weakness was found that would
  warrant flagging a bigger direction change — see SA_IMPROVEMENTS_PLAN.md.

## Consulted

`emilkowalski/skills` (via GitHub) was checked before touching the search
loading state: its core rule — correct easing (ease-out for enters, not
ease-in), and restraint (know what *not* to animate) — is already what this
codebase does. The fix below adds a `animate-pulse` skeleton (an ambient
waiting state, not an enter animation), consistent with both the site's own
convention and emilkowalski's guidance not to over-animate.
