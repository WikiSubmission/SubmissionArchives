import type { Editorial } from '@/lib/editorials';
import { formatEditorialDate } from '@/lib/editorials';

interface EditorialHeaderProps {
    editorial: Editorial;
}

/**
 * The masthead of an editorial: serif title, standfirst,
 * monospace metadata bar, and an archival rule opening the prose.
 */
export default function EditorialHeader({ editorial }: EditorialHeaderProps) {
    return (
        <header className="editorial-breakout mb-8 text-center sm:mb-10">
            {/* Title */}
            <h1
                className="mx-auto max-w-[32ch] text-[clamp(24px,3.2vw,32px)] font-semibold leading-[1.25] tracking-[-0.02em] text-ed-fg sm:text-[32px]"
                style={{ fontFamily: 'var(--font-source-serif-4), var(--font-source-serif), Georgia, serif' }}
            >
                {editorial.title}
            </h1>

            {/* Subtitle / Standfirst */}
            {editorial.subtitle ? (
                <p
                    className="editorial-standfirst mx-auto mt-3 max-w-[42rem] text-[15.5px] leading-[1.65] text-ed-fg-secondary sm:text-[16.5px]"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                    {editorial.subtitle}
                </p>
            ) : null}

            {/* Clean Byline & Reading Time */}
            <div className="mx-auto mt-4 flex flex-wrap items-center justify-center gap-x-2 text-[13px] text-ed-fg-muted">
                <span className="font-medium text-ed-fg">{editorial.author}</span>
                <span className="text-ed-fg-faint" aria-hidden="true">·</span>
                <time dateTime={editorial.publishedAt}>{formatEditorialDate(editorial.publishedAt)}</time>
                <span className="text-ed-fg-faint" aria-hidden="true">·</span>
                <span>{editorial.readingMinutes} min read</span>
            </div>
        </header>
    );
}
