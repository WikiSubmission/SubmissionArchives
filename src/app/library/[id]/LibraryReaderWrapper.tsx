'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import NewsletterViewer from './NewsletterViewer';
import PDFReaderClient from './PDFReaderWrapper';

type EditionAsset = { pdfUrl: string; startPage?: number };

// The server page resolves every possible asset URL at build time (fully static
// via generateStaticParams). The page/query/edition deep-link params are
// client-only concerns, so this wrapper reads them with useSearchParams (which
// requires the Suspense boundary below) and simply *selects* among the
// pre-resolved assets, rather than the server awaiting searchParams (which would
// force dynamic rendering).
export type ReaderData =
    | { kind: 'newsletter-viewer'; issue: Record<string, unknown> }
    | { kind: 'pdf'; pdfUrl: string; title: string; prevId?: string | null; nextId?: string | null; backHref: string }
    | { kind: 'appendix'; editions: Record<string, EditionAsset>; defaultEdition: string; title: string; backHref: string };

const MAX_PAGE = 10000;

function ReaderWithParams(props: ReaderData) {
    const searchParams = useSearchParams();

    const query = (searchParams.get('q') ?? '').slice(0, 120);

    if (props.kind === 'newsletter-viewer') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return <NewsletterViewer issue={props.issue as any} query={query} />;
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
