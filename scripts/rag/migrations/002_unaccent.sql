-- Accent-insensitive full-text search: "deja vu" must match "Déjà Vu".
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Generated columns require IMMUTABLE expressions; unaccent() is only STABLE,
-- so wrap it with an explicit dictionary reference (standard practice).
CREATE OR REPLACE FUNCTION f_unaccent(text)
RETURNS text AS
$$ SELECT public.unaccent('public.unaccent', $1) $$
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

DROP INDEX IF EXISTS rag_chunks_tsv_idx;
ALTER TABLE rag_chunks DROP COLUMN IF EXISTS tsv;
ALTER TABLE rag_chunks ADD COLUMN tsv tsvector
    GENERATED ALWAYS AS (to_tsvector('english', f_unaccent(text))) STORED;
CREATE INDEX rag_chunks_tsv_idx ON rag_chunks USING GIN (tsv);
