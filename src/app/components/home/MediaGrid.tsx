import Link from "next/link";
import { Media, ThemeColors } from "@/types/media";
import { MediaCard, MediaList } from "./MediaCard";
import { getMediaHref } from "@/lib/utils";

interface MediaGridProps {
    media: Media[];
    theme: ThemeColors;
    viewMode: 'grid' | 'list';
}

export function MediaGrid({ media, theme, viewMode }: MediaGridProps) {
    if (viewMode === 'grid') {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {media.map((item) => (
                    <Link href={getMediaHref(item.id)} key={item.id} className="block">
                        <MediaCard item={item} theme={theme} />
                    </Link>
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y divide-border">
            {media.map((item) => (
                <Link
                    href={getMediaHref(item.id)}
                    key={item.id}
                    className="block py-2 first:pt-0 last:pb-0"
                >
                    <MediaList item={item} theme={theme} />
                </Link>
            ))}
        </div>
    );
}
