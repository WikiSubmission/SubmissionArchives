import { Metadata } from 'next';
import PDFReaderClient from './PDFReaderClient';

// Import data sources
import otherData from '../../../../public/data/other/search_index.json';
import appendicesData from '../../../../public/data/appendices/search_index.json';
import newsletterData from '../../../../public/data/newsletters/search_index.json';
import newsletterMetadata from '../../../../public/data/newsletters/metadata.json';

type Props = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Map URL slugs to filenames (or look up in JSON)
const getBookData = (id: string) => {
    // Check Other Resources
    const otherItem = otherData.find((item: any) => item.id === id);
    if (otherItem) return { ...otherItem, type: 'other', pdfLink: undefined };

    // Check Appendices
    const appendixItem = appendicesData.find((item: any) => item.id === id);
    if (appendixItem) return { ...appendixItem, type: 'appendix', pdfLink: undefined };

    // Check Newsletters
    const newsletterItem = newsletterData.find((item: any) => item.id === id);
    if (newsletterItem) {
        // Find corresponding metadata for PDF link
        const meta = newsletterMetadata.find((m: any) => m.id === id);
        return { ...newsletterItem, type: 'newsletter', pdfLink: meta?.pdfLink };
    }

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
            <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Resource Not Found</h1>
                    <p className="text-zinc-400">The requested resource "{id}" could not be located.</p>
                </div>
            </div>
        );
    }

    // Determine PDF URL based on type
    let pdfUrl = '';
    if (book.type === 'other') {
        pdfUrl = `/other/${book.filename}`;
    } else if (book.type === 'appendix') {
        // Transform "appendix-1" to "appendix_1.pdf"
        const filename = book.filename.replace('-', '_') + '.pdf';
        pdfUrl = `/appendices/${filename}`;
    } else if (book.type === 'newsletter') {
        // Use the link from metadata, or fallback to constructing it if missing (though metadata should have it)
        pdfUrl = book.pdfLink || `/data/newsletters/${book.filename}`;
    }

    return (
        <main className="h-screen w-screen bg-zinc-950 overflow-hidden flex flex-col">
            <PDFReaderClient
                pdfUrl={pdfUrl}
                title={book.title}
                initialPage={initialPage}
                initialQuery={initialQuery}
            />
        </main>
    );
}
