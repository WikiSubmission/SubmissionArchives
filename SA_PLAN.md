# SA Reorg Plan

Target structure: no new top-level directories. `scripts/` already provides
the right home (`scripts/process/`), so this plan relocates into the existing
convention rather than inventing a new one.

## Rename map

| Old path | New path |
|---|---|
| `convert_to_csv.py` | `scripts/process/convert_to_csv.py` |
| `fetch_transcripts.py` | `scripts/process/fetch_transcripts.py` |
| `process_csv_speakers.py` | `scripts/process/process_csv_speakers.py` |

## References to update

None. Per the Loop 1 audit, no file in the repo references these scripts by
path or name, and their internal I/O paths are cwd-relative rather than
`__file__`-relative, so they continue to work unchanged from the new location
when invoked from the repo root (consistent with how every other script under
`scripts/` is already run).

## Duplicate "dat" folders

None found. `data/`, `public/data/`, and `src/data/` serve distinct,
non-overlapping roles (see SA_AUDIT.md) and are explicitly out of scope for
this pass. No archive/dedup action is needed or planned.

## Execution

Single group, single commit: `git mv` all three files into `scripts/process/`,
commit with a message describing what moved.
