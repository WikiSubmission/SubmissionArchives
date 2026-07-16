import { getSourceDomId } from './sourceDomId';
import styles from './AskArchive.module.css';

interface CitationMarkerProps {
    messageId: string;
    sourceId: string;
    active?: boolean;
    onSelect: (sourceId: string) => void;
}

export default function CitationMarker({
    messageId,
    sourceId,
    active = false,
    onSelect,
}: CitationMarkerProps) {
    const targetId = getSourceDomId(messageId, sourceId);

    return (
        <button
            type="button"
            onClick={() => onSelect(sourceId)}
            className={styles.citationMarker}
            data-active={active}
            aria-label={`Show source ${sourceId}`}
            aria-controls={targetId}
        >
            {sourceId}
        </button>
    );
}
