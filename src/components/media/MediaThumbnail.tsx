import Image from 'next/image';
import QuranStudyThumbnail from '@/components/media/QuranStudyThumbnail';
import { QURAN_STUDY_SLIDES } from '@/data/quran-study-thumbnail-data';
import { getPublicAssetUrl } from '@/lib/mediaAssets';

export type ThumbnailSource = {
    id: string;
    type: string;
    title?: string;
    displayTitle?: string;
    primaryNumber?: number;
    thumbnailOverride?: string;
};

// Fills its positioned parent. Quran Studies use their designed title slides; everything
// else uses its own thumbnail or a placeholder for its kind of record.
export default function MediaThumbnail({ media, sizes }: { media: ThumbnailSource; sizes: string }) {
    const qsNumber = getQuranStudyNumber(media);
    if (qsNumber !== null && QURAN_STUDY_SLIDES[qsNumber]) {
        return <QuranStudyThumbnail qsNumber={qsNumber} />;
    }
    return (
        <Image
            src={getThumbnailSrc(media)}
            alt=""
            fill
            unoptimized
            sizes={sizes}
            className={`object-cover transition duration-500 group-hover:scale-[1.04] ${media.type === 'perspective' ? 'object-right' : ''}`}
        />
    );
}

function getQuranStudyNumber(media: ThumbnailSource): number | null {
    if (media.type !== 'quran-study') return null;
    if (typeof media.primaryNumber === 'number' && Number.isFinite(media.primaryNumber)) return media.primaryNumber;
    const idMatch = media.id.match(/^quran-study\/(\d+)/i);
    if (idMatch) return Number(idMatch[1]);
    const titleMatch = (media.displayTitle ?? media.title ?? '').match(/^(?:QS\s*)?(\d{1,3})\b/i);
    return titleMatch ? Number(titleMatch[1]) : null;
}

function getThumbnailSrc(media: ThumbnailSource) {
    if (media.thumbnailOverride) return getPublicAssetUrl(media.thumbnailOverride);
    if (media.type === 'audio' || media.type === 'messenger-audio') {
        return getPublicAssetUrl('/content/audios/messenger-audios/default.jpg');
    }
    if (media.type === 'perspective') return '/images/placeholders/newsletter.png';
    if (media.type === 'appendix') return '/images/placeholders/appendix.png';
    return '/images/placeholders/rashad-khalifa.png';
}
