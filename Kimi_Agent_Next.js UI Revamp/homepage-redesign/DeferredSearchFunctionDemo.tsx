'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const SearchFunctionDemo = dynamic(() => import('./SearchFunctionDemo'), {
    ssr: false,
    loading: () => <SearchDemoPlaceholder />,
});

export function DeferredSearchFunctionDemo() {
    const hostRef = useRef<HTMLDivElement>(null);
    const [shouldLoad, setShouldLoad] = useState(false);

    useEffect(() => {
        const host = hostRef.current;
        if (!host || shouldLoad) return;

        if (!('IntersectionObserver' in window)) {
            queueMicrotask(() => setShouldLoad(true));
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setShouldLoad(true);
                observer.disconnect();
            },
            { rootMargin: '600px 0px', threshold: 0.01 },
        );

        observer.observe(host);
        return () => observer.disconnect();
    }, [shouldLoad]);

    return (
        <div ref={hostRef} className="min-h-[34rem] w-full">
            {shouldLoad ? <SearchFunctionDemo /> : <SearchDemoPlaceholder />}
        </div>
    );
}

function SearchDemoPlaceholder() {
    return (
        <div
            className="min-h-[34rem] w-full rounded-[var(--ed-radius-lg)] border border-ed-rule bg-ed-surface shadow-[var(--ed-shadow-sm)] motion-safe:animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
        />
    );
}
