import { readFileSync } from 'node:fs';
import path from 'node:path';
import './lib/env';
import { getPool, closePool } from './lib/db';
import type { ArchiveRecord } from '../../src/types/archive';

const MASTER_INDEX_PATH = path.resolve(process.cwd(), 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');

async function main(): Promise<void> {
  const records: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf-8'));
  const expectedDocIds = new Set(records.filter((r) => r.segments?.length).map((r) => r.id));
  const pool = getPool();

  let failed = false;

  const docCountRow = (await pool.query<{ count: string }>('SELECT count(*) FROM rag_documents')).rows[0];
  const docCount = Number(docCountRow.count);
  console.log(`Documents in DB: ${docCount} (expected up to ${expectedDocIds.size})`);
  if (docCount === 0) {
    console.error('FAIL: no documents ingested.');
    failed = true;
  }

  const zeroChunkDocs = (
    await pool.query<{ id: string }>(
      `SELECT d.id FROM rag_documents d
       LEFT JOIN rag_chunks c ON c.document_id = d.id
       GROUP BY d.id HAVING count(c.id) = 0`,
    )
  ).rows;
  if (zeroChunkDocs.length > 0) {
    console.error(`FAIL: ${zeroChunkDocs.length} document(s) with zero chunks:`, zeroChunkDocs.map((r) => r.id));
    failed = true;
  } else {
    console.log('OK: no zero-chunk documents.');
  }

  const nullEmbeddings = (await pool.query<{ count: string }>('SELECT count(*) FROM rag_chunks WHERE embedding IS NULL'))
    .rows[0];
  if (Number(nullEmbeddings.count) > 0) {
    console.error(`FAIL: ${nullEmbeddings.count} chunk(s) with NULL embedding.`);
    failed = true;
  } else {
    console.log('OK: no NULL embeddings.');
  }

  const sample = await pool.query<{ document_id: string; text: string }>(
    `SELECT document_id, text FROM rag_chunks ORDER BY random() LIMIT 1`,
  );
  if (sample.rows[0]) {
    const cosineTest = await pool.query(
      `SELECT id FROM rag_chunks ORDER BY embedding <=> (SELECT embedding FROM rag_chunks WHERE document_id = $1 LIMIT 1) LIMIT 5`,
      [sample.rows[0].document_id],
    );
    console.log(`OK: sample cosine query returned ${cosineTest.rowCount} result(s).`);
  }

  const totalChunks = (await pool.query<{ count: string }>('SELECT count(*) FROM rag_chunks')).rows[0];
  console.log(`Total chunks: ${totalChunks.count}`);

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
