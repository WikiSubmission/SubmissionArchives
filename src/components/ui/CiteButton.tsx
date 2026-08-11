'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Quote } from 'lucide-react';

type CiteStyle = 'permalink' | 'apa' | 'mla' | 'chicago';

export type CiteSource = {
    title: string;
    author?: string;
    /** Year only. Left undefined when the record carries no reliable date. */
    year?: string;
    /** e.g. "p. 42" or "5:42" — the precise locator, when there is one. */
    locator?: string;
};

const STYLE_LABELS: Array<{ id: CiteStyle; label: string }> = [
    { id: 'permalink', label: 'Link' },
    { id: 'apa', label: 'APA' },
    { id: 'mla', label: 'MLA' },
    { id: 'chicago', label: 'Chicago' },
];

const SITE_NAME = 'Submission Archives';

// "n.d." is the standard scholarly marker for an undated source. Inventing a year would be
// worse than admitting the archive does not have one.
function yearOf(source: CiteSource) {
    return source.year || 'n.d.';
}

function withLocator(base: string, locator?: string) {
    return locator ? `${base} (${locator})` : base;
}

function formatCitation(style: CiteStyle, source: CiteSource, url: string): string {
    const author = source.author?.trim();
    const year = yearOf(source);

    switch (style) {
        case 'apa':
            return withLocator(
                `${author ? `${author} ` : ''}(${year}). ${source.title}. ${SITE_NAME}. ${url}`,
                source.locator,
            );
        case 'mla':
            return withLocator(
                `${author ? `${author}. ` : ''}"${source.title}." ${SITE_NAME}, ${year}, ${url}.`,
                source.locator,
            );
        case 'chicago':
            return withLocator(
                `${author ? `${author}. ` : ''}"${source.title}." ${SITE_NAME}, ${year}. ${url}.`,
                source.locator,
            );
        default:
            return url;
    }
}

export default function CiteButton({ source }: { source: CiteSource }) {
    const [open, setOpen] = useState(false);
    const [style, setStyle] = useState<CiteStyle>('permalink');
    const [copied, setCopied] = useState(false);
    // Resolved on the client so the citation carries the reader's exact position —
    // the ?t= or ?page= the player and reader keep in the address bar.
    const [url, setUrl] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        // Deferred a task: reading location is the external-system part, applying it to
        // state belongs off the effect body.
        const timer = setTimeout(() => setUrl(window.location.href), 0);

        const onPointerDown = (event: PointerEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false);
        };

        document.addEventListener('pointerdown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('pointerdown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open, setUrl, setOpen]);

    const citation = url ? formatCitation(style, source, url) : '';

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(citation);
        } catch {
            return;
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-haspopup="dialog"
                className="soft-pill flex min-h-11 items-center gap-2 px-4 py-2 text-xs font-bold font-ui uppercase tracking-widest transition-colors hover:text-ed-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent"
            >
                <Quote className="h-4 w-4" aria-hidden="true" />
                Cite
            </button>

            {open ? (
                <div
                    role="dialog"
                    aria-label="Copy a citation"
                    className="absolute right-0 z-30 mt-2 w-[min(92vw,26rem)] rounded-2xl border border-ed-rule bg-ed-surface p-3 shadow-lg"
                >
                    <div className="mb-2 flex flex-wrap gap-1">
                        {STYLE_LABELS.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                onClick={() => setStyle(entry.id)}
                                aria-pressed={style === entry.id}
                                className={`rounded-full border px-3 py-1 font-mono text-[0.68rem] transition-colors ${
                                    style === entry.id
                                        ? 'border-ed-accent/50 bg-ed-accent/15 text-ed-accent'
                                        : 'border-ed-rule text-ed-fg-muted hover:text-ed-fg'
                                }`}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>

                    <p className="max-h-32 overflow-y-auto break-words rounded-xl bg-ed-bg/60 p-2.5 text-xs leading-relaxed text-ed-fg">
                        {citation}
                    </p>

                    <button
                        type="button"
                        onClick={copy}
                        className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-ed-rule bg-ed-surface px-3 text-xs font-semibold text-ed-fg transition-colors hover:border-ed-accent/50 hover:text-ed-accent"
                    >
                        {copied ? <Check className="h-4 w-4 text-ed-accent" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy citation'}
                    </button>

                    <p aria-live="polite" className="sr-only">{copied ? 'Citation copied to clipboard.' : ''}</p>
                </div>
            ) : null}
        </div>
    );
}
