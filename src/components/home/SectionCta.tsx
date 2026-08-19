import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The shared link button for archive sections.
 */
export function CtaLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="group inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#2A2928] bg-[#161514] px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-[#F5F0EB] shadow-sm transition-all duration-200 hover:border-[#C8794A] hover:bg-[#1C1B1A] hover:text-[#F5F0EB] hover:scale-[1.02] active:scale-[0.98]"
        >
            <span>{label}</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#C8794A] transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
    );
}

export function SectionCta({ href, label }: { href: string; label: string }) {
    return (
        <div className="mt-8 sm:mt-10">
            <CtaLink href={href} label={label} />
        </div>
    );
}

