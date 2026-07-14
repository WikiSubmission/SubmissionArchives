import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdjacentNewsletterIssues, getNewsletterIssue } from '@/lib/newsletterCatalog';
import { getAppendixItem } from '@/lib/appendixCatalog';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import type { ArchiveBookSummary } from '@/types/archive';
import NewsletterViewer from './NewsletterViewer';
import PDFReaderClient from './PDFReaderWrapper';

import booksData from '../../../../public/data/generated_indices/BOOKS_LIST.json';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Map URL slugs to filenames (or look up in JSON)
const getBookData = (id: string) => {
    // Check Other Resources
    const otherItem = (booksData as ArchiveBookSummary[]).find((item) => item.id === id);
    if (otherItem) return otherItem;

    // Check Appendices
    const appendixItem = getAppendixItem(id);
    if (appendixItem) return { ...appendixItem, type: 'appendix' as const };

    // Check Submitter Perspectives PDFs
    const newsletterItem = getNewsletterIssue(id);
    if (newsletterItem) return { ...newsletterItem, type: 'newsletter' as const };

    return null;
};

const getBookDescription = (book: NonNullable<ReturnType<typeof getBookData>>): string => {
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
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const book = getBookData(id);
    if (!book) return { title: 'Resource Not Found' };
    return {
        title: book.title,
        description: getBookDescription(book)
    };
}

export default async function PDFReaderPage({ params, searchParams }: Props) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const book = getBookData(id);
    const requestedPage = resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page as string, 10) : 1;
    const initialPage = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, 10000) : 1;
    const initialQuery = resolvedSearchParams?.q ? String(resolvedSearchParams.q).slice(0, 120) : '';

    if (!book) {
        notFound();
    }

    // Determine PDF URL based on type
    let pdfUrl = '';
    if (book.type === 'other') {
        pdfUrl = book.pdfLink;
    } else if (book.type === 'appendix') {
        pdfUrl = book.pdfLink || `/content/appendix/pdfs/${book.filename}`;
    } else if (book.type === 'newsletter') {
        pdfUrl = book.pdfLink || '';
    }

    // Calculate navigation for newsletters
    let prevId = null;
    let nextId = null;
    if (book.type === 'newsletter') {
        const adj = getAdjacentNewsletterIssues(id);
        prevId = adj.prevId;
        nextId = adj.nextId;
    }

    if (book.type === 'newsletter' && !book.pdfLink) {
        const newsletterIssue = book as unknown as { jsonData: Record<string, unknown> };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <NewsletterViewer issue={newsletterIssue.jsonData as any} query={initialQuery} />;
    }

    const backFilter = book.type === 'newsletter' ? 'perspective' : book.type;

    return (
        <main id="main-content" className="h-screen w-screen bg-ed-bg overflow-hidden flex flex-col">
            <PDFReaderClient
                pdfUrl={getPublicAssetUrl(pdfUrl)}
                title={book.title}
                initialPage={initialPage}
                initialQuery={initialQuery}
                prevId={prevId}
                nextId={nextId}
                backHref={`/search?filters=${backFilter}`}
            />
        </main>
    );
}
