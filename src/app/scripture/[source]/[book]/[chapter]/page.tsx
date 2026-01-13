'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RedirectToCompare() {
    const params = useParams();
    const router = useRouter();

    useEffect(() => {
        const source = params.source as string;
        const book = decodeURIComponent(params.book as string);
        const chapter = params.chapter as string;

        router.replace(`/scripture/compare?refs=${source}.${book.replace(/ /g, '_')}.${chapter}`);
    }, [params, router]);

    return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center text-gray-500">
            Loading Reader...
        </div>
    );
}
