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
        <header className="editorial-breakout mb-10 text-center sm:mb-12">
            {/* Title */}
            <h1
                className="mx-auto max-w-[24ch] text-[clamp(30px,3.8vw,46px)] font-semibold leading-[1.12] tracking-[-0.025em] text-ed-fg"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
            >
                {editorial.title}
            </h1>

            {/* Subtitle / Standfirst */}
            {editorial.subtitle ? (
                <p
                    className="editorial-standfirst mx-auto mt-4 text-[17px] leading-[1.6] text-ed-fg-secondary sm:text-[18px]"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                    {editorial.subtitle}
                </p>
            ) : null}

            {/* Monospace Technical Metadata Line */}
            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 font-mono text-[11px] text-ed-fg-muted">
                <span>
                    <strong className="font-semibold text-ed-fg">AUTHOR:</strong> {editorial.author}
                </span>
                <span className="text-ed-rule-strong" aria-hidden="true">•</span>
                <span>
                    <strong className="font-semibold text-ed-fg">DATE:</strong>{' '}
                    <time dateTime={editorial.publishedAt}>{formatEditorialDate(editorial.publishedAt)}</time>
                </span>
                <span className="text-ed-rule-strong" aria-hidden="true">•</span>
                <span>
                    <strong className="font-semibold text-ed-fg">LENGTH:</strong> {editorial.wordCount.toLocaleString('en-US')} words ({editorial.readingMinutes} min)
                </span>
            </div>

            {/* Archival Rule Divider */}
            <div className="mx-auto mt-7 flex items-center justify-center gap-2">
                <div className="h-px w-10 bg-ed-rule-strong" />
                <div className="h-1.5 w-1.5 rotate-45 border border-ed-accent bg-ed-accent" />
                <div className="h-px w-10 bg-ed-rule-strong" />
            </div>
        </header>
    );
}
