import { SITE_URL } from '@/config/site';
export type CitationStyle = 'permalink' | 'apa' | 'mla' | 'chicago';
export interface Bibliography {
    title: string; authors?: string[]; year?: number; edition?: string;
    publisher?: string; url: string; printedPage?: string;
}
export function formatCitation(work: Bibliography, style: CitationStyle, scanPage?: number) {
    const url = new URL(work.url, SITE_URL);
    if (scanPage) url.searchParams.set('page', String(scanPage));
    if (style === 'permalink') return url.href;
    const author = work.authors?.map(name => {
        const clean = name.replace(/^(Dr\.?|Prof\.?)\s+/i, '').trim();
        const parts = clean.split(/\s+/);
        if (parts.length < 2 || clean.includes(',')) return clean;
        const family = parts.pop();
        return `${family}, ${style === 'apa' ? parts.map(part => part[0] + '.').join(' ') : parts.join(' ')}`;
    }).join(style === 'apa' ? ' & ' : '; ');
    const date = work.year ? String(work.year) : 'n.d.';
    const title = work.title + (work.edition ? ` (${work.edition} edition)` : '');
    const page = work.printedPage ? `p. ${work.printedPage}` : scanPage ? `PDF page ${scanPage}` : '';
    const source = [work.publisher, page, url.href].filter(Boolean).join('. ');
    if (style === 'apa') return `${author ? author.replace(/\.$/, '') + '. ' : ''}(${date}). ${title}. ${source}`;
    if (style === 'mla') return `${author ? author.replace(/\.$/, '') + '. ' : ''}${title}. ${work.publisher ? work.publisher + ', ' : ''}${date}${page ? ', ' + page : ''}. ${url.href}`;
    return `${author ? author.replace(/\.$/, '') + '. ' : ''}${title}. ${work.publisher ? work.publisher + ', ' : ''}${date}. ${page ? page + '. ' : ''}${url.href}`;
}
