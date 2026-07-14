'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type PDFReaderClientType from './PDFReaderClient';

// react-pdf's Document/Page render against browser-only APIs (canvas, DOM) and
// aren't SSR-safe. `ssr: false` for next/dynamic is only valid inside a Client
// Component, so this thin wrapper exists purely to host that option — importing
// it here still keeps react-pdf out of the shared bundle for routes that don't
// render the PDF reader, without Next attempting (and failing) to prerender it.
const PDFReaderClient = dynamic(() => import('./PDFReaderClient'), { ssr: false });

export default function PDFReaderWrapper(props: ComponentProps<typeof PDFReaderClientType>) {
    return <PDFReaderClient {...props} />;
}
