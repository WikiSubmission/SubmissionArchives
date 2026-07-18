-- Separate the embedding-input hash from the full content hash so that
-- metadata-only changes (review status, locators, retrieval priority) update
-- the row without forcing a re-embedding. embed_hash is nullable; the first
-- ingest after this migration backfills it via column-only updates without
-- calling the embedding API.

ALTER TABLE rag_chunks
  ADD COLUMN IF NOT EXISTS embed_hash TEXT;

ALTER TABLE rag_enrichment_sections
  ADD COLUMN IF NOT EXISTS embed_hash TEXT;
