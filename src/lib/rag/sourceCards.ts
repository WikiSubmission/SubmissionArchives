import { buildSourceHref } from './href';
import type { RetrievedChunk, SourceCard } from './types';

const SNIPPET_MAX_LENGTH = 220;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export function buildSourceCards(chunks: RetrievedChunk[]): SourceCard[] {
  return chunks.map((chunk, index) => {
    const sourceId = `S${index + 1}`;
    return {
      sourceId,
      documentId: chunk.documentId,
      title: chunk.documentDisplayTitle || chunk.documentTitle,
      type: chunk.documentType,
      author: chunk.speaker || chunk.documentAuthor,
      isRashadAuthored: chunk.documentIsRashadAuthored || chunk.speaker === 'Dr. Khalifa',
      href: buildSourceHref(chunk.documentId, chunk.documentType, chunk.page, chunk.startTime),
      snippet: truncate(chunk.text, SNIPPET_MAX_LENGTH),
      startTime: chunk.startTime,
      page: chunk.page,
      label: chunk.label,
    };
  });
}
