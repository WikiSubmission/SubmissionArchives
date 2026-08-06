# SA Improvements Plan

## Safe-to-auto-apply

| Gap | Fix | Source | License |
|---|---|---|---|
| `Footer.tsx` hand-rolled chevron SVG | Replace with `ChevronDown` from `lucide-react` | Already-installed `lucide-react` (not Phosphor — see reasoning in audit) | ISC (already in use repo-wide) |
| `SearchClient.tsx` plain-text loading state | Add shape-matched skeleton cards using the app's existing `soft-shell` + `animate-pulse` convention (same pattern as `src/app/*/loading.tsx`), keep the text as an accessible label | In-house pattern already used in 8 other files (not a new external pull) | N/A — no new dependency |

Both are drop-in, low-risk, single-file-scoped changes. No new dependency,
no bundle size impact.

## Flagged, not auto-applied

None. No structural or direction-level gap was found that would warrant a
Variant-inspired layout overhaul, a Skiper UI component pull, or a Shape
Divider section break. The audit's "explicitly considered and not pursued"
section documents why each toolkit entry doesn't apply here — see
SA_IMPROVEMENTS_AUDIT.md.

## Execution order

1. Icon fix (`Footer.tsx`) — isolated, no dependency on the other change.
2. Search loading skeleton (`SearchClient.tsx`) — isolated.

Two commits, one per change type, each attributing what it reuses.
