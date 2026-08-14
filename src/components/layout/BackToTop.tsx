'use client';

import { ArrowUp } from 'lucide-react';

export function BackToTop() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <button
            type="button"
            onClick={scrollToTop}
            aria-label="Back to top of page"
            className="group inline-flex items-center gap-2 rounded-xl border border-ed-rule bg-ed-surface/70 px-3.5 py-2 text-xs font-medium text-ed-fg-muted backdrop-blur-md transition-all duration-200 hover:border-ed-rule-strong hover:bg-ed-surface hover:text-ed-fg active:scale-[0.97]"
        >
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </button>
    );
}
