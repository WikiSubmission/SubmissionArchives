import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import ReadingProgress from '@/components/editorials/ReadingProgress';
import type { Editorial, EditorialNeighbours } from '@/lib/editorials';
import { formatEditorialDate } from '@/lib/editorials';

interface EditorialAsideProps {
    editorial: Editorial;
    neighbours: EditorialNeighbours;
}

/**
 * The right rail: provenance for the piece in hand, reading progress, and the
 * neighbouring editorials. It carries metadata rather than a second table of
 * contents, which the sidebar already provides.
 */
export default function EditorialAside({ editorial, neighbours }: EditorialAsideProps) {
    return (
        <div className="flex flex-col gap-8">
            <ReadingProgress />

            <dl className="space-y-3 border-t border-ed-rule pt-4 text-[11px]">
                <MetaRow label="Published" value={formatEditorialDate(editorial.publishedAt)} />
                {editorial.updatedAt ? <MetaRow label="Revised" value={formatEditorialDate(editorial.updatedAt)} /> : null}
                <MetaRow label="Reading time" value={`${editorial.readingMinutes} min`} />
                {editorial.topics.length > 0 ? <MetaRow label="Topics" value={editorial.topics.join(', ')} /> : null}
            </dl>

            {neighbours.previous || neighbours.next ? (
                <nav aria-label="Other editorials" className="space-y-3 border-t border-ed-rule pt-4">
                    {neighbours.next ? (
                        <NeighbourLink
                            direction="next"
                            href={`/editorials/${neighbours.next.slug}`}
                            title={neighbours.next.title}
                        />
                    ) : null}
                    {neighbours.previous ? (
                        <NeighbourLink
                            direction="previous"
                            href={`/editorials/${neighbours.previous.slug}`}
                            title={neighbours.previous.title}
                        />
                    ) : null}
                </nav>
            ) : null}
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">{label}</dt>
            <dd className="mt-0.5 text-ed-fg-secondary">{value}</dd>
        </div>
    );
}

function NeighbourLink({ direction, href, title }: { direction: 'previous' | 'next'; href: string; title: string }) {
    const Icon = direction === 'next' ? ArrowRight : ArrowLeft;

    return (
        <Link href={href} className="group block py-1.5">
            <span className="flex items-center gap-1.5 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">
                {direction === 'previous' ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
                {direction === 'next' ? 'Newer' : 'Older'}
                {direction === 'next' ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
            </span>
            <span className="mt-1 block text-[13px] leading-snug text-ed-fg-secondary transition-colors group-hover:text-ed-accent">
                {title}
            </span>
        </Link>
    );
}
