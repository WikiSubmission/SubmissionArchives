import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The shared "swept underline + arrow medallion" link. Exported on its own
 * so media cards (Written / Qur'an / Audio footers) can use the same
 * treatment without SectionCta's top margin.
 */
export function CtaLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} className="group inline-flex min-h-10 items-center gap-2.5 rounded-full border border-ed-rule bg-ed-surface/60 px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider text-ed-fg backdrop-blur-md transition-all duration-200 hover:border-ed-fg hover:bg-ed-fg hover:text-ed-bg shadow-sm active:scale-95">
            <span>{label}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
    );
}

export function SectionCta({ href, label }: { href: string; label: string }) {
    return (
        <div className="mt-8">
            <CtaLink href={href} label={label} />
        </div>
    );
}
