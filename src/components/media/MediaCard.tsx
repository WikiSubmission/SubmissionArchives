import Image from 'next/image';

import quranStudyThumbnails from '@/data/quran_study_thumbnails.json';
import { QURAN_STUDY_SLIDES } from '@/data/quran-study-thumbnail-data';
import { getMediaAssetUrl, getPublicAssetUrl } from '@/lib/mediaAssets';
import { getMediaHref } from '@/lib/utils';
import PlayButton from '@/components/player/PlayButton';
import QuranStudyThumbnail from './QuranStudyThumbnail';
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

// Only offer inline playback when there is actually a source to play; a few records have
// no youtubeId and would otherwise render a button that does nothing.
function playableTrack(item: Media) {
    const url = item.youtubeId ? getMediaAssetUrl(item) : '';
    if (!url) return null;
    return { id: item.id, title: item.displayTitle, url, href: getMediaHref(item.id) };
}

// `priority` is set by the grid for the handful of cards above the fold: one of them is
// the LCP element, and Next warns when that image lazy-loads.
export function MediaCard({ item, priority = false }: { item: Media; priority?: boolean }) {
    const qsNumber = item.type === 'quran-study' ? getQuranStudyNumber(item) : null;
    const hasCssSlide = qsNumber !== null && Boolean(QURAN_STUDY_SLIDES[qsNumber]);
    const thumbnailSrc = getThumbnailSrc(item);
    const track = playableTrack(item);

    return (
        <article className="media-card-shell group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ed-rule-strong/40 dark:border-white/10 bg-ed-surface/90 dark:bg-ed-surface/50 p-3.5 backdrop-blur-2xl shadow-md dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-ed-rule-strong dark:hover:border-white/20 hover:bg-ed-surface dark:hover:bg-ed-surface/70 hover:shadow-lg dark:hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.5)]">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-ed-rule-strong/40 dark:border-white/10 bg-black/5 dark:bg-black/40">
                {hasCssSlide && qsNumber !== null ? (
                    <QuranStudyThumbnail qsNumber={qsNumber} />
                ) : (
                    <Image
                        src={thumbnailSrc}
                        alt=""
                        fill
                        priority={priority}
                        // 75 rather than 90: at the size these render, the two are visually
                        // indistinguishable, and 90 was costing bytes on every grid page.
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 480px"
                        className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                    />
                )}
                {track ? <PlayButton track={track} /> : null}
                {item.duration_seconds ? (
                    <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/15 bg-black/75 px-2.5 py-0.5 font-mono text-[0.68rem] font-medium tracking-wide tabular-nums text-white/90 backdrop-blur-xl shadow-sm">
                        {formatDuration(item.duration_seconds)}
                    </span>
                ) : null}
            </div>

            <div className="flex flex-1 flex-col pt-3.5 pb-1 px-1">
                <h3 className="line-clamp-2 font-sans text-base font-semibold leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>
                <p className="mt-2 line-clamp-1 font-mono text-xs font-medium text-ed-fg-muted">
                    {item.author}
                    {item.displayDate ? <><span aria-hidden="true" className="opacity-50"> · </span>{item.displayDate}</> : null}
                </p>
            </div>
        </article>
    );
}

export function MediaList({ item, priority = false }: { item: Media; priority?: boolean }) {
    const qsNumber = item.type === 'quran-study' ? getQuranStudyNumber(item) : null;
    const hasCssSlide = qsNumber !== null && Boolean(QURAN_STUDY_SLIDES[qsNumber]);
    const thumbnailSrc = getThumbnailSrc(item);
    const track = playableTrack(item);

    return (
        <article className="group relative grid gap-4 overflow-hidden rounded-3xl border border-ed-rule-strong/40 dark:border-white/10 bg-ed-surface/90 dark:bg-ed-surface/50 p-3.5 backdrop-blur-2xl shadow-md dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:border-ed-rule-strong dark:hover:border-white/20 hover:bg-ed-surface dark:hover:bg-ed-surface/70 hover:shadow-lg dark:hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.5)] sm:grid-cols-[13rem_1fr] sm:items-center">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-ed-rule-strong/40 dark:border-white/10 bg-black/5 dark:bg-black/40">
                {hasCssSlide && qsNumber !== null ? (
                    <QuranStudyThumbnail qsNumber={qsNumber} />
                ) : (
                    <Image
                        src={thumbnailSrc}
                        alt=""
                        fill
                        priority={priority}
                        // 75 rather than 90: at the size these render, the two are visually
                        // indistinguishable, and 90 was costing bytes on every grid page.
                        quality={75}
                        sizes="(max-width: 640px) 100vw, 360px"
                        className="object-cover transition-transform duration-500 motion-safe:group-hover:scale-[1.04]"
                    />
                )}
                {track ? <PlayButton track={track} /> : null}
                {item.duration_seconds ? (
                    <span className="absolute bottom-2.5 right-2.5 rounded-full border border-white/15 bg-black/75 px-2.5 py-0.5 font-mono text-[0.68rem] font-medium tracking-wide tabular-nums text-white/90 backdrop-blur-xl shadow-sm">
                        {formatDuration(item.duration_seconds)}
                    </span>
                ) : null}
            </div>

            <div className="min-w-0 pr-2 py-1">
                <h3 className="line-clamp-2 font-sans text-lg font-semibold leading-snug text-ed-fg transition-colors group-hover:text-ed-accent">
                    {item.displayTitle}
                </h3>
                <p className="mt-2 line-clamp-1 font-mono text-xs font-medium text-ed-fg-muted">
                    {item.author}
                    {item.displayDate ? <><span aria-hidden="true" className="opacity-50"> · </span>{item.displayDate}</> : null}
                </p>
            </div>
        </article>
    );
}
