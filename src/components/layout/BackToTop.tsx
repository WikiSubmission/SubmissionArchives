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
            className="group inline-flex items-center gap-2 rounded-[4px] border border-[#2A2928] bg-[#161514] px-3.5 py-2 text-xs font-medium text-[#9E9690] transition-all duration-200 hover:border-[#353433] hover:bg-[#1C1B1A] hover:text-[#F5F0EB] active:scale-[0.97]"
        >
            <span>Back to top</span>
            <ArrowUp className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5" />
        </button>
    );
}
