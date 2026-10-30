'use client';

import { Play } from 'lucide-react';
import { useGlobalPlayer, type PlayerTrack } from './GlobalMediaPlayer';

// Sits inside a row whose link covers it, so it keeps the click to itself or starting
// playback would also open the recording page you wanted to keep browsing from.
export default function PlayButton({ track }: { track: PlayerTrack }) {
    const { track: current, isPlaying, playTrack } = useGlobalPlayer();
    const playing = isPlaying && current?.id === track.id;

    return (
        <button
            type="button"
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                playTrack(track);
            }}
            aria-label={`Play ${track.title}`}
            className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ed-accent ${
                playing
                    ? 'border-ed-accent bg-ed-accent text-white dark:text-[#0F0E0D]'
                    : 'border-ed-rule-strong text-ed-fg hover:border-ed-accent hover:text-ed-accent'
            }`}
        >
            <Play className="ml-0.5 h-3.5 w-3.5 fill-current" aria-hidden="true" />
        </button>
    );
}
