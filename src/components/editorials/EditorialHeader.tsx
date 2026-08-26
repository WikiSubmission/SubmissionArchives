import type { Editorial } from '@/lib/editorials';
import { formatEditorialDate } from '@/lib/editorials';

interface EditorialHeaderProps {
    editorial: Editorial;
}

/**
 * The masthead of an editorial: a mono metadata line, the serif title and
 * standfirst, then a short rule opening the prose.
 */
export default function EditorialHeader({ editorial }: EditorialHeaderProps) {
    return (
        <header className="editorial-breakout mb-10 text-center">
            <p className="font-sans font-medium text-[10px] uppercase tracking-[0.14em] text-ed-fg-faint">
                {editorial.wordCount.toLocaleString('en-US')} words
                <span className="mx-2 text-ed-rule-strong">|</span>
                {editorial.author}
                <span className="mx-2 text-ed-rule-strong">|</span>
                <time dateTime={editorial.publishedAt}>{formatEditorialDate(editorial.publishedAt)}</time>
            </p>

            <h1
                className="mx-auto mt-5 max-w-[22ch] text-[clamp(30px,3.6vw,42px)] font-normal leading-[1.1] tracking-[-0.025em] text-ed-fg"
                style={{ fontFamily: 'var(--font-source-serif), Georgia, serif' }}
            >
                {editorial.title}
            </h1>

            {editorial.subtitle ? (
                <p
                    className="editorial-standfirst mx-auto mt-4 text-[17px] leading-[1.55] text-ed-fg-muted"
                    style={{ fontFamily: 'var(--font-newsreader), Georgia, serif' }}
                >
                    {editorial.subtitle}
                </p>
            ) : null}

            <div className="mx-auto mt-8 h-px w-10 bg-ed-rule-strong" />
        </header>
    );
}
