import { getMediaHref } from '@/lib/utils';
import { withSearchParams } from './links';
export interface LinkMedia { title?: string; id: string; type: string; page?: number; }
export interface LinkMatch { start_time: number; page?: number; label?: string; }
export function isDocumentType(type: string) {
    return ['perspective', 'appendix', 'other'].includes(type);
}

// Documents open in the library reader, at a page when one is known.
function getDocumentLink(media: LinkMedia, query: string, page?: number) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (typeof page === 'number') params.append('page', String(page));
    const queryString = params.toString();
    return queryString ? `/library/${media.id}?${queryString}` : `/library/${media.id}`;
}

export function getMediaLink(media: LinkMedia, query: string) {
    return isDocumentType(media.type) ? getDocumentLink(media, query, media.page) : getMediaHref(media.id);
}

export function getMatchHref(media: LinkMedia, match: LinkMatch, query: string) {
    if (isDocumentType(media.type)) {
        return getDocumentLink(media, query, typeof match.page === 'number' ? match.page : media.page);
    }
    return withSearchParams(getMediaLink(media, query), { t: Math.max(0, Math.floor(match.start_time)) });
}
