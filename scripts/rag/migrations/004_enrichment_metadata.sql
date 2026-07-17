-- Enrichment-aware retrieval while preserving canonical evidence separation.
-- rag_chunks remains the only quotable evidence table.

ALTER TABLE rag_documents
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS source_class TEXT,
  ADD COLUMN IF NOT EXISTS source_priority TEXT NOT NULL DEFAULT 'canonical',
  ADD COLUMN IF NOT EXISTS publication_date TEXT,
  ADD COLUMN IF NOT EXISTS date_precision TEXT,
  ADD COLUMN IF NOT EXISTS edition_year INT,
  ADD COLUMN IF NOT EXISTS genre TEXT,
  ADD COLUMN IF NOT EXISTS family_id TEXT,
  ADD COLUMN IF NOT EXISTS review_status TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE rag_chunks
  ADD COLUMN IF NOT EXISTS source_segment_start INT,
  ADD COLUMN IF NOT EXISTS source_segment_end INT,
  ADD COLUMN IF NOT EXISTS edition_year INT,
  ADD COLUMN IF NOT EXISTS evidence_kind TEXT NOT NULL DEFAULT 'archive-passage',
  ADD COLUMN IF NOT EXISTS verse_id TEXT;

CREATE TABLE IF NOT EXISTS rag_enrichment_sections (
  id                      TEXT PRIMARY KEY,
  enrichment_document_id  TEXT NOT NULL,
  section_id              TEXT NOT NULL,
  document_id             TEXT NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  title                   TEXT NOT NULL,
  summary                 TEXT NOT NULL DEFAULT '',
  search_text             TEXT NOT NULL,
  section_kind            TEXT,
  claim_classification    TEXT,
  concepts                TEXT[] NOT NULL DEFAULT '{}',
  user_terms              TEXT[] NOT NULL DEFAULT '{}',
  related_questions       TEXT[] NOT NULL DEFAULT '{}',
  quran_references        TEXT[] NOT NULL DEFAULT '{}',
  bible_references        TEXT[] NOT NULL DEFAULT '{}',
  entities                TEXT[] NOT NULL DEFAULT '{}',
  start_time              NUMERIC,
  end_time                NUMERIC,
  page_start              INT,
  page_end                INT,
  source_segment_start    INT,
  source_segment_end      INT,
  retrieval_priority      TEXT NOT NULL DEFAULT 'primary',
  retrieval_note          TEXT,
  review_status           TEXT NOT NULL DEFAULT 'draft',
  content_hash            TEXT NOT NULL,
  embedding               vector(1024),
  tsv                     TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', f_unaccent(search_text))
  ) STORED,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enrichment_document_id, section_id)
);

CREATE TABLE IF NOT EXISTS rag_document_relationships (
  source_document_id             TEXT NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  target_document_id             TEXT NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
  relationship                   TEXT NOT NULL,
  note                           TEXT,
  source_enrichment_document_id  TEXT,
  content_hash                   TEXT NOT NULL,
  PRIMARY KEY (source_document_id, target_document_id, relationship)
);

CREATE INDEX IF NOT EXISTS rag_documents_family_id_idx
  ON rag_documents (family_id);

CREATE INDEX IF NOT EXISTS rag_documents_source_priority_idx
  ON rag_documents (source_priority);

CREATE INDEX IF NOT EXISTS rag_documents_edition_year_idx
  ON rag_documents (edition_year);

CREATE INDEX IF NOT EXISTS rag_chunks_segment_bounds_idx
  ON rag_chunks (document_id, source_segment_start, source_segment_end)
  WHERE chunk_kind = 'precision';

CREATE INDEX IF NOT EXISTS rag_chunks_edition_year_idx
  ON rag_chunks (edition_year);

CREATE INDEX IF NOT EXISTS rag_chunks_verse_id_idx
  ON rag_chunks (verse_id)
  WHERE verse_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS rag_enrichment_sections_embedding_idx
  ON rag_enrichment_sections USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS rag_enrichment_sections_tsv_idx
  ON rag_enrichment_sections USING GIN (tsv);

CREATE INDEX IF NOT EXISTS rag_enrichment_sections_search_trgm_idx
  ON rag_enrichment_sections USING GIN (f_unaccent(search_text) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS rag_enrichment_sections_document_idx
  ON rag_enrichment_sections (document_id, retrieval_priority, review_status);

CREATE INDEX IF NOT EXISTS rag_enrichment_sections_time_idx
  ON rag_enrichment_sections (document_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS rag_enrichment_sections_page_idx
  ON rag_enrichment_sections (document_id, page_start, page_end);

CREATE INDEX IF NOT EXISTS rag_enrichment_sections_segment_idx
  ON rag_enrichment_sections (document_id, source_segment_start, source_segment_end);

CREATE INDEX IF NOT EXISTS rag_document_relationships_target_idx
  ON rag_document_relationships (target_document_id);

ANALYZE rag_documents;
ANALYZE rag_chunks;
ANALYZE rag_enrichment_sections;
ANALYZE rag_document_relationships;
