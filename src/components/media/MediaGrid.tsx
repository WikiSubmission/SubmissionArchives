import Link from 'next/link';

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
            <div id={id} className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {media.map((item) => (
                    <Link
                        href={getMediaHref(item.id)}
                        key={item.id}
                        className="block min-w-0"
                        aria-label={`Open ${item.displayTitle}`}
                    >
                        <MediaCard item={item} />
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
                    className="block"
                    aria-label={`Open ${item.displayTitle}`}
                >
                    <MediaList item={item} />
                </Link>
            ))}
        </div>
    );
}
