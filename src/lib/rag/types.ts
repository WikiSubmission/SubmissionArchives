export type RetrievalQueryKind = 'original' | 'expanded' | 'hyde';

export type RetrievalIntent =
  | 'general'
  | 'final_wording'
  | 'translation_evolution'
  | 'historical_development'
  | 'ritual_procedure';

export interface RetrievalQuery {
  text: string;
  embedding: number[];
  kind: RetrievalQueryKind;
  weight: number;
}

export type RetrievalMatchType = 'direct' | 'conceptual' | 'related' | 'uncertain';

export interface RetrievalSignals {
  exactPhrase: boolean;
  vectorScore: number;
  lexicalScore: number;
  titleScore: number;
  enrichmentScore: number;
  channelHits: string[];
}

export interface QueryExpansion {
  exactTerms: string[];
  paraphrases: string[];
  conceptDescriptions: string[];
  archivePhrases: string[];
  hypotheticalPassage: string;
  intent: RetrievalIntent;
  requestedEditionYears: number[];
}

export interface SourceCard {
  sourceId: string;
  documentId: string;
  title: string;
  type: string;
  author: string | null;
  isRashadAuthored: boolean;
  href: string;
  snippet: string;
  startTime: number | null;
  endTime: number | null;
  page: number | null;
  verseId: string | null;
  label: string | null;
  matchType: RetrievalMatchType;
  relevanceReason: string | null;
  publicationDate: string | null;
  editionYear: number | null;
  evidenceKind: string;
  sourcePriority: string;
  matchedSectionTitle: string | null;
  enrichmentGuided: boolean;
}

export type AskNoticeKind = 'no_answer' | 'weak_retrieval' | 'model_unavailable' | 'out_of_scope';

export interface RetrievedChunk {
  id: number;
  chunkIndex: number;
  chunkKind: 'precision' | 'context';
  documentId: string;
  text: string;
  contextText: string;
  startTime: number | null;
  endTime: number | null;
  contextStartTime: number | null;
  contextEndTime: number | null;
  page: number | null;
  contextPage: number | null;
  speaker: string | null;
  label: string | null;
  sourceSegmentStart: number | null;
  sourceSegmentEnd: number | null;
  editionYear: number | null;
  evidenceKind: string;
  verseId: string | null;
  documentTitle: string;
  documentDisplayTitle: string | null;
  documentType: string;
  documentCategory: string | null;
  documentAuthor: string | null;
  documentAliases: string[];
  documentIsRashadAuthored: boolean;
  documentPdfLink: string | null;
  documentYoutubeId: string | null;
  documentSourceClass: string | null;
  documentSourcePriority: string;
  documentPublicationDate: string | null;
  documentDatePrecision: string | null;
  documentEditionYear: number | null;
  documentGenre: string | null;
  documentFamilyId: string;
  matchedSectionId: string | null;
  matchedSectionTitle: string | null;
  enrichmentGuided: boolean;
  fusedScore: number;
  retrievalSignals: RetrievalSignals;
  rerankScore: number | null;
  matchType: RetrievalMatchType;
  relevanceReason: string | null;
}

export interface RetrievalOptions {
  topK: number;
  topN: number;
  intent: RetrievalIntent;
  requestedEditionYears: number[];
  enrichmentEnabled: boolean;
  enrichmentTopK: number;
  enrichmentMaxSections: number;
}
