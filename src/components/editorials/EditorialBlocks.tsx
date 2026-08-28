import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

export interface PullQuoteProps {
    children: ReactNode;
    attribution?: string;
}

/**
 * Minimalist provenance rule / pullquote plate.
 * Clean, typography-focused, without unnecessary symbols or quotes.
 */
export function PullQuote({ children, attribution }: PullQuoteProps) {
    return (
        <div className="editorial-callout-plate">
            <blockquote className="editorial-callout-quote">
                {children}
            </blockquote>
            {attribution ? (
                <div className="editorial-callout-attribution">
                    {attribution}
                </div>
            ) : null}
        </div>
    );
}

export interface LeadProps {
    children: ReactNode;
}

/**
 * The opening paragraph, set one step larger than the body. It renders a
 * wrapper rather than a <p>, because MDX already paragraphs the content it
 * contains and a nested <p> is invalid HTML.
 */
export function Lead({ children }: LeadProps) {
    return <div className="editorial-lead">{children}</div>;
}

export interface VerseProps {
    children: ReactNode;
    /** Surah number, e.g. 74. */
    chapter: number;
    /** Verse or verse range as displayed, e.g. "30" or "30-31". */
    verses: string;
}

/**
 * Minimalist scripture citation block.
 * Contains only the verse text and a clean reference link to Quran X:Y.
 */
export function Verse({ children, chapter, verses }: VerseProps) {
    return (
        <div className="editorial-verse-card">
            <div className="editorial-verse-body">
                {children}
            </div>
            <div className="editorial-verse-footer">
                <Link
                    className="editorial-verse-link"
                    href={`/scripture/quran/${chapter}`}
                >
                    Quran {chapter}:{verses}
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}

export interface RefProps {
    /** Matches the `id` of the corresponding <Note>. */
    id: string;
}

/** An inline footnote marker. Pure anchor navigation, no JavaScript. */
export function Ref({ id }: RefProps) {
    return (
        <a className="editorial-ref" href={`#note-${id}`} id={`ref-${id}`} aria-label={`Footnote ${id}`}>
            {id}
        </a>
    );
}

export interface NotesProps {
    children: ReactNode;
}

/** The footnote list, placed at the end of the editorial. */
export function Notes({ children }: NotesProps) {
    return (
        <section className="editorial-notes" aria-labelledby="editorial-notes-title">
            <h2 className="editorial-notes-title" id="editorial-notes-title">
                Notes &amp; Citations
            </h2>
            {children}
        </section>
    );
}

export interface NoteProps {
    id: string;
    children: ReactNode;
}

export function Note({ id, children }: NoteProps) {
    return (
        <div className="editorial-note" id={`note-${id}`}>
            <a className="editorial-note-index" href={`#ref-${id}`} aria-label={`Back to reference ${id}`}>
                {id}
            </a>
            <div className="editorial-note-content">{children}</div>
        </div>
    );
}

export interface NewsletterQuoteProps {
    children: ReactNode;
    /** e.g. "Muslim Perspective" or "Submitters Perspective" */
    publication?: 'Muslim Perspective' | 'Submitters Perspective' | string;
    /** Gregorian issue date, e.g. "December 1985" */
    date?: string;
    /** Hijri issue date as printed on the masthead, e.g. "Rabi' Al-Thani 1406" */
    hijriDate?: string;
    /** The headline the excerpt ran under, reproduced above the body */
    headline?: string;
    /** Page number, e.g. 2 */
    page?: number | string;
    /** Link to the newsletter reader, e.g. "sp-1985-12" */
    issueSlug?: string;
    /** Overrides the folio line, e.g. "Muslim Perspective, December 1985, p. 2" */
    attribution?: string;
}

/**
 * An excerpt reproduced from an issue of the Perspective newsletters, set to
 * resemble the page it was taken from: a running head carrying the masthead
 * and folio, the double rule that sits beneath a newsletter masthead, the
 * headline the passage ran under, and the passage itself in the reading face.
 */
export function NewsletterQuote({
    children,
    publication = 'Muslim Perspective',
    date,
    hijriDate,
    headline,
    page,
    issueSlug,
    attribution,
}: NewsletterQuoteProps) {
    const folio =
        attribution ||
        [date, page ? `p. ${page}` : null].filter(Boolean).join(' · ');

    const linkHref = issueSlug
        ? `/library/${issueSlug}${page ? `#page=${page}` : ''}`
        : '/written#newsletters';

    return (
        <figure className="editorial-newsletter">
            <div className="editorial-newsletter-masthead">
                <span className="editorial-newsletter-title">{publication}</span>
                {folio ? <span className="editorial-newsletter-folio">{folio}</span> : null}
            </div>

            {headline ? <p className="editorial-newsletter-headline">{headline}</p> : null}

            <blockquote className="editorial-newsletter-body">{children}</blockquote>

            <figcaption className="editorial-newsletter-footer">
                <span className="editorial-newsletter-hijri">{hijriDate ?? ''}</span>
                <Link className="editorial-newsletter-link" href={linkHref}>
                    <span>{issueSlug ? 'Read the issue' : 'Newsletter archive'}</span>
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </Link>
            </figcaption>
        </figure>
    );
}

export const MuslimPerspectiveQuote = NewsletterQuote;
export const SubmitterPerspectiveQuote = NewsletterQuote;
