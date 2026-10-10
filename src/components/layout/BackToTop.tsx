'use client';

import { ArrowUp } from 'lucide-react';

export function BackToTop() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top of page"
            className="inline-flex min-h-9 items-center gap-2 border border-ed-rule px-3 text-[11px] text-ed-fg-muted transition-colors hover:border-ed-rule-strong hover:text-ed-fg"
        >
            <span>Back to top</span>
            <ArrowUp className="h-3 w-3" aria-hidden />
        </button>
    );
}
