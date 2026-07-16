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

function formatLocator(source: SourceCardData): string | null {
    if (typeof source.page === 'number' && source.page > 0) {
        return `Page ${source.page}`;
    }

    if (typeof source.startTime === 'number' && Number.isFinite(source.startTime)) {
        const hours = Math.floor(source.startTime / 3600);
        const minutes = Math.floor((source.startTime % 3600) / 60);
        const seconds = Math.floor(source.startTime % 60)
            .toString()
            .padStart(2, '0');

        return hours > 0
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds}`
            : `${minutes}:${seconds}`;
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
                {locator ? (
                    <>
                        <span aria-hidden="true">·</span>
                        <span>{locator}</span>
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
