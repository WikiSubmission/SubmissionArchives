import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function SectionCta({ href, label }: { href: string; label: string }) {
    return (
        <div className="mt-8">
            <Link
                href={href}
                className="group inline-flex min-h-11 items-center gap-3 border-b border-ed-fg py-2 text-sm font-semibold text-ed-fg transition-colors hover:border-ed-accent hover:text-ed-accent"
            >
                {label}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            </Link>
        </div>
    );
}
