import { notFound, redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

type LocalVideoItem = {
    id: string;
    folder?: string;
    type?: string;
};

function getLocalIndex(filename: string): LocalVideoItem[] {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LocalVideoItem[];
}

export default async function LegacyMediaSlugPage({ params }: Props) {
    const { slug } = await params;
    const videosData = getLocalIndex('VIDEO_PROGRAMS_LIST.json');
    const fallbackVideos = getLocalIndex('MASTER_INDEX.json')
        .filter((video) => video.type === 'video-program' || video.type === 'sermon' || video.type === 'video');
    const videoInfo = [...videosData, ...fallbackVideos].find((video) => video.folder === slug);

    if (!videoInfo) {
        notFound();
    }

    redirect(`/media/${videoInfo.id}`);
}
