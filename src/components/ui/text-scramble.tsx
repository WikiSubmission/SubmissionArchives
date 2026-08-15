'use client';

import { useEffect, useRef, useState } from 'react';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';

interface TextScrambleProps {
    text: string;
    className?: string;
    id?: string;
    /** Total resolve duration in ms. Headlines ~1200, labels ~800. */
    duration?: number;
    as?: 'span' | 'h1' | 'h2' | 'h3' | 'p';
}

/**
 * Resolves from random characters to the final string. Use sparingly — a
 * hero subtitle or a single section title, once per page. Runs once on
 * mount; skips the animation entirely under prefers-reduced-motion.
 */
export function TextScramble({ text, className, id, duration = 1200, as = 'span' }: TextScrambleProps) {
    const [display, setDisplay] = useState(text);
    const [prevText, setPrevText] = useState(text);
    const frameRef = useRef<number | undefined>(undefined);

    // Keep display in sync with a changed `text` prop without an effect —
    // same "adjust state during render" pattern Header.tsx uses for pathname.
    if (text !== prevText) {
        setPrevText(text);
        setDisplay(text);
    }

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const start = performance.now();
        const scrambleWindow = duration * 0.4;

        function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const lockedCount = Math.floor(progress * text.length);

            const next = text
                .split('')
                .map((char, index) => {
                    if (char === ' ') return ' ';
                    if (index < lockedCount || elapsed > duration) return char;
                    if (elapsed < scrambleWindow || index >= lockedCount) {
                        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                    }
                    return char;
                })
                .join('');

            setDisplay(next);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(tick);
            } else {
                setDisplay(text);
            }
        }

        frameRef.current = requestAnimationFrame(tick);
        return () => {
            if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
        };
    }, [text, duration]);

    const Tag = as;
    return (
        <Tag id={id} className={className} aria-label={text}>
            {display}
        </Tag>
    );
}
