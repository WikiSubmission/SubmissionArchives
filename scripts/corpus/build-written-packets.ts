import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ArchiveRecord } from '../../src/types/archive';

/**
 * Builds generation packets for the written works so enrichment-authoring
 * agents get each document's full page text with segment indices, without
 * touching MASTER_INDEX themselves.
 */

const MASTER_INDEX_PATH = path.resolve(
  process.cwd(),
  'public',
  'data',
  'generated_indices',
  'MASTER_INDEX.json',
);
const PACKET_DIR = path.resolve(process.cwd(), 'reports', 'enrichment-review', 'gen-packets');

const WRITTEN_WORK_IDS = [
  'miracle-of-quran-alphabets',
  'islam-volume-1-number-1-april-1974',
  'islam-volume-1-number-2-july-1974',
  'islam-volume-1-number-3-4-january-1975',
  'english-meanings-of-the-quran',
  'perpetual-miracle',
  'computer-speaks',
  'quran-hadith-islam',
  'quran-visual-presentation',
  'eternity-screenplay',
  'salat-booklet',
];

function main(): void {
  const records: ArchiveRecord[] = JSON.parse(readFileSync(MASTER_INDEX_PATH, 'utf8'));
  const recordById = new Map(records.map((record) => [record.id, record]));
  mkdirSync(PACKET_DIR, { recursive: true });

  for (const id of WRITTEN_WORK_IDS) {
    const record = recordById.get(id);
    if (!record?.segments?.length) {
      console.warn(`Skipping ${id}: no canonical record or segments.`);
      continue;
    }

    const pages = record.segments.map((segment, index) => ({
      segmentIndex: index,
      page: segment.page ?? null,
      text: segment.text ?? '',
    }));

    const packet = {
      documentId: record.id,
      title: record.title,
      author: record.author ?? null,
      type: record.type,
      pageCount: pages.length,
      pages,
    };
    writeFileSync(path.join(PACKET_DIR, `${id}.json`), JSON.stringify(packet, null, 1));
    console.log(`${id}: ${pages.length} pages`);
  }
}

main();
