import { Media, ThemeColors } from "@/types/media";
import { BookOpen, FileText, Headphones, Video, User, Clock, ArrowRight } from "lucide-react";
import thumbnailMapping from "@/data/thumbnail_mapping.json";

interface MediaCardProps {
    item: Media;
    theme: ThemeColors;
}

export function MediaCard({ item, theme }: MediaCardProps) {
    // Determine icon based on content type
    const Icon = item.type === 'sermon' ? Video :
        item.type === 'quran-study' ? BookOpen :
            item.type === 'video-program' ? Video :
                (item.type.includes('audio') || item.type === 'messenger-audio') ? Headphones :
                    FileText;

    const typeLabel = item.type === 'messenger-audio' ? 'Audio' :
        item.type === 'video-program' ? 'Video Program' :
            item.type.replace('-', ' ');

    // Color coding for different content types
    const badgeColors = item.type === 'quran-study'
        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
        : item.type === 'sermon'
            ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : item.type === 'video-program'
                ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300'
                : (item.type.includes('audio') || item.type === 'messenger-audio')
                    ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                    : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300';

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
            if (num === 52) {
                thumbnailSrc = `/images/quran-studies/QS${num}.png`;
            } else if (num >= 1 && num <= 51) {
                thumbnailSrc = `/images/quran-studies/QS${num}.jpg`;
            }
        }
    }

    return (
        <div className={`h-full border ${theme.border} rounded-lg ${theme.card} overflow-hidden ${theme.borderHover} transition-all duration-300 flex flex-col relative group cursor-pointer shadow-sm hover:shadow-lg`}>
            {/* Thumbnail Image */}
            <div className="relative w-full aspect-video bg-black/5 dark:bg-black/20 overflow-hidden">
                <img
                    src={thumbnailSrc}
                    alt={item.displayTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.currentTarget.src = '/images/placeholders/rashad-khalifa.png';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="p-6 flex flex-col flex-1">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-md border ${badgeColors}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-mono uppercase tracking-wider">
                                {typeLabel}
                            </span>
                        </div>
                    </div>

                    <h3
                        className={`text-xl font-mono ${theme.text} leading-tight mb-3 line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-semibold`}
                    >
                        {item.displayTitle}
                    </h3>
                </div>

                <div className={`relative z-10 pt-4 mt-auto border-t ${theme.border} flex items-center justify-between text-xs ${theme.textVeryMuted} font-mono`}>
                    <span className="flex items-center gap-2 line-clamp-1">
                        <User className="w-3.5 h-3.5 flex-shrink-0" />
                        {item.author}
                    </span>
                    <span className="flex items-center gap-3 flex-shrink-0">
                        {item.duration_seconds && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                {Math.floor(item.duration_seconds / 60)}m
                            </span>
                        )}
                    </span>
                </div>
            </div>
        </div>
    );
}

export function MediaList({ item, theme }: MediaCardProps) {
    // Determine icon based on content type
    const Icon = item.type === 'sermon' ? Video :
        item.type === 'quran-study' ? BookOpen :
            item.type === 'video-program' ? Video :
                (item.type.includes('audio') || item.type === 'messenger-audio') ? Headphones :
                    FileText;

    const typeLabel = item.type === 'messenger-audio' ? 'Audio' :
        item.type === 'video-program' ? 'Video Program' :
            item.type.replace('-', ' ');

    // Color coding for different content types
    const iconColor = item.type === 'quran-study'
        ? 'text-blue-700 dark:text-blue-300'
        : item.type === 'sermon'
            ? 'text-red-700 dark:text-red-300'
            : item.type === 'video-program'
                ? 'text-orange-700 dark:text-orange-300'
                : (item.type.includes('audio') || item.type === 'messenger-audio')
                    ? 'text-purple-700 dark:text-purple-300'
                    : theme.textVeryMuted;

    return (
        <div className={`${theme.card} border ${theme.border} ${theme.borderHover} transition-all duration-200 group cursor-pointer rounded-lg shadow-sm hover:shadow-lg`}>
            <div className="px-6 py-4 flex items-center gap-6">
                <div className="flex items-center gap-3 w-32 flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                    <span className={`text-[10px] font-mono uppercase tracking-wider truncate ${iconColor}`}>
                        {typeLabel}
                    </span>
                </div>

                <h3
                    className={`flex-1 text-base font-mono ${theme.text} group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-semibold truncate`}
                >
                    {item.displayTitle}
                </h3>

                <div className={`hidden sm:flex items-center gap-6 text-[10px] font-mono ${theme.textVeryMuted}`}>
                    <span className="w-32 truncate">{item.author}</span>
                    <span className="w-24 truncate">{item.displayDate}</span>
                    {item.duration_seconds && (
                        <span className="w-12 text-right">{Math.floor(item.duration_seconds / 60)}m</span>
                    )}
                </div>

                <ArrowRight className={`w-4 h-4 ${theme.textVeryMuted} group-hover:text-amber-500 group-hover:translate-x-1 transition-all flex-shrink-0 ml-auto sm:ml-0`} />
            </div>
        </div>
    );
}
