import type { Editorial } from '@/lib/editorials';

interface EditorialHeaderProps {
    editorial: Editorial;
}

/**
 * Editorial Masthead matching Making Software:
 * - Monospace meta kicker: WORD COUNT | AUTHOR / READING TIME in Departure Mono
 * - Title: New York serif, 28px mobile to 36px desktop, weight 500, tight tracking
 * - Subtitle / Standfirst: New York serif at body size, leading 1.43
 * - Minimal centered dashes ornament
 */
export default function EditorialHeader({ editorial }: EditorialHeaderProps) {
    return (
        <header className="mb-12 text-center sm:mb-16">
            {/* Top Monospace Metadata Kicker: e.g. 3600 WORDS | SUBMISSION ARCHIVES */}
            <div
                className="mb-6 inline-flex items-center justify-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-ed-fg-muted"
                style={{ fontFamily: 'var(--font-editorial-mono, var(--font-departure-mono, monospace))' }}
            >
                <span>{editorial.wordCount.toLocaleString('en-US')} WORDS</span>
                <span className="text-ed-fg-faint" aria-hidden="true">|</span>
                <span>{editorial.readingMinutes} MIN READ</span>
                <span className="text-ed-fg-faint" aria-hidden="true">|</span>
                <span className="text-ed-fg">{editorial.author.toUpperCase()}</span>
            </div>

            {/* Title: New York, 28px mobile to 36px desktop, weight 500, leading 1.11, tracking -0.025em */}
            <h1
                className="mx-auto max-w-[26ch] text-[clamp(1.75rem,1.4rem+1.5vw,2.25rem)] font-medium leading-[1.11] tracking-[-0.025em] text-ed-fg"
                style={{ fontFamily: 'var(--font-editorial-serif, var(--font-new-york, Georgia, serif))' }}
            >
                {editorial.title}
            </h1>

            {/* Subtitle / Standfirst: New York at body size, leading 1.43 */}
            {editorial.subtitle ? (
                <p
                    className="editorial-standfirst mx-auto mt-3 max-w-[34rem] font-normal leading-[1.43] text-ed-fg-secondary"
                    style={{ fontFamily: 'var(--font-editorial-serif, var(--font-new-york, Georgia, serif))' }}
                >
                    {editorial.subtitle}
                </p>
            ) : null}

            {/* Centered technical dashes ornament matching Making Software */}
            <div
                aria-hidden="true"
                className="mx-auto mt-8 select-none font-mono text-[12px] tracking-[0.2em] text-ed-fg-faint"
                style={{ fontFamily: 'var(--font-editorial-mono, var(--font-departure-mono, monospace))' }}
            >
                ------
            </div>
        </header>
    );
}
