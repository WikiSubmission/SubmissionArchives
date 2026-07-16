import 'server-only';
import { getRagPool } from './db';
import type { RetrievedChunk } from './types';

interface RawChunkRow {
  id: number;
  document_id: string;
  text: string;
  start_time: string | null;
  end_time: string | null;
  page: number | null;
  speaker: string | null;
  label: string | null;
  title: string;
  display_title: string | null;
  type: string;
  author: string | null;
  is_rashad_authored: boolean;
  pdf_link: string | null;
  youtube_id: string | null;
}

function toRetrievedChunk(row: RawChunkRow, fusedScore: number): RetrievedChunk {
  return {
    id: row.id,
    documentId: row.document_id,
    text: row.text,
    startTime: row.start_time !== null ? Number(row.start_time) : null,
    endTime: row.end_time !== null ? Number(row.end_time) : null,
    page: row.page,
    speaker: row.speaker,
    label: row.label,
    documentTitle: row.title,
    documentDisplayTitle: row.display_title,
    documentType: row.type,
    documentAuthor: row.author,
    documentIsRashadAuthored: row.is_rashad_authored,
    documentPdfLink: row.pdf_link,
    documentYoutubeId: row.youtube_id,
    fusedScore,
  };
}

const CHUNK_SELECT = `
  SELECT c.id, c.document_id, c.text, c.start_time, c.end_time, c.page, c.speaker, c.label,
         d.title, d.display_title, d.type, d.author, d.is_rashad_authored, d.pdf_link, d.youtube_id
  FROM rag_chunks c
  JOIN rag_documents d ON d.id = c.document_id
`;

async function vectorSearch(embedding: number[], limit: number): Promise<RawChunkRow[]> {
  const pool = getRagPool();
  const result = await pool.query<RawChunkRow>(
    `${CHUNK_SELECT} ORDER BY c.embedding <=> $1 LIMIT $2`,
    [`[${embedding.join(',')}]`, limit],
  );
  return result.rows;
}

async function textSearch(query: string, limit: number): Promise<RawChunkRow[]> {
  const pool = getRagPool();
  const result = await pool.query<RawChunkRow>(
    `${CHUNK_SELECT} WHERE c.tsv @@ plainto_tsquery('english', f_unaccent($1))
     ORDER BY ts_rank_cd(c.tsv, plainto_tsquery('english', f_unaccent($1))) DESC LIMIT $2`,
    [query, limit],
  );
  return result.rows;
}

/** Lowercased, accent-stripped OR-joined tokens for a loose tsquery. */
function toOrTokens(query: string): string {
  const tokens = query
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .match(/[a-z0-9]+/g);
  return tokens ? tokens.join(' | ') : '';
}

/**
 * Recordings often discuss a concept named only in the document title (for
 * example a Quran study titled "Déjà Vu" where the transcript never uses the
 * phrase). Chunk-level search misses those entirely, so this channel matches
 * the query against document titles and returns those documents' chunks
 * ranked by embedding similarity to the question.
 */
async function titleMatchSearch(query: string, embedding: number[], limit: number): Promise<RawChunkRow[]> {
  const orTokens = toOrTokens(query);
  if (!orTokens) return [];

  const pool = getRagPool();
  const result = await pool.query<RawChunkRow>(
    `${CHUNK_SELECT}
     WHERE to_tsvector('english', f_unaccent(d.title || ' ' || coalesce(d.display_title, ''))) @@ to_tsquery('english', $1)
     ORDER BY c.embedding <=> $2 LIMIT $3`,
    [orTokens, `[${embedding.join(',')}]`, limit],
  );
  return result.rows;
}

function reciprocalRankFusion(rankedLists: RawChunkRow[][], k = 60): Map<number, number> {
  const scores = new Map<number, number>();
  for (const rows of rankedLists) {
    rows.forEach((row, i) => scores.set(row.id, (scores.get(row.id) ?? 0) + 1 / (k + i + 1)));
  }
  return scores;
}

/**
 * Deterministic reranking: boost Rashad-authored material and penalize
 * low-quality transcriptions, then cap how many chunks any single document
 * can contribute so one long recording can't crowd out everything else.
 */
function rerankAndDiversify(chunks: RetrievedChunk[], topN: number): RetrievedChunk[] {
  const boosted = chunks
    .map((chunk) => {
      let score = chunk.fusedScore;
      if (chunk.documentIsRashadAuthored || chunk.speaker === 'Dr. Khalifa') score *= 1.15;
      return { ...chunk, fusedScore: score };
    })
    .sort((a, b) => b.fusedScore - a.fusedScore);

  const perDocumentCount = new Map<string, number>();
  const diversified: RetrievedChunk[] = [];

  for (const chunk of boosted) {
    const count = perDocumentCount.get(chunk.documentId) ?? 0;
    if (count >= 2) continue;
    perDocumentCount.set(chunk.documentId, count + 1);
    diversified.push(chunk);
    if (diversified.length >= topN) break;
  }

  // When one document dominates the candidates (common for questions that
  // name a specific recording), the cap alone would starve the context.
  // Fill the remaining slots with the best capped-out chunks.
  if (diversified.length < topN) {
    const chosen = new Set(diversified.map((chunk) => chunk.id));
    for (const chunk of boosted) {
      if (chosen.has(chunk.id)) continue;
      diversified.push(chunk);
      chosen.add(chunk.id);
      if (diversified.length >= topN) break;
    }
  }

  return diversified;
}

export async function retrieveChunks(
  query: string,
  embedding: number[],
  opts: { topK: number; topN: number },
): Promise<RetrievedChunk[]> {
  const [vectorRows, textRows, titleRows] = await Promise.all([
    vectorSearch(embedding, opts.topK),
    textSearch(query, opts.topK),
    titleMatchSearch(query, embedding, opts.topK),
  ]);

  const fusedScores = reciprocalRankFusion([vectorRows, textRows, titleRows]);
  const byId = new Map<number, RawChunkRow>();
  for (const row of [...vectorRows, ...textRows, ...titleRows]) byId.set(row.id, row);

  const chunks = [...byId.entries()].map(([id, row]) => toRetrievedChunk(row, fusedScores.get(id) ?? 0));

  return rerankAndDiversify(chunks, opts.topN);
}
