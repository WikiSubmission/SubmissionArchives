import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAdjacentNewsletterIssues, getNewsletterIssue, getNewsletterIssues } from '@/lib/newsletterCatalog';
import { getAppendixItem, getAppendixCatalog } from '@/lib/appendixCatalog';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import type { ArchiveBookSummary } from '@/types/archive';
import LibraryReaderWrapper from './LibraryReaderWrapper';

import booksData from '../../../../public/data/generated_indices/BOOKS_LIST.json';

type Props = {
    params: Promise<{ id: string }>;
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

// Enumerate every reader id (books, newsletters, appendices) so each page is
// prerendered statically. Unknown ids still render on demand (dynamicParams
// defaults to true when generateStaticParams is present).
export async function generateStaticParams() {
    const bookIds = (booksData as ArchiveBookSummary[]).map((book) => book.id);
    const newsletterIds = getNewsletterIssues().map((issue) => issue.id);
    const appendixIds = getAppendixCatalog().map((appendix) => appendix.id);
    return [...bookIds, ...newsletterIds, ...appendixIds].map((id) => ({ id }));
}

export default async function PDFReaderPage({ params }: Props) {
    const { id } = await params;
    const book = getBookData(id);

    if (!book) {
        notFound();
    }

    // Structured newsletter viewer (no PDF asset). The `q` highlight param is read
    // client-side inside the wrapper.
    if (book.type === 'newsletter' && !book.pdfLink) {
        const newsletterIssue = book as unknown as { jsonData: Record<string, unknown> };
        return <LibraryReaderWrapper kind="newsletter-viewer" issue={newsletterIssue.jsonData} />;
    }

    const backHref = `/search?filters=${book.type === 'newsletter' ? 'perspective' : book.type}`;

    if (book.type === 'appendix') {
        // Pre-resolve every edition's asset so the wrapper can switch editions
        // client-side without a round trip to the server.
        const editions: Record<string, { pdfUrl: string; startPage?: number }> = {};
        for (const [edition, asset] of Object.entries(book.editions)) {
            if (asset) editions[edition] = { pdfUrl: getPublicAssetUrl(asset.pdfLink), startPage: asset.startPage };
        }
        return (
            <main id="main-content" className="h-screen w-screen bg-ed-bg overflow-hidden flex flex-col">
                <LibraryReaderWrapper kind="appendix" editions={editions} defaultEdition="1992" title={book.title} backHref={backHref} />
            </main>
        );
    }

    let pdfLink = '';
    let prevId: string | null = null;
    let nextId: string | null = null;
    if (book.type === 'other') {
        pdfLink = book.pdfLink;
    } else if (book.type === 'newsletter') {
        pdfLink = book.pdfLink || '';
        const adj = getAdjacentNewsletterIssues(id);
        prevId = adj.prevId;
        nextId = adj.nextId;
    }

    return (
        <main id="main-content" className="h-screen w-screen bg-ed-bg overflow-hidden flex flex-col">
            <LibraryReaderWrapper
                kind="pdf"
                pdfUrl={getPublicAssetUrl(pdfLink)}
                title={book.title}
                prevId={prevId}
                nextId={nextId}
                backHref={backHref}
            />
        </main>
    );
}
