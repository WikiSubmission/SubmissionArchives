import 'server-only';
import { getRagPool } from './db';
import type {
  RetrievedChunk,
  RetrievalMatchType,
  RetrievalOptions,
  RetrievalQuery,
  RetrievalSignals,
} from './types';

interface RawChunkRow {
  id: number;
  chunk_index: number;
  chunk_kind: string;
  document_id: string;
  text: string;
  start_time: string | null;
  end_time: string | null;
  page: number | null;
  speaker: string | null;
  label: string | null;
  source_segment_start: number | null;
  source_segment_end: number | null;
  chunk_edition_year: number | null;
  evidence_kind: string;
  verse_id: string | null;
  title: string;
  display_title: string | null;
  type: string;
  category: string | null;
  author: string | null;
  aliases: string[] | null;
  is_rashad_authored: boolean;
  pdf_link: string | null;
  youtube_id: string | null;
  source_class: string | null;
  source_priority: string;
  publication_date: string | null;
  date_precision: string | null;
  document_edition_year: number | null;
  genre: string | null;
  family_id: string | null;
}

interface SearchChunkRow extends RawChunkRow {
  vector_distance?: string | number | null;
  search_score?: string | number | null;
  enrichment_score?: string | number | null;
  enrichment_section_id?: string | null;
  enrichment_section_title?: string | null;
}

interface EnrichmentSearchRow {
  id: string;
  vector_distance?: string | number | null;
  search_score?: string | number | null;
}

interface NeighborRow {
  chunk_index: number;
  text: string;
  start_time: string | null;
  end_time: string | null;
  page: number | null;
  speaker: string | null;
}

interface CandidateAccumulator {
  row: SearchChunkRow;
  fusedScore: number;
  exactPhrase: boolean;
  vectorScore: number;
  lexicalScore: number;
  titleScore: number;
  enrichmentScore: number;
  enrichmentSectionId: string | null;
  enrichmentSectionTitle: string | null;
  channelHits: Set<string>;
}

interface RankedList {
  rows: SearchChunkRow[];
  channel: string;
  weight: number;
  signal: 'vector' | 'lexical' | 'title' | 'exact' | 'enrichment';
}

interface EnrichmentAccumulator {
  id: string;
  fusedScore: number;
  signalScore: number;
  channelHits: Set<string>;
}

export type RetrievalStrength = 'none' | 'weak' | 'moderate' | 'strong';

const CHUNK_COLUMNS = `
  c.id, c.chunk_index, c.chunk_kind, c.document_id, c.text,
  c.start_time, c.end_time, c.page, c.speaker, c.label,
  c.source_segment_start, c.source_segment_end,
  c.edition_year AS chunk_edition_year, c.evidence_kind, c.verse_id,
  d.title, d.display_title, d.type, d.category, d.author, d.aliases,
  d.is_rashad_authored, d.pdf_link, d.youtube_id, d.source_class,
  d.source_priority, d.publication_date, d.date_precision,
  d.edition_year AS document_edition_year, d.genre, d.family_id
`;

const CHUNK_FROM = `
  FROM rag_chunks c
  JOIN rag_documents d ON d.id = c.document_id
`;

function numberValue(value: string | number | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toOrTokens(query: string): string {
  const tokens = query
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/[a-z0-9]+/g);

  if (!tokens) return '';
  return [...new Set(tokens)].slice(0, 12).join(' | ');
}

async function vectorSearch(embedding: number[], limit: number): Promise<SearchChunkRow[]> {
  const pool = getRagPool();
  const result = await pool.query<SearchChunkRow>(
    `SELECT ${CHUNK_COLUMNS}, c.embedding <=> $1::vector AS vector_distance
     ${CHUNK_FROM}
     WHERE c.embedding IS NOT NULL
     ORDER BY c.embedding <=> $1::vector
     LIMIT $2`,
    [`[${embedding.join(',')}]`, limit],
  );
  return result.rows;
}

async function webTextSearch(query: string, limit: number): Promise<SearchChunkRow[]> {
  const pool = getRagPool();
  const result = await pool.query<SearchChunkRow>(
    `SELECT ${CHUNK_COLUMNS},
       ts_rank_cd(c.tsv, websearch_to_tsquery('english', f_unaccent($1))) AS search_score
     ${CHUNK_FROM}
     WHERE c.tsv @@ websearch_to_tsquery('english', f_unaccent($1))
     ORDER BY search_score DESC
     LIMIT $2`,
    [query, limit],
  );
  return result.rows;
}

