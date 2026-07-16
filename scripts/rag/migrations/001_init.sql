CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE rag_documents (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    display_title       TEXT,
    type                TEXT NOT NULL,
    author              TEXT,
    is_rashad_authored  BOOLEAN NOT NULL DEFAULT false,
    pdf_link            TEXT,
    youtube_id          TEXT,
    content_hash        TEXT NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE rag_chunks (
    id              BIGSERIAL PRIMARY KEY,
    document_id     TEXT NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    chunk_index     INT NOT NULL,
    text            TEXT NOT NULL,
    start_time      NUMERIC,
    end_time        NUMERIC,
    page            INT,
    speaker         TEXT,
    label           TEXT,
    content_hash    TEXT NOT NULL,
    embedding       vector(1024),
    tsv             TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', text)) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, chunk_index)
);

CREATE INDEX rag_chunks_embedding_idx ON rag_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX rag_chunks_tsv_idx ON rag_chunks USING GIN (tsv);
CREATE INDEX rag_chunks_document_id_idx ON rag_chunks (document_id);
