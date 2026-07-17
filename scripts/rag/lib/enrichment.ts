import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { ArchiveRecord } from '../../../src/types/archive';

export interface RagDocumentMetadata {
  category: string | null;
  sourceClass: string | null;
  sourcePriority: string;
  publicationDate: string | null;
  datePrecision: string | null;
  editionYear: number | null;
  genre: string | null;
  familyId: string;
  reviewStatus: string | null;
  metadata: Record<string, unknown>;
}

export interface RagEnrichmentSectionDraft {
  id: string;
  enrichmentDocumentId: string;
  sectionId: string;
  documentId: string;
  title: string;
  summary: string;
  searchText: string;
  sectionKind: string | null;
  claimClassification: string | null;
  concepts: string[];
  userTerms: string[];
  relatedQuestions: string[];
  quranReferences: string[];
  bibleReferences: string[];
  entities: string[];
  startTime: number | null;
  endTime: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  sourceSegmentStart: number | null;
  sourceSegmentEnd: number | null;
  retrievalPriority: string;
  retrievalNote: string | null;
  reviewStatus: string;
}

export interface RagRelationshipDraft {
  sourceDocumentId: string;
  targetDocumentId: string;
  relationship: string;
  note: string | null;
  sourceEnrichmentDocumentId: string;
}

export interface EnrichmentCorpus {
  documents: Map<string, RagDocumentMetadata>;
  sectionsByDocument: Map<string, RagEnrichmentSectionDraft[]>;
  relationships: RagRelationshipDraft[];
  warnings: string[];
  statistics: {
    enrichmentDocuments: number;
    mappedDocuments: number;
    skippedDocuments: number;
    sections: number;
    relationships: number;
  };
}

interface EnrichmentFile {
  document_id?: unknown;
  canonical_document_id?: unknown;
  canonical_catalog_ids?: unknown;
  title?: unknown;
  source_class?: unknown;
  date?: unknown;
  date_precision?: unknown;
  review_status?: unknown;
  document_retrieval_priority?: unknown;
  primary_speaker?: unknown;
  primary_speakers?: unknown;
  series?: unknown;
  archive_number?: unknown;
  source_file?: unknown;
  youtube_id?: unknown;
  related_duplicate_sources?: unknown;
  sections?: unknown;
}

interface InventoryRow {
  source_class: string;
  document_id: string;
  title: string;
  date: string;
  author_or_speakers: string;
  genre: string;
  canonical_file: string;
  record_count: string;
  source_priority: string;
  note: string;
}

const ENRICHMENT_ROOT = path.resolve(process.cwd(), 'data', 'rag_enrichment');
const INVENTORY_PATH = path.resolve(process.cwd(), 'data', 'corpus', 'all_source_inventory.csv');
const WRITTEN_RELATIONSHIPS_PATH = path.resolve(
  process.cwd(),
  'data',
  'corpus',
  'written_relationships.csv',
);

function cleanString(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of value) {
    const cleaned = cleanString(item);
    const key = cleaned.toLocaleLowerCase();
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    output.push(cleaned);
  }
  return output;
}

function optionalNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function normalizeTitle(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function listJsonFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const output: string[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'manifest.json') {
        output.push(full);
      }
    }
  }

  return output.sort();
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((item) => item.length > 0)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((item) => item.length > 0)) rows.push(row);
  return rows;
}

function loadInventory(): InventoryRow[] {
  if (!existsSync(INVENTORY_PATH)) return [];
  const rows = parseCsv(readFileSync(INVENTORY_PATH, 'utf8').replace(/^\uFEFF/, ''));
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])) as unknown as InventoryRow,
  );
}

function loadWrittenRelationships(): Array<{
  source_id: string;
  target_id: string;
  relationship: string;
  note: string;
}> {
  if (!existsSync(WRITTEN_RELATIONSHIPS_PATH)) return [];
  const rows = parseCsv(
    readFileSync(WRITTEN_RELATIONSHIPS_PATH, 'utf8').replace(/^﻿/, ''),
  );
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? '']),
    ) as {
      source_id: string;
      target_id: string;
      relationship: string;
      note: string;
    },
  );
}

