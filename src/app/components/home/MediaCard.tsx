'use client';

import Image from "next/image";
import { useState } from "react";
import { Media, ThemeColors } from "@/types/media";
import quranStudyThumbnails from "@/data/quran_study_thumbnails.json";
import { getPublicAssetUrl } from "@/lib/mediaAssets";

interface MediaCardProps {
    item: Media;
    theme: ThemeColors;
}

function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getThumbnailSrc(item: Media): string {
    // 1. Check for explicit thumbnail override (used by video-programs in content folder)
    if (item.thumbnailOverride) {
        return getPublicAssetUrl(item.thumbnailOverride);
    }

    let thumbnailSrc = '/images/placeholders/rashad-khalifa.png';

    if (item.type === 'sermon' || item.type === 'video-program') {
        const cleanId = item.id
            .replace(/^media\/(FRIDAY SERMONS|VIDEO PROGRAMS|disorganized_sermons|rk_video_programs)\//, '')
            .replace(/\s+/g, '_')
            .replace(/[^\w\-_.]/g, '')
            .replace(/\.mp4$/, '');
        thumbnailSrc = item.type === 'sermon'
            ? `/images/sermons/${cleanId}.jpg`
            : `/images/video-programs/${cleanId}.jpg`;
    } else if (item.type === 'audio' || item.type === 'messenger-audio') {
        thumbnailSrc = '/images/messenger-audios/default.jpg';
    } else if (item.type === 'quran-study') {
        const match = item.displayTitle.match(/^(\d+)\)/) || item.id.match(/quran-study-v2\/(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            thumbnailSrc = (quranStudyThumbnails as Record<string, string>)[String(num)] || thumbnailSrc;
        }
    }

    // Encode the path if it's a local content folder to handle spaces/special characters
    return thumbnailSrc.startsWith('/content/') ? getPublicAssetUrl(thumbnailSrc) : thumbnailSrc;
}

export function MediaCard({ item }: MediaCardProps) {
    const thumbnailSrc = getThumbnailSrc(item);
    const [failed, setFailed] = useState(false);

    return (
        <article className="media-card-shell group flex h-full flex-col gap-4 border-t border-ed-rule pt-3 transition-colors duration-300">
            {/* Thumbnail */}
            <div className="relative aspect-video overflow-hidden rounded-lg border border-ed-rule bg-ed-surface">
                <Image
                    src={failed ? '/images/placeholders/rashad-khalifa.png' : thumbnailSrc}
                    alt={item.displayTitle}
                    fill
                    quality={60}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    onError={() => setFailed(true)}
                />

                {/* Duration badge — bottom right like YouTube */}
                {item.duration_seconds ? (
                    <div className="absolute bottom-2 right-2 rounded bg-ed-bg/90 px-2 py-1 font-mono text-xs font-medium tabular-nums text-ed-fg">
                        {formatDuration(item.duration_seconds)}
                    </div>
                ) : null}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-2 pb-3 font-ui">
                <h3 className="line-clamp-2 font-serif text-[1.05rem] font-medium leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>

                <div className="line-clamp-1 text-xs leading-5 text-ed-fg-muted">
                    <span>{item.author}</span>
                    {item.displayDate ? (
                        <>
                            <span className="mx-1">•</span>
                            <span>{item.displayDate}</span>
                        </>
                    ) : null}
                </div>
            </div>
        </article>
    );
}

export function MediaList({ item }: MediaCardProps) {
    const thumbnailSrc = getThumbnailSrc(item);
    const [failed, setFailed] = useState(false);

    return (
        <div className="group flex gap-4 border-t border-ed-rule py-4 font-ui">
            {/* Thumbnail */}
            <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg border border-ed-rule bg-ed-surface sm:w-48">
                <Image
                    src={failed ? '/images/placeholders/rashad-khalifa.png' : thumbnailSrc}
                    alt={item.displayTitle}
                    fill
                    quality={60}
                    sizes="(max-width: 640px) 160px, 192px"
                    className="object-cover"
                    onError={() => setFailed(true)}
                />

                {item.duration_seconds ? (
                    <div className="absolute bottom-1.5 right-1.5 rounded bg-ed-bg/90 px-2 py-1 font-mono text-xs font-medium tabular-nums text-ed-fg">
                        {formatDuration(item.duration_seconds)}
                    </div>
                ) : null}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1 pr-2">
                <h3 className="line-clamp-2 font-serif text-base font-medium leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>

                <div className="line-clamp-1 text-xs leading-5 text-ed-fg-muted">
                    <span>{item.author}</span>
                    {item.displayDate ? (
                        <>
                            <span className="mx-1">•</span>
                            <span>{item.displayDate}</span>
                        </>
                    ) : null}
                </div>

                {item.duration_seconds ? (
                    <div className="font-mono text-xs text-ed-fg-muted tabular-nums">
                        {formatDuration(item.duration_seconds)}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
