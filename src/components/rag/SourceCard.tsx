import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { SourceCard as SourceCardData } from '@/lib/rag/types';
import { getSourceDomId } from './sourceDomId';
import styles from './AskArchive.module.css';

const TYPE_LABELS: Record<string, string> = {
    'video-program': 'Video',
    sermon: 'Video',
    video: 'Video',
    'quran-study': 'Quran Study',
    'messenger-audio': 'Messenger Audio',
    audio: 'Messenger Audio',
    perspective: 'Submitter Perspective',
    newsletter: 'Submitter Perspective',
    appendix: 'Appendix',
    quran: "Qur'an",
    other: 'Book',
    book: 'Book',
};

const MATCH_LABELS: Record<SourceCardData['matchType'], string> = {
    direct: 'Direct match',
    conceptual: 'Conceptual match',
    related: 'Related evidence',
    uncertain: 'Uncertain match',
};

function formatTime(secondsValue: number): string {
    const seconds = Math.max(0, Math.floor(secondsValue));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = String(seconds % 60).padStart(2, '0');

    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${remainingSeconds}`
        : `${minutes}:${remainingSeconds}`;
}

function formatLocator(source: SourceCardData): string | null {
    if (source.verseId) {
        return `Verse ${source.verseId}`;
    }

    if (typeof source.page === 'number' && source.page > 0) {
        return `Page ${source.page}`;
    }

    if (typeof source.startTime === 'number' && Number.isFinite(source.startTime)) {
        const start = formatTime(source.startTime);
        if (
            typeof source.endTime === 'number' &&
            Number.isFinite(source.endTime) &&
            source.endTime > source.startTime
        ) {
            return `${start}–${formatTime(source.endTime)}`;
        }
        return start;
    }

    return null;
}

interface SourceCardProps {
    messageId: string;
    source: SourceCardData;
    highlighted?: boolean;
    index: number;
}

function SourceCardContent({
    source,
    locator,
}: {
    source: SourceCardData;
    locator: string | null;
}) {
    return (
        <>
            <div className={styles.sourceMeta}>
                <span className={styles.sourceId}>{source.sourceId}</span>
                <span>{TYPE_LABELS[source.type] || 'Resource'}</span>
                <span aria-hidden="true">·</span>
                <span>{MATCH_LABELS[source.matchType]}</span>
                {locator ? (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{locator}</span>
                    </>
                ) : null}
                {source.editionYear ? (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{source.editionYear} edition</span>
                    </>
                ) : source.publicationDate ? (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{source.publicationDate}</span>
                    </>
                ) : null}
                {source.enrichmentGuided ? (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>Topic-indexed</span>
                    </>
                ) : null}
                {source.isRashadAuthored ? (
                    <>
                        <span aria-hidden="true">·</span>
                        <span className={styles.sourceAuthorSignal}>Rashad Khalifa</span>
                    </>
                ) : null}
            </div>

            <div className={styles.sourceTitleRow}>
                <h4>{source.title}</h4>
                <ArrowUpRight size={15} strokeWidth={1.7} aria-hidden="true" />
            </div>

            {source.author && !source.isRashadAuthored ? (
                <p className={styles.sourceAuthor}>{source.author}</p>
            ) : null}

            {source.matchedSectionTitle ? (
                <p className={styles.sourceAuthor}>
                    Topic index: {source.matchedSectionTitle}
                </p>
            ) : null}

            {source.relevanceReason ? (
                <p className={styles.sourceAuthor}>{source.relevanceReason}</p>
            ) : null}

            <p className={styles.sourceSnippet}>{source.snippet}</p>
        </>
    );
}

export default function SourceCard({
    messageId,
    source,
    highlighted = false,
    index,
}: SourceCardProps) {
    const locator = formatLocator(source);
    const id = getSourceDomId(messageId, source.sourceId);
    const isExternal = /^https?:\/\//i.test(source.href);
    const className = styles.sourceCard;
    const style = {
        animationDelay: `${Math.min(index, 7) * 55}ms`,
    };

    if (isExternal) {
        return (
            <a
                id={id}
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                data-highlighted={highlighted}
                style={style}
                aria-label={`Open source ${source.sourceId}: ${source.title} in a new tab`}
            >
                <SourceCardContent source={source} locator={locator} />
            </a>
        );
    }

    return (
        <Link
            id={id}
            href={source.href}
            className={className}
            data-highlighted={highlighted}
            style={style}
            aria-label={`Open source ${source.sourceId}: ${source.title}`}
        >
            <SourceCardContent source={source} locator={locator} />
        </Link>
    );
}