function parseAllowedStatuses(): Set<string> {
  const raw: string = process.env.RAG_ENRICHMENT_STATUSES || 'draft,approved';
  return new Set(
    raw
      .split(',')
      .map((item) => item.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
}

function inferEditionYear(record: ArchiveRecord, inventory: InventoryRow | null): number | null {
  if (Number.isInteger(record.editionYear)) return record.editionYear ?? null;
  if (record.type === 'quran') return 1992;
  const fromDate = inventory?.date.match(/^(19\d{2}|20\d{2})/)?.[1];
  return fromDate ? Number(fromDate) : null;
}

function datePrecision(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'day';
  if (/^\d{4}-\d{2}$/.test(value)) return 'month';
  if (/^\d{4}$/.test(value)) return 'year';
  return value ? 'inventory' : null;
}

const EXPLICIT_INVENTORY_IDS: Record<string, string> = {
  'english-meanings-of-the-quran': 'written/W05',
  'eternity-screenplay': 'written/W10',
  'hard-cover-1989': 'quran/1989',
  'islam-volume-1-number-1-april-1974': 'written/W02',
  'islam-volume-1-number-2-july-1974': 'written/W03',
  'islam-volume-1-number-3-4-january-1975': 'written/W04',
  'miracle-of-quran-alphabets': 'written/W01',
  'quran-visual-presentation': 'written/W09',
  'quran-hadith-islam': 'written/W08',
  quran1981: 'quran/1981',
  'computer-speaks': 'written/W07',
  'salat-booklet': 'written/W11',
  'perpetual-miracle': 'written/W06',
};

function specialInventoryId(record: ArchiveRecord): string | null {
  const explicit = EXPLICIT_INVENTORY_IDS[record.id];
  if (explicit) return explicit;
  if (record.type === 'quran') return 'quran/1992';
  return null;
}

function chooseInventoryRow(
  record: ArchiveRecord,
  inventoryById: Map<string, InventoryRow>,
  inventoryByTitle: Map<string, InventoryRow[]>,
): InventoryRow | null {
  const special = specialInventoryId(record);
  if (special && inventoryById.has(special)) return inventoryById.get(special) ?? null;
  if (inventoryById.has(record.id)) return inventoryById.get(record.id) ?? null;

  const normalized = normalizeTitle(record.displayTitle ?? record.title);
  const candidates = inventoryByTitle.get(normalized) ?? [];
  if (candidates.length === 1) return candidates[0];
  return null;
}

function primarySpeakerValue(data: EnrichmentFile): string | string[] | null {
  const singular = cleanString(data.primary_speaker);
  if (singular) return singular;
  const plural = cleanStringArray(data.primary_speakers);
  return plural.length > 0 ? plural : null;
}

function buildSearchText(section: Record<string, unknown>): string {
  const concepts = Array.isArray(section.concepts)
    ? section.concepts
        .map((item) => (item && typeof item === 'object' ? cleanString((item as Record<string, unknown>).id) : ''))
        .filter(Boolean)
    : [];

  const lines = [
    cleanString(section.title),
    cleanString(section.summary),
    cleanString(section.section_kind),
    cleanString(section.claim_classification),
    concepts.length ? `Concepts: ${concepts.join('; ')}` : '',
    cleanStringArray(section.user_terms).length
      ? `User terminology: ${cleanStringArray(section.user_terms).join('; ')}`
      : '',
    cleanStringArray(section.related_questions).length
      ? `Questions: ${cleanStringArray(section.related_questions).join(' ')}`
      : '',
    cleanStringArray(section.quran_references).length
      ? `Quran references: ${cleanStringArray(section.quran_references).join('; ')}`
      : '',
    cleanStringArray(section.bible_references).length
      ? `Bible references: ${cleanStringArray(section.bible_references).join('; ')}`
      : '',
    cleanStringArray(section.entities).length
      ? `Entities: ${cleanStringArray(section.entities).join('; ')}`
      : '',
  ];

  return lines.filter(Boolean).join('\n');
}

class UnionFind {
  private readonly parent = new Map<string, string>();

  add(value: string): void {
    if (!this.parent.has(value)) this.parent.set(value, value);
  }

  find(value: string): string {
    this.add(value);
    const parent = this.parent.get(value) ?? value;
    if (parent === value) return value;
    const root = this.find(parent);
    this.parent.set(value, root);
    return root;
  }

  union(a: string, b: string): void {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) return;
    const [first, second] = [rootA, rootB].sort();
    this.parent.set(second, first);
  }
}

function isDuplicateLikeRelationship(value: string): boolean {
  const normalized = value.toLocaleLowerCase();
  return /duplicate|excerpt|parallel|same recording|same .* narrative|overlap|retelling|repeated|shortened|extract|precursor/.test(
    normalized,
  );
}

function relationshipRows(data: EnrichmentFile): Array<{ documentId: string; relationship: string; note: string | null }> {
  if (!Array.isArray(data.related_duplicate_sources)) return [];
  const output: Array<{ documentId: string; relationship: string; note: string | null }> = [];
  for (const item of data.related_duplicate_sources) {
    if (!item || typeof item !== 'object') continue;
    const row = item as Record<string, unknown>;
    const documentId = cleanString(row.document_id);
    const relationship = cleanString(row.relationship);
    if (!documentId || !relationship) continue;
    output.push({
      documentId,
      relationship,
      note: cleanString(row.note) || null,
    });
  }
  return output;
}

function canonicalId(data: EnrichmentFile, validIds: Set<string>): string | null {
  const direct = cleanString(data.canonical_document_id);
  if (direct && validIds.has(direct)) return direct;

  if (Array.isArray(data.canonical_catalog_ids)) {
    const candidate = data.canonical_catalog_ids
      .map(cleanString)
      .find((item) => item && validIds.has(item));
    if (candidate) return candidate;
  }

  const original = cleanString(data.document_id);
  return original && validIds.has(original) ? original : null;
}

export function loadEnrichmentCorpus(records: ArchiveRecord[]): EnrichmentCorpus {
  const validIds = new Set(records.map((record) => record.id));
  const recordById = new Map(records.map((record) => [record.id, record]));
  const inventory = loadInventory();
  const inventoryById = new Map(inventory.map((row) => [row.document_id, row]));
  const inventoryByTitle = new Map<string, InventoryRow[]>();
  for (const row of inventory) {
    const key = normalizeTitle(row.title);
    const list = inventoryByTitle.get(key) ?? [];
    list.push(row);
    inventoryByTitle.set(key, list);
  }

  const documents = new Map<string, RagDocumentMetadata>();
  const inventoryIdToCanonical = new Map<string, string>();
  for (const record of records) {
    const inventoryRow = chooseInventoryRow(record, inventoryById, inventoryByTitle);
    if (inventoryRow && record.type !== 'quran') {
      inventoryIdToCanonical.set(inventoryRow.document_id, record.id);
    }
    documents.set(record.id, {
      category: record.category || null,
      sourceClass: inventoryRow?.source_class || null,
      sourcePriority: inventoryRow?.source_priority || 'canonical',
      publicationDate: inventoryRow?.date || record.fullDate || record.date || null,
      datePrecision: datePrecision(inventoryRow?.date || record.fullDate || record.date || ''),
      editionYear: inferEditionYear(record, inventoryRow),
      genre: inventoryRow?.genre || null,
      familyId: record.id,
      reviewStatus: null,
      metadata: {
        inventoryDocumentId: inventoryRow?.document_id || null,
        inventoryNote: inventoryRow?.note || null,
        canonicalFile: inventoryRow?.canonical_file || null,
        transcriptionSource: record.transcriptionSource ?? null,
        transcriptionMethod: record.transcriptionMethod ?? null,
      },
    });
  }

  const warnings: string[] = [];
  const allowedStatuses = parseAllowedStatuses();
  const rawDocuments: Array<{ filePath: string; data: EnrichmentFile; canonicalId: string }> = [];
  const enrichmentIdToCanonical = new Map<string, string>();

  for (const filePath of listJsonFiles(ENRICHMENT_ROOT)) {
    let data: EnrichmentFile;
    try {
      data = JSON.parse(readFileSync(filePath, 'utf8')) as EnrichmentFile;
    } catch (error) {
      warnings.push(`Could not parse ${path.relative(process.cwd(), filePath)}: ${String(error)}`);
      continue;
    }

    const mapped = canonicalId(data, validIds);
    const enrichmentDocumentId = cleanString(data.document_id);
    if (!mapped || !enrichmentDocumentId) {
      warnings.push(`Skipped unmapped enrichment file: ${path.relative(process.cwd(), filePath)}`);
      continue;
    }

    enrichmentIdToCanonical.set(enrichmentDocumentId, mapped);
    rawDocuments.push({ filePath, data, canonicalId: mapped });
  }

  const unionFind = new UnionFind();
  for (const record of records) unionFind.add(record.id);

  const relationships: RagRelationshipDraft[] = [];
  for (const item of rawDocuments) {
    const sourceEnrichmentId = cleanString(item.data.document_id);
    for (const relationship of relationshipRows(item.data)) {
      const targetCanonical = enrichmentIdToCanonical.get(relationship.documentId)
        ?? (validIds.has(relationship.documentId) ? relationship.documentId : null);
      if (!targetCanonical || targetCanonical === item.canonicalId) continue;

      relationships.push({
        sourceDocumentId: item.canonicalId,
        targetDocumentId: targetCanonical,
        relationship: relationship.relationship,
        note: relationship.note,
        sourceEnrichmentDocumentId: sourceEnrichmentId,
      });

      if (isDuplicateLikeRelationship(relationship.relationship)) {
        unionFind.union(item.canonicalId, targetCanonical);
      }
    }
  }

  for (const relationship of loadWrittenRelationships()) {
    const sourceDocumentId = inventoryIdToCanonical.get(relationship.source_id);
    const targetDocumentId = inventoryIdToCanonical.get(relationship.target_id);
    if (!sourceDocumentId || !targetDocumentId || sourceDocumentId === targetDocumentId) continue;

    relationships.push({
      sourceDocumentId,
      targetDocumentId,
      relationship: relationship.relationship,
      note: relationship.note || null,
      sourceEnrichmentDocumentId: 'corpus/written_relationships',
    });
    if (isDuplicateLikeRelationship(relationship.relationship)) {
      unionFind.union(sourceDocumentId, targetDocumentId);
    }
  }

  const sectionsByDocument = new Map<string, RagEnrichmentSectionDraft[]>();
  let sectionCount = 0;

  for (const item of rawDocuments) {
    const record = recordById.get(item.canonicalId);
    if (!record) continue;

    const existing = documents.get(item.canonicalId);
    const reviewStatus = cleanString(item.data.review_status) || 'draft';
    const date = cleanString(item.data.date);
    const sourceClass = cleanString(item.data.source_class);
    const sourcePriority = cleanString(item.data.document_retrieval_priority);

    documents.set(item.canonicalId, {
      category: existing?.category ?? record.category ?? null,
      sourceClass: sourceClass || existing?.sourceClass || null,
      sourcePriority: sourcePriority || existing?.sourcePriority || 'canonical',
      publicationDate: date || existing?.publicationDate || null,
      datePrecision: cleanString(item.data.date_precision) || existing?.datePrecision || null,
      editionYear: existing?.editionYear ?? inferEditionYear(record, null),
      genre: existing?.genre || null,
      familyId: unionFind.find(item.canonicalId),
      reviewStatus,
      metadata: {
        ...(existing?.metadata ?? {}),
        enrichmentDocumentId: cleanString(item.data.document_id),
        enrichmentTitle: cleanString(item.data.title),
        series: cleanString(item.data.series) || null,
        archiveNumber: optionalInteger(item.data.archive_number),
        sourceFile: cleanString(item.data.source_file) || null,
        youtubeId: cleanString(item.data.youtube_id) || null,
        primarySpeaker: primarySpeakerValue(item.data),
      },
    });

    const sections = Array.isArray(item.data.sections) ? item.data.sections : [];
    const target = sectionsByDocument.get(item.canonicalId) ?? [];

    for (const rawSection of sections) {
      if (!rawSection || typeof rawSection !== 'object') continue;
      const section = rawSection as Record<string, unknown>;
      const sectionId = cleanString(section.id);
      const title = cleanString(section.title);
      const sectionReviewStatus = cleanString(section.review_status) || reviewStatus;
      if (!sectionId || !title || !allowedStatuses.has(sectionReviewStatus.toLocaleLowerCase())) continue;

      const concepts = Array.isArray(section.concepts)
        ? section.concepts
            .map((concept) =>
              concept && typeof concept === 'object'
                ? cleanString((concept as Record<string, unknown>).id)
                : '',
            )
            .filter(Boolean)
        : [];

      const startTime = optionalNumber(section.start);
      const endTime = optionalNumber(section.end);
      const page = optionalInteger(section.page);
      const pageStart = optionalInteger(section.page_start) ?? page;
      const pageEnd = optionalInteger(section.page_end) ?? page;

      target.push({
        id: `${cleanString(item.data.document_id)}::${sectionId}`,
        enrichmentDocumentId: cleanString(item.data.document_id),
        sectionId,
        documentId: item.canonicalId,
        title,
        summary: cleanString(section.summary),
        searchText: buildSearchText(section),
        sectionKind: cleanString(section.section_kind) || null,
        claimClassification: cleanString(section.claim_classification) || null,
        concepts,
        userTerms: cleanStringArray(section.user_terms),
        relatedQuestions: cleanStringArray(section.related_questions),
        quranReferences: cleanStringArray(section.quran_references),
        bibleReferences: cleanStringArray(section.bible_references),
        entities: cleanStringArray(section.entities),
        startTime,
        endTime,
        pageStart,
        pageEnd,
        sourceSegmentStart: optionalInteger(section.source_segment_start),
        sourceSegmentEnd: optionalInteger(section.source_segment_end),
        retrievalPriority: cleanString(section.retrieval_priority) || 'primary',
        retrievalNote: cleanString(section.retrieval_note) || null,
        reviewStatus: sectionReviewStatus,
      });
      sectionCount += 1;
    }

    sectionsByDocument.set(item.canonicalId, target);
  }

  for (const [documentId, metadata] of documents) {
    documents.set(documentId, {
      ...metadata,
      familyId: unionFind.find(documentId),
    });
  }

  return {
    documents,
    sectionsByDocument,
    relationships,
    warnings,
    statistics: {
      enrichmentDocuments: listJsonFiles(ENRICHMENT_ROOT).length,
      mappedDocuments: rawDocuments.length,
      skippedDocuments: listJsonFiles(ENRICHMENT_ROOT).length - rawDocuments.length,
      sections: sectionCount,
      relationships: relationships.length,
    },
  };
}
