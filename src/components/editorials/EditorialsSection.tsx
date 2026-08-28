import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import EditorialCard from '@/components/editorials/EditorialCard';
import type { EditorialSummary } from '@/lib/editorials';

interface EditorialsSectionProps {
    editorials: EditorialSummary[];
    /** How many rows to show before deferring to the full index. */
    limit?: number;
}

/**
 * The Archive Editorials block on the Written Archives page. It lists the most
 * recent editorials and hands off to /editorials for the rest.
 */
export default function EditorialsSection({ editorials, limit = 4 }: EditorialsSectionProps) {
    if (editorials.length === 0) {
        return null;
    }

    const visible = editorials.slice(0, limit);

    return (
        <section aria-label="Archive Editorials" className="mb-16">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-ed-rule pb-3">
                <div className="flex flex-1 items-center gap-4">
                    <h2
                        id="archive-editorials"
                        className="whitespace-nowrap text-[20px] font-semibold tracking-[-0.015em] text-ed-fg"
                        style={{ fontFamily: 'var(--font-source-serif-4), var(--font-source-serif), Georgia, serif' }}
                    >
                        Archive Editorials
                    </h2>
                    <div className="h-px flex-1 bg-ed-rule" />
                    <span className="whitespace-nowrap text-[12px] font-medium tabular-nums text-ed-fg-muted">
                        {editorials.length} {editorials.length === 1 ? 'piece' : 'pieces'}
                    </span>
                </div>

                <Link
                    href="/editorials"
                    aria-label="Read all editorials"
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ed-accent transition-colors hover:opacity-90"
                >
                    Read all editorials
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
            </div>

            <p
                className="mb-7 max-w-[70ch] text-[15px] leading-[1.62] text-ed-fg-muted"
                style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
            >
                Long-form readings of the preserved record: how the archive was assembled, what the sources say, and
                the historical context around them.
            </p>

            <ul className="list-none border-t border-ed-rule">
                {visible.map((editorial, index) => (
                    <li key={editorial.slug}>
                        <EditorialCard editorial={editorial} index={index + 1} />
                    </li>
                ))}
            </ul>

            {editorials.length > visible.length ? (
                <p className="mt-5 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">
                    {editorials.length - visible.length} more in the full index
                </p>
            ) : null}
        </section>
    );
}
