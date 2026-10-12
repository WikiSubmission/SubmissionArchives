import { getMediaHref } from '@/lib/utils';
import { withSearchParams } from './links';
export interface LinkMedia { title?: string; id: string; type: string; page?: number; }
export interface LinkMatch { start_time: number; page?: number; label?: string; }
function getQuranEditionFromLabel(label?: string) {
    const edition = label?.match(/-(1989|1992)$/)?.[1];
    return edition === '1989' || edition === '1992' ? edition : undefined;
}
export function isDocumentType(type: string) {
    return ['perspective', 'appendix', 'other', 'quran'].includes(type);
}

export function getDocumentBasePath(media: LinkMedia) {
    if (media.type === 'quran') {
        return `/scripture/quran/${media.id.replace(/^quran\//, '')}`;
    }
    return `/library/${media.id}`;
}

export function getMediaLink(media: LinkMedia, query: string) {
    if (isDocumentType(media.type)) {
        const params = new URLSearchParams();
        if (query) params.append('q', query);
        if (typeof media.page === 'number') params.append('page', String(media.page));
        return `${getDocumentBasePath(media)}?${params.toString()}`;
    }

    return getMediaHref(media.id);
}

export function getDocumentMatchLink(media: LinkMedia, match: LinkMatch, query: string) {
    const params = new URLSearchParams();
    if (query) params.append('q', query);

    if (media.type === 'quran') {
        const edition = getQuranEditionFromLabel(match.label);
        if (edition) params.append('edition', edition);
    }

    const page = typeof match.page === 'number' ? match.page : media.page;
    if (typeof page === 'number') {
        params.append('page', String(page));
    }

    const basePath = getDocumentBasePath(media);
    const queryString = params.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
}

export function getMatchHref(media: LinkMedia, match: LinkMatch, query: string) {
    if (isDocumentType(media.type)) {
        return getDocumentMatchLink(media, match, query);
    }
    return withSearchParams(getMediaLink(media, query), { t: Math.max(0, Math.floor(match.start_time)) });
}
