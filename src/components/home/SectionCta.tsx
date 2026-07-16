import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/**
 * The shared "swept underline + arrow medallion" link. Exported on its own
 * so media cards (Written / Qur'an / Audio footers) can use the same
 * treatment without SectionCta's top margin.
 */
export function CtaLink({ href, label }: { href: string; label: string }) {
    return (
        <Link href={href} className="group inline-flex min-h-11 items-center gap-3">
            <span className="link-sweep text-sm font-semibold text-ed-fg transition-colors group-hover:text-ed-accent">
                {label}
            </span>
            <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-full border border-ed-rule text-ed-fg transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-105 group-hover:border-ed-accent group-hover:bg-ed-accent group-hover:text-ed-bg"
            >
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
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