async function looseTextSearch(query: string, limit: number): Promise<SearchChunkRow[]> {
  const orTokens = toOrTokens(query);
  if (!orTokens) return [];

  const pool = getRagPool();
  const result = await pool.query<SearchChunkRow>(
    `SELECT ${CHUNK_COLUMNS}, ts_rank_cd(c.tsv, to_tsquery('english', $1)) AS search_score
     ${CHUNK_FROM}
     WHERE c.tsv @@ to_tsquery('english', $1)
     ORDER BY search_score DESC
     LIMIT $2`,
    [orTokens, limit],
  );
  return result.rows;
}

async function exactPhraseSearch(query: string, limit: number): Promise<SearchChunkRow[]> {
  const phrase = query.replace(/\s+/g, ' ').trim();
  if (phrase.length < 3 || phrase.length > 180) return [];

  const pool = getRagPool();
  const result = await pool.query<SearchChunkRow>(
    `SELECT ${CHUNK_COLUMNS}, 1::float AS search_score
     ${CHUNK_FROM}
     WHERE strpos(lower(f_unaccent(c.text)), lower(f_unaccent($1))) > 0
     ORDER BY length(c.text) ASC
     LIMIT $2`,
    [phrase, limit],
  );
  return result.rows;
}

async function titleMatchSearch(
  query: string,
  embedding: number[],
  limit: number,
): Promise<SearchChunkRow[]> {
  const pool = getRagPool();
  const result = await pool.query<SearchChunkRow>(
    `WITH search_query AS (
       SELECT f_unaccent($1) AS needle,
              websearch_to_tsquery('english', f_unaccent($1)) AS tsq
     )
     SELECT ${CHUNK_COLUMNS},
       GREATEST(
         similarity(
           f_unaccent(d.title || ' ' || COALESCE(d.display_title, '') || ' '
             || COALESCE(array_to_string(d.aliases, ' '), '')),
           search_query.needle
         ),
         ts_rank_cd(
           to_tsvector(
             'english',
             f_unaccent(d.title || ' ' || COALESCE(d.display_title, '') || ' '
               || COALESCE(array_to_string(d.aliases, ' '), ''))
           ),
           search_query.tsq
         )
       ) AS search_score
     ${CHUNK_FROM}
     CROSS JOIN search_query
     WHERE c.embedding IS NOT NULL
       AND (
         f_unaccent(d.title || ' ' || COALESCE(d.display_title, '') || ' '
           || COALESCE(array_to_string(d.aliases, ' '), '')) % search_query.needle
         OR to_tsvector(
              'english',
              f_unaccent(d.title || ' ' || COALESCE(d.display_title, '') || ' '
                || COALESCE(array_to_string(d.aliases, ' '), ''))
            ) @@ search_query.tsq
       )
     ORDER BY search_score DESC, c.embedding <=> $2::vector
     LIMIT $3`,
    [query, `[${embedding.join(',')}]`, limit],
  );
  return result.rows;
}

