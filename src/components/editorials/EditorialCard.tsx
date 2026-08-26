import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

import type { EditorialSummary } from '@/lib/editorials';
import { formatEditorialDate } from '@/lib/editorials';

interface EditorialCardProps {
    editorial: EditorialSummary;
    /** Position in the listing, shown as an editorial index rather than a badge. */
    index: number;
    /** Matches the card's title to the surrounding document outline. */
    headingLevel?: 2 | 3;
}

/**
 * A divided editorial row: a framed plate, then title, standfirst and one line
 * of provenance. Deliberately not an equal glowing card. The archive lists
 * records, it does not merchandise them.
 */
export default function EditorialCard({ editorial, index, headingLevel = 3 }: EditorialCardProps) {
    const indexLabel = index.toString().padStart(2, '0');
    const Heading = headingLevel === 2 ? 'h2' : 'h3';

    return (
        <Link
            href={`/editorials/${editorial.slug}`}
            className="group grid gap-x-7 gap-y-4 border-b border-ed-rule px-2 py-7 transition-colors hover:bg-ed-surface sm:grid-cols-[13rem_1fr]"
        >
            <EditorialPlate editorial={editorial} indexLabel={indexLabel} />

            <div className="flex min-w-0 flex-col">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        className="text-[22px] font-semibold leading-[1.2] tracking-[-0.015em] text-ed-fg transition-colors group-hover:text-ed-accent"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                    >
                        {editorial.title}
                    </Heading>
                    <ArrowUpRight
                        className="mt-1 h-4 w-4 flex-shrink-0 text-ed-fg-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ed-accent"
                        aria-hidden="true"
                    />
                </div>

                {editorial.subtitle ? (
                    <p
                        className="mt-2.5 max-w-[68ch] text-[15px] leading-[1.6] text-ed-fg-muted"
                        style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                    >
                        {editorial.subtitle}
                    </p>
                ) : null}

                {/* One provenance line rather than a right-hand column, which
                    clipped its own text at narrower widths. */}
                <p className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 font-sans font-medium text-[10px] uppercase tracking-[0.12em] text-ed-fg-faint">
                    <time dateTime={editorial.publishedAt}>{formatEditorialDate(editorial.publishedAt)}</time>
                    <Separator />
                    <span>{editorial.author}</span>
                    <Separator />
                    <span>{editorial.readingMinutes} min read</span>
                    {editorial.topics.length > 0 ? (
                        <>
                            <Separator />
                            <span className="text-ed-fg-muted">{editorial.topics.join(', ')}</span>
                        </>
                    ) : null}
                </p>
            </div>
        </Link>
    );
}

function Separator() {
    return (
        <span className="text-ed-rule-strong" aria-hidden="true">
            /
        </span>
    );
}

interface EditorialPlateProps {
    editorial: EditorialSummary;
    indexLabel: string;
}

/**
 * The plate carries the editorial's hero image where one exists. Without an
 * image it falls back to a typographic plate rather than a gap, so a listing of
 * mixed pieces still reads as one column.
 */
function EditorialPlate({ editorial, indexLabel }: EditorialPlateProps) {
    return (
        <div className="relative aspect-[4/3] w-full max-w-[13rem] overflow-hidden rounded-[4px] border border-ed-rule bg-ed-surface transition-colors group-hover:border-ed-rule-strong">
            {editorial.hero ? (
                <Image
                    src={editorial.hero.src}
                    alt={editorial.hero.alt}
                    fill
                    quality={70}
                    unoptimized={editorial.hero.src.endsWith('.svg')}
                    sizes="(max-width: 640px) 100vw, 208px"
                    className="object-cover"
                />
            ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1">
                    <span
                        className="text-[30px] leading-none text-ed-fg-faint transition-colors group-hover:text-ed-accent"
                        style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
                    >
                        {indexLabel}
                    </span>
                    <span className="font-sans font-medium text-[9px] uppercase tracking-[0.16em] text-ed-fg-faint">Editorial</span>
                </div>
            )}
        </div>
    );
}
