'use client';

import { useState } from 'react';
import { MediaGrid } from '@/app/components/home/MediaGrid';
import type { Media, ThemeColors } from '@/types/media';

interface PaginatedMediaGridProps {
    media: Media[];
    theme: ThemeColors;
    viewMode: 'grid' | 'list';
    initialCount?: number;
    increment?: number;
    label: string;
}

export function PaginatedMediaGrid({
    media,
    theme,
    viewMode,
    initialCount = 12,
    increment = 12,
    label,
}: PaginatedMediaGridProps) {
    const [visibleCount, setVisibleCount] = useState(initialCount);
    const visibleMedia = media.slice(0, visibleCount);

    return (
        <div className="space-y-6">
            <MediaGrid media={visibleMedia} theme={theme} viewMode={viewMode} />

            {visibleCount < media.length ? (
                <div className="flex flex-col items-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + increment)}
                        aria-label={`Load more ${label}`}
                        className="archive-button archive-button-secondary px-6"
                    >
                        Load more
                    </button>
                    <p aria-live="polite" className="text-sm tabular-nums text-ed-fg-muted">
                        Showing {visibleMedia.length} of {media.length}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
