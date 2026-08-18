import { Metadata } from 'next';
import { getBookData, getBookDescription, generateReaderStaticParams, resolveReaderPage } from '@/lib/readerPage';
import LibraryReaderWrapper from '../LibraryReaderWrapper';
import type { IssueType } from '../NewsletterViewer';

type Props = {
    params: Promise<{ id: string }>;
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

export async function generateStaticParams() {
    return generateReaderStaticParams();
}

export default async function PDFReaderPage({ params }: Props) {
    const { id } = await params;
    const payload = resolveReaderPage(id, () => `/library/${id}`);
    const { book, backHref } = payload;

    if (book.type === 'newsletter' && payload.pdfLink) {
        return (
            <main id="main-content" className="h-[calc(100dvh-4rem)] w-screen bg-[#0F0E0D] overflow-hidden flex flex-col">
                <LibraryReaderWrapper
                    kind="pdf"
                    documentId={id}
                    pdfUrl={payload.pdfLink}
                    title={book.title}
                    prevId={payload.prevId}
                    nextId={payload.nextId}
                    backHref={backHref}
                />
            </main>
        );
    }

    if (book.type === 'newsletter' && payload.newsletterJsonData) {
        return (
            <LibraryReaderWrapper
                kind="newsletter-viewer"
                issue={payload.newsletterJsonData as unknown as IssueType}
                pdfUrl={payload.pdfLink}
                documentId={id}
                title={book.title}
                prevId={payload.prevId}
                nextId={payload.nextId}
                backHref={backHref}
            />
        );
    }

    if (book.type === 'appendix' && payload.editions && payload.defaultEdition) {
        return (
            <main id="main-content" className="h-[calc(100dvh-4rem)] w-screen bg-[#0F0E0D] overflow-hidden flex flex-col">
                <LibraryReaderWrapper kind="appendix" documentId={id} editions={payload.editions} defaultEdition={payload.defaultEdition} title={book.title} backHref={backHref} />
            </main>
        );
    }

    return (
        <main id="main-content" className="h-[calc(100dvh-4.5rem)] w-screen bg-[#0F0E0D] overflow-hidden flex flex-col">
            <LibraryReaderWrapper
                kind="pdf"
                documentId={id}
                pdfUrl={payload.pdfLink ?? ''}
                title={book.title}
                prevId={payload.prevId}
                nextId={payload.nextId}
                backHref={backHref}
            />
        </main>
    );
}
