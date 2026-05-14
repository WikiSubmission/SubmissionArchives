import { Media, ThemeColors } from "@/types/media";
import { BookOpen, FileText, Headphones, Video } from "lucide-react";
import thumbnailMapping from "@/data/thumbnail_mapping.json";
import quranStudyThumbnails from "@/data/quran_study_thumbnails.json";

interface MediaCardProps {
    item: Media;
    theme: ThemeColors;
}

export function MediaCard({ item, theme }: MediaCardProps) {
    const Icon =
        item.type === 'sermon' ? Video :
            item.type === 'quran-study' ? BookOpen :
                item.type === 'video-program' ? Video :
                    (item.type.includes('audio') || item.type === 'messenger-audio') ? Headphones :
                        FileText;

    const typeLabel =
        item.type === 'messenger-audio' ? 'Audio' :
            item.type === 'video-program' ? 'Video Program' :
                item.type.replace('-', ' ');

    // Get thumbnail path based on media type
    let thumbnailSrc = '/images/placeholders/rashad-khalifa.png';

    if (item.type === 'sermon' || item.type === 'video-program') {
        // Check if there's a mapping for this media ID
        const mappedFilename = (thumbnailMapping as Record<string, string>)[item.id];

        if (mappedFilename) {
            // Use the mapped filename
            thumbnailSrc = item.type === 'sermon'
                ? `/images/sermons/${mappedFilename}.jpg`
                : `/images/video-programs/${mappedFilename}.jpg`;
        } else {
            // Fallback to clean ID approach
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

    return (
        <article
            className={`
                group h-full flex flex-col overflow-hidden
                rounded-xl
                bg-card text-card-foreground
                border border-border
                transition
                hover:border-amber-500/40
            `}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted">
                <img
                    src={thumbnailSrc}
                    alt={item.displayTitle}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                        e.currentTarget.src = '/images/placeholders/rashad-khalifa.png';
                    }}
                />

                {/* Type pill */}
                <div className="
                    absolute top-3 left-3
                    flex items-center gap-1.5
                    rounded-full
                    bg-black/70 text-white
                    px-3 py-1
                    text-[10px] font-mono uppercase tracking-wider
                ">
                    <Icon className="w-3 h-3 opacity-80" />
                    {typeLabel}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col gap-3 flex-1">
                <h3 className="
                    text-base font-semibold leading-snug
                    text-card-foreground
                    group-hover:text-amber-600
                    transition-colors
                    line-clamp-2
                ">
                    {item.displayTitle}
                </h3>

                <div className="
                    mt-auto pt-3
                    flex items-center justify-between
                    text-[11px] font-mono
                    text-muted-foreground
                ">
                    <span className="truncate">
                        {item.author}
                    </span>

                    {item.duration_seconds && (
                        <span className="flex-shrink-0">
                            {Math.floor(item.duration_seconds / 60)}m
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}

export function MediaList({ item, theme }: MediaCardProps) {
    const Icon =
        item.type === 'sermon' ? Video :
            item.type === 'quran-study' ? BookOpen :
                item.type === 'video-program' ? Video :
                    (item.type.includes('audio') || item.type === 'messenger-audio') ? Headphones :
                        FileText;

    const typeLabel =
        item.type === 'messenger-audio' ? 'Audio' :
            item.type === 'video-program' ? 'Video Program' :
                item.type.replace('-', ' ');

    return (
        <div className="
            group border-b border-zinc-200 dark:border-zinc-800
            hover:bg-zinc-50 dark:hover:bg-zinc-900/40
            transition
        ">
            <div className="px-6 py-4 flex items-center gap-6">
                <div className="w-28 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    <Icon className="w-3 h-3" />
                    {typeLabel}
                </div>

                <h3 className="
                    flex-1 text-sm font-semibold
                    text-card-foreground
                    group-hover:text-amber-600 dark:group-hover:text-amber-500
                    transition-colors
                    truncate
                ">
                    {item.displayTitle}
                </h3>

                <div className="
                    hidden md:flex items-center gap-6
                    text-[11px] font-mono text-muted-foreground
                ">
                    <span className="w-32 truncate">{item.author}</span>
                    <span className="w-24 truncate">{item.displayDate}</span>
                    {item.duration_seconds && (
                        <span className="w-12 text-right">
                            {Math.floor(item.duration_seconds / 60)}m
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
