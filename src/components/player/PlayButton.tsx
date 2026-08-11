'use client';

import { Play } from 'lucide-react';
import { useGlobalPlayer, type PlayerTrack } from './GlobalMediaPlayer';

// Cards are wrapped in a Link, so this has to swallow the click or starting playback
// would also navigate away from the page you wanted to keep browsing.
export default function PlayButton({ track }: { track: PlayerTrack }) {
    const { playTrack } = useGlobalPlayer();

    return (
        <button
            type="button"
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                playTrack(track);
            }}
            aria-label={`Play ${track.title}`}
            className="absolute left-2.5 top-2.5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-ed-accent hover:text-ed-bg focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent group-hover:opacity-100 motion-reduce:transition-none"
        >
            <Play className="h-4 w-4 translate-x-[1px]" />
        </button>
    );
}
