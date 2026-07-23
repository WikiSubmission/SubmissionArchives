'use client';

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import {
    IDLE,
    navReduce,
    activeNodeId,
    type NavBounds,
    type NavKey,
    type NavState,
} from './searchNavReducer';

const NAV_KEYS: ReadonlySet<string> = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Escape',
]);

export interface SearchKeyboardNavOptions {
    bounds: NavBounds;
    getHref: (cardIndex: number, passageIndex: number) => string | null;
    navigate: (href: string) => void;
    expandCard: (cardIndex: number) => void;
    collapseCard: (cardIndex: number) => void;
    isCardExpanded: (cardIndex: number) => boolean;
}

export interface SearchKeyboardNav {
    activeNodeId: string | null;
    activeCardIndex: number;
    activePassageIndex: number;
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    reset: () => void;
}

export function useSearchKeyboardNav(options: SearchKeyboardNavOptions): SearchKeyboardNav {
    const { bounds, getHref, navigate, expandCard, collapseCard, isCardExpanded } = options;
    const [state, setState] = useState<NavState>(IDLE);
    const autoExpandedRef = useRef<number | null>(null);

    const reset = useCallback(() => {
        if (autoExpandedRef.current !== null) {
            collapseCard(autoExpandedRef.current);
            autoExpandedRef.current = null;
        }
        setState(IDLE);
    }, [collapseCard]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            const key = event.key;

            if (state.mode === 'idle') {
                if (key === 'ArrowDown' && bounds.cardCount > 0) {
                    event.preventDefault();
                    setState(navReduce(state, 'ArrowDown', bounds));
                }
                return;
            }

            if (key === 'Enter') {
                event.preventDefault();
                const href = getHref(state.cardIndex, state.passageIndex);
                if (href) {
                    navigate(href);
                }
                return;
            }

            if (!NAV_KEYS.has(key)) {
                return;
            }

            event.preventDefault();
            const next = navReduce(state, key as NavKey, bounds);

            const enteringPassages = state.passageIndex === -1 && next.passageIndex >= 0;
            const leavingPassages = state.passageIndex >= 0 && next.passageIndex === -1;
            const exitingNav = next.mode === 'idle';

            if (enteringPassages && !isCardExpanded(next.cardIndex)) {
                expandCard(next.cardIndex);
                autoExpandedRef.current = next.cardIndex;
            }
            if ((leavingPassages || exitingNav) && autoExpandedRef.current !== null) {
                collapseCard(autoExpandedRef.current);
                autoExpandedRef.current = null;
            }

            setState(next);
        },
        [state, bounds, getHref, navigate, expandCard, collapseCard, isCardExpanded],
    );

    return {
        activeNodeId: activeNodeId(state),
        activeCardIndex: state.mode === 'nav' ? state.cardIndex : -1,
        activePassageIndex: state.mode === 'nav' ? state.passageIndex : -1,
        onKeyDown,
        reset,
    };
}
