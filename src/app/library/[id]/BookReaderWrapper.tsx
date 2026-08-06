'use client';

import dynamic from 'next/dynamic';

const BookReaderClient = dynamic(() => import('@/components/written/BookReaderClient'), { ssr: false });

export interface BookReaderWrapperProps {
    pdfUrl: string;
    title: string;
    initialPage: number;
    initialQuery: string;
    prevId?: string | null;
    nextId?: string | null;
    backHref?: string;
}

export default function BookReaderWrapper(props: BookReaderWrapperProps) {
    return <BookReaderClient {...props} />;
}
