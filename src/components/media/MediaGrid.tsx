import Link from 'next/link';
import type { CSSProperties } from 'react';

import { getMediaHref } from '@/lib/utils';
import type { Media } from '@/types/media';
import { MediaCard, MediaList } from './MediaCard';

type MediaGridProps = {
    media: readonly Media[];
    viewMode: 'grid' | 'list';
    id?: string;
};

export function MediaGrid({ media, viewMode, id }: MediaGridProps) {
    if (viewMode === 'grid') {
        return (
            <div
                id={id}
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:gap-x-5 sm:gap-y-8 sm:overflow-visible sm:pb-0 sm:snap-none lg:grid-cols-3 xl:grid-cols-4"
            >
                {media.map((item, index) => (
                    <Link
                        href={getMediaHref(item.id)}
                        key={item.id}
                        prefetch={false}
                        className="media-card-enter block min-w-[72vw] shrink-0 snap-start sm:min-w-0 sm:shrink"
                        style={{ '--stagger-delay': `${Math.min(index, 8) * 40}ms` } as CSSProperties}
                        aria-label={`Open ${item.displayTitle}`}
                    >
                        <MediaCard item={item} priority={index < 4} />
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div id={id} className="flex flex-col">
            {media.map((item) => (
                <Link
                    href={getMediaHref(item.id)}
                    key={item.id}
                    prefetch={false}
                    className="block"
                    aria-label={`Open ${item.displayTitle}`}
                >
                    <MediaList item={item} />
                </Link>
            ))}
        </div>
    );
}
