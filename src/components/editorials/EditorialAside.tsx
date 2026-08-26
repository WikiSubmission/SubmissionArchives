import Link from 'next/link';
import { ArrowLeft, ArrowRight, Layers } from 'lucide-react';

import ReadingProgress from '@/components/editorials/ReadingProgress';
import type { Editorial, EditorialNeighbours } from '@/lib/editorials';
import { formatEditorialDate } from '@/lib/editorials';

interface EditorialAsideProps {
    editorial: Editorial;
    neighbours: EditorialNeighbours;
}

/**
 * The right rail: provenance for the piece in hand, reading progress, and the
 * neighbouring editorials. Formatted with uniform font styling matching the TOC.
 */
export default function EditorialAside({ editorial, neighbours }: EditorialAsideProps) {
    return (
        <div className="flex flex-col gap-6">
            {/* Reading Progress Indicator */}
            <ReadingProgress />

            {/* Archival Provenance Certificate Card */}
            <div className="rounded-[6px] border border-ed-rule bg-ed-surface p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-ed-rule pb-2.5">
                    <span className="font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">
                        Archival Provenance
                    </span>
                    <span className="rounded bg-ed-accent-soft px-1.5 py-0.5 font-sans text-[9px] font-semibold tracking-[0.06em] text-ed-accent">
                        AUDITED
                    </span>
                </div>

                <dl className="space-y-2.5 text-[11px]">
                    <MetaRow label="Published" value={formatEditorialDate(editorial.publishedAt)} />
                    {editorial.updatedAt ? <MetaRow label="Revised" value={formatEditorialDate(editorial.updatedAt)} /> : null}
                    <MetaRow label="Reading Time" value={`${editorial.readingMinutes} min (${editorial.wordCount.toLocaleString('en-US')} words)`} />
                    <MetaRow label="Lineage" value="Primary Source Extraction" />
                </dl>

                {editorial.topics.length > 0 ? (
                    <div className="mt-3.5 border-t border-ed-rule pt-2.5">
                        <dt className="mb-1.5 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">Research Topics</dt>
                        <div className="flex flex-wrap gap-1.5">
                            {editorial.topics.map((topic) => (
                                <span
                                    key={topic}
                                    className="rounded-[3px] border border-ed-rule bg-ed-surface-raised px-2 py-0.5 font-sans text-[10px] font-medium text-ed-fg-secondary"
                                >
                                    {topic}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Quick Links / Related Editorials */}
            {neighbours.previous || neighbours.next ? (
                <nav aria-label="Other editorials" className="rounded-[6px] border border-ed-rule bg-ed-surface p-4 shadow-sm">
                    <span className="mb-3 flex items-center gap-1.5 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">
                        <Layers className="h-3 w-3 text-ed-accent" />
                        Chronological Series
                    </span>
                    <div className="space-y-3">
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
                    </div>
                </nav>
            ) : null}
        </div>
    );
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">{label}</dt>
            <dd className="mt-0.5 font-medium text-ed-fg-secondary">{value}</dd>
        </div>
    );
}

function NeighbourLink({ direction, href, title }: { direction: 'previous' | 'next'; href: string; title: string }) {
    const Icon = direction === 'next' ? ArrowRight : ArrowLeft;

    return (
        <Link href={href} className="group block rounded-[4px] border border-transparent p-1.5 transition-all hover:border-ed-rule hover:bg-ed-surface-raised">
            <span className="flex items-center gap-1.5 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">
                {direction === 'previous' ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
                {direction === 'next' ? 'Newer Chapter' : 'Older Chapter'}
                {direction === 'next' ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
            </span>
            <span className="mt-1 block text-[12.5px] font-medium leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                {title}
            </span>
        </Link>
    );
}
