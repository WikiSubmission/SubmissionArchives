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
                    <p id={`${message.id}-question`}>{message.question}</p>
                </div>
            </div>

            <div className={styles.response}>
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
                    verified={message.phase === 'complete' && Boolean(message.answerText)}
                />
            </div>
        </article>
    );
}
