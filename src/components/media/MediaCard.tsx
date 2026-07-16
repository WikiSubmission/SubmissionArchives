import Image from 'next/image';

import quranStudyThumbnails from '@/data/quran_study_thumbnails.json';
import { getPublicAssetUrl } from '@/lib/mediaAssets';
import type { Media } from '@/types/media';

const DEFAULT_MEDIA_THUMBNAIL = '/images/placeholders/rashad-khalifa.png';
const DEFAULT_AUDIO_THUMBNAIL = '/content/audios/messenger-audios/default.jpg';

function formatDuration(value: number): string {
    const seconds = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
        : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function getQuranStudyNumber(item: Media): number | null {
    if (typeof item.primaryNumber === 'number' && Number.isFinite(item.primaryNumber)) {
        return item.primaryNumber;
    }

    const idMatch = item.id.match(/^quran-study\/(\d+)/i);
    if (idMatch) return Number(idMatch[1]);

    const titleMatch = item.displayTitle.match(/^(?:QS\s*)?(\d{1,3})\b/i);
    return titleMatch ? Number(titleMatch[1]) : null;
}

export function getThumbnailSrc(item: Media): string {
    if (item.type === 'quran') {
        return getPublicAssetUrl('/images/placeholders/quran.jpg');
    }

    if (item.thumbnailOverride) return getPublicAssetUrl(item.thumbnailOverride);

    if (item.type === 'audio' || item.type === 'messenger-audio') {
        return getPublicAssetUrl(DEFAULT_AUDIO_THUMBNAIL);
    }

    if (item.type === 'quran-study') {
        const number = getQuranStudyNumber(item);
        if (number !== null) {
            const thumbnail = (quranStudyThumbnails as Record<string, string>)[String(number)];
            if (thumbnail) return getPublicAssetUrl(thumbnail);
        }
    }

    return DEFAULT_MEDIA_THUMBNAIL;
}

export function MediaCard({ item }: { item: Media }) {
    const thumbnailSrc = getThumbnailSrc(item);

    return (
        <article className="media-card-shell group flex h-full flex-col border-t border-ed-rule pt-3">
            <div className="relative aspect-video overflow-hidden border border-ed-rule bg-ed-surface">
                <Image
                    src={thumbnailSrc}
                    alt=""
                    fill
                    quality={60}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
                />
                {item.duration_seconds ? (
                    <span className="absolute bottom-2 right-2 bg-[#111111]/88 px-2 py-1 font-mono text-xs font-medium tabular-nums text-white">
                        {formatDuration(item.duration_seconds)}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col py-4">
                <h3 className="line-clamp-2 font-display text-[1.15rem] font-medium leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>
                <p className="mt-2 line-clamp-1 text-xs leading-5 text-ed-fg-muted">
                    {item.author}
                    {item.displayDate ? <><span aria-hidden="true"> · </span>{item.displayDate}</> : null}
                </p>
            </div>
        </article>
    );
}

export function MediaList({ item }: { item: Media }) {
    const thumbnailSrc = getThumbnailSrc(item);

    return (
        <article className="group grid gap-4 border-t border-ed-rule py-4 sm:grid-cols-[12rem_1fr] sm:items-center">
            <div className="relative aspect-video overflow-hidden border border-ed-rule bg-ed-surface">
                <Image
                    src={thumbnailSrc}
                    alt=""
                    fill
                    quality={60}
                    sizes="(max-width: 640px) 100vw, 192px"
                    className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.025]"
                />
                {item.duration_seconds ? (
                    <span className="absolute bottom-2 right-2 bg-[#111111]/88 px-2 py-1 font-mono text-xs font-medium tabular-nums text-white">
                        {formatDuration(item.duration_seconds)}
                    </span>
                ) : null}
            </div>

            <div className="min-w-0">
                <h3 className="line-clamp-2 font-display text-xl font-medium leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>
                <p className="mt-2 line-clamp-1 text-xs leading-5 text-ed-fg-muted">
                    {item.author}
                    {item.displayDate ? <><span aria-hidden="true"> · </span>{item.displayDate}</> : null}
                </p>
            </div>
        </article>
    );
}
