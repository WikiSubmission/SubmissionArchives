'use client';

import {
    useEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';

type RevealProps = {
    children: ReactNode;
    /** Stagger delay in milliseconds — e.g. index * 90 for lists. */
    delay?: number;
    className?: string;
    /**
     * A negative bottom margin triggers the reveal just before the block
     * is fully in view, so entrances feel anticipated rather than late.
     */
    rootMargin?: string;
};

/**
 * Scroll-triggered entrance wrapper. Pairs with the `.reveal` /
 * `.is-revealed` rules in globals.css (opacity + rise, spring easing).
 * Respects prefers-reduced-motion via the global CSS guard.
 */
export function Reveal({
    children,
    delay = 0,
    className = '',
    rootMargin = '0px 0px -6% 0px',
}: RevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || isRevealed) return;

        if (!('IntersectionObserver' in window)) {
            queueMicrotask(() => setIsRevealed(true));
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setIsRevealed(true);
                observer.disconnect();
            },
            { rootMargin, threshold: 0.12 },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [isRevealed, rootMargin]);

    return (
        <div
            ref={ref}
            className={`reveal${isRevealed ? ' is-revealed' : ''}${className ? ` ${className}` : ''}`}
            style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
        >
            {children}
        </div>
    );
}
