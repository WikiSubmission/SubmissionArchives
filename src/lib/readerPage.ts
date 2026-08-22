import { notFound } from 'next/navigation';
import { getAdjacentNewsletterIssues, getNewsletterIssue, getNewsletterIssues, type NewsletterIssue } from '@/lib/newsletterCatalog';
import { getAppendixItem, getAppendixCatalog, type AppendixItem } from '@/lib/appendixCatalog';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import type { ArchiveBookSummary } from '@/types/archive';

import booksData from '../../public/data/generated_indices/BOOKS_LIST.json';

export type BookData =
    | (ArchiveBookSummary & { type: 'other' })
    | (AppendixItem & { type: 'appendix' })
    | (NewsletterIssue & { type: 'newsletter' });

export function getBookData(id: string): BookData | null {
    const otherItem = (booksData as ArchiveBookSummary[]).find((item) => item.id === id);
    if (otherItem) return otherItem;

    const appendixItem = getAppendixItem(id);
    if (appendixItem) return { ...appendixItem, type: 'appendix' };

    const newsletterItem = getNewsletterIssue(id);
    if (newsletterItem) return { ...newsletterItem, type: 'newsletter' };

    return null;
}

export function getBookDescription(book: BookData): string {
    if (book.type === 'newsletter') {
        const issueName = book.title.replace(book.date, '').trim() || book.title;
        return `Newsletter issue: ${issueName}, ${book.date}. Read the full issue in the Submission Archives.`;
    }
    if (book.type === 'appendix') {
        const appendixNumber = book.id.match(/^appendix-(\d+)$/)?.[1];
        const label = appendixNumber && book.title !== `Appendix ${appendixNumber}`
            ? `Appendix ${appendixNumber}: ${book.title}`
            : book.title;
        return `${label}. Read the full text in the Submission Archives.`;
    }
    return book.author
        ? `Book: ${book.title} by ${book.author}. Read the full text in the Submission Archives.`
        : `Book: ${book.title}. Read the full text in the Submission Archives.`;
}

// Enumerate every reader id (books, newsletters, appendices) so each page is
// prerendered statically. Unknown ids still render on demand (dynamicParams
// defaults to true when generateStaticParams is present).
export function generateReaderStaticParams() {
    const bookIds = (booksData as ArchiveBookSummary[]).map((book) => book.id);
    const newsletterIds = getNewsletterIssues().map((issue) => issue.id);
    const appendixIds = getAppendixCatalog().map((appendix) => appendix.id);
    return [...bookIds, ...newsletterIds, ...appendixIds].map((id) => ({ id }));
}

export interface ReaderPagePayload {
    book: BookData;
    backHref: string;
    pdfLink?: string;
    prevId?: string | null;
    nextId?: string | null;
    editions?: Record<string, { pdfUrl: string; startPage?: number }>;
    defaultEdition?: string;
    newsletterJsonData?: Record<string, unknown>;
}

// The server page resolves every possible asset URL at build time (fully static
// via generateStaticParams). Only `backHref` differs between the two reader
// routes that share this resolver, so it's the one thing callers parameterize.
export function resolveReaderPage(id: string, backHrefResolver: (book: BookData) => string): ReaderPagePayload {
    const book = getBookData(id);
    if (!book) notFound();

    const backHref = backHrefResolver(book);

    if (book.type === 'newsletter') {
        const adj = getAdjacentNewsletterIssues(id);
        const pdfLink = book.pdfLink ? getPublicAssetUrl(book.pdfLink) : undefined;
        return {
            book,
            backHref,
            pdfLink,
            prevId: adj.prevId,
            nextId: adj.nextId,
            newsletterJsonData: book.jsonData as Record<string, unknown> | undefined,
        };
    }

    if (book.type === 'appendix') {
        const editions: Record<string, { pdfUrl: string; startPage?: number }> = {};
        for (const [edition, asset] of Object.entries(book.editions)) {
            if (asset) editions[edition] = { pdfUrl: getPublicAssetUrl(asset.pdfLink), startPage: asset.startPage };
        }
        return { book, backHref, editions, defaultEdition: '1992' };
    }

    const pdfLink = book.type === 'other' ? book.pdfLink : '';
    return { book, backHref, pdfLink: getPublicAssetUrl(pdfLink) };
}
