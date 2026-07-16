'use client';

import { useId, useState } from 'react';

import type { Media } from '@/types/media';
import { MediaGrid } from '@/components/media/MediaGrid';

type PaginatedMediaGridProps = {
    media: readonly Media[];
    viewMode: 'grid' | 'list';
    initialCount?: number;
    increment?: number;
    label: string;
};

export function PaginatedMediaGrid({
    media,
    viewMode,
    initialCount = 12,
    increment = 12,
    label,
}: PaginatedMediaGridProps) {
    const gridId = useId();
    const [visibleCount, setVisibleCount] = useState(() => Math.min(initialCount, media.length));
    const visibleMedia = media.slice(0, visibleCount);
    const remaining = Math.max(media.length - visibleCount, 0);

    return (
        <div className="space-y-8">
            <MediaGrid id={gridId} media={visibleMedia} viewMode={viewMode} />

            {remaining > 0 ? (
                <div className="flex flex-col items-center gap-3 border-t border-ed-rule pt-6">
                    <button
                        type="button"
                        onClick={() => setVisibleCount((current) => Math.min(current + increment, media.length))}
                        aria-controls={gridId}
                        className="archive-button archive-button-secondary px-6"
                    >
                        Load {Math.min(increment, remaining)} more
                    </button>
                    <p aria-live="polite" className="text-sm tabular-nums text-ed-fg-muted">
                        Showing {visibleMedia.length} of {media.length} {label}
                    </p>
                </div>
            ) : null}
        </div>
    );
}
