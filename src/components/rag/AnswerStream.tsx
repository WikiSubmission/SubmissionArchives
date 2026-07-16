import { Fragment, type ReactNode } from 'react';
import CitationMarker from './CitationMarker';
import styles from './AskArchive.module.css';

const CITATION_BRACKET_PATTERN = /\[\s*S\d+(?:\s*,\s*S\d+)*\s*\]/g;
const CITATION_ID_PATTERN = /S\d+/g;

interface AnswerStreamProps {
    messageId: string;
    text: string;
    isRevealing: boolean;
    activeSourceId?: string | null;
    onCitationSelect: (sourceId: string) => void;
}

type AnswerBlock =
    | { kind: 'heading'; text: string }
    | { kind: 'paragraph'; text: string }
    | { kind: 'unordered-list'; items: string[] }
    | { kind: 'ordered-list'; items: string[] };

function parseBlocks(text: string): AnswerBlock[] {
    const normalized = text.replace(/\r\n/g, '\n');
    const rawBlocks = normalized.split(/\n{2,}/).filter((block) => block.length > 0);

    return rawBlocks.map((rawBlock) => {
        const lines = rawBlock.split('\n');
        const headingMatch = lines[0]?.match(/^#{1,3}\s+(.+)$/);

        if (headingMatch && lines.length === 1) {
            return { kind: 'heading', text: headingMatch[1] };
        }

        if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
            return {
                kind: 'unordered-list',
                items: lines.map((line) => line.replace(/^\s*[-*]\s+/, '')),
            };
        }

        if (lines.every((line) => /^\s*\d+[.)]\s+/.test(line))) {
            return {
                kind: 'ordered-list',
                items: lines.map((line) => line.replace(/^\s*\d+[.)]\s+/, '')),
            };
        }

        return { kind: 'paragraph', text: rawBlock };
    });
}

function renderInline(
    text: string,
    {
        messageId,
        activeSourceId,
        onCitationSelect,
        keyPrefix,
    }: {
        messageId: string;
        activeSourceId?: string | null;
        onCitationSelect: (sourceId: string) => void;
        keyPrefix: string;
    },
): ReactNode[] {
    const parts: Array<string | { sourceIds: string[] }> = [];
    let lastIndex = 0;

    for (const match of text.matchAll(CITATION_BRACKET_PATTERN)) {
        const index = match.index ?? 0;
        if (index > lastIndex) parts.push(text.slice(lastIndex, index));

        parts.push({
            sourceIds: match[0].match(CITATION_ID_PATTERN) ?? [],
        });
        lastIndex = index + match[0].length;
    }

    if (lastIndex < text.length) parts.push(text.slice(lastIndex));

    return parts.flatMap<ReactNode>((part, partIndex) => {
        if (typeof part !== 'string') {
            return part.sourceIds.map((sourceId) => (
                <CitationMarker
                    key={`${keyPrefix}-citation-${partIndex}-${sourceId}`}
                    messageId={messageId}
                    sourceId={sourceId}
                    active={activeSourceId === sourceId}
                    onSelect={onCitationSelect}
                />
            ));
        }

        const lines = part.split('\n');
        return lines.flatMap((line, lineIndex) => {
            const nodes: ReactNode[] = [
                <Fragment key={`${keyPrefix}-text-${partIndex}-${lineIndex}`}>
                    {line}
                </Fragment>,
            ];

            if (lineIndex < lines.length - 1) {
                nodes.push(<br key={`${keyPrefix}-break-${partIndex}-${lineIndex}`} />);
            }

            return nodes;
        });
    });
}

export default function AnswerStream({
    messageId,
    text,
    isRevealing,
    activeSourceId,
    onCitationSelect,
}: AnswerStreamProps) {
    const blocks = parseBlocks(text);

    return (
        <div
            className={styles.answerStream}
            aria-live={isRevealing ? 'polite' : 'off'}
            aria-busy={isRevealing}
        >
            {blocks.map((block, blockIndex) => {
                const keyPrefix = `${messageId}-${blockIndex}`;

                if (block.kind === 'heading') {
                    return (
                        <h3 key={keyPrefix}>
                            {renderInline(block.text, {
                                messageId,
                                activeSourceId,
                                onCitationSelect,
                                keyPrefix,
                            })}
                        </h3>
                    );
                }

                if (block.kind === 'unordered-list' || block.kind === 'ordered-list') {
                    const ListTag = block.kind === 'unordered-list' ? 'ul' : 'ol';
                    return (
                        <ListTag key={keyPrefix}>
                            {block.items.map((item, itemIndex) => (
                                <li key={`${keyPrefix}-${itemIndex}`}>
                                    {renderInline(item, {
                                        messageId,
                                        activeSourceId,
                                        onCitationSelect,
                                        keyPrefix: `${keyPrefix}-${itemIndex}`,
                                    })}
                                </li>
                            ))}
                        </ListTag>
                    );
                }

                return (
                    <p key={keyPrefix}>
                        {renderInline(block.text, {
                            messageId,
                            activeSourceId,
                            onCitationSelect,
                            keyPrefix,
                        })}
                    </p>
                );
            })}

            {isRevealing ? <span className={styles.streamingCaret} aria-hidden="true" /> : null}
        </div>
    );
}
