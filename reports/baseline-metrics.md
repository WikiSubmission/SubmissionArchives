# Baseline Metrics

Recorded on branch `preview` as part of Phase 1 inventory.

## Catalog Validation

Command: `npm run validate:catalog`

```
> submission-archives@0.1.0 validate:catalog
> node scripts/validate/validate_catalog.mjs

Validated 382 records and 113886 searchable segments.
```

## Production Build

Command: `npm run build`

Build succeeded.

`.next/` size: 783.16 MB

## Docker Image Size

Docker was not built as part of this pass (out of scope for a fast, low-risk inventory run).
A future step should run:

```
docker build -t submission-archives-baseline .
docker images submission-archives-baseline
```
