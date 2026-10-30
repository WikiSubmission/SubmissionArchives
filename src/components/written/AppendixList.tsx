import Link from 'next/link';
import type { AppendixItem } from '@/lib/appendixCatalog';

// Catalog titles lead with their number ("1. One of the Great Miracles"), which gets its own
// column here. The two pieces of front matter have no number and go by their name.
function getLabel(appendix: AppendixItem) {
    const number = appendix.id.match(/^appendix-(\d+)$/)?.[1];
    return number
        ? { number, title: appendix.title.replace(/^\d+\.\s*/, '') }
        : { number: '', title: appendix.id.charAt(0).toUpperCase() + appendix.id.slice(1) };
}

export default function AppendixList({ appendices }: { appendices: AppendixItem[] }) {
    return (
        <ol className="columns-1 gap-x-10 sm:columns-2 lg:columns-3">
            {appendices.map((appendix) => {
                const { number, title } = getLabel(appendix);
                return (
                    <li key={appendix.id} className="break-inside-avoid">
                        <Link href={`/library/${appendix.id}`} className="group flex items-baseline gap-3 border-b border-ed-rule py-2.5">
                            <span className="w-5 shrink-0 text-right font-mono text-[11px] tabular-nums text-ed-fg-muted">{number}</span>
                            <span
                                className="text-[15px] leading-snug text-ed-fg-secondary transition-colors group-hover:text-ed-accent"
                                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                            >
                                {title}
                            </span>
                        </Link>
                    </li>
                );
            })}
        </ol>
    );
}
