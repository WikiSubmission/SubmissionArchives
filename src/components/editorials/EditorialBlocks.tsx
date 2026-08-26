import Link from 'next/link';
import type { ReactNode } from 'react';

export interface PullQuoteProps {
    children: ReactNode;
    attribution?: string;
}

/** A sentence lifted out of the flow. Not a decoration: use it for the claim
 *  the section turns on. */
export function PullQuote({ children, attribution }: PullQuoteProps) {
    return (
        <blockquote className="editorial-pullquote editorial-breakout">
            {children}
            {attribution ? <cite className="editorial-pullquote-attribution">{attribution}</cite> : null}
        </blockquote>
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
 * A Quranic citation that links back into the scripture reader, so a reader can
 * verify the quotation in context rather than taking the editorial's word.
 */
export function Verse({ children, chapter, verses }: VerseProps) {
    return (
        <div className="editorial-verse">
            <div className="editorial-verse-text">{children}</div>
            <Link className="editorial-verse-reference" href={`/scripture/quran/${chapter}`}>
                Quran {chapter}:{verses}
            </Link>
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
                Notes
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
            <div>{children}</div>
        </div>
    );
}
