import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The shared "swept underline + arrow medallion" link. Exported on its own
 * so media cards (Written / Qur'an / Audio footers) can use the same
 * treatment without SectionCta's top margin.
 */
export function CtaLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="group inline-flex min-h-11 items-center gap-2.5 rounded-xl bg-ed-fg px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-ed-bg shadow-md transition-all duration-200 hover:bg-ed-fg/90 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]"
        >
            <span>{label}</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
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
