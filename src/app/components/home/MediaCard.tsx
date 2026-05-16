import { Media, ThemeColors } from "@/types/media";
import thumbnailMapping from "@/data/thumbnail_mapping.json";
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
        const mappedFilename = (thumbnailMapping as Record<string, string>)[item.id];
        if (mappedFilename) {
            thumbnailSrc = item.type === 'sermon'
                ? `/images/sermons/${mappedFilename}.jpg`
                : `/images/video-programs/${mappedFilename}.jpg`;
        } else {
            const cleanId = item.id
                .replace(/^media\/(FRIDAY SERMONS|VIDEO PROGRAMS|disorganized_sermons|rk_video_programs)\//, '')
                .replace(/\s+/g, '_')
                .replace(/[^\w\-_.]/g, '')
                .replace(/\.mp4$/, '');
            thumbnailSrc = item.type === 'sermon'
                ? `/images/sermons/${cleanId}.jpg`
                : `/images/video-programs/${cleanId}.jpg`;
        }
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

    return (
        <article className="soft-shell group flex h-full flex-col gap-4 p-2 transition duration-300 hover:-translate-y-0.5">
            {/* Thumbnail */}
            <div className="soft-panel relative aspect-video overflow-hidden rounded-[1.35rem] bg-ed-bg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={thumbnailSrc}
                    alt={item.displayTitle}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = '/images/placeholders/rashad-khalifa.png';
                    }}
                />

                {/* Duration badge — bottom right like YouTube */}
                {item.duration_seconds ? (
                    <div className="soft-pill absolute bottom-2 right-2 px-2 py-1 text-[10px] font-medium text-ed-fg">
                        {formatDuration(item.duration_seconds)}
                    </div>
                ) : null}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-2 px-2 pb-3 font-ui">
                <h3 className="line-clamp-2 font-serif text-[15px] font-medium leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>

                <div className="line-clamp-1 text-[11px] uppercase tracking-[0.12em] text-ed-fg-muted">
                    <span>{item.author}</span>
                    {item.alternateNumberLabel ? (
                        <>
                            <span className="mx-1">|</span>
                            <span>{item.alternateNumberLabel}</span>
                        </>
                    ) : null}
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

    return (
        <div className="soft-shell group flex gap-4 p-2 font-ui">
            {/* Thumbnail */}
            <div className="soft-panel relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-[1.15rem] bg-ed-bg sm:w-48">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={thumbnailSrc}
                    alt={item.displayTitle}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.src = '/images/placeholders/rashad-khalifa.png';
                    }}
                />

                {item.duration_seconds ? (
                    <div className="soft-pill absolute bottom-1.5 right-1.5 px-2 py-0.5 text-[10px] font-medium tabular-nums text-ed-fg">
                        {formatDuration(item.duration_seconds)}
                    </div>
                ) : null}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-1 pr-2">
                <h3 className="line-clamp-2 font-serif text-sm font-medium leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>

                <div className="line-clamp-1 text-[11px] uppercase tracking-[0.12em] text-ed-fg-muted">
                    <span>{item.author}</span>
                    {item.alternateNumberLabel ? (
                        <>
                            <span className="mx-1">|</span>
                            <span>{item.alternateNumberLabel}</span>
                        </>
                    ) : null}
                    {item.displayDate ? (
                        <>
                            <span className="mx-1">•</span>
                            <span>{item.displayDate}</span>
                        </>
                    ) : null}
                </div>

                {item.duration_seconds ? (
                    <div className="text-[10px] text-ed-fg-muted tabular-nums">
                        {formatDuration(item.duration_seconds)}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
