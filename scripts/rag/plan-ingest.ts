import { readFileSync } from 'node:fs';
import path from 'node:path';
import { buildChunks } from './lib/chunking';
import { loadEnrichmentCorpus } from './lib/enrichment';
import type { ArchiveRecord } from '../../src/types/archive';

const masterIndexPath = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);

function approximateTokens(characters: number): number {
  return Math.ceil(characters / 4);
}

function main(): void {
  const allRecords: ArchiveRecord[] = JSON.parse(readFileSync(masterIndexPath, 'utf8'));
  const limit = Number(process.env.RAG_INGEST_LIMIT) || undefined;
  const records = limit ? allRecords.slice(0, limit) : allRecords;
  const enrichment = loadEnrichmentCorpus(allRecords);

  let documents = 0;
  let precisionChunks = 0;
  let contextChunks = 0;
  let canonicalCharacters = 0;
  let enrichmentSections = 0;
  let enrichmentCharacters = 0;

  for (const record of records) {
    if (!record.segments?.length) continue;
    documents += 1;
    const chunks = buildChunks(record);
    precisionChunks += chunks.filter((chunk) => chunk.chunkKind === 'precision').length;
    contextChunks += chunks.filter((chunk) => chunk.chunkKind === 'context').length;
    canonicalCharacters += chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);

    const sections = enrichment.sectionsByDocument.get(record.id) ?? [];
    enrichmentSections += sections.length;
    enrichmentCharacters += sections.reduce(
      (sum, section) => sum + section.searchText.length,
      0,
    );
  }

  console.log('RAG ingest plan');
  console.log(`  Documents with canonical evidence: ${documents}`);
  console.log(`  Precision chunks: ${precisionChunks}`);
  console.log(`  Context chunks: ${contextChunks}`);
  console.log(`  Enrichment sections: ${enrichmentSections}`);
  console.log(`  Relationships available: ${enrichment.relationships.length}`);
  console.log(`  Approx canonical embedding tokens: ${approximateTokens(canonicalCharacters).toLocaleString()}`);
  console.log(`  Approx enrichment embedding tokens: ${approximateTokens(enrichmentCharacters).toLocaleString()}`);
  console.log(`  Embedding model: ${process.env.MISTRAL_EMBED_MODEL || 'mistral-embed-2312'}`);
  if (limit) {
    console.log('  RAG_INGEST_LIMIT is active. Relationship refresh and stale-document pruning will be skipped.');
  } else {
    console.log('  Full ingest: stale documents will be pruned and relationships refreshed transactionally.');
  }
  console.log('\nNo database or API calls were made.');
}

main();
