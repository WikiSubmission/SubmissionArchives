import { notFound, redirect } from 'next/navigation';
import videosData from '../../../../public/data/generated_indices/VIDEO_PROGRAMS_LIST.json';

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

export default async function LegacyMediaSlugPage({ params }: Props) {
    const { slug } = await params;
    const videoInfo = videosData.find((video) => video.folder === slug);

    if (!videoInfo) {
        notFound();
    }

    redirect(`/media/${videoInfo.id}`);
}
