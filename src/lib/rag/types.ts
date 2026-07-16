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
  page: number | null;
  label: string | null;
}

export type AskNoticeKind = 'no_answer' | 'weak_retrieval' | 'model_unavailable' | 'out_of_scope';

export interface RetrievedChunk {
  id: number;
  documentId: string;
  text: string;
  startTime: number | null;
  endTime: number | null;
  page: number | null;
  speaker: string | null;
  label: string | null;
  documentTitle: string;
  documentDisplayTitle: string | null;
  documentType: string;
  documentAuthor: string | null;
  documentIsRashadAuthored: boolean;
  documentPdfLink: string | null;
  documentYoutubeId: string | null;
  fusedScore: number;
}
