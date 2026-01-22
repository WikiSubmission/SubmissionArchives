import Link from "next/link";
import { Media, ThemeColors } from "@/types/media";
import { MediaCard, MediaList } from "./MediaCard";

interface MediaGridProps {
    media: Media[];
    theme: ThemeColors;
    viewMode: 'grid' | 'list';
}

export function MediaGrid({ media, theme, viewMode }: MediaGridProps) {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map((item) => (
                    <Link href={`/media/${encodeURIComponent(item.id)}`} key={item.id} className="block h-full">
                        <MediaCard item={item} theme={theme} />
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {media.map((item) => (
                <Link href={`/media/${encodeURIComponent(item.id)}`} key={item.id} className="block">
                    <MediaList item={item} theme={theme} />
                </Link>
            ))}
        </div>
    );
}
