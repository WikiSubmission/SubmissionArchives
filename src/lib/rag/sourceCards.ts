import { buildSourceHref } from './href';
import type { RetrievedChunk, SourceCard } from './types';

const SNIPPET_MAX_LENGTH = 420;

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
      isRashadAuthored:
        chunk.documentIsRashadAuthored
        || chunk.speaker === 'Dr. Khalifa'
        || chunk.speaker === 'Dr. Rashad Khalifa',
      href: buildSourceHref(
        chunk.documentId,
        chunk.documentType,
        chunk.contextPage,
        chunk.contextStartTime,
      ),
      snippet: truncate(chunk.contextText, SNIPPET_MAX_LENGTH),
      startTime: chunk.contextStartTime,
      endTime: chunk.contextEndTime,
      page: chunk.contextPage,
      verseId: chunk.verseId,
      label: chunk.label,
      matchType: chunk.matchType,
      relevanceReason: chunk.relevanceReason,
      publicationDate: chunk.documentPublicationDate,
      editionYear: chunk.editionYear ?? chunk.documentEditionYear,
      evidenceKind: chunk.evidenceKind,
      sourcePriority: chunk.documentSourcePriority,
      matchedSectionTitle: chunk.matchedSectionTitle,
      enrichmentGuided: chunk.enrichmentGuided,
    };
  });
}
