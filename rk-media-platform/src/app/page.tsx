import { listMediaFiles } from '@/lib/r2Bucket';
import HomePageClient from './HomePageClient';

import { STUDY_TITLES } from '@/lib/studyTitles';

export const revalidate = 0; // Disable cache to debug R2 listing

export default async function Home() {
    // Fetch media from R2 Bucket directly
    const media = await listMediaFiles();


    // Pass data to Client Component

    return <HomePageClient initialMedia={media || []} />;
}
