import { Metadata } from 'next';
import PDFReaderClient from './PDFReaderClient';
import { getAdjacentNewsletterIssues, getNewsletterIssue } from '@/lib/newsletterCatalog';
import { getAppendixItem } from '@/lib/appendixCatalog';

// Import data sources
import otherData from '../../../../public/data/other/search_index.json';

type IndexedBook = {
    id: string;
    title: string;
    filename: string;
    type?: 'other' | 'appendix' | 'newsletter';
    pdfLink?: string;
};

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Map URL slugs to filenames (or look up in JSON)
const getBookData = (id: string) => {
    // Check Other Resources
    const otherItem = (otherData as IndexedBook[]).find((item) => item.id === id);
    if (otherItem) return { ...otherItem, type: 'other', pdfLink: undefined };

    // Check Appendices
    const appendixItem = getAppendixItem(id);
    if (appendixItem) return { ...appendixItem, type: 'appendix' };

    // Check Submitter Perspectives PDFs
    const newsletterItem = getNewsletterIssue(id);
    if (newsletterItem) return { ...newsletterItem, type: 'newsletter' };

    return null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const book = getBookData(id);
    if (!book) return { title: 'Resource Not Found' };
    return {
        title: `${book.title} | Submission Archives`,
        description: `Read ${book.title}`
    };
}

export default async function PDFReaderPage({ params, searchParams }: Props) {
    const { id } = await params;
    const resolvedSearchParams = await searchParams;
    const book = getBookData(id);
    const initialPage = resolvedSearchParams?.page ? parseInt(resolvedSearchParams.page as string) : 1;
    const initialQuery = resolvedSearchParams?.q ? (resolvedSearchParams.q as string) : '';

    if (!book) {
        return (
            <div className="min-h-screen bg-ed-bg text-ed-fg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Resource Not Found</h1>
                    <p className="text-ed-fg-muted">The requested resource &quot;{id}&quot; could not be located.</p>
                </div>
            </div>
        );
    }

    // Determine PDF URL based on type
    let pdfUrl = '';
    if (book.type === 'other') {
        pdfUrl = `/content/books/${book.filename}`;
    } else if (book.type === 'appendix') {
        pdfUrl = book.pdfLink || `/content/appendix/pdfs/${book.filename}`;
    } else if (book.type === 'newsletter') {
        pdfUrl = book.pdfLink || `/content/newsletter/pdfs/${book.filename}`;
    }

    // Calculate navigation for newsletters
    let prevId = null;
    let nextId = null;
    if (book.type === 'newsletter') {
        const adj = getAdjacentNewsletterIssues(id);
        prevId = adj.prevId;
        nextId = adj.nextId;
    }

    return (
        <main className="h-screen w-screen bg-ed-bg overflow-hidden flex flex-col">
            <PDFReaderClient
                pdfUrl={pdfUrl}
                title={book.title}
                initialPage={initialPage}
                initialQuery={initialQuery}
                prevId={prevId}
                nextId={nextId}
            />
        </main>
    );
}