async function enrichmentVectorSearch(
  embedding: number[],
  limit: number,
): Promise<EnrichmentSearchRow[]> {
  const pool = getRagPool();
  const result = await pool.query<EnrichmentSearchRow>(
    `SELECT id, embedding <=> $1::vector AS vector_distance
     FROM rag_enrichment_sections
     WHERE embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [`[${embedding.join(',')}]`, limit],
  );
  return result.rows;
}

async function enrichmentTextSearch(
  query: string,
  limit: number,
): Promise<EnrichmentSearchRow[]> {
  const pool = getRagPool();
  const result = await pool.query<EnrichmentSearchRow>(
    `SELECT id,
       GREATEST(
         ts_rank_cd(tsv, websearch_to_tsquery('english', f_unaccent($1))),
         similarity(f_unaccent(search_text), f_unaccent($1))
       ) AS search_score
     FROM rag_enrichment_sections
     WHERE tsv @@ websearch_to_tsquery('english', f_unaccent($1))
        OR f_unaccent(search_text) % f_unaccent($1)
     ORDER BY search_score DESC
     LIMIT $2`,
    [query, limit],
  );
  return result.rows;
}

async function enrichmentExactSearch(
  query: string,
  limit: number,
): Promise<EnrichmentSearchRow[]> {
  const phrase = query.replace(/\s+/g, ' ').trim();
  if (phrase.length < 3 || phrase.length > 180) return [];

  const pool = getRagPool();
  const result = await pool.query<EnrichmentSearchRow>(
    `SELECT id, 1::float AS search_score
     FROM rag_enrichment_sections
     WHERE strpos(lower(f_unaccent(search_text)), lower(f_unaccent($1))) > 0
     ORDER BY length(search_text) ASC
     LIMIT $2`,
    [phrase, limit],
  );
  return result.rows;
}

function channelWeight(kind: RetrievalQuery['kind'], signal: RankedList['signal']): number {
  const queryWeight = kind === 'original' ? 1.25 : kind === 'hyde' ? 1.1 : 1;
  const baseWeight = signal === 'exact'
    ? 2
    : signal === 'enrichment'
      ? 1.35
      : signal === 'vector'
        ? 1.2
        : signal === 'lexical'
          ? 1
          : 0.8;
  return queryWeight * baseWeight;
}

function accumulateRankedList(
  candidates: Map<number, CandidateAccumulator>,
  list: RankedList,
  reciprocalRankConstant = 60,
): void {
  list.rows.forEach((row, index) => {
    const id = Number(row.id);
    const current = candidates.get(id) ?? {
      row,
      fusedScore: 0,
      exactPhrase: false,
      vectorScore: 0,
      lexicalScore: 0,
      titleScore: 0,
      enrichmentScore: 0,
      enrichmentSectionId: null,
      enrichmentSectionTitle: null,
      channelHits: new Set<string>(),
    };

    current.fusedScore += list.weight / (reciprocalRankConstant + index + 1);
    current.channelHits.add(list.channel);

    if (list.signal === 'exact') {
      current.exactPhrase = true;
    } else if (list.signal === 'vector') {
      current.vectorScore = Math.max(
        current.vectorScore,
        Math.max(0, 1 - numberValue(row.vector_distance)),
      );
    } else if (list.signal === 'title') {
      current.titleScore = Math.max(current.titleScore, numberValue(row.search_score));
    } else if (list.signal === 'enrichment') {
      const enrichmentScore = numberValue(row.enrichment_score);
      if (enrichmentScore >= current.enrichmentScore) {
        current.enrichmentScore = enrichmentScore;
        current.enrichmentSectionId = row.enrichment_section_id ?? null;
        current.enrichmentSectionTitle = row.enrichment_section_title ?? null;
      }
    } else {
      current.lexicalScore = Math.max(current.lexicalScore, numberValue(row.search_score));
    }

    candidates.set(id, current);
  });
}

function accumulateEnrichmentRows(
  candidates: Map<string, EnrichmentAccumulator>,
  rows: EnrichmentSearchRow[],
  channel: string,
  weight: number,
  signal: 'vector' | 'lexical' | 'exact',
  reciprocalRankConstant = 40,
): void {
  rows.forEach((row, index) => {
    const current = candidates.get(row.id) ?? {
      id: row.id,
      fusedScore: 0,
      signalScore: 0,
      channelHits: new Set<string>(),
    };
    current.fusedScore += weight / (reciprocalRankConstant + index + 1);
    current.channelHits.add(channel);
    const score = signal === 'vector'
      ? Math.max(0, 1 - numberValue(row.vector_distance))
      : numberValue(row.search_score);
    current.signalScore = Math.max(current.signalScore, score);
    candidates.set(row.id, current);
  });
}

async function resolveEnrichmentSections(
  sections: EnrichmentAccumulator[],
): Promise<SearchChunkRow[]> {
  if (sections.length === 0) return [];
  const pool = getRagPool();
  const selected = sections.map((section, index) => ({
    section_id: section.id,
    rank: index + 1,
    fused_score: section.fusedScore,
    signal_score: section.signalScore,
  }));

  const result = await pool.query<SearchChunkRow>(
    `WITH selected AS (
       SELECT *
       FROM jsonb_to_recordset($1::jsonb) AS x(
         section_id TEXT,
         rank INT,
         fused_score DOUBLE PRECISION,
         signal_score DOUBLE PRECISION
       )
     )
     SELECT ${CHUNK_COLUMNS},
       GREATEST(selected.signal_score, selected.fused_score * 20) AS enrichment_score,
       e.section_id AS enrichment_section_id,
       e.title AS enrichment_section_title
     FROM selected
     JOIN rag_enrichment_sections e ON e.id = selected.section_id
     JOIN rag_documents d ON d.id = e.document_id
     JOIN LATERAL (
       SELECT c.*
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
             AND c.page IS NOT NULL
             AND c.page BETWEEN e.page_start AND COALESCE(e.page_end, e.page_start)
           )
           OR (
             e.source_segment_start IS NULL
             AND e.start_time IS NULL
             AND e.page_start IS NULL
           )
         )
       ORDER BY
         CASE
           WHEN e.source_segment_start IS NOT NULL AND c.source_segment_start IS NOT NULL
             THEN abs(c.source_segment_start - e.source_segment_start)
           WHEN e.start_time IS NOT NULL AND c.start_time IS NOT NULL
             THEN abs(c.start_time - e.start_time)
           WHEN e.page_start IS NOT NULL AND c.page IS NOT NULL
             THEN abs(c.page - e.page_start)
           ELSE c.chunk_index
         END,
         c.chunk_index
       LIMIT 2
     ) c ON true
     ORDER BY selected.rank, c.chunk_index`,
    [JSON.stringify(selected)],
  );

  return result.rows;
}

function inferMatchType(signals: RetrievalSignals): RetrievalMatchType {
  if (signals.exactPhrase) return 'direct';
  if (signals.vectorScore >= 0.62 || signals.titleScore >= 0.35) return 'conceptual';
  if (signals.enrichmentScore >= 0.55) return 'conceptual';
  if (
    signals.lexicalScore > 0
    || signals.vectorScore >= 0.5
    || signals.enrichmentScore >= 0.35
  ) {
    return 'related';
  }
  return 'uncertain';
}

function effectiveEditionYear(row: RawChunkRow): number | null {
  return row.chunk_edition_year ?? row.document_edition_year ?? null;
}

function intentMultiplier(row: RawChunkRow, options: RetrievalOptions): number {
  const editionYear = effectiveEditionYear(row);

  if (options.intent === 'final_wording') {
    if (editionYear === 1992) return 1.24;
    if (editionYear === 1981 || editionYear === 1989) return 0.82;
  }

  if (options.intent === 'translation_evolution') {
    if (options.requestedEditionYears.includes(editionYear ?? -1)) return 1.2;
    if ([1981, 1989, 1992].includes(editionYear ?? -1)) return 1.08;
  }

  if (options.intent === 'ritual_procedure') {
    if (row.source_priority === 'procedural_primary') return 1.2;
    if (/contact prayer|salat/i.test(row.title)) return 1.1;
  }

  if (options.intent === 'historical_development' && row.publication_date) {
    return 1.04;
  }

  return 1;
}

function toRetrievedChunk(
  candidate: CandidateAccumulator,
  options: RetrievalOptions,
): RetrievedChunk {
  const row = candidate.row;
  const signals: RetrievalSignals = {
    exactPhrase: candidate.exactPhrase,
    vectorScore: candidate.vectorScore,
    lexicalScore: candidate.lexicalScore,
    titleScore: candidate.titleScore,
    enrichmentScore: candidate.enrichmentScore,
    channelHits: [...candidate.channelHits],
  };

  let fusedScore = candidate.fusedScore;
  fusedScore += signals.exactPhrase ? 0.035 : 0;
  fusedScore += signals.vectorScore * 0.012;
  fusedScore += Math.min(signals.lexicalScore, 1) * 0.008;
  fusedScore += Math.min(signals.titleScore, 1) * 0.006;
  fusedScore += Math.min(signals.enrichmentScore, 1) * 0.012;

  if (row.speaker === 'Dr. Khalifa') fusedScore *= 1.08;
  else if (row.is_rashad_authored) fusedScore *= 1.04;
  if (row.chunk_kind === 'context' && !signals.exactPhrase) fusedScore *= 1.03;
  if (row.chunk_kind !== 'context' && signals.exactPhrase) fusedScore *= 1.05;
  fusedScore *= intentMultiplier(row, options);

  return {
    id: Number(row.id),
    chunkIndex: row.chunk_index,
    chunkKind: row.chunk_kind === 'context' ? 'context' : 'precision',
    documentId: row.document_id,
    text: row.text,
    contextText: row.text,
    startTime: row.start_time !== null ? Number(row.start_time) : null,
    endTime: row.end_time !== null ? Number(row.end_time) : null,
    contextStartTime: row.start_time !== null ? Number(row.start_time) : null,
    contextEndTime: row.end_time !== null ? Number(row.end_time) : null,
    page: row.page,
    contextPage: row.page,
    speaker: row.speaker,
    label: row.label,
    sourceSegmentStart: row.source_segment_start,
    sourceSegmentEnd: row.source_segment_end,
    editionYear: effectiveEditionYear(row),
    evidenceKind: row.evidence_kind,
    verseId: row.verse_id,
    documentTitle: row.title,
    documentDisplayTitle: row.display_title,
    documentType: row.type,
    documentCategory: row.category,
    documentAuthor: row.author,
    documentAliases: row.aliases ?? [],
    documentIsRashadAuthored: row.is_rashad_authored,
    documentPdfLink: row.pdf_link,
    documentYoutubeId: row.youtube_id,
    documentSourceClass: row.source_class,
    documentSourcePriority: row.source_priority,
    documentPublicationDate: row.publication_date,
    documentDatePrecision: row.date_precision,
    documentEditionYear: row.document_edition_year,
    documentGenre: row.genre,
    documentFamilyId: row.family_id || row.document_id,
    matchedSectionId: candidate.enrichmentSectionId,
    matchedSectionTitle: candidate.enrichmentSectionTitle,
    enrichmentGuided: candidate.enrichmentScore > 0,
    fusedScore,
    retrievalSignals: signals,
    rerankScore: null,
    matchType: inferMatchType(signals),
    relevanceReason: null,
  };
}

function deterministicDiversify(chunks: RetrievedChunk[], topN: number): RetrievedChunk[] {
  const sorted = [...chunks].sort((a, b) => b.fusedScore - a.fusedScore);
  const perDocumentCount = new Map<string, number>();
  const selected: RetrievedChunk[] = [];

  for (const chunk of sorted) {
    const count = perDocumentCount.get(chunk.documentId) ?? 0;
    if (count >= 4) continue;
    perDocumentCount.set(chunk.documentId, count + 1);
    selected.push(chunk);
    if (selected.length >= topN) break;
  }

  return selected;
}

function speakerPrefixedText(row: Pick<NeighborRow, 'speaker' | 'text'>): string {
  return row.speaker ? `${row.speaker}: ${row.text}` : row.text;
}

async function attachNeighborContexts(chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
  const pool = getRagPool();
  const indicesByDocument = new Map<string, Set<number>>();

  for (const chunk of chunks) {
    if (chunk.chunkKind !== 'precision') continue;
    const indices = indicesByDocument.get(chunk.documentId) ?? new Set<number>();
    indices.add(Math.max(0, chunk.chunkIndex - 1));
    indices.add(chunk.chunkIndex);
    indices.add(chunk.chunkIndex + 1);
    indicesByDocument.set(chunk.documentId, indices);
  }

  const rowsByDocument = new Map<string, Map<number, NeighborRow>>();
  await Promise.all(
    [...indicesByDocument.entries()].map(async ([documentId, indices]) => {
      const result = await pool.query<NeighborRow>(
        `SELECT chunk_index, text, start_time, end_time, page, speaker
         FROM rag_chunks
         WHERE document_id = $1
           AND chunk_kind = 'precision'
           AND chunk_index = ANY($2::int[])
         ORDER BY chunk_index`,
        [documentId, [...indices]],
      );
      rowsByDocument.set(documentId, new Map(result.rows.map((row) => [row.chunk_index, row])));
    }),
  );

  return chunks.map((chunk) => {
    if (chunk.chunkKind === 'context') return chunk;
    const rowsByIndex = rowsByDocument.get(chunk.documentId);
    if (!rowsByIndex) return chunk;

    const rows = [chunk.chunkIndex - 1, chunk.chunkIndex, chunk.chunkIndex + 1]
      .map((index) => rowsByIndex.get(index))
      .filter((row): row is NeighborRow => Boolean(row));
    if (rows.length === 0) return chunk;

    const starts = rows
      .map((row) => (row.start_time === null ? null : Number(row.start_time)))
      .filter((value): value is number => value !== null && Number.isFinite(value));
    const ends = rows
      .map((row) => (row.end_time === null ? null : Number(row.end_time)))
      .filter((value): value is number => value !== null && Number.isFinite(value));
    const page = rows.find((row) => row.page !== null)?.page ?? chunk.page;

    return {
      ...chunk,
      contextText: rows.map(speakerPrefixedText).join('\n'),
      contextStartTime: starts.length > 0 ? Math.min(...starts) : chunk.startTime,
      contextEndTime: ends.length > 0 ? Math.max(...ends) : chunk.endTime,
      contextPage: page,
    };
  });
}

function significantLocatorOverlap(a: RetrievedChunk, b: RetrievedChunk): boolean {
  if (a.documentId !== b.documentId) return false;
  if (a.verseId && b.verseId) return a.verseId === b.verseId && a.editionYear === b.editionYear;
  if (a.contextPage !== null && b.contextPage !== null) return a.contextPage === b.contextPage;
  if (
    a.contextStartTime === null
    || a.contextEndTime === null
    || b.contextStartTime === null
    || b.contextEndTime === null
  ) {
    return false;
  }

  const overlap = Math.max(
    0,
    Math.min(a.contextEndTime, b.contextEndTime) - Math.max(a.contextStartTime, b.contextStartTime),
  );
  const shorterDuration = Math.min(
    a.contextEndTime - a.contextStartTime,
    b.contextEndTime - b.contextStartTime,
  );
  return shorterDuration > 0 && overlap / shorterDuration >= 0.75;
}

export function finalizeChunks(
  chunks: RetrievedChunk[],
  topN: number,
  options: Pick<RetrievalOptions, 'intent'> = { intent: 'general' },
): RetrievedChunk[] {
  const hasRerankScores = chunks.some((chunk) => chunk.rerankScore !== null);
  const eligible = hasRerankScores
    ? chunks.filter(
        (chunk) =>
          chunk.retrievalSignals.exactPhrase
          || chunk.rerankScore === null
          || chunk.rerankScore >= 1.5,
      )
    : chunks;
  const pool = eligible.length > 0 ? eligible : chunks;
  const sorted = [...pool].sort((a, b) => {
    const rerankDifference = (b.rerankScore ?? -1) - (a.rerankScore ?? -1);
    return rerankDifference || b.fusedScore - a.fusedScore;
  });

  const selected: RetrievedChunk[] = [];
  const perDocument = new Map<string, number>();
  const perFamily = new Map<string, number>();
  const perFamilyEdition = new Map<string, number>();

  for (const chunk of sorted) {
    if (selected.some((existing) => significantLocatorOverlap(existing, chunk))) continue;

    const documentCount = perDocument.get(chunk.documentId) ?? 0;
    if (documentCount >= 3) continue;

    const family = chunk.documentFamilyId || chunk.documentId;
    const editionKey = `${family}:${chunk.editionYear ?? 'none'}`;
    const familyCount = perFamily.get(family) ?? 0;
    const familyEditionCount = perFamilyEdition.get(editionKey) ?? 0;

    if (options.intent === 'translation_evolution') {
      if (familyEditionCount >= 2) continue;
    } else if (familyCount >= 2) {
      continue;
    }

    selected.push(chunk);
    perDocument.set(chunk.documentId, documentCount + 1);
    perFamily.set(family, familyCount + 1);
    perFamilyEdition.set(editionKey, familyEditionCount + 1);
    if (selected.length >= topN) break;
  }

  return selected;
}

export function assessRetrieval(chunks: RetrievedChunk[]): RetrievalStrength {
  const top = chunks[0];
  if (!top) return 'none';

  const rerankScore = top.rerankScore ?? 0;
  const signals = top.retrievalSignals;

  if (
    rerankScore >= 3
    || signals.exactPhrase
    || signals.vectorScore >= 0.72
    || signals.enrichmentScore >= 0.72
    || (signals.titleScore >= 0.55 && signals.vectorScore >= 0.55)
  ) {
    return 'strong';
  }

  if (
    rerankScore >= 2
    || signals.vectorScore >= 0.58
    || signals.enrichmentScore >= 0.52
    || signals.lexicalScore > 0.02
    || signals.titleScore >= 0.3
  ) {
    return 'moderate';
  }

  return 'weak';
}

async function buildEnrichmentLists(
  queries: RetrievalQuery[],
  options: RetrievalOptions,
): Promise<RankedList[]> {
  if (!options.enrichmentEnabled) return [];
  const sectionCandidates = new Map<string, EnrichmentAccumulator>();

  const vectorResults = await Promise.all(
    queries.map(async (query) => ({
      query,
      rows: await enrichmentVectorSearch(query.embedding, options.enrichmentTopK),
    })),
  );
  for (const result of vectorResults) {
    accumulateEnrichmentRows(
      sectionCandidates,
      result.rows,
      `enrichment-vector:${result.query.kind}`,
      result.query.weight * channelWeight(result.query.kind, 'enrichment'),
      'vector',
    );
  }

  const lexicalQueries = queries.slice(0, 5);
  const lexicalResults = await Promise.all(
    lexicalQueries.map(async (query) => {
      const [textRows, exactRows] = await Promise.all([
        enrichmentTextSearch(query.text, options.enrichmentTopK),
        enrichmentExactSearch(query.text, Math.min(options.enrichmentTopK, 20)),
      ]);
      return { query, textRows, exactRows };
    }),
  );

  for (const result of lexicalResults) {
    accumulateEnrichmentRows(
      sectionCandidates,
      result.textRows,
      `enrichment-text:${result.query.kind}`,
      result.query.weight * channelWeight(result.query.kind, 'enrichment'),
      'lexical',
    );
    accumulateEnrichmentRows(
      sectionCandidates,
      result.exactRows,
      `enrichment-exact:${result.query.kind}`,
      result.query.weight * channelWeight(result.query.kind, 'enrichment') * 1.2,
      'exact',
    );
  }

  const selected = [...sectionCandidates.values()]
    .sort((a, b) => b.fusedScore - a.fusedScore)
    .slice(0, options.enrichmentMaxSections);
  const resolved = await resolveEnrichmentSections(selected);

  return resolved.length > 0
    ? [{
        rows: resolved,
        channel: 'enrichment:resolved-canonical',
        weight: 1.35,
        signal: 'enrichment',
      }]
    : [];
}

export async function retrieveChunks(
  queries: RetrievalQuery[],
  options: RetrievalOptions,
): Promise<RetrievedChunk[]> {
  const uniqueQueries = [...new Map(
    queries
      .filter((query) => query.text.trim() && query.embedding.length > 0)
      .map((query) => [query.text.toLocaleLowerCase(), query]),
  ).values()];

  const vectorLists = await Promise.all(
    uniqueQueries.map(async (query): Promise<RankedList> => ({
      rows: await vectorSearch(query.embedding, options.topK),
      channel: `vector:${query.kind}`,
      weight: query.weight * channelWeight(query.kind, 'vector'),
      signal: 'vector',
    })),
  );

  const lexicalQueries = uniqueQueries.slice(0, 5);
  const lexicalLists = (
    await Promise.all(
      lexicalQueries.map(async (query): Promise<RankedList[]> => {
        const [exactRows, webRows, looseRows, titleRows] = await Promise.all([
          exactPhraseSearch(query.text, Math.min(options.topK, 20)),
          webTextSearch(query.text, options.topK),
          looseTextSearch(query.text, options.topK),
          titleMatchSearch(query.text, query.embedding, Math.min(options.topK, 20)),
        ]);

        return [
          {
            rows: exactRows,
            channel: `exact:${query.kind}`,
            weight: query.weight * channelWeight(query.kind, 'exact'),
            signal: 'exact',
          },
          {
            rows: webRows,
            channel: `web:${query.kind}`,
            weight: query.weight * channelWeight(query.kind, 'lexical'),
            signal: 'lexical',
          },
          {
            rows: looseRows,
            channel: `loose:${query.kind}`,
            weight: query.weight * channelWeight(query.kind, 'lexical') * 0.75,
            signal: 'lexical',
          },
          {
            rows: titleRows,
            channel: `title:${query.kind}`,
            weight: query.weight * channelWeight(query.kind, 'title'),
            signal: 'title',
          },
        ];
      }),
    )
  ).flat();

  const enrichmentLists = await buildEnrichmentLists(uniqueQueries, options);
  const candidates = new Map<number, CandidateAccumulator>();
  for (const list of [...vectorLists, ...lexicalLists, ...enrichmentLists]) {
    accumulateRankedList(candidates, list);
  }

  const initial = deterministicDiversify(
    [...candidates.values()].map((candidate) => toRetrievedChunk(candidate, options)),
    options.topN,
  );

  return attachNeighborContexts(initial);
}
