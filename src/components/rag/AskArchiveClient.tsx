'use client';

import {
    RotateCcw,
    ShieldCheck,
} from 'lucide-react';
import {
    useCallback,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState,
} from 'react';
import type { AskStreamEvent } from '@/lib/rag/streamTypes';
import AskConversationMessage from './AskConversationMessage';
import AskForm from './AskForm';
import { streamAsk } from './askStream';
import type {
    AskMessage,
    HighlightedSource,
} from './askUiTypes';
import { getSourceDomId } from './sourceDomId';
import styles from './AskArchive.module.css';

type AskState = {
    messages: AskMessage[];
};

type AskAction =
    | { type: 'append'; message: AskMessage }
    | { type: 'stream-event'; id: string; event: AskStreamEvent }
    | { type: 'failed'; id: string; message: string }
    | { type: 'cancelled'; id: string }
    | { type: 'complete'; id: string }
    | { type: 'reset' };

const INITIAL_STATE: AskState = {
    messages: [],
};

function updateMessage(
    messages: AskMessage[],
    id: string,
    updater: (message: AskMessage) => AskMessage,
): AskMessage[] {
    return messages.map((message) => (message.id === id ? updater(message) : message));
}

function phaseFromStage(stage: Extract<AskStreamEvent, { type: 'status' }>['stage']) {
    if (stage === 'synthesizing' || stage === 'validating') return 'synthesizing';
    if (stage === 'revealing') return 'revealing';
    return 'retrieving';
}

function reducer(state: AskState, action: AskAction): AskState {
    switch (action.type) {
        case 'append':
            return {
                messages: [...state.messages, action.message],
            };

        case 'stream-event':
            return {
                messages: updateMessage(state.messages, action.id, (message) => {
                    const event = action.event;

                    switch (event.type) {
                        case 'status':
                            return {
                                ...message,
                                phase: phaseFromStage(event.stage),
                                progressStage: event.stage,
                                progressMessage: event.message,
                            };

                        case 'sources':
                            return {
                                ...message,
                                sources: event.sources,
                            };

                        case 'answer_delta':
                            return {
                                ...message,
                                phase: 'revealing',
                                progressStage: 'revealing',
                                progressMessage: 'Presenting the verified answer…',
                                answerText: message.answerText + event.text,
                            };

                        case 'answer_done':
                            return {
                                ...message,
                                citedSourceIds: event.citedSourceIds,
                            };

                        case 'notice':
                            return {
                                ...message,
                                phase: 'complete',
                                notice: {
                                    kind: event.kind,
                                    message: event.message,
                                },
                            };

                        case 'done':
                            return {
                                ...message,
                                phase:
                                    message.phase === 'error' || message.phase === 'cancelled'
                                        ? message.phase
                                        : 'complete',
                                progressMessage: null,
                            };
                    }
                }),
            };

        case 'failed':
            return {
                messages: updateMessage(state.messages, action.id, (message) => ({
                    ...message,
                    phase: 'error',
                    error: action.message,
                    progressMessage: null,
                })),
            };

        case 'cancelled':
            return {
                messages: updateMessage(state.messages, action.id, (message) => ({
                    ...message,
                    phase: 'cancelled',
                    progressMessage: null,
                })),
            };

        case 'complete':
            return {
                messages: updateMessage(state.messages, action.id, (message) => ({
                    ...message,
                    phase:
                        message.phase === 'error' || message.phase === 'cancelled'
                            ? message.phase
                            : 'complete',
                    progressMessage: null,
                })),
            };

        case 'reset':
            return INITIAL_STATE;
    }
}

