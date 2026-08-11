'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsletterViewer, { type IssueType } from './NewsletterViewer';
import PDFReaderClient from './PDFReaderWrapper';

type EditionAsset = { pdfUrl: string; startPage?: number };

// The server page resolves every possible asset URL at build time (fully static
// via generateStaticParams). The page/query/edition deep-link params are
// client-only concerns, so this wrapper reads them with useSearchParams (which
// requires the Suspense boundary below) and simply *selects* among the
// pre-resolved assets, rather than the server awaiting searchParams (which would
// force dynamic rendering).
export type ReaderData =
    | { kind: 'newsletter-viewer'; issue: IssueType }
    | { kind: 'pdf'; pdfUrl: string; title: string; documentId: string; prevId?: string | null; nextId?: string | null; backHref: string }
    | { kind: 'appendix'; editions: Record<string, EditionAsset>; defaultEdition: string; title: string; documentId: string; backHref: string };

const MAX_PAGE = 10000;

function ReaderWithParams(props: ReaderData) {
    const searchParams = useSearchParams();

    // `highlight` is the documented deep-link name; `q` is the form the search page
    // has always emitted. Both are accepted so existing links keep working.
    // Defensive truncation: URL params have practical length limits across
    // browsers, and 120 chars comfortably covers multi-word scholarly queries.
    const query = (searchParams.get('q') ?? searchParams.get('highlight') ?? '').slice(0, 120);

    if (props.kind === 'newsletter-viewer') {
        return <NewsletterViewer issue={props.issue} query={query} />;
    }

    const pageParam = searchParams.get('page');
    const requestedPage = pageParam ? parseInt(pageParam, 10) : NaN;
    const pageFromUrl = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, MAX_PAGE) : undefined;

    if (props.kind === 'appendix') {
        const editionParam = searchParams.get('edition');
        const edition = editionParam && props.editions[editionParam] ? editionParam : props.defaultEdition;
        const asset = props.editions[edition] ?? props.editions[props.defaultEdition];
        // An explicit ?page wins; otherwise fall back to the edition's start page.
        const initialPage = pageFromUrl ?? asset.startPage ?? 1;
        return (
            <PDFReaderClient
                pdfUrl={asset.pdfUrl}
                title={props.title}
                documentId={props.documentId}
                initialPage={initialPage}
                initialQuery={query}
                backHref={props.backHref}
            />
        );
    }

    return (
        <PDFReaderClient
            pdfUrl={props.pdfUrl}
            title={props.title}
            documentId={props.documentId}
            initialPage={pageFromUrl ?? 1}
            initialQuery={query}
            prevId={props.prevId}
            nextId={props.nextId}
            backHref={props.backHref}
        />
    );
}

export default function LibraryReaderWrapper(props: ReaderData) {
    return (
        <Suspense>
            <ReaderWithParams {...props} />
        </Suspense>
    );
}
