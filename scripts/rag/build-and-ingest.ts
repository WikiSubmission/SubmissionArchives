import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { PoolClient } from 'pg';
import './lib/env';
import { getPool, closePool } from './lib/db';
import { sha256 } from './lib/hash';
import { buildChunks, type RagChunkDraft } from './lib/chunking';
import {
  loadEnrichmentCorpus,
  type RagDocumentMetadata,
  type RagEnrichmentSectionDraft,
  type RagRelationshipDraft,
} from './lib/enrichment';
import { embedBatch } from './lib/mistral';
import type { ArchiveRecord } from '../../src/types/archive';

const MASTER_INDEX_PATH = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);
const EMBED_MODEL = process.env.MISTRAL_EMBED_MODEL || 'mistral-embed-2312';
const BATCH_SIZE = Number(process.env.RAG_EMBED_BATCH_SIZE) || 32;
const EMBED_DIMENSION = Number(process.env.RAG_EMBED_DIMENSION) || 1024;

// v4 separates canonical evidence from enrichment metadata and adds edition-aware fields.
const EMBED_VERSION = 'v4-enrichment-canonical-resolution';

interface Summary {
  documentsProcessed: number;
  documentsSkipped: number;
  canonicalChunksEmbedded: number;
  canonicalChunksSkipped: number;
  canonicalChunksDeleted: number;
  enrichmentSectionsEmbedded: number;
  enrichmentSectionsSkipped: number;
  enrichmentSectionsDeleted: number;
  relationshipsWritten: number;
  relationshipsSkipped: number;
  documentsDeleted: number;
}

interface HashedChunk {
  draft: RagChunkDraft;
  hash: string;
  embedInput: string;
}

interface HashedSection {
  draft: RagEnrichmentSectionDraft;
  hash: string;
  embedInput: string;
}

