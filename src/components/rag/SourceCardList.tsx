'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import type { SourceCard as SourceCardData } from '@/lib/rag/types';
import SourceCard from './SourceCard';
import styles from './AskArchive.module.css';

interface SourceCardListProps {
    messageId: string;
    sources: SourceCardData[];
    highlightedSourceId: string | null;
    verified?: boolean;
}

export default function SourceCardList({
    messageId,
    sources,
    highlightedSourceId,
    verified = false,
}: SourceCardListProps) {
    const [open, setOpen] = useState(false);
    const [previousHighlight, setPreviousHighlight] = useState(highlightedSourceId);

    // Expand automatically when a citation is clicked (adjust-during-render
    // pattern: react to the prop change without an effect).
    if (highlightedSourceId !== previousHighlight) {
        setPreviousHighlight(highlightedSourceId);
        if (highlightedSourceId && !open) {
            setOpen(true);
        }
    }

    if (sources.length === 0) return null;

    return (
        <section className={styles.sourcesSection} aria-label="Sources">
            <button
                type="button"
                className={styles.sourcesToggle}
                aria-expanded={open}
                aria-controls={`${messageId}-sources`}
                onClick={() => setOpen((current) => !current)}
            >
                <ChevronDown size={14} aria-hidden="true" />
                <span>
                    {sources.length} {sources.length === 1 ? 'source' : 'sources'}
                </span>
                {verified ? (
                    <span className={styles.verifiedInline}>
                        <CheckCircle2 size={13} strokeWidth={1.9} aria-hidden="true" />
                        citations checked
                    </span>
                ) : null}
            </button>

            {open ? (
                <div id={`${messageId}-sources`} className={styles.sourceGrid}>
                    {sources.map((source, index) => (
                        <SourceCard
                            key={`${messageId}-${source.sourceId}`}
                            messageId={messageId}
                            source={source}
                            highlighted={source.sourceId === highlightedSourceId}
                            index={index}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}
