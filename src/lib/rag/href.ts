import { getMediaHref } from '@/lib/utils';

const DOCUMENT_TYPES = new Set(['perspective', 'appendix', 'other', 'quran']);

export function buildSourceHref(
  documentId: string,
  type: string,
  page: number | null,
  startTime: number | null,
): string {
  if (type === 'quran') {
    const chapterNumber = documentId.replace(/^quran\//, '');
    return page ? `/quran/${chapterNumber}?verse=${page}` : `/quran/${chapterNumber}`;
  }

  if (DOCUMENT_TYPES.has(type)) {
    return page ? `/library/${documentId}?page=${page}` : `/library/${documentId}`;
  }

  const base = getMediaHref(documentId);
  return startTime ? `${base}?t=${Math.floor(startTime)}` : base;
}
