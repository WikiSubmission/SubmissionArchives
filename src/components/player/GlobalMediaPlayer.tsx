'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Pause, Play, X } from 'lucide-react';

const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export type PlayerTrack = {
    id: string;
    title: string;
    /** Playback source. Everything in this archive resolves to a YouTube watch URL. */
    url: string;
    /** Detail page for this track, used by the dock's title link and to know when to stand down. */
    href: string;
};

type State = {
    track: PlayerTrack | null;
    isPlaying: boolean;
    startAt: number;
};

type Action =
    | { type: 'play'; track: PlayerTrack; startAt: number }
    | { type: 'toggle' }
    | { type: 'setPlaying'; isPlaying: boolean }
    | { type: 'close' };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'play':
            return { track: action.track, isPlaying: true, startAt: action.startAt };
        case 'toggle':
            return state.track ? { ...state, isPlaying: !state.isPlaying } : state;
        case 'setPlaying':
            return { ...state, isPlaying: action.isPlaying };
        case 'close':
            return { track: null, isPlaying: false, startAt: 0 };
        default:
            return state;
    }
}

type ContextValue = {
    track: PlayerTrack | null;
    isPlaying: boolean;
    playTrack: (track: PlayerTrack, startAt?: number) => void;
    close: () => void;
};

const MediaPlayerContext = createContext<ContextValue | null>(null);

export function useGlobalPlayer() {
    const value = useContext(MediaPlayerContext);
    if (!value) throw new Error('useGlobalPlayer must be used inside GlobalMediaPlayerProvider');
    return value;
}

export function GlobalMediaPlayerProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, { track: null, isPlaying: false, startAt: 0 });

    const playTrack = useCallback((track: PlayerTrack, startAt = 0) => {
        dispatch({ type: 'play', track, startAt });
    }, []);
    const close = useCallback(() => dispatch({ type: 'close' }), []);

    const value = useMemo<ContextValue>(
        () => ({ track: state.track, isPlaying: state.isPlaying, playTrack, close }),
        [state.track, state.isPlaying, playTrack, close],
    );

    return (
        <MediaPlayerContext.Provider value={value}>
            {children}
            <MediaDock state={state} dispatch={dispatch} />
        </MediaPlayerContext.Provider>
    );
}

function MediaDock({ state, dispatch }: { state: State; dispatch: (action: Action) => void }) {
    const pathname = usePathname();
    const { track } = state;

    // On the track's own page the full player takes over, so the dock stands down rather
    // than leaving a second player running.
    const onOwnPage = Boolean(track && pathname === track.href.split('?')[0]);

    useEffect(() => {
        if (onOwnPage) dispatch({ type: 'close' });
    }, [onOwnPage, dispatch]);

    if (!track || onOwnPage) return null;

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-4">
            <div className="pointer-events-auto flex w-full max-w-md items-stretch gap-3 overflow-hidden rounded-2xl border border-ed-rule bg-ed-surface/95 p-2 shadow-2xl backdrop-blur-xl">
                {/* The frame stays visible on purpose. Everything here plays through an
                    embedded YouTube player, and YouTube's terms require the player to remain
                    visible and unobscured — a hidden, audio-only dock would breach them. */}
                <div className="w-[220px] shrink-0 overflow-hidden rounded-xl bg-black sm:w-[240px]">
                    <div className="aspect-video">
                        <ReactPlayer
                            url={track.url}
                            playing={state.isPlaying}
                            controls
                            width="100%"
                            height="100%"
                            playsinline
                            onPlay={() => dispatch({ type: 'setPlaying', isPlaying: true })}
                            onPause={() => dispatch({ type: 'setPlaying', isPlaying: false })}
                            onEnded={() => dispatch({ type: 'setPlaying', isPlaying: false })}
                            config={{
                                youtube: {
                                    playerVars: {
                                        start: state.startAt > 0 ? Math.floor(state.startAt) : undefined,
                                        modestbranding: 1,
                                    },
                                } as Record<string, unknown>,
                            }}
                        />
                    </div>
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
                    <Link
                        href={track.href}
                        className="line-clamp-2 text-xs font-semibold leading-snug text-ed-fg hover:text-ed-accent"
                    >
                        {track.title}
                    </Link>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'toggle' })}
                            aria-label={state.isPlaying ? 'Pause' : 'Play'}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ed-fg-muted transition-colors hover:bg-ed-accent/10 hover:text-ed-accent"
                        >
                            {state.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => dispatch({ type: 'close' })}
                            aria-label="Close player"
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ed-fg-muted transition-colors hover:bg-ed-accent/10 hover:text-ed-accent"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
