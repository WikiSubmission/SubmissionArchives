import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ArchiveRecord } from '../../src/types/archive';

/**
 * Builds compact review packets for enrichment sections so review agents can
 * judge summaries against canonical text without exploring MASTER_INDEX
 * themselves. One packet file per enrichment file, containing each section's
 * summary and the canonical span text at its locator.
 */

const MASTER_INDEX_PATH = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);
const ENRICHMENT_ROOT = path.resolve(process.cwd(), 'data', 'rag_enrichment');
const PACKET_DIR = path.resolve(process.cwd(), 'reports', 'enrichment-review', 'packets');
const SPAN_MAX_CHARS = 9_000;
const CATEGORIES = new Set(['audio-program', 'video-program', 'written-works']);

interface PacketSection {
  id: string;
  title: string;
  summary: string;
  segmentRange: string;
  spanTruncated: boolean;
  spanText: string;
}

function truncateSpan(text: string): { text: string; truncated: boolean } {
  if (text.length <= SPAN_MAX_CHARS) return { text, truncated: false };
  const head = text.slice(0, Math.floor(SPAN_MAX_CHARS * 0.7));
  const tail = text.slice(-Math.floor(SPAN_MAX_CHARS * 0.25));
  return { text: `${head}\n[... span truncated ...]\n${tail}`, truncated: true };
}

function main(): void {
  const records: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const recordById = new Map(records.map((record) => [record.id, record]));
  mkdirSync(PACKET_DIR, { recursive: true });
  let packetCount = 0;
  let sectionCount = 0;

  for (const category of readdirSync(ENRICHMENT_ROOT, { withFileTypes: true })) {
    if (!category.isDirectory() || !CATEGORIES.has(category.name)) continue;
    const categoryDir = path.join(ENRICHMENT_ROOT, category.name);

    for (const entry of readdirSync(categoryDir)) {
      if (!entry.endsWith('.json') || entry === 'manifest.json') continue;
      const filePath = path.join(categoryDir, entry);
      const doc = JSON.parse(readFileSync(filePath, 'utf8')) as {
        document_id?: string;
        canonical_document_id?: string;
        sections?: Array<Record<string, unknown>>;
      };
      const documentId = doc.canonical_document_id ?? doc.document_id;
      const record = documentId ? recordById.get(documentId) : undefined;
      if (!record?.segments || !Array.isArray(doc.sections)) continue;

      const sections: PacketSection[] = [];
      for (const section of doc.sections) {
        const id = String(section.id ?? '');
        const summary = String(section.summary ?? '');
        if (!id || !summary) continue;
        const start = Number(section.source_segment_start);
        const end = Number(section.source_segment_end);
        const span = Number.isInteger(start) && Number.isInteger(end)
          ? record.segments.slice(start, end + 1).map((item) => item.text ?? '').join(' ')
          : '';
        const { text, truncated } = truncateSpan(span);
        sections.push({
          id,
          title: String(section.title ?? ''),
          summary,
          segmentRange: `${start}-${end}`,
          spanTruncated: truncated,
          spanText: text,
        });
        sectionCount += 1;
      }

      const packet = {
        file: `data/rag_enrichment/${category.name}/${entry}`,
        documentId: record.id,
        documentTitle: record.title,
        sections,
      };
      writeFileSync(
        path.join(PACKET_DIR, `${category.name}--${entry}`),
        JSON.stringify(packet, null, 1),
      );
      packetCount += 1;
    }
  }

  console.log(`Packets written: ${packetCount} (${sectionCount} sections) to ${path.relative(process.cwd(), PACKET_DIR)}`);
}

main();
