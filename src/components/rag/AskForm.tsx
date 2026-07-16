'use client';

import {
    ArrowUp,
    Square,
} from 'lucide-react';
import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from 'react';
import type { AskMessagePhase } from './askUiTypes';
import styles from './AskArchive.module.css';

interface AskFormProps {
    onSubmit: (question: string) => void | Promise<void>;
    busy: boolean;
    onCancel?: () => void;
    showExamples?: boolean;
    autoFocus?: boolean;
    compact?: boolean;
    state?: AskMessagePhase | 'idle';
}

const MAX_QUESTION_LENGTH = 300;

const EXAMPLE_QUESTIONS = [
    'Where does Rashad mention the age of responsibility?',
    'What is the mathematical miracle of the Quran?',
    'What does Submission teach about the Day of Judgment?',
];

export default function AskForm({
    onSubmit,
    busy,
    onCancel,
    showExamples = false,
    autoFocus = false,
    compact = false,
    state = 'idle',
}: AskFormProps) {
    const [value, setValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useLayoutEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        textarea.style.height = '0px';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 176)}px`;
    }, [value]);

    useEffect(() => {
        if (autoFocus) textareaRef.current?.focus();
    }, [autoFocus]);

    function submit() {
        const trimmed = value.trim();
        if (!trimmed || busy) return;

        void onSubmit(trimmed);
        setValue('');
    }

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        submit();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.nativeEvent.isComposing) return;

        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            submit();
        }
    }

    function chooseExample(example: string) {
        setValue(example);
        requestAnimationFrame(() => textareaRef.current?.focus());
    }

    const remaining = MAX_QUESTION_LENGTH - value.length;
    const canSubmit = value.trim().length > 0 && !busy;

    return (
        <form
            className={styles.askForm}
            data-compact={compact}
            data-state={busy ? state : 'idle'}
            onSubmit={handleSubmit}
            aria-busy={busy}
        >
            <div className={styles.composer}>
                <label htmlFor="ask-archive-input" className="sr-only">
                    Ask the archive a question
                </label>

                <textarea
                    ref={textareaRef}
                    id="ask-archive-input"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={busy}
                    placeholder="Ask a question about the archive…"
                    rows={1}
                    maxLength={MAX_QUESTION_LENGTH}
                    className={styles.textarea}
                    aria-describedby="ask-archive-guidance"
                />

                <button
                    type={busy ? 'button' : 'submit'}
                    onClick={busy ? onCancel : undefined}
                    disabled={busy ? !onCancel : !canSubmit}
                    aria-label={busy ? 'Stop request' : 'Ask the archive'}
                    className={styles.submitButton}
                    data-stop={busy}
                >
                    {busy ? (
                        <Square size={14} fill="currentColor" strokeWidth={1.5} />
                    ) : (
                        <ArrowUp size={17} strokeWidth={2} />
                    )}
                </button>
            </div>

            <div className={styles.composerMeta} id="ask-archive-guidance">
                <span>Enter to ask · Shift+Enter for a new line</span>
                <span data-warning={remaining <= 40}>{remaining}</span>
            </div>

            {showExamples ? (
                <div className={styles.examples} aria-label="Example questions">
                    {EXAMPLE_QUESTIONS.map((example) => (
                        <button
                            key={example}
                            type="button"
                            onClick={() => chooseExample(example)}
                            disabled={busy}
                            className={styles.exampleButton}
                        >
                            {example}
                        </button>
                    ))}
                </div>
            ) : null}
        </form>
    );
}