function createMessageId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AskArchiveClient() {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const [highlightedSource, setHighlightedSource] =
        useState<HighlightedSource | null>(null);

    const activeRequestRef = useRef<{
        id: string;
        controller: AbortController;
    } | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const followOutputRef = useRef(true);
    const scrollFrameRef = useRef<number | null>(null);
    const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];
    const isBusy = Boolean(
        lastMessage &&
            (lastMessage.phase === 'retrieving' ||
                lastMessage.phase === 'synthesizing' ||
                lastMessage.phase === 'revealing'),
    );

    const sourceCount = lastMessage?.sources.length ?? 0;
    const lastAnswerText = lastMessage?.answerText ?? '';

    const scheduleScrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
        if (!followOutputRef.current) return;

        if (scrollFrameRef.current !== null) {
            cancelAnimationFrame(scrollFrameRef.current);
        }

        scrollFrameRef.current = requestAnimationFrame(() => {
            bottomRef.current?.scrollIntoView({
                behavior,
                block: 'end',
            });
            scrollFrameRef.current = null;
        });
    }, []);

    useEffect(() => {
        function handleScroll() {
            const documentElement = document.documentElement;
            const distanceFromBottom =
                documentElement.scrollHeight -
                window.scrollY -
                window.innerHeight;

            followOutputRef.current = distanceFromBottom < 260;
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (messages.length === 0) return;
        scheduleScrollToBottom('auto');
    }, [
        messages.length,
        lastAnswerText,
        sourceCount,
        scheduleScrollToBottom,
    ]);

    useEffect(() => {
        return () => {
            activeRequestRef.current?.controller.abort();

            if (scrollFrameRef.current !== null) {
                cancelAnimationFrame(scrollFrameRef.current);
            }

            if (highlightTimerRef.current) {
                clearTimeout(highlightTimerRef.current);
            }
        };
    }, []);

    async function handleSubmit(question: string) {
        if (activeRequestRef.current) return;

        const id = createMessageId();
        const controller = new AbortController();
        activeRequestRef.current = { id, controller };
        followOutputRef.current = true;
        setHighlightedSource(null);

        dispatch({
            type: 'append',
            message: {
                id,
                question,
                answerText: '',
                sources: [],
                citedSourceIds: [],
                notice: null,
                phase: 'retrieving',
                progressStage: 'embedding',
                progressMessage: 'Mapping your question to the archive…',
                error: null,
            },
        });

        requestAnimationFrame(() => scheduleScrollToBottom('smooth'));

        try {
            await streamAsk(
                question,
                (event) => {
                    dispatch({
                        type: 'stream-event',
                        id,
                        event,
                    });
                },
                controller.signal,
            );

            dispatch({ type: 'complete', id });
        } catch (error: unknown) {
            if (controller.signal.aborted) {
                dispatch({ type: 'cancelled', id });
            } else {
                dispatch({
                    type: 'failed',
                    id,
                    message:
                        error instanceof Error
                            ? error.message
                            : 'Something went wrong while contacting the archive.',
                });
            }
        } finally {
            if (activeRequestRef.current?.id === id) {
                activeRequestRef.current = null;
            }
        }
    }

    function handleCancel() {
        const activeRequest = activeRequestRef.current;
        if (!activeRequest) return;

        activeRequest.controller.abort();
        dispatch({
            type: 'cancelled',
            id: activeRequest.id,
        });
        activeRequestRef.current = null;
    }

    function handleCitationSelect(messageId: string, sourceId: string) {
        setHighlightedSource({ messageId, sourceId });

        if (highlightTimerRef.current) {
            clearTimeout(highlightTimerRef.current);
        }

        // The source list may be collapsed; give it a moment to expand
        // before scrolling to the card.
        window.setTimeout(() => {
            const target = document.getElementById(getSourceDomId(messageId, sourceId));
            target?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });

            window.setTimeout(() => {
                if (target instanceof HTMLElement) {
                    target.focus({ preventScroll: true });
                }
            }, 400);
        }, 120);

        highlightTimerRef.current = setTimeout(() => {
            setHighlightedSource((current) =>
                current?.messageId === messageId && current.sourceId === sourceId
                    ? null
                    : current,
            );
        }, 4200);
    }

    function resetConversation() {
        activeRequestRef.current?.controller.abort();
        activeRequestRef.current = null;
        setHighlightedSource(null);
        dispatch({ type: 'reset' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const activeSourceByMessage = useMemo(() => {
        if (!highlightedSource) return new Map<string, string>();
        return new Map([[highlightedSource.messageId, highlightedSource.sourceId]]);
    }, [highlightedSource]);

    if (messages.length === 0) {
        return (
            <section className={styles.askPage} data-mode="empty">
                <div className={styles.emptyState}>
                    <div className={styles.emptyIntro}>
                        <h1>Peace be upon you.</h1>
                        <p className={styles.emptyGreeting}>
                            Ask a question about the preserved recordings, transcripts,
                            books, newsletters, appendices, or Qur&apos;an editions.
                        </p>
                    </div>

                    <div className={styles.initialComposer}>
                        <AskForm
                            onSubmit={handleSubmit}
                            busy={false}
                            showExamples
                            autoFocus
                            state="idle"
                        />

                        <p className={styles.trustNote}>
                            <ShieldCheck size={15} strokeWidth={1.8} aria-hidden="true" />
                            <span>
                                <strong>Beta:</strong> Ask the Archive is still in testing and can make mistakes. Responses are limited to indexed archive evidence. Verify citations against the original recording or scan before formal use.
                            </span>
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.askPage} data-mode="conversation">
            <div className={styles.conversationShell}>
                <header className={styles.conversationHeader}>
                    <p className={styles.eyebrow}>
                        Ask the Archive
                        <span className="ml-2 rounded-full border border-ed-accent/40 bg-ed-accent/10 px-2 py-0.5 text-[0.55rem] uppercase tracking-widest text-ed-accent">
                            Beta
                        </span>
                    </p>

                    <button
                        type="button"
                        onClick={resetConversation}
                        disabled={isBusy}
                        className={styles.resetButton}
                    >
                        <RotateCcw size={15} strokeWidth={1.8} />
                        New conversation
                    </button>
                </header>

                <div className={styles.messageList}>
                    {messages.map((message) => (
                        <AskConversationMessage
                            key={message.id}
                            message={message}
                            activeSourceId={
                                activeSourceByMessage.get(message.id) ?? null
                            }
                            onCitationSelect={handleCitationSelect}
                        />
                    ))}

                    <div ref={bottomRef} />
                </div>

                <div className={styles.stickyComposer}>
                    <AskForm
                        onSubmit={handleSubmit}
                        busy={isBusy}
                        onCancel={handleCancel}
                        compact
                        state={lastMessage?.phase ?? 'idle'}
                    />
                </div>
            </div>
        </section>
    );
}
