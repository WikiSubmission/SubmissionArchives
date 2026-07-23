export type NavMode = 'idle' | 'nav';

export interface NavState {
    mode: NavMode;
    cardIndex: number;
    passageIndex: number; // -1 = card level, >= 0 = a specific passage
}

export interface NavBounds {
    cardCount: number;
    passageCountFor: (cardIndex: number) => number;
}

export type NavKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Escape';

export const IDLE: NavState = { mode: 'idle', cardIndex: -1, passageIndex: -1 };

export function navReduce(state: NavState, key: NavKey, bounds: NavBounds): NavState {
    const { cardCount } = bounds;

    if (state.mode === 'idle') {
        if (key === 'ArrowDown' && cardCount > 0) {
            return { mode: 'nav', cardIndex: 0, passageIndex: -1 };
        }
        return state;
    }

    if (key === 'Escape') {
        return IDLE;
    }

    const passageCount = bounds.passageCountFor(state.cardIndex);

    if (state.passageIndex === -1) {
        switch (key) {
            case 'ArrowDown':
                return state.cardIndex < cardCount - 1
                    ? { ...state, cardIndex: state.cardIndex + 1 }
                    : state;
            case 'ArrowUp':
                return state.cardIndex > 0
                    ? { ...state, cardIndex: state.cardIndex - 1 }
                    : IDLE;
            case 'ArrowRight':
                return passageCount > 0 ? { ...state, passageIndex: 0 } : state;
            default:
                return state;
        }
    }

    switch (key) {
        case 'ArrowDown':
            return state.passageIndex < passageCount - 1
                ? { ...state, passageIndex: state.passageIndex + 1 }
                : state;
        case 'ArrowUp':
            return { ...state, passageIndex: state.passageIndex - 1 };
        case 'ArrowLeft':
            return { ...state, passageIndex: -1 };
        default:
            return state;
    }
}

export function activeNodeId(state: NavState): string | null {
    if (state.mode !== 'nav') {
        return null;
    }
    return state.passageIndex >= 0
        ? `search-card-${state.cardIndex}-passage-${state.passageIndex}`
        : `search-card-${state.cardIndex}`;
}
