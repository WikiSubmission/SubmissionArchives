import type { SourceCard as SourceCardData } from '@/lib/rag/types';
import SourceCard from './SourceCard';
import styles from './AskArchive.module.css';

interface SourceCardListProps {
    messageId: string;
    sources: SourceCardData[];
    highlightedSourceId: string | null;
}

export default function SourceCardList({
    messageId,
    sources,
    highlightedSourceId,
}: SourceCardListProps) {
    if (sources.length === 0) return null;

    return (
        <section className={styles.sourcesSection} aria-labelledby={`${messageId}-sources-heading`}>
            <div className={styles.sourcesHeading}>
                <h3 id={`${messageId}-sources-heading`}>Sources</h3>
                <span>{sources.length} retrieved</span>
            </div>

            <div className={styles.sourceGrid}>
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
        </section>
    );
}