function isRashadAuthored(record: ArchiveRecord): boolean {
  return record.author === 'Dr. Rashad Khalifa';
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function buildDocumentHash(
  record: ArchiveRecord,
  metadata: RagDocumentMetadata,
  chunkHashes: string[],
  sectionHashes: string[],
): string {
  return sha256(
    stableJson({
      embedVersion: EMBED_VERSION,
      title: record.title,
      displayTitle: record.displayTitle ?? null,
      type: record.type,
      category: record.category,
      author: record.author ?? null,
      aliases: record.aliases ?? [],
      pdfLink: record.pdfLink ?? null,
      youtubeId: record.youtubeId ?? null,
      metadata,
      chunkHashes,
      sectionHashes,
    }),
  );
}

function buildEmbeddingInput(
  record: ArchiveRecord,
  metadata: RagDocumentMetadata,
  draft: RagChunkDraft,
): string {
  const documentTitle = record.displayTitle ?? record.title;
  const lines = [
    `Document: ${documentTitle}`,
    record.aliases?.length ? `Also known as: ${record.aliases.join('; ')}` : '',
    `Source type: ${record.type}`,
    metadata.sourceClass ? `Source class: ${metadata.sourceClass}` : '',
    metadata.publicationDate ? `Date: ${metadata.publicationDate}` : '',
    draft.editionYear ? `Edition: ${draft.editionYear}` : '',
    metadata.sourcePriority ? `Source priority: ${metadata.sourcePriority}` : '',
    record.author ? `Document author: ${record.author}` : '',
    draft.speaker ? `Speaker: ${draft.speaker}` : '',
    draft.label ? `Section: ${draft.label}` : '',
    draft.verseId ? `Verse: ${draft.verseId}` : '',
    `Evidence kind: ${draft.evidenceKind}`,
    `Passage type: ${draft.chunkKind}`,
    'Canonical archive passage:',
    draft.text,
  ];

  return lines.filter(Boolean).join('\n');
}

function buildEnrichmentEmbeddingInput(
  record: ArchiveRecord,
  metadata: RagDocumentMetadata,
  draft: RagEnrichmentSectionDraft,
): string {
  const lines = [
    'Retrieval metadata only. This text is never quotable evidence.',
    `Canonical document: ${record.displayTitle ?? record.title}`,
    metadata.publicationDate ? `Date: ${metadata.publicationDate}` : '',
    metadata.sourcePriority ? `Source priority: ${metadata.sourcePriority}` : '',
    `Topic section: ${draft.title}`,
    draft.searchText,
    draft.retrievalNote ? `Retrieval note: ${draft.retrievalNote}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function hashChunks(
  record: ArchiveRecord,
  metadata: RagDocumentMetadata,
  drafts: RagChunkDraft[],
): HashedChunk[] {
  return drafts.map((draft) => {
    const embedInput = buildEmbeddingInput(record, metadata, draft);
    return {
      draft,
      embedInput,
      hash: sha256(`${EMBED_VERSION}:canonical:${embedInput}`),
    };
  });
}

function hashSections(
  record: ArchiveRecord,
  metadata: RagDocumentMetadata,
  drafts: RagEnrichmentSectionDraft[],
): HashedSection[] {
  return drafts.map((draft) => {
    const embedInput = buildEnrichmentEmbeddingInput(record, metadata, draft);
    return {
      draft,
      embedInput,
      hash: sha256(`${EMBED_VERSION}:enrichment:${embedInput}`),
    };
  });
}

async function embedChanged<T extends { hash: string; embedInput: string }>(
  items: T[],
): Promise<Map<string, number[]>> {
  const embeddingsByHash = new Map<string, number[]>();
  const unique = [...new Map(items.map((item) => [item.hash, item])).values()];

  for (let index = 0; index < unique.length; index += BATCH_SIZE) {
    const batch = unique.slice(index, index + BATCH_SIZE);
    const embeddings = await embedBatch(
      batch.map((item) => item.embedInput),
      EMBED_MODEL,
    );
    if (
      embeddings.length !== batch.length
      || embeddings.some((embedding) => embedding.length !== EMBED_DIMENSION)
    ) {
      throw new Error(
        `Embedding batch shape mismatch: expected ${batch.length} x ${EMBED_DIMENSION}, `
          + `received ${embeddings.length} item(s).`,
      );
    }
    batch.forEach((item, batchIndex) => {
      embeddingsByHash.set(item.hash, embeddings[batchIndex]);
    });
  }

  return embeddingsByHash;
}

function exactHashSet(
  expected: Array<{ key: string | number; hash: string }>,
  existing: Array<{ key: string | number; hash: string }>,
): boolean {
  if (expected.length !== existing.length) return false;
  const existingMap = new Map(existing.map((item) => [String(item.key), item.hash]));
  return expected.every((item) => existingMap.get(String(item.key)) === item.hash);
}

async function upsertDocument(
  client: PoolClient,
  record: ArchiveRecord,
  metadata: RagDocumentMetadata,
  documentHash: string,
): Promise<void> {
  await client.query(
    `INSERT INTO rag_documents (
       id, title, display_title, type, category, author, aliases, is_rashad_authored,
       pdf_link, youtube_id, source_class, source_priority, publication_date,
       date_precision, edition_year, genre, family_id, review_status, metadata,
       content_hash, updated_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6, $7, $8,
       $9, $10, $11, $12, $13,
       $14, $15, $16, $17, $18, $19,
       $20, now()
     )
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       display_title = EXCLUDED.display_title,
       type = EXCLUDED.type,
       category = EXCLUDED.category,
       author = EXCLUDED.author,
       aliases = EXCLUDED.aliases,
       is_rashad_authored = EXCLUDED.is_rashad_authored,
       pdf_link = EXCLUDED.pdf_link,
       youtube_id = EXCLUDED.youtube_id,
       source_class = EXCLUDED.source_class,
       source_priority = EXCLUDED.source_priority,
       publication_date = EXCLUDED.publication_date,
       date_precision = EXCLUDED.date_precision,
       edition_year = EXCLUDED.edition_year,
       genre = EXCLUDED.genre,
       family_id = EXCLUDED.family_id,
       review_status = EXCLUDED.review_status,
       metadata = EXCLUDED.metadata,
       content_hash = EXCLUDED.content_hash,
       updated_at = now()`,
    [
      record.id,
      record.title,
      record.displayTitle ?? null,
      record.type,
      record.category ?? metadata.category,
      record.author ?? null,
      record.aliases ?? [],
      isRashadAuthored(record),
      record.pdfLink ?? null,
      record.youtubeId ?? null,
      metadata.sourceClass,
      metadata.sourcePriority,
      metadata.publicationDate,
      metadata.datePrecision,
      metadata.editionYear,
      metadata.genre,
      metadata.familyId,
      metadata.reviewStatus,
      JSON.stringify(metadata.metadata),
      documentHash,
    ],
  );
}

async function upsertChunk(
  client: PoolClient,
  item: HashedChunk,
  embedding: number[],
  documentId: string,
): Promise<void> {
  const { draft, hash } = item;
  await client.query(
    `INSERT INTO rag_chunks (
       document_id, chunk_index, chunk_kind, text, start_time, end_time,
       page, speaker, label, source_segment_start, source_segment_end,
       edition_year, evidence_kind, verse_id, content_hash, embedding
     )
     VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13, $14, $15, $16
     )
     ON CONFLICT (document_id, chunk_index) DO UPDATE SET
       chunk_kind = EXCLUDED.chunk_kind,
       text = EXCLUDED.text,
       start_time = EXCLUDED.start_time,
       end_time = EXCLUDED.end_time,
       page = EXCLUDED.page,
       speaker = EXCLUDED.speaker,
       label = EXCLUDED.label,
       source_segment_start = EXCLUDED.source_segment_start,
       source_segment_end = EXCLUDED.source_segment_end,
       edition_year = EXCLUDED.edition_year,
       evidence_kind = EXCLUDED.evidence_kind,
       verse_id = EXCLUDED.verse_id,
       content_hash = EXCLUDED.content_hash,
       embedding = EXCLUDED.embedding`,
    [
      documentId,
      draft.chunkIndex,
      draft.chunkKind,
      draft.text,
      draft.startTime,
      draft.endTime,
      draft.page,
      draft.speaker,
      draft.label,
      draft.sourceSegmentStart,
      draft.sourceSegmentEnd,
      draft.editionYear,
      draft.evidenceKind,
      draft.verseId,
      hash,
      `[${embedding.join(',')}]`,
    ],
  );
}

async function upsertSection(
  client: PoolClient,
  item: HashedSection,
  embedding: number[],
): Promise<void> {
  const { draft, hash } = item;
  await client.query(
    `INSERT INTO rag_enrichment_sections (
       id, enrichment_document_id, section_id, document_id, title, summary,
       search_text, section_kind, claim_classification, concepts, user_terms,
       related_questions, quran_references, bible_references, entities,
       start_time, end_time, page_start, page_end,
       source_segment_start, source_segment_end, retrieval_priority,
       retrieval_note, review_status, content_hash, embedding, updated_at
     )
     VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13, $14, $15,
       $16, $17, $18, $19,
       $20, $21, $22,
       $23, $24, $25, $26, now()
     )
     ON CONFLICT (id) DO UPDATE SET
       enrichment_document_id = EXCLUDED.enrichment_document_id,
       section_id = EXCLUDED.section_id,
       document_id = EXCLUDED.document_id,
       title = EXCLUDED.title,
       summary = EXCLUDED.summary,
       search_text = EXCLUDED.search_text,
       section_kind = EXCLUDED.section_kind,
       claim_classification = EXCLUDED.claim_classification,
       concepts = EXCLUDED.concepts,
       user_terms = EXCLUDED.user_terms,
       related_questions = EXCLUDED.related_questions,
       quran_references = EXCLUDED.quran_references,
       bible_references = EXCLUDED.bible_references,
       entities = EXCLUDED.entities,
       start_time = EXCLUDED.start_time,
       end_time = EXCLUDED.end_time,
       page_start = EXCLUDED.page_start,
       page_end = EXCLUDED.page_end,
       source_segment_start = EXCLUDED.source_segment_start,
       source_segment_end = EXCLUDED.source_segment_end,
       retrieval_priority = EXCLUDED.retrieval_priority,
       retrieval_note = EXCLUDED.retrieval_note,
       review_status = EXCLUDED.review_status,
       content_hash = EXCLUDED.content_hash,
       embedding = EXCLUDED.embedding,
       updated_at = now()`,
    [
      draft.id,
      draft.enrichmentDocumentId,
      draft.sectionId,
      draft.documentId,
      draft.title,
      draft.summary,
      draft.searchText,
      draft.sectionKind,
      draft.claimClassification,
      draft.concepts,
      draft.userTerms,
      draft.relatedQuestions,
      draft.quranReferences,
      draft.bibleReferences,
      draft.entities,
      draft.startTime,
      draft.endTime,
      draft.pageStart,
      draft.pageEnd,
      draft.sourceSegmentStart,
      draft.sourceSegmentEnd,
      draft.retrievalPriority,
      draft.retrievalNote,
      draft.reviewStatus,
      hash,
      `[${embedding.join(',')}]`,
    ],
  );
}

async function refreshRelationships(
  client: PoolClient,
  relationships: RagRelationshipDraft[],
): Promise<{ written: number; skipped: number }> {
  const documentIds = new Set(
    (await client.query<{ id: string }>('SELECT id FROM rag_documents')).rows.map(
      (row) => row.id,
    ),
  );
  const valid = relationships.filter(
    (relationship) =>
      documentIds.has(relationship.sourceDocumentId)
      && documentIds.has(relationship.targetDocumentId),
  );

  await client.query('DELETE FROM rag_document_relationships');
  for (const relationship of valid) {
    const hash = sha256(stableJson(relationship));
    await client.query(
      `INSERT INTO rag_document_relationships (
         source_document_id, target_document_id, relationship, note,
         source_enrichment_document_id, content_hash
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (source_document_id, target_document_id, relationship) DO UPDATE SET
         note = EXCLUDED.note,
         source_enrichment_document_id = EXCLUDED.source_enrichment_document_id,
         content_hash = EXCLUDED.content_hash`,
      [
        relationship.sourceDocumentId,
        relationship.targetDocumentId,
        relationship.relationship,
        relationship.note,
        relationship.sourceEnrichmentDocumentId,
        hash,
      ],
    );
  }
  return { written: valid.length, skipped: relationships.length - valid.length };
}

async function pruneStaleDocuments(
  client: PoolClient,
  activeDocumentIds: string[],
): Promise<number> {
  if (activeDocumentIds.length === 0) return 0;
  const result = await client.query(
    `DELETE FROM rag_documents
     WHERE NOT (id = ANY($1::text[]))`,
    [activeDocumentIds],
  );
  return result.rowCount ?? 0;
}

async function main(): Promise<void> {
  const allRecords: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const limit = Number(process.env.RAG_INGEST_LIMIT) || undefined;
  const records = limit ? allRecords.slice(0, limit) : allRecords;
  const enrichment = loadEnrichmentCorpus(allRecords);
  const pool = getPool();

  for (const warning of enrichment.warnings) console.warn(`Enrichment warning: ${warning}`);
  console.log('Enrichment corpus:', enrichment.statistics);

  const summary: Summary = {
    documentsProcessed: 0,
    documentsSkipped: 0,
    canonicalChunksEmbedded: 0,
    canonicalChunksSkipped: 0,
    canonicalChunksDeleted: 0,
    enrichmentSectionsEmbedded: 0,
    enrichmentSectionsSkipped: 0,
    enrichmentSectionsDeleted: 0,
    relationshipsWritten: 0,
    relationshipsSkipped: 0,
    documentsDeleted: 0,
  };

  for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
    const record = records[recordIndex];
    if (!record.segments?.length) continue;

    const metadata = enrichment.documents.get(record.id) ?? {
      category: record.category ?? null,
      sourceClass: null,
      sourcePriority: 'canonical',
      publicationDate: record.fullDate ?? record.date ?? null,
      datePrecision: null,
      editionYear: record.editionYear ?? (record.type === 'quran' ? 1992 : null),
      genre: null,
      familyId: record.id,
      reviewStatus: null,
      metadata: {},
    } satisfies RagDocumentMetadata;

    const chunks = hashChunks(record, metadata, buildChunks(record));
    const sections = hashSections(
      record,
      metadata,
      enrichment.sectionsByDocument.get(record.id) ?? [],
    );
    const documentHash = buildDocumentHash(
      record,
      metadata,
      chunks.map((item) => item.hash),
      sections.map((item) => item.hash),
    );

    const [existingDocResult, existingChunksResult, existingSectionsResult] = await Promise.all([
      pool.query<{ content_hash: string }>(
        'SELECT content_hash FROM rag_documents WHERE id = $1',
        [record.id],
      ),
      pool.query<{ chunk_index: number; content_hash: string }>(
        'SELECT chunk_index, content_hash FROM rag_chunks WHERE document_id = $1',
        [record.id],
      ),
      pool.query<{ id: string; content_hash: string }>(
        'SELECT id, content_hash FROM rag_enrichment_sections WHERE document_id = $1',
        [record.id],
      ),
    ]);

    const existingDoc = existingDocResult.rows[0];
    const existingChunks = existingChunksResult.rows;
    const existingSections = existingSectionsResult.rows;

    const chunksExact = exactHashSet(
      chunks.map((item) => ({ key: item.draft.chunkIndex, hash: item.hash })),
      existingChunks.map((item) => ({ key: item.chunk_index, hash: item.content_hash })),
    );
    const sectionsExact = exactHashSet(
      sections.map((item) => ({ key: item.draft.id, hash: item.hash })),
      existingSections.map((item) => ({ key: item.id, hash: item.content_hash })),
    );

    if (existingDoc?.content_hash === documentHash && chunksExact && sectionsExact) {
      summary.documentsSkipped += 1;
      summary.canonicalChunksSkipped += chunks.length;
      summary.enrichmentSectionsSkipped += sections.length;
      continue;
    }

    const existingChunkHashes = new Map(
      existingChunks.map((item) => [item.chunk_index, item.content_hash]),
    );
    const existingSectionHashes = new Map(
      existingSections.map((item) => [item.id, item.content_hash]),
    );
    const changedChunks = chunks.filter(
      (item) => existingChunkHashes.get(item.draft.chunkIndex) !== item.hash,
    );
    const changedSections = sections.filter(
      (item) => existingSectionHashes.get(item.draft.id) !== item.hash,
    );

    // All external embedding work finishes before the transaction begins. An API failure
    // cannot leave the document hash claiming that a partial ingest is complete.
    const [chunkEmbeddings, sectionEmbeddings] = await Promise.all([
      embedChanged(changedChunks),
      embedChanged(changedSections),
    ]);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await upsertDocument(client, record, metadata, documentHash);

      for (const item of changedChunks) {
        const embedding = chunkEmbeddings.get(item.hash);
        if (!embedding) throw new Error(`Missing canonical embedding for ${record.id}:${item.draft.chunkIndex}`);
        await upsertChunk(client, item, embedding, record.id);
      }

      for (const item of changedSections) {
        const embedding = sectionEmbeddings.get(item.hash);
        if (!embedding) throw new Error(`Missing enrichment embedding for ${item.draft.id}`);
        await upsertSection(client, item, embedding);
      }

      const expectedChunkIndices = chunks.map((item) => item.draft.chunkIndex);
      const staleChunkResult = expectedChunkIndices.length > 0
        ? await client.query(
            `DELETE FROM rag_chunks
             WHERE document_id = $1
               AND NOT (chunk_index = ANY($2::int[]))`,
            [record.id, expectedChunkIndices],
          )
        : await client.query('DELETE FROM rag_chunks WHERE document_id = $1', [record.id]);

      const expectedSectionIds = sections.map((item) => item.draft.id);
      const staleSectionResult = expectedSectionIds.length > 0
        ? await client.query(
            `DELETE FROM rag_enrichment_sections
             WHERE document_id = $1
               AND NOT (id = ANY($2::text[]))`,
            [record.id, expectedSectionIds],
          )
        : await client.query(
            'DELETE FROM rag_enrichment_sections WHERE document_id = $1',
            [record.id],
          );

      await client.query('COMMIT');

      summary.documentsProcessed += 1;
      summary.canonicalChunksEmbedded += changedChunks.length;
      summary.canonicalChunksSkipped += chunks.length - changedChunks.length;
      summary.canonicalChunksDeleted += staleChunkResult.rowCount ?? 0;
      summary.enrichmentSectionsEmbedded += changedSections.length;
      summary.enrichmentSectionsSkipped += sections.length - changedSections.length;
      summary.enrichmentSectionsDeleted += staleSectionResult.rowCount ?? 0;

      console.log(
        `[${recordIndex + 1}/${records.length}] ${record.id}: `
          + `${changedChunks.length} canonical, ${changedSections.length} enrichment embedded`,
      );
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  if (limit) {
    console.warn(
      'RAG_INGEST_LIMIT is set: stale-document pruning and relationship refresh were skipped.',
    );
  } else {
    const relationshipClient = await pool.connect();
    try {
      await relationshipClient.query('BEGIN');
      const activeDocumentIds = records
        .filter((record) => record.segments?.length)
        .map((record) => record.id);
      summary.documentsDeleted = await pruneStaleDocuments(
        relationshipClient,
        activeDocumentIds,
      );
      const relationshipSummary = await refreshRelationships(
        relationshipClient,
        enrichment.relationships,
      );
      summary.relationshipsWritten = relationshipSummary.written;
      summary.relationshipsSkipped = relationshipSummary.skipped;
      await relationshipClient.query('COMMIT');
    } catch (error) {
      await relationshipClient.query('ROLLBACK');
      throw error;
    } finally {
      relationshipClient.release();
    }
  }

  console.log('Ingestion summary:');
  console.log(`  Documents processed: ${summary.documentsProcessed}`);
  console.log(`  Documents skipped (exactly complete): ${summary.documentsSkipped}`);
  console.log(`  Canonical chunks embedded: ${summary.canonicalChunksEmbedded}`);
  console.log(`  Canonical chunks skipped: ${summary.canonicalChunksSkipped}`);
  console.log(`  Canonical chunks deleted: ${summary.canonicalChunksDeleted}`);
  console.log(`  Enrichment sections embedded: ${summary.enrichmentSectionsEmbedded}`);
  console.log(`  Enrichment sections skipped: ${summary.enrichmentSectionsSkipped}`);
  console.log(`  Enrichment sections deleted: ${summary.enrichmentSectionsDeleted}`);
  console.log(`  Relationships written: ${summary.relationshipsWritten}`);
  console.log(
    `  Relationships skipped (missing canonical endpoint): ${summary.relationshipsSkipped}`,
  );
  console.log(`  Stale documents deleted: ${summary.documentsDeleted}`);
}

main()
  .catch((error: unknown) => {
    console.error('build-and-ingest failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closePool);
