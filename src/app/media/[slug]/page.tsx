import { notFound, redirect } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { cache } from 'react';

export const revalidate = 3600;

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

const getLocalIndex = cache((filename: string): LocalVideoItem[] => {
    const filePath = path.join(process.cwd(), 'public', 'data', 'generated_indices', filename);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LocalVideoItem[];
});

export async function generateStaticParams() {
    const videosData = getLocalIndex('VIDEO_PROGRAMS_LIST.json');
    const fallbackVideos = getLocalIndex('MASTER_INDEX.json')
        .filter((video) => video.type === 'video-program' || video.type === 'sermon' || video.type === 'video');
    const seen = new Set<string>();

    return [...videosData, ...fallbackVideos]
        .filter((video) => {
            if (!video.folder || seen.has(video.folder)) return false;
            seen.add(video.folder);
            return true;
        })
        .map((video) => ({ slug: video.folder! }));
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
