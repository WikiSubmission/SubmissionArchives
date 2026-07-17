import { readFileSync } from 'node:fs';
import path from 'node:path';
import './lib/env';
import { getPool, closePool } from './lib/db';
import type { ArchiveRecord } from '../../src/types/archive';

const MASTER_INDEX_PATH = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);

async function main(): Promise<void> {
  const records: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const expectedDocIds = new Set(
    records.filter((record) => record.segments?.length).map((record) => record.id),
  );
  const pool = getPool();
  let failed = false;

  const docCount = Number(
    (await pool.query<{ count: string }>('SELECT count(*) FROM rag_documents')).rows[0].count,
  );
  console.log(`Documents in DB: ${docCount} (expected up to ${expectedDocIds.size})`);
  if (docCount === 0) {
    console.error('FAIL: no documents ingested.');
    failed = true;
  }

  const zeroChunkDocs = (
    await pool.query<{ id: string }>(
      `SELECT d.id
       FROM rag_documents d
       LEFT JOIN rag_chunks c ON c.document_id = d.id
       GROUP BY d.id
       HAVING count(c.id) = 0`,
    )
  ).rows;
  if (zeroChunkDocs.length > 0) {
    console.error(
      `FAIL: ${zeroChunkDocs.length} document(s) with zero canonical chunks:`,
      zeroChunkDocs.map((row) => row.id),
    );
    failed = true;
  } else {
    console.log('OK: no zero-chunk documents.');
  }

  const nullEmbeddings = Number(
    (await pool.query<{ count: string }>(
      'SELECT count(*) FROM rag_chunks WHERE embedding IS NULL',
    )).rows[0].count,
  );
  if (nullEmbeddings > 0) {
    console.error(`FAIL: ${nullEmbeddings} canonical chunk(s) have NULL embeddings.`);
    failed = true;
  } else {
    console.log('OK: no NULL canonical embeddings.');
  }

  const enrichmentCount = Number(
    (await pool.query<{ count: string }>('SELECT count(*) FROM rag_enrichment_sections')).rows[0].count,
  );
  const nullEnrichmentEmbeddings = Number(
    (await pool.query<{ count: string }>(
      'SELECT count(*) FROM rag_enrichment_sections WHERE embedding IS NULL',
    )).rows[0].count,
  );
  console.log(`Enrichment sections: ${enrichmentCount}`);
  if (enrichmentCount === 0) {
    console.error('FAIL: no enrichment sections ingested.');
    failed = true;
  }
  if (nullEnrichmentEmbeddings > 0) {
    console.error(`FAIL: ${nullEnrichmentEmbeddings} enrichment section(s) have NULL embeddings.`);
    failed = true;
  } else {
    console.log('OK: no NULL enrichment embeddings.');
  }

  const orphanEnrichment = Number(
    (await pool.query<{ count: string }>(
      `SELECT count(*)
       FROM rag_enrichment_sections e
       LEFT JOIN rag_documents d ON d.id = e.document_id
       WHERE d.id IS NULL`,
    )).rows[0].count,
  );
  if (orphanEnrichment > 0) {
    console.error(`FAIL: ${orphanEnrichment} enrichment section(s) lack canonical documents.`);
    failed = true;
  } else {
    console.log('OK: every enrichment section maps to a canonical document.');
  }

  const unresolvedEnrichment = Number(
    (await pool.query<{ count: string }>(
      `SELECT count(*)
       FROM rag_enrichment_sections e
       WHERE NOT EXISTS (
         SELECT 1
         FROM rag_chunks c
         WHERE c.document_id = e.document_id
           AND c.chunk_kind = 'precision'
           AND (
             (
               e.source_segment_start IS NOT NULL
               AND c.source_segment_start IS NOT NULL
               AND c.source_segment_end >= e.source_segment_start
               AND c.source_segment_start <= COALESCE(e.source_segment_end, e.source_segment_start)
             )
             OR (
               e.source_segment_start IS NULL
               AND e.start_time IS NOT NULL
               AND c.start_time IS NOT NULL
               AND c.end_time >= e.start_time
               AND c.start_time <= COALESCE(e.end_time, e.start_time)
             )
             OR (
               e.source_segment_start IS NULL
               AND e.start_time IS NULL
               AND e.page_start IS NOT NULL
               AND c.page BETWEEN e.page_start AND COALESCE(e.page_end, e.page_start)
             )
             OR (
               e.source_segment_start IS NULL
               AND e.start_time IS NULL
               AND e.page_start IS NULL
             )
           )
       )`,
    )).rows[0].count,
  );
  if (unresolvedEnrichment > 0) {
    console.error(
      `FAIL: ${unresolvedEnrichment} enrichment section(s) cannot resolve to canonical evidence.`,
    );
    failed = true;
  } else {
    console.log('OK: every enrichment section resolves to canonical evidence.');
  }

  const invalidKinds = Number(
    (await pool.query<{ count: string }>(
      `SELECT count(*) FROM rag_chunks WHERE chunk_kind NOT IN ('precision', 'context')`,
    )).rows[0].count,
  );
  if (invalidKinds > 0) {
    console.error(`FAIL: ${invalidKinds} chunk(s) have an invalid chunk_kind.`);
    failed = true;
  } else {
    console.log('OK: all chunk kinds are valid.');
  }

  const missingEvidenceKinds = Number(
    (await pool.query<{ count: string }>(
      `SELECT count(*) FROM rag_chunks WHERE evidence_kind IS NULL OR evidence_kind = ''`,
    )).rows[0].count,
  );
  if (missingEvidenceKinds > 0) {
    console.error(`FAIL: ${missingEvidenceKinds} canonical chunk(s) lack evidence_kind.`);
    failed = true;
  } else {
    console.log('OK: all canonical chunks have evidence kinds.');
  }

  const quranEditionCounts = await pool.query<{ edition_year: number | null; count: string }>(
    `SELECT edition_year, count(*)
     FROM rag_chunks
     WHERE evidence_kind LIKE 'quran-%'
     GROUP BY edition_year
     ORDER BY edition_year`,
  );
  for (const row of quranEditionCounts.rows) {
    console.log(`Quran chunks (${row.edition_year ?? 'unknown'}): ${row.count}`);
  }

  const finalQuranCount = Number(
    (await pool.query<{ count: string }>(
      `SELECT count(*)
       FROM rag_chunks
       WHERE edition_year = 1992
         AND evidence_kind = 'quran-verse'`,
    )).rows[0].count,
  );
  if (finalQuranCount === 0) {
    console.error('FAIL: no 1992 final-edition Quran verse chunks were identified.');
    failed = true;
  } else {
    console.log(`OK: ${finalQuranCount} final-edition Quran verse chunk(s) identified.`);
  }

  const relationshipCount = Number(
    (await pool.query<{ count: string }>('SELECT count(*) FROM rag_document_relationships')).rows[0].count,
  );
  console.log(`Document relationships: ${relationshipCount}`);

  const canonicalLeakCheck = Number(
    (await pool.query<{ count: string }>(
      `SELECT count(*)
       FROM rag_enrichment_sections
       WHERE search_text ILIKE '%CANONICAL EVIDENCE TEXT:%'
          OR search_text ILIKE '%Archive passage:%'`,
    )).rows[0].count,
  );
  if (canonicalLeakCheck > 0) {
    console.error(`FAIL: ${canonicalLeakCheck} enrichment row(s) appear to contain evidence blocks.`);
    failed = true;
  } else {
    console.log('OK: enrichment search text remains metadata-only.');
  }

  const sample = await pool.query<{ document_id: string }>(
    `SELECT document_id FROM rag_chunks WHERE embedding IS NOT NULL ORDER BY random() LIMIT 1`,
  );
  if (sample.rows[0]) {
    const cosineTest = await pool.query(
      `SELECT id
       FROM rag_chunks
       ORDER BY embedding <=> (
         SELECT embedding FROM rag_chunks WHERE document_id = $1 LIMIT 1
       )
       LIMIT 5`,
      [sample.rows[0].document_id],
    );
    console.log(`OK: canonical cosine query returned ${cosineTest.rowCount} result(s).`);
  }

  const enrichmentSample = await pool.query<{ id: string }>(
    `SELECT id FROM rag_enrichment_sections WHERE embedding IS NOT NULL ORDER BY random() LIMIT 1`,
  );
  if (enrichmentSample.rows[0]) {
    const enrichmentCosine = await pool.query(
      `SELECT id
       FROM rag_enrichment_sections
       ORDER BY embedding <=> (
         SELECT embedding FROM rag_enrichment_sections WHERE id = $1
       )
       LIMIT 5`,
      [enrichmentSample.rows[0].id],
    );
    console.log(`OK: enrichment cosine query returned ${enrichmentCosine.rowCount} result(s).`);
  }

  const trigramTest = await pool.query<{ count: string }>(
    `SELECT count(*) FROM rag_chunks WHERE f_unaccent(text) % f_unaccent('deja vu')`,
  );
  const enrichmentTrigramTest = await pool.query<{ count: string }>(
    `SELECT count(*)
     FROM rag_enrichment_sections
     WHERE f_unaccent(search_text) % f_unaccent('admission test')`,
  );
  console.log(`OK: canonical trigram query executed (${trigramTest.rows[0].count} match(es)).`);
  console.log(
    `OK: enrichment trigram query executed (${enrichmentTrigramTest.rows[0].count} match(es)).`,
  );

  const totalChunks = Number(
    (await pool.query<{ count: string }>('SELECT count(*) FROM rag_chunks')).rows[0].count,
  );
  console.log(`Total canonical chunks: ${totalChunks}`);

  if (failed) {
    console.error('\nVerification FAILED.');
    process.exitCode = 1;
  } else {
    console.log('\nVerification passed.');
  }
}

main()
  .catch((error: unknown) => {
    console.error('verify failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closePool);
