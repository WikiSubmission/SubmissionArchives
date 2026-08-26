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
        <div className="editorial-callout-plate editorial-breakout">
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
        <div className="editorial-verse-card editorial-breakout">
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
