import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadEnrichmentCorpus } from './lib/enrichment';
import type { ArchiveRecord } from '../../src/types/archive';

const masterIndexPath = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);

function main(): void {
  const records: ArchiveRecord[] = JSON.parse(readFileSync(masterIndexPath, 'utf8'));
  const byId = new Map(records.map((record) => [record.id, record]));
  const corpus = loadEnrichmentCorpus(records);
  const errors: string[] = [];

  if (corpus.warnings.length > 0) errors.push(...corpus.warnings);

  let metadataOnlyViolations = 0;
  let unresolvedDocumentIds = 0;
  const sectionsWithoutLocator: string[] = [];

  for (const [documentId, sections] of corpus.sectionsByDocument) {
    const record = byId.get(documentId);
    if (!record?.segments?.length) {
      unresolvedDocumentIds += 1;
      errors.push(`Enrichment maps to a document without canonical segments: ${documentId}`);
    }

    for (const section of sections) {
      if (/CANONICAL EVIDENCE TEXT:|Archive passage:/i.test(section.searchText)) {
        metadataOnlyViolations += 1;
        errors.push(`Enrichment search text contains an evidence marker: ${section.id}`);
      }
      if (
        section.sourceSegmentStart === null
        && section.startTime === null
        && section.pageStart === null
      ) {
        sectionsWithoutLocator.push(`${documentId} :: ${section.id}`);
      }
    }
  }

  const invalidRelationships = corpus.relationships.filter(
    (relationship) =>
      !byId.has(relationship.sourceDocumentId)
      || !byId.has(relationship.targetDocumentId),
  );
  if (invalidRelationships.length > 0) {
    errors.push(`${invalidRelationships.length} relationship(s) have a missing canonical endpoint.`);
  }

  const editionCounts = new Map<number, number>();
  const sourcePriorities = new Map<string, number>();
  for (const metadata of corpus.documents.values()) {
    if (metadata.editionYear) {
      editionCounts.set(
        metadata.editionYear,
        (editionCounts.get(metadata.editionYear) ?? 0) + 1,
      );
    }
    sourcePriorities.set(
      metadata.sourcePriority,
      (sourcePriorities.get(metadata.sourcePriority) ?? 0) + 1,
    );
  }

  console.log('Enrichment validation summary');
  console.log(`  Catalog documents: ${records.length}`);
  console.log(`  Enrichment files mapped: ${corpus.statistics.mappedDocuments}`);
  console.log(`  Searchable enrichment sections: ${corpus.statistics.sections}`);
  console.log(`  Document relationships: ${corpus.statistics.relationships}`);
  console.log(`  Sections without a precise locator: ${sectionsWithoutLocator.length}`);
  if (sectionsWithoutLocator.length > 0) {
    console.warn(
      '  These sections resolve through the whole-document fallback and should get segment, time, or page locators during review:',
    );
    for (const entry of sectionsWithoutLocator) console.warn(`    - ${entry}`);
  }
  console.log(`  Metadata-only violations: ${metadataOnlyViolations}`);
  console.log(`  Documents without canonical segments: ${unresolvedDocumentIds}`);
  console.log(`  Edition metadata: ${JSON.stringify(Object.fromEntries([...editionCounts].sort()))}`);
  console.log(`  Source priorities: ${JSON.stringify(Object.fromEntries([...sourcePriorities].sort()))}`);

  if (errors.length > 0) {
    console.error('\nValidation FAILED:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log('\nValidation passed. Enrichment remains metadata-only and canonically mapped.');
  }
}

main();
