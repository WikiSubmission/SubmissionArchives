# Baseline Metrics

Recorded on branch `preview` as part of Phase 1 inventory.

## Catalog Validation

Command: `npm run validate:catalog`

```
FAILED: Command failed: npm run validate:catalog
file:///C:/Users/Jonathan/Desktop/SA/scripts/lib/archive-schema.mjs:161
    throw new Error(`Archive validation failed:\n${report.errors.map((error) => `- ${error}`).join('\n')}`);
          ^

Error: Archive validation failed:
- hard-cover-1989 references missing pdfLink: /content/books/Hard Cover 1989.pdf
    at assertValidArchiveRecords (file:///C:/Users/Jonathan/Desktop/SA/scripts/lib/archive-schema.mjs:161:11)
    at file:///C:/Users/Jonathan/Desktop/SA/scripts/validate/validate_catalog.mjs:14:16
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:665:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:117:5)

Node.js v22.22.1

```

## Production Build

Command: `npm run build`

Build succeeded.

`.next/` size: 1317.80 MB

## Docker Image Size

Docker was not built as part of this pass (out of scope for a fast, low-risk inventory run).
A future step should run:

```
docker build -t submission-archives-baseline .
docker images submission-archives-baseline
```
