import { readFileSync } from 'node:fs';
import path from 'node:path';
import './lib/env';
import { getPool, closePool } from './lib/db';
import { sha256 } from './lib/hash';
import { buildChunks, type RagChunkDraft } from './lib/chunking';
import { embedBatch } from './lib/mistral';
import type { ArchiveRecord } from '../../src/types/archive';

const MASTER_INDEX_PATH = path.resolve(process.cwd(), 'public', 'data', 'generated_indices', 'MASTER_INDEX.json');
const EMBED_MODEL = process.env.MISTRAL_EMBED_MODEL || 'mistral-embed-2312';
const BATCH_SIZE = Number(process.env.RAG_EMBED_BATCH_SIZE) || 32;

function isRashadAuthored(record: ArchiveRecord): boolean {
  return (record.author || 'Dr. Rashad Khalifa') === 'Dr. Rashad Khalifa';
}

interface Summary {
  documentsProcessed: number;
  documentsSkipped: number;
  chunksEmbedded: number;
  chunksSkipped: number;
  chunksDeleted: number;
}

async function main(): Promise<void> {
  const allRecords: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf-8'));
  const limit = Number(process.env.RAG_INGEST_LIMIT) || undefined;
  const records = limit ? allRecords.slice(0, limit) : allRecords;
  const pool = getPool();

  const summary: Summary = {
    documentsProcessed: 0,
    documentsSkipped: 0,
    chunksEmbedded: 0,
    chunksSkipped: 0,
    chunksDeleted: 0,
  };

  for (const record of records) {
    if (!record.segments?.length) continue;

    const documentHash = sha256(JSON.stringify(record.segments));
    const existingDoc = (
      await pool.query<{ content_hash: string }>('SELECT content_hash FROM rag_documents WHERE id = $1', [
        record.id,
      ])
    ).rows[0];

    if (existingDoc && existingDoc.content_hash === documentHash) {
      summary.documentsSkipped += 1;
      continue;
    }

    await pool.query(
      `INSERT INTO rag_documents (id, title, display_title, type, author, is_rashad_authored, pdf_link, youtube_id, content_hash, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title, display_title = EXCLUDED.display_title, type = EXCLUDED.type,
         author = EXCLUDED.author, is_rashad_authored = EXCLUDED.is_rashad_authored,
         pdf_link = EXCLUDED.pdf_link, youtube_id = EXCLUDED.youtube_id,
         content_hash = EXCLUDED.content_hash, updated_at = now()`,
      [
        record.id,
        record.title,
        record.displayTitle ?? null,
        record.type,
        record.author ?? null,
        isRashadAuthored(record),
        record.pdfLink ?? null,
        record.youtubeId ?? null,
        documentHash,
      ],
    );

    const drafts = buildChunks(record);
    const existingChunks = (
      await pool.query<{ chunk_index: number; content_hash: string }>(
        'SELECT chunk_index, content_hash FROM rag_chunks WHERE document_id = $1',
        [record.id],
      )
    ).rows;
    const existingByIndex = new Map(existingChunks.map((row) => [row.chunk_index, row.content_hash]));

    const toEmbed: { draft: RagChunkDraft; hash: string }[] = [];
    const toSkip: { draft: RagChunkDraft; hash: string }[] = [];

    for (const draft of drafts) {
      const hash = sha256(draft.text);
      if (existingByIndex.get(draft.chunkIndex) === hash) {
        toSkip.push({ draft, hash });
      } else {
        toEmbed.push({ draft, hash });
      }
    }

    for (let i = 0; i < toEmbed.length; i += BATCH_SIZE) {
      const batch = toEmbed.slice(i, i + BATCH_SIZE);
      const embeddings = await embedBatch(
        batch.map((item) => item.draft.text),
        EMBED_MODEL,
      );

      for (let j = 0; j < batch.length; j += 1) {
        const { draft, hash } = batch[j];
        const embedding = embeddings[j];
        await pool.query(
          `INSERT INTO rag_chunks (document_id, chunk_index, text, start_time, end_time, page, speaker, label, content_hash, embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (document_id, chunk_index) DO UPDATE SET
             text = EXCLUDED.text, start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time,
             page = EXCLUDED.page, speaker = EXCLUDED.speaker, label = EXCLUDED.label,
             content_hash = EXCLUDED.content_hash, embedding = EXCLUDED.embedding`,
          [
            record.id,
            draft.chunkIndex,
            draft.text,
            draft.startTime,
            draft.endTime,
            draft.page,
            draft.speaker,
            draft.label,
            hash,
            `[${embedding.join(',')}]`,
          ],
        );
      }
    }
    summary.chunksEmbedded += toEmbed.length;
    summary.chunksSkipped += toSkip.length;

    const currentIndices = new Set(drafts.map((draft) => draft.chunkIndex));
    const staleIndices = existingChunks.map((row) => row.chunk_index).filter((idx) => !currentIndices.has(idx));
    if (staleIndices.length > 0) {
      await pool.query('DELETE FROM rag_chunks WHERE document_id = $1 AND chunk_index = ANY($2)', [
        record.id,
        staleIndices,
      ]);
      summary.chunksDeleted += staleIndices.length;
    }

    summary.documentsProcessed += 1;
  }

  console.log('Ingestion summary:');
  console.log(`  Documents processed: ${summary.documentsProcessed}`);
  console.log(`  Documents skipped (unchanged): ${summary.documentsSkipped}`);
  console.log(`  Chunks embedded: ${summary.chunksEmbedded}`);
  console.log(`  Chunks skipped (unchanged): ${summary.chunksSkipped}`);
  console.log(`  Chunks deleted (stale): ${summary.chunksDeleted}`);
}

main()
  .catch((error: unknown) => {
    console.error('build-and-ingest failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(closePool);
