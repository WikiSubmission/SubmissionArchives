# SA Improvements Report

## What was added

| Fix | Source | Real gap it fills |
|---|---|---|
| `Footer.tsx`: hand-rolled chevron SVG → `lucide-react` `ChevronDown` | Already-installed `lucide-react` (ISC license, already used 24 times repo-wide) | One file diverged from the icon system the rest of the app already uses consistently |
| `SearchClient.tsx`: plain-text `isSearching` state → shape-matched skeleton (`soft-shell` + `animate-pulse`) | The app's own existing loading convention, already used in 8 route-level `loading.tsx` files | Search is the site's primary interactive feature and the one place that never adopted the app's own loading pattern; verified via a live server-action round trip that this state is real and perceptible, not theoretical |

Both are single-file, drop-in changes. No new dependency, no bundle size
impact — both were solved by resources already inside the codebase, which
turned out to be the correct source in both cases (see below).

## Toolkit items considered and not used, and why

- **Phosphor Icons** — not used. The icon gap was solved by `lucide-react`,
  already installed and standardized on. Pulling in Phosphor for one glyph
  would have created a second icon system, a new inconsistency rather than
  a fix.
- **Animista** — not used. The loading-state fix reuses `animate-pulse`,
  the app's own already-correct convention. No motion gap existed that
  Animista would have filled better.
- **Skiper UI** — not used. No component gap was found that wasn't already
  covered by a better-fitting in-house pattern.
- **Shape Divider** — not used. Section breaks already use soft fade
  dividers (`divider-fade`), a more restrained choice for this design
  language than decorative SVG waves.
- **Variant** — not used for direct changes, per its inspiration-only role.
  See below for the one structural note worth flagging.

## Consulted

`emilkowalski/skills` was checked before touching motion-adjacent code. Its
core rule — correct easing (ease-out for enters, not ease-in) and restraint
(know what not to animate) — is already what this codebase does throughout
(e.g. `cubic-bezier(0.16, 1, 0.3, 1)` on reveal animations, `prefers-reduced-motion`
handled globally). The skeleton fix adds an ambient waiting-state pulse, not
an enter animation, consistent with that guidance.

## Bigger direction ideas flagged, not auto-applied

None. The audit found this to be an unusually polished, already-considered
codebase — hand-rolled CSS animations with correct easing, layered hover
states, restrained section transitions, and a consistent icon system almost
everywhere. No Variant-style layout overhaul was warranted by anything the
exploration turned up. If there's a specific direction you want explored
regardless, that's a distinct ask from "find genuine weak points," and
worth its own conversation.

## Verification performed

- `tsc --noEmit`: zero new errors from either change. Three pre-existing
  `Cannot find module` errors for `ScripturesVisual`/`ScriptureTabs` exist
  on this branch, confirmed via `git log` to trace to commit `f9794d5` —
  the base commit this branch was created from, before any change in this
  session. Unrelated to this work.
- Live browser verification (not just static checks): connected to the
  already-running dev server, confirmed the footer's mobile accordion
  chevrons render as `lucide-chevron-down` at mobile viewport width across
  all three sections, confirmed `searchTranscripts` is a genuine
  server-action round trip (not instant), and confirmed zero console errors
  after triggering a real search.

## One process note

Partway through this session, `HEAD` moved from this branch to
`chore/sa-reorg-audit` without a command from me (confirmed via `git
reflog`) — almost certainly a concurrent process or session working in the
same directory. The icon fix briefly landed as a commit on
`chore/sa-reorg-audit` (`277fdce`) as a result. That branch was left
untouched rather than rewritten, given the concurrent activity; the fix was
then redone cleanly on this branch (`6f0d920`). `277fdce` is a harmless,
correct duplicate sitting on the wrong branch — safe to drop with an
interactive rebase whenever convenient, or just leave it.

## Commits (in order)

1. `fix: replace hand-rolled chevron SVG with lucide-react ChevronDown`
2. `fix: add skeleton loading state to search results`
3. `docs: add SA improvements audit and plan`
4. `docs: add SA improvements report` (this file)

All on branch `feat/oss-ui-improvements`, branched from `main`. Nothing
pushed or merged.
