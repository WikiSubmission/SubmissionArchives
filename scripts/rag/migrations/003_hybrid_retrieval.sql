-- Hybrid retrieval support for titles, aliases, transcript typo tolerance,
-- and separate precision/context passage types.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

ALTER TABLE rag_documents
  ADD COLUMN IF NOT EXISTS aliases TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE rag_chunks
  ADD COLUMN IF NOT EXISTS chunk_kind TEXT NOT NULL DEFAULT 'precision';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'rag_chunks_chunk_kind_check'
  ) THEN
    ALTER TABLE rag_chunks
      ADD CONSTRAINT rag_chunks_chunk_kind_check
      CHECK (chunk_kind IN ('precision', 'context'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS rag_documents_aliases_idx
  ON rag_documents USING GIN (aliases);

CREATE INDEX IF NOT EXISTS rag_documents_title_trgm_idx
  ON rag_documents USING GIN (
    f_unaccent(title || ' ' || COALESCE(display_title, '')) gin_trgm_ops
  );

CREATE INDEX IF NOT EXISTS rag_chunks_text_trgm_idx
  ON rag_chunks USING GIN (f_unaccent(text) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS rag_chunks_document_kind_index_idx
  ON rag_chunks (document_id, chunk_kind, chunk_index);

ANALYZE rag_documents;
ANALYZE rag_chunks;
