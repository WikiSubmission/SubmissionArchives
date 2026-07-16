import { CheckCircle2 } from 'lucide-react';
import type { AskMessage } from './askUiTypes';
import AnswerStream from './AnswerStream';
import AskProgress from './AskProgress';
import NoticeBanner from './NoticeBanner';
import SourceCardList from './SourceCardList';
import styles from './AskArchive.module.css';

interface AskConversationMessageProps {
    message: AskMessage;
    activeSourceId: string | null;
    onCitationSelect: (messageId: string, sourceId: string) => void;
}

export default function AskConversationMessage({
    message,
    activeSourceId,
    onCitationSelect,
}: AskConversationMessageProps) {
    const isWorking =
        message.phase === 'retrieving' ||
        message.phase === 'synthesizing' ||
        message.phase === 'revealing';

    return (
        <article className={styles.message} aria-labelledby={`${message.id}-question`}>
            <div className={styles.questionRow}>
                <div className={styles.questionBubble}>
                    <span className={styles.speakerLabel}>You</span>
                    <p id={`${message.id}-question`}>{message.question}</p>
                </div>
            </div>

            <div className={styles.response}>
                <div className={styles.responseHeader}>
                    <div>
                        <span className={styles.archiveMark} aria-hidden="true">A</span>
                        <span>Archive response</span>
                    </div>

                    {message.phase === 'complete' && message.answerText ? (
                        <span className={styles.verifiedLabel}>
                            <CheckCircle2 size={14} strokeWidth={1.9} />
                            Citations checked
                        </span>
                    ) : null}
                </div>

                {isWorking && !message.answerText ? (
                    <AskProgress
                        stage={message.progressStage}
                        message={message.progressMessage}
                    />
                ) : null}

                {message.answerText ? (
                    <>
                        {isWorking ? (
                            <div className={styles.compactProgress}>
                                <AskProgress
                                    stage={message.progressStage}
                                    message={message.progressMessage}
                                />
                            </div>
                        ) : null}

                        <AnswerStream
                            messageId={message.id}
                            text={message.answerText}
                            isRevealing={message.phase === 'revealing'}
                            activeSourceId={activeSourceId}
                            onCitationSelect={(sourceId) =>
                                onCitationSelect(message.id, sourceId)
                            }
                        />
                    </>
                ) : null}

                {message.phase === 'cancelled' ? (
                    <p className={styles.cancelledMessage}>Request stopped.</p>
                ) : null}

                {message.notice ? (
                    <NoticeBanner
                        kind={message.notice.kind}
                        message={message.notice.message}
                    />
                ) : null}

                {message.error ? (
                    <NoticeBanner
                        kind="model_unavailable"
                        message={message.error}
                    />
                ) : null}

                <SourceCardList
                    messageId={message.id}
                    sources={message.sources}
                    highlightedSourceId={activeSourceId}
                />
            </div>
        </article>
    );
}
