# Corpus Migration Audit

Generated: 2026-07-17T05:05:25.406Z

## Immediate conclusion

- **Keep** `data/sources/playlists/audio-transcripts`.
- **Keep** `data/sources/playlists/video-transcripts`.
- Treat the extracted complete-corpus folder as an import package only.
- Do not copy its shortened transcript files into the live transcript directories.

## Transcript comparison

- Package transcripts: 122
- Existing canonical transcripts: 153
- Exact duplicates: 122
- Same source but different content: 0
- Missing from canonical folders: 0
- Existing canonical CSVs not represented in the package: 31
- Exact duplicate groups already inside canonical folders: 0
- Same recording identity with conflicting canonical content: 0

## Enrichment

- Package enrichment files: 128
- Unique enrichment documents: 64
- Duplicate copies removed: 64
- Conflicting enrichment documents: 0
- Exact catalog mappings: 5
- YouTube fallback mappings: 44
- Repaired archive-number mappings: 15
- Unmatched after repair: 0

## Git state

```text
M .env.example
 M scripts/rag/build-and-ingest.ts
 M scripts/rag/lib/chunking.ts
 M scripts/rag/verify.ts
 M src/app/api/ask/route.ts
 M src/components/rag/SourceCard.tsx
 M src/lib/rag/mistral.ts
 M src/lib/rag/prompt.ts
 M src/lib/rag/retrieval.ts
 M src/lib/rag/sourceCards.ts
 M src/lib/rag/types.ts
?? "askarchives_complete_corpus_three_quran_editions_windows (1)/"
?? askarchives_safe_corpus_integration_kit/
?? askarchives_safe_corpus_integration_kit_v2/
?? docs/CORPUS_INTEGRATION_PLAN.md
?? reports/corpus-migration/
?? scripts/corpus/
?? scripts/rag/migrations/003_hybrid_retrieval.sql
```

## RAG files

- `scripts/rag/build-and-ingest.ts`: 9a5c9bdb00c84c851cce2403e0e505b90942f756f99a4fd29099f7e663bd3c9f — locally modified
- `scripts/rag/lib/chunking.ts`: a83a6bd4f1f6b43153c29c6925ccd48b154776a86aa66eccb5a1d83fcc77bd6f — locally modified
- `src/lib/rag/retrieval.ts`: 10e4fba312ed9ecfef5e1a0e68b9eadd3906d7e4e99e638ec4a5ebe4c25b0f4c — locally modified
- `src/lib/rag/prompt.ts`: 47ba562d31ab037cb07447363298952b3405f15f85012e7ced6922f1d11e4ee5 — locally modified
- `src/lib/rag/mistral.ts`: 30c93c5b9c657dc55527131c6d96ea0f5f150c827e1c623685e0219b2e9001b3 — locally modified
- `src/app/api/ask/route.ts`: 46965b0fbf8af58f7fe7e57fafa75a7458b63447f97f95118a7492375d975acb — locally modified
- `.env.example`: 893e2eab47b8578ed0fb21897d009c5180d1add7615cbb3838cd758097913ee4

## Next safe action

Run the `stage` command only after reviewing the JSON report. Staging imports enrichment, evaluation metadata, guides, and corpus comparison files. It does not delete or replace canonical transcripts.
